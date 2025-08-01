export default function AlertHistoryModal({ open, onClose, history }: {
  open: boolean
  onClose: () => void
  history: { time: string, message: string }[]
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-80 flex items-center justify-center z-50 animate-fadein">
      <div className="bg-white dark:bg-neutral-950 rounded-xl shadow-2xl p-8 min-w-[350px] max-w-[90vw] transition-all duration-300">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-neutral-100">Alert History</h3>
        <div className="text-xs text-yellow-700 dark:text-yellow-400 mb-2">
          <b>Note:</b> If you are missing alert emails, please check your spam folder.
        </div>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {history.length === 0 ? (
            <div className="text-gray-400 dark:text-neutral-500">No alerts triggered yet.</div>
          ) : (
            history.map((h, i) => (
              <div key={i} className="text-sm">
                <span className="font-mono text-gray-500 dark:text-neutral-400">{h.time}</span> — <span className="text-gray-900 dark:text-neutral-100">{h.message}</span>
              </div>
            ))
          )}
        </div>
        <button className="mt-8 px-4 py-2 bg-gray-200 dark:bg-neutral-900 rounded hover:bg-gray-300 dark:hover:bg-neutral-800 font-semibold text-gray-900 dark:text-neutral-100" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}