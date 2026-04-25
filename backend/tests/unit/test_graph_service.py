"""
Unit tests for graph service
"""
import pytest
from unittest.mock import Mock, patch
from src.services.graph import GraphService
from src.models.graph import GraphCreate, NodeCreate, EdgeCreate


class TestGraphService:
    """Test graph service operations"""
    
    def test_create_graph(self, test_db, sample_graph_data):
        """Test creating a graph"""
        service = GraphService()
        # Convert GraphData to GraphCreate for service
        from src.models.graph import GraphCreate, NodeCreate, EdgeCreate
        graph_create = GraphCreate(
            conceptId="ai",
            nodes=[
                NodeCreate(
                    id=node.id,
                    type=node.type,
                    label=node.data.label,
                    ticker=node.data.ticker,
                    marketCapTier=node.data.marketCapTier,
                    positionX=node.position.x,
                    positionY=node.position.y,
                )
                for node in sample_graph_data.nodes
            ],
            edges=[
                EdgeCreate(
                    id=edge.id,
                    source=edge.source,
                    target=edge.target,
                    label=edge.label,
                    category=edge.data.category,
                )
                for edge in sample_graph_data.edges
            ],
        )
        graph_id = service.create_graph(graph_create)
        
        assert graph_id is not None
        
        graph = service.get_graph_by_id(graph_id)
        assert graph is not None
        assert len(graph.nodes) == 2
        assert len(graph.edges) == 1
    
    def test_get_graph_by_id(self, test_db, sample_graph_data):
        """Test retrieving graph by ID"""
        service = GraphService()
        # Convert GraphData to GraphCreate for service
        from src.models.graph import GraphCreate, NodeCreate, EdgeCreate
        graph_create = GraphCreate(
            conceptId="ai",
            nodes=[
                NodeCreate(
                    id=node.id,
                    type=node.type,
                    label=node.data.label,
                    ticker=node.data.ticker,
                    marketCapTier=node.data.marketCapTier,
                    positionX=node.position.x,
                    positionY=node.position.y,
                )
                for node in sample_graph_data.nodes
            ],
            edges=[
                EdgeCreate(
                    id=edge.id,
                    source=edge.source,
                    target=edge.target,
                    label=edge.label,
                    category=edge.data.category,
                )
                for edge in sample_graph_data.edges
            ],
        )
        graph_id = service.create_graph(graph_create)
        
        graph = service.get_graph_by_id(graph_id)
        assert graph is not None
        assert len(graph.nodes) == 2
    
    def test_get_sorted_graphs(self, test_db, sample_graph_data):
        """Test getting sorted graphs"""
        service = GraphService()
        # Convert GraphData to GraphCreate for service
        from src.models.graph import GraphCreate, NodeCreate, EdgeCreate
        graph_create = GraphCreate(
            conceptId="ai",
            nodes=[
                NodeCreate(
                    id=node.id,
                    type=node.type,
                    label=node.data.label,
                    ticker=node.data.ticker,
                    marketCapTier=node.data.marketCapTier,
                    positionX=node.position.x,
                    positionY=node.position.y,
                )
                for node in sample_graph_data.nodes
            ],
            edges=[
                EdgeCreate(
                    id=edge.id,
                    source=edge.source,
                    target=edge.target,
                    label=edge.label,
                    category=edge.data.category,
                )
                for edge in sample_graph_data.edges
            ],
        )
        service.create_graph(graph_create)
        
        # Create second graph
        graph_data2 = GraphCreate(
            conceptId="robotics",
            nodes=[
                NodeCreate(
                    id="TSLA",
                    type="stock",
                    label="Tesla",
                    ticker="TSLA",
                    marketCapTier="large",
                    positionX=0.0,
                    positionY=0.0,
                ),
            ],
            edges=[],
        )
        service.create_graph(graph_data2)
        
        graphs = service.get_sorted_graphs(sort_by="concept_id")
        assert len(graphs) == 2
    
    def test_update_node(self, test_db, sample_graph_data):
        """Test updating node"""
        service = GraphService()
        from src.models.graph import GraphCreate, NodeCreate, EdgeCreate
        graph_create = GraphCreate(
            conceptId="ai",
            nodes=[
                NodeCreate(
                    id=node.id,
                    type=node.type,
                    label=node.data.label,
                    ticker=node.data.ticker,
                    marketCapTier=node.data.marketCapTier,
                    positionX=node.position.x,
                    positionY=node.position.y,
                )
                for node in sample_graph_data.nodes
            ],
            edges=[
                EdgeCreate(
                    id=edge.id,
                    source=edge.source,
                    target=edge.target,
                    label=edge.label,
                    category=edge.data.category,
                )
                for edge in sample_graph_data.edges
            ],
        )
        graph_id = service.create_graph(graph_create)
        
        from src.models.graph import NodeUpdate
        node_update = NodeUpdate(position_x=150.0, position_y=250.0)
        
        result = service.update_node(graph_id, "NVDA", node_update)
        assert result is True
        
        graph = service.get_graph_by_id(graph_id)
        nvda_node = next((n for n in graph.nodes if n.id == "NVDA"), None)
        assert nvda_node is not None
        assert nvda_node.position.x == 150.0
    
    def test_update_edge(self, test_db, sample_graph_data):
        """Test updating edge"""
        service = GraphService()
        from src.models.graph import GraphCreate, NodeCreate, EdgeCreate
        graph_create = GraphCreate(
            conceptId="ai",
            nodes=[
                NodeCreate(
                    id=node.id,
                    type=node.type,
                    label=node.data.label,
                    ticker=node.data.ticker,
                    marketCapTier=node.data.marketCapTier,
                    positionX=node.position.x,
                    positionY=node.position.y,
                )
                for node in sample_graph_data.nodes
            ],
            edges=[
                EdgeCreate(
                    id=edge.id,
                    source=edge.source,
                    target=edge.target,
                    label=edge.label,
                    category=edge.data.category,
                )
                for edge in sample_graph_data.edges
            ],
        )
        graph_id = service.create_graph(graph_create)
        
        from src.models.graph import EdgeUpdate
        edge_update = EdgeUpdate(label="Updated Label", category="updated_category")
        
        result = service.update_edge(graph_id, "e1", edge_update)
        assert result is True
        
        graph = service.get_graph_by_id(graph_id)
        edge = next((e for e in graph.edges if e.id == "e1"), None)
        assert edge is not None
        assert edge.label == "Updated Label"
    
    def test_delete_graph(self, test_db, sample_graph_data):
        """Test deleting graph"""
        service = GraphService()
        from src.models.graph import GraphCreate, NodeCreate, EdgeCreate
        graph_create = GraphCreate(
            conceptId="ai",
            nodes=[
                NodeCreate(
                    id=node.id,
                    type=node.type,
                    label=node.data.label,
                    ticker=node.data.ticker,
                    marketCapTier=node.data.marketCapTier,
                    positionX=node.position.x,
                    positionY=node.position.y,
                )
                for node in sample_graph_data.nodes
            ],
            edges=[
                EdgeCreate(
                    id=edge.id,
                    source=edge.source,
                    target=edge.target,
                    label=edge.label,
                    category=edge.data.category,
                )
                for edge in sample_graph_data.edges
            ],
        )
        graph_id = service.create_graph(graph_create)
        
        result = service.delete_graph(graph_id)
        assert result is True
        
        graph = service.get_graph_by_id(graph_id)
        assert graph is None
    
    def test_delete_node(self, test_db, sample_graph_data):
        """Test deleting node"""
        service = GraphService()
        from src.models.graph import GraphCreate, NodeCreate, EdgeCreate
        graph_create = GraphCreate(
            conceptId="ai",
            nodes=[
                NodeCreate(
                    id=node.id,
                    type=node.type,
                    label=node.data.label,
                    ticker=node.data.ticker,
                    marketCapTier=node.data.marketCapTier,
                    positionX=node.position.x,
                    positionY=node.position.y,
                )
                for node in sample_graph_data.nodes
            ],
            edges=[
                EdgeCreate(
                    id=edge.id,
                    source=edge.source,
                    target=edge.target,
                    label=edge.label,
                    category=edge.data.category,
                )
                for edge in sample_graph_data.edges
            ],
        )
        graph_id = service.create_graph(graph_create)
        
        result = service.delete_node(graph_id, "NVDA")
        assert result is True
        
        graph = service.get_graph_by_id(graph_id)
        assert len(graph.nodes) == 1
        assert not any(node.id == "NVDA" for node in graph.nodes)
    
    def test_delete_edge(self, test_db, sample_graph_data):
        """Test deleting edge"""
        service = GraphService()
        from src.models.graph import GraphCreate, NodeCreate, EdgeCreate
        graph_create = GraphCreate(
            conceptId="ai",
            nodes=[
                NodeCreate(
                    id=node.id,
                    type=node.type,
                    label=node.data.label,
                    ticker=node.data.ticker,
                    marketCapTier=node.data.marketCapTier,
                    positionX=node.position.x,
                    positionY=node.position.y,
                )
                for node in sample_graph_data.nodes
            ],
            edges=[
                EdgeCreate(
                    id=edge.id,
                    source=edge.source,
                    target=edge.target,
                    label=edge.label,
                    category=edge.data.category,
                )
                for edge in sample_graph_data.edges
            ],
        )
        graph_id = service.create_graph(graph_create)
        
        result = service.delete_edge(graph_id, "e1")
        assert result is True
        
        graph = service.get_graph_by_id(graph_id)
        assert len(graph.edges) == 0

