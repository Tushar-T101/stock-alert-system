import { useState, useEffect } from 'react'
import { INDICATORS } from '../indicators'

type Watchlist = {
  id: number
  name: string
  description?: string
  icon?: string
  stocks: string[]
  indicators: string[]
}

const ICONS = ['📈','💼','🚀','💡','⭐','🔔','🧠','🛡️']

export default function Watchlists({ onSelect }: { onSelect: (id: number) => void }) {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([])
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newIcon, setNewIcon] = useState(ICONS[0])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([INDICATORS[0].key, INDICATORS[1].key, INDICATORS[2].key])
  const [editModal, setEditModal] = useState<{ open: boolean, wl: Watchlist | null }>({ open: false, wl: null })

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('watchlists')
    if (!saved || (Array.isArray(JSON.parse(saved)) && JSON.parse(saved).length === 0)) {
      setWatchlists([
        { id: 1, name: 'Tech Stocks', description: 'Top tech companies', icon: '📈', stocks: ['AAPL', 'MSFT'], indicators: [INDICATORS[0].key, INDICATORS[1].key, INDICATORS[2].key] },
        { id: 2, name: 'Banking Picks', description: 'Major banks', icon: '💼', stocks: ['JPM', 'BAC'], indicators: [INDICATORS[0].key, INDICATORS[1].key, INDICATORS[2].key] },
        { id: 3, name: 'Momentum', description: 'High momentum stocks', icon: '🚀', stocks: ['TSLA'], indicators: [INDICATORS[0].key, INDICATORS[1].key, INDICATORS[2].key] },
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
        indicators: selectedIndicators,
      },
    ])
    setNewName('')
    setNewDesc('')
    setNewIcon(ICONS[0])
    setSelectedIndicators([INDICATORS[0].key, INDICATORS[1].key, INDICATORS[2].key])
    setModalOpen(false)
  }

  // Edit modal logic
  const handleEdit = (wl: Watchlist) => {
    setEditModal({ open: true, wl })
    setNewName(wl.name)
    setNewDesc(wl.description || '')
    setNewIcon(wl.icon || ICONS[0])
    setSelectedIndicators(wl.indicators || [])
  }
  const handleEditSave = () => {
    setWatchlists(watchlists =>
      watchlists.map(wl =>
        wl.id === editModal.wl?.id
          ? { ...wl, name: newName, description: newDesc, icon: newIcon, indicators: selectedIndicators }
          : wl
      )
    )
    setEditModal({ open: false, wl: null })
    setNewName('')
    setNewDesc('')
    setNewIcon(ICONS[0])
    setSelectedIndicators([INDICATORS[0].key, INDICATORS[1].key, INDICATORS[2].key])
  }

  // Add this helper for tooltips (optional, simple)
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
              <div className="mt-3 flex gap-2 flex-wrap">
                {wl.indicators?.map(ind =>
                  <div key={ind} className="bg-blue-50 px-2 py-1 rounded text-xs text-blue-700">{ind}</div>
                )}
              </div>
            </div>
            <button
              className="ml-2 text-gray-400 hover:text-blue-600"
              onClick={e => { e.stopPropagation(); handleEdit(wl) }}
              title="Edit Watchlist"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 13.5V16h2.5l7.06-7.06-2.5-2.5L4 13.5z" />
                <path d="M14.06 5.94a1.5 1.5 0 0 1 2.12 2.12l-1.06 1.06-2.5-2.5 1.06-1.06z" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      {/* Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 animate-fadein">
          <div className="bg-white rounded-2xl shadow-2xl p-8 min-w-[350px] max-w-[95vw] w-full sm:w-[440px] transition-all duration-300">
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
            {watchlists.some(wl => wl.name.toLowerCase() === newName.trim().toLowerCase()) && (
              <div className="text-xs text-red-600 mb-2">A watchlist with this name already exists.</div>
            )}
            {selectedIndicators.length === 0 && (
              <div className="text-xs text-red-600 mb-2">Select at least one indicator.</div>
            )}
            <div className="flex gap-2 mt-6">
              <button
                className={`px-4 py-2 bg-blue-600 text-white rounded font-semibold transition ${
                  !newName.trim() ||
                  watchlists.some(wl => wl.name.toLowerCase() === newName.trim().toLowerCase()) ||
                  selectedIndicators.length === 0
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
                onClick={handleAdd}
                disabled={
                  !newName.trim() ||
                  watchlists.some(wl => wl.name.toLowerCase() === newName.trim().toLowerCase()) ||
                  selectedIndicators.length === 0
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
      {/* Edit Modal */}
      {editModal.open && editModal.wl && (
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
                onClick={handleEditSave}
                disabled={!newName.trim() || selectedIndicators.length === 0}
              >
                Save
              </button>
              <button
                className="px-4 py-2 bg-gray-200 rounded font-semibold"
                onClick={() => setEditModal({ open: false, wl: null })}
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