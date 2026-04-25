"""
Mock data generators for testing and development
"""
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from src.models.schemas import (
    StockMetadataCollection,
    Stock,
    StockMetadata,
    StockPriceHistory,
    StockPriceRecord,
    CompanyStats,
)


def get_mock_company_list() -> StockMetadataCollection:
    """Get mock company list"""
    collection = StockMetadataCollection()
    
    # Add some mock stocks
    mock_stocks = [
        ("NVDA", "NVIDIA Corporation", "Technology", "USD"),
        ("MSFT", "Microsoft Corporation", "Technology", "USD"),
        ("TSLA", "Tesla Inc.", "Automotive", "USD"),
        ("AAPL", "Apple Inc.", "Technology", "USD"),
        ("GOOGL", "Alphabet Inc.", "Technology", "USD"),
        ("2330", "Taiwan Semiconductor Manufacturing Co., Ltd. (台積電)", "Semiconductor", "TWD"),
        ("2454", "MediaTek Inc. (聯發科)", "Semiconductor", "TWD"),
        ("2303", "聯華電子股份有限公司 (聯電)", "Semiconductor", "TWD"),
        ("8299", "群聯電子股份有限公司 (群聯)", "Semiconductor", "TWD"),
        ("2317", "鴻海精密工業股份有限公司 (鴻海)", "Electronics", "TWD"),
        ("2409", "友達光電股份有限公司 (友達)", "Display", "TWD"),
        ("3481", "群創光電股份有限公司 (群創)", "Display", "TWD"),
        ("2882", "國泰金融控股股份有限公司 (國泰金)", "Financial", "TWD"),
        ("2881", "富邦金融控股股份有限公司 (富邦金)", "Financial", "TWD"),
    ]
    
    for ticker, name, industry, currency in mock_stocks:
        metadata = StockMetadata(
            stock_id=ticker,
            ticker=ticker,
            stock_name=name,
            industry_category=industry,
            currency=currency,
        )
        collection.add(metadata)
    
    return collection


def get_mock_company_detail(stock_id: str) -> Optional[Stock]:
    """Get mock company detail"""
    # Mock stock data
    mock_data = {
        "NVDA": {
            "name": "NVIDIA Corporation",
            "price": 495.22,
            "change": 12.45,
            "changePercent": 2.58,
            "marketCap": 1220000000000,
            "revenue": 60922000000,
            "pe": 95.3,
            "dividendYield": 0.03,
            "about": "NVIDIA is a leading designer of graphics processing units (GPUs) for gaming, AI, and data centers.",
        },
        "MSFT": {
            "name": "Microsoft Corporation",
            "price": 378.91,
            "change": 3.21,
            "changePercent": 0.85,
            "marketCap": 2820000000000,
            "revenue": 211915000000,
            "pe": 35.7,
            "dividendYield": 0.79,
            "about": "Microsoft develops, licenses, and supports software, services, devices, and solutions worldwide.",
        },
        "TSLA": {
            "name": "Tesla Inc.",
            "price": 242.84,
            "change": 5.32,
            "changePercent": 2.24,
            "marketCap": 771000000000,
            "revenue": 96730000000,
            "pe": 78.5,
            "about": "Tesla designs, develops, manufactures, and sells electric vehicles, energy generation and storage systems.",
        },
        "2330": {
            "name": "Taiwan Semiconductor Manufacturing Co., Ltd. (台積電)",
            "price": 580.00,
            "change": 10.00,
            "changePercent": 1.75,
            "marketCap": 15000000000000,
            "revenue": 2000000000000,
            "pe": 20.5,
            "dividendYield": 2.5,
            "about": "TSMC is the world's largest dedicated independent (pure-play) semiconductor foundry.",
        },
        "2454": {
            "name": "MediaTek Inc. (聯發科)",
            "price": 950.00,
            "change": -5.00,
            "changePercent": -0.52,
            "marketCap": 1500000000000,
            "revenue": 400000000000,
            "pe": 18.2,
            "dividendYield": 4.0,
            "about": "MediaTek involves in the research and development, production, and marketing of multimedia integrated circuits.",
        },
        "2303": {
            "name": "聯華電子股份有限公司 (聯電)",
            "price": 52.00,
            "change": 0.50,
            "changePercent": 0.97,
            "marketCap": 650000000000,
            "revenue": 230000000000,
            "pe": 12.5,
            "dividendYield": 5.8,
            "about": "UMC is one of the world's leading semiconductor foundries.",
        },
        "8299": {
            "name": "群聯電子股份有限公司 (群聯)",
            "price": 520.00,
            "change": 8.00,
            "changePercent": 1.56,
            "marketCap": 110000000000,
            "revenue": 60000000000,
            "pe": 15.8,
            "dividendYield": 3.2,
            "about": "Phison Electronics develops flash memory controllers and related storage solutions.",
        },
        "2317": {
            "name": "鴻海精密工業股份有限公司 (鴻海)",
            "price": 180.00,
            "change": 2.00,
            "changePercent": 1.12,
            "marketCap": 2500000000000,
            "revenue": 6600000000000,
            "pe": 13.2,
            "dividendYield": 3.0,
            "about": "Hon Hai Precision Industry (Foxconn) is the world's largest electronics manufacturer.",
        },
        "2409": {
            "name": "友達光電股份有限公司 (友達)",
            "price": 18.50,
            "change": -0.20,
            "changePercent": -1.07,
            "marketCap": 180000000000,
            "revenue": 280000000000,
            "pe": 8.5,
            "dividendYield": 6.5,
            "about": "AU Optronics is a leading manufacturer of thin film transistor liquid crystal displays.",
        },
        "3481": {
            "name": "群創光電股份有限公司 (群創)",
            "price": 15.20,
            "change": 0.30,
            "changePercent": 2.01,
            "marketCap": 150000000000,
            "revenue": 260000000000,
            "pe": 7.8,
            "dividendYield": 7.0,
            "about": "Innolux Corporation is a major TFT-LCD panel manufacturer.",
        },
        "2882": {
            "name": "國泰金融控股股份有限公司 (國泰金)",
            "price": 48.50,
            "change": 0.40,
            "changePercent": 0.83,
            "marketCap": 700000000000,
            "revenue": 300000000000,
            "pe": 10.2,
            "dividendYield": 4.5,
            "about": "Cathay Financial Holdings is one of Taiwan's largest financial holding companies.",
        },
        "2881": {
            "name": "富邦金融控股股份有限公司 (富邦金)",
            "price": 72.00,
            "change": 0.80,
            "changePercent": 1.12,
            "marketCap": 720000000000,
            "revenue": 280000000000,
            "pe": 11.5,
            "dividendYield": 3.8,
            "about": "Fubon Financial Holding is a major Taiwanese financial services conglomerate.",
        },
    }
    
    stock_id_upper = stock_id.upper()
    if stock_id_upper not in mock_data:
        return None
    
    data = mock_data[stock_id_upper]
    
    # Create metadata
    metadata = StockMetadata(
        stock_id=stock_id_upper,
        ticker=stock_id_upper,
        stock_name=data["name"],
        industry_category="Technology",
        currency="USD",
    )
    
    # Create price history (last 30 days)
    price_history = StockPriceHistory()
    base_price = data["price"]
    end_date = datetime.now()
    
    for days_ago in range(30, 0, -1):
        date = end_date - timedelta(days=days_ago)
        date_str = date.strftime("%Y-%m-%d")
        timestamp = int(date.timestamp() * 1000)
        
        # Add some variation
        variation = (days_ago - 15) * 0.01 * base_price
        close_price = base_price - variation
        open_price = close_price * 0.99
        high_price = close_price * 1.01
        low_price = close_price * 0.98
        
        record = StockPriceRecord(
            date=date_str,
            timestamp=timestamp,
            Trading_Volume=1000000 + days_ago * 10000,
            Trading_money=close_price * (1000000 + days_ago * 10000),
            open=round(open_price, 2),
            max=round(high_price, 2),
            min=round(low_price, 2),
            close=round(close_price, 2),
            spread=round(high_price - low_price, 2),
            Trading_turnover=0.0,
        )
        price_history.add_record(record)
    
    # Create stats
    stats = CompanyStats(
        volume=1000000,
        beta=1.2,
        volatility=0.3,
    )
    
    # Create stock
    stock = Stock(
        stock_id=stock_id_upper,
        metadata=metadata,
        stock_price_history=price_history,
        price=data["price"],
        change=data["change"],
        changePercent=data["changePercent"],
        marketCap=data["marketCap"],
        revenue=data["revenue"],
        pe=data["pe"],
        dividendYield=data["dividendYield"],
        about=data["about"],
        stats=stats,
    )
    
    return stock


def get_mock_top_movers() -> List[Dict]:
    """Get mock top movers"""
    return [
        {
            "ticker": "NVDA",
            "name": "NVIDIA",
            "price": 495.22,
            "change": 12.45,
            "changePercent": 2.58,
        },
        {
            "ticker": "TSLA",
            "name": "Tesla",
            "price": 242.84,
            "change": 5.32,
            "changePercent": 2.24,
        },
        {
            "ticker": "MSFT",
            "name": "Microsoft",
            "price": 378.91,
            "change": 3.21,
            "changePercent": 0.85,
        },
    ]


# ============================================
# Visual Graph Mock Data (Structure Only)
# ============================================

def get_supply_chain_structure() -> Dict:
    """
    Get supply chain graph structure (nodes and edges only, no financial data)
    Returns structure matching VisualGraphNode/VisualGraphEdge format
    """
    # Supply chain entities
    entities = [
        {"id": "qs", "label": "QuantumScape", "ticker": "QS", "status": "Active", "layerLabel": "Tier 2: Battery"},
        {"id": "rivn", "label": "Rivian", "ticker": "RIVN", "status": "Active", "layerLabel": "Tier 2: Battery"},
        {"id": "enph", "label": "Enphase Energy", "ticker": "ENPH", "status": "Active", "layerLabel": "Tier 2: Battery"},
        {"id": "tesla", "label": "Tesla", "ticker": "TSLA", "status": "Active", "layerLabel": "OEM"},
        {"id": "ford", "label": "Ford", "ticker": "F", "status": "Stable", "layerLabel": "OEM"},
        {"id": "gm", "label": "GM", "ticker": "GM", "status": "Stable", "layerLabel": "OEM"},
    ]
    
    # Create nodes with basic structure (positions will be set by layout or service)
    nodes = []
    for i, entity in enumerate(entities):
        nodes.append({
            "id": entity["id"],
            "type": "company",
            "data": {
                "label": entity["label"],
                "ticker": entity["ticker"],
                "status": entity["status"],
                "layerLabel": entity["layerLabel"],
            },
            "position": {"x": 0, "y": 0},  # Will be set by layout
        })
    
    # Create edges
    edges = [
        {"id": "e1", "source": "qs", "target": "tesla", "animated": True},
        {"id": "e2", "source": "rivn", "target": "tesla", "animated": True},
        {"id": "e3", "source": "enph", "target": "gm", "animated": True},
        {"id": "e4", "source": "enph", "target": "ford", "animated": True},
    ]
    
    return {"nodes": nodes, "edges": edges}


def get_ownership_structure() -> Dict:
    """
    Get ownership tree graph structure (nodes and edges only, no financial data)
    Returns structure matching VisualGraphNode/VisualGraphEdge format
    """
    entities = [
        {"id": "root", "label": "General Electric", "ticker": "GE", "isRoot": True, "ownership": None},
        {"id": "sub1", "label": "GE Vernova", "ticker": "GEV", "isRoot": False, "ownership": "Spin-off"},
        {"id": "sub2", "label": "GE HealthCare", "ticker": "GEHC", "isRoot": False, "ownership": "75%"},
        {"id": "child1", "label": "Varian", "ticker": None, "isRoot": False, "ownership": "100%"},
    ]
    
    nodes = []
    for entity in entities:
        node_data = {
            "label": entity["label"],
        }
        if entity.get("ticker"):
            node_data["ticker"] = entity["ticker"]
        if entity.get("isRoot") is not None:
            node_data["isRoot"] = entity["isRoot"]
        if entity.get("ownership"):
            node_data["ownership"] = entity["ownership"]
        
        nodes.append({
            "id": entity["id"],
            "type": "company",
            "data": node_data,
            "position": {"x": 0, "y": 0},  # Will be set by layout
        })
    
    edges = [
        {"id": "e1", "source": "root", "target": "sub1", "label": "Spin-off"},
        {"id": "e2", "source": "root", "target": "sub2", "label": "75%"},
        {"id": "e3", "source": "sub2", "target": "child1", "label": "100%"},
    ]
    
    return {"nodes": nodes, "edges": edges}


def get_cluster_structure() -> Dict:
    """
    Get cluster graph structure (nodes and edges only, no financial data)
    Returns structure matching VisualGraphNode/VisualGraphEdge format
    """
    import random
    
    entities = [
        {"id": "center", "label": "Tesla", "ticker": "TSLA", "group": "market_leader"},
        {"id": "c1", "label": "General Motors", "ticker": "GM", "group": "competitor"},
        {"id": "c2", "label": "Rivian", "ticker": "RIVN", "group": "competitor"},
        {"id": "c3", "label": "Lucid", "ticker": "LCID", "group": "competitor"},
        {"id": "s1", "label": "Enphase Energy", "ticker": "ENPH", "group": "partner"},
    ]
    
    nodes = []
    for i, entity in enumerate(entities):
        # Center node at fixed position, others random
        if i == 0:
            position = {"x": 250, "y": 250}
        else:
            position = {"x": random.random() * 500, "y": random.random() * 500}
        
        nodes.append({
            "id": entity["id"],
            "type": "company",
            "data": {
                "label": entity["label"],
                "ticker": entity["ticker"],
                "group": entity["group"],
            },
            "position": position,
        })
    
    edges = [
        {"id": "e1", "source": "center", "target": "c1", "type": "default", "data": {"category": "automation"}},
        {"id": "e2", "source": "center", "target": "c2", "type": "default", "data": {"category": "automation"}},
        {"id": "e3", "source": "center", "target": "c3", "type": "default", "data": {"category": "automation"}},
        {"id": "e4", "source": "center", "target": "s1", "type": "default", "data": {"category": "automation"}},
    ]
    
    return {"nodes": nodes, "edges": edges}


def get_interactive_models_structure() -> List[Dict]:
    """
    Get interactive models structure (without real financial data)
    Returns list of InteractiveModelData structures
    """
    return [
        {
            "id": "supply-chain",
            "title": "EV Supply Chain Shakeup",
            "source": "Bloomberg",
            "date": "September 24, 2025 • 2 hours ago",
            "category": "Supply Chain",
            "summary": "Major shifts in electric vehicle supply chain relationships",
            "graphTypeLabel": "Supply Chain Graph",
            "graphType": "layered",
            "tickers": ["TSLA", "F", "GM"],  # Will be enriched with real data
            "indices": [],  # Will be enriched with real data
        },
        {
            "id": "ownership",
            "title": "Corporate Ownership Restructuring",
            "source": "Reuters",
            "date": "September 23, 2025 • 5 hours ago",
            "category": "Ownership",
            "summary": "Recent corporate spin-offs and ownership changes",
            "graphTypeLabel": "Ownership Tree",
            "graphType": "tree",
            "tickers": ["GE", "GEV", "GEHC"],  # Will be enriched with real data
            "indices": [],
        },
        {
            "id": "competition",
            "title": "EV Market Competition Analysis",
            "source": "Financial Times",
            "date": "September 22, 2025 • 1 day ago",
            "category": "Market Analysis",
            "summary": "Competitive landscape in electric vehicle market",
            "graphTypeLabel": "Cluster Graph",
            "graphType": "force",
            "tickers": ["TSLA", "RIVN", "LCID"],  # Will be enriched with real data
            "indices": [],
        },
    ]

