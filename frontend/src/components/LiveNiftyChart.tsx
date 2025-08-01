import { useState, useEffect } from 'react'
import ChartModal from './ChartModal'

const charts = [
    {
        symbol: 'NASDAQ:AAPL',
        title: 'Apple Inc.',
        color: 'bg-gray-100 dark:bg-neutral-900',
    },
    {
        symbol: 'NASDAQ:MSFT',
        title: 'Microsoft Corp.',
        color: 'bg-gray-100 dark:bg-neutral-900',
    },
    {
        symbol: 'NASDAQ:TSLA',
        title: 'Tesla Inc.',
        color: 'bg-gray-100 dark:bg-neutral-900',
    },
]

type Props = {
    topOnly?: boolean
    bottomOnly?: boolean
    chart?: string
}

function useTheme() {
    const [theme, setTheme] = useState(document.documentElement.classList.contains('dark') ? 'dark' : 'light')
    useEffect(() => {
        const observer = new MutationObserver(() => {
            setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light')
        })
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
        return () => observer.disconnect()
    }, [])
    return theme
}

export default function LiveNiftyChart({ topOnly, bottomOnly, chart }: Props) {
    const [modal, setModal] = useState<{
        open: boolean
        symbol: string
        title: string
    } | null>(null)
    const theme = useTheme()

    // Helper for TradingView symbol format
    function getTradingViewSymbol(symbol: string) {
        if (symbol.endsWith('-USD')) return `CRYPTO:${symbol.replace('-USD', 'USD')}`
        if (/^[A-Z]+$/.test(symbol)) return `NASDAQ:${symbol}`
        return symbol
    }

    // Only render the chart relevant to the props
    if (topOnly) {
        return (
            <section className="h-full flex flex-col gap-6">
                <div
                    className={`cursor-pointer rounded-lg shadow border p-4 flex flex-col items-center justify-center transition-transform hover:scale-105 ${charts[0].color} w-full h-[350px] border-gray-200 dark:border-neutral-800`}
                    onClick={() =>
                        setModal({ open: true, symbol: charts[0].symbol, title: charts[0].title })
                    }
                >
                    <span className="font-bold text-md mb-2 text-gray-900 dark:text-gray-100">{charts[0].title}</span>
                    <iframe
                        key={theme}
                        title={charts[0].title}
                        src={`https://www.tradingview.com/widgetembed/?symbol=${getTradingViewSymbol(charts[0].symbol)}&interval=60&theme=${theme}&style=1`}
                        width="100%"
                        height="250"
                        style={{ border: 'none', minWidth: '320px', borderRadius: '8px', background: 'transparent' }}
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
                        className={`cursor-pointer rounded-lg shadow border p-4 flex-1 flex flex-col items-center justify-center transition-transform hover:scale-105 ${chart.color} h-[300px] border-gray-200 dark:border-neutral-800`}
                        onClick={() => setModal({ open: true, symbol: chart.symbol, title: chart.title })}
                    >
                        <span className="font-bold text-md mb-2 text-gray-900 dark:text-gray-100">{chart.title}</span>
                        <iframe
                            key={theme}
                            title={chart.title}
                            src={`https://www.tradingview.com/widgetembed/?symbol=${getTradingViewSymbol(chart.symbol)}&interval=60&theme=${theme}&style=1`}
                            width="100%"
                            height="250"
                            style={{ border: 'none', minWidth: '220px', borderRadius: '8px', background: 'transparent' }}
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
                        className={`cursor-pointer rounded-lg shadow border p-4 flex-1 flex flex-col items-center justify-center transition-transform hover:scale-105 ${chart.color} h-[300px] border-gray-200 dark:border-neutral-800`}
                        onClick={() => setModal({ open: true, symbol: chart.symbol, title: chart.title })}
                    >
                        <span className="font-bold text-md mb-2 text-gray-900 dark:text-gray-100">{chart.title}</span>
                        <iframe
                            key={theme}
                            title={chart.title}
                            src={`https://www.tradingview.com/widgetembed/?symbol=${getTradingViewSymbol(chart.symbol)}&interval=60&theme=${theme}&style=1`}
                            width="100%"
                            height="250"
                            style={{ border: 'none', minWidth: '220px', borderRadius: '8px', background: 'transparent' }}
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