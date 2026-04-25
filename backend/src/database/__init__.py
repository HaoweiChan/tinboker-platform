"""
Database module initialization
"""
from .db import init_db, get_connection, get_db_path
from .stock_db import (
    create_or_update_stock,
    get_stock_by_ticker,
    get_all_stocks,
    add_price_history,
    get_price_history,
    get_latest_price,
    delete_stock,
)
from .graph_db import (
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
from .news_db import (
    create_news,
    get_news_by_id,
    get_all_news,
    update_news,
    delete_news,
    get_news_by_tickers,
)

__all__ = [
    # Database initialization
    "init_db",
    "get_connection",
    "get_db_path",
    # Stock operations
    "create_or_update_stock",
    "get_stock_by_ticker",
    "get_all_stocks",
    "add_price_history",
    "get_price_history",
    "get_latest_price",
    "delete_stock",
    # Graph operations
    "create_graph",
    "get_graph_by_id",
    "get_all_graphs",
    "update_graph",
    "delete_graph",
    "add_node_to_graph",
    "update_node",
    "delete_node",
    "add_edge_to_graph",
    "update_edge",
    "delete_edge",
    # News operations
    "create_news",
    "get_news_by_id",
    "get_all_news",
    "update_news",
    "delete_news",
    "get_news_by_tickers",
]

