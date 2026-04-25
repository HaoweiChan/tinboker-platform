"""System status service for admin dashboard."""

import logging
import time
from datetime import datetime

from src.cache.redis_client import RedisClient
from src.config import settings
from src.schemas.system import (
    BackendStatus,
    PostgresStatus,
    RedisStatus,
    ServiceHealth,
    SystemMetrics,
    SystemStatusResponse,
)

logger = logging.getLogger(__name__)

# Track application start time for uptime calculation
_start_time: float = time.time()


def get_uptime_seconds() -> float:
    """Get application uptime in seconds."""
    return time.time() - _start_time


async def get_redis_status() -> RedisStatus:
    """Get Redis connection status and memory usage."""
    try:
        redis_available = await RedisClient.is_available()
        if not redis_available:
            return RedisStatus(
                status="unhealthy",
                connected=False,
                message="Redis not connected",
            )

        redis = await RedisClient.get_client()
        if redis:
            info = await redis.info("memory")
            memory_mb = info.get("used_memory", 0) / (1024 * 1024)
            return RedisStatus(
                status="healthy",
                connected=True,
                memory_mb=round(memory_mb, 2),
            )

        return RedisStatus(
            status="unhealthy",
            connected=False,
            message="Redis client unavailable",
        )
    except Exception as e:
        logger.warning(f"Error getting Redis status: {e}")
        return RedisStatus(
            status="unhealthy",
            connected=False,
            message=str(e),
        )


async def get_postgres_status() -> PostgresStatus:
    """Get PostgreSQL connection pool status."""
    if not settings.use_postgres:
        return PostgresStatus(
            status="healthy",
            connected=True,
            message="Using SQLite (PostgreSQL disabled)",
        )

    try:
        from src.database.postgres import engine

        if engine is None:
            return PostgresStatus(
                status="unhealthy",
                connected=False,
                message="PostgreSQL engine not initialized",
            )

        # Get pool status from SQLAlchemy
        pool = engine.pool
        pool_size = pool.size()
        checked_in = pool.checkedin()
        checked_out = pool.checkedout()
        overflow = pool.overflow()

        # Determine health based on pool usage
        total_connections = checked_in + checked_out
        max_connections = pool_size + (pool._max_overflow if hasattr(pool, "_max_overflow") else 20)
        usage_percent = (checked_out / max_connections) * 100 if max_connections > 0 else 0

        if usage_percent > 90:
            status = "degraded"
        else:
            status = "healthy"

        return PostgresStatus(
            status=status,
            connected=True,
            pool_size=pool_size,
            active_connections=checked_out,
            idle_connections=checked_in,
        )
    except ImportError:
        return PostgresStatus(
            status="unhealthy",
            connected=False,
            message="PostgreSQL module not available",
        )
    except Exception as e:
        logger.warning(f"Error getting PostgreSQL status: {e}")
        return PostgresStatus(
            status="unhealthy",
            connected=False,
            message=str(e),
        )


async def get_system_metrics() -> SystemMetrics | None:
    """Get basic system metrics (CPU, memory, disk)."""
    try:
        import psutil

        return SystemMetrics(
            cpu_percent=psutil.cpu_percent(interval=0.1),
            memory_percent=psutil.virtual_memory().percent,
            disk_percent=psutil.disk_usage("/").percent,
        )
    except ImportError:
        # psutil not installed, skip system metrics
        logger.debug("psutil not available, skipping system metrics")
        return None
    except Exception as e:
        logger.warning(f"Error getting system metrics: {e}")
        return None


async def get_system_status() -> SystemStatusResponse:
    """Get complete system status for admin dashboard."""
    # Get individual service statuses
    backend = BackendStatus(
        status="healthy",
        uptime_seconds=round(get_uptime_seconds(), 2),
        version=settings.api_version,
    )
    redis = await get_redis_status()
    postgres = await get_postgres_status()
    system = await get_system_metrics()

    # Build service summary
    services: dict[str, ServiceHealth] = {
        "backend": ServiceHealth(status=backend.status),
        "redis": ServiceHealth(status=redis.status, message=redis.message),
        "postgres": ServiceHealth(status=postgres.status, message=postgres.message),
    }

    return SystemStatusResponse(
        timestamp=datetime.utcnow(),
        services=services,
        backend=backend,
        redis=redis,
        postgres=postgres,
        system=system,
    )
