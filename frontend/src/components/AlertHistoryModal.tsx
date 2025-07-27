export default function AlertHistoryModal({ open, onClose, history }: {
  open: boolean
  onClose: () => void
  history: { time: string, message: string }[]
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 animate-fadein">
      <div className="bg-white rounded-xl shadow-2xl p-8 min-w-[350px] max-w-[90vw] transition-all duration-300">
        <h3 className="text-lg font-bold mb-4">Alert History</h3>
        <div className="text-xs text-yellow-700 mb-2">
          <b>Note:</b> If you are missing alert emails, please check your spam folder.
        </div>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {history.length === 0 ? (
            <div className="text-gray-400">No alerts triggered yet.</div>
          ) : (
            history.map((h, i) => (
              <div key={i} className="text-sm">
                <span className="font-mono text-gray-500">{h.time}</span> — {h.message}
              </div>
            ))
          )}
        </div>
        <button className="mt-8 px-4 py-2 bg-gray-200 rounded" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}