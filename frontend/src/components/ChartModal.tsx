import { Fragment, useEffect, useRef } from 'react'

export default function ChartModal({
  open,
  onClose,
  symbol,
  title,
}: {
  open: boolean
  onClose: () => void
  symbol: string
  title: string
}) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.classList.add('scale-100', 'opacity-100')
    }
  }, [])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 transition-opacity duration-300">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-lg p-6 w-full max-w-[90vw] h-[90vh] relative flex flex-col
          transform scale-90 opacity-0 transition-all duration-300"
      >
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <svg width="24" height="24" fill="none" stroke="currentColor"><path d="M6 6l12 12M6 18L18 6" strokeWidth="2"/></svg>
        </button>
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <div className="flex-1 w-full">
          <iframe
            title={title}
            src={`https://www.tradingview.com/embed-widget/advanced-chart/?symbol=${symbol}&interval=15&theme=light`}
            width="100%"
            height="100%"
            style={{ border: 'none', height: '100%', width: '100%', minHeight: '500px', borderRadius: '8px' }}
            allowFullScreen
          />
        </div>
      </div>
    </div>
  )
}