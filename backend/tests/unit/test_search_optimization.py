import pytest
from src.services.suggestion_index import SuggestionIndex
from src.schemas.search import SearchResultItem

@pytest.mark.asyncio
async def test_suggestion_index_fuzzy_matching():
    index = SuggestionIndex()
    await index.clear()
    
    # Add items
    tsmc = SearchResultItem(
        id="2330", 
        type="stock", 
        title="2330", 
        subtitle="台積電 (TSMC)", 
        link="/stock/2330",
        metadata={"mentions": 100}
    )
    nvda = SearchResultItem(
        id="NVDA", 
        type="stock", 
        title="NVDA", 
        subtitle="NVIDIA Corp", 
        link="/stock/NVDA",
        metadata={"mentions": 50} 
    )
    
    await index.add_item(tsmc, keywords=["2330", "台積電", "TSMC", "Taiwan Semiconductor"])
    await index.add_item(nvda, keywords=["NVDA", "NVIDIA"])
    
    # Test 1: Exact Ticker Match
    results = index.suggest("2330")
    assert len(results) > 0
    assert results[0].id == "2330"
    
    # Test 2: Name Token Prefix (English) - "semi" -> "Semiconductor"
    results = index.suggest("semi")
    assert len(results) > 0
    assert results[0].id == "2330"

    # Test 3: Name Token Prefix (Chinese) - "台積" -> "台積電"
    results = index.suggest("台積")
    assert len(results) > 0
    assert results[0].id == "2330"
    
    # Test 4: Case Insensitivity - "nvidia" -> "NVIDIA"
    results = index.suggest("nvidia")
    assert len(results) > 0
    assert results[0].id == "NVDA"
    
    # Test 5: Substring matching via tokenization
    # "conductor" -> "Semiconductor"? No, unless we split by camelCase or something which standard regex doesn't
    # But "Taiwan" -> "Taiwan Semiconductor" should work
    results = index.suggest("taiwan")
    assert len(results) > 0
    assert results[0].id == "2330"

@pytest.mark.asyncio
async def test_suggestion_index_scoring():
    index = SuggestionIndex()
    await index.clear()
    
    # Two items matching "App"
    # 1. "Applied Materials" (AMAT)
    # 2. "Apple" (AAPL)
    
    amat = SearchResultItem(id="AMAT", type="stock", title="AMAT", subtitle="Applied Materials", link="/stock/AMAT")
    aapl = SearchResultItem(id="AAPL", type="stock", title="AAPL", subtitle="Apple Inc.", link="/stock/AAPL")
    
    await index.add_item(amat, keywords=["AMAT", "Applied Materials"])
    await index.add_item(aapl, keywords=["AAPL", "Apple"])
    
    # Query "App"
    # "Apple" starts with "App" (Prefix match)
    # "Applied" starts with "App" (Prefix match)
    # Both are similar.
    # But "Apple" is shorter than "Applied Materials", so arguably better match?
    # Our logic sorts by score then title length.
    
    results = index.suggest("App")
    assert len(results) >= 2
    # Expect Apple first simply because it's a shorter token? 
    # Or purely arbitrary if score is same.
    # Let's verify sort logic: results.sort(key=lambda x: (x[0], -len(x[1].title)), reverse=True)
    # title for AMAT is "AMAT", AAPL is "AAPL". Same length.
    # subtitle? We don't sort by subtitle length.
    
    # Let's verify Exact Match scoring
    # Query "Apple"
    results = index.suggest("Apple")
    assert results[0].id == "AAPL"
    
