import { useEffect, useState } from 'react'
import { isMarketOpen } from '../App.tsx'
import { INDICATORS } from '../indicators'

function getTradingViewSymbol(symbol: string) {
  if (symbol.endsWith('-USD')) return `CRYPTO:${symbol.replace('-USD', 'USD')}`
  if (/^[A-Z]+$/.test(symbol)) return `NASDAQ:${symbol}`
  return symbol
}

export default function IndicatorHistoryModal({
  open,
  onClose,
  watchlistId,
  symbol,
  indicators,
}: {
  open: boolean
  onClose: () => void
  watchlistId: number
  symbol: string
  indicators: string[]
}) {
  const [tab, setTab] = useState<'indicators' | 'alerts' | 'emaChart'>('indicators')
  const [history, setHistory] = useState<
    { time: string; EMA?: number; EMA7?: number; EMA21?: number; EMA50?: number; EMA200?: number; RSI?: number; MACD?: number }[]
  >([])
  const [alertHistory, setAlertHistory] = useState<{ time: string; message: string }[]>([])
  const [marketOpen, setMarketOpen] = useState(isMarketOpen())

  useEffect(() => {
    const interval = setInterval(() => setMarketOpen(isMarketOpen()), 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined

    async function fetchHistory() {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/indicator_history?watchlist_id=${watchlistId}&symbol=${symbol}`
      )
      const data = await res.json()
      setHistory(data)
    }

    if (open && tab === 'indicators') {
      fetchHistory()
      interval = setInterval(fetchHistory, 60000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [open, watchlistId, symbol, tab])

  useEffect(() => {
    if (open && tab === 'alerts') {
      fetch(`${import.meta.env.VITE_BACKEND_URL}/api/alert_history?symbol=${symbol}`)
        .then(res => res.json())
        .then(setAlertHistory)
    }
  }, [open, symbol, tab])

  if (!open) return null

  const indicatorMeta = INDICATORS.filter(ind => indicators.includes(ind.key))

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-80 flex items-center justify-center z-50 animate-fadein">
      <div className="bg-white dark:bg-neutral-950 rounded-xl shadow-2xl p-8 min-w-[350px] max-w-[95vw] transition-all duration-300 w-[900px]">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-neutral-100">
          {symbol} History
        </h3>
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              tab === 'indicators'
                ? 'bg-neutral-900 text-white dark:bg-neutral-800 dark:text-neutral-100'
                : 'bg-gray-200 text-gray-700 dark:bg-neutral-900 dark:text-neutral-300'
            }`}
            onClick={() => setTab('indicators')}
          >
            Indicator History
          </button>
          <button
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              tab === 'alerts'
                ? 'bg-neutral-900 text-white dark:bg-neutral-800 dark:text-neutral-100'
                : 'bg-gray-200 text-gray-700 dark:bg-neutral-900 dark:text-neutral-300'
            }`}
            onClick={() => setTab('alerts')}
          >
            Alert History
          </button>
          <button
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              tab === 'emaChart'
                ? 'bg-neutral-900 text-white dark:bg-neutral-800 dark:text-neutral-100'
                : 'bg-gray-200 text-gray-700 dark:bg-neutral-900 dark:text-neutral-300'
            }`}
            onClick={() => setTab('emaChart')}
          >
            EMA Chart
          </button>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {tab === 'indicators' ? (
            <>
              <div className="text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900 rounded px-3 py-2 mb-2 font-medium">
                Note: New indicator values are calculated and added every 1 minute while the market is open.
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 dark:text-neutral-400 border-b dark:border-neutral-800">
                    <th className="py-1 px-2 text-left">Time</th>
                    {indicatorMeta.map(ind => (
                      <th key={ind.key} className="py-1 px-2">{ind.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={indicatorMeta.length + 1} className="text-center text-gray-400 dark:text-neutral-500 py-4">
                        No indicator data yet.
                      </td>
                    </tr>
                  ) : (
                    (marketOpen ? history.slice(-50).reverse() : [history[history.length - 1]]).map((h, i) => (
                      <tr
                        key={h.time + indicatorMeta.map(ind => h[ind.key] ?? '').join('')}
                        className={`border-b dark:border-neutral-800 last:border-b-0 ${i === 0 ? 'fadein-row' : ''}`}
                      >
                        <td className="py-1 px-2 font-mono text-gray-900 dark:text-neutral-100">{h.time}</td>
                        {indicatorMeta.map(ind => (
                          <td key={ind.key} className="py-1 px-2 text-gray-900 dark:text-neutral-100">{h[ind.key] ?? '--'}</td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </>
          ) : tab === 'alerts' ? (
            <div className="space-y-2">
              {alertHistory.length === 0 ? (
                <div className="text-gray-400 dark:text-neutral-500 text-center py-4">No alerts triggered yet.</div>
              ) : (
                alertHistory.map((h, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-mono text-gray-500 dark:text-neutral-400">{h.time}</span> — <span className="text-gray-900 dark:text-neutral-100">{h.message}</span>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="w-full h-[400px] flex flex-col">
              <div className="text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900 rounded px-3 py-2 mb-2 font-medium">
                Tip: To view EMA lines, click <b>Indicators</b> on the chart and add EMA with periods 7, 21, 50, 200.
              </div>
              <iframe
                title={`${symbol} EMA Chart`}
                src={`https://www.tradingview.com/widgetembed/?symbol=${getTradingViewSymbol(symbol)}&interval=60&theme=${document.documentElement.classList.contains('dark') ? 'dark' : 'light'}&style=1`}
                width="100%"
                height="100%"
                style={{ border: 'none', borderRadius: '8px', minHeight: '400px' }}
                allowFullScreen
              />
            </div>
          )}
        </div>
        <button className="mt-8 px-4 py-2 bg-gray-200 dark:bg-neutral-900 rounded hover:bg-gray-300 dark:hover:bg-neutral-800 font-semibold text-gray-900 dark:text-neutral-100" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}