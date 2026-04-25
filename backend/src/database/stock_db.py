"""
Stock database CRUD operations
"""
from typing import Optional, List
from src.database.db import get_connection
from src.models.stock import CompanyDetail, ChartDataPoint, StockStats


def create_or_update_stock(
    ticker: str,
    name: str,
    price: Optional[float] = None,
    change: Optional[float] = None,
    change_percent: Optional[float] = None,
    market_cap: Optional[int] = None,
    revenue: Optional[int] = None,
    pe: Optional[float] = None,
    dividend_yield: Optional[float] = None,
    about: Optional[str] = None,
    volume: Optional[int] = None,
    beta: Optional[float] = None,
    volatility: Optional[float] = None,
) -> bool:
    """Create or update stock basic information"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO stocks (
                ticker, name, price, change, change_percent, market_cap,
                revenue, pe, dividend_yield, about, volume, beta, volatility, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(ticker) DO UPDATE SET
                name = excluded.name,
                price = COALESCE(excluded.price, stocks.price),
                change = COALESCE(excluded.change, stocks.change),
                change_percent = COALESCE(excluded.change_percent, stocks.change_percent),
                market_cap = COALESCE(excluded.market_cap, stocks.market_cap),
                revenue = COALESCE(excluded.revenue, stocks.revenue),
                pe = COALESCE(excluded.pe, stocks.pe),
                dividend_yield = COALESCE(excluded.dividend_yield, stocks.dividend_yield),
                about = COALESCE(excluded.about, stocks.about),
                volume = COALESCE(excluded.volume, stocks.volume),
                beta = COALESCE(excluded.beta, stocks.beta),
                volatility = COALESCE(excluded.volatility, stocks.volatility),
                updated_at = CURRENT_TIMESTAMP
        """, (
            ticker, name, price, change, change_percent, market_cap,
            revenue, pe, dividend_yield, about, volume, beta, volatility
        ))
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print(f"Error creating/updating stock {ticker}: {e}")
        return False
    finally:
        conn.close()


def get_stock_by_ticker(ticker: str) -> Optional[CompanyDetail]:
    """Get stock with latest information"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT * FROM stocks WHERE ticker = ?
        """, (ticker.upper(),))
        
        row = cursor.fetchone()
        if not row:
            return None
        
        # Get price history
        chart_data = get_price_history(ticker)
        
        # Build CompanyDetail
        stats = StockStats(
            volume=row['volume'] or 0,
            beta=row['beta'] or 0.0,
            volatility=row['volatility'] or 0.0
        )
        
        return CompanyDetail(
            ticker=row['ticker'],
            name=row['name'],
            price=row['price'] or 0.0,
            change=row['change'] or 0.0,
            changePercent=row['change_percent'] or 0.0,
            marketCap=row['market_cap'] or 0,
            revenue=row['revenue'] or 0,
            pe=row['pe'] or 0.0,
            dividendYield=row['dividend_yield'] or 0.0,
            about=row['about'] or "",
            stats=stats,
            chartData=chart_data
        )
    except Exception as e:
        print(f"Error getting stock {ticker}: {e}")
        return None
    finally:
        conn.close()


def get_all_stocks(sort_by: str = "ticker") -> List[dict]:
    """Get all stocks sorted by specified field"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Validate sort_by to prevent SQL injection
    valid_sorts = ["ticker", "name", "price", "change_percent", "market_cap"]
    if sort_by not in valid_sorts:
        sort_by = "ticker"
    
    try:
        cursor.execute(f"""
            SELECT * FROM stocks ORDER BY {sort_by} ASC
        """)
        
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error getting all stocks: {e}")
        return []
    finally:
        conn.close()


def add_price_history(
    ticker: str,
    timestamp: int,
    date: str,
    open: float,
    high: float,
    low: float,
    close: float,
    volume: int,
) -> bool:
    """Insert daily OHLCV data"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT OR REPLACE INTO stock_history (
                ticker, timestamp, date, open, high, low, close, volume
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (ticker.upper(), timestamp, date, open, high, low, close, volume))
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print(f"Error adding price history for {ticker}: {e}")
        return False
    finally:
        conn.close()


def get_price_history(
    ticker: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: Optional[int] = None
) -> List[ChartDataPoint]:
    """Get historical OHLCV data for ticker"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        query = """
            SELECT timestamp, date, open, high, low, close, volume
            FROM stock_history
            WHERE ticker = ?
        """
        params = [ticker.upper()]
        
        if start_date:
            query += " AND date >= ?"
            params.append(start_date)
        
        if end_date:
            query += " AND date <= ?"
            params.append(end_date)
        
        query += " ORDER BY date ASC"
        
        if limit:
            query += " LIMIT ?"
            params.append(limit)
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        return [
            ChartDataPoint(
                timestamp=row['timestamp'],
                price=row['close'],  # For backward compatibility
                date=row['date'],
                open=row['open'],
                high=row['high'],
                low=row['low'],
                close=row['close'],
                volume=row['volume']
            )
            for row in rows
        ]
    except Exception as e:
        print(f"Error getting price history for {ticker}: {e}")
        return []
    finally:
        conn.close()


def get_latest_price(ticker: str) -> Optional[ChartDataPoint]:
    """Get most recent price data"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT timestamp, date, open, high, low, close, volume
            FROM stock_history
            WHERE ticker = ?
            ORDER BY date DESC
            LIMIT 1
        """, (ticker.upper(),))
        
        row = cursor.fetchone()
        if not row:
            return None
        
        return ChartDataPoint(
            timestamp=row['timestamp'],
            price=row['close'],
            date=row['date'],
            open=row['open'],
            high=row['high'],
            low=row['low'],
            close=row['close'],
            volume=row['volume']
        )
    except Exception as e:
        print(f"Error getting latest price for {ticker}: {e}")
        return None
    finally:
        conn.close()


def delete_stock(ticker: str) -> bool:
    """Delete stock and all its history"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Delete history first (CASCADE should handle this, but explicit is safer)
        cursor.execute("DELETE FROM stock_history WHERE ticker = ?", (ticker.upper(),))
        cursor.execute("DELETE FROM stocks WHERE ticker = ?", (ticker.upper(),))
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print(f"Error deleting stock {ticker}: {e}")
        return False
    finally:
        conn.close()

