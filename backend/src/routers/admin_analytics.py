"""
Admin Analytics API - Fetches analytics data from Cloudflare.
"""
import logging
from fastapi import APIRouter, Depends

from src.auth.admin_auth import AdminAccess, get_admin_access

router = APIRouter(prefix="/api/admin/analytics", tags=["admin-analytics"])
logger = logging.getLogger(__name__)


@router.get("/overview")
async def get_analytics_overview(
    days: int = 7,
    admin: AdminAccess = Depends(get_admin_access)
):
    """
    Get analytics overview - currently returns placeholder data.
    Real analytics data available in Cloudflare dashboard.
    Requires admin authentication (admin token or whitelisted user).
    """
    # Return placeholder data with links to actual dashboards
    # Cloudflare Web Analytics GraphQL API has complex field names that vary by product
    # For now, direct users to the dashboard for detailed analytics
    return {
        "configured": True,
        "message": "Use Cloudflare dashboard for detailed analytics",
        "data": {
            "pageViews": "—",
            "uniqueVisitors": "—",
            "visits": "—",
            "requests": "—",
            "period": f"Last {days} days",
        },
        "dashboards": {
            "cloudflare": "https://dash.cloudflare.com",
            "googleAnalytics": "https://analytics.google.com",
        }
    }
