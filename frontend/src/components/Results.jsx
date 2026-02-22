const RANK_COLORS = ['var(--green)', 'var(--blue)', 'var(--amber)']
const RANK_LABELS = ['1st', '2nd', '3rd']

export default function Results({ rankings }) {
    if (!rankings || rankings.length === 0) {
        return (
            <>
                <div className="view-header">
                    <div>
                        <h1 className="view-title">Evaluation Results</h1>
                        <p className="view-subtitle">Vendor comparison and rankings</p>
                    </div>
                </div>
                <div className="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="empty-icon">
                        <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
                    </svg>
                    <h3>No Results Yet</h3>
                    <p>Start an evaluation to see vendor rankings here.</p>
                </div>
            </>
        )
    }

    return (
        <>
            <div className="view-header">
                <div>
                    <h1 className="view-title">Evaluation Results</h1>
                    <p className="view-subtitle">{rankings.length} vendors evaluated and ranked</p>
                </div>
            </div>

            {rankings.map((v, i) => {
                const rank = i + 1
                const budget = v.budget_limit_usd || 850000
                const overBudget = v.proposed_price_usd > budget

                return (
                    <div className={`result-card rank-${rank}`} key={v.vendor_name}>
                        <div className="result-rank">
                            <div className="rank-number" style={{ color: RANK_COLORS[i] || 'var(--text-muted)' }}>#{rank}</div>
                            <div className="rank-label">{RANK_LABELS[i] || `${rank}th`}</div>
                        </div>
                        <div className="result-main">
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span className="result-vendor-name">{v.vendor_name}</span>
                                {rank === 1 && <span className="recommended-badge">★ RECOMMENDED</span>}
                            </div>
                            <div className="result-price">
                                ${v.proposed_price_usd?.toLocaleString() || 'N/A'}
                                {overBudget && <span className="over-budget"> ● OVER BUDGET</span>}
                            </div>
                            <div className="result-scores">
                                <ScoreBar label="Technical" value={v.technical_score} cls="tech" />
                                <ScoreBar label="Compliance" value={v.compliance_score} cls="comply" />
                                <ScoreBar label="Price" value={v.price_score} cls="price" />
                            </div>
                        </div>
                        <div className="result-overall">
                            <div className="overall-score">{v.overall_score}</div>
                            <div className="overall-label">Overall</div>
                        </div>
                    </div>
                )
            })}
        </>
    )
}

function ScoreBar({ label, value, cls }) {
    return (
        <div className="score-block">
            <div className="score-label">{label}</div>
            <div className="score-bar-bg">
                <div className={`score-bar ${cls}`} style={{ width: `${value}%` }} />
            </div>
            <div className="score-value">{value}/100</div>
        </div>
    )
}
