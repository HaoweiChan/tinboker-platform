import os
import json

from datetime import timedelta
from dotenv import load_dotenv
from google.cloud import storage
from google.oauth2 import service_account
from fastapi import APIRouter, HTTPException

# Load environment variables from .env file
load_dotenv()

router = APIRouter(prefix="/api/content", tags=["content"])

BUCKET = os.getenv("CONTENT_BUCKET")
PREFIX = os.getenv("CONTENT_PREFIX", "").strip("/ ")
TTL = int(os.getenv("CONTENT_URL_TTL", "3600"))

_client: storage.Client | None = None


def _build_client() -> storage.Client:
    """Create a storage client, optionally using a JSON key from env."""
    # Check both GCS_SERVICE_ACCOUNT_JSON and GCP_CREDENTIALS_JSON for consistency
    service_account_json = os.getenv("GCS_SERVICE_ACCOUNT_JSON") or os.getenv("GCP_CREDENTIALS_JSON")
    if service_account_json:
        try:
            info = json.loads(service_account_json)
            credentials = service_account.Credentials.from_service_account_info(info)
            return storage.Client(credentials=credentials, project=info.get("project_id"))
        except Exception as exc:  # pragma: no cover - initialization only
            raise HTTPException(status_code=500, detail=f"Invalid GCS credentials: {exc}")
    return storage.Client()


def _get_client() -> storage.Client:
    global _client
    if _client is None:
        _client = _build_client()
    return _client


def _blob_path(*parts: str) -> str:
    parts = [p for p in parts if p]
    return "/".join(parts)


def _ensure_bucket():
    if not BUCKET:
        raise HTTPException(status_code=500, detail="CONTENT_BUCKET is not configured")
    return _get_client().bucket(BUCKET)


def _signed_url(path: str) -> str:
    bucket = _ensure_bucket()
    blob = bucket.blob(path)
    if not blob.exists():
        raise HTTPException(status_code=404, detail=f"Object not found: {path}")
    return blob.generate_signed_url(
        version="v4",
        expiration=timedelta(seconds=TTL),
        method="GET",
    )


@router.get("/index")
def list_content():
    bucket = _ensure_bucket()
    prefix = f"{PREFIX}/" if PREFIX else ""
    tickers: set[str] = set()
    
    # Look for .md and .svg files
    for blob in _get_client().list_blobs(bucket, prefix=prefix):
        name = blob.name
        if not name.endswith((".md", ".svg")):
            continue
        
        # Extract ticker from filename
        # Handle both structures:
        # 1. blog/md/{ticker}_supply_chain.md -> ticker
        # 2. {prefix}/{ticker}/{ticker}_supply_chain.md -> ticker
        rel = name[len(prefix):] if prefix and name.startswith(prefix) else name
        parts = rel.split("/")
        
        if len(parts) >= 2:
            # Structure: blog/md/{ticker}_supply_chain.md
            filename = parts[-1]
            # Extract ticker from filename like "amd_supply_chain.md" -> "AMD"
            if "_supply_chain" in filename:
                ticker = filename.split("_supply_chain")[0].upper()
                tickers.add(ticker)
        elif len(parts) == 1:
            # Structure: {ticker}_supply_chain.md (at root)
            if "_supply_chain" in rel:
                ticker = rel.split("_supply_chain")[0].upper()
                tickers.add(ticker)
    
    return {"tickers": sorted(tickers)}


@router.get("/{ticker}")
def get_ticker_content(ticker: str):
    # Reject folder names that might be mistaken for tickers
    if ticker.lower() in ["md", "svg", "index", "blog", "articles", "content"]:
        raise HTTPException(
            status_code=404,
            detail=f"'{ticker}' is not a valid ticker. Please use a stock ticker symbol like 'AMD', 'TSLA', etc."
        )
    
    ticker_lower = ticker.lower()
    
    # Try multiple path structures to support different bucket layouts
    # Structure 1: blog/md/{ticker}_supply_chain.md and blog/svg/{ticker}_supply_chain.svg
    # Structure 2: {prefix}/{ticker}/{ticker}_supply_chain.{md|svg}
    # Structure 3: {prefix}/{ticker}_supply_chain_article.md and {prefix}/{ticker}_supply_chain.svg
    
    possible_paths = [
        # Current structure: blog/md/ and blog/svg/
        (_blob_path(PREFIX, "md", f"{ticker_lower}_supply_chain.md"),
         _blob_path(PREFIX, "svg", f"{ticker_lower}_supply_chain.svg")),
        # Original structure: {prefix}/{ticker}/{ticker}_supply_chain.*
        (_blob_path(PREFIX, ticker_lower, f"{ticker_lower}_supply_chain.md"),
         _blob_path(PREFIX, ticker_lower, f"{ticker_lower}_supply_chain.svg")),
        # Alternative: {prefix}/{ticker}_supply_chain_article.md
        (_blob_path(PREFIX, ticker_lower, f"{ticker_lower}_supply_chain_article.md"),
         _blob_path(PREFIX, ticker_lower, f"{ticker_lower}_supply_chain.svg")),
    ]
    
    # Try each path structure until we find files that exist
    for md_path, svg_path in possible_paths:
        bucket = _ensure_bucket()
        md_blob = bucket.blob(md_path)
        svg_blob = bucket.blob(svg_path)
        
        if md_blob.exists() and svg_blob.exists():
            return {
                "ticker": ticker.upper(),
                "svg_url": _signed_url(svg_path),
                "article_url": _signed_url(md_path),
                "ttl_seconds": TTL,
            }
    
    # If no files found, raise 404
    raise HTTPException(
        status_code=404,
        detail=f"Content not found for ticker {ticker}. Tried paths: {[p[0] for p in possible_paths]}"
    )

