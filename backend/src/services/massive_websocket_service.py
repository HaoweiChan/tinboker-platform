"""
Massive API WebSocket service for real-time stock data streaming.

This module provides WebSocket connectivity for:
- Real-time equity trades (15-minute delayed for Starter plan)
- Quote updates
- Aggregate bars (minute/second)
- Subscription management
"""

import logging
import asyncio
from typing import Optional, List, Callable, Dict, Any
from massive import WebSocketClient
from massive.websocket import EquityTrade, EquityQuote
from src.config import settings

logger = logging.getLogger(__name__)


class MassiveWebSocketError(Exception):
    """Custom exception for WebSocket errors."""
    pass


class MassiveWebSocketService:
    """
    Service wrapper for Massive WebSocket API.
    
    Provides real-time streaming of market data with 15-minute delay
    for Starter plan subscribers.
    """
    
    def __init__(self, api_key: Optional[str] = None, use_delayed: bool = True):
        """
        Initialize Massive WebSocket service.
        
        Args:
            api_key: Massive API key. If None, reads from MASSIVE_API_KEY env var
            use_delayed: If True, use delayed endpoint (wss://delayed.massive.com/stocks)
                        for Starter plan. If False, use realtime endpoint (wss://socket.massive.com/stocks)
        """
        self.api_key = api_key or settings.massive_api_key
        if not self.api_key:
            logger.warning("Massive API key not configured. WebSocket will fail.")
            self.client = None
        else:
            try:
                # Use delayed endpoint for Starter plan (15-min delay)
                # Realtime endpoint: socket.massive.com (premium plans)
                # Delayed endpoint: delayed.massive.com (starter plan)
                feed = "delayed.massive.com" if use_delayed else "socket.massive.com"
                
                self.client = WebSocketClient(
                    api_key=self.api_key,
                    feed=feed,
                    verbose=True,
                    secure=True  # Use wss:// (secure WebSocket)
                )
                logger.info(f"Massive WebSocket client initialized (feed: {feed})")
            except Exception as e:
                logger.error(f"Failed to initialize Massive WebSocket client: {e}")
                self.client = None
        
        self._connected = False
        self._subscriptions = set()
        self._callback = None
        self._reconnect_attempts = 0
        self._max_reconnect_attempts = 5
        self._reconnect_delay = 5  # seconds
        self._connection_task = None
    
    def _check_client(self) -> None:
        """Check if client is initialized."""
        if self.client is None:
            raise MassiveWebSocketError(
                "Massive WebSocket client not initialized. Check API key configuration."
            )
    
    async def connect(self, callback: Callable[[Any], None]) -> None:
        """
        Connect to Massive WebSocket feed.
        
        Note: connect() starts a long-running background task. The connection
        is established asynchronously. Check is_connected after a short delay.
        
        Args:
            callback: Function to call when messages are received
            
        Raises:
            MassiveWebSocketError: If connection fails
        """
        try:
            self._check_client()
            self._callback = callback
            
            # Start connection as background task (connect() is long-running)
            # Based on Massive API example: asyncio.create_task(c.connect(callback))
            connection_task = asyncio.create_task(self.client.connect(callback))
            
            # Wait a moment for connection to establish
            await asyncio.sleep(2)
            
            # Check if connection was successful (client should be connected by now)
            # If task raised an exception, it will be caught below
            if connection_task.done():
                try:
                    await connection_task
                except Exception as task_error:
                    raise MassiveWebSocketError(f"WebSocket connection failed: {task_error}")
            
            self._connected = True
            self._reconnect_attempts = 0
            self._connection_task = connection_task
            logger.info("Connected to Massive WebSocket feed")
            
        except Exception as e:
            logger.error(f"Failed to connect to WebSocket: {e}")
            self._connected = False
            raise MassiveWebSocketError(f"WebSocket connection failed: {e}")
    
    async def reconnect(self) -> bool:
        """
        Attempt to reconnect to WebSocket feed.
        
        Returns:
            True if reconnection successful, False otherwise
        """
        if self._reconnect_attempts >= self._max_reconnect_attempts:
            logger.error(
                f"Max reconnection attempts ({self._max_reconnect_attempts}) reached"
            )
            return False
        
        self._reconnect_attempts += 1
        logger.info(
            f"Attempting reconnection ({self._reconnect_attempts}/"
            f"{self._max_reconnect_attempts})..."
        )
        
        try:
            await asyncio.sleep(self._reconnect_delay)
            
            if self._callback:
                await self.connect(self._callback)
                
                # Re-subscribe to previous subscriptions
                if self._subscriptions:
                    logger.info(f"Re-subscribing to {len(self._subscriptions)} channels")
                    for sub in self._subscriptions:
                        self.client.subscribe(sub)
                
                return True
        except Exception as e:
            logger.error(f"Reconnection attempt failed: {e}")
            return False
    
    def subscribe(self, tickers: List[str], event_type: str = "T") -> None:
        """
        Subscribe to real-time data for tickers.
        
        Args:
            tickers: List of ticker symbols (e.g., ["AAPL", "TSLA"])
            event_type: Event type - "T" for trades, "Q" for quotes, "A" for aggregates
            
        Note:
            - Starter plan has 15-minute delay
            - Use "T.TICKER" format for trades (e.g., "T.AAPL")
            - Use "Q.TICKER" for quotes (e.g., "Q.AAPL")
            - Use "A.TICKER" for minute aggregates (e.g., "A.AAPL")
        """
        self._check_client()
        
        for ticker in tickers:
            subscription = f"{event_type}.{ticker}"
            self.client.subscribe(subscription)
            self._subscriptions.add(subscription)
            logger.info(f"Subscribed to {subscription}")
    
    def subscribe_all_trades(self) -> None:
        """Subscribe to all trades using wildcard."""
        self._check_client()
        subscription = "T.*"
        self.client.subscribe(subscription)
        self._subscriptions.add(subscription)
        logger.info("Subscribed to all trades (T.*)")
    
    def unsubscribe(self, tickers: List[str], event_type: str = "T") -> None:
        """
        Unsubscribe from tickers.
        
        Args:
            tickers: List of ticker symbols
            event_type: Event type (T/Q/A)
        """
        self._check_client()
        
        for ticker in tickers:
            subscription = f"{event_type}.{ticker}"
            self.client.unsubscribe(subscription)
            self._subscriptions.discard(subscription)
            logger.info(f"Unsubscribed from {subscription}")
    
    def unsubscribe_all(self) -> None:
        """Unsubscribe from all channels."""
        self._check_client()
        self.client.unsubscribe_all()
        self._subscriptions.clear()
        logger.info("Unsubscribed from all channels")
    
    async def close(self) -> None:
        """Close WebSocket connection."""
        if self.client and self._connected:
            try:
                await self.client.close()
            except Exception as e:
                logger.warning(f"Error closing WebSocket: {e}")
            
            # Cancel connection task if still running
            if self._connection_task and not self._connection_task.done():
                self._connection_task.cancel()
                try:
                    await self._connection_task
                except asyncio.CancelledError:
                    pass
            
            self._connected = False
            self._subscriptions.clear()
            self._connection_task = None
            logger.info("WebSocket connection closed")
    
    @property
    def is_connected(self) -> bool:
        """Check if WebSocket is connected."""
        return self._connected
    
    @property
    def subscriptions(self) -> set:
        """Get current subscriptions."""
        return self._subscriptions.copy()
    
    def get_subscription_count(self) -> int:
        """Get number of active subscriptions."""
        return len(self._subscriptions)


# Helper functions for processing WebSocket messages

def process_equity_trade(trade: EquityTrade) -> Dict[str, Any]:
    """
    Process equity trade message into dict format.
    
    Args:
        trade: EquityTrade object from WebSocket
        
    Returns:
        Dict with trade details
    """
    return {
        "event_type": "trade",
        "symbol": trade.symbol,
        "price": trade.price,
        "size": trade.size,
        "timestamp": trade.timestamp,
        "exchange": trade.exchange,
        "conditions": trade.conditions,
        "tape": trade.tape,
        "id": trade.id,
        "sequence_number": getattr(trade, 'sequence_number', None),
    }


def process_equity_quote(quote: EquityQuote) -> Dict[str, Any]:
    """
    Process equity quote message into dict format.
    
    Args:
        quote: EquityQuote object from WebSocket
        
    Returns:
        Dict with quote details
    """
    return {
        "event_type": "quote",
        "symbol": quote.symbol,
        "bid_price": quote.bid_price,
        "bid_size": quote.bid_size,
        "ask_price": quote.ask_price,
        "ask_size": quote.ask_size,
        "timestamp": quote.timestamp,
        "exchange": quote.exchange,
    }

