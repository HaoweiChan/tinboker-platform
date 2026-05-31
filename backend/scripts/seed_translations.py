#!/usr/bin/env python3
"""
One-shot bootstrap: seed stock_translations into the configured database.

Usage:
    docker exec tinboker-backend-dev python -m scripts.seed_translations
"""

import sys
import logging
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.database.postgres import get_session, init_engine, create_all_tables
from src.services.translation_service import TranslationService
from src.database import models  # noqa: F401 - register models with Base
from src.data.brand_colors import BRAND_COLORS
from src.data.seed_data import TRANSLATIONS

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def seed_translations() -> None:
    init_engine()
    create_all_tables()
    imported = 0
    updated = 0
    for session in get_session():
        service = TranslationService(session)
        for ticker, market, name_en, name_zh_tw, status in TRANSLATIONS:
            try:
                _, is_new = service.create_or_update(
                    ticker=ticker,
                    market=market,
                    name_en=name_en,
                    name_zh_tw=name_zh_tw,
                    status=status,
                    updated_by="seed_script",
                    brand_color=BRAND_COLORS.get(ticker),
                )
                if is_new:
                    imported += 1
                else:
                    updated += 1
            except Exception as e:
                logger.error(f"Error seeding {market}:{ticker}: {e}")
        break
    logger.info(f"Seeding complete: {imported} imported, {updated} updated")


if __name__ == "__main__":
    seed_translations()
