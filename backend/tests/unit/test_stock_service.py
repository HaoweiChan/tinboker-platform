"""
Unit tests for stock service
"""
import pytest
from unittest.mock import Mock, patch
from src.services.stock import StockService
from src.database.stock_db import create_or_update_stock, add_price_history


class TestStockService:
    """Test stock service operations"""
    
    def test_get_stock_info_from_db(self, test_db):
        """Test getting stock info from database"""
        # Create stock in DB
        create_or_update_stock(
            ticker="TEST",
            name="Test Company",
            price=100.0,
            change=5.0,
            change_percent=5.26,
            market_cap=1000000000,
            revenue=50000000,
            pe=20.0,
            dividend_yield=2.5,
            about="Test company",
            volume=1000000,
            beta=1.2,
            volatility=0.3,
        )
        
        service = StockService()
        stock = service.get_stock_info("TEST", use_external=False)
        
        assert stock is not None
        assert stock.ticker == "TEST"
        assert stock.name == "Test Company"
        assert stock.price == 100.0
    
    @patch('src.services.stock.DataCollectionService')
    def test_get_stock_info_fallback_to_external(self, mock_data_collection, test_db):
        """Test fallback to external API when not in DB"""
        # Mock external service
        mock_stock = Mock()
        mock_stock.stock_id = "TEST"
        mock_stock.metadata.stock_name = "Test Company"
        mock_stock.price = 100.0
        mock_stock.change = 5.0
        mock_stock.changePercent = 5.26
        mock_stock.marketCap = 1000000000
        mock_stock.revenue = 50000000
        mock_stock.pe = 20.0
        mock_stock.dividendYield = 2.5
        mock_stock.about = "Test company"
        mock_stock.stats.volume = 1000000
        mock_stock.stats.beta = 1.2
        mock_stock.stats.volatility = 0.3
        mock_stock.stock_price_history = Mock()
        mock_stock.stock_price_history.day = []
        
        mock_service_instance = Mock()
        mock_service_instance.collect_stock_data.return_value = mock_stock
        mock_data_collection.return_value = mock_service_instance
        
        service = StockService(data_collection_service=mock_service_instance)
        stock = service.get_stock_info("TEST", use_external=True)
        
        assert stock is not None
        assert stock.ticker == "TEST"
        mock_service_instance.collect_stock_data.assert_called_once_with("TEST")
    
    def test_get_stock_basic_info(self, test_db):
        """Test getting basic stock info"""
        create_or_update_stock(
            ticker="TEST",
            name="Test Company",
            price=100.0,
            change=5.0,
            change_percent=5.26,
            market_cap=1000000000,
            revenue=50000000,
            pe=20.0,
            dividend_yield=2.5,
            about="Test company",
            volume=1000000,
            beta=1.2,
            volatility=0.3,
        )
        
        service = StockService()
        stock_info = service.get_stock_basic_info("TEST")
        
        assert stock_info is not None
        assert stock_info["ticker"] == "TEST"
        assert stock_info["name"] == "Test Company"
        assert "chartData" not in stock_info  # Should not include chart data
    
    def test_get_sorted_stocks(self, test_db):
        """Test getting sorted stocks"""
        create_or_update_stock(
            ticker="BBB",
            name="BBB Company",
            price=50.0,
            change=0.0,
            change_percent=0.0,
            market_cap=500000000,
            revenue=25000000,
            pe=15.0,
            dividend_yield=1.0,
            about="BBB company",
            volume=500000,
            beta=1.0,
            volatility=0.2,
        )
        create_or_update_stock(
            ticker="AAA",
            name="AAA Company",
            price=100.0,
            change=5.0,
            change_percent=5.26,
            market_cap=1000000000,
            revenue=50000000,
            pe=20.0,
            dividend_yield=2.5,
            about="AAA company",
            volume=1000000,
            beta=1.2,
            volatility=0.3,
        )
        
        service = StockService()
        stocks = service.get_sorted_stocks(sort_by="ticker")
        
        assert len(stocks) == 2
        assert stocks[0]["ticker"] == "AAA"
        assert stocks[1]["ticker"] == "BBB"
    
    def test_get_ohlcv_data(self, test_db):
        """Test getting OHLCV data"""
        create_or_update_stock(
            ticker="TEST",
            name="Test Company",
            price=100.0,
            change=5.0,
            change_percent=5.26,
            market_cap=1000000000,
            revenue=50000000,
            pe=20.0,
            dividend_yield=2.5,
            about="Test company",
            volume=1000000,
            beta=1.2,
            volatility=0.3,
        )
        
        add_price_history("TEST", 1704067200000, "2024-01-01", 100.0, 105.0, 95.0, 102.0, 1000000)
        add_price_history("TEST", 1704153600000, "2024-01-02", 102.0, 107.0, 100.0, 105.0, 1200000)
        
        service = StockService()
        ohlcv_data = service.get_ohlcv_data("TEST")
        
        assert len(ohlcv_data) == 2
        assert ohlcv_data[0].date == "2024-01-01"
        assert ohlcv_data[1].date == "2024-01-02"

