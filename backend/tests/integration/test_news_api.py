"""
Integration tests for news API endpoints
"""
import pytest
from fastapi.testclient import TestClient
from src.main import app
from src.database.news_db import create_news


@pytest.fixture
def client(test_db):
    """Create test client"""
    return TestClient(app)


class TestNewsAPI:
    """Test news API endpoints"""
    
    def test_get_sorted_news(self, client, test_db, sample_news_data):
        """Test GET /api/news"""
        create_news(news_id="news-1", **sample_news_data)
        
        sample_news_data["title"] = "Second News"
        sample_news_data["date"] = 1704153600000
        create_news(news_id="news-2", **sample_news_data)
        
        response = client.get("/api/news?sort_by=date")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        # Should be sorted by date DESC
        assert data[0]["date"] >= data[1]["date"]
    
    def test_get_news_by_id(self, client, test_db, sample_news_data):
        """Test GET /api/news/{news_id}"""
        create_news(news_id="test-news", **sample_news_data)
        
        response = client.get("/api/news/test-news")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "test-news"
        assert data["title"] == "Test Earnings Report"
        assert len(data["relatedTickers"]) == 2
    
    def test_get_news_not_found(self, client, test_db):
        """Test GET /api/news/{news_id} with non-existent ID"""
        response = client.get("/api/news/nonexistent")
        assert response.status_code == 404

