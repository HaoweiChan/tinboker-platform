"""Smoke tests: verify key imports and class instantiation before restructuring.

These tests serve as a regression guard for the monorepo refactor.
They only check import-level concerns -- no external services needed.
"""

import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))


def test_typer_app_exists():
    from apps.cli.main import app
    assert app is not None
    assert hasattr(app, "command")


def test_graph_service_instantiates():
    from services.graph_service import GraphService
    gs = GraphService()
    assert gs is not None


def test_wiki_store_instantiates(tmp_path):
    from graph.store.wiki_store import WikiStore
    store = WikiStore(
        store_path=str(tmp_path / "test_kg.json"),
        wiki_root=str(tmp_path / "wiki"),
    )
    assert store is not None
    store.initialize_schema()
    assert (tmp_path / "test_kg.json").exists()


def test_graph_models_importable():
    from graph.models import Entity, Edge, Evidence
    e = Entity(id="test", type="Company", props={"name": "Test"})
    assert e.id == "test"


def test_graph_store_base_importable():
    from graph.store.base import GraphStore
    assert GraphStore is not None


def test_extraction_service_importable():
    from services.extraction_service import ExtractionService
    assert callable(ExtractionService)


def test_ingestion_service_importable():
    from services.ingestion_service import IngestionService
    assert callable(IngestionService)


def test_config_module_importable():
    from utils.config import load_env_file, get_llm_config
    assert callable(load_env_file)
    assert callable(get_llm_config)
