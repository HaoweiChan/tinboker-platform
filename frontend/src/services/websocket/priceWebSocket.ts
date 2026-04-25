/**
 * WebSocket Client for Real-Time Stock Price Updates
 * 
 * Manages WebSocket connection to backend for real-time price updates.
 * Handles connection lifecycle, subscriptions, reconnection, and heartbeat.
 */

import type {
  RealTimePriceUpdate,
  SubscribeMessage,
  UnsubscribeMessage,
  HeartbeatMessage,
  PriceUpdateMessage,
  WebSocketMessage,
} from '../types';

type PriceUpdateCallback = (update: RealTimePriceUpdate) => void;
type ConnectionChangeCallback = (connected: boolean) => void;

/**
 * Get WebSocket URL based on environment and hostname
 * Mirrors the API client URL selection logic
 */
const getWebSocketURL = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  let baseURL: string;

  if (envUrl) {
    baseURL = envUrl;
  } else if (!import.meta.env.PROD) {
    // Development: use local backend
    baseURL = 'http://localhost:3000';
  } else if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Production domains
    if (hostname === 'tinboker.com' || hostname === 'www.tinboker.com') {
      baseURL = 'https://api.tinboker.com';
    // Dev domain
    } else if (hostname === 'dev.tinboker.com') {
      baseURL = 'https://dev-api.tinboker.com';
    // Staging domain
    } else if (hostname === 'staging.tinboker.com') {
      baseURL = 'https://staging-api.tinboker.com';
    // Preview deployments or unknown - use dev API
    } else {
      baseURL = 'https://dev-api.tinboker.com';
    }
  } else {
    // SSR or unknown - use dev API
    baseURL = 'https://dev-api.tinboker.com';
  }

  // Convert http:// to ws:// and https:// to wss://
  const wsURL = baseURL.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
  return `${wsURL}/ws/prices`;
};

export class PriceWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private subscribedTickers: Set<string> = new Set();
  private priceUpdateCallbacks: Set<PriceUpdateCallback> = new Set();
  private connectionChangeCallbacks: Set<ConnectionChangeCallback> = new Set();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = Infinity;
  private reconnectDelay: number = 1000; // Start with 1 second
  private maxReconnectDelay: number = 30000; // Max 30 seconds
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatInterval: number = 30000; // 30 seconds
  private pongTimeout: ReturnType<typeof setTimeout> | null = null;
  private pongTimeoutDuration: number = 5000; // 5 seconds
  private isIntentionallyDisconnected: boolean = false;

  constructor() {
    this.url = getWebSocketURL();
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      if (import.meta.env.DEV) {
        console.log('[WebSocket] Already connected');
      }
      return;
    }

    if (this.ws?.readyState === WebSocket.CONNECTING) {
      if (import.meta.env.DEV) {
        console.log('[WebSocket] Connection already in progress');
      }
      return;
    }

    this.isIntentionallyDisconnected = false;
    
    if (import.meta.env.DEV) {
      console.log('[WebSocket] Connecting to', this.url);
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        if (import.meta.env.DEV) {
          console.log('[WebSocket] Connected');
        }
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.notifyConnectionChange(true);
        this.startHeartbeat();
        
        // Resubscribe to all previously subscribed tickers
        if (this.subscribedTickers.size > 0) {
          this.subscribe(Array.from(this.subscribedTickers));
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };

      this.ws.onclose = (event) => {
        if (import.meta.env.DEV) {
          console.log('[WebSocket] Closed', { code: event.code, reason: event.reason });
        }
        this.stopHeartbeat();
        this.notifyConnectionChange(false);
        
        // Attempt reconnection unless intentionally disconnected
        if (!this.isIntentionallyDisconnected && !event.wasClean) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      console.error('[WebSocket] Failed to create connection:', error);
      this.notifyConnectionChange(false);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isIntentionallyDisconnected = true;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.notifyConnectionChange(false);
  }

  /**
   * Subscribe to price updates for tickers
   */
  subscribe(tickers: string[]): void {
    if (tickers.length === 0) return;

    // Add to subscribed set
    tickers.forEach(ticker => this.subscribedTickers.add(ticker.toUpperCase()));

    // Send subscription message if connected
    if (this.isConnected()) {
      const message: SubscribeMessage = {
        type: 'subscribe',
        tickers: tickers.map(t => t.toUpperCase()),
      };
      this.send(message);
    } else {
      // Connect if not connected
      this.connect();
    }
  }

  /**
   * Unsubscribe from price updates for tickers
   */
  unsubscribe(tickers: string[]): void {
    if (tickers.length === 0) return;

    // Remove from subscribed set
    tickers.forEach(ticker => this.subscribedTickers.delete(ticker.toUpperCase()));

    // Send unsubscription message if connected
    if (this.isConnected()) {
      const message: UnsubscribeMessage = {
        type: 'unsubscribe',
        tickers: tickers.map(t => t.toUpperCase()),
      };
      this.send(message);
    }
  }

  /**
   * Register callback for price updates
   */
  onPriceUpdate(callback: PriceUpdateCallback): () => void {
    this.priceUpdateCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.priceUpdateCallbacks.delete(callback);
    };
  }

  /**
   * Register callback for connection status changes
   */
  onConnectionChange(callback: ConnectionChangeCallback): () => void {
    this.connectionChangeCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.connectionChangeCallbacks.delete(callback);
    };
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Send message to server
   */
  private send(message: WebSocketMessage): void {
    if (!this.isConnected()) {
      console.warn('[WebSocket] Cannot send message, not connected:', message);
      return;
    }

    try {
      this.ws!.send(JSON.stringify(message));
    } catch (error) {
      console.error('[WebSocket] Failed to send message:', error);
    }
  }

  /**
   * Handle incoming messages from server
   */
  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'price_update':
        // Handle both wrapped format { type: 'price_update', data: {...} } 
        // and direct format { type: 'price_update', ticker: '...', price: ... }
        if ('data' in message && (message as PriceUpdateMessage).data) {
          // Wrapped format
          this.notifyPriceUpdate((message as PriceUpdateMessage).data);
        } else if ('ticker' in message && 'price' in message) {
          // Direct format - treat the message itself as the update
          this.notifyPriceUpdate(message as unknown as RealTimePriceUpdate);
        }
        break;
      
      case 'subscribed':
        if (import.meta.env.DEV) {
          console.log('[WebSocket] Subscribed to:', message.tickers);
        }
        break;
      
      case 'error':
        console.error('[WebSocket] Server error:', message.code, message.message);
        break;
      
      case 'pong':
        // Clear pong timeout
        if (this.pongTimeout) {
          clearTimeout(this.pongTimeout);
          this.pongTimeout = null;
        }
        break;
      
      default:
        if (import.meta.env.DEV) {
          console.log('[WebSocket] Unknown message type:', message);
        }
    }
  }

  /**
   * Notify all price update callbacks
   */
  private notifyPriceUpdate(update: RealTimePriceUpdate): void {
    this.priceUpdateCallbacks.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('[WebSocket] Error in price update callback:', error);
      }
    });
  }

  /**
   * Notify all connection change callbacks
   */
  private notifyConnectionChange(connected: boolean): void {
    this.connectionChangeCallbacks.forEach(callback => {
      try {
        callback(connected);
      } catch (error) {
        console.error('[WebSocket] Error in connection change callback:', error);
      }
    });
  }

  /**
   * Start heartbeat mechanism (ping every 30s)
   */
  private startHeartbeat(): void {
    this.stopHeartbeat(); // Clear any existing heartbeat
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        const message: HeartbeatMessage = { type: 'ping' };
        this.send(message);
        
        // Set timeout for pong response
        this.pongTimeout = setTimeout(() => {
          console.warn('[WebSocket] Pong timeout, reconnecting...');
          this.ws?.close();
        }, this.pongTimeoutDuration);
      }
    }, this.heartbeatInterval);
  }

  /**
   * Stop heartbeat mechanism
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.isIntentionallyDisconnected) {
      return;
    }

    if (this.reconnectTimer) {
      return; // Already scheduled
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay, this.maxReconnectDelay);
    this.reconnectDelay *= 2; // Exponential backoff

    if (import.meta.env.DEV) {
      console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
}

// Export singleton instance
export const priceWebSocketClient = new PriceWebSocketClient();

