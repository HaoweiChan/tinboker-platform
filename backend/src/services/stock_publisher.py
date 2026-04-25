"""
Service for publishing stock updates to Redis channels using Massive WebSocket
"""
import asyncio
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from src.cache.redis_client import RedisClient
from src.cache.channels import stock_ohlcv_channel, stock_price_channel
from src.services.massive_websocket_service import (
    MassiveWebSocketService,
    process_equity_trade
)
from src.services.massive_service import MassiveAPIService

logger = logging.getLogger(__name__)

class StockPublisher:
    """Publishes stock updates to Redis channels using Massive WebSocket"""
    
    def __init__(self):
        self.websocket_service: Optional[MassiveWebSocketService] = None
        self.massive_api_service = MassiveAPIService()
        self._running = False
        self._monitored_tickers: set = set()
        self._last_prices: Dict[str, float] = {}  # Track last prices for change calculation
        self._previous_closes: Dict[str, float] = {}  # Track previous close for change calculation
        self._message_queue: Optional[asyncio.Queue] = None
        self._message_processor_task: Optional[asyncio.Task] = None
    
    async def initialize(self) -> bool:
        """Initialize WebSocket service"""
        try:
            # Initialize message queue first
            self._message_queue = asyncio.Queue()
            
            self.websocket_service = MassiveWebSocketService(use_delayed=True)
            
            # Set up callback for processing messages
            # Note: Massive WebSocket callback is synchronous, so we use a queue-based approach
            def message_callback(message):
                # Put message in queue for async processing
                try:
                    if self._message_queue:
                        self._message_queue.put_nowait(message)
                except Exception as e:
                    logger.error(f"Error queuing message: {e}")
            
            # Connect to WebSocket first
            await self.websocket_service.connect(message_callback)
            
            # Start message processing task after connection is established
            self._message_processor_task = asyncio.create_task(self._process_message_queue())
            
            # Wait a bit for connection to establish
            await asyncio.sleep(2)
            
            if not self.websocket_service.is_connected:
                logger.error("Failed to connect to Massive WebSocket")
                return False
            
            logger.info("Stock publisher initialized and connected to Massive WebSocket")
            return True
            
        except Exception as e:
            logger.error(f"Error initializing stock publisher: {e}")
            return False
    
    async def _process_message_queue(self):
        """Process messages from the queue"""
        while self._running:
            try:
                # Wait for message with timeout
                message = await asyncio.wait_for(self._message_queue.get(), timeout=1.0)
                await self._process_websocket_message(message)
            except asyncio.TimeoutError:
                # Timeout is expected - continue loop
                continue
            except Exception as e:
                logger.error(f"Error in message queue processor: {e}", exc_info=True)
    
    async def _process_websocket_message(self, message: Any):
        """
        Process incoming WebSocket message from Massive API.
        
        Args:
            message: Message object from Massive WebSocket (EquityTrade, EquityQuote, AggregateBar, or list)
        """
        try:
            # Messages can come as lists (aggregate bars) or individual objects
            messages_to_process = []
            
            if isinstance(message, list):
                # Handle list of messages
                messages_to_process = message
            else:
                messages_to_process = [message]
            
            for msg in messages_to_process:
                await self._process_single_message(msg)
                
        except Exception as e:
            logger.error(f"Error processing WebSocket message: {e}", exc_info=True)
    
    async def _process_single_message(self, message: Any):
        """Process a single message from Massive WebSocket"""
        try:
            from massive.websocket import EquityTrade, EquityAgg
            
            ticker = None
            open_price = None
            high = None
            low = None
            close = None
            volume = 0
            timestamp = 0
            
            # Handle EquityAgg object (aggregate bars)
            if isinstance(message, EquityAgg):
                # Process aggregate bar
                ticker = message.symbol
                close = message.close  # Use close as current price
                timestamp = getattr(message, 'end_timestamp', 0)
                volume = getattr(message, 'accumulated_volume', 0)
                open_price = message.open
                high = message.high
                low = message.low
            # Handle raw JSON dict (aggregate bars can also come as dicts)
            elif isinstance(message, dict):
                ev = message.get("ev", "")
                # Aggregate bar message (ev="A")
                if ev == "A":
                    # Process aggregate bar from JSON dict
                    ticker = message.get("sym", "")
                    close = message.get("c", 0)  # close price
                    timestamp = message.get("e", message.get("s", 0))  # end timestamp or start
                    volume = message.get("v", 0)  # volume
                    open_price = message.get("o", close)
                    high = message.get("h", close)
                    low = message.get("l", close)
            
            # Process aggregate bar data
            if ticker and close:
                
                # Calculate change and changePercent
                change = 0.0
                change_percent = 0.0
                
                # Get previous close if available
                if ticker not in self._previous_closes:
                    snapshot = self.massive_api_service.get_ticker_snapshot(ticker)
                    if snapshot:
                        self._previous_closes[ticker] = snapshot.get('close', close)
                
                previous_close = self._previous_closes.get(ticker, close)
                if previous_close and previous_close > 0:
                    change = close - previous_close
                    change_percent = (change / previous_close) * 100
                
                # Update last price and previous close
                self._last_prices[ticker] = close
                self._previous_closes[ticker] = close
                
                # Determine market status
                market_status = self._get_market_status()
                
                # Prepare OHLCV update
                ohlcv_data = {
                    "type": "price_update",
                    "data": {
                        "ticker": ticker.upper(),
                        "price": close,
                        "change": change,
                        "changePercent": change_percent,
                        "volume": volume,
                        "timestamp": timestamp,
                        "marketStatus": market_status,
                        "open": open_price,
                        "high": high,
                        "low": low,
                        "close": close,
                        "previousClose": previous_close,
                    }
                }
                
                # Publish to OHLCV channel
                channel = stock_ohlcv_channel(ticker)
                subscribers = await RedisClient.publish_message(channel, ohlcv_data)
                
                if subscribers > 0:
                    logger.debug(f"Published {ticker} aggregate update to {subscribers} subscribers")
                
                # Also publish price-only update
                price_data = {
                    "type": "price_update",
                    "data": {
                        "ticker": ticker.upper(),
                        "price": close,
                        "change": change,
                        "changePercent": change_percent,
                        "timestamp": timestamp,
                        "marketStatus": market_status,
                    }
                }
                price_channel = stock_price_channel(ticker)
                await RedisClient.publish_message(price_channel, price_data)
                
            # Check if it's an EquityTrade object
            elif isinstance(message, EquityTrade):
                # This is an EquityTrade
                trade_data = process_equity_trade(message)
                ticker = trade_data['symbol']
                price = trade_data['price']
                timestamp = trade_data['timestamp']
                volume = trade_data.get('size', 0)
                
                # Calculate change and changePercent
                change = 0.0
                change_percent = 0.0
                
                # Get previous close if available
                if ticker not in self._previous_closes:
                    # Try to get from API snapshot
                    snapshot = self.massive_api_service.get_ticker_snapshot(ticker)
                    if snapshot:
                        self._previous_closes[ticker] = snapshot.get('close', price)
                
                previous_close = self._previous_closes.get(ticker, price)
                if previous_close and previous_close > 0:
                    change = price - previous_close
                    change_percent = (change / previous_close) * 100
                
                # Update last price
                self._last_prices[ticker] = price
                
                # Determine market status (simplified - could be enhanced)
                market_status = self._get_market_status()
                
                # Prepare OHLCV update
                ohlcv_data = {
                    "type": "price_update",
                    "data": {
                        "ticker": ticker.upper(),
                        "price": price,
                        "change": change,
                        "changePercent": change_percent,
                        "volume": volume,
                        "timestamp": timestamp,
                        "marketStatus": market_status,
                        # OHLCV data (using current price as all values for simplicity)
                        "open": price,
                        "high": price,
                        "low": price,
                        "close": price,
                        "previousClose": previous_close,
                    }
                }
                
                # Publish to OHLCV channel
                channel = stock_ohlcv_channel(ticker)
                subscribers = await RedisClient.publish_message(channel, ohlcv_data)
                
                if subscribers > 0:
                    logger.debug(f"Published {ticker} update to {subscribers} subscribers")
                
                # Also publish price-only update
                price_data = {
                    "type": "price_update",
                    "data": {
                        "ticker": ticker.upper(),
                        "price": price,
                        "change": change,
                        "changePercent": change_percent,
                        "timestamp": timestamp,
                        "marketStatus": market_status,
                    }
                }
                price_channel = stock_price_channel(ticker)
                await RedisClient.publish_message(price_channel, price_data)
            else:
                # Unknown message type - log for debugging
                logger.debug(f"Received unknown message type: {type(message)}")
                
        except Exception as e:
            logger.error(f"Error processing single message: {e}", exc_info=True)
    
    def _get_market_status(self) -> str:
        """
        Determine current market status.
        Simplified implementation - could be enhanced with actual market hours.
        """
        now = datetime.now()
        hour = now.hour
        
        # US market hours (ET): 9:30 AM - 4:00 PM
        # Pre-market: 4:00 AM - 9:30 AM
        # After-hours: 4:00 PM - 8:00 PM
        
        # Simplified: assume market is open during business hours
        # In production, this should check actual market hours and holidays
        if 9 <= hour < 16:
            return "open"
        elif 4 <= hour < 9:
            return "pre-market"
        elif 16 <= hour < 20:
            return "after-hours"
        else:
            return "closed"
    
    async def add_ticker(self, ticker: str) -> bool:
        """
        Add a ticker to monitor and subscribe to updates.
        
        Args:
            ticker: Stock ticker symbol
            
        Returns:
            True if added successfully
        """
        try:
            if not self.websocket_service or not self.websocket_service.is_connected:
                logger.error("WebSocket service not connected")
                return False
            
            ticker_upper = ticker.upper()
            
            # Get initial snapshot to set previous close
            snapshot = self.massive_api_service.get_ticker_snapshot(ticker_upper)
            if snapshot:
                self._previous_closes[ticker_upper] = snapshot.get('close', snapshot.get('price', 0))
                self._last_prices[ticker_upper] = snapshot.get('price', snapshot.get('close', 0))
            
            # Subscribe to aggregates (minute bars) for this ticker
            # Note: Starter plan supports aggregates (A.*) but may not support trades (T.*)
            self.websocket_service.subscribe([ticker_upper], event_type="A")
            self._monitored_tickers.add(ticker_upper)
            
            logger.info(f"Added ticker {ticker_upper} to monitoring")
            return True
            
        except Exception as e:
            logger.error(f"Error adding ticker {ticker}: {e}")
            return False
    
    async def remove_ticker(self, ticker: str) -> bool:
        """
        Remove a ticker from monitoring.
        
        Args:
            ticker: Stock ticker symbol
            
        Returns:
            True if removed successfully
        """
        try:
            if not self.websocket_service:
                return False
            
            ticker_upper = ticker.upper()
            self.websocket_service.unsubscribe([ticker_upper], event_type="A")
            self._monitored_tickers.discard(ticker_upper)
            self._last_prices.pop(ticker_upper, None)
            self._previous_closes.pop(ticker_upper, None)
            
            logger.info(f"Removed ticker {ticker_upper} from monitoring")
            return True
            
        except Exception as e:
            logger.error(f"Error removing ticker {ticker}: {e}")
            return False
    
    async def start_publishing(self, tickers: List[str]):
        """
        Start publishing updates for multiple tickers.
        
        Args:
            tickers: List of ticker symbols to monitor
        """
        if self._running:
            logger.warning("Publisher is already running")
            return
        
        self._running = True
        
        # Initialize WebSocket connection
        if not await self.initialize():
            logger.error("Failed to initialize publisher")
            self._running = False
            return
        
        # Add all tickers
        for ticker in tickers:
            await self.add_ticker(ticker)
        
        logger.info(f"Stock publisher started for {len(tickers)} tickers")
    
    async def stop(self):
        """Stop publishing and cleanup"""
        self._running = False
        
        # Cancel message processor task
        if hasattr(self, '_message_processor_task'):
            self._message_processor_task.cancel()
            try:
                await self._message_processor_task
            except asyncio.CancelledError:
                pass
        
        if self.websocket_service:
            try:
                await self.websocket_service.close()
            except Exception as e:
                logger.error(f"Error closing WebSocket: {e}")
        
        self._monitored_tickers.clear()
        self._last_prices.clear()
        self._previous_closes.clear()
        logger.info("Stock publisher stopped")

