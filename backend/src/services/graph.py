"""
Graph service for managing graph data
"""
from typing import Optional, List
import json
from src.database.graph_db import (
    create_graph as db_create_graph,
    get_graph_by_id as db_get_graph_by_id,
    get_all_graphs as db_get_all_graphs,
    delete_graph as db_delete_graph,
    add_node_to_graph,
    update_node as db_update_node,
    delete_node as db_delete_node,
    add_edge_to_graph,
    update_edge as db_update_edge,
    delete_edge as db_delete_edge,
)
from src.models.graph import GraphData, GraphCreate, NodeCreate, NodeUpdate, EdgeCreate, EdgeUpdate
from src.services.stock import StockService
from src.cache.redis_client import cache_get, cache_set, cache_delete, cache_delete_pattern
from src.cache.cache_config import CACHE_TTL


class GraphService:
    """Service for graph operations"""
    
    def __init__(self, stock_service: Optional[StockService] = None):
        """
        Initialize graph service
        
        Args:
            stock_service: Optional stock service for fetching node information
        """
        self.stock_service = stock_service or StockService()
    
    async def create_graph(self, graph_create: GraphCreate, graph_id: Optional[str] = None) -> Optional[str]:
        """
        Create graph, fetching stock info for nodes if needed, and invalidate cache
        
        Args:
            graph_create: Graph creation data
            graph_id: Optional graph ID (auto-generated if not provided)
            
        Returns:
            Graph ID if successful, None otherwise
        """
        # Convert NodeCreate/EdgeCreate to Node/Edge format
        nodes = []
        for node_create in graph_create.nodes:
            # Fetch stock info if available (use async cached method)
            stock_info = await self._fetch_node_stock_info_async(node_create.ticker)
            
            from src.models.graph import NodeData, Position, Node
            node_data = NodeData(
                label=node_create.label,
                ticker=node_create.ticker,
                marketCapTier=node_create.marketCapTier
            )
            position = Position(x=node_create.position_x, y=node_create.position_y)
            node = Node(
                id=node_create.id,
                type=node_create.type,
                data=node_data,
                position=position
            )
            nodes.append(node)
        
        edges = []
        for edge_create in graph_create.edges:
            from src.models.graph import EdgeData, Edge
            edge_data = EdgeData(category=edge_create.category)
            edge = Edge(
                id=edge_create.id,
                source=edge_create.source,
                target=edge_create.target,
                label=edge_create.label,
                data=edge_data
            )
            edges.append(edge)
        
        graph_data = GraphData(nodes=nodes, edges=edges)
        result = db_create_graph(graph_create.concept_id, graph_data, graph_id)
        
        # Invalidate cache
        if result:
            await cache_delete_pattern("graph:list:*")
            if graph_id:
                await cache_delete(f"graph:{graph_id}")
        
        return result
    
    async def get_graph_by_id(self, graph_id: str) -> Optional[GraphData]:
        """
        Get graph by ID with caching
        
        Args:
            graph_id: Graph ID
            
        Returns:
            GraphData object or None if not found
        """
        cache_key = f"graph:{graph_id}"
        
        # Check cache first
        cached = await cache_get(cache_key)
        if cached:
            try:
                data = json.loads(cached)
                return GraphData(**data)
            except Exception:
                pass  # If deserialization fails, fetch fresh data
        
        # Cache miss - fetch from database
        graph = db_get_graph_by_id(graph_id)
        
        # Store in cache
        if graph:
            try:
                await cache_set(
                    cache_key,
                    json.dumps(graph.dict(), default=str),
                    CACHE_TTL["graph_data"]
                )
            except Exception:
                pass  # Cache failure shouldn't break the request
        
        return graph
    
    def get_graph_by_id_sync(self, graph_id: str) -> Optional[GraphData]:
        """Synchronous version for backward compatibility"""
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            return loop.run_until_complete(self.get_graph_by_id(graph_id))
        except RuntimeError:
            return asyncio.run(self.get_graph_by_id(graph_id))
    
    async def get_sorted_graphs(self, sort_by: str = "concept_id") -> List[dict]:
        """
        Get sorted graphs list with caching
        
        Args:
            sort_by: Sort field (concept_id, created_at, updated_at)
            
        Returns:
            List of graph dictionaries
        """
        cache_key = f"graph:list:{sort_by}"
        
        # Check cache first
        cached = await cache_get(cache_key)
        if cached:
            try:
                return json.loads(cached)
            except Exception:
                pass  # If deserialization fails, fetch fresh data
        
        # Cache miss - fetch from database
        graphs = db_get_all_graphs(sort_by=sort_by)
        
        # Store in cache
        try:
            await cache_set(
                cache_key,
                json.dumps(graphs, default=str),
                CACHE_TTL["graph_list"]
            )
        except Exception:
            pass  # Cache failure shouldn't break the request
        
        return graphs
    
    def get_sorted_graphs_sync(self, sort_by: str = "concept_id") -> List[dict]:
        """Synchronous version for backward compatibility"""
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            return loop.run_until_complete(self.get_sorted_graphs(sort_by=sort_by))
        except RuntimeError:
            return asyncio.run(self.get_sorted_graphs(sort_by=sort_by))
    
    async def update_node(
        self,
        graph_id: str,
        node_id: str,
        node_update: NodeUpdate,
    ) -> bool:
        """
        Update node in graph and invalidate cache
        
        Args:
            graph_id: Graph ID
            node_id: Node ID
            node_update: Node update data
            
        Returns:
            True if successful, False otherwise
        """
        result = db_update_node(
            graph_id=graph_id,
            node_id=node_id,
            label=node_update.label,
            ticker=node_update.ticker,
            market_cap_tier=node_update.marketCapTier,
            position_x=node_update.position_x,
            position_y=node_update.position_y,
        )
        
        # Invalidate cache
        if result:
            await cache_delete(f"graph:{graph_id}")
            await cache_delete_pattern("graph:list:*")
        
        return result
    
    async def update_edge(
        self,
        graph_id: str,
        edge_id: str,
        edge_update: EdgeUpdate,
    ) -> bool:
        """
        Update edge in graph and invalidate cache
        
        Args:
            graph_id: Graph ID
            edge_id: Edge ID
            edge_update: Edge update data
            
        Returns:
            True if successful, False otherwise
        """
        result = db_update_edge(
            graph_id=graph_id,
            edge_id=edge_id,
            source_node_id=edge_update.source,
            target_node_id=edge_update.target,
            label=edge_update.label,
            category=edge_update.category,
        )
        
        # Invalidate cache
        if result:
            await cache_delete(f"graph:{graph_id}")
            await cache_delete_pattern("graph:list:*")
        
        return result
    
    async def delete_graph(self, graph_id: str) -> bool:
        """
        Delete graph and invalidate cache
        
        Args:
            graph_id: Graph ID
            
        Returns:
            True if successful, False otherwise
        """
        result = db_delete_graph(graph_id)
        
        # Invalidate cache
        if result:
            await cache_delete(f"graph:{graph_id}")
            await cache_delete_pattern("graph:list:*")
        
        return result
    
    async def delete_node(self, graph_id: str, node_id: str) -> bool:
        """
        Delete node and cleanup edges, invalidate cache
        
        Args:
            graph_id: Graph ID
            node_id: Node ID
            
        Returns:
            True if successful, False otherwise
        """
        result = db_delete_node(graph_id, node_id)
        
        # Invalidate cache
        if result:
            await cache_delete(f"graph:{graph_id}")
            await cache_delete_pattern("graph:list:*")
        
        return result
    
    async def delete_edge(self, graph_id: str, edge_id: str) -> bool:
        """
        Delete edge and invalidate cache
        
        Args:
            graph_id: Graph ID
            edge_id: Edge ID
            
        Returns:
            True if successful, False otherwise
        """
        result = db_delete_edge(graph_id, edge_id)
        
        # Invalidate cache
        if result:
            await cache_delete(f"graph:{graph_id}")
            await cache_delete_pattern("graph:list:*")
        
        return result
    
    def add_node(
        self,
        graph_id: str,
        node_create: NodeCreate,
    ) -> bool:
        """
        Add node to graph
        
        Args:
            graph_id: Graph ID
            node_create: Node creation data
            
        Returns:
            True if successful, False otherwise
        """
        # Fetch stock info if available
        self._fetch_node_stock_info(node_create.ticker)
        
        return add_node_to_graph(
            graph_id=graph_id,
            node_id=node_create.id,
            node_type=node_create.type,
            label=node_create.label,
            ticker=node_create.ticker,
            market_cap_tier=node_create.marketCapTier,
            position_x=node_create.position_x,
            position_y=node_create.position_y,
        )
    
    def add_edge(
        self,
        graph_id: str,
        edge_create: EdgeCreate,
    ) -> bool:
        """
        Add edge to graph
        
        Args:
            graph_id: Graph ID
            edge_create: Edge creation data
            
        Returns:
            True if successful, False otherwise
        """
        return add_edge_to_graph(
            graph_id=graph_id,
            edge_id=edge_create.id,
            source_node_id=edge_create.source,
            target_node_id=edge_create.target,
            label=edge_create.label,
            category=edge_create.category,
        )
    
    async def _fetch_node_stock_info_async(self, ticker: str) -> Optional[dict]:
        """
        Async helper to fetch stock information for a node using cached stock service
        
        Args:
            ticker: Stock ticker symbol
            
        Returns:
            Stock info dict or None
        """
        try:
            stock_info = await self.stock_service.get_stock_basic_info_async(ticker)
            return stock_info
        except Exception as e:
            print(f"Error fetching stock info for {ticker}: {e}")
            return None
    
    def _fetch_node_stock_info(self, ticker: str) -> Optional[dict]:
        """
        Synchronous helper to fetch stock information for a node (backward compatibility)
        
        Args:
            ticker: Stock ticker symbol
            
        Returns:
            Stock info dict or None
        """
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            return loop.run_until_complete(self._fetch_node_stock_info_async(ticker))
        except RuntimeError:
            return asyncio.run(self._fetch_node_stock_info_async(ticker))

