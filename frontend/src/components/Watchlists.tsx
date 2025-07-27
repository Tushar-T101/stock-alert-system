import { useState, useEffect } from 'react'

type Watchlist = {
  id: number
  name: string
  description?: string
  icon?: string
  stocks: string[]
}

const ICONS = ['📈','💼','🚀','💡','⭐','🔔','🧠','🛡️']

export default function Watchlists({ onSelect }: { onSelect: (id: number) => void }) {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([])
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newIcon, setNewIcon] = useState(ICONS[0])
  const [modalOpen, setModalOpen] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('watchlists')
    if (!saved || (Array.isArray(JSON.parse(saved)) && JSON.parse(saved).length === 0)) {
      setWatchlists([
        { id: 1, name: 'Tech Stocks', description: 'Top tech companies', icon: '📈', stocks: ['AAPL', 'MSFT'] },
        { id: 2, name: 'Banking Picks', description: 'Major banks', icon: '💼', stocks: ['JPM', 'BAC'] },
        { id: 3, name: 'Momentum', description: 'High momentum stocks', icon: '🚀', stocks: ['TSLA'] },
      ])
    } else {
      setWatchlists(JSON.parse(saved))
    }
  }, [])

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('watchlists', JSON.stringify(watchlists))
  }, [watchlists])

  const handleAdd = () => {
    if (
      !newName.trim() ||
      watchlists.some(wl => wl.name.toLowerCase() === newName.trim().toLowerCase())
    ) return
    setWatchlists([
      ...watchlists,
      {
        id: Date.now(),
        name: newName,
        description: newDesc,
        icon: newIcon,
        stocks: [],
      },
    ])
    setNewName('')
    setNewDesc('')
    setNewIcon(ICONS[0])
    setModalOpen(false)
  }

  return (
    <section className="h-full flex flex-col">
      <div className="flex items-center justify-start">
        <h2 className="text-sm font-semibold text-gray-500">Your Watchlists</h2>
        <button
          className="ml-4 p-1 rounded-md bg-gray-100 text-black hover:bg-gray-300 transition"
          onClick={() => setModalOpen(true)}
          aria-label="Add Watchlist"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="10" cy="10" r="9" stroke="currentColor" />
            <path d="M10 6v8M6 10h8" stroke="currentColor" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 p-2" style={{ maxHeight: 320 }}>
        {watchlists.map(wl => (
          <div
            key={wl.id}
            className="bg-white rounded-xl shadow-md p-3 cursor-pointer hover:ring-2 ring-blue-500 transition-all duration-200 flex gap-3 items-start"
            onClick={() => onSelect(wl.id)}
          >
            <span className="text-2xl mt-1">{wl.icon || '📈'}</span>
            <div className="flex-1">
              <span className="font-medium text-gray-800">{wl.name}</span>
              {wl.description && (
                <div className="text-xs text-gray-500 mt-1">{wl.description}</div>
              )}
              <div className="mt-3 flex gap-2">
                <div className="bg-blue-50 px-2 py-1 rounded text-xs text-blue-700">EMA</div>
                <div className="bg-green-50 px-2 py-1 rounded text-xs text-green-700">RSI</div>
                <div className="bg-purple-50 px-2 py-1 rounded text-xs text-purple-700">MACD</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 animate-fadein">
          <div className="bg-white rounded-2xl shadow-2xl p-8 min-w-[350px] max-w-[90vw] w-full sm:w-[400px] transition-all duration-300">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span role="img" aria-label="Add">📝</span> Add Watchlist
            </h3>
            <label className="block font-semibold mb-2 text-gray-700">Name</label>
            <input
              type="text"
              className="border border-gray-300 rounded-lg px-3 py-2 w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
              placeholder="Watchlist name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAdd()
                if (e.key === 'Escape') setModalOpen(false)
              }}
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
            <div className="flex gap-2 mb-4">
              {ICONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  className={`text-2xl rounded-full p-1 border-2 ${icon === newIcon ? 'border-blue-500' : 'border-transparent'} hover:border-blue-400 transition`}
                  onClick={() => setNewIcon(icon)}
                >
                  {icon}
                </button>
              ))}
            </div>
            {watchlists.some(wl => wl.name.toLowerCase() === newName.trim().toLowerCase()) && (
              <div className="text-xs text-red-600 mb-2">A watchlist with this name already exists.</div>
            )}
            <div className="flex gap-2 mt-6">
              <button
                className={`px-4 py-2 bg-blue-600 text-white rounded font-semibold transition ${
                  !newName.trim() || watchlists.some(wl => wl.name.toLowerCase() === newName.trim().toLowerCase())
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
                onClick={handleAdd}
                disabled={
                  !newName.trim() ||
                  watchlists.some(wl => wl.name.toLowerCase() === newName.trim().toLowerCase())
                }
              >
                Add
              </button>
              <button
                className="px-4 py-2 bg-gray-200 rounded font-semibold"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}