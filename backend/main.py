from fastapi import FastAPI, Query, WebSocket, WebSocketDisconnect, Body
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import requests
import threading
import time
import json
import smtplib
import asyncio

app = FastAPI()

# Allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ASSET_MAP = {
    "Stocks": [
        "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "JPM", "V", "UNH",
        "HD", "MA", "PG", "LLY", "AVGO", "XOM", "MRK", "ABBV", "PEP", "COST",
        "ADBE", "KO", "WMT", "CRM", "ACN", "CVX", "MCD", "DHR", "TXN", "NEE",
        "LIN", "TMO", "WFC", "PM", "AMD", "UNP", "HON", "AMGN", "LOW", "INTC",
        "SBUX", "MDT", "QCOM", "AMAT", "BKNG", "ISRG", "SPGI", "BLK", "SYK",
        "GS", "CAT", "DE", "PLD", "LMT", "ADP", "C", "CB", "SCHW", "T", "USB",
        "SO", "DUK", "PNC", "MMC", "CI", "BDX", "ZTS", "GILD", "VRTX", "REGN",
        "CSCO", "MO", "FIS", "AON", "ICE", "NSC", "ITW", "SHW", "APD", "ECL", "ROP",
        "ETN", "EMR", "PSA", "EXC", "D", "AEP", "PEG", "SRE", "ED", "FE", "WEC",
        "EIX", "AES", "PPL", "CMS", "CNP", "NI", "NRG", "LNT", "EVRG", "OGE", "SWX"
    ],
    "Funds": [
        "SPY", "QQQ", "IVV", "VTI", "VOO", "DIA", "IWM", "EFA", "VTV", "VUG"
    ],
    "Futures": [
        "ES=F", "NQ=F", "YM=F", "RTY=F", "CL=F", "GC=F", "SI=F", "ZB=F", "ZN=F"
    ],
    "Forex": [
        "EURUSD=X", "USDJPY=X", "GBPUSD=X", "AUDUSD=X", "USDCAD=X", "USDCHF=X"
    ],
    "Crypto": [
        "BTC-USD", "ETH-USD", "SOL-USD", "BNB-USD", "DOGE-USD", "XRP-USD"
    ],
    "Indices": [
        "^GSPC", "^DJI", "^IXIC", "^RUT", "^VIX", "^FTSE", "^N225", "^HSI"
    ],
    "Bonds": [
        "US10Y", "US30Y", "US5Y", "US2Y"
    ],
    "Economy": [
        "GDP", "CPI", "Unemployment", "Interest Rate"
    ],
    "Options": [
        # Options require paid APIs, so mock for now
        "AAPL220819C00145000", "MSFT220819P00280000"
    ]
}

def fetch_yf(symbol):
    try:
        info = yf.Ticker(symbol).info
        price = info.get("regularMarketPrice")
        prev = info.get("regularMarketPreviousClose")
        name = info.get("shortName") or info.get("longName") or symbol
        change = price - prev if price and prev else 0
        return {
            "symbol": symbol,
            "name": name,
            "price": price if price else 0,
            "change": round(change, 2)
        }
    except Exception:
        return None

def fetch_yf_batch(symbols):
    try:
        tickers = yf.Tickers(' '.join(symbols))
        results = {}
        for symbol in symbols:
            info = tickers.tickers[symbol].info
            price = info.get("regularMarketPrice")
            prev = info.get("regularMarketPreviousClose")
            name = info.get("shortName") or info.get("longName") or symbol
            change = price - prev if price and prev else 0
            results[symbol] = {
                "symbol": symbol,
                "name": name,
                "price": price if price else 0,
                "change": round(change, 2)
            }
        return results
    except Exception:
        return {}

def fetch_crypto(symbol):
    # symbol format: BTC-USD
    try:
        base, quote = symbol.split('-')
        url = f"https://min-api.cryptocompare.com/data/price?fsym={base}&tsyms={quote}"
        price = requests.get(url).json().get(quote)
        # For change, you could fetch historical price, but we'll mock for demo
        return {
            "symbol": symbol,
            "name": f"{base}/{quote}",
            "price": price if price else 0,
            "change": 0
        }
    except Exception:
        return None

# In-memory cache
PRICE_CACHE = {}
ALERT_HISTORY = {}  # {symbol: [ {time, message} ]}
USER_ALERTS = {}    # {watchlist_id: {priceAbove, rsiCross, email}}
WATCHLIST_STOCKS = {}  # {watchlist_id: [symbol, ...]}
INDICATOR_HISTORY = {}  # {(watchlist_id, symbol): [ {time, EMA, RSI, MACD} ]}

def compute_indicators(symbol):
    try:
        hist = yf.Ticker(symbol).history(period="3mo", interval="1d")
        if hist.empty:
            return {}
        close = hist['Close']
        ema = close.ewm(span=20).mean().iloc[-1]
        delta = close.diff()
        up = delta.clip(lower=0)
        down = -1 * delta.clip(upper=0)
        avg_gain = up.rolling(window=14).mean().iloc[-1]
        avg_loss = down.rolling(window=14).mean().iloc[-1]
        rs = avg_gain / avg_loss if avg_loss != 0 else 0
        rsi = 100 - (100 / (1 + rs))
        macd = close.ewm(span=12).mean().iloc[-1] - close.ewm(span=26).mean().iloc[-1]
        return {"EMA": round(ema,2), "RSI": round(rsi,2), "MACD": round(macd,2)}
    except Exception:
        return {}

def send_email_alert(to_email, subject, message):
    # Use EmailJS from frontend for demo, or SMTP here for production
    pass

def check_alerts(symbol, data, watchlist_id):
    cond = USER_ALERTS.get(watchlist_id)
    if not cond: return
    triggered = []
    if cond.get("priceAbove") and data["price"] > float(cond["priceAbove"]):
        triggered.append(f"Price above ${cond['priceAbove']}")
    if cond.get("rsiCross") and data.get("RSI") and data["RSI"] > float(cond["rsiCross"]):
        triggered.append(f"RSI crossed {cond['rsiCross']}")
    for msg in triggered:
        ALERT_HISTORY.setdefault(symbol, []).append({"time": time.strftime("%Y-%m-%d %H:%M:%S"), "message": msg})
        if cond.get("email"):
            send_email_alert(cond["email"], f"Alert for {symbol}", msg)

def refresh_prices():
    while True:
        for asset_type, tickers in ASSET_MAP.items():
            batch_size = 10
            for i in range(0, len(tickers), batch_size):
                batch = tickers[i:i+batch_size]
                if asset_type == "Crypto":
                    for symbol in batch:
                        data = fetch_crypto(symbol)
                        if data:
                            PRICE_CACHE[symbol] = data
                elif asset_type in ["Stocks", "Funds", "Futures", "Forex", "Indices"]:
                    batch_data = fetch_yf_batch(batch)
                    for symbol, data in batch_data.items():
                        indicators = compute_indicators(symbol)
                        if data: data.update(indicators)
                        if data:
                            PRICE_CACHE[symbol] = data
                    # --- NEW: Store indicator history for all watchlist stocks in this batch
                    for wid, symbols in WATCHLIST_STOCKS.items():
                        for watch_symbol in symbols:
                            if watch_symbol in batch_data:
                                key = (wid, watch_symbol)
                                INDICATOR_HISTORY.setdefault(key, []).append({
                                    "time": time.strftime("%Y-%m-%d %H:%M:%S"),
                                    "EMA": batch_data[watch_symbol].get("EMA"),
                                    "RSI": batch_data[watch_symbol].get("RSI"),
                                    "MACD": batch_data[watch_symbol].get("MACD"),
                                })
                                # Limit history to last 100 points
                                if len(INDICATOR_HISTORY[key]) > 100:
                                    INDICATOR_HISTORY[key] = INDICATOR_HISTORY[key][-100:]
                else:
                    continue
            time.sleep(1)
        time.sleep(30)

# Start background thread
threading.Thread(target=refresh_prices, daemon=True).start()

@app.get("/api/stocks")
def get_stocks(
    type: str = Query("Stocks"),
    search: str = Query("")
):
    type = type if type in ASSET_MAP else "Stocks"
    tickers = ASSET_MAP[type]

    # Filter by search
    filtered = [t for t in tickers if search.lower() in t.lower()]
    if not search:
        filtered = tickers[:100]

    results = []
    for symbol in filtered:
        cached = PRICE_CACHE.get(symbol)
        if cached:
            results.append(cached)
        else:
            # fallback if not in cache yet
            results.append({"symbol": symbol, "name": symbol, "price": 0, "change": 0})

    # Also search by name if search is not empty
    if search and type in ["Stocks", "Funds", "Futures", "Forex", "Indices"]:
        for symbol in tickers:
            try:
                info = yf.Ticker(symbol).info
                name = info.get("shortName") or info.get("longName") or symbol
                if search.lower() in name.lower() and symbol not in filtered:
                    price = info.get("regularMarketPrice")
                    prev = info.get("regularMarketPreviousClose")
                    change = price - prev if price and prev else 0
                    results.append({
                        "symbol": symbol,
                        "name": name,
                        "price": price if price else 0,
                        "change": round(change, 2)
                    })
            except Exception:
                continue

    # Remove duplicates
    unique = {r["symbol"]: r for r in results}
    return list(unique.values())

@app.post("/api/alerts")
def set_alerts(watchlist_id: int, priceAbove: float = None, rsiCross: float = None, email: str = None):
    USER_ALERTS[watchlist_id] = {"priceAbove": priceAbove, "rsiCross": rsiCross, "email": email}
    return {"ok": True}

@app.get("/api/alert_history")
def get_alert_history(symbol: str):
    return ALERT_HISTORY.get(symbol, [])

@app.post("/api/watchlist_stocks")
def set_watchlist_stocks(watchlist_id: int = Body(...), symbols: list = Body(...)):
    WATCHLIST_STOCKS[watchlist_id] = symbols
    return {"ok": True}

@app.get("/api/indicator_history")
def get_indicator_history(watchlist_id: int, symbol: str):
    return INDICATOR_HISTORY.get((watchlist_id, symbol), [])

@app.post("/api/indicator_history/refresh")
def refresh_indicator_history(watchlist_id: int = Body(...), symbol: str = Body(...)):
    indicators = compute_indicators(symbol)
    key = (watchlist_id, symbol)
    INDICATOR_HISTORY.setdefault(key, []).append({
        "time": time.strftime("%Y-%m-%d %H:%M:%S"),
        "EMA": indicators.get("EMA"),
        "RSI": indicators.get("RSI"),
        "MACD": indicators.get("MACD"),
    })
    # Limit history to last 100 points
    if len(INDICATOR_HISTORY[key]) > 100:
        INDICATOR_HISTORY[key] = INDICATOR_HISTORY[key][-100:]
    return {"ok": True}

# WebSocket support
# Store connected clients
clients = set()

@app.websocket("/ws/prices")
async def websocket_prices(websocket: WebSocket):
    await websocket.accept()
    clients.add(websocket)
    try:
        while True:
            # Periodically send all cached prices
            await websocket.send_text(json.dumps(PRICE_CACHE))
            await asyncio.sleep(5)  # Send every 5 seconds
    except WebSocketDisconnect:
        clients.remove(websocket)