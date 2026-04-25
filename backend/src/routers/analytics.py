from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
import logging
from src.cache.redis_client import get_redis

router = APIRouter()
logger = logging.getLogger(__name__)

class ClickEvent(BaseModel):
    type: str  # "podcast", "stock", "episode"
    id: str    # "gooaye", "2330", "ep-123"

@router.post("/click", status_code=202)
async def track_click(event: ClickEvent, background_tasks: BackgroundTasks):
    """
    Track user clicks for trending analytics.
    Fire-and-forget style.
    """
    # Check simple availability or just queue it
    # We'll check inside the task or just queue it. 
    # But to return "ignored" we need to check.
    # Actually, getting the client is async, so better to just queue 
    # and let the background task handle connection failure.
    background_tasks.add_task(process_click_event, event)
    return {"status": "accepted"}

async def process_click_event(event: ClickEvent):
    """
    Increment click counters in Redis.
    We use Sorted Sets (ZSET) for easy ranking.
    """
    try:
        redis = await get_redis()
        if not redis:
            return
            
        # Global All-Time (or rolling manually managed)
        # Key: "analytics:clicks:{type}" -> Member: {id}, Score: count
        key = f"analytics:clicks:{event.type}"
        
        # Increment score by 1
        await redis.zincrby(key, 1, event.id)
        
        # We might also want a "Weekly" bucket if we want strictly recent popularity
        # For now, simplistic approach as requested "popularity of clicks"
    except Exception as e:
        logger.error(f"Error processing analytics event: {e}")
