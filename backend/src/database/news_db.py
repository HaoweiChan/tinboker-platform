"""
News database CRUD operations
"""
import uuid
from typing import Optional, List
from src.database.db import get_connection
from src.models.news import StockEvent


def create_news(
    news_id: Optional[str],
    event_type: str,
    date: int,
    title: str,
    description: str,
    content: Optional[str],
    related_tickers: List[str],
) -> Optional[str]:
    """Insert news with related tickers"""
    if not news_id:
        news_id = str(uuid.uuid4())
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Insert news record
        cursor.execute("""
            INSERT INTO news (id, type, date, title, description, content, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """, (news_id, event_type, date, title, description, content))
        
        # Insert related tickers
        for ticker in related_tickers:
            cursor.execute("""
                INSERT OR IGNORE INTO news_tickers (news_id, ticker)
                VALUES (?, ?)
            """, (news_id, ticker.upper()))
        
        conn.commit()
        return news_id
    except Exception as e:
        conn.rollback()
        print(f"Error creating news: {e}")
        return None
    finally:
        conn.close()


def get_news_by_id(news_id: str) -> Optional[StockEvent]:
    """Get single news item"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT * FROM news WHERE id = ?
        """, (news_id,))
        
        row = cursor.fetchone()
        if not row:
            return None
        
        # Get related tickers
        cursor.execute("""
            SELECT ticker FROM news_tickers WHERE news_id = ?
        """, (news_id,))
        
        ticker_rows = cursor.fetchall()
        related_tickers = [row['ticker'] for row in ticker_rows]
        
        return StockEvent(
            id=row['id'],
            type=row['type'],
            date=row['date'],
            title=row['title'],
            description=row['description'],
            content=row['content'],
            relatedTickers=related_tickers
        )
    except Exception as e:
        print(f"Error getting news {news_id}: {e}")
        return None
    finally:
        conn.close()


def get_all_news(sort_by: str = "date") -> List[dict]:
    """Get all news, sorted by specified field"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Validate sort_by
    valid_sorts = ["date", "created_at", "updated_at", "title"]
    if sort_by not in valid_sorts:
        sort_by = "date"
    
    # Default to DESC for date, ASC for others
    order = "DESC" if sort_by == "date" else "ASC"
    
    try:
        cursor.execute(f"""
            SELECT * FROM news ORDER BY {sort_by} {order}
        """)
        
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error getting all news: {e}")
        return []
    finally:
        conn.close()


def update_news(
    news_id: str,
    event_type: Optional[str] = None,
    date: Optional[int] = None,
    title: Optional[str] = None,
    description: Optional[str] = None,
    content: Optional[str] = None,
    related_tickers: Optional[List[str]] = None,
) -> bool:
    """Update news fields"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        updates = []
        params = []
        
        if event_type is not None:
            updates.append("type = ?")
            params.append(event_type)
        if date is not None:
            updates.append("date = ?")
            params.append(date)
        if title is not None:
            updates.append("title = ?")
            params.append(title)
        if description is not None:
            updates.append("description = ?")
            params.append(description)
        if content is not None:
            updates.append("content = ?")
            params.append(content)
        
        if updates:
            params.append(news_id)
            cursor.execute(f"""
                UPDATE news
                SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, params)
        
        # Update related tickers if provided
        if related_tickers is not None:
            # Delete existing tickers
            cursor.execute("DELETE FROM news_tickers WHERE news_id = ?", (news_id,))
            # Insert new tickers
            for ticker in related_tickers:
                cursor.execute("""
                    INSERT OR IGNORE INTO news_tickers (news_id, ticker)
                    VALUES (?, ?)
                """, (news_id, ticker.upper()))
        
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print(f"Error updating news {news_id}: {e}")
        return False
    finally:
        conn.close()


def delete_news(news_id: str) -> bool:
    """Delete news and related tickers"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # CASCADE should handle news_tickers, but explicit is safer
        cursor.execute("DELETE FROM news_tickers WHERE news_id = ?", (news_id,))
        cursor.execute("DELETE FROM news WHERE id = ?", (news_id,))
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        conn.rollback()
        print(f"Error deleting news {news_id}: {e}")
        return False
    finally:
        conn.close()


def get_news_by_tickers(tickers: List[str]) -> List[StockEvent]:
    """Get news filtered by ticker list"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        placeholders = ','.join(['?'] * len(tickers))
        tickers_upper = [t.upper() for t in tickers]
        
        cursor.execute(f"""
            SELECT DISTINCT n.*
            FROM news n
            INNER JOIN news_tickers nt ON n.id = nt.news_id
            WHERE nt.ticker IN ({placeholders})
            ORDER BY n.date DESC
        """, tickers_upper)
        
        rows = cursor.fetchall()
        news_items = []
        
        for row in rows:
            # Get tickers for this news item
            cursor.execute("""
                SELECT ticker FROM news_tickers WHERE news_id = ?
            """, (row['id'],))
            ticker_rows = cursor.fetchall()
            related_tickers = [r['ticker'] for r in ticker_rows]
            
            news_items.append(StockEvent(
                id=row['id'],
                type=row['type'],
                date=row['date'],
                title=row['title'],
                description=row['description'],
                content=row['content'],
                relatedTickers=related_tickers
            ))
        
        return news_items
    except Exception as e:
        print(f"Error getting news by tickers: {e}")
        return []
    finally:
        conn.close()

