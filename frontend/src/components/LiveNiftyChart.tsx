import { useState } from 'react'
import ChartModal from './ChartModal'

const charts = [
	{
		symbol: 'NASDAQ:AAPL',
		title: 'Apple Inc.',
		color: 'bg-gray-100',
	},
	{
		symbol: 'NASDAQ:MSFT',
		title: 'Microsoft Corp.',
		color: 'bg-gray-100',
	},
	{
		symbol: 'NASDAQ:TSLA',
		title: 'Tesla Inc.',
		color: 'bg-gray-100',
	},
]

type Props = {
	topOnly?: boolean
	bottomOnly?: boolean
	chart?: string
}

export default function LiveNiftyChart({ topOnly, bottomOnly, chart }: Props) {
	const [modal, setModal] = useState<{
		open: boolean
		symbol: string
		title: string
	} | null>(null)

	// Only render the chart relevant to the props
	if (topOnly) {
		return (
			<section className="h-full flex flex-col gap-6">
				<div
					className={`cursor-pointer rounded-lg shadow border p-4 flex flex-col items-center justify-center transition-transform hover:scale-105 ${charts[0].color} w-full h-[350px]`}
					onClick={() =>
						setModal({ open: true, symbol: charts[0].symbol, title: charts[0].title })
					}
				>
					<span className="font-bold text-lg mb-2">{charts[0].title}</span>
					<iframe
						title={charts[0].title}
						src={`https://www.tradingview.com/embed-widget/mini-symbol-overview/?symbol=${charts[0].symbol}&theme=light`}
						width="100%"
						height="250"
						style={{ border: 'none', minWidth: '320px', borderRadius: '8px' }}
						allowFullScreen
					/>
				</div>
				{modal?.open && (
					<ChartModal
						open={modal.open}
						onClose={() => setModal(null)}
						symbol={modal.symbol}
						title={modal.title}
					/>
				)}
			</section>
		)
	}
	if (bottomOnly && chart === '1') {
		return (
			<section className="flex flex-row gap-6 w-full">
				{[charts[1]].map(chart => (
					<div
						key={chart.symbol}
						className={`cursor-pointer rounded-lg shadow border p-4 flex-1 flex flex-col items-center justify-center transition-transform hover:scale-105 ${chart.color} h-[300px]`}
						onClick={() => setModal({ open: true, symbol: chart.symbol, title: chart.title })}
					>
						<span className="font-bold text-lg mb-2">{chart.title}</span>
						<iframe
							title={chart.title}
							src={`https://www.tradingview.com/embed-widget/mini-symbol-overview/?symbol=${chart.symbol}&theme=light`}
							width="100%"
							height="180"
							style={{ border: 'none', minWidth: '220px', borderRadius: '8px' }}
							allowFullScreen
						/>
					</div>
				))}
				{modal?.open && (
					<ChartModal
						open={modal.open}
						onClose={() => setModal(null)}
						symbol={modal.symbol}
						title={modal.title}
					/>
				)}
			</section>
		)
	}
	if (bottomOnly && chart === '2') {
		return (
			<section className="flex flex-row gap-6 w-full">
				{[charts[2]].map(chart => (
					<div
						key={chart.symbol}
						className={`cursor-pointer rounded-lg shadow border p-4 flex-1 flex flex-col items-center justify-center transition-transform hover:scale-105 ${chart.color} h-[300px]`}
						onClick={() => setModal({ open: true, symbol: chart.symbol, title: chart.title })}
					>
						<span className="font-bold text-lg mb-2">{chart.title}</span>
						<iframe
							title={chart.title}
							src={`https://www.tradingview.com/embed-widget/mini-symbol-overview/?symbol=${chart.symbol}&theme=light`}
							width="100%"
							height="180"
							style={{ border: 'none', minWidth: '220px', borderRadius: '8px' }}
							allowFullScreen
						/>
					</div>
				))}
				{modal?.open && (
					<ChartModal
						open={modal.open}
						onClose={() => setModal(null)}
						symbol={modal.symbol}
						title={modal.title}
					/>
				)}
			</section>
		)
	}
	// fallback (should not be used)
	return null
}