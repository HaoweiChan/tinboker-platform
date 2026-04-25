# Performance Analysis: `/api/visuals/supply-chain`

## Issue
The `/api/visuals/supply-chain` endpoint takes ~16 seconds even with caching.

## Root Cause Analysis

### 1. TTL Configuration Location

**TTL is set in:** `src/cache/cache_config.py` (line 25)
```python
CACHE_TTL: Dict[str, int] = {
    ...
    "visual_graph": 300,       # 5 minutes
    ...
}
```

**Used in:** `src/services/visual_graph.py` (line 158)
```python
await cache_set(
    cache_key,
    json.dumps(result, default=str),
    CACHE_TTL["visual_graph"]  # 300 seconds = 5 minutes
)
```

### 2. Performance Bottleneck

The slowness comes from **sequential processing** and **blocking synchronous calls**:

#### Problem 1: Sequential Node Processing
```python
# Line 141-143 in visual_graph.py
enriched_nodes = []
for node in graph_structure["nodes"]:  # ❌ Sequential loop
    enriched_node = await self._enrich_node_with_financials_async(node)
    enriched_nodes.append(enriched_node)
```

**Issue:** Processes 6 nodes one-by-one instead of in parallel.

#### Problem 2: Blocking Synchronous Call
```python
# Line 371 in visual_graph.py
ohlcv_data = self.stock_service.get_ohlcv_data(ticker, limit=20)  # ❌ SYNC call!
```

**Issue:** `get_ohlcv_data()` is synchronous and calls:
- `collect_stock_data()` → Makes external API call to Massive API
- This blocks the entire async event loop
- Each node makes this call sequentially

#### Problem 3: Cache Not Being Used
The cache key `visual:supply-chain` doesn't exist in Redis, meaning:
- Either cache set is failing silently
- Or the cache expired
- Or there's a serialization issue

## Supply Chain Structure
- **6 nodes**: QS, RIVN, ENPH, TSLA, F, GM
- Each node requires:
  1. `get_stock_basic_info_async()` - Async, cached ✅
  2. `get_ohlcv_data()` - **SYNC, NOT cached** ❌

## Performance Breakdown (Estimated)
- Cache check: ~1ms
- Node enrichment (6 nodes × ~2.5s each): ~15 seconds
  - `get_stock_basic_info_async()`: ~0.5s per node (cached after first)
  - `get_ohlcv_data()`: ~2s per node (always slow, blocks event loop)
- Cache set: ~10ms
- **Total: ~15-16 seconds**

## Solutions

### Solution 1: Parallelize Node Processing (Quick Fix)
```python
import asyncio

# Process all nodes in parallel
enriched_nodes = await asyncio.gather(*[
    self._enrich_node_with_financials_async(node)
    for node in graph_structure["nodes"]
])
```

**Expected improvement:** 6x faster (if all nodes processed simultaneously)

### Solution 2: Make `get_ohlcv_data()` Async (Better Fix)
- Convert `get_ohlcv_data()` to async
- Add caching for OHLCV data
- Use `run_in_executor()` for blocking calls

### Solution 3: Skip OHLCV for Visual Graphs (Fastest Fix)
- Remove OHLCV data from visual graph enrichment
- Use only basic stock info (already cached)
- OHLCV data is only used for sparkline history

### Solution 4: Cache Individual Node Data
- Cache each node's enriched data separately
- Reuse cached node data when building graphs

## Recommended Fix Priority

1. **Immediate:** Parallelize node processing (Solution 1)
2. **Short-term:** Make `get_ohlcv_data()` async and cached (Solution 2)
3. **Long-term:** Optimize data fetching strategy (Solution 3 or 4)

