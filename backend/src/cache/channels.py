"""
Redis channel name utilities for pub/sub
"""

def stock_ohlcv_channel(ticker: str) -> str:
    """Get Redis channel name for stock OHLCV updates"""
    return f"stock:{ticker.upper()}:ohlcv"

def stock_price_channel(ticker: str) -> str:
    """Get Redis channel name for stock price updates"""
    return f"stock:{ticker.upper()}:price"

def stock_news_channel(ticker: str) -> str:
    """Get Redis channel name for stock news updates"""
    return f"stock:{ticker.upper()}:news"

def all_stocks_channel() -> str:
    """Get Redis channel name for all stocks updates"""
    return "stock:all:updates"

