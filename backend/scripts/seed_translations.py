#!/usr/bin/env python3
"""
Seed common stock translations into the database.
These are high-quality manual translations for popular stocks.
"""

import sys
import logging
from pathlib import Path
# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))
from src.database.postgres import get_session, init_engine, create_all_tables
from src.services.translation_service import TranslationService
from src.database import models  # noqa: F401 - Import to register models

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Common US stock translations (ticker, name_en, name_zh_tw)
US_TRANSLATIONS = [
    ("NVDA", "NVIDIA CORP", "輝達"),
    ("AAPL", "Apple Inc.", "蘋果"),
    ("MSFT", "MICROSOFT CORP", "微軟"),
    ("GOOGL", "Alphabet Inc.", "谷歌"),
    ("AMZN", "AMAZON COM INC", "亞馬遜"),
    ("META", "Meta Platforms, Inc.", "Meta"),
    ("TSLA", "Tesla, Inc.", "特斯拉"),
    ("AVGO", "Broadcom Inc.", "博通"),
    ("BRK-B", "BERKSHIRE HATHAWAY INC", "波克夏"),
    ("LLY", "ELI LILLY & Co", "禮來"),
    ("JPM", "JPMORGAN CHASE & CO", "摩根大通"),
    ("V", "VISA INC.", "威士"),
    ("WMT", "Walmart Inc.", "沃爾瑪"),
    ("XOM", "EXXON MOBIL CORP", "艾克森美孚"),
    ("MA", "Mastercard Inc", "萬事達"),
    ("JNJ", "JOHNSON & JOHNSON", "嬌生"),
    ("PG", "PROCTER & GAMBLE Co", "寶僑"),
    ("HD", "HOME DEPOT, INC.", "家得寶"),
    ("COST", "COSTCO WHOLESALE CORP", "好市多"),
    ("NFLX", "NETFLIX INC", "網飛"),
    ("ABBV", "AbbVie Inc.", "艾伯維"),
    ("AMD", "ADVANCED MICRO DEVICES INC", "超微"),
    ("INTC", "INTEL CORP", "英特爾"),
    ("QCOM", "QUALCOMM INC", "高通"),
    ("CRM", "Salesforce, Inc.", "賽富時"),
    ("ADBE", "ADOBE INC", "奧多比"),
    ("ORCL", "ORACLE CORP", "甲骨文"),
    ("IBM", "IBM", "IBM"),
    ("CSCO", "CISCO SYSTEMS INC", "思科"),
    ("MRK", "MERCK & CO., INC.", "默克"),
    ("PFE", "PFIZER INC", "輝瑞"),
    ("TMO", "THERMO FISHER SCIENTIFIC INC", "賽默飛世爾"),
    ("ABT", "ABBOTT LABORATORIES", "亞培"),
    ("KO", "COCA-COLA CO", "可口可樂"),
    ("PEP", "PEPSICO, INC.", "百事"),
    ("NKE", "NIKE, INC.", "耐吉"),
    ("MCD", "MCDONALD'S CORP", "麥當勞"),
    ("SBUX", "STARBUCKS CORP", "星巴克"),
    ("DIS", "WALT DISNEY CO", "迪士尼"),
    ("CMCSA", "COMCAST CORP NEW", "康卡斯特"),
    ("VZ", "VERIZON COMMUNICATIONS INC", "威訊"),
    ("T", "AT&T INC.", "AT&T"),
    ("BAC", "BANK OF AMERICA CORP", "美國銀行"),
    ("WFC", "WELLS FARGO & COMPANY", "富國銀行"),
    ("GS", "GOLDMAN SACHS GROUP INC", "高盛"),
    ("MS", "MORGAN STANLEY", "摩根士丹利"),
    ("C", "CITIGROUP INC", "花旗"),
    ("BABA", "Alibaba Group Holding Ltd", "阿里巴巴"),
    ("JD", "JD.com, Inc.", "京東"),
    ("PDD", "PDD Holdings Inc.", "拼多多"),
    ("BIDU", "Baidu, Inc.", "百度"),
    ("NIO", "NIO Inc.", "蔚來"),
    ("XPEV", "XPeng Inc.", "小鵬"),
    ("LI", "Li Auto Inc.", "理想汽車"),
    ("BYD", "BYD Co., Ltd.", "比亞迪"),
    ("TSM", "Taiwan Semiconductor Manufacturing", "台積電"),
    ("ASML", "ASML HOLDING NV", "艾司摩爾"),
    ("SAP", "SAP SE", "SAP"),
    ("TM", "Toyota Motor Corporation", "豐田"),
    ("SONY", "Sony Group Corporation", "索尼"),
]

# Common TW stock translations (already have ZH, add approved status)
TW_TRANSLATIONS = [
    ("2330", "Taiwan Semiconductor Manufacturing", "台積電"),
    ("2317", "Hon Hai Precision Industry", "鴻海"),
    ("2454", "MediaTek Inc.", "聯發科"),
    ("2308", "Delta Electronics", "台達電"),
    ("2412", "Chunghwa Telecom", "中華電信"),
    ("2382", "Quanta Computer", "廣達"),
    ("1303", "Nan Ya Plastics", "南亞"),
    ("1301", "Formosa Plastics", "台塑"),
    ("2891", "CTBC Financial Holding", "中信金"),
    ("2882", "Cathay Financial Holding", "國泰金"),
    ("2881", "Fubon Financial Holding", "富邦金"),
    ("2886", "Mega Financial Holding", "兆豐金"),
    ("2357", "ASUSTeK Computer", "華碩"),
    ("2912", "President Chain Store", "統一超"),
    ("2303", "United Microelectronics", "聯電"),
    ("3711", "ASE Technology Holding", "日月光投控"),
    ("2395", "Advantech", "研華"),
    ("3008", "Largan Precision", "大立光"),
    ("2474", "Catcher Technology", "可成"),
    ("2345", "Accton Technology", "智邦"),
]


def seed_translations():
    """Seed common translations into the database."""
    init_engine()
    create_all_tables()
    imported = 0
    updated = 0
    for session in get_session():
        service = TranslationService(session)
        # Seed US translations
        logger.info("Seeding US translations...")
        for ticker, name_en, name_zh_tw in US_TRANSLATIONS:
            try:
                _, is_new = service.create_or_update(
                    ticker=ticker,
                    market="US",
                    name_en=name_en,
                    name_zh_tw=name_zh_tw,
                    status="approved",
                    updated_by="seed_script"
                )
                if is_new:
                    imported += 1
                else:
                    updated += 1
            except Exception as e:
                logger.error(f"Error seeding {ticker}: {e}")
        # Seed TW translations
        logger.info("Seeding TW translations...")
        for ticker, name_en, name_zh_tw in TW_TRANSLATIONS:
            try:
                _, is_new = service.create_or_update(
                    ticker=ticker,
                    market="TW",
                    name_en=name_en,
                    name_zh_tw=name_zh_tw,
                    status="approved",
                    updated_by="seed_script"
                )
                if is_new:
                    imported += 1
                else:
                    updated += 1
            except Exception as e:
                logger.error(f"Error seeding {ticker}: {e}")
        break  # Only need one session
    logger.info(f"Seeding complete: {imported} imported, {updated} updated")


if __name__ == "__main__":
    seed_translations()
