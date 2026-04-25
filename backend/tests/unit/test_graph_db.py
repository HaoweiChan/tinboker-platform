"""
Unit tests for graph database operations
"""
import pytest
from src.database.graph_db import (
    create_graph,
    get_graph_by_id,
    get_all_graphs,
    update_graph,
    delete_graph,
    add_node_to_graph,
    update_node,
    delete_node,
    add_edge_to_graph,
    update_edge,
    delete_edge,
)
from src.models.graph import GraphData, Node, Edge, NodeData, EdgeData, Position


class TestGraphDB:
    """Test graph database CRUD operations"""
    
    def test_create_graph(self, test_db, sample_graph_data):
        """Test creating a graph"""
        graph_id = create_graph(
            concept_id="ai",
            graph_data=sample_graph_data,
            graph_id="test-graph-1",
        )
        assert graph_id is not None
        
        # Verify graph was created
        graph = get_graph_by_id(graph_id)
        assert graph is not None
        assert len(graph.nodes) == 2
        assert len(graph.edges) == 1
    
    def test_get_graph_by_id(self, test_db, sample_graph_data):
        """Test retrieving graph by ID"""
        graph_id = create_graph("ai", sample_graph_data, graph_id="test-graph-1")
        
        graph = get_graph_by_id(graph_id)
        assert graph is not None
        assert len(graph.nodes) == 2
        # Check nodes exist (order not guaranteed)
        node_ids = {node.id for node in graph.nodes}
        assert "NVDA" in node_ids
        assert "MSFT" in node_ids
    
    def test_get_graph_not_found(self, test_db):
        """Test retrieving non-existent graph"""
        graph = get_graph_by_id("nonexistent")
        assert graph is None
    
    def test_get_all_graphs(self, test_db, sample_graph_data):
        """Test retrieving all graphs"""
        graph_id1 = create_graph("ai", sample_graph_data, graph_id="test-graph-1")
        
        # Create second graph
        from src.models.graph import GraphData, Node, NodeData, Position
        graph_data2 = GraphData(
            nodes=[
                Node(
                    id="TSLA",
                    type="stock",
                    data=NodeData(
                        label="Tesla",
                        ticker="TSLA",
                        marketCapTier="large",
                    ),
                    position=Position(x=0.0, y=0.0),
                ),
            ],
            edges=[],
        )
        graph_id2 = create_graph("robotics", graph_data2, graph_id="test-graph-2")
        
        graphs = get_all_graphs(sort_by="concept_id")
        assert len(graphs) == 2
    
    def test_update_graph(self, test_db, sample_graph_data):
        """Test updating graph metadata"""
        graph_id = create_graph("ai", sample_graph_data, graph_id="test-graph-1")
        
        result = update_graph(graph_id, concept_id="robotics")
        assert result is True
        
        graphs = get_all_graphs()
        updated_graph = next((g for g in graphs if g["id"] == graph_id), None)
        assert updated_graph is not None
        assert updated_graph["concept_id"] == "robotics"
    
    def test_delete_graph(self, test_db, sample_graph_data):
        """Test deleting graph"""
        graph_id = create_graph("ai", sample_graph_data, graph_id="test-graph-delete")
        
        # Verify graph exists
        graph = get_graph_by_id(graph_id)
        assert graph is not None
        
        result = delete_graph(graph_id)
        assert result is True
        
        # Verify graph is deleted
        graph = get_graph_by_id(graph_id)
        assert graph is None
    
    def test_add_node_to_graph(self, test_db, sample_graph_data):
        """Test adding node to graph"""
        graph_id = create_graph("ai", sample_graph_data, graph_id="test-graph-1")
        
        result = add_node_to_graph(
            graph_id=graph_id,
            node_id="AMD",
            node_type="stock",
            label="AMD",
            ticker="AMD",
            market_cap_tier="large",
            position_x=200.0,
            position_y=300.0,
        )
        assert result is True
        
        graph = get_graph_by_id(graph_id)
        assert len(graph.nodes) == 3
        assert any(node.id == "AMD" for node in graph.nodes)
    
    def test_update_node(self, test_db, sample_graph_data):
        """Test updating node"""
        graph_id = create_graph("ai", sample_graph_data, graph_id="test-graph-1")
        
        result = update_node(
            graph_id=graph_id,
            node_id="NVDA",
            position_x=150.0,
            position_y=250.0,
        )
        assert result is True
        
        graph = get_graph_by_id(graph_id)
        nvda_node = next((n for n in graph.nodes if n.id == "NVDA"), None)
        assert nvda_node is not None
        assert nvda_node.position.x == 150.0
        assert nvda_node.position.y == 250.0
    
    def test_delete_node(self, test_db, sample_graph_data):
        """Test deleting node"""
        graph_id = create_graph("ai", sample_graph_data, graph_id="test-graph-1")
        
        result = delete_node(graph_id, "NVDA")
        assert result is True
        
        graph = get_graph_by_id(graph_id)
        assert len(graph.nodes) == 1
        assert not any(node.id == "NVDA" for node in graph.nodes)
        # Edges connected to deleted node should also be deleted
        assert len(graph.edges) == 0
    
    def test_add_edge_to_graph(self, test_db, sample_graph_data):
        """Test adding edge to graph"""
        graph_id = create_graph("ai", sample_graph_data, graph_id="test-graph-1")
        
        result = add_edge_to_graph(
            graph_id=graph_id,
            edge_id="e2",
            source_node_id="MSFT",
            target_node_id="NVDA",
            label="Competition",
            category="components",
        )
        assert result is True
        
        graph = get_graph_by_id(graph_id)
        assert len(graph.edges) == 2
    
    def test_update_edge(self, test_db, sample_graph_data):
        """Test updating edge"""
        graph_id = create_graph("ai", sample_graph_data, graph_id="test-graph-1")
        
        result = update_edge(
            graph_id=graph_id,
            edge_id="e1",
            label="Updated Label",
            category="updated_category",
        )
        assert result is True
        
        graph = get_graph_by_id(graph_id)
        edge = next((e for e in graph.edges if e.id == "e1"), None)
        assert edge is not None
        assert edge.label == "Updated Label"
        assert edge.data.category == "updated_category"
    
    def test_delete_edge(self, test_db, sample_graph_data):
        """Test deleting edge"""
        graph_id = create_graph("ai", sample_graph_data, graph_id="test-graph-1")
        
        result = delete_edge(graph_id, "e1")
        assert result is True
        
        graph = get_graph_by_id(graph_id)
        assert len(graph.edges) == 0

