import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import useStore from '../store/evaluationStore'

const AGENTS = [
    { id: 'librarian', name: 'Librarian', emoji: '📚', role: 'Data Extraction', steps: ['requirements', 'loading', 'parsing'] },
    { id: 'engineer', name: 'Engineer', emoji: '🔧', role: 'Technical Assessment', steps: ['engineering'] },
    { id: 'compliance', name: 'Compliance', emoji: '🛡️', role: 'Certification Audit', steps: ['compliance'] },
    { id: 'scorer', name: 'Scorer', emoji: '📊', role: 'Score Calculator', steps: ['scoring'] },
    { id: 'negotiator', name: 'Negotiator', emoji: '🤝', role: 'Strategy Planner', steps: ['negotiating'] },
    { id: 'reporter', name: 'Reporter', emoji: '📝', role: 'Report Generator', steps: ['ranking'] },
]

const STEP_ORDER = ['requirements', 'loading', 'parsing', 'engineering', 'compliance', 'scoring', 'negotiating', 'ranking']

function agentState(agentSteps, currentStep, status) {
    if (['complete', 'awaiting_review'].includes(status)) return 'done'
    const ci = STEP_ORDER.indexOf(currentStep)
    const first = Math.min(...agentSteps.map(s => STEP_ORDER.indexOf(s)).filter(i => i >= 0))
    const last = Math.max(...agentSteps.map(s => STEP_ORDER.indexOf(s)).filter(i => i >= 0))
    if (ci > last) return 'done'
    if (ci >= first && ci <= last) return 'running'
    return 'waiting'
}

export default function Pipeline() {
    const { logs, pipelineStatus, progress, logStartTime, evalId } = useStore()
    const [showConsole, setShowConsole] = useState(true)
    const scrollRef = useRef(null)
    useEffect(() => { scrollRef.current && (scrollRef.current.scrollTop = scrollRef.current.scrollHeight) }, [logs])

    const last = logs[logs.length - 1] || {}
    const step = last.step || ''
    const vendor = last.vendor || ''
    const vc = last.vendors_completed || 0
    const vt = last.vendors_total || 0
    const live = !['idle', 'complete', 'error'].includes(pipelineStatus)
    const done = pipelineStatus === 'complete' || pipelineStatus === 'awaiting_review'

    const agentMsgs = {}
    for (const l of logs) for (const a of AGENTS) if (a.steps.includes(l.step)) agentMsgs[a.id] = l.message

    return (
        <>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h1 className="page-title">Live AI Pipeline</h1>
                    <p className="page-subtitle">
                        {evalId && <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>EV-{evalId} · </span>}
                        {done ? 'Pipeline complete' : live ? `Processing ${vt} vendors` : 'Idle — start an evaluation'}
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--color-primary)', lineHeight: 1 }}>
                        {Math.round(progress * 100)}%
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-dim)', letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 2 }}>Complete</div>
                </div>
            </div>

            {/* Progress */}
            <div style={{ marginBottom: 24 }}>
                <div className="track">
                    <div className={`track-fill ${done ? 'green' : ''}`} style={{ width: `${progress * 100}%` }} />
                </div>
                {vendor && live && (
                    <div style={{ fontSize: 11.5, color: 'var(--color-text-dim)', marginTop: 5 }}>
                        Processing <strong style={{ color: 'var(--color-text-secondary)' }}>{vendor}</strong>
                        {vt > 0 && ` · ${vc}/${vt} vendors`}
                    </div>
                )}
            </div>

            {/* Agent Pipeline */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                className="pipeline-track" style={{ marginBottom: 24 }}>
                {AGENTS.map((a, i) => {
                    const st = agentState(a.steps, step, pipelineStatus)
                    const msg = agentMsgs[a.id]
                    return (
                        <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start' }}>
                            <motion.div
                                className={`agent-node ${st}`}
                                animate={st === 'running' ? { scale: [1, 1.015, 1] } : {}}
                                transition={{ duration: 2.5, repeat: Infinity }}
                            >
                                <div className="agent-emoji">{st === 'done' ? '✅' : a.emoji}</div>
                                <div className="agent-label">{a.name}</div>
                                <div className="agent-role">{a.role}</div>
                                <div className={`agent-state s-${st === 'running' ? 'run' : st === 'done' ? 'done' : 'wait'}`}>
                                    {st === 'running' ? '● Active' : st === 'done' ? '✓ Done' : '○ Queued'}
                                </div>
                                {st === 'running' && (
                                    <div className="micro-bar">
                                        <motion.div className="micro-bar-inner" animate={{ width: ['8%', '85%', '8%'] }} transition={{ duration: 2, repeat: Infinity }} />
                                    </div>
                                )}
                                {msg && <div className="agent-detail">{msg.length > 55 ? msg.slice(0, 55) + '…' : msg}</div>}
                            </motion.div>
                            {i < AGENTS.length - 1 && (
                                <div className={`connector ${st === 'done' ? 'c-done' : st === 'running' ? 'c-run' : ''}`}>→</div>
                            )}
                        </div>
                    )
                })}
            </motion.div>

            {/* Console */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <div className="console" style={{ height: showConsole ? 'auto' : 41 }}>
                    <div className="console-bar" onClick={() => setShowConsole(!showConsole)} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        <div className="console-bar-left">
                            <div className="console-bar-dots">
                                <span style={{ background: '#EF4444' }} /><span style={{ background: '#FBBF24' }} /><span style={{ background: '#22C55E' }} />
                            </div>
                            Agent Console <span style={{ opacity: 0.5, marginLeft: 8, fontSize: 10 }}>{showConsole ? '▼ HIDE' : '▲ SHOW'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {live && <div className="live-indicator"><div className="rec-dot" /><span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-danger)', letterSpacing: 1 }}>LIVE</span></div>}
                            {done && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-success)', letterSpacing: 1 }}>DONE</span>}
                        </div>
                    </div>
                    {showConsole && (
                        <div className="console-scroll" ref={scrollRef}>
                            {logs.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-dim)', fontFamily: 'var(--font-sans)', fontSize: 12 }}>
                                    Awaiting pipeline start…
                                </div>
                            ) : logs.map((l, i) => {
                                const t = logStartTime ? ((l.timestamp * 1000 - logStartTime) / 1000).toFixed(1) : '0.0'
                                const cls = l.level === 'success' ? 'ok' : l.level === 'error' ? 'err' : l.level === 'warning' ? 'wr' : l.level === 'review' ? 'rv' : ''
                                return (
                                    <div className="log-row" key={i}>
                                        <span className="log-ts">{t}s</span>
                                        <span className={`log-msg ${cls}`}>{l.message}</span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </motion.div>
        </>
    )
}
