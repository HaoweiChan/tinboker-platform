"""
PostgreSQL connection for recommendation/podcast_db.
Data is prepared elsewhere; this module only provides read-only access.
Uses POSTGRES_* env vars (or config recommendation_postgres_*) from .env lines 48-55.
"""
import logging
from contextlib import contextmanager
from typing import Optional, Generator, Any

from src.config import settings

logger = logging.getLogger(__name__)

_pool: Optional[Any] = None


def init_pool() -> None:
    """Initialize the recommendation Postgres connection pool."""
    global _pool
    conn_str = settings.recommendation_postgres_connection_string
    if not conn_str:
        logger.warning("Recommendation Postgres not configured (no POSTGRES_PASSWORD / recommendation_postgres_*).")
        return
    try:
        import psycopg2.pool
        _pool = psycopg2.pool.ThreadedConnectionPool(
            minconn=1,
            maxconn=10,
            dsn=conn_str,
        )
        logger.info("Recommendation Postgres connection pool initialized (podcast_db).")
    except Exception as e:
        logger.warning("Could not initialize recommendation Postgres pool: %s", e)
        _pool = None


def close_pool() -> None:
    """Close the recommendation Postgres connection pool."""
    global _pool
    if _pool:
        try:
            _pool.closeall()
        except Exception as e:
            logger.warning("Error closing recommendation Postgres pool: %s", e)
        _pool = None


def get_pool() -> Optional[Any]:
    """Return the recommendation Postgres pool, or None if not configured."""
    return _pool


@contextmanager
def get_connection() -> Generator:
    """
    Yield a connection from the recommendation Postgres pool.
    Use as: with get_connection() as conn: ...
    """
    pool = get_pool()
    if not pool:
        raise RuntimeError("Recommendation Postgres pool not initialized; check POSTGRES_* env vars.")
    conn = pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)


def is_available() -> bool:
    """Return True if the recommendation Postgres pool is initialized and usable."""
    return _pool is not None
