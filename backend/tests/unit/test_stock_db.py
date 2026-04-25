"""
Unit tests for stock database operations
"""
import pytest
from src.database.stock_db import (
    create_or_update_stock,
    get_stock_by_ticker,
    get_all_stocks,
    add_price_history,
    get_price_history,
    get_latest_price,
    delete_stock,
)


class TestStockDB:
    """Test stock database CRUD operations"""
    
    def test_create_or_update_stock(self, test_db, sample_stock_data):
        """Test creating a new stock"""
        result = create_or_update_stock(**sample_stock_data)
        assert result is True
        
        # Verify stock was created
        stock = get_stock_by_ticker("TEST")
        assert stock is not None
        assert stock.ticker == "TEST"
        assert stock.name == "Test Company"
        assert stock.price == 100.0
    
    def test_update_stock(self, test_db, sample_stock_data):
        """Test updating an existing stock"""
        # Create stock
        create_or_update_stock(**sample_stock_data)
        
        # Update stock
        sample_stock_data["price"] = 110.0
        sample_stock_data["change"] = 10.0
        result = create_or_update_stock(**sample_stock_data)
        assert result is True
        
        # Verify update
        stock = get_stock_by_ticker("TEST")
        assert stock.price == 110.0
        assert stock.change == 10.0
    
    def test_get_stock_by_ticker(self, test_db, sample_stock_data):
        """Test retrieving stock by ticker"""
        create_or_update_stock(**sample_stock_data)
        
        stock = get_stock_by_ticker("TEST")
        assert stock is not None
        assert stock.ticker == "TEST"
        assert stock.name == "Test Company"
        assert stock.stats.volume == 1000000
    
    def test_get_stock_not_found(self, test_db):
        """Test retrieving non-existent stock"""
        stock = get_stock_by_ticker("NONEXISTENT")
        assert stock is None
    
    def test_get_all_stocks(self, test_db, sample_stock_data):
        """Test retrieving all stocks"""
        # Create multiple stocks
        create_or_update_stock(**sample_stock_data)
        
        sample_stock_data["ticker"] = "TEST2"
        sample_stock_data["name"] = "Test Company 2"
        create_or_update_stock(**sample_stock_data)
        
        stocks = get_all_stocks(sort_by="ticker")
        assert len(stocks) == 2
        assert stocks[0]["ticker"] == "TEST"
        assert stocks[1]["ticker"] == "TEST2"
    
    def test_add_price_history(self, test_db, sample_stock_data):
        """Test adding price history"""
        create_or_update_stock(**sample_stock_data)
        
        result = add_price_history(
            ticker="TEST",
            timestamp=1704067200000,
            date="2024-01-01",
            open=100.0,
            high=105.0,
            low=95.0,
            close=102.0,
            volume=1000000,
        )
        assert result is True
        
        # Verify history was added
        history = get_price_history("TEST")
        assert len(history) == 1
        assert history[0].date == "2024-01-01"
        assert history[0].close == 102.0
    
    def test_get_price_history(self, test_db, sample_stock_data):
        """Test retrieving price history"""
        create_or_update_stock(**sample_stock_data)
        
        # Add multiple days of history
        add_price_history("TEST", 1704067200000, "2024-01-01", 100.0, 105.0, 95.0, 102.0, 1000000)
        add_price_history("TEST", 1704153600000, "2024-01-02", 102.0, 107.0, 100.0, 105.0, 1200000)
        
        history = get_price_history("TEST")
        assert len(history) == 2
        assert history[0].date == "2024-01-01"
        assert history[1].date == "2024-01-02"
    
    def test_get_price_history_with_date_range(self, test_db, sample_stock_data):
        """Test retrieving price history with date range"""
        create_or_update_stock(**sample_stock_data)
        
        add_price_history("TEST", 1704067200000, "2024-01-01", 100.0, 105.0, 95.0, 102.0, 1000000)
        add_price_history("TEST", 1704153600000, "2024-01-02", 102.0, 107.0, 100.0, 105.0, 1200000)
        add_price_history("TEST", 1704240000000, "2024-01-03", 105.0, 110.0, 103.0, 108.0, 1300000)
        
        history = get_price_history("TEST", start_date="2024-01-02", end_date="2024-01-02")
        assert len(history) == 1
        assert history[0].date == "2024-01-02"
    
    def test_get_latest_price(self, test_db, sample_stock_data):
        """Test retrieving latest price"""
        create_or_update_stock(**sample_stock_data)
        
        add_price_history("TEST", 1704067200000, "2024-01-01", 100.0, 105.0, 95.0, 102.0, 1000000)
        add_price_history("TEST", 1704153600000, "2024-01-02", 102.0, 107.0, 100.0, 105.0, 1200000)
        
        latest = get_latest_price("TEST")
        assert latest is not None
        assert latest.date == "2024-01-02"
        assert latest.close == 105.0
    
    def test_delete_stock(self, test_db, sample_stock_data):
        """Test deleting stock"""
        create_or_update_stock(**sample_stock_data)
        add_price_history("TEST", 1704067200000, "2024-01-01", 100.0, 105.0, 95.0, 102.0, 1000000)
        
        result = delete_stock("TEST")
        assert result is True
        
        # Verify stock and history are deleted
        stock = get_stock_by_ticker("TEST")
        assert stock is None
        
        history = get_price_history("TEST")
        assert len(history) == 0

