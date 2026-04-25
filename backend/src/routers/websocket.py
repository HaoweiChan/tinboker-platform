"""
WebSocket router (for backward compatibility)
Stock WebSocket functionality is in stock router
"""
from fastapi import APIRouter

router = APIRouter(tags=["websocket"])

# WebSocket endpoints have been moved to respective routers
# Stock OHLCV streaming is in stock router: WS /ws/stocks/{ticker}/ohlcv

