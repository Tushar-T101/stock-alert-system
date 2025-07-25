import { useState } from 'react'

export default function AlertConditionsModal({ open, onClose, onSave, initial }: {
  open: boolean
  onClose: () => void
  onSave: (conditions: any) => void
  initial?: any
}) {
  const [priceAbove, setPriceAbove] = useState(initial?.priceAbove || '')
  const [rsiCross, setRsiCross] = useState(initial?.rsiCross || '')

  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 animate-fadein">
      <div className="bg-white rounded-xl shadow-2xl p-8 min-w-[350px] max-w-[90vw] transition-all duration-300">
        <h3 className="text-lg font-bold mb-4">Custom Alert Conditions</h3>
        <div className="space-y-4">
          <div>
            <label className="block font-semibold mb-2">Price Above ($)</label>
            <input
              type="number"
              className="border rounded px-2 py-1 w-full"
              value={priceAbove}
              onChange={e => setPriceAbove(e.target.value)}
              placeholder="e.g. 200"
            />
          </div>
          <div>
            <label className="block font-semibold mb-2">RSI Crosses</label>
            <input
              type="number"
              className="border rounded px-2 py-1 w-full"
              value={rsiCross}
              onChange={e => setRsiCross(e.target.value)}
              placeholder="e.g. 70"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-8">
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => onSave({ priceAbove, rsiCross })}>Save</button>
          <button className="px-4 py-2 bg-gray-200 rounded" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}