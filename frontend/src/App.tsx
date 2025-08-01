import { useState, useEffect, createContext } from 'react'
import Watchlists from './components/Watchlists'
import SettingsModal from './components/SettingsModal'
import LiveNiftyChart from './components/LiveNiftyChart'
import WatchlistPage from './components/WatchlistPage'
import Notification from './components/Notification'
import './styles/notifications.css'
import SettingsIcon from '@mui/icons-material/Settings'

export function isMarketOpen() {
  const now = new Date()
  const ny = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const day = ny.getDay()
  if (day === 0 || day === 6) return false
  const hours = ny.getHours()
  const minutes = ny.getMinutes()
  const mins = hours * 60 + minutes
  return mins >= 570 && mins < 960
}

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
    const interval = setInterval(() => setMarketOpen(isMarketOpen()), 60000)
    return () => clearInterval(interval)
  }, [])

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

  useEffect(() => {
    const types = ['Stocks', 'Funds', 'Futures', 'Forex', 'Crypto', 'Indices', 'Bonds', 'Economy', 'Options']
    types.forEach(type => {
      fetch(`${import.meta.env.VITE_BACKEND_URL}/api/stocks?type=${type}`)
        .then(res => res.json())
        .then(data => setStockOptions(prev => ({ ...prev, [type]: data })))
    })
  }, [])

  useEffect(() => {
    const settings = localStorage.getItem('userSettings')
    const theme = settings ? JSON.parse(settings).theme : 'light'
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  })

  const removeNotification = (id: string) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id))

  return (
    <StockDataContext.Provider value={{ stockOptions, setStockOptions }}>
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-white dark:from-neutral-900 dark:to-neutral-950 flex flex-col font-sans transition-colors duration-300">
        {/* Notifications */}
        <div className="fixed top-16 right-6 z-50 flex flex-col gap-3 items-end">
          {notifications.map((n) => (
            <Notification key={n.id} type={n.type} onClose={() => removeNotification(n.id)}>
              {n.message}
            </Notification>
          ))}
        </div>
        {/* Topbar */}
        <header className="flex items-center justify-between p-5 bg-white/90 dark:bg-neutral-900/90 shadow-sm backdrop-blur-md transition-all duration-300">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Dashboard</h1>
          <button
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-800 flex items-center justify-end transition-colors duration-200"
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
          >
            <SettingsIcon className="text-blue-600 dark:text-blue-400" fontSize="large" />
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
              <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-md p-3 flex flex-col h-full min-h-0 row-start-1 col-start-1">
                <Watchlists onSelect={setSelectedWatchlist} />
              </div>
              {/* Top Right: Main Chart */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-md p-3 flex flex-col h-full min-h-0 row-start-1 col-start-2">
                <LiveNiftyChart topOnly />
              </div>
              {/* Bottom Left: Chart 1 */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-md p-3 flex flex-col h-full min-h-0 row-start-2 col-start-1">
                <LiveNiftyChart bottomOnly chart="1" />
              </div>
              {/* Bottom Right: Chart 2 */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-md p-3 flex flex-col h-full min-h-0 row-start-2 col-start-2">
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
        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onNotify={(msg, type) => setNotifications(prev => [...prev, { id: Date.now().toString(), type, message: msg }])}
        />
      </div>
    </StockDataContext.Provider>
  )
}

export default App
