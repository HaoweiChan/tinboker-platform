"""Admin: read-only view of the agents' podcast pipeline configuration.

Serves a committed static snapshot (see src/data/pipeline_settings_snapshot.py). The
tinboker-agents repo is the source of truth; this is for operator reference, not a
live read or an editable config.
"""

from fastapi import APIRouter, Depends

from src.auth.admin_auth import get_admin_access, AdminAccess
from src.data.pipeline_settings_snapshot import PIPELINE_SETTINGS, SNAPSHOT_META

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/pipeline-settings")
async def get_pipeline_settings(admin: AdminAccess = Depends(get_admin_access)):
    """Read-only snapshot of the agents' podcast pipeline config (default.yaml)."""
    return {"meta": SNAPSHOT_META, "settings": PIPELINE_SETTINGS}
