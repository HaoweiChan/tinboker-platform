"""Admin API endpoints for system status and monitoring."""

from fastapi import APIRouter, Depends

from src.auth.admin_auth import AdminAccess, get_admin_access
from src.schemas.system import SystemStatusResponse
from src.services.system_service import get_system_status

router = APIRouter(
    prefix="/api/admin/system",
    tags=["admin", "system"],
)


@router.get("/status", response_model=SystemStatusResponse)
async def system_status(
    admin: AdminAccess = Depends(get_admin_access),
):
    """
    Get system status for admin dashboard.

    Returns health metrics for:
    - Backend service (uptime, version)
    - Redis (connection status, memory usage)
    - PostgreSQL (connection pool status)
    - System metrics (CPU, memory, disk - if psutil available)
    """
    return await get_system_status()
