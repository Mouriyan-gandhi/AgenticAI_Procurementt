import { useState } from 'react'
import { motion } from 'framer-motion'
import useStore from '../store/evaluationStore'

export default function Review() {
    const { rankings, submitReview } = useStore()
    const [feedback, setFeedback] = useState('')
    const [busy, setBusy] = useState(false)

    if (!rankings?.length) {
        return (
            <>
                <div className="page-header"><h1 className="page-title">Manager Review</h1></div>
                <div className="empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                    <h3>Awaiting Evaluation</h3><p>Run an evaluation to review results here.</p>
                </div>
            </>
        )
    }

    const top = rankings[0]
    const budget = top?.budget_limit_usd || 850000

    const act = async (action) => {
        if (action === 'feedback' && !feedback.trim()) return
        setBusy(true)
        await submitReview(action, feedback.trim())
        setBusy(false)
        setFeedback('')
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Manager Review</h1>
                <p className="page-subtitle">Human-in-the-loop decision point — approve or redirect the AI</p>
            </div>

            {/* Alert */}
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{
                    padding: '18px 22px', borderRadius: 12, marginBottom: 20,
                    background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning-border)',
                    display: 'flex', alignItems: 'center', gap: 16,
                }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(217,119,6,0.1)', display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0 }}>⚠️</div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text)', marginBottom: 2 }}>Action Required — Review Vendor Rankings</div>
                        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                            AI recommends <strong style={{ color: 'var(--color-success)' }}>{top.vendor_name}</strong> with a score of {top.overall_score}/10.
                            {top.justification && (
                                <div style={{ marginTop: 6, background: 'rgba(255,255,255,0.5)', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.05)' }}>
                                    <strong style={{ color: 'var(--color-text)', marginRight: 6 }}>Rationale:</strong>
                                    {top.justification}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Rankings Table */}
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
                <div className="card" style={{ marginBottom: 20 }}>
                    <div className="card-header"><span className="section-title">Vendor Rankings</span></div>
                    <table className="dtable">
                        <thead><tr><th>Rank</th><th>Vendor</th><th>Overall</th><th>Technical</th><th>Compliance</th><th>Price</th><th>Quoted</th></tr></thead>
                        <tbody>
                            {rankings.map((v, i) => (
                                <tr key={v.vendor_name} style={i === 0 ? { background: 'var(--color-success-bg)' } : {}}>
                                    <td style={{ fontWeight: 700 }}>#{i + 1}{i === 0 && ' 🏆'}</td>
                                    <td style={{ fontWeight: i === 0 ? 700 : 400 }}>{v.vendor_name}</td>
                                    <td style={{ fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>{v.overall_score}</td>
                                    <td>{v.technical_score}</td>
                                    <td>{v.compliance_score}</td>
                                    <td>{v.price_score}</td>
                                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                                        ${(v.proposed_price_usd || 0).toLocaleString()}
                                        {v.proposed_price_usd > budget && <span className="chip chip-err" style={{ marginLeft: 6 }}>Over</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Negotiation Strategy View */}
            {top.negotiation_strategy && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}>
                    <div className="card" style={{ marginBottom: 20, borderColor: 'var(--color-primary-ring)', background: 'var(--color-primary-soft)' }}>
                        <div className="card-header" style={{ borderBottomColor: 'var(--color-primary-ring)' }}>
                            <span className="section-title" style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                🤝 AI Negotiation Playbook
                            </span>
                        </div>
                        <div className="card-body" style={{ padding: '20px 24px' }}>
                            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>Action Plan</h4>
                                    <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{top.negotiation_strategy.action_plan}</p>
                                </div>
                                <div style={{ background: 'white', padding: '10px 16px', borderRadius: 8, border: '1px solid var(--color-border)', textAlign: 'right', marginLeft: 24, flexShrink: 0 }}>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Counter-Offer Target</div>
                                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>${(top.negotiation_strategy.suggested_counter_offer_usd || 0).toLocaleString()}</div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                <div>
                                    <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Leverage Points</h4>
                                    <ul style={{ paddingLeft: 18, margin: 0 }}>
                                        {top.negotiation_strategy.leverage_points?.map((pt, i) => (
                                            <li key={i} style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6, lineHeight: 1.4 }}>{pt}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Draft Counter-Offer Email</h4>
                                    <div style={{ background: 'white', padding: 14, borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                        {top.negotiation_strategy.email_draft}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Decision Cards */}
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                <div className="card" style={{ borderColor: 'var(--color-success-border)' }}>
                    <div className="card-body" style={{ padding: 24 }}>
                        <div style={{ fontSize: 28, marginBottom: 12 }}>✅</div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: 'var(--color-text)' }}>Approve Rankings</h3>
                        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
                            Finalize <strong>{top.vendor_name}</strong> as the selected vendor and complete the evaluation process.
                        </p>
                        <button className="btn btn-success btn-lg" style={{ width: '100%' }} onClick={() => act('approve')} disabled={busy}>
                            {busy ? <><div className="spin" /> Processing…</> : 'Approve & Finalize'}
                        </button>
                    </div>
                </div>

                <div className="card">
                    <div className="card-body" style={{ padding: 24 }}>
                        <div style={{ fontSize: 28, marginBottom: 12 }}>💬</div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: 'var(--color-text)' }}>Request Re-evaluation</h3>
                        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
                            Provide feedback to adjust how agents score vendors.
                        </p>
                        <textarea className="text-input" value={feedback} onChange={e => setFeedback(e.target.value)}
                            placeholder={"Examples:\n• Prioritize lowest cost option\n• Give more weight to compliance\n• Require full ISO 14001 certification"} rows={3} />
                        <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 10, opacity: !feedback.trim() ? 0.4 : 1 }}
                            onClick={() => act('feedback')} disabled={busy || !feedback.trim()}>
                            {busy ? <><div className="spin" /> Submitting…</> : 'Submit & Re-evaluate'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    )
}
