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
  const [tab, setTab] = useState<'indicators' | 'alerts'>('indicators')
  const [history, setHistory] = useState<
    { time: string; EMA?: number; RSI?: number; MACD?: number }[]
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 animate-fadein">
      <div className="bg-white rounded-xl shadow-2xl p-8 min-w-[350px] max-w-[95vw] transition-all duration-300 w-[500px]">
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
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {!isMarketOpen() && (
            <div className="text-yellow-700 bg-yellow-50 rounded px-3 py-2 mb-2 text-xs font-medium">
              US Market is closed. Showing last available reading.
            </div>
          )}
          {tab === 'indicators' ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b">
                  <th className="py-1 px-2 text-left">Time</th>
                  <th className="py-1 px-2">EMA</th>
                  <th className="py-1 px-2">RSI</th>
                  <th className="py-1 px-2">MACD</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-400 py-4">
                      No indicator data yet.
                    </td>
                  </tr>
                ) : (
                  (!isMarketOpen() ? [history[history.length - 1]] : history.slice(-50).reverse()).map((h, i) => (
                    <tr
                      key={h.time + (h.EMA ?? '') + (h.RSI ?? '') + (h.MACD ?? '')}
                      className={`border-b last:border-b-0 ${i === 0 ? 'fadein-row' : ''}`}
                    >
                      <td className="py-1 px-2 font-mono">{h.time}</td>
                      <td className="py-1 px-2 text-blue-700">{h.EMA ?? '--'}</td>
                      <td className="py-1 px-2 text-green-700">{h.RSI ?? '--'}</td>
                      <td className="py-1 px-2 text-purple-700">{h.MACD ?? '--'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
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
          )}
        </div>
        <button className="mt-8 px-4 py-2 bg-gray-200 rounded" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}