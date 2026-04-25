"""
Unit tests for news database operations
"""
import pytest
from src.database.news_db import (
    create_news,
    get_news_by_id,
    get_all_news,
    update_news,
    delete_news,
    get_news_by_tickers,
)


class TestNewsDB:
    """Test news database CRUD operations"""
    
    def test_create_news(self, test_db, sample_news_data):
        """Test creating news"""
        news_id = create_news(
            news_id=None,
            **sample_news_data
        )
        assert news_id is not None
        
        # Verify news was created
        news = get_news_by_id(news_id)
        assert news is not None
        assert news.title == "Test Earnings Report"
        assert len(news.relatedTickers) == 2
    
    def test_get_news_by_id(self, test_db, sample_news_data):
        """Test retrieving news by ID"""
        news_id = create_news(news_id="test-news-1", **sample_news_data)
        
        news = get_news_by_id("test-news-1")
        assert news is not None
        assert news.id == "test-news-1"
        assert news.type == "earnings"
        assert "TEST" in news.relatedTickers
        assert "NVDA" in news.relatedTickers
    
    def test_get_news_not_found(self, test_db):
        """Test retrieving non-existent news"""
        news = get_news_by_id("nonexistent")
        assert news is None
    
    def test_get_all_news(self, test_db, sample_news_data):
        """Test retrieving all news"""
        create_news(news_id="news-1", **sample_news_data)
        
        sample_news_data["title"] = "Second News"
        sample_news_data["date"] = 1704153600000
        create_news(news_id="news-2", **sample_news_data)
        
        news_list = get_all_news(sort_by="date")
        assert len(news_list) == 2
    
    def test_update_news(self, test_db, sample_news_data):
        """Test updating news"""
        news_id = create_news(news_id="test-news", **sample_news_data)
        
        result = update_news(
            news_id=news_id,
            title="Updated Title",
            description="Updated Description",
        )
        assert result is True
        
        news = get_news_by_id(news_id)
        assert news.title == "Updated Title"
        assert news.description == "Updated Description"
    
    def test_update_news_tickers(self, test_db, sample_news_data):
        """Test updating news related tickers"""
        news_id = create_news(news_id="test-news", **sample_news_data)
        
        result = update_news(
            news_id=news_id,
            related_tickers=["AAPL", "GOOGL"],
        )
        assert result is True
        
        news = get_news_by_id(news_id)
        assert len(news.relatedTickers) == 2
        assert "AAPL" in news.relatedTickers
        assert "GOOGL" in news.relatedTickers
    
    def test_delete_news(self, test_db, sample_news_data):
        """Test deleting news"""
        news_id = create_news(news_id="test-news", **sample_news_data)
        
        result = delete_news(news_id)
        assert result is True
        
        news = get_news_by_id(news_id)
        assert news is None
    
    def test_get_news_by_tickers(self, test_db, sample_news_data):
        """Test retrieving news by tickers"""
        create_news(news_id="news-1", **sample_news_data)
        
        sample_news_data["related_tickers"] = ["AAPL"]
        create_news(news_id="news-2", **sample_news_data)
        
        news_list = get_news_by_tickers(["TEST", "NVDA"])
        assert len(news_list) == 1
        assert news_list[0].id == "news-1"
        
        news_list = get_news_by_tickers(["AAPL"])
        assert len(news_list) == 1
        assert news_list[0].id == "news-2"

