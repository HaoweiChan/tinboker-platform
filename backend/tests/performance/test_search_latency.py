
import requests
import time
import statistics
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BASE_URL = "http://localhost:8000/api/search"
# Mix of full search and suggest queries
QUERIES = [
    ("/search", "2454"), 
    ("/search", "google"),
    ("/search/suggest", "245"),  # Suggest prefix
    ("/search/suggest", "goo"),  # Suggest prefix
]
ITERATIONS = 5

def benchmark_search():
    logger.info(f"Starting benchmark on {BASE_URL}")
    results = {}
    
    for path, query in QUERIES:
        latencies = []
        url = BASE_URL.replace("/api/search", "/api") + path
        logger.info(f"Benchmarking {path} with query: '{query}'")
        
        for i in range(ITERATIONS):
            start_time = time.time()
            try:
                response = requests.get(url, params={"q": query, "limit": 5})
                # Force read response
                _ = response.content
                if response.status_code != 200:
                    logger.error(f"Request failed for '{query}': {response.status_code}")
                    continue
            except Exception as e:
                logger.error(f"Request error for '{query}': {e}")
                continue
                
            elapsed = (time.time() - start_time) * 1000  # ms
            latencies.append(elapsed)
            time.sleep(0.1)  # small pause
            
        if latencies:
            avg_latency = statistics.mean(latencies)
            max_latency = max(latencies)
            min_latency = min(latencies)
            results[f"{path}:{query}"] = {
                "avg": avg_latency,
                "max": max_latency,
                "min": min_latency
            }
            logger.info(f"Query '{query}' on {path}: Avg={avg_latency:.2f}ms")
    
    print("\n--- Benchmark Results ---")
    print(f"{'Query':<15} | {'Avg (ms)':<10} | {'Max (ms)':<10} | {'Min (ms)':<10}")
    print("-" * 55)
    for q, stats in results.items():
        print(f"{q:<15} | {stats['avg']:<10.2f} | {stats['max']:<10.2f} | {stats['min']:<10.2f}")
    
    overall_avg = statistics.mean([s['avg'] for s in results.values()])
    print("-" * 55)
    print(f"Overall Average Latency: {overall_avg:.2f} ms")

if __name__ == "__main__":
    benchmark_search()
