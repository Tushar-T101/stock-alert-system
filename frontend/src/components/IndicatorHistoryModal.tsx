import { useEffect, useState } from 'react'
import { isMarketOpen } from '../App.tsx'

export default function IndicatorHistoryModal({
  open,
  onClose,
  watchlistId,
  symbol,
}: {
  open: boolean
  onClose: () => void
  watchlistId: number
  symbol: string
}) {
  const [tab, setTab] = useState<'indicators' | 'alerts' | 'emaChart'>('indicators')
  const [history, setHistory] = useState<
    { time: string; EMA?: number; EMA7?: number; EMA21?: number; EMA50?: number; EMA200?: number; RSI?: number; MACD?: number }[]
  >([])
  const [alertHistory, setAlertHistory] = useState<{ time: string; message: string }[]>([])

  // Indicator history polling
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined

    async function fetchAndRefresh() {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/indicator_history/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchlist_id: watchlistId, symbol })
      })
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/indicator_history?watchlist_id=${watchlistId}&symbol=${symbol}`
      )
      const data = await res.json()
      setHistory(data)
    }

    if (open && tab === 'indicators') {
      fetchAndRefresh()
      interval = setInterval(fetchAndRefresh, 5000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [open, watchlistId, symbol, tab])

  // Alert history fetch
  useEffect(() => {
    if (open && tab === 'alerts') {
      fetch(`${import.meta.env.VITE_BACKEND_URL}/api/alert_history?symbol=${symbol}`)
        .then(res => res.json())
        .then(setAlertHistory)
    }
  }, [open, symbol, tab])

  if (!open) return null

  // Helper to get TradingView symbol (e.g., "AAPL" -> "NASDAQ:AAPL")
  const getTradingViewSymbol = (sym: string) => {
    if (/^[A-Z]+$/.test(sym)) return `NASDAQ:${sym}`
    return sym
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 animate-fadein">
      <div className="bg-white rounded-xl shadow-2xl p-8 min-w-[350px] max-w-[95vw] transition-all duration-300 w-[700px]">
        <h3 className="text-lg font-bold mb-4">
          {symbol} History
        </h3>
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            className={`px-3 py-1 rounded-full text-xs font-medium ${tab === 'indicators' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700'} transition`}
            onClick={() => setTab('indicators')}
          >
            Indicator History
          </button>
          <button
            className={`px-3 py-1 rounded-full text-xs font-medium ${tab === 'alerts' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700'} transition`}
            onClick={() => setTab('alerts')}
          >
            Alert History
          </button>
          <button
            className={`px-3 py-1 rounded-full text-xs font-medium ${tab === 'emaChart' ? 'bg-blue-900 text-white' : 'bg-gray-200 text-gray-700'} transition`}
            onClick={() => setTab('emaChart')}
          >
            EMA Chart
          </button>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {tab === 'indicators' ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b">
                  <th className="py-1 px-2 text-left">Time</th>
                  <th className="py-1 px-2">EMA7</th>
                  <th className="py-1 px-2">EMA21</th>
                  <th className="py-1 px-2">EMA50</th>
                  <th className="py-1 px-2">EMA200</th>
                  <th className="py-1 px-2">RSI</th>
                  <th className="py-1 px-2">MACD</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-400 py-4">
                      No indicator data yet.
                    </td>
                  </tr>
                ) : (
                  (!isMarketOpen() ? [history[history.length - 1]] : history.slice(-50).reverse()).map((h, i) => (
                    <tr
                      key={h.time + (h.EMA7 ?? '') + (h.EMA21 ?? '') + (h.EMA50 ?? '') + (h.EMA200 ?? '')}
                      className={`border-b last:border-b-0 ${i === 0 ? 'fadein-row' : ''}`}
                    >
                      <td className="py-1 px-2 font-mono">{h.time}</td>
                      <td className="py-1 px-2 text-blue-700">{h.EMA7 ?? '--'}</td>
                      <td className="py-1 px-2 text-blue-700">{h.EMA21 ?? '--'}</td>
                      <td className="py-1 px-2 text-blue-700">{h.EMA50 ?? '--'}</td>
                      <td className="py-1 px-2 text-blue-700">{h.EMA200 ?? '--'}</td>
                      <td className="py-1 px-2 text-green-700">{h.RSI ?? '--'}</td>
                      <td className="py-1 px-2 text-purple-700">{h.MACD ?? '--'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : tab === 'alerts' ? (
            <div className="space-y-2">
              {alertHistory.length === 0 ? (
                <div className="text-gray-400 text-center py-4">No alerts triggered yet.</div>
              ) : (
                alertHistory.map((h, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-mono text-gray-500">{h.time}</span> — {h.message}
                  </div>
                ))
              )}
            </div>
          ) : (
            // EMA Chart tab
            <div className="w-full h-[400px] flex flex-col">
              <div className="text-xs text-yellow-700 bg-yellow-50 rounded px-3 py-2 mb-2 font-medium">
                Tip: To view EMA lines, click <b>Indicators</b> on the chart and add EMA with periods 7, 21, 50, 200.
              </div>
              <iframe
                title={`${symbol} EMA Chart`}
                src={`https://www.tradingview.com/widgetembed/?symbol=${getTradingViewSymbol(symbol)}&interval=60&theme=light&style=1`}
                width="100%"
                height="100%"
                style={{ border: 'none', borderRadius: '8px', minHeight: '400px' }}
                allowFullScreen
              />
            </div>
          )}
        </div>
        <button className="mt-8 px-4 py-2 bg-gray-200 rounded" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}