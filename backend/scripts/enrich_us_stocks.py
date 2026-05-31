#!/usr/bin/env python3
"""
Enrich US stock translations with ~140 additional popular tickers.

Adds entries with status="auto" (machine-generated); promote to "approved"
via the admin portal after reviewing the zh-TW names.

Usage:
    docker exec tinboker-backend-dev python -m scripts.enrich_us_stocks
"""

import sys
import logging
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.database.postgres import get_session, init_engine, create_all_tables
from src.services.translation_service import TranslationService
from src.database import models  # noqa: F401 - register models with Base
from src.data.brand_colors import BRAND_COLORS
from src.data.us_stocks import US_STOCK_TRANSLATIONS

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def enrich_us_stocks() -> None:
    init_engine()
    create_all_tables()
    for session in get_session():
        service = TranslationService(session)
        inserted = service.backfill_translations(US_STOCK_TRANSLATIONS, BRAND_COLORS)
        logger.info(f"Enrichment complete: {inserted} inserted (existing rows untouched)")
        break


if __name__ == "__main__":
    enrich_us_stocks()
