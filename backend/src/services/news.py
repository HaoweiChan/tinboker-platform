"""
News service for managing news/events data
"""
from typing import Optional, List
from datetime import datetime
import json
from src.database.news_db import (
    get_news_by_id,
    get_all_news,
    create_news,
    update_news,
    delete_news,
    get_news_by_tickers,
)
from src.models.news import StockEvent
from src.services.massive_service import MassiveAPIService
from src.cache.redis_client import cache_get, cache_set, cache_delete, cache_delete_pattern
from src.cache.cache_config import CACHE_TTL


class NewsService:
    """Service for news/events operations"""
    
    def __init__(self, massive_service: Optional[MassiveAPIService] = None):
        """
        Initialize news service
        
        Args:
            massive_service: Optional Massive API service instance
        """
        self.massive_service = massive_service or MassiveAPIService()
    
    async def get_news_by_id(self, news_id: str) -> Optional[StockEvent]:
        """
        Get news by ID with caching
        
        Args:
            news_id: News event ID
            
        Returns:
            StockEvent object or None if not found
        """
        cache_key = f"news:{news_id}"
        
        # Check cache first
        cached = await cache_get(cache_key)
        if cached:
            try:
                data = json.loads(cached)
                return StockEvent(**data)
            except Exception:
                pass  # If deserialization fails, fetch fresh data
        
        # Cache miss - fetch from database
        news = get_news_by_id(news_id)
        
        # Store in cache
        if news:
            try:
                await cache_set(
                    cache_key,
                    json.dumps(news.dict(), default=str),
                    CACHE_TTL["news_item"]
                )
            except Exception:
                pass  # Cache failure shouldn't break the request
        
        return news
    
    def get_news_by_id_sync(self, news_id: str) -> Optional[StockEvent]:
        """Synchronous version for backward compatibility"""
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            return loop.run_until_complete(self.get_news_by_id(news_id))
        except RuntimeError:
            return asyncio.run(self.get_news_by_id(news_id))
    
    async def get_sorted_news(self, sort_by: str = "date") -> List[StockEvent]:
        """
        Get sorted news list with caching
        
        Args:
            sort_by: Sort field (date, created_at, updated_at, title)
            
        Returns:
            List of StockEvent objects
        """
        cache_key = f"news:list:{sort_by}"
        
        # Check cache first
        cached = await cache_get(cache_key)
        if cached:
            try:
                data = json.loads(cached)
                return [StockEvent(**item) for item in data]
            except Exception:
                pass  # If deserialization fails, fetch fresh data
        
        # Cache miss - fetch from database
        news_list = get_all_news(sort_by=sort_by)
        result = []
        for news_dict in news_list:
            # Get full news with tickers (use async cached version)
            news = await self.get_news_by_id(news_dict['id'])
            if news:
                result.append(news)
        
        # Store in cache
        try:
            await cache_set(
                cache_key,
                json.dumps([item.dict() for item in result], default=str),
                CACHE_TTL["news_list"]
            )
        except Exception:
            pass  # Cache failure shouldn't break the request
        
        return result
    
    def get_sorted_news_sync(self, sort_by: str = "date") -> List[StockEvent]:
        """Synchronous version for backward compatibility"""
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            return loop.run_until_complete(self.get_sorted_news(sort_by=sort_by))
        except RuntimeError:
            return asyncio.run(self.get_sorted_news(sort_by=sort_by))
    
    async def create_news(
        self,
        event_type: str,
        date: int,
        title: str,
        description: str,
        content: Optional[str] = None,
        related_tickers: Optional[List[str]] = None,
        news_id: Optional[str] = None,
    ) -> Optional[str]:
        """
        Create news entry and invalidate cache
        
        Args:
            event_type: Event type (earnings, conference, news, dividend)
            date: Event date (Unix timestamp in milliseconds)
            title: Event title
            description: Event description
            content: Optional event content
            related_tickers: List of related stock tickers
            news_id: Optional news ID (auto-generated if not provided)
            
        Returns:
            News ID if successful, None otherwise
        """
        result = create_news(
            news_id=news_id,
            event_type=event_type,
            date=date,
            title=title,
            description=description,
            content=content,
            related_tickers=related_tickers or [],
        )
        
        # Invalidate cache
        if result:
            await cache_delete_pattern("news:list:*")
            if news_id:
                await cache_delete(f"news:{news_id}")
        
        return result
    
    async def update_news(
        self,
        news_id: str,
        event_type: Optional[str] = None,
        date: Optional[int] = None,
        title: Optional[str] = None,
        description: Optional[str] = None,
        content: Optional[str] = None,
        related_tickers: Optional[List[str]] = None,
    ) -> bool:
        """
        Update news entry and invalidate cache
        
        Args:
            news_id: News ID
            event_type: Optional event type
            date: Optional event date
            title: Optional title
            description: Optional description
            content: Optional content
            related_tickers: Optional list of related tickers
            
        Returns:
            True if successful, False otherwise
        """
        result = update_news(
            news_id=news_id,
            event_type=event_type,
            date=date,
            title=title,
            description=description,
            content=content,
            related_tickers=related_tickers,
        )
        
        # Invalidate cache
        if result:
            await cache_delete(f"news:{news_id}")
            await cache_delete_pattern("news:list:*")
        
        return result
    
    async def delete_news(self, news_id: str) -> bool:
        """
        Delete news entry and invalidate cache
        
        Args:
            news_id: News ID
            
        Returns:
            True if successful, False otherwise
        """
        result = delete_news(news_id)
        
        # Invalidate cache
        if result:
            await cache_delete(f"news:{news_id}")
            await cache_delete_pattern("news:list:*")
        
        return result
    
    def get_news_by_tickers(self, tickers: List[str]) -> List[StockEvent]:
        """
        Get news filtered by ticker list
        
        Args:
            tickers: List of stock tickers
            
        Returns:
            List of StockEvent objects
        """
        return get_news_by_tickers(tickers)
    
    def fetch_and_save_news_from_massive(self, ticker: str, limit: int = 10) -> List[str]:
        """
        Fetch news from Massive API for a ticker and save to database
        
        Args:
            ticker: Stock ticker symbol
            limit: Maximum number of articles to fetch
            
        Returns:
            List of news IDs that were created
        """
        news_ids = []
        
        # Fetch news from Massive API
        articles = self.massive_service.list_news(ticker, limit=limit)
        
        for article in articles:
            # Convert published_utc to Unix timestamp in milliseconds
            published_utc = article.get("published_utc")
            if published_utc:
                try:
                    # Parse ISO format datetime
                    dt = datetime.fromisoformat(published_utc.replace('Z', '+00:00'))
                    timestamp_ms = int(dt.timestamp() * 1000)
                except:
                    # Fallback to current time if parsing fails
                    timestamp_ms = int(datetime.now().timestamp() * 1000)
            else:
                timestamp_ms = int(datetime.now().timestamp() * 1000)
            
            # Use Massive API article ID or generate one
            article_id = article.get("id")
            if not article_id:
                import uuid
                article_id = str(uuid.uuid4())
            
            # Check if news already exists
            existing = get_news_by_id(article_id)
            if existing:
                # Skip if already exists
                continue
            
            # Use tickers from Massive API if available (more accurate than just the queried ticker)
            # Massive API returns all related tickers in the article
            related_tickers = article.get("tickers", [])
            if not related_tickers:
                # Fallback to the queried ticker if no tickers in response
                related_tickers = [ticker.upper()]
            else:
                # Ensure all tickers are uppercase
                related_tickers = [t.upper() for t in related_tickers if t]
            
            # Create news entry
            # Note: content is typically None in Starter plan - requires higher tier
            news_id = self.create_news(
                news_id=article_id,
                event_type="news",  # Default to "news" type
                date=timestamp_ms,
                title=article.get("title", ""),
                description=article.get("description", article.get("title", "")),
                content=article.get("content"),  # Usually None in Starter plan
                related_tickers=related_tickers,  # Use all tickers from Massive API
            )
            
            if news_id:
                news_ids.append(news_id)
        
        return news_ids

