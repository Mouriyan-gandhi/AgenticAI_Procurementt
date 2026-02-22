import useStore from '../../store/evaluationStore'

const SECTIONS = [
    {
        label: 'Overview', items: [
            { id: 'dashboard', label: 'Dashboard', d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10' },
        ]
    },
    {
        label: 'Evaluations', items: [
            { id: 'new', label: 'New Evaluation', d: 'M12 5v14M5 12h14' },
            { id: 'pipeline', label: 'Live Pipeline', d: 'M22 12h-4l-3 9L9 3l-3 9H2' },
            { id: 'results', label: 'Results', d: 'M18 20V10M12 20V4M6 20v-6' },
            { id: 'review', label: 'Manager Review', d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87' },
        ]
    },
    {
        label: 'System', items: [
            { id: 'knowledge', label: 'Knowledge Base', d: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z' },
        ]
    },
]

export default function Sidebar() {
    const { view, setView, pipelineStatus, rankings } = useStore()

    return (
        <aside className="sidebar">
            {SECTIONS.map(s => (
                <div className="sidebar-section" key={s.label}>
                    <div className="sidebar-section-label">{s.label}</div>
                    {s.items.map(item => (
                        <button key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} onClick={() => setView(item.id)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d={item.d} />
                            </svg>
                            {item.label}
                            {item.id === 'review' && pipelineStatus === 'awaiting_review' && <span className="nav-badge alert">!</span>}
                            {item.id === 'results' && rankings?.length > 0 && <span className="nav-badge">{rankings.length}</span>}
                            {item.id === 'pipeline' && pipelineStatus === 'running' && <span className="nav-badge">⚡</span>}
                        </button>
                    ))}
                </div>
            ))}
        </aside>
    )
}
