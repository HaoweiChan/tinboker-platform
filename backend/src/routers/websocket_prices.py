"""
WebSocket router for real-time price updates
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Set
from src.services.websocket_subscriber import WebSocketSubscriber
import json
import asyncio
import logging
from starlette.websockets import WebSocketState

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/prices")
async def websocket_prices(websocket: WebSocket):
    """
    WebSocket endpoint for real-time price updates (frontend-compatible).
    
    Supports:
    - subscribe: { type: 'subscribe', tickers: ['AAPL', 'TSLA'] }
    - unsubscribe: { type: 'unsubscribe', tickers: ['AAPL'] }
    - ping: { type: 'ping' }
    
    Returns:
    - connected: { type: 'connected', message: '...' }
    - subscribed: { type: 'subscribed', tickers: [...] }
    - unsubscribed: { type: 'unsubscribed', tickers: [...] }
    - price_update: { type: 'price_update', data: {...} }
    - pong: { type: 'pong' }
    - error: { type: 'error', code: '...', message: '...' }
    """
    await websocket.accept()
    
    subscriber = None
    subscribed_tickers: Set[str] = set()
    listening_started = False
    
    try:
        subscriber = WebSocketSubscriber(websocket)
        
        # Check Redis availability and inform client
        from src.cache.redis_client import RedisClient
        redis_available = await RedisClient.is_available()
        
        if redis_available:
            await websocket.send_json({
                "type": "connected",
                "message": "WebSocket connection established",
                "redis_available": True
            })
        else:
            await websocket.send_json({
                "type": "connected",
                "message": "WebSocket connection established (Redis unavailable - subscriptions will not work)",
                "redis_available": False,
                "warning": "Price updates will not be available until Redis is running"
            })
        
        while True:
            try:
                # Wait for client message
                data = await websocket.receive_json()
                message_type = data.get("type")
                
                if message_type == "subscribe":
                    tickers = data.get("tickers", [])
                    if not isinstance(tickers, list):
                        await websocket.send_json({
                            "type": "error",
                            "code": "INVALID_REQUEST",
                            "message": "tickers must be an array"
                        })
                        continue
                    
                    # Subscribe to each ticker
                    successful_tickers = []
                    failed_tickers = []
                    for ticker in tickers:
                        ticker_upper = ticker.upper()
                        if await subscriber.subscribe(ticker_upper):
                            subscribed_tickers.add(ticker_upper)
                            successful_tickers.append(ticker_upper)
                            
                            # Start listening after first successful subscription
                            if not listening_started and redis_available:
                                await subscriber.start_listening()
                                listening_started = True
                        else:
                            failed_tickers.append(ticker_upper)
                    
                    # Send confirmation with status
                    response = {
                        "type": "subscribed",
                        "tickers": list(subscribed_tickers)
                    }
                    if failed_tickers:
                        response["failed"] = failed_tickers
                        response["error"] = "Some tickers failed to subscribe (Redis may be unavailable)"
                    
                    await websocket.send_json(response)
                    
                elif message_type == "unsubscribe":
                    tickers = data.get("tickers", [])
                    if not isinstance(tickers, list):
                        await websocket.send_json({
                            "type": "error",
                            "code": "INVALID_REQUEST",
                            "message": "tickers must be an array"
                        })
                        continue
                    
                    # Unsubscribe from each ticker
                    for ticker in tickers:
                        ticker_upper = ticker.upper()
                        if await subscriber.unsubscribe(ticker_upper):
                            subscribed_tickers.discard(ticker_upper)
                    
                    # Send confirmation
                    await websocket.send_json({
                        "type": "unsubscribed",
                        "tickers": list(subscribed_tickers)
                    })
                    
                elif message_type == "ping":
                    await websocket.send_json({"type": "pong"})
                    
                else:
                    await websocket.send_json({
                        "type": "error",
                        "code": "UNKNOWN_MESSAGE_TYPE",
                        "message": f"Unknown message type: {message_type}"
                    })
                    
            except asyncio.TimeoutError:
                # Timeout - send ping to keep connection alive
                await websocket.send_json({"type": "ping"})
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "code": "INVALID_JSON",
                    "message": "Invalid JSON format"
                })
                
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected from prices endpoint")
    except Exception as e:
        logger.error(f"Error in WebSocket prices endpoint: {e}", exc_info=True)
        # Best-effort error message to client, but ignore failures if the socket
        # is already closing/closed.
        try:
            await websocket.send_json({
                "type": "error",
                "code": "INTERNAL_ERROR",
                "message": str(e)
            })
        except Exception:
            pass

        # Guard close to avoid AttributeError in underlying websockets library
        try:
            if websocket.client_state in (
                WebSocketState.CONNECTING,
                WebSocketState.CONNECTED,
                WebSocketState.ACCEPTED,
            ):
                await websocket.close(code=1011, reason=str(e))
        except Exception:
            # Ignore close-time errors; connection is terminating anyway.
            pass
    finally:
        # Cleanup subscription
        if subscriber:
            await subscriber.stop()

