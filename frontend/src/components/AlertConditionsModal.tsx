import { useState } from 'react'
import { INDICATORS } from '../indicators'

// Map each indicator to its supported alert condition types
const CONDITION_TYPES: Record<string, { value: string; label: string; inputs: number }[]> = {
  EMA7: [
    { value: 'crosses_above', label: 'Crosses Above Value', inputs: 1 },
    { value: 'crosses_below', label: 'Crosses Below Value', inputs: 1 },
    { value: 'crosses_above_indicator', label: 'Crosses Above Another Indicator', inputs: 1 },
    { value: 'crosses_below_indicator', label: 'Crosses Below Another Indicator', inputs: 1 },
  ],
  EMA21: [
    { value: 'crosses_above', label: 'Crosses Above Value', inputs: 1 },
    { value: 'crosses_below', label: 'Crosses Below Value', inputs: 1 },
    { value: 'crosses_above_indicator', label: 'Crosses Above Another Indicator', inputs: 1 },
    { value: 'crosses_below_indicator', label: 'Crosses Below Another Indicator', inputs: 1 },
  ],
  EMA50: [
    { value: 'crosses_above', label: 'Crosses Above Value', inputs: 1 },
    { value: 'crosses_below', label: 'Crosses Below Value', inputs: 1 },
    { value: 'crosses_above_indicator', label: 'Crosses Above Another Indicator', inputs: 1 },
    { value: 'crosses_below_indicator', label: 'Crosses Below Another Indicator', inputs: 1 },
  ],
  EMA200: [
    { value: 'crosses_above', label: 'Crosses Above Value', inputs: 1 },
    { value: 'crosses_below', label: 'Crosses Below Value', inputs: 1 },
    { value: 'crosses_above_indicator', label: 'Crosses Above Another Indicator', inputs: 1 },
    { value: 'crosses_below_indicator', label: 'Crosses Below Another Indicator', inputs: 1 },
  ],
  SMA20: [
    { value: 'crosses_above', label: 'Crosses Above Value', inputs: 1 },
    { value: 'crosses_below', label: 'Crosses Below Value', inputs: 1 },
  ],
  SMA50: [
    { value: 'crosses_above', label: 'Crosses Above Value', inputs: 1 },
    { value: 'crosses_below', label: 'Crosses Below Value', inputs: 1 },
  ],
  UpperBB: [
    { value: 'price_crosses_above', label: 'Price Crosses Above Upper BB', inputs: 0 },
    { value: 'price_crosses_below', label: 'Price Crosses Below Upper BB', inputs: 0 },
  ],
  LowerBB: [
    { value: 'price_crosses_above', label: 'Price Crosses Above Lower BB', inputs: 0 },
    { value: 'price_crosses_below', label: 'Price Crosses Below Lower BB', inputs: 0 },
  ],
  RSI: [
    { value: 'crosses_above', label: 'Crosses Above Value', inputs: 1 },
    { value: 'crosses_below', label: 'Crosses Below Value', inputs: 1 },
    { value: 'enters_range', label: 'Enters Range', inputs: 2 },
    { value: 'leaves_range', label: 'Leaves Range', inputs: 2 },
  ],
  MACD: [
    { value: 'crosses_above_zero', label: 'Crosses Above 0', inputs: 0 },
    { value: 'crosses_below_zero', label: 'Crosses Below 0', inputs: 0 },
    { value: 'crosses_above', label: 'Crosses Above Value', inputs: 1 },
    { value: 'crosses_below', label: 'Crosses Below Value', inputs: 1 },
  ],
  STOCH: [
    { value: 'crosses_above', label: 'Crosses Above Value', inputs: 1 },
    { value: 'crosses_below', label: 'Crosses Below Value', inputs: 1 },
    { value: 'enters_range', label: 'Enters Range', inputs: 2 },
    { value: 'leaves_range', label: 'Leaves Range', inputs: 2 },
  ],
  ADX: [
    { value: 'crosses_above', label: 'Crosses Above Value', inputs: 1 },
    { value: 'crosses_below', label: 'Crosses Below Value', inputs: 1 },
  ],
  CCI: [
    { value: 'crosses_above', label: 'Crosses Above Value', inputs: 1 },
    { value: 'crosses_below', label: 'Crosses Below Value', inputs: 1 },
    { value: 'enters_range', label: 'Enters Range', inputs: 2 },
    { value: 'leaves_range', label: 'Leaves Range', inputs: 2 },
  ],
  ATR: [
    { value: 'crosses_above', label: 'Crosses Above Value', inputs: 1 },
    { value: 'crosses_below', label: 'Crosses Below Value', inputs: 1 },
  ],
  ROC: [
    { value: 'crosses_above', label: 'Crosses Above Value', inputs: 1 },
    { value: 'crosses_below', label: 'Crosses Below Value', inputs: 1 },
  ],
  WILLIAMS: [
    { value: 'crosses_above', label: 'Crosses Above Value', inputs: 1 },
    { value: 'crosses_below', label: 'Crosses Below Value', inputs: 1 },
    { value: 'enters_range', label: 'Enters Range', inputs: 2 },
    { value: 'leaves_range', label: 'Leaves Range', inputs: 2 },
  ],
  MFI: [
    { value: 'crosses_above', label: 'Crosses Above Value', inputs: 1 },
    { value: 'crosses_below', label: 'Crosses Below Value', inputs: 1 },
    { value: 'enters_range', label: 'Enters Range', inputs: 2 },
    { value: 'leaves_range', label: 'Leaves Range', inputs: 2 },
  ],
  OBV: [
    { value: 'crosses_above', label: 'Crosses Above Value', inputs: 1 },
    { value: 'crosses_below', label: 'Crosses Below Value', inputs: 1 },
  ],
  VWAP: [
    { value: 'price_crosses_above', label: 'Price Crosses Above VWAP', inputs: 0 },
    { value: 'price_crosses_below', label: 'Price Crosses Below VWAP', inputs: 0 },
  ],
  PSAR: [
    { value: 'price_crosses_above', label: 'Price Crosses Above PSAR', inputs: 0 },
    { value: 'price_crosses_below', label: 'Price Crosses Below PSAR', inputs: 0 },
  ],
}

// Fallback for any indicator not listed above
function getConditionsForIndicator(indicator: string) {
  return CONDITION_TYPES[indicator] || [
    { value: 'crosses_above', label: 'Crosses Above Value', inputs: 1 },
    { value: 'crosses_below', label: 'Crosses Below Value', inputs: 1 },
  ]
}

export default function AlertConditionsModal({
  open,
  onClose,
  onSave,
  initial,
  indicators = [],
}: {
  open: boolean
  onClose: () => void
  onSave: (conditions: any) => void
  initial?: any
  indicators?: string[]
}) {
  // Store an array of alert conditions
  const [conditions, setConditions] = useState(
    initial?.conditions ||
      [
        // { indicator: 'RSI', type: 'crosses_above', value: 70 }
      ]
  )
  const [email, setEmail] = useState(initial?.email || '')

  const indicatorMeta = INDICATORS.filter(ind => indicators.includes(ind.key))

  function handleChange(idx: number, field: string, value: any) {
    setConditions(conds =>
      conds.map((c, i) => (i === idx ? { ...c, [field]: value } : c))
    )
  }

  function handleAdd() {
    setConditions([
      ...conditions,
      { indicator: indicatorMeta[0]?.key || '', type: getConditionsForIndicator(indicatorMeta[0]?.key || '')[0].value, value: '' },
    ])
  }

  function handleRemove(idx: number) {
    setConditions(conds => conds.filter((_, i) => i !== idx))
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 animate-fadein">
      <div
        className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md transition-all duration-300"
        style={{ maxWidth: 420, maxHeight: '90vh', overflowY: 'auto' }}
      >
        <h3 className="text-lg font-bold mb-4">Custom Alert Conditions</h3>
        <div className="space-y-4 w-[90%]">
          {conditions.map((cond, idx) => {
            const meta = indicatorMeta.find(i => i.key === cond.indicator) || indicatorMeta[0]
            const condTypes = getConditionsForIndicator(cond.indicator)
            const selectedType = condTypes.find(t => t.value === cond.type) || condTypes[0]
            return (
              <div key={idx} className="flex gap-2 items-center">
                {/* Indicator select */}
                <select
                  className="border rounded px-2 py-1"
                  value={cond.indicator}
                  onChange={e => {
                    const newIndicator = e.target.value
                    handleChange(idx, 'indicator', newIndicator)
                    // Reset type and value
                    handleChange(idx, 'type', getConditionsForIndicator(newIndicator)[0].value)
                    handleChange(idx, 'value', '')
                  }}
                >
                  {indicatorMeta.map(ind => (
                    <option key={ind.key} value={ind.key}>{ind.label}</option>
                  ))}
                </select>
                {/* Condition type select */}
                <select
                  className="border rounded px-2 py-1"
                  value={cond.type}
                  onChange={e => handleChange(idx, 'type', e.target.value)}
                >
                  {condTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                {/* Value input(s) */}
                {selectedType.inputs === 1 && (
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-24"
                    value={cond.value}
                    onChange={e => handleChange(idx, 'value', e.target.value)}
                    placeholder="Value"
                  />
                )}
                {selectedType.inputs === 2 && (
                  <>
                    <input
                      type="number"
                      className="border rounded px-2 py-1 w-20"
                      value={cond.value?.[0] || ''}
                      onChange={e =>
                        handleChange(idx, 'value', [e.target.value, cond.value?.[1] || ''])
                      }
                      placeholder="Min"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="number"
                      className="border rounded px-2 py-1 w-20"
                      value={cond.value?.[1] || ''}
                      onChange={e =>
                        handleChange(idx, 'value', [cond.value?.[0] || '', e.target.value])
                      }
                      placeholder="Max"
                    />
                  </>
                )}
                <button
                  className="ml-2 text-red-500 hover:text-red-700"
                  onClick={() => handleRemove(idx)}
                  title="Remove"
                >
                  ×
                </button>
              </div>
            )
          })}
          <button
            className="px-3 py-1 bg-blue-100 rounded hover:bg-blue-200 text-sm"
            onClick={handleAdd}
            disabled={indicatorMeta.length === 0}
          >
            + Add Condition
          </button>
          <div>
            <label className="block font-semibold mb-2">Alert Email</label>
            <input
              type="email"
              className="border rounded px-2 py-1 w-full"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-8">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={() => onSave({ conditions, email })}
            disabled={conditions.length === 0}
          >
            Save
          </button>
          <button className="px-4 py-2 bg-gray-200 rounded" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}