"""
Visual Graph API router
"""
from fastapi import APIRouter
from src.services.visual_graph import VisualGraphService

router = APIRouter(prefix="/api/visuals", tags=["visuals"])

# Initialize service
visual_graph_service = VisualGraphService()


@router.get("/supply-chain")
async def get_supply_chain():
    """
    Get supply chain visualization graph
    
    Returns layered supply chain visualization graph data with real financial data
    """
    return await visual_graph_service.get_supply_chain_data()


@router.get("/ownership")
async def get_ownership():
    """
    Get ownership tree visualization graph
    
    Returns hierarchical ownership visualization data with real financial data
    """
    return await visual_graph_service.get_ownership_data()


@router.get("/cluster")
async def get_cluster():
    """
    Get cluster visualization graph
    
    Returns cluster/force-directed visualization data with real financial data
    """
    return await visual_graph_service.get_cluster_data()


@router.get("/interactive-models")
async def get_interactive_models():
    """
    Get interactive models
    
    Returns list of interactive article/visualization models for the homepage/news experience
    """
    return await visual_graph_service.get_interactive_models()

