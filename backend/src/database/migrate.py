"""
Database migration script for Render deployment
"""
import sys
from src.database.db import init_db

if __name__ == "__main__":
    try:
        print("Initializing database...")
        init_db()
        print("Database initialization completed successfully")
        sys.exit(0)
    except Exception as e:
        print(f"Error initializing database: {e}")
        sys.exit(1)

