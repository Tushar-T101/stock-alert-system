import { useState, useEffect, useRef, useContext } from 'react'
import AlertConditionsModal from './AlertConditionsModal'
import AlertHistoryModal from './AlertHistoryModal'
import { StockDataContext } from '../App'
import IndicatorHistoryModal from './IndicatorHistoryModal'
import { INDICATORS } from '../indicators'
import DeleteIcon from '@mui/icons-material/Delete'
import SettingsIcon from '@mui/icons-material/Settings'

const backendUrl = import.meta.env.VITE_BACKEND_URL

const ICONS = ['📈','💼','🚀','💡','⭐','🔔','🧠','🛡️']

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

// Tooltip helper (optional)
function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <span className="relative group">
      {children}
      <span className="absolute left-1/2 -translate-x-1/2 mt-2 z-50 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
        {text}
      </span>
    </span>
  )
}

const INDICATOR_COLORS: Record<string, string> = {
  EMA7: 'bg-blue-50 text-blue-700',
  EMA21: 'bg-green-50 text-green-700',
  EMA50: 'bg-purple-50 text-purple-700',
  EMA200: 'bg-orange-50 text-orange-700',
  SMA20: 'bg-indigo-50 text-indigo-700',
  SMA50: 'bg-pink-50 text-pink-700',
  UpperBB: 'bg-yellow-50 text-yellow-700',
  LowerBB: 'bg-yellow-100 text-yellow-800',
  RSI: 'bg-teal-50 text-teal-700',
  MACD: 'bg-red-50 text-red-700',
  STOCH: 'bg-fuchsia-50 text-fuchsia-700',
  ADX: 'bg-cyan-50 text-cyan-700',
  CCI: 'bg-lime-50 text-lime-700',
  ATR: 'bg-amber-50 text-amber-700',
  ROC: 'bg-gray-100 text-gray-700',
  WILLIAMS: 'bg-emerald-50 text-emerald-700',
  MFI: 'bg-slate-50 text-slate-700',
  OBV: 'bg-violet-50 text-violet-700',
  VWAP: 'bg-blue-100 text-blue-900',
  PSAR: 'bg-orange-100 text-orange-900',
}

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
  const [watchlist, setWatchlist] = useState<any>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const { stockOptions, setStockOptions } = useContext(StockDataContext)
  const optionsForTab = stockOptions[activeTab] || []
  const watchlistSymbols = stocks.map(s => s.symbol);
  const [indicatorModal, setIndicatorModal] = useState<{ open: boolean; symbol: string } | null>(null)

  // --- Settings modal state ---
  const [editModal, setEditModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newIcon, setNewIcon] = useState(ICONS[0])
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([])

  useEffect(() => {
    // Load watchlist from localStorage
    const saved = localStorage.getItem('watchlists')
    if (saved) {
      const found = JSON.parse(saved).find((w: any) => w.id === id)
      setWatchlist(found)
      if (found) {
        setNewName(found.name)
        setNewDesc(found.description || '')
        setNewIcon(found.icon || ICONS[0])
        setSelectedIndicators(found.indicators || [])
      }
    }
  }, [id])

  // 1. Initial fetch
  useEffect(() => {
    async function fetchIndicators() {
      const updatedStocks = await Promise.all(
        stocks.map(async (stock) => {
          const res = await fetch(`${backendUrl}/api/stocks?type=Stocks&search=${stock.symbol}`)
          const data = await res.json()
          const found = data.find((s: any) => s.symbol === stock.symbol)
          if (!found) return stock
          // Add all indicators from watchlist
          const indicatorsObj: Record<string, any> = {};
          (watchlist?.indicators || []).forEach(indKey => {
            indicatorsObj[indKey] = found[indKey]
          })
          return { ...stock, ...indicatorsObj }
        })
      )
      setStocks(updatedStocks)
    }
    fetchIndicators()
    // eslint-disable-next-line
  }, [watchlist]) // re-fetch if indicators change

  // 2. WebSocket update
  useEffect(() => {
    wsRef.current = new WebSocket(`${backendUrl.replace(/^http/, 'ws')}/ws/prices`)
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setStocks(prev =>
        prev.map(stock => {
          const update = {};
          (watchlist?.indicators || []).forEach(indKey => {
            update[indKey] = data[stock.symbol]?.[indKey]
          })
          return data[stock.symbol]
            ? { ...stock, ...update }
            : stock
        })
      )
    }
    return () => {
      wsRef.current?.close()
    }
    // eslint-disable-next-line
  }, [watchlist])

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
        setStockOptions(prev => ({
          ...prev,
          [activeTab]: Array.isArray(prev[activeTab])
            ? prev[activeTab].map(opt => data[opt.symbol] ? { ...opt, ...data[opt.symbol] } : opt)
            : []
        }))
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

  const handleClearAlerts = async () => {
    // Clear alerts for all stocks in this watchlist
    await Promise.all(
      stocks.map(stock =>
        fetch(`${backendUrl}/api/clear_alerts?symbol=${stock.symbol}`, { method: 'POST' })
      )
    )
    // Refresh alert statuses
    const statuses: { [symbol: string]: string } = {}
    for (const stock of stocks) {
      const res = await fetch(`${backendUrl}/api/alert_history?symbol=${stock.symbol}`)
      const history = await res.json()
      statuses[stock.symbol] = history.length > 0 ? history[history.length - 1].message : 'No alerts'
    }
    setAlertStatuses(statuses)
  }

  return (
    <div className="p-6">
      <button className="mb-4 text-blue-600 underline" onClick={onBack}>
        ← Back to Dashboard
      </button>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-2xl font-bold">{watchlist?.name || `Watchlist #${id}`}</h2>
        <button
          className="flex items-center gap-1 px-3 py-1 rounded-full text-gray-700 text-sm font-medium transition"
          onClick={() => {
            if (watchlist) {
              setEditModal(true)
              setNewName(watchlist.name)
              setNewDesc(watchlist.description || '')
              setNewIcon(watchlist.icon || ICONS[0])
              setSelectedIndicators(watchlist.indicators || [])
            }
          }}
          title="Watchlist Settings"
        >
          <SettingsIcon />
        </button>
      </div>
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
        <button
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          onClick={handleClearAlerts}
        >
          Clear Alerts
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
                <DeleteIcon />
              </button>
            </div>
            <div className="flex gap-2 mt-2 overflow-x-auto flex-nowrap pb-1">
              {watchlist?.indicators?.map(indKey => {
                const indMeta = INDICATORS.find(i => i.key === indKey)
                let value = stock[indKey]
                if (typeof value === 'number') value = value.toFixed(2)
                if (value === undefined || value === null || typeof value === 'object') value = '--'
                // Use color map, fallback to gray
                const color = INDICATOR_COLORS[indKey] || 'bg-gray-100 text-gray-700'
                return (
                  <span key={indKey} className={`${color} px-2 py-1 rounded text-xs whitespace-nowrap`}>
                    {indMeta?.label}: {value}
                  </span>
                )
              })}
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
        indicators={watchlist?.indicators || []}
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
      {/* --- Settings Modal --- */}
      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 animate-fadein">
          <div className="bg-white rounded-2xl shadow-2xl p-8 min-w-[350px] max-w-[95vw] w-full sm:w-[440px] transition-all duration-300">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span role="img" aria-label="Edit">✏️</span> Edit Watchlist
            </h3>
            <label className="block font-semibold mb-2 text-gray-700">Name</label>
            <input
              type="text"
              className="border border-gray-300 rounded-lg px-3 py-2 w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
              placeholder="Watchlist name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              autoFocus
            />
            <label className="block font-semibold mb-2 text-gray-700">Description <span className="text-xs text-gray-400">(optional)</span></label>
            <textarea
              className="border border-gray-300 rounded-lg px-3 py-2 w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-200 transition resize-none"
              placeholder="Describe this watchlist (optional)"
              rows={2}
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
            />
            <label className="block font-semibold mb-2 text-gray-700">Icon</label>
            <div className="flex gap-2 mb-4" title="Choose an icon">
              {ICONS.map(icon => (
                <Tooltip key={icon} text="Choose an icon">
                  <button
                    type="button"
                    className={`text-2xl rounded-full p-1 border-2 transition
                      ${icon === newIcon ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:border-blue-300'}`}
                    onClick={() => setNewIcon(icon)}
                    aria-label={`Choose icon ${icon}`}
                  >
                    {icon}
                  </button>
                </Tooltip>
              ))}
            </div>
            <label className="block font-semibold mb-2 text-gray-700">
              Indicators
              <span className="text-xs text-gray-400 ml-2">(applies to all stocks)</span>
            </label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                className="text-xs px-2 py-1 bg-blue-100 rounded hover:bg-blue-200"
                onClick={() => setSelectedIndicators(INDICATORS.map(i => i.key))}
              >
                Select All
              </button>
              <button
                type="button"
                className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                onClick={() => setSelectedIndicators([])}
              >
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {INDICATORS.map(ind => (
                <Tooltip key={ind.key} text={ind.label}>
                  <label
                    className={`flex items-center gap-1 text-sm px-2 py-1 rounded cursor-pointer transition
                      ${selectedIndicators.includes(ind.key) ? 'bg-blue-50' : 'hover:bg-gray-100'}`}
                    title={ind.label}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIndicators.includes(ind.key)}
                      onChange={() =>
                        setSelectedIndicators(sel =>
                          sel.includes(ind.key)
                            ? sel.filter(k => k !== ind.key)
                            : [...sel, ind.key]
                        )
                      }
                      className="accent-blue-600"
                    />
                    {ind.label}
                  </label>
                </Tooltip>
              ))}
            </div>
            {selectedIndicators.length === 0 && (
              <div className="text-xs text-red-600 mb-2">Select at least one indicator.</div>
            )}
            <div className="flex gap-2 mt-6">
              <button
                className={`px-4 py-2 bg-blue-600 text-white rounded font-semibold transition ${
                  !newName.trim() || selectedIndicators.length === 0
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
                onClick={() => {
                  // Save changes to localStorage
                  const saved = localStorage.getItem('watchlists')
                  if (saved) {
                    const arr = JSON.parse(saved)
                    const idx = arr.findIndex((w: any) => w.id === id)
                    if (idx !== -1) {
                      arr[idx] = {
                        ...arr[idx],
                        name: newName,
                        description: newDesc,
                        icon: newIcon,
                        indicators: selectedIndicators,
                      }
                      localStorage.setItem('watchlists', JSON.stringify(arr))
                      setWatchlist(arr[idx])
                    }
                  }
                  setEditModal(false)
                }}
                disabled={!newName.trim() || selectedIndicators.length === 0}
              >
                Save
              </button>
              <button
                className="px-4 py-2 bg-gray-200 rounded font-semibold"
                onClick={() => setEditModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {indicatorModal?.open && watchlist && (
        <IndicatorHistoryModal
          open={indicatorModal.open}
          onClose={() => setIndicatorModal(null)}
          watchlistId={id}
          symbol={indicatorModal.symbol}
          indicators={watchlist.indicators}
        />
      )}
    </div>
  )
}