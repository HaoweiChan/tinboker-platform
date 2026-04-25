"""
Database initialization script.
Creates all tables defined in the models.
"""

import logging
import sys
from pathlib import Path
# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))
from src.database.postgres import create_all_tables, init_engine, engine
from src.database import models  # noqa: F401 - Import to register models with Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main():
    """Initialize database and create all tables."""
    logger.info("Starting database initialization...")
    try:
        init_engine()
        logger.info(f"Database engine initialized. Using: {engine.url}")
        create_all_tables()
        logger.info("Database initialization completed successfully.")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise


if __name__ == "__main__":
    main()
