import '../styles/notifications.css'

const ICONS: Record<string, JSX.Element> = {
  success: (
    <span className="notification-icon text-green-500">
      <svg width="32" height="32" fill="none" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="16" fill="#bbf7d0"/>
        <path d="M10 17l4 4 8-8" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  ),
  error: (
    <span className="notification-icon text-red-500">
      <svg width="32" height="32" fill="none" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="16" fill="#fecaca"/>
        <path d="M20 12l-8 8M12 12l8 8" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    </span>
  ),
  warning: (
    <span className="notification-icon text-yellow-500">
      <svg width="32" height="32" fill="none" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="16" fill="#fef08a"/>
        <rect x="15" y="10" width="2" height="8" rx="1" fill="#facc15"/>
        <rect x="15" y="20" width="2" height="2" rx="1" fill="#facc15"/>
      </svg>
    </span>
  ),
}

export default function Notification({
  type = 'success',
  title,
  children,
  onClose,
}: {
  type?: 'success' | 'warning' | 'error'
  title?: string
  children: React.ReactNode
  onClose?: () => void
}) {
  return (
    <div className={`notification notification-${type}`}>
      {ICONS[type]}
      <div className="notification-content">
        {title && <span className="notification-title">{title}</span>}
        <span>{children}</span>
      </div>
      {onClose && (
        <button className="notification-close" onClick={onClose} aria-label="Close notification">
          ×
        </button>
      )}
    </div>
  )
}