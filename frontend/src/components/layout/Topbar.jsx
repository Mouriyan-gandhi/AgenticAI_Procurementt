import useStore from '../../store/evaluationStore'
import useAuthStore from '../../store/authStore'

export default function Topbar() {
    const { pipelineStatus } = useStore()
    const { user, logout } = useAuthStore()

    const chips = {
        idle: { label: 'System Online', cls: '' },
        running: { label: 'Pipeline Active', cls: 'warn' },
        parsing_requirements: { label: 'Parsing Reqs', cls: 'warn' },
        evaluating_vendors: { label: 'Evaluating', cls: 'warn' },
        generating_report: { label: 'Generating Report', cls: 'warn' },
        re_evaluating: { label: 'Re-evaluating', cls: 'warn' },
        awaiting_review: { label: 'Pending Review', cls: 'warn' },
        complete: { label: 'Complete', cls: '' },
        error: { label: 'Error', cls: 'err' },
    }

    const chip = chips[pipelineStatus] || chips.idle

    return (
        <header className="topbar">
            <div className="topbar-left">
                <div className="topbar-mark">
                    <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                    </svg>
                </div>
                <span className="topbar-wordmark"><em>Agentic</em>Procure</span>
                <div className="topbar-divider" />
                <span style={{ fontSize: 11, color: 'var(--color-text-dim)', fontWeight: 500 }}>AI Vendor Intelligence</span>
            </div>
            <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className={`topbar-chip ${chip.cls}`}>
                    <div className="pulse-dot" />
                    {chip.label}
                </div>
                {user && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ borderLeft: '1px solid var(--color-border-subtle)', height: 20 }} />
                        {user.photoURL ? (
                            <img src={user.photoURL} alt="" style={{
                                width: 28, height: 28, borderRadius: '50%',
                                border: '2px solid var(--color-border-subtle)',
                            }} />
                        ) : (
                            <div style={{
                                width: 28, height: 28, borderRadius: '50%',
                                background: 'var(--color-primary)', color: 'white',
                                display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700,
                            }}>
                                {(user.displayName || user.email || '?')[0].toUpperCase()}
                            </div>
                        )}
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.displayName || user.email?.split('@')[0]}
                        </span>
                        <button
                            onClick={logout}
                            style={{
                                padding: '4px 10px', borderRadius: 6, border: '1px solid var(--color-border-subtle)',
                                background: 'transparent', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                                color: 'var(--color-text-dim)', transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { e.target.style.background = '#fef2f2'; e.target.style.color = '#dc2626'; e.target.style.borderColor = '#fecaca' }}
                            onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--color-text-dim)'; e.target.style.borderColor = 'var(--color-border-subtle)' }}
                        >
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        </header>
    )
}
