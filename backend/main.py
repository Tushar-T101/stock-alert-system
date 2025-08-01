from fastapi import FastAPI, Query, WebSocket, WebSocketDisconnect, Body
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import requests
import threading
import time
import json
import smtplib
import asyncio
from pydantic import BaseModel
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import pandas as pd
import ta
from dotenv import load_dotenv

load_dotenv()

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")

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
# Clear alert history on backend restart
ALERT_HISTORY.clear()
USER_ALERTS = {}    # {watchlist_id: {priceAbove, rsiCross, email}}
WATCHLIST_STOCKS = {}  # {watchlist_id: [symbol, ...]}
INDICATOR_HISTORY = {}  # {(watchlist_id, symbol): [ {time, EMA, RSI, MACD} ]}
PREV_EMAS = {}  # {(watchlist_id, symbol): {"EMA7": ..., "EMA21": ..., "EMA50": ..., "EMA200": ...}}

def compute_indicators(symbol):
    try:
        from datetime import datetime
        import pytz
        ny = pytz.timezone('America/New_York')
        ny_now = datetime.now(ny)
        market_open = ny_now.hour > 9 or (ny_now.hour == 9 and ny_now.minute >= 30)
        market_close = ny_now.hour < 16
        ticker = yf.Ticker(symbol)
        if market_open and market_close and ny_now.weekday() < 5:
            hist = ticker.history(period="2d", interval="1m")
        else:
            hist = ticker.history(period="1y", interval="1d")
        if hist.empty:
            print(f"[{symbol}] History is empty!")
            return {}
        close = hist['Close']
        high = hist['High']
        low = hist['Low']
        volume = hist['Volume']
        df = pd.DataFrame({'close': close, 'high': high, 'low': low, 'volume': volume})

        # Compute indicators using ta
        df['EMA7'] = ta.trend.ema_indicator(df['close'], window=7)
        df['EMA21'] = ta.trend.ema_indicator(df['close'], window=21)
        df['EMA50'] = ta.trend.ema_indicator(df['close'], window=50)
        df['EMA200'] = ta.trend.ema_indicator(df['close'], window=200)
        df['SMA20'] = ta.trend.sma_indicator(df['close'], window=20)
        df['SMA50'] = ta.trend.sma_indicator(df['close'], window=50)
        bb = ta.volatility.BollingerBands(df['close'], window=20)
        df['UpperBB'] = bb.bollinger_hband()
        df['LowerBB'] = bb.bollinger_lband()
        df['RSI'] = ta.momentum.rsi(df['close'], window=14)
        df['MACD'] = ta.trend.macd(df['close'])
        stoch = ta.momentum.StochasticOscillator(df['high'], df['low'], df['close'], window=14, smooth_window=3)
        df['STOCH'] = stoch.stoch()
        df['ADX'] = ta.trend.adx(df['high'], df['low'], df['close'], window=14)
        df['CCI'] = ta.trend.cci(df['high'], df['low'], df['close'], window=20)
        df['ATR'] = ta.volatility.average_true_range(df['high'], df['low'], df['close'], window=14)
        df['ROC'] = ta.momentum.roc(df['close'], window=12)
        df['WILLIAMS'] = ta.momentum.williams_r(df['high'], df['low'], df['close'], lbp=14)
        df['MFI'] = ta.volume.money_flow_index(df['high'], df['low'], df['close'], df['volume'], window=14)
        df['OBV'] = ta.volume.on_balance_volume(df['close'], df['volume'])
        if market_open and len(df) > 1:
            df['VWAP'] = (df['close'] * df['volume']).cumsum() / df['volume'].cumsum()
        else:
            df['VWAP'] = df['close']
        psar_indicator = ta.trend.PSARIndicator(df['high'], df['low'], df['close'])
        df['PSAR'] = psar_indicator.psar()

        last = df.iloc[-1]
        result = {k: (round(float(last[k]), 2) if pd.notnull(last[k]) else None) for k in [
            'EMA7', 'EMA21', 'EMA50', 'EMA200', 'SMA20', 'SMA50', 'UpperBB', 'LowerBB',
            'RSI', 'MACD', 'STOCH', 'ADX', 'CCI', 'ATR', 'ROC', 'WILLIAMS', 'MFI', 'OBV', 'VWAP', 'PSAR'
        ]}
        return result
    except Exception as e:
        print("Indicator error:", e)
        return {}

def send_email_alert(to_email, subject, message, name="Stock Alert System", time_str=None):
    if not time_str:
        time_str = time.strftime("%Y-%m-%d %H:%M:%S")
    content = f"""
    <b>{subject}</b><br>
    <b>Time:</b> {time_str}<br>
    <b>Message:</b><br>
    {message}
    """
    mail = Mail(
        from_email='tushar.tugnait02@gmail.com',  # Must be a verified sender in SendGrid
        to_emails=to_email,
        subject=subject,
        html_content=content
    )
    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(mail)
        print("SendGrid response:", response.status_code, response.body)
    except Exception as e:
        print("SendGrid error:", e)

def check_ema_crossovers(watchlist_id, symbol, prev, curr, user_email):
    alerts = []
    # Short-term breakout
    if prev and prev["EMA7"] < prev["EMA21"] and prev["EMA7"] < prev["EMA50"] \
       and curr["EMA7"] >= curr["EMA21"] and curr["EMA7"] >= curr["EMA50"]:
        alerts.append("Short-term breakout: 7-day EMA crossed above 21-day and 50-day EMA.")
    # Long-term breakout (fix: only trigger when crossing)
    if prev and prev["EMA7"] < prev["EMA200"] and curr["EMA7"] >= curr["EMA200"]:
        alerts.append("Long-term breakout: 7-day EMA crossed above 200-day EMA.")
    # Short-term breakdown
    if prev and prev["EMA7"] > prev["EMA21"] and prev["EMA7"] > prev["EMA50"] \
       and curr["EMA7"] <= curr["EMA21"] and curr["EMA7"] <= curr["EMA50"]:
        alerts.append("Short-term breakdown: 7-day EMA crossed below 21-day and 50-day EMA.")
    # Long-term breakdown (fix: only trigger when crossing)
    if prev and prev["EMA7"] > prev["EMA200"] and curr["EMA7"] <= curr["EMA200"]:
        alerts.append("Long-term breakdown: 7-day EMA crossed below 200-day EMA.")
    for alert in alerts:
        ALERT_HISTORY.setdefault(symbol, []).append({
            "time": time.strftime("%Y-%m-%d %H:%M:%S"),
            "message": alert
        })
        if user_email:
            send_email_alert(user_email, f"EMA Alert for {symbol}", f"{alert}\n\nSymbol: {symbol}\nWatchlist: {watchlist_id}\nTime: {time.strftime('%Y-%m-%d %H:%M:%S')}")
def check_alerts(symbol, indicators, watchlist_id):
    user = USER_ALERTS.get(watchlist_id)
    if not user or "conditions" not in user:
        return
    triggered = []
    for cond in user["conditions"]:
        ind = cond["indicator"]
        cond_type = cond["type"]
        value = cond["value"]
        ind_val = indicators.get(ind)
        if ind_val is None:
            continue
        # Example logic for common condition types:
        if cond_type == "crosses_above" and ind_val > float(value):
            triggered.append(f"{ind} crossed above {value}")
        elif cond_type == "crosses_below" and ind_val < float(value):
            triggered.append(f"{ind} crossed below {value}")
        # Add more types as needed...
    for msg in triggered:
        ALERT_HISTORY.setdefault(symbol, []).append({"time": time.strftime("%Y-%m-%d %H:%M:%S"), "message": msg})
        email = user.get("email")
        if email:
            send_email_alert(email, f"Alert for {symbol}", msg)

def is_market_open():
    from datetime import datetime
    import pytz
    ny = pytz.timezone('America/New_York')
    ny_now = datetime.now(ny)
    day = ny_now.weekday()  # 0 = Monday, 6 = Sunday
    if day >= 5:  # Saturday/Sunday
        return False
    mins = ny_now.hour * 60 + ny_now.minute
    return mins >= 570 and mins < 960  # 9:30am to 4:00pm

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
                                indicators = batch_data[watch_symbol]
                                check_alerts(watch_symbol, indicators, wid)
                                INDICATOR_HISTORY.setdefault(key, []).append({
                                    "time": time.strftime("%Y-%m-%d %H:%M:%S"),
                                    "EMA7": indicators.get("EMA7"),
                                    "EMA21": indicators.get("EMA21"),
                                    "EMA50": indicators.get("EMA50"),
                                    "EMA200": indicators.get("EMA200"),
                                    "RSI": indicators.get("RSI"),
                                    "MACD": indicators.get("MACD"),
                                })
                                # Limit history to last 100 points
                                if len(INDICATOR_HISTORY[key]) > 100:
                                    INDICATOR_HISTORY[key] = INDICATOR_HISTORY[key][-100:]
                                # --- REMOVE THIS ---
                                # prev = PREV_EMAS.get(key)
                                # curr = {
                                #     "EMA7": indicators.get("EMA7"),
                                #     "EMA21": indicators.get("EMA21"),
                                #     "EMA50": indicators.get("EMA50"),
                                #     "EMA200": indicators.get("EMA200"),
                                # }
                                # user_email = USER_ALERTS.get(wid, {}).get("email")
                                # check_ema_crossovers(wid, watch_symbol, prev, curr, user_email)
                                # PREV_EMAS[key] = curr
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

class AlertRequest(BaseModel):
    watchlist_id: int
    priceAbove: float = None
    rsiCross: float = None
    email: str = None

@app.post("/api/alerts")
def set_alerts(req: AlertRequest):
    USER_ALERTS[req.watchlist_id] = {
        "priceAbove": req.priceAbove,
        "rsiCross": req.rsiCross,
        "email": req.email
    }
    return {"ok": True}

@app.get("/api/alert_history")
def get_alert_history(symbol: str):
    return ALERT_HISTORY.get(symbol, [])

@app.post("/api/watchlist_stocks")
def set_watchlist_stocks(watchlist_id: int = Body(...), symbols: list = Body(...)):
    print("Updating WATCHLIST_STOCKS:", watchlist_id, symbols)
    WATCHLIST_STOCKS[watchlist_id] = symbols
    return {"ok": True}

@app.get("/api/indicator_history")
def get_indicator_history(watchlist_id: int, symbol: str):
    return INDICATOR_HISTORY.get((watchlist_id, symbol), [])

@app.post("/api/indicator_history/refresh")
def refresh_indicator_history(watchlist_id: int = Body(...), symbol: str = Body(...)):
    indicators = compute_indicators(symbol)
    key = (watchlist_id, symbol)
    append_indicator_history(key, indicators)
    return {"ok": True}

class TestAlertRequest(BaseModel):
    watchlist_id: int
    symbol: str
    email: str

@app.post("/api/test_alert")
def test_alert(req: TestAlertRequest):
    prev = {"EMA7": 99, "EMA21": 100, "EMA50": 100, "EMA200": 110}
    curr = {"EMA7": 105, "EMA21": 100, "EMA50": 100, "EMA200": 110}
    check_ema_crossovers(req.watchlist_id, req.symbol, prev, curr, req.email)
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

def append_indicator_history(key, indicators):
    now_str = time.strftime("%Y-%m-%d %H:%M:%S")
    last = INDICATOR_HISTORY.get(key, [])[-1] if INDICATOR_HISTORY.get(key) else None
    if not last or last["time"] != now_str or any(
        last.get(k) != indicators.get(k) for k in indicators.keys()
    ):
        record = {"time": now_str}
        record.update(indicators)
        INDICATOR_HISTORY.setdefault(key, []).append(record)
        if len(INDICATOR_HISTORY[key]) > 100:
            INDICATOR_HISTORY[key] = INDICATOR_HISTORY[key][-100:]
            
@app.post("/api/clear_alerts")
def clear_alerts(symbol: str):
    ALERT_HISTORY[symbol] = []
    return {"ok": True}