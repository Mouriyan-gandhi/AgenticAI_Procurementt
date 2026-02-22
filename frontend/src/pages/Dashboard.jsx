import { motion } from 'framer-motion'
import useStore from '../store/evaluationStore'

const fade = (d = 0) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: d, duration: 0.2 } })

export default function Dashboard() {
    const { systemInfo, setView, logs, rankings, pipelineStatus } = useStore()
    const vendors = systemInfo?.vendors || []

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">AI-powered vendor intelligence overview</p>
            </div>

            <motion.div className="kpi-grid" {...fade(0.03)}>
                <div className="kpi">
                    <div className="kpi-label">Requirements</div>
                    <div className="kpi-value" style={{ color: systemInfo?.has_requirements ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {systemInfo?.has_requirements ? '✓' : '—'}
                    </div>
                    <div className="kpi-meta">{systemInfo?.has_requirements ? 'File loaded' : 'Not uploaded'}</div>
                </div>
                <div className="kpi">
                    <div className="kpi-label">Vendor Proposals</div>
                    <div className="kpi-value" style={{ color: 'var(--color-primary)' }}>{vendors.length}</div>
                    <div className="kpi-meta">{vendors.length} PDFs detected</div>
                </div>
                <div className="kpi">
                    <div className="kpi-label">Pipeline Status</div>
                    <div className="kpi-value" style={{ fontSize: 18, color: pipelineStatus === 'idle' ? 'var(--color-success)' : 'var(--color-warning)' }}>
                        {pipelineStatus === 'idle' ? 'Ready' : pipelineStatus.replace(/_/g, ' ')}
                    </div>
                    <div className="kpi-meta">5 AI agents standing by</div>
                </div>
                <div className="kpi">
                    <div className="kpi-label">AI Model</div>
                    <div className="kpi-value" style={{ color: 'var(--color-accent)' }}>Gemini</div>
                    <div className="kpi-meta">2.5 Flash</div>
                </div>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
                <motion.div {...fade(0.06)}>
                    <div className="card">
                        <div className="card-header">
                            <span className="section-title">Discovered Vendor Files</span>
                            <span className="chip chip-info">{vendors.length}</span>
                        </div>
                        <div className="card-body">
                            {vendors.length === 0 ? (
                                <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>No vendor proposals found</p>
                            ) : vendors.map((v, i) => (
                                <div key={v.name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < vendors.length - 1 ? '1px solid var(--color-border-subtle)' : 'none' }}>
                                    <div style={{
                                        width: 34, height: 34, borderRadius: 8,
                                        background: ['#2563EB', '#7C3AED', '#0891B2', '#D97706'][i % 4],
                                        display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 12, color: 'white',
                                    }}>{v.name.substring(0, 2).toUpperCase()}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text)' }}>{v.name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{v.file}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="card-footer">
                            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => setView('new')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" style={{ width: 15, height: 15 }}><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                New Evaluation
                            </button>
                        </div>
                    </div>
                </motion.div>

                <motion.div {...fade(0.09)}>
                    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div className="card-header">
                            <span className="section-title">Agent Activity</span>
                            {logs.length > 0 && <div className="live-indicator"><div className="rec-dot" /><span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-danger)', letterSpacing: 1 }}>LIVE</span></div>}
                        </div>
                        <div className="card-body" style={{ flex: 1, overflow: 'auto', maxHeight: 350 }}>
                            {logs.length === 0 ? (
                                <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: 28 }}>No recent activity</p>
                            ) : [...logs].reverse().slice(0, 20).map((l, i) => (
                                <div className="feed-item" key={i}>
                                    <div className="feed-dot" style={{ background: l.level === 'success' ? 'var(--color-success)' : l.level === 'error' ? 'var(--color-danger)' : 'var(--color-primary)' }} />
                                    <div>
                                        <div className="feed-text">{l.message}</div>
                                        <div className="feed-meta">{l.vendor && `${l.vendor} · `}{l.step || ''}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {rankings?.length > 0 && (
                <motion.div {...fade(0.12)} style={{ marginTop: 16 }}>
                    <div className="card">
                        <div className="card-header"><span className="section-title">Latest Evaluation</span></div>
                        <table className="dtable">
                            <thead><tr><th>Rank</th><th>Vendor</th><th>Overall</th><th>Technical</th><th>Compliance</th><th>Price</th><th></th></tr></thead>
                            <tbody>
                                {rankings.map((v, i) => (
                                    <tr key={v.vendor_name} style={{ cursor: 'pointer' }} onClick={() => setView('results')}>
                                        <td style={{ fontWeight: 700, color: i === 0 ? 'var(--color-success)' : 'var(--color-text)' }}>#{i + 1}</td>
                                        <td style={{ fontWeight: 600 }}>{v.vendor_name}</td>
                                        <td style={{ fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>{v.overall_score}</td>
                                        <td>{v.technical_score}</td>
                                        <td>{v.compliance_score}</td>
                                        <td>{v.price_score}</td>
                                        <td>{i === 0 ? <span className="chip chip-ok">Top Pick</span> : <span className="chip chip-info">Evaluated</span>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}
        </>
    )
}
