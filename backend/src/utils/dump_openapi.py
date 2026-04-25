"""
Utility script to dump OpenAPI schema to YAML file.

Usage:
    python -m src.utils.dump_openapi [output_file]

If output_file is not provided, defaults to src/schemas/openapi.yaml
"""
import sys
import yaml
from pathlib import Path

# Get project root (3 levels up from this file: src/utils/dump_openapi.py)
PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Mock FirestoreService to avoid credential requirements during schema dump
try:
    from unittest.mock import MagicMock
    import src.services.firestore_service
    src.services.firestore_service.FirestoreService = MagicMock()
except ImportError:
    pass  # In case imports fail, we let the main import fail naturally

from src.main import app


def dump_openapi_to_file(output_path: str = None):
    """Dump OpenAPI schema to YAML file"""
    if output_path is None:
        # Default to schemas directory in project root
        output_path = PROJECT_ROOT / "src" / "schemas" / "openapi.yaml"
    else:
        # If relative path, make it relative to project root
        output_path = Path(output_path)
        if not output_path.is_absolute():
            output_path = PROJECT_ROOT / output_path
    
    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Get OpenAPI schema from FastAPI app
    openapi_schema = app.openapi()
    
    # Convert to YAML
    yaml_content = yaml.dump(
        openapi_schema,
        default_flow_style=False,
        sort_keys=False,
        allow_unicode=True,
        indent=2
    )
    
    # Write to file
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(yaml_content)
    
    print(f"✅ OpenAPI schema dumped to: {output_path}")
    print(f"   File size: {len(yaml_content)} bytes")
    return output_path


if __name__ == "__main__":
    output_file = sys.argv[1] if len(sys.argv) > 1 else None
    dump_openapi_to_file(output_file)

