"""
Company/stock router (for backward compatibility)
Redirects to stock router
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/company", tags=["company"])

# This router is kept for backward compatibility
# All functionality has been moved to the stock router

