export default function Sidebar({ view, setView, hasBadge }) {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></> },
        { id: 'progress', label: 'Live Pipeline', icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /> },
        { id: 'results', label: 'Results', icon: <><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></> },
        { id: 'review', label: 'Manager Review', icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></> },
    ]

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                    </svg>
                </div>
                <div>
                    <span className="logo-title">VendorAI</span>
                    <span className="logo-subtitle">Evaluation System</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        className={`nav-btn ${view === item.id ? 'active' : ''}`}
                        onClick={() => setView(item.id)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{item.icon}</svg>
                        <span>{item.label}</span>
                        {hasBadge[item.id] && <span className="badge" />}
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="status-indicator">
                    <div className="status-dot" />
                    <span>System Ready</span>
                </div>
            </div>
        </aside>
    )
}
