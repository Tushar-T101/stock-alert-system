import { useState } from 'react'

type Watchlist = {
  id: number
  name: string
  stocks: string[]
}

export default function Watchlists({ onSelect }: { onSelect: (id: number) => void }) {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([
    { id: 1, name: 'Tech Stocks', stocks: ['AAPL', 'MSFT'] },
    { id: 2, name: 'Banking Picks', stocks: ['JPM', 'BAC'] },
    { id: 3, name: 'Momentum', stocks: ['TSLA'] },
  ])
  const [newName, setNewName] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const handleAdd = () => {
    if (newName.trim()) {
      setWatchlists([...watchlists, { id: Date.now(), name: newName, stocks: [] }])
      setNewName('')
      setModalOpen(false)
    }
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
            className="bg-white rounded-xl shadow-md p-3 cursor-pointer hover:ring-2 ring-blue-500 transition-all duration-200"
            onClick={() => onSelect(wl.id)}
          >
            <span className="font-medium text-gray-800">{wl.name}</span>
            <div className="mt-3 flex gap-2">
              <div className="bg-blue-50 px-2 py-1 rounded text-xs text-blue-700">EMA</div>
              <div className="bg-green-50 px-2 py-1 rounded text-xs text-green-700">RSI</div>
              <div className="bg-purple-50 px-2 py-1 rounded text-xs text-purple-700">MACD</div>
            </div>
          </div>
        ))}
      </div>
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 animate-fadein">
          <div className="bg-white rounded-xl shadow-2xl p-8 min-w-[320px] max-w-[90vw] transition-all duration-300">
            <h3 className="text-lg font-bold mb-4">Add Watchlist</h3>
            <input
              type="text"
              className="border rounded px-2 py-2 w-full mb-4"
              placeholder="Watchlist name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleAdd}>Add</button>
              <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}