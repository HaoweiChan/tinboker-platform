"""
Graph database CRUD operations
"""
import uuid
from typing import Optional, List
from src.database.db import get_connection
from src.models.graph import GraphData, Node, Edge, Position, NodeData, EdgeData


def create_graph(concept_id: str, graph_data: GraphData, graph_id: Optional[str] = None) -> Optional[str]:
    """Create graph with nodes and edges"""
    if not graph_id:
        graph_id = str(uuid.uuid4())
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Create graph record
        cursor.execute("""
            INSERT INTO graphs (id, concept_id, created_at, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """, (graph_id, concept_id))
        
        # Insert nodes
        for node in graph_data.nodes:
            cursor.execute("""
                INSERT INTO graph_nodes (
                    graph_id, node_id, node_type, label, ticker,
                    market_cap_tier, position_x, position_y
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                graph_id,
                node.id,
                node.type,
                node.data.label,
                node.data.ticker,
                node.data.marketCapTier,
                node.position.x,
                node.position.y
            ))
        
        # Insert edges
        for edge in graph_data.edges:
            cursor.execute("""
                INSERT INTO graph_edges (
                    graph_id, edge_id, source_node_id, target_node_id,
                    label, category
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (
                graph_id,
                edge.id,
                edge.source,
                edge.target,
                edge.label,
                edge.data.category
            ))
        
        conn.commit()
        return graph_id
    except Exception as e:
        conn.rollback()
        print(f"Error creating graph: {e}")
        return None
    finally:
        conn.close()


def get_graph_by_id(graph_id: str) -> Optional[GraphData]:
    """Get complete graph with nodes and edges"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # First check if graph exists
        cursor.execute("""
            SELECT id FROM graphs WHERE id = ?
        """, (graph_id,))
        
        if not cursor.fetchone():
            return None
        
        # Get nodes
        cursor.execute("""
            SELECT node_id, node_type, label, ticker, market_cap_tier,
                   position_x, position_y
            FROM graph_nodes
            WHERE graph_id = ?
        """, (graph_id,))
        
        node_rows = cursor.fetchall()
        nodes = []
        for row in node_rows:
            node_data = NodeData(
                label=row['label'],
                ticker=row['ticker'],
                marketCapTier=row['market_cap_tier']
            )
            position = Position(x=row['position_x'], y=row['position_y'])
            node = Node(
                id=row['node_id'],
                type=row['node_type'],
                data=node_data,
                position=position
            )
            nodes.append(node)
        
        # Get edges
        cursor.execute("""
            SELECT edge_id, source_node_id, target_node_id, label, category
            FROM graph_edges
            WHERE graph_id = ?
        """, (graph_id,))
        
        edge_rows = cursor.fetchall()
        edges = []
        for row in edge_rows:
            edge_data = EdgeData(category=row['category'])
            edge = Edge(
                id=row['edge_id'],
                source=row['source_node_id'],
                target=row['target_node_id'],
                label=row['label'],
                data=edge_data
            )
            edges.append(edge)
        
        return GraphData(nodes=nodes, edges=edges)
    except Exception as e:
        print(f"Error getting graph {graph_id}: {e}")
        return None
    finally:
        conn.close()


def get_all_graphs(sort_by: str = "concept_id") -> List[dict]:
    """Get all graphs sorted by specified field"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Validate sort_by
    valid_sorts = ["concept_id", "created_at", "updated_at"]
    if sort_by not in valid_sorts:
        sort_by = "concept_id"
    
    try:
        cursor.execute(f"""
            SELECT id, concept_id, created_at, updated_at
            FROM graphs
            ORDER BY {sort_by} ASC
        """)
        
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error getting all graphs: {e}")
        return []
    finally:
        conn.close()


def update_graph(graph_id: str, concept_id: Optional[str] = None) -> bool:
    """Update graph metadata"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        if concept_id:
            cursor.execute("""
                UPDATE graphs
                SET concept_id = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (concept_id, graph_id))
        else:
            cursor.execute("""
                UPDATE graphs
                SET updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (graph_id,))
        
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        conn.rollback()
        print(f"Error updating graph {graph_id}: {e}")
        return False
    finally:
        conn.close()


def delete_graph(graph_id: str) -> bool:
    """Delete graph and cascade delete nodes and edges"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("DELETE FROM graphs WHERE id = ?", (graph_id,))
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        conn.rollback()
        print(f"Error deleting graph {graph_id}: {e}")
        return False
    finally:
        conn.close()


def add_node_to_graph(
    graph_id: str,
    node_id: str,
    node_type: str,
    label: str,
    ticker: str,
    market_cap_tier: str,
    position_x: float,
    position_y: float,
) -> bool:
    """Add single node to graph"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT OR REPLACE INTO graph_nodes (
                graph_id, node_id, node_type, label, ticker,
                market_cap_tier, position_x, position_y
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (graph_id, node_id, node_type, label, ticker, market_cap_tier, position_x, position_y))
        
        # Update graph updated_at
        cursor.execute("""
            UPDATE graphs SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
        """, (graph_id,))
        
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print(f"Error adding node to graph {graph_id}: {e}")
        return False
    finally:
        conn.close()


def update_node(
    graph_id: str,
    node_id: str,
    label: Optional[str] = None,
    ticker: Optional[str] = None,
    market_cap_tier: Optional[str] = None,
    position_x: Optional[float] = None,
    position_y: Optional[float] = None,
) -> bool:
    """Update node position/data"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        updates = []
        params = []
        
        if label is not None:
            updates.append("label = ?")
            params.append(label)
        if ticker is not None:
            updates.append("ticker = ?")
            params.append(ticker)
        if market_cap_tier is not None:
            updates.append("market_cap_tier = ?")
            params.append(market_cap_tier)
        if position_x is not None:
            updates.append("position_x = ?")
            params.append(position_x)
        if position_y is not None:
            updates.append("position_y = ?")
            params.append(position_y)
        
        if not updates:
            return False
        
        params.extend([graph_id, node_id])
        
        cursor.execute(f"""
            UPDATE graph_nodes
            SET {', '.join(updates)}
            WHERE graph_id = ? AND node_id = ?
        """, params)
        
        # Update graph updated_at
        cursor.execute("""
            UPDATE graphs SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
        """, (graph_id,))
        
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        conn.rollback()
        print(f"Error updating node {node_id} in graph {graph_id}: {e}")
        return False
    finally:
        conn.close()


def delete_node(graph_id: str, node_id: str) -> bool:
    """Delete node and related edges"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Delete edges connected to this node
        cursor.execute("""
            DELETE FROM graph_edges
            WHERE graph_id = ? AND (source_node_id = ? OR target_node_id = ?)
        """, (graph_id, node_id, node_id))
        
        # Delete node
        cursor.execute("""
            DELETE FROM graph_nodes
            WHERE graph_id = ? AND node_id = ?
        """, (graph_id, node_id))
        
        # Update graph updated_at
        cursor.execute("""
            UPDATE graphs SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
        """, (graph_id,))
        
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        conn.rollback()
        print(f"Error deleting node {node_id} from graph {graph_id}: {e}")
        return False
    finally:
        conn.close()


def add_edge_to_graph(
    graph_id: str,
    edge_id: str,
    source_node_id: str,
    target_node_id: str,
    label: str,
    category: str,
) -> bool:
    """Add single edge to graph"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT OR REPLACE INTO graph_edges (
                graph_id, edge_id, source_node_id, target_node_id,
                label, category
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (graph_id, edge_id, source_node_id, target_node_id, label, category))
        
        # Update graph updated_at
        cursor.execute("""
            UPDATE graphs SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
        """, (graph_id,))
        
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print(f"Error adding edge to graph {graph_id}: {e}")
        return False
    finally:
        conn.close()


def update_edge(
    graph_id: str,
    edge_id: str,
    source_node_id: Optional[str] = None,
    target_node_id: Optional[str] = None,
    label: Optional[str] = None,
    category: Optional[str] = None,
) -> bool:
    """Update edge data"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        updates = []
        params = []
        
        if source_node_id is not None:
            updates.append("source_node_id = ?")
            params.append(source_node_id)
        if target_node_id is not None:
            updates.append("target_node_id = ?")
            params.append(target_node_id)
        if label is not None:
            updates.append("label = ?")
            params.append(label)
        if category is not None:
            updates.append("category = ?")
            params.append(category)
        
        if not updates:
            return False
        
        params.extend([graph_id, edge_id])
        
        cursor.execute(f"""
            UPDATE graph_edges
            SET {', '.join(updates)}
            WHERE graph_id = ? AND edge_id = ?
        """, params)
        
        # Update graph updated_at
        cursor.execute("""
            UPDATE graphs SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
        """, (graph_id,))
        
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        conn.rollback()
        print(f"Error updating edge {edge_id} in graph {graph_id}: {e}")
        return False
    finally:
        conn.close()


def delete_edge(graph_id: str, edge_id: str) -> bool:
    """Delete single edge"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            DELETE FROM graph_edges
            WHERE graph_id = ? AND edge_id = ?
        """, (graph_id, edge_id))
        
        # Update graph updated_at
        cursor.execute("""
            UPDATE graphs SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
        """, (graph_id,))
        
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        conn.rollback()
        print(f"Error deleting edge {edge_id} from graph {graph_id}: {e}")
        return False
    finally:
        conn.close()

