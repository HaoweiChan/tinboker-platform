"""
Recommendation API: by-ticker, by-podcaster, and buzz.
Data comes from podcast_db (prepared elsewhere). Default timeframe: today − 7 days → today.
"""
from fastapi import APIRouter, Query
from typing import List, Optional
from src.services.recommendation_service import RecommendationService
from src.cache.cdn_cache import cdn_cache_trending

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])
recommendation_service = RecommendationService()


@router.get("/by-ticker/{ticker}")
@cdn_cache_trending
async def get_recommendations_by_ticker(
    ticker: str,
    start_date: Optional[str] = Query(default=None, description="ISO date (YYYY-MM-DD); default: today − 7 days"),
    end_date: Optional[str] = Query(default=None, description="ISO date (YYYY-MM-DD); default: today"),
) -> List[dict]:
    """
    Get recommendations for the given ticker in the date range.
    Default timeframe: last 7 days.

    
    CDN Cache: 5 minutes
    """
    return await recommendation_service.get_recommendations_by_ticker(
        ticker=ticker,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/by-podcaster/{podcaster_name}")
@cdn_cache_trending
async def get_recommendations_by_podcaster(
    podcaster_name: str,
    start_date: Optional[str] = Query(default=None, description="ISO date (YYYY-MM-DD); default: today − 7 days"),
    end_date: Optional[str] = Query(default=None, description="ISO date (YYYY-MM-DD); default: today"),
    podcast_slug: Optional[str] = Query(default=None, description="Optional slug; also matches episode_id ILIKE %slug%"),
) -> List[dict]:
    """
    Get recommendations from the given podcaster in the date range.
    Default timeframe: last 7 days. Pass podcast_slug to also match by episode_id (e.g. slug in episode_id).
    CDN Cache: 5 minutes
    """
    return await recommendation_service.get_recommendations_by_podcaster(
        podcaster=podcaster_name,
        start_date=start_date,
        end_date=end_date,
        podcast_slug=podcast_slug,
    )


@router.get("/buzz")
@cdn_cache_trending
async def get_buzz(
    days: int = Query(default=30, ge=1, le=365, description="Number of days to look back"),
    limit: int = Query(default=10, ge=1, le=100, description="Max number of tickers to return"),
) -> List[dict]:
    """
    Get most-discussed tickers in the last `days` days.
    Returns ticker, count, sentiment_score (avg), last_mentioned.
    CDN Cache: 5 minutes
    """
    return await recommendation_service.get_most_discussed_tickers(
        days=days,
        limit=limit,
    )
