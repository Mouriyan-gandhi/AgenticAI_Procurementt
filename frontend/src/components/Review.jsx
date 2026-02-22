import { useState } from 'react'

export default function Review({ rankings, onSubmit }) {
    const [feedback, setFeedback] = useState('')
    const [submitting, setSubmitting] = useState(false)

    if (!rankings || rankings.length === 0) {
        return (
            <>
                <div className="view-header">
                    <div>
                        <h1 className="view-title">Manager Review</h1>
                        <p className="view-subtitle">Approve or request re-evaluation</p>
                    </div>
                </div>
                <div className="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="empty-icon">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    </svg>
                    <h3>Awaiting Evaluation</h3>
                    <p>Complete an evaluation to review results.</p>
                </div>
            </>
        )
    }

    const budget = rankings[0]?.budget_limit_usd || 850000
    const topVendor = rankings[0]

    const handleSubmit = async (action) => {
        if (action === 'feedback' && !feedback.trim()) return
        setSubmitting(true)
        await onSubmit(action, feedback.trim())
        setSubmitting(false)
        setFeedback('')
    }

    return (
        <>
            <div className="view-header">
                <div>
                    <h1 className="view-title">Manager Review</h1>
                    <p className="view-subtitle">Human-in-the-loop — your decision is required</p>
                </div>
            </div>

            {/* HITL Alert Banner */}
            <div style={{
                padding: '16px 24px',
                background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.1))',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 'var(--radius)',
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
            }}>
                <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: 'rgba(245,158,11,0.2)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0
                }}>⚠️</div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Action Required — Review Vendor Rankings</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        The AI agents have completed their evaluation. Recommended vendor: <strong style={{ color: 'var(--green)' }}>{topVendor?.vendor_name}</strong> with an overall score of <strong style={{ color: 'var(--blue)' }}>{topVendor?.overall_score}/100</strong>. Please approve or provide feedback to re-evaluate with different priorities.
                    </div>
                </div>
            </div>

            {/* Rankings Table */}
            <div className="review-summary">
                <h3>Vendor Rankings Summary</h3>
                <table className="review-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Vendor</th>
                            <th>Overall</th>
                            <th>Technical</th>
                            <th>Compliance</th>
                            <th>Price Score</th>
                            <th>Quoted Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rankings.map((v, i) => (
                            <tr key={v.vendor_name} style={i === 0 ? { background: 'rgba(34,197,94,0.05)' } : {}}>
                                <td style={{ fontWeight: 700 }}>#{i + 1} {i === 0 && '🏆'}</td>
                                <td style={{ fontWeight: i === 0 ? 700 : 400 }}>{v.vendor_name}</td>
                                <td style={{ fontWeight: 700, color: 'var(--blue)' }}>{v.overall_score}/100</td>
                                <td>{v.technical_score}</td>
                                <td>{v.compliance_score}</td>
                                <td>{v.price_score}</td>
                                <td>
                                    ${v.proposed_price_usd?.toLocaleString() || 'N/A'}
                                    {v.proposed_price_usd > budget && (
                                        <span style={{ color: 'var(--red)', fontSize: 11, marginLeft: 6, fontWeight: 600 }}>OVER BUDGET</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Decision Panel */}
            <div className="review-actions">
                <h3>Your Decision</h3>
                <p>Choose one of the options below:</p>

                {/* Option 1: Approve */}
                <div style={{
                    padding: 20, background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: 'var(--radius)', marginBottom: 16,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>✅ Approve Rankings</div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                Accept the current rankings and finalize the evaluation. {topVendor?.vendor_name} will be the recommended vendor.
                            </div>
                        </div>
                        <button className="btn btn-success" onClick={() => handleSubmit('approve')} disabled={submitting}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                            {submitting ? 'Processing...' : 'Approve'}
                        </button>
                    </div>
                </div>

                {/* Option 2: Re-evaluate with Feedback */}
                <div style={{
                    padding: 20, background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)',
                    borderRadius: 'var(--radius)',
                }}>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>💬 Re-evaluate with Feedback</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                        Provide specific feedback to adjust scoring priorities. The AI agents will re-run the evaluation with your guidance.
                    </div>
                    <textarea
                        className="feedback-input"
                        value={feedback}
                        onChange={e => setFeedback(e.target.value)}
                        placeholder="Examples:&#10;• Prioritize the vendor with the lowest cost&#10;• Give more weight to technical compliance&#10;• Focus on vendors with full ISO certifications&#10;• We need the most budget-friendly option"
                        rows={4}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={() => handleSubmit('feedback')}
                        disabled={submitting || !feedback.trim()}
                        style={{ opacity: !feedback.trim() ? 0.5 : 1 }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                        {submitting ? 'Submitting...' : 'Submit Feedback & Re-evaluate'}
                    </button>
                </div>
            </div>
        </>
    )
}
