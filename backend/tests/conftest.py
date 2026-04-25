"""
Pytest configuration and fixtures
"""
import pytest
import sqlite3
import os
import tempfile
from pathlib import Path
from src.database.db import init_db, get_connection
from src.config import settings


@pytest.fixture(scope="function")
def test_db():
    """Create a temporary in-memory SQLite database for testing"""
    # Create temporary database file
    db_fd, db_path = tempfile.mkstemp(suffix='.db')
    os.close(db_fd)
    
    # Temporarily override database path
    original_path = settings.database_path
    settings.database_path = db_path
    
    try:
        # Initialize database
        init_db()
        yield db_path
    finally:
        # Cleanup
        if os.path.exists(db_path):
            os.unlink(db_path)
        settings.database_path = original_path


@pytest.fixture(scope="function")
def db_connection(test_db):
    """Get database connection for testing"""
    conn = get_connection()
    yield conn
    conn.close()


@pytest.fixture
def sample_stock_data():
    """Sample stock data for testing"""
    return {
        "ticker": "TEST",
        "name": "Test Company",
        "price": 100.0,
        "change": 5.0,
        "change_percent": 5.26,
        "market_cap": 1000000000,
        "revenue": 50000000,
        "pe": 20.0,
        "dividend_yield": 2.5,
        "about": "A test company",
        "volume": 1000000,
        "beta": 1.2,
        "volatility": 0.3,
    }


@pytest.fixture
def sample_graph_data():
    """Sample graph data for testing"""
    from src.models.graph import GraphData, Node, Edge, NodeData, EdgeData, Position
    
    return GraphData(
        nodes=[
            Node(
                id="NVDA",
                type="stock",
                data=NodeData(
                    label="NVIDIA",
                    ticker="NVDA",
                    marketCapTier="large",
                ),
                position=Position(x=100.0, y=200.0),
            ),
            Node(
                id="MSFT",
                type="stock",
                data=NodeData(
                    label="Microsoft",
                    ticker="MSFT",
                    marketCapTier="large",
                ),
                position=Position(x=300.0, y=400.0),
            ),
        ],
        edges=[
            Edge(
                id="e1",
                source="NVDA",
                target="MSFT",
                label="Partnership",
                data=EdgeData(category="automation"),
            ),
        ],
    )


@pytest.fixture
def sample_news_data():
    """Sample news data for testing"""
    return {
        "event_type": "earnings",
        "date": 1704067200000,  # 2024-01-01 timestamp
        "title": "Test Earnings Report",
        "description": "Test company reports earnings",
        "content": "Full earnings report content",
        "related_tickers": ["TEST", "NVDA"],
    }

