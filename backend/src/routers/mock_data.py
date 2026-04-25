"""
Mock data endpoints for MEDIUM and LOW priority features
These endpoints return mock data until real implementations are available
"""
from fastapi import APIRouter, HTTPException, Path, Query
from typing import List
from pydantic import BaseModel
from src.services.podcast import PodcastService

router = APIRouter(prefix="/api", tags=["mock-data"])

# Initialize service
podcast_service = PodcastService()


# Response models
class Tag(BaseModel):
    id: str
    name: str
    episode_count: int


class TagsResponse(BaseModel):
    tags: List[Tag]


class EpisodesByTagResponse(BaseModel):
    tag: str
    episodes: List[dict]
    total: int


class MarketIndex(BaseModel):
    id: str
    name: str
    ticker: str
    value: str
    change: str
    isPositive: bool


class ConceptMetadata(BaseModel):
    id: str
    title: str
    description: str
    icon: str
    gradient: str


class TopMover(BaseModel):
    ticker: str
    name: str
    price: float
    change: float
    changePercent: float


# Mock data
MOCK_TAGS = [
    {"id": "ai-server", "name": "#AI伺服器", "episode_count": 15},
    {"id": "cooling", "name": "#散熱", "episode_count": 8},
    {"id": "semiconductor", "name": "#半導體", "episode_count": 23},
    {"id": "electric-vehicle", "name": "#電動車", "episode_count": 12},
    {"id": "renewable-energy", "name": "#再生能源", "episode_count": 7},
]

MOCK_MARKET_INDICES = [
    {"id": "taiwan-weighted", "name": "加權", "ticker": "TWII", "value": "18,234.56", "change": "+123.45", "isPositive": True},
    {"id": "otc", "name": "櫃買", "ticker": "OTC", "value": "245.67", "change": "-2.34", "isPositive": False},
    {"id": "nvda", "name": "NVDA", "ticker": "NVDA", "value": "485.23", "change": "+12.45", "isPositive": True},
]

MOCK_CONCEPTS = [
    {"id": "robotics", "title": "Robotics & Automation", "description": "Companies in robotics and automation", "icon": "🤖", "gradient": "from-blue-500 to-cyan-500"},
    {"id": "ai", "title": "Artificial Intelligence", "description": "AI and machine learning companies", "icon": "🧠", "gradient": "from-purple-500 to-pink-500"},
    {"id": "energy", "title": "Energy & Utilities", "description": "Energy sector companies", "icon": "⚡", "gradient": "from-yellow-500 to-orange-500"},
    {"id": "healthcare", "title": "Healthcare", "description": "Healthcare and biotech companies", "icon": "🏥", "gradient": "from-green-500 to-emerald-500"},
]

MOCK_TOP_MOVERS = [
    {"ticker": "NVDA", "name": "NVIDIA Corp", "price": 485.23, "change": 12.45, "changePercent": 2.64},
    {"ticker": "TSLA", "name": "Tesla Inc", "price": 245.67, "change": -5.23, "changePercent": -2.08},
    {"ticker": "AAPL", "name": "Apple Inc", "price": 178.45, "change": 3.21, "changePercent": 1.83},
    {"ticker": "AMD", "name": "Advanced Micro Devices", "price": 142.33, "change": 4.56, "changePercent": 3.31},
    {"ticker": "MSFT", "name": "Microsoft Corp", "price": 378.90, "change": 2.34, "changePercent": 0.62},
]


@router.get("/tags", response_model=TagsResponse)
async def get_tags():
    """
    Get list of available tags/topics with episode counts
    
    Returns real tag data from Firestore subcollections
    """
    try:
        tags = await podcast_service.get_all_tags()
        return TagsResponse(tags=[Tag(**tag) for tag in tags])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tags: {str(e)}")


@router.get("/episodes/by-tag/{tag}", response_model=EpisodesByTagResponse)
async def get_episodes_by_tag(
    tag: str = Path(..., description="Tag name or ID"),
    limit: int = Query(default=50, ge=1, le=200, description="Maximum number of episodes to return"),
    offset: int = Query(default=0, ge=0, description="Pagination offset"),
    include_content: bool = Query(default=False, description="Include heavy content fields (transcript, summary)")
):
    """
    Get episodes with a specific tag
    
    Returns real episode data from Firestore subcollections filtered by tag
    """
    try:
        episodes = await podcast_service.get_episodes_by_tag(
            tag=tag,
            limit=limit,
            offset=offset,
            enrich_content=include_content
        )
        
        # Convert Episode models to dicts for response
        episodes_dict = [ep.dict() for ep in episodes]
        
        return EpisodesByTagResponse(
            tag=tag,
            episodes=episodes_dict,
            total=len(episodes_dict)  # Approximate total (would need full count for accurate total)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching episodes by tag: {str(e)}")


@router.get("/market/indices", response_model=List[MarketIndex])
async def get_market_indices():
    """
    Get current market index values (MOCK DATA)
    
    Returns mock market indices data until real implementation is available
    """
    return [MarketIndex(**index) for index in MOCK_MARKET_INDICES]


@router.get("/concepts", response_model=List[ConceptMetadata])
async def get_concepts():
    """
    Get list of available industry concepts/themes (MOCK DATA)
    
    Returns mock concept metadata until real implementation is available
    """
    return [ConceptMetadata(**concept) for concept in MOCK_CONCEPTS]


@router.get("/top-movers", response_model=List[TopMover])
async def get_top_movers(
    limit: int = Query(default=10, ge=1, le=50, description="Maximum number of top movers to return")
):
    """
    Get list of top moving stocks by price change percentage (MOCK DATA)
    
    Returns mock top movers data until real implementation is available.
    Alternatively, can be derived from GET /api/stocks?sort_by=change_percent&order=desc&limit={limit}
    """
    return [TopMover(**mover) for mover in MOCK_TOP_MOVERS[:limit]]


