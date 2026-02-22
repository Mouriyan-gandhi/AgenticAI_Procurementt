import { motion } from 'framer-motion'
import useStore from '../store/evaluationStore'

export default function Results() {
    const { rankings } = useStore()

    if (!rankings?.length) {
        return (
            <>
                <div className="page-header"><h1 className="page-title">Evaluation Results</h1></div>
                <div className="empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>
                    <h3>No Results Yet</h3><p>Complete an evaluation to view rankings.</p>
                </div>
            </>
        )
    }

    const w = rankings[0]
    const budget = w?.budget_limit_usd || 850000

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Evaluation Results</h1>
                <p className="page-subtitle">{rankings.length} vendors evaluated and ranked</p>
            </div>

            {/* Winner */}
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="winner-hero">
                    <div style={{ fontSize: 42, lineHeight: 1 }}>🏆</div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--color-success)', marginBottom: 3 }}>
                            Recommended Vendor
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.4 }}>{w.vendor_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 3 }}>
                            Highest overall match across technical, compliance, and pricing dimensions
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0 12px' }}>
                        <div style={{ fontSize: 36, fontWeight: 900, background: 'linear-gradient(135deg, var(--color-success), var(--color-cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>
                            {w.overall_score}
                        </div>
                        <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--color-text-dim)', letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 3 }}>/ 10</div>
                    </div>
                </div>
            </motion.div>

            {/* Vendor Rows */}
            {rankings.map((v, i) => (
                <motion.div key={v.vendor_name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 + i * 0.06 }}>
                    <div className={`vendor-row ${i === 0 ? 'top' : ''}`}>
                        <div className="vendor-rank">
                            <div className="vendor-rank-num" style={{ color: ['var(--color-success)', 'var(--color-primary)', 'var(--color-warning)'][i] || 'var(--color-text-dim)' }}>
                                {i + 1}
                            </div>
                            <div className="vendor-rank-sub">{['1st', '2nd', '3rd'][i] || `${i + 1}th`}</div>
                        </div>
                        <div className="vendor-info">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="vendor-name">{v.vendor_name}</span>
                                {i === 0 && <span className="chip chip-ok">★ Top Pick</span>}
                                {v.proposed_price_usd > budget && <span className="chip chip-err">Over Budget</span>}
                            </div>
                            <div className="vendor-price">${(v.proposed_price_usd || 0).toLocaleString()}</div>
                            <div className="vendor-metrics">
                                <Metric label="Technical" value={v.technical_score} cls="f-tech" />
                                <Metric label="Compliance" value={v.compliance_score} cls="f-comp" />
                                <Metric label="Price" value={v.price_score} cls="f-price" />
                            </div>
                            {v.justification && (
                                <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--color-bg-page)', borderRadius: 6, fontSize: 12.5, color: 'var(--color-text-secondary)', borderLeft: '3px solid var(--color-primary)', lineHeight: 1.5 }}>
                                    <strong style={{ color: 'var(--color-text)', marginRight: 6 }}>AI Rationale:</strong>
                                    {v.justification}
                                </div>
                            )}

                            {v.negotiation_strategy && (
                                <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--color-primary-soft)', border: '1px solid var(--color-primary-ring)', borderRadius: 8 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        🤝 Negotiation Playbook
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 16 }}>
                                        <div>
                                            <div style={{ fontSize: 12.5, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{v.negotiation_strategy.action_plan}</div>
                                            <ul style={{ paddingLeft: 16, margin: '8px 0 0 0' }}>
                                                {v.negotiation_strategy.leverage_points?.slice(0, 2).map((pt, j) => (
                                                    <li key={j} style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{pt}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Target</div>
                                            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                                                ${(v.negotiation_strategy.suggested_counter_offer_usd || 0).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="vendor-score">
                            <div className="vendor-score-num">{v.overall_score}</div>
                            <div className="vendor-score-label">/ 10</div>
                        </div>
                    </div>
                </motion.div>
            ))}

            {/* Full Table */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} style={{ marginTop: 8 }}>
                <div className="card">
                    <div className="card-header"><span className="section-title">Full Comparison</span></div>
                    <table className="dtable">
                        <thead><tr><th>Vendor</th><th>Technical</th><th>Compliance</th><th>Price</th><th>Overall</th><th>Quoted</th><th></th></tr></thead>
                        <tbody>
                            {rankings.map((v, i) => (
                                <tr key={v.vendor_name}>
                                    <td style={{ fontWeight: 600 }}>{v.vendor_name}</td>
                                    <td>{v.technical_score}</td>
                                    <td>{v.compliance_score}</td>
                                    <td>{v.price_score}</td>
                                    <td style={{ fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>{v.overall_score}</td>
                                    <td style={{ fontFamily: 'var(--font-mono)' }}>${(v.proposed_price_usd || 0).toLocaleString()}</td>
                                    <td>{i === 0 ? <span className="chip chip-ok">Top</span> : <span className="chip chip-info">OK</span>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </>
    )
}

function Metric({ label, value, cls }) {
    return (
        <div style={{ flex: 1 }}>
            <div className="metric-row">
                <span className="metric-label">{label}</span>
                <div className="metric-track">
                    <motion.div className={`metric-fill ${cls}`} initial={{ width: 0 }} animate={{ width: `${value * 10}%` }} transition={{ duration: 0.7, delay: 0.2 }} />
                </div>
                <span className="metric-val">{value}</span>
            </div>
        </div>
    )
}
