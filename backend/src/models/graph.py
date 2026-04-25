"""
Graph-related Pydantic models
"""
from pydantic import BaseModel, Field
from typing import Literal, Optional


class Position(BaseModel):
    """2D position coordinates"""
    x: float = Field(..., description="X coordinate")
    y: float = Field(..., description="Y coordinate")


class NodeData(BaseModel):
    """Data payload for graph node"""
    label: str = Field(..., description="Display label for the node")
    ticker: str = Field(..., description="Stock ticker symbol")
    marketCapTier: str = Field(
        ..., 
        alias="marketCapTier",
        description="Market capitalization tier (large/medium/small)"
    )

    class Config:
        populate_by_name = True


class Node(BaseModel):
    """Graph node representing a stock"""
    id: str = Field(..., description="Unique node identifier (ticker)")
    type: str = Field(..., description="Node type (e.g., 'stock')")
    data: NodeData = Field(..., description="Node data payload")
    position: Position = Field(..., description="Node position in graph")


class EdgeData(BaseModel):
    """Data payload for graph edge"""
    category: str = Field(..., description="Edge category (e.g., 'aiChips', 'automation', 'components')")


class Edge(BaseModel):
    """Graph edge representing relationship between stocks"""
    id: str = Field(..., description="Unique edge identifier")
    source: str = Field(..., description="Source node ID (ticker)")
    target: str = Field(..., description="Target node ID (ticker)")
    label: str = Field(..., description="Display label for the edge")
    data: EdgeData = Field(..., description="Edge data payload")


class GraphData(BaseModel):
    """Complete graph structure with nodes and edges"""
    nodes: list[Node] = Field(..., description="List of graph nodes")
    edges: list[Edge] = Field(..., description="List of graph edges")


ConceptType = Literal["robotics", "ai", "energy"]


class ConceptMetadata(BaseModel):
    """Metadata for a concept/theme"""
    id: ConceptType = Field(..., description="Unique concept identifier")
    title: str = Field(..., description="Display title")
    description: str = Field(..., description="Concept description")
    icon: str = Field(..., description="Icon identifier")
    gradient: str = Field(..., description="CSS gradient class for styling")


# Create/Update models for graph operations
class NodeCreate(BaseModel):
    """Node creation model"""
    id: str = Field(..., description="Unique node identifier (ticker)")
    type: str = Field(default="stock", description="Node type")
    label: str = Field(..., description="Display label for the node")
    ticker: str = Field(..., description="Stock ticker symbol")
    marketCapTier: str = Field(..., alias="marketCapTier", description="Market capitalization tier")
    position_x: float = Field(..., alias="positionX", description="X coordinate")
    position_y: float = Field(..., alias="positionY", description="Y coordinate")

    class Config:
        populate_by_name = True


class NodeUpdate(BaseModel):
    """Node update model - all fields optional"""
    label: Optional[str] = Field(None, description="Display label for the node")
    ticker: Optional[str] = Field(None, description="Stock ticker symbol")
    marketCapTier: Optional[str] = Field(None, alias="marketCapTier", description="Market capitalization tier")
    position_x: Optional[float] = Field(None, alias="positionX", description="X coordinate")
    position_y: Optional[float] = Field(None, alias="positionY", description="Y coordinate")

    class Config:
        populate_by_name = True


class EdgeCreate(BaseModel):
    """Edge creation model"""
    id: str = Field(..., description="Unique edge identifier")
    source: str = Field(..., description="Source node ID (ticker)")
    target: str = Field(..., description="Target node ID (ticker)")
    label: str = Field(..., description="Display label for the edge")
    category: str = Field(..., description="Edge category")


class EdgeUpdate(BaseModel):
    """Edge update model - all fields optional"""
    source: Optional[str] = Field(None, description="Source node ID (ticker)")
    target: Optional[str] = Field(None, description="Target node ID (ticker)")
    label: Optional[str] = Field(None, description="Display label for the edge")
    category: Optional[str] = Field(None, description="Edge category")


class GraphCreate(BaseModel):
    """Graph creation model"""
    concept_id: ConceptType = Field(..., alias="conceptId", description="Concept identifier")
    nodes: list[NodeCreate] = Field(..., description="List of nodes")
    edges: list[EdgeCreate] = Field(..., description="List of edges")

    class Config:
        populate_by_name = True


class GraphUpdate(BaseModel):
    """Graph update model"""
    concept_id: Optional[ConceptType] = Field(None, alias="conceptId", description="Concept identifier")
    nodes: Optional[list[NodeCreate]] = Field(None, description="List of nodes to update/add")
    edges: Optional[list[EdgeCreate]] = Field(None, description="List of edges to update/add")

    class Config:
        populate_by_name = True

