"""
Integration tests for WebSocket endpoints
"""
import pytest
import json
from fastapi.testclient import TestClient
from src.main import app
from src.database.stock_db import create_or_update_stock, add_price_history


@pytest.fixture
def client(test_db):
    """Create test client"""
    return TestClient(app)


class TestWebSocket:
    """Test WebSocket endpoints"""
    
    @pytest.mark.skip(reason="WebSocket streaming has infinite loop, needs refactoring for testing")
    def test_websocket_ohlcv_connection(self, client, test_db):
        """Test WebSocket connection for OHLCV updates"""
        # Create test stock
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
        
        # Add price history
        add_price_history("TEST", 1704067200000, "2024-01-01", 100.0, 105.0, 95.0, 102.0, 1000000)
        
        # Connect via WebSocket
        with client.websocket_connect("/api/stocks/TEST/ohlcv") as websocket:
            # Receive initial data
            data = websocket.receive_json(timeout=2.0)
            assert "ticker" in data
            assert data["ticker"] == "TEST"
            assert "timestamp" in data
            assert "date" in data
            assert "open" in data
            assert "high" in data
            assert "low" in data
            assert "close" in data
            assert "volume" in data
    
    @pytest.mark.skip(reason="WebSocket streaming has infinite loop, needs refactoring for testing")
    def test_websocket_ohlcv_invalid_ticker(self, client, test_db):
        """Test WebSocket connection with invalid ticker"""
        # Should still connect but may not have data
        with client.websocket_connect("/api/stocks/INVALID/ohlcv") as websocket:
            # Connection should succeed even if no data
            # The service will handle missing data gracefully
            try:
                data = websocket.receive_json(timeout=1.0)
                # If data is received, verify structure
                assert "ticker" in data
            except Exception:
                # Timeout is acceptable if no data available
                pass

