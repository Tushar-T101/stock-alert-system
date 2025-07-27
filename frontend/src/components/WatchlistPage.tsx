import { useState, useEffect, useRef, useContext } from 'react'
import AlertConditionsModal from './AlertConditionsModal'
import AlertHistoryModal from './AlertHistoryModal'
import { StockDataContext } from '../App'
import IndicatorHistoryModal from './IndicatorHistoryModal'

const backendUrl = import.meta.env.VITE_BACKEND_URL

type Stock = {
  symbol: string
  indicators: {
    EMA: boolean
    RSI: boolean
    MACD: boolean
  }
  EMA7?: number
  RSI?: number
  MACD?: number
}

type StockDetail = {
  symbol: string
  name: string
  price: number
  change: number
  EMA?: number
  RSI?: number
  MACD?: number
}

const TABS = [
  'Stocks', 'Funds', 'Futures', 'Forex', 'Crypto', 'Indices', 'Bonds', 'Economy', 'Options'
]

export default function WatchlistPage({ id, onBack }: { id: number; onBack: () => void }) {
  const [stocks, setStocks] = useState<Stock[]>([
    { symbol: 'AAPL', indicators: { EMA: true, RSI: true, MACD: true } },
    { symbol: 'MSFT', indicators: { EMA: true, RSI: false, MACD: true } },
  ])
  const [addModal, setAddModal] = useState(false)
  const [selectedStock, setSelectedStock] = useState<string>('')
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('Stocks')
  const [loading, setLoading] = useState(false)
  const [alertModal, setAlertModal] = useState(false)
  const [alertConditions, setAlertConditions] = useState<any>({})
  const [historyModal, setHistoryModal] = useState<{ open: boolean, symbol: string } | null>(null)
  const [alertHistory, setAlertHistory] = useState<{ time: string, message: string }[]>([])
  const [alertStatuses, setAlertStatuses] = useState<{ [symbol: string]: string }>({});
  const wsRef = useRef<WebSocket | null>(null)
  const { stockOptions, setStockOptions } = useContext(StockDataContext)
  const optionsForTab = stockOptions[activeTab] || []
  const watchlistSymbols = stocks.map(s => s.symbol);
  const [indicatorModal, setIndicatorModal] = useState<{ open: boolean; symbol: string } | null>(null)

  // 1. Fetch initial indicator values for watchlist stocks ONCE
  useEffect(() => {
    async function fetchIndicators() {
      const updatedStocks = await Promise.all(
        stocks.map(async stock => {
          const res = await fetch(`${backendUrl}/api/stocks?type=Stocks&search=${stock.symbol}`)
          const data = await res.json()
          const found = data.find((s: any) => s.symbol === stock.symbol)
          return found
            ? { ...stock, EMA7: found.EMA7, RSI: found.RSI, MACD: found.MACD }
            : stock
        })
      )
      setStocks(updatedStocks)
    }
    fetchIndicators()
    // eslint-disable-next-line
  }, []) // Only on mount

  // 2. WebSocket for live updates for watchlist stocks
  useEffect(() => {
    wsRef.current = new WebSocket(`${backendUrl.replace(/^http/, 'ws')}/ws/prices`)
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setStocks(prev =>
        prev.map(stock =>
          data[stock.symbol]
            ? { ...stock, EMA7: data[stock.symbol].EMA7, RSI: data[stock.symbol].RSI, MACD: data[stock.symbol].MACD }
            : stock
        )
      )
    }
    return () => {
      wsRef.current?.close()
    }
    // eslint-disable-next-line
  }, [])

  // 3. Add Modal: HTTP fetch for initial options, then WebSocket for live updates
  useEffect(() => {
    if (addModal) {
      setLoading(true)
      fetch(`${backendUrl}/api/stocks?type=${activeTab}&search=${encodeURIComponent(search)}`)
        .then(res => res.json())
        .then(data => {
          setLoading(false)
        })
        .catch(() => setLoading(false))
      // WebSocket for live updates in add modal
      wsRef.current = new WebSocket(`${backendUrl.replace(/^http/, 'ws')}/ws/prices`)
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data)
        setStockOptions(prev =>
          prev.map(opt => data[opt.symbol] ? { ...opt, ...data[opt.symbol] } : opt)
        )
      }
      return () => {
        wsRef.current?.close()
      }
    }
    // eslint-disable-next-line
  }, [addModal, activeTab, search])

  // 4. Fetch alert statuses for all stocks
  useEffect(() => {
    async function fetchAlertStatuses() {
      const statuses: { [symbol: string]: string } = {}
      for (const stock of stocks) {
        const res = await fetch(`${backendUrl}/api/alert_history?symbol=${stock.symbol}`)
        const history = await res.json()
        statuses[stock.symbol] = history.length > 0 ? history[history.length - 1].message : 'No alerts'
      }
      setAlertStatuses(statuses)
    }
    fetchAlertStatuses()
  }, [stocks])

  // 5. Sync watchlist stocks with backend
  useEffect(() => {
    fetch(`${backendUrl}/api/watchlist_stocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ watchlist_id: id, symbols: stocks.map(s => s.symbol) })
    })
  }, [stocks, id])

  const handleAddStock = () => {
    if (selectedStock && !stocks.find(s => s.symbol === selectedStock)) {
      setStocks([...stocks, { symbol: selectedStock, indicators: { EMA: true, RSI: true, MACD: true } }])
      setSelectedStock('')
      setAddModal(false)
    }
  }

  const handleAddStocks = () => {
    const newStocks = selectedStocks
      .filter(sym => !stocks.find(s => s.symbol === sym))
      .map(sym => ({
        symbol: sym,
        indicators: { EMA: true, RSI: true, MACD: true }
      }));
    setStocks([...stocks, ...newStocks]);
    setSelectedStocks([]);
    setAddModal(false);
    // After setStocks([...stocks, ...newStocks]);
    Promise.all(
      newStocks.map(ns =>
        fetch(`${backendUrl}/api/indicator_history/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ watchlist_id: id, symbol: ns.symbol })
        })
      )
    )
  };

  const handleRemove = (idx: number) => {
    setStocks(stocks.filter((_, i) => i !== idx))
  }

  const handleIndicatorChange = (idx: number, indicator: keyof Stock['indicators']) => {
    setStocks(stocks =>
      stocks.map((s, i) =>
        i === idx ? { ...s, indicators: { ...s.indicators, [indicator]: !s.indicators[indicator] } } : s
      )
    )
  }

  const handleSaveAlert = (conds: any) => {
    setAlertConditions(conds)
    fetch(`${backendUrl}/api/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ watchlist_id: id, ...conds, email: 'user@email.com' }) // Replace with user email
    })
    setAlertModal(false)
  }

  const handleShowHistory = (symbol: string) => {
    fetch(`${backendUrl}/api/alert_history?symbol=${symbol}`)
      .then(res => res.json())
      .then(setAlertHistory)
    setHistoryModal({ open: true, symbol })
  }

  return (
    <div className="p-6">
      <button className="mb-4 text-blue-600 underline" onClick={onBack}>
        ← Back to Dashboard
      </button>
      <h2 className="text-2xl font-bold mb-4">Watchlist #{id}</h2>
      <div className="flex gap-4 mb-6">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          onClick={() => setAddModal(true)}
        >
          + Add Stock
        </button>
        <button
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
          onClick={() => setAlertModal(true)}
        >
          Set Alert Conditions
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {stocks.map((stock, idx) => (
          <div
            key={stock.symbol}
            className="bg-white rounded-xl shadow-md p-6 flex flex-col gap-3 transition-all duration-200 hover:shadow-lg animate-fadein cursor-pointer"
            onClick={() => setIndicatorModal({ open: true, symbol: stock.symbol })}
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">{stock.symbol}</span>
              <button
                className="text-red-500 hover:text-red-700 transition"
                onClick={e => { e.stopPropagation(); handleRemove(idx); }}
                title="Remove"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 7h12M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 11v6m4-6v6"
                  />
                </svg>
              </button>
            </div>
            {/* Removed indicator checkboxes */}
            <div className="flex gap-2 mt-2">
              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                EMA7: {stock.EMA7 ?? '--'}
              </span>
              <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs">
                RSI: {stock.RSI ?? '--'}
              </span>
              <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs">
                MACD: {stock.MACD ?? '--'}
              </span>
            </div>
            <div className="text-sm text-yellow-600 min-h-[1.5em]">
              {alertStatuses[stock.symbol] || '[Alert status here]'}
            </div>
          </div>
        ))}
      </div>
      {/* Modals */}
      <AlertConditionsModal
        open={alertModal}
        onClose={() => setAlertModal(false)}
        onSave={handleSaveAlert}
        initial={alertConditions}
      />
      <AlertHistoryModal
        open={!!historyModal?.open}
        onClose={() => setHistoryModal(null)}
        history={alertHistory}
      />
      {addModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 animate-fadein">
          <div className="bg-white rounded-xl shadow-2xl p-0 min-w-[500px] max-w-[95vw] transition-all duration-300">
            {/* Search Bar */}
            <div className="p-4 border-b flex items-center gap-2">
              <input
                type="text"
                className="border rounded px-3 py-2 w-full"
                placeholder={`Search ${activeTab.toLowerCase()}, eg. AAPL`}
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
              <button className="ml-2 text-gray-400 hover:text-gray-600" onClick={() => setAddModal(false)}>
                <svg width="24" height="24" fill="none" stroke="currentColor"><path d="M6 6l12 12M6 18L18 6" strokeWidth="2"/></svg>
              </button>
            </div>
            {/* Tabs */}
            <div className="px-4 py-2 border-b flex gap-2">
              {TABS.map(tab => (
                <button
                  key={tab}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${activeTab === tab ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700'} transition`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            {/* Results */}
            {(() => {
              const watchlistSymbols = stocks.map(s => s.symbol);
              return (
                <div className="max-h-[400px] overflow-y-auto bg-gray-50">
                  {loading && (
                    <div className="p-4 text-gray-400 text-center">Loading...</div>
                  )}
                  {!loading && optionsForTab.length === 0 && (
                    <div className="p-4 text-gray-400 text-center">No results</div>
                  )}
                  {!loading && optionsForTab
                    .filter(s => !watchlistSymbols.includes(s.symbol))
                    .map(s => (
                      <div
                        key={s.symbol}
                        className={`flex items-center justify-between px-4 py-3 border-b cursor-pointer hover:bg-blue-50 transition ${selectedStocks.includes(s.symbol) ? 'bg-blue-100' : ''}`}
                        onClick={() => {
                          setSelectedStocks(sel =>
                            sel.includes(s.symbol)
                              ? sel.filter(sym => sym !== s.symbol)
                              : [...sel, s.symbol]
                          );
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedStocks.includes(s.symbol)}
                          onChange={e => {
                            e.stopPropagation();
                            setSelectedStocks(sel =>
                              sel.includes(s.symbol)
                                ? sel.filter(sym => sym !== s.symbol)
                                : [...sel, s.symbol]
                            );
                          }}
                          className="mr-2"
                        />
                        <div>
                          <span className="font-semibold">{s.symbol}</span>
                          <span className="ml-2 text-gray-600">{s.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono">${s.price?.toFixed(2) ?? '--'}</span>
                          <span className={`ml-2 ${s.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {s.change >= 0 ? '+' : ''}{s.change?.toFixed(2) ?? '--'}
                          </span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              );
            })()}
            {/* Add Button */}
            <div className="flex gap-2 p-4">
              <button
                className={`px-4 py-2 bg-blue-600 text-white rounded ${selectedStocks.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleAddStocks}
                disabled={selectedStocks.length === 0}
              >
                Add
              </button>
              <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setAddModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {indicatorModal?.open && (
        <IndicatorHistoryModal
          open={indicatorModal.open}
          onClose={() => setIndicatorModal(null)}
          watchlistId={id}
          symbol={indicatorModal.symbol}
        />
      )}
    </div>
  )
}