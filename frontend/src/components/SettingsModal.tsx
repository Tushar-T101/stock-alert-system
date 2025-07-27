import { useState } from 'react'

function InfoTooltip({ text }: { text: string }) {
  return (
    <sup className="align-super ml-0.5">
      <span className="relative group">
        <button
          type="button"
          tabIndex={-1}
          className="w-3 h-3 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center p-0 hover:bg-blue-200 focus:outline-none"
          aria-label="Info"
          style={{ lineHeight: '12px', minWidth: '12px' }}
        >
          i
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 mt-2 z-50 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
          {text}
        </span>
      </span>
    </sup>
  )
}

export default function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [realTime, setRealTime] = useState(true)
  const [summaries, setSummaries] = useState<string[]>([])
  const [darkMode, setDarkMode] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const backendUrl = import.meta.env.VITE_BACKEND_URL

  if (!open) return null

  const handleSummaryChange = (option: string) => {
    setSummaries(prev =>
      prev.includes(option) ? prev.filter(s => s !== option) : [...prev, option]
    )
  }

  const handleTestAlert = async () => {
    if (!email) return
    setTestStatus('sending')
    try {
      await fetch(`${backendUrl}/api/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchlist_id: 1, email })
      })
      const res = await fetch(`${backendUrl}/api/test_alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchlist_id: 1, symbol: 'AAPL', email })
      })
      if (res.ok) setTestStatus('sent')
      else setTestStatus('error')
    } catch {
      setTestStatus('error')
    }
    setTimeout(() => setTestStatus('idle'), 3000)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 min-w-[600px] max-w-[95vw] w-full sm:w-[400px] transition-all duration-300">
        <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
          {/* Settings gear icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="text-blue-600"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.01c1.527-.878 3.286.88 2.408 2.408a1.724 1.724 0 001.01 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.01 2.573c.878 1.527-.88 3.286-2.408 2.408a1.724 1.724 0 00-2.572 1.01c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.01c-1.527.878-3.286-.88-2.408-2.408a1.724 1.724 0 00-1.01-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.01-2.573c-.878-1.527.88-3.286 2.408-2.408.996.573 2.25.06 2.573-1.01z"
            />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Settings
        </h3>
        <div className="space-y-7">
          {/* Email */}
          <div>
            <label className="font-semibold block mb-2 text-gray-700 flex items-center gap-1">
              Alert Email
              <InfoTooltip text="Alerts and notifications will be sent to this email address." />
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="email"
                className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <button
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors duration-200 ${
                  testStatus === 'sending'
                    ? 'bg-blue-300 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                onClick={handleTestAlert}
                disabled={!email || testStatus === 'sending'}
                title="Send a test alert to this email"
              >
                {testStatus === 'sending'
                  ? 'Sending...'
                  : testStatus === 'sent'
                  ? 'Sent!'
                  : testStatus === 'error'
                  ? 'Error'
                  : 'Send Test Alert'}
              </button>
            </div>
            {testStatus === 'sent' && (
              <div className="text-green-600 text-xs mt-1">Test alert sent!</div>
            )}
            {testStatus === 'error' && (
              <div className="text-red-600 text-xs mt-1">Failed to send test alert.</div>
            )}
            <div className="text-xs text-yellow-700 mt-1">
              <b>Note:</b> If you don't see the email, please check your spam folder.
            </div>
          </div>
          {/* Real-time Alerts */}
          <div className="flex items-center gap-4">
            <label className="font-semibold text-gray-700 flex items-center gap-1">
              Real-time Alerts
              <InfoTooltip text="Enable to receive alerts as soon as conditions are met." />
            </label>
            <button
              className={`w-12 h-6 flex items-center rounded-full pl-0.5 transition-colors duration-300 ${
                realTime ? 'bg-blue-500' : 'bg-gray-300'
              }`}
              onClick={() => setRealTime(!realTime)}
              aria-label="Toggle real-time alerts"
            >
              <span
                className={`h-5 w-5 bg-white rounded-full shadow transform transition-transform duration-300 ${
                  realTime ? 'translate-x-6' : ''
                }`}
              />
            </button>
            <span className="text-xs text-gray-500">{realTime ? 'On' : 'Off'}</span>
          </div>
          {/* Summary Alerts */}
          <div>
            <label className="font-semibold block mb-2 text-gray-700 flex items-center gap-1">
              Summary Alerts
              <InfoTooltip text="Get daily or weekly summary emails of your alerts." />
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={summaries.includes('Daily')}
                  onChange={() => handleSummaryChange('Daily')}
                  className="accent-blue-600"
                /> Daily Summary
              </label>
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={summaries.includes('Weekly')}
                  onChange={() => handleSummaryChange('Weekly')}
                  className="accent-blue-600"
                /> Weekly Summary
              </label>
            </div>
          </div>
          {/* Theme */}
          <div className="flex items-center gap-4">
            <label className="font-semibold text-gray-700 flex items-center gap-1">
              Theme
              <InfoTooltip text="Switch between light and dark mode for the dashboard." />
            </label>
            <button
              className={`w-12 h-6 flex items-center rounded-full px-1 transition-colors duration-300 ${
                darkMode ? 'bg-gray-800' : 'bg-gray-300'
              }`}
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle theme"
            >
              <span
                className={`h-5 w-5 bg-white rounded-full shadow transform transition-transform duration-300 ${
                  darkMode ? 'translate-x-6' : ''
                }`}
              />
            </button>
            <span className="text-xs text-gray-500">{darkMode ? 'Dark' : 'Light'}</span>
          </div>
        </div>
        <button
          className="mt-10 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-semibold w-full"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  )
}