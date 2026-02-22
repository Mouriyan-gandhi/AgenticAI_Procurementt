const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899']
const AGENTS = [
    { name: 'Librarian', color: '#3b82f6' },
    { name: 'Engineer', color: '#8b5cf6' },
    { name: 'Compliance', color: '#06b6d4' },
    { name: 'Scorer', color: '#f59e0b' },
    { name: 'Reporter', color: '#22c55e' },
]

export default function Dashboard({ systemInfo, onStart, pipelineStatus }) {
    const vendors = systemInfo?.vendors || []
    const isRunning = ['running', 'parsing_requirements', 'evaluating_vendors', 'generating_report', 're_evaluating'].includes(pipelineStatus)

    return (
        <>
            <div className="view-header">
                <div>
                    <h1 className="view-title">Vendor Evaluation Dashboard</h1>
                    <p className="view-subtitle">AI-powered multi-agent procurement analysis</p>
                </div>
            </div>

            {/* Hero */}
            <div className="hero-card">
                <div style={{ flex: 1 }}>
                    <div className="hero-badge">AGENTIC AI</div>
                    <h2>Multi-Agent Vendor Evaluation</h2>
                    <p>Deploy 5 specialized AI agents to automatically evaluate vendor proposals against your company requirements. Get instant technical assessments, compliance checks, market price validation, and ranked recommendations.</p>
                    <div className="hero-agents">
                        {AGENTS.map(a => (
                            <div className="agent-chip" key={a.name}>
                                <span className="chip-dot" style={{ background: a.color }} />
                                {a.name}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="orbit-ring orbit-ring-1"><div className="orbit-dot" /></div>
                    <div className="orbit-ring orbit-ring-2"><div className="orbit-dot" /></div>
                    <div className="orbit-ring orbit-ring-3"><div className="orbit-dot" /></div>
                    <div className="orbit-center">AI</div>
                </div>
            </div>

            {/* Info Grid */}
            <div className="info-grid">
                <div className="info-card">
                    <div className="info-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                    </div>
                    <div className="info-label">Requirements</div>
                    <div className="info-value">{systemInfo?.has_requirements ? '✓ Found' : '✗ Missing'}</div>
                </div>
                <div className="info-card">
                    <div className="info-icon" style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                    </div>
                    <div className="info-label">Vendor Proposals</div>
                    <div className="info-value">{vendors.length} found</div>
                </div>
                <div className="info-card">
                    <div className="info-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    </div>
                    <div className="info-label">AI Model</div>
                    <div className="info-value">Gemini 2.5 Flash</div>
                </div>
                <div className="info-card">
                    <div className="info-icon" style={{ background: 'linear-gradient(135deg, #22c55e, #06b6d4)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                    </div>
                    <div className="info-label">RAG Memory</div>
                    <div className="info-value">ChromaDB Active</div>
                </div>
            </div>

            {/* Vendor List */}
            <div className="card">
                <div className="card-header"><h3>Discovered Vendor Proposals</h3></div>
                <div className="card-body">
                    {vendors.length === 0 ? (
                        <div className="log-empty">No vendor proposals found</div>
                    ) : (
                        vendors.map((v, i) => (
                            <div className="vendor-item" key={v.name}>
                                <div className="vendor-avatar" style={{ background: COLORS[i % COLORS.length] }}>
                                    {v.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div className="vendor-name">{v.name}</div>
                                    <div className="vendor-file">{v.file}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="card-footer">
                    <button className="btn btn-primary btn-lg" onClick={onStart} disabled={isRunning || vendors.length === 0}>
                        {isRunning ? (
                            <><div className="spinner" /> Running...</>
                        ) : (
                            <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg> Start AI Evaluation</>
                        )}
                    </button>
                </div>
            </div>
        </>
    )
}
