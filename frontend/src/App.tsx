import { useState, useEffect, createContext } from 'react'
import Watchlists from './components/Watchlists'
import SettingsModal from './components/SettingsModal'
import LiveNiftyChart from './components/LiveNiftyChart'
import WatchlistPage from './components/WatchlistPage'
import Notification from './components/Notification'
import './styles/notifications.css'

export function isMarketOpen() {
  // Get current time in EST (UTC-5 or UTC-4 for daylight saving)
  const now = new Date()
  // Convert to UTC, then to EST (New York time)
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  // New York is UTC-4 during daylight saving (Mar-Nov), UTC-5 otherwise
  const jan = new Date(now.getFullYear(), 0, 1)
  const jul = new Date(now.getFullYear(), 6, 1)
  const stdTimezoneOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset())
  const isDST = now.getTimezoneOffset() < stdTimezoneOffset
  const offset = isDST ? -4 : -5
  const est = new Date(utc + 3600000 * offset)

  const hours = est.getHours()
  const minutes = est.getMinutes()
  // Market open: 9:30 AM (9*60+30=570), close: 4:00 PM (16*60=960)
  const mins = hours * 60 + minutes
  return mins >= 570 && mins < 960
}

// Create a context for stock data
export const StockDataContext = createContext<{
  stockOptions: Record<string, any[]>
  setStockOptions: React.Dispatch<React.SetStateAction<Record<string, any[]>>>
}>({ stockOptions: {}, setStockOptions: () => {} })

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [selectedWatchlist, setSelectedWatchlist] = useState<number | null>(null)
  const [logs, setLogs] = useState<{ time: string; message: string }[]>([])
  const [marketOpen, setMarketOpen] = useState(isMarketOpen())
  const [notifications, setNotifications] = useState<
    { id: string; type: 'success' | 'warning' | 'error'; message: React.ReactNode }[]
  >([])
  const [stockOptions, setStockOptions] = useState<Record<string, any[]>>({})

  useEffect(() => {
    // Check every minute
    const interval = setInterval(() => setMarketOpen(isMarketOpen()), 60000)
    return () => clearInterval(interval)
  }, [])

  // Show market closed notification if not already present
  useEffect(() => {
    if (!marketOpen) {
      setNotifications((prev) =>
        prev.some((n) => n.id === 'market-closed')
          ? prev
          : [
              ...prev,
              {
                id: 'market-closed',
                type: 'warning',
                message: (
                  <>
                    US Stock Market is currently <span className="underline">closed</span>.<br />
                    Open: 9:30 AM – 4:00 PM EST (7:00 PM – 1:30 AM IST)
                  </>
                ),
              },
            ]
      )
    } else {
      setNotifications((prev) => prev.filter((n) => n.id !== 'market-closed'))
    }
  }, [marketOpen])

  // Fetch all stocks on app load
  useEffect(() => {
    // Preload all asset types
    const types = ['Stocks', 'Funds', 'Futures', 'Forex', 'Crypto', 'Indices', 'Bonds', 'Economy', 'Options']
    types.forEach(type => {
      fetch(`${import.meta.env.VITE_BACKEND_URL}/api/stocks?type=${type}`)
        .then(res => res.json())
        .then(data => setStockOptions(prev => ({ ...prev, [type]: data })))
    })
  }, [])

  const removeNotification = (id: string) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id))

  return (
    <StockDataContext.Provider value={{ stockOptions, setStockOptions }}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col font-sans transition-colors duration-300">
        {/* Notifications */}
        <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 items-end">
          {notifications.map((n) => (
            <Notification key={n.id} type={n.type} onClose={() => removeNotification(n.id)}>
              {n.message}
            </Notification>
          ))}
        </div>
        {/* Topbar */}
        <header className="flex items-center justify-between px-8 py-5 bg-white/90 shadow-sm backdrop-blur-md transition-all duration-300">
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Dashboard</h1>
          <button
            className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 flex items-center justify-center transition-colors duration-200"
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2"/><path d="M12 8v4l3 3" strokeWidth="2"/></svg>
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 min-h-0 p-4 transition-all duration-300">
          {selectedWatchlist === null ? (
            <div
              className="h-full grid grid-rows-2 grid-cols-2 gap-5 animate-fadein"
              style={{ height: 'calc(100vh - 120px)' }}
            >
              {/* Top Left: Watchlists */}
              <div className="bg-white rounded-xl shadow-md p-3 flex flex-col h-full min-h-0 row-start-1 col-start-1">
                <Watchlists onSelect={setSelectedWatchlist} />
              </div>
              {/* Top Right: Main Chart */}
              <div className="bg-white rounded-xl shadow-md p-3 flex flex-col h-full min-h-0 row-start-1 col-start-2">
                <LiveNiftyChart topOnly />
              </div>
              {/* Bottom Left: Chart 1 */}
              <div className="bg-white rounded-xl shadow-md p-3 flex flex-col h-full min-h-0 row-start-2 col-start-1">
                <LiveNiftyChart bottomOnly chart="1" />
              </div>
              {/* Bottom Right: Chart 2 */}
              <div className="bg-white rounded-xl shadow-md p-3 flex flex-col h-full min-h-0 row-start-2 col-start-2">
                <LiveNiftyChart bottomOnly chart="2" />
              </div>
            </div>
          ) : (
            <div className="animate-fadein">
              <WatchlistPage id={selectedWatchlist} onBack={() => setSelectedWatchlist(null)} />
            </div>
          )}
        </main>

        {/* Settings Modal */}
        <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    </StockDataContext.Provider>
  )
}

export default App
