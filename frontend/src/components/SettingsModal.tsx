import { useState } from 'react'

export default function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [realTime, setRealTime] = useState(true)
  const [summaries, setSummaries] = useState<string[]>([])
  const [darkMode, setDarkMode] = useState(false)

  if (!open) return null

  const handleSummaryChange = (option: string) => {
    setSummaries(prev =>
      prev.includes(option) ? prev.filter(s => s !== option) : [...prev, option]
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-8 min-w-[350px] max-w-[90vw]">
        <h3 className="text-lg font-bold mb-4">Settings</h3>
        <div className="space-y-6">
          <div>
            <label className="font-semibold block mb-2">Alert Email</label>
            <input
              type="email"
              className="border rounded px-2 py-1 w-full"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="font-semibold">Real-time Alerts</label>
            <button
              className={`w-12 h-6 flex items-center rounded-full px-1 transition-colors duration-300 ${realTime ? 'bg-blue-500' : 'bg-gray-300'}`}
              onClick={() => setRealTime(!realTime)}
              aria-label="Toggle real-time alerts"
            >
              <span
                className={`h-5 w-5 bg-white rounded-full shadow transform transition-transform duration-300 ${realTime ? 'translate-x-6' : ''}`}
              />
            </button>
          </div>
          <div>
            <label className="font-semibold block mb-2">Summary Alerts</label>
            <div className="flex gap-4">
              <label>
                <input
                  type="checkbox"
                  checked={summaries.includes('Daily')}
                  onChange={() => handleSummaryChange('Daily')}
                /> Daily Summary
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={summaries.includes('Weekly')}
                  onChange={() => handleSummaryChange('Weekly')}
                /> Weekly Summary
              </label>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="font-semibold">Theme</label>
            <button
              className={`w-12 h-6 flex items-center rounded-full px-1 transition-colors duration-300 ${darkMode ? 'bg-gray-800' : 'bg-gray-300'}`}
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle theme"
            >
              <span
                className={`h-5 w-5 bg-white rounded-full shadow transform transition-transform duration-300 ${darkMode ? 'translate-x-6' : ''}`}
              />
            </button>
            <span>{darkMode ? 'Dark' : 'Light'}</span>
          </div>
        </div>
        <button
          className="mt-8 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  )
}