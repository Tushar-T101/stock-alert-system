import { useState, useEffect } from 'react'
import { INDICATORS } from '../indicators'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

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
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('watchlists')
    if (saved) {
      try {
        const arr = JSON.parse(saved)
        if (Array.isArray(arr) && arr.length > 0) {
          setWatchlists(arr)
          return
        }
      } catch {}
    }
    setWatchlists([
      { id: 1, name: 'Tech Stocks', description: 'Top tech companies', icon: '📈', stocks: ['AAPL', 'MSFT'], indicators: [INDICATORS[0].key, INDICATORS[1].key, INDICATORS[2].key] },
      { id: 2, name: 'Banking Picks', description: 'Major banks', icon: '💼', stocks: ['JPM', 'BAC'], indicators: [INDICATORS[0].key, INDICATORS[1].key, INDICATORS[2].key] },
      { id: 3, name: 'Momentum', description: 'High momentum stocks', icon: '🚀', stocks: ['TSLA'], indicators: [INDICATORS[0].key, INDICATORS[1].key, INDICATORS[2].key] },
    ])
  }, [])

  useEffect(() => {
    if (watchlists.length > 0) {
      localStorage.setItem('watchlists', JSON.stringify(watchlists))
    }
  }, [watchlists])

  const handleAdd = () => {
    if (
      !newName.trim() ||
      watchlists.some(wl => wl.name.toLowerCase() === newName.trim().toLowerCase())
    ) return
    const newId = getNextWatchlistId()
    const newWatchlists = [
      ...watchlists,
      {
        id: newId,
        name: newName,
        description: newDesc,
        icon: newIcon,
        stocks: [],
        indicators: selectedIndicators,
      },
    ]
    setWatchlists(newWatchlists)
    localStorage.setItem('watchlists', JSON.stringify(newWatchlists))
    setNewName('')
    setNewDesc('')
    setNewIcon(ICONS[0])
    setSelectedIndicators([INDICATORS[0].key, INDICATORS[1].key, INDICATORS[2].key])
    setModalOpen(false)
  }

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

  function handleDelete(id: number) {
    setDeletingId(id)
    setTimeout(() => {
      const updated = watchlists.filter(wl => wl.id !== id)
      setWatchlists(updated)
      localStorage.setItem('watchlists', JSON.stringify(updated))
      if (updated.length === 0) {
        localStorage.setItem('lastWatchlistId', '3')
      }
      setDeletingId(null)
    }, 400)
  }

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

  function getNextWatchlistId() {
    const lastId = Number(localStorage.getItem('lastWatchlistId') || '3')
    const nextId = lastId + 1
    localStorage.setItem('lastWatchlistId', String(nextId))
    return nextId
  }

  return (
    <section className="h-full flex flex-col">
      <div className="flex items-center justify-start">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-300">Your Watchlists</h2>
        <button
          className="ml-4 p-1 rounded-md bg-gray-100 dark:bg-neutral-800 text-black dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-neutral-700 transition"
          onClick={() => setModalOpen(true)}
          aria-label="Add Watchlist"
        >
          <AddCircleOutlineIcon />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 p-2" style={{ maxHeight: 320 }}>
        {watchlists.map(wl => (
          <div
            key={wl.id}
            className={`bg-white dark:bg-neutral-900 rounded-xl shadow-md p-3 cursor-pointer hover:ring-2 ring-blue-500 dark:hover:ring-blue-400 transition-all duration-200 flex gap-3 items-start
              ${deletingId === wl.id ? 'fadeout' : ''}`}
            onClick={() => onSelect(wl.id)}
          >
            <span className="text-2xl mt-1">{wl.icon || '📈'}</span>
            <div className="flex-1">
              <span className="font-medium text-gray-800 dark:text-gray-100">{wl.name}</span>
              {wl.description && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{wl.description}</div>
              )}
              <div className="mt-3 flex gap-2 flex-wrap">
                {wl.indicators?.map(ind =>
                  <div key={ind} className="bg-blue-50 dark:bg-neutral-800 px-2 py-1 rounded text-xs text-blue-700 dark:text-blue-200">{ind}</div>
                )}
              </div>
            </div>
            <button
              className="ml-2 text-gray-400 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              onClick={e => { e.stopPropagation(); handleEdit(wl) }}
              title="Edit Watchlist"
            >
              <EditIcon />
            </button>
            <button
              className="ml-2 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              onClick={e => { e.stopPropagation(); handleDelete(wl.id) }}
              title="Delete Watchlist"
            >
              <DeleteIcon />
            </button>
          </div>
        ))}
      </div>
      {/* Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-80 flex items-center justify-center z-50 animate-fadein">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 min-w-[350px] max-w-[95vw] w-full sm:w-[440px] transition-all duration-300">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <span role="img" aria-label="Add">📝</span> Add Watchlist
            </h3>
            <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-200">Name</label>
            <input
              type="text"
              className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              placeholder="Watchlist name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAdd()
                if (e.key === 'Escape') setModalOpen(false)
              }}
              autoFocus
            />
            <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-200">Description <span className="text-xs text-gray-400 dark:text-gray-500">(optional)</span></label>
            <textarea
              className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition resize-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              placeholder="Describe this watchlist (optional)"
              rows={2}
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
            />
            <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-200">Icon</label>
            <div className="flex gap-2 mb-4" title="Choose an icon">
              {ICONS.map(icon => (
                <Tooltip key={icon} text="Choose an icon">
                  <button
                    type="button"
                    className={`text-2xl rounded-full p-1 border-2 transition
                      ${icon === newIcon ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-transparent hover:border-blue-300 dark:hover:border-blue-400'}`}
                    onClick={() => setNewIcon(icon)}
                    aria-label={`Choose icon ${icon}`}
                  >
                    {icon}
                  </button>
                </Tooltip>
              ))}
            </div>
            <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-200">
              Indicators
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">(applies to all stocks)</span>
            </label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-200"
                onClick={() => setSelectedIndicators(INDICATORS.map(i => i.key))}
              >
                Select All
              </button>
              <button
                type="button"
                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
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
                      ${selectedIndicators.includes(ind.key) ? 'bg-blue-50 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
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
                      className="accent-blue-600 dark:accent-blue-400"
                    />
                    {ind.label}
                  </label>
                </Tooltip>
              ))}
            </div>
            {watchlists.some(wl => wl.name.toLowerCase() === newName.trim().toLowerCase()) && (
              <div className="text-xs text-red-600 dark:text-red-400 mb-2">A watchlist with this name already exists.</div>
            )}
            {selectedIndicators.length === 0 && (
              <div className="text-xs text-red-600 dark:text-red-400 mb-2">Select at least one indicator.</div>
            )}
            <div className="flex gap-2 mt-6">
              <button
                className={`px-4 py-2 bg-blue-600 dark:bg-blue-800 text-white rounded font-semibold transition ${
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
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded font-semibold"
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
        <div className="fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-80 flex items-center justify-center z-50 animate-fadein">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 min-w-[350px] max-w-[95vw] w-full sm:w-[440px] transition-all duration-300">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <span role="img" aria-label="Edit">✏️</span> Edit Watchlist
            </h3>
            <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-200">Name</label>
            <input
              type="text"
              className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              placeholder="Watchlist name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              autoFocus
            />
            <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-200">Description <span className="text-xs text-gray-400 dark:text-gray-500">(optional)</span></label>
            <textarea
              className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition resize-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              placeholder="Describe this watchlist (optional)"
              rows={2}
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
            />
            <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-200">Icon</label>
            <div className="flex gap-2 mb-4" title="Choose an icon">
              {ICONS.map(icon => (
                <Tooltip key={icon} text="Choose an icon">
                  <button
                    type="button"
                    className={`text-2xl rounded-full p-1 border-2 transition
                      ${icon === newIcon ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-transparent hover:border-blue-300 dark:hover:border-blue-400'}`}
                    onClick={() => setNewIcon(icon)}
                    aria-label={`Choose icon ${icon}`}
                  >
                    {icon}
                  </button>
                </Tooltip>
              ))}
            </div>
            <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-200">
              Indicators
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">(applies to all stocks)</span>
            </label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-200"
                onClick={() => setSelectedIndicators(INDICATORS.map(i => i.key))}
              >
                Select All
              </button>
              <button
                type="button"
                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
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
                      ${selectedIndicators.includes(ind.key) ? 'bg-blue-50 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
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
                      className="accent-blue-600 dark:accent-blue-400"
                    />
                    {ind.label}
                  </label>
                </Tooltip>
              ))}
            </div>
            {selectedIndicators.length === 0 && (
              <div className="text-xs text-red-600 dark:text-red-400 mb-2">Select at least one indicator.</div>
            )}
            <div className="flex gap-2 mt-6">
              <button
                className={`px-4 py-2 bg-blue-600 dark:bg-blue-800 text-white rounded font-semibold transition ${
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
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded font-semibold"
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