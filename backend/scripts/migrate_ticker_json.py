#!/usr/bin/env python3
"""
Migrate existing ticker JSON files to the stock_translations database table.
Supports both US format (simple key-value) and TW format (nested objects).
"""

import os
import sys
import json
import logging
from pathlib import Path
# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))
from src.database.postgres import get_session, init_engine
from src.services.translation_service import TranslationService

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Default paths relative to project root
DEFAULT_US_PATH = "../Graph-Builder-Agent/data/seeds/ticker_map_us.json"
DEFAULT_TW_PATH = "../Graph-Builder-Agent/data/seeds/ticker_map_tw.json"


def migrate_us_tickers(file_path: str) -> tuple[int, int]:
    """
    Migrate US tickers from JSON file.
    Format: {"TICKER": "English Name"}
    Returns (imported, updated) counts.
    """
    if not os.path.exists(file_path):
        logger.warning(f"US ticker file not found: {file_path}")
        return 0, 0
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    imported = 0
    updated = 0
    init_engine()
    for session in get_session():
        service = TranslationService(session)
        for ticker, name_en in data.items():
            try:
                _, is_new = service.create_or_update(
                    ticker=ticker,
                    market="US",
                    name_en=name_en,
                    status="auto",
                    updated_by="migration_script"
                )
                if is_new:
                    imported += 1
                else:
                    updated += 1
            except Exception as e:
                logger.error(f"Error migrating {ticker}: {e}")
        break  # Only need one session
    logger.info(f"US tickers: {imported} imported, {updated} updated")
    return imported, updated


def migrate_tw_tickers(file_path: str) -> tuple[int, int]:
    """
    Migrate TW tickers from JSON file.
    Format: {"TICKER.TW": {"name_zh": "...", "name_en": "...", "alias": "..."}}
    Returns (imported, updated) counts.
    """
    if not os.path.exists(file_path):
        logger.warning(f"TW ticker file not found: {file_path}")
        return 0, 0
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    imported = 0
    updated = 0
    init_engine()
    for session in get_session():
        service = TranslationService(session)
        for ticker_with_suffix, info in data.items():
            try:
                # Remove .TW suffix for storage
                ticker = ticker_with_suffix.replace(".TW", "")
                name_zh = info.get("name_zh", "")
                name_en = info.get("name_en", "")
                _, is_new = service.create_or_update(
                    ticker=ticker,
                    market="TW",
                    name_en=name_en,
                    name_zh_tw=name_zh,
                    status="auto",
                    updated_by="migration_script"
                )
                if is_new:
                    imported += 1
                else:
                    updated += 1
            except Exception as e:
                logger.error(f"Error migrating {ticker_with_suffix}: {e}")
        break  # Only need one session
    logger.info(f"TW tickers: {imported} imported, {updated} updated")
    return imported, updated


def main():
    """Run the migration."""
    # Determine file paths
    script_dir = Path(__file__).parent.parent
    us_path = os.getenv("US_TICKER_PATH", str(script_dir / DEFAULT_US_PATH))
    tw_path = os.getenv("TW_TICKER_PATH", str(script_dir / DEFAULT_TW_PATH))
    logger.info("Starting ticker migration...")
    logger.info(f"US file: {us_path}")
    logger.info(f"TW file: {tw_path}")
    # Initialize database
    init_engine()
    # Create tables if they don't exist
    from src.database.postgres import create_all_tables
    from src.database import models  # noqa: F401
    create_all_tables()
    # Run migrations
    us_imported, us_updated = migrate_us_tickers(us_path)
    tw_imported, tw_updated = migrate_tw_tickers(tw_path)
    total_imported = us_imported + tw_imported
    total_updated = us_updated + tw_updated
    logger.info(f"Migration complete: {total_imported} imported, {total_updated} updated")


if __name__ == "__main__":
    main()
