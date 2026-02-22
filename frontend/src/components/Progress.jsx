import { useEffect, useRef } from 'react'

const STEP_MAP = {
    parsing_requirements: 'requirements',
    evaluating_vendors: 'vendors',
    re_evaluating: 'vendors',
    generating_report: 'ranking',
    awaiting_review: 'review',
    complete: 'done',
}

const STEPS = [
    { id: 'requirements', name: 'Parse Requirements', desc: 'AI Librarian extracts structured requirements' },
    { id: 'vendors', name: 'Evaluate Vendors', desc: 'Parse, audit, and score each vendor' },
    { id: 'ranking', name: 'Generate Rankings', desc: 'Compare and rank all vendors' },
    { id: 'review', name: 'Manager Review', desc: 'Human-in-the-loop approval' },
]

export default function Progress({ logs, status, progress, logStartTime }) {
    const logRef = useRef(null)

    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight
        }
    }, [logs])

    const activeStep = STEP_MAP[status] || null
    const stepOrder = STEPS.map(s => s.id)
    const activeIdx = stepOrder.indexOf(activeStep)

    const circumference = 163.36
    const dashOffset = circumference * (1 - progress)
    const isComplete = status === 'complete'
    const isRunning = !['idle', 'complete', 'error', 'ended'].includes(status)

    // Build dynamic vendor step description
    const lastLog = logs[logs.length - 1]
    const vendorDesc = (status === 'evaluating_vendors' || status === 're_evaluating') && lastLog?.vendor
        ? `Processing: ${lastLog.vendor} (${lastLog.vendors_completed}/${lastLog.vendors_total})`
        : 'Parse, audit, and score each vendor'

    return (
        <>
            <div className="view-header">
                <div>
                    <h1 className="view-title">Live Pipeline</h1>
                    <p className="view-subtitle">
                        {isComplete ? 'Pipeline complete!' : status === 'awaiting_review' ? 'Awaiting manager review' : isRunning ? 'Evaluating vendors...' : 'Waiting to start...'}
                    </p>
                </div>
                <div className="progress-ring">
                    <svg viewBox="0 0 60 60">
                        <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                        <circle cx="30" cy="30" r="26" fill="none" stroke="url(#pg)" strokeWidth="4"
                            strokeDasharray={circumference} strokeDashoffset={dashOffset}
                            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                        <defs><linearGradient id="pg"><stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#8b5cf6" /></linearGradient></defs>
                    </svg>
                    <span className="progress-pct">{Math.round(progress * 100)}%</span>
                </div>
            </div>

            {/* Pipeline Steps */}
            <div className="pipeline-steps">
                {STEPS.map((step, idx) => {
                    let iconClass = 'step-pending'
                    let iconContent = (idx + 1).toString()

                    if (isComplete || (activeIdx >= 0 && idx < activeIdx)) {
                        iconClass = 'step-complete'
                        iconContent = '✓'
                    } else if (idx === activeIdx) {
                        iconClass = 'step-active'
                    }

                    return (
                        <div className="pipeline-step" key={step.id}>
                            <div className={`step-icon ${iconClass}`}>{iconContent}</div>
                            <div>
                                <div className="step-name">{step.name}</div>
                                <div className="step-desc">{step.id === 'vendors' ? vendorDesc : step.desc}</div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Log */}
            <div className="card">
                <div className="card-header">
                    <h3>Agent Activity Log</h3>
                    <div className={`live-badge ${isComplete ? 'complete' : ''}`}>
                        {isComplete ? 'COMPLETE' : <><span className="live-dot" />LIVE</>}
                    </div>
                </div>
                <div className="log-container" ref={logRef}>
                    {logs.length === 0 ? (
                        <div className="log-empty">Waiting for pipeline to start...</div>
                    ) : (
                        logs.map((log, i) => {
                            const elapsed = logStartTime ? ((log.timestamp * 1000 - logStartTime) / 1000).toFixed(1) : '0.0'
                            return (
                                <div className="log-entry" key={i}>
                                    <span className="log-time">{elapsed}s</span>
                                    <span className={`log-msg ${log.level ? `log-${log.level}` : ''}`}>
                                        {log.message || log.status || ''}
                                    </span>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </>
    )
}
