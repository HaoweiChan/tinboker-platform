"""
FinMind API WebSocket service for real-time stock data streaming.

Since FinMind subscription plan doesn't include WebSocket, this module
implements polling-based "WebSocket" simulation that polls the REST API
every 5 seconds to provide real-time-like updates.
"""

import logging
import asyncio
from typing import Optional, List, Callable, Dict, Any
from datetime import datetime
from src.services.finmind_service import FinMindAPIService

logger = logging.getLogger(__name__)


class FinMindWebSocketError(Exception):
    """Custom exception for WebSocket errors."""
    pass


class FinMindWebSocketService:
    """
    Service wrapper for FinMind "WebSocket" API using polling.
    
    Since real WebSocket is not available, this polls the REST API
    every 5 seconds to simulate real-time updates.
    """
    
    def __init__(self, api_key: Optional[str] = None, poll_interval: int = 5):
        """
        Initialize FinMind WebSocket service.
        
        Args:
            api_key: FinMind API key. If None, reads from FINMIND_API_KEY env var
            poll_interval: Polling interval in seconds (default: 5)
        """
        self.finmind_service = FinMindAPIService(api_key=api_key)
        self.poll_interval = poll_interval
        
        self._connected = False
        self._subscriptions = set()  # Set of tickers being polled
        self._callback = None
        self._polling_task = None
        self._stop_polling = False
    
    def _check_service(self) -> None:
        """Check if service is initialized."""
        if self.finmind_service is None:
            raise FinMindWebSocketError(
                "FinMind service not initialized. Check API key configuration."
            )
    
    async def connect(self, callback: Callable[[Any], None]) -> None:
        """
        Connect to FinMind polling service.
        
        Args:
            callback: Function to call when messages are received
            
        Raises:
            FinMindWebSocketError: If connection fails
        """
        try:
            self._check_service()
            self._callback = callback
            self._connected = True
            self._stop_polling = False
            
            # Start polling task
            self._polling_task = asyncio.create_task(self._polling_loop())
            
            logger.info("Connected to FinMind polling service")
            
        except Exception as e:
            logger.error(f"Failed to connect to FinMind polling service: {e}")
            self._connected = False
            raise FinMindWebSocketError(f"WebSocket connection failed: {e}")
    
    async def _polling_loop(self):
        """Internal loop that polls FinMind API and calls callback."""
        try:
            while not self._stop_polling and self._connected:
                if self._subscriptions and self._callback:
                    # Poll each subscribed ticker
                    for ticker in list(self._subscriptions):
                        try:
                            # Get latest snapshot
                            snapshot = self.finmind_service.get_ticker_snapshot(ticker)
                            if snapshot:
                                # Transform to ChartDataPoint-like format
                                message = self._transform_snapshot_to_message(ticker, snapshot)
                                if message:
                                    # Call callback with message
                                    try:
                                        self._callback(message)
                                    except Exception as e:
                                        logger.error(f"Error in callback for {ticker}: {e}")
                        except Exception as e:
                            logger.debug(f"Error polling {ticker}: {e}")
                
                # Wait before next poll
                await asyncio.sleep(self.poll_interval)
                
        except asyncio.CancelledError:
            logger.debug("Polling loop cancelled")
        except Exception as e:
            logger.error(f"Error in polling loop: {e}")
        finally:
            self._connected = False
    
    def _transform_snapshot_to_message(self, ticker: str, snapshot: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Transform FinMind snapshot to message format matching ChartDataPoint.
        
        Args:
            ticker: Stock ticker symbol
            snapshot: Snapshot dict from FinMind API
            
        Returns:
            Message dict or None if error
        """
        try:
            timestamp = int(datetime.now().timestamp() * 1000)
            date = datetime.now().strftime("%Y-%m-%d")
            
            return {
                "event_type": "trade",  # Simulate trade event
                "symbol": ticker,
                "price": snapshot.get("price", snapshot.get("close", 0)),
                "size": 0,  # Not available
                "timestamp": timestamp,
                "exchange": "TPEX",  # Taiwan market
                "conditions": None,
                "tape": None,
                "id": None,
                "sequence_number": None,
                # Additional OHLCV data
                "open": snapshot.get("open", snapshot.get("price", 0)),
                "high": snapshot.get("high", snapshot.get("price", 0)),
                "low": snapshot.get("low", snapshot.get("price", 0)),
                "close": snapshot.get("close", snapshot.get("price", 0)),
                "volume": snapshot.get("volume", 0),
                "date": date,
            }
        except Exception as e:
            logger.error(f"Error transforming snapshot for {ticker}: {e}")
            return None
    
    def subscribe(self, tickers: List[str], event_type: str = "T") -> None:
        """
        Subscribe to real-time data for tickers.
        
        Args:
            tickers: List of ticker symbols (e.g., ["2330"])
            event_type: Event type - ignored for FinMind (always polls snapshot)
            
        Note:
            - FinMind uses polling, so all subscriptions are treated the same
            - Polls every 5 seconds (configurable)
        """
        self._check_service()
        
        for ticker in tickers:
            self._subscriptions.add(ticker)
            logger.info(f"Subscribed to {ticker} (polling every {self.poll_interval}s)")
    
    def subscribe_all_trades(self) -> None:
        """Subscribe to all trades using wildcard - not supported in FinMind."""
        logger.warning("subscribe_all_trades not supported in FinMind polling service")
    
    def unsubscribe(self, tickers: List[str], event_type: str = "T") -> None:
        """
        Unsubscribe from tickers.
        
        Args:
            tickers: List of ticker symbols
            event_type: Event type (ignored)
        """
        self._check_service()
        
        for ticker in tickers:
            self._subscriptions.discard(ticker)
            logger.info(f"Unsubscribed from {ticker}")
    
    def unsubscribe_all(self) -> None:
        """Unsubscribe from all channels."""
        self._check_service()
        self._subscriptions.clear()
        logger.info("Unsubscribed from all channels")
    
    async def close(self) -> None:
        """Close polling connection."""
        if self._connected:
            try:
                self._stop_polling = True
                self._connected = False
                
                # Cancel polling task if still running
                if self._polling_task and not self._polling_task.done():
                    self._polling_task.cancel()
                    try:
                        await self._polling_task
                    except asyncio.CancelledError:
                        pass
                
                self._subscriptions.clear()
                self._polling_task = None
                logger.info("FinMind polling connection closed")
            except Exception as e:
                logger.warning(f"Error closing FinMind polling connection: {e}")
    
    @property
    def is_connected(self) -> bool:
        """Check if polling service is connected."""
        return self._connected
    
    @property
    def subscriptions(self) -> set:
        """Get current subscriptions."""
        return self._subscriptions.copy()
    
    def get_subscription_count(self) -> int:
        """Get number of active subscriptions."""
        return len(self._subscriptions)


# Helper functions for processing WebSocket messages

def process_finmind_trade(trade_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process FinMind trade message into dict format.
    
    Args:
        trade_data: Trade data dict from polling
        
    Returns:
        Dict with trade details
    """
    return {
        "event_type": "trade",
        "symbol": trade_data.get("symbol", ""),
        "price": trade_data.get("price", 0),
        "size": trade_data.get("size", 0),
        "timestamp": trade_data.get("timestamp", 0),
        "exchange": trade_data.get("exchange", "TPEX"),
        "conditions": trade_data.get("conditions"),
        "tape": trade_data.get("tape"),
        "id": trade_data.get("id"),
        "sequence_number": trade_data.get("sequence_number"),
        "open": trade_data.get("open", 0),
        "high": trade_data.get("high", 0),
        "low": trade_data.get("low", 0),
        "close": trade_data.get("close", 0),
        "volume": trade_data.get("volume", 0),
        "date": trade_data.get("date", ""),
    }

