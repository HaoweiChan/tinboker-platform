"""
Background worker that publishes stock price updates to Redis using Massive WebSocket
"""
import asyncio
import logging
import signal
import sys
from typing import List
from src.services.stock_publisher import StockPublisher

logger = logging.getLogger(__name__)

class StockPricePublisherWorker:
    """Worker that continuously publishes stock updates"""
    
    def __init__(self):
        self.publisher = StockPublisher()
        self.running = False
        self.tickers: List[str] = []
    
    async def start(self, tickers: List[str]):
        """
        Start the publisher worker.
        
        Args:
            tickers: List of ticker symbols to monitor
        """
        self.tickers = tickers
        self.running = True
        
        logger.info(f"Starting stock price publisher worker for {len(tickers)} tickers")
        
        # Start publishing
        await self.publisher.start_publishing(tickers)
        
        # Keep running until stopped
        try:
            while self.running:
                await asyncio.sleep(1)
                
                # Check if WebSocket is still connected, reconnect if needed
                if self.publisher.websocket_service and not self.publisher.websocket_service.is_connected:
                    logger.warning("WebSocket disconnected, attempting to reconnect...")
                    await self.publisher.initialize()
                    # Re-subscribe to all tickers
                    for ticker in self.tickers:
                        await self.publisher.add_ticker(ticker)
        except asyncio.CancelledError:
            logger.info("Worker task cancelled")
        except Exception as e:
            logger.error(f"Error in worker loop: {e}", exc_info=True)
    
    def stop(self):
        """Stop the worker"""
        self.running = False
        logger.info("Stopping stock price publisher worker...")

async def main():
    """Main entry point for worker"""
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Default tickers to monitor (can be configured via env vars)
    default_tickers = ["AAPL", "GOOGL", "MSFT", "NVDA", "TSLA"]
    
    # Get tickers from environment or use defaults
    import os
    tickers_env = os.getenv("MONITORED_TICKERS", "")
    tickers = [t.strip().upper() for t in tickers_env.split(",") if t.strip()] if tickers_env else default_tickers
    
    worker = StockPricePublisherWorker()
    
    # Handle shutdown signals
    def signal_handler(sig, frame):
        logger.info("Received shutdown signal")
        worker.stop()
        # Cancel the event loop
        loop = asyncio.get_event_loop()
        for task in asyncio.all_tasks(loop):
            task.cancel()
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        await worker.start(tickers)
    except KeyboardInterrupt:
        logger.info("Worker interrupted")
    except Exception as e:
        logger.error(f"Worker error: {e}", exc_info=True)
    finally:
        await worker.publisher.stop()
        logger.info("Worker stopped")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Worker shutdown complete")
        sys.exit(0)

