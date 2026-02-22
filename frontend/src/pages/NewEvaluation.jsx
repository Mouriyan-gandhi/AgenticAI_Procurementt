import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import useStore from '../store/evaluationStore'

const fade = (d = 0) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: d, duration: 0.25 } })

export default function NewEvaluation() {
    const { systemInfo, priorities, setPriorities, startEvaluation, pipelineStatus, loadSystemInfo, showToast } = useStore()
    const vendors = systemInfo?.vendors || []
    const busy = !['idle', 'complete', 'error'].includes(pipelineStatus)

    const [reqDrag, setReqDrag] = useState(false)
    const [venDrag, setVenDrag] = useState(false)
    const [uploading, setUploading] = useState(null) // 'req' | 'ven' | null
    const reqRef = useRef(null)
    const venRef = useRef(null)

    const upload = async (file, type) => {
        if (!file?.name.toLowerCase().endsWith('.pdf')) { showToast('PDF files only', 'error'); return }
        setUploading(type)
        try {
            const fd = new FormData(); fd.append('file', file)
            const url = type === 'req' ? '/api/upload/requirements' : '/api/upload/vendor'
            const r = await fetch(url, { method: 'POST', body: fd })
            if (!r.ok) throw new Error()
            showToast(`✓ ${file.name} uploaded`, 'success')
            await loadSystemInfo()
        } catch { showToast('Upload failed', 'error') }
        setUploading(null)
    }

    const uploadMulti = async (files) => {
        for (const f of files) await upload(f, 'ven')
    }

    const drop = (e, type) => {
        e.preventDefault(); setReqDrag(false); setVenDrag(false)
        const files = Array.from(e.dataTransfer.files)
        type === 'req' ? upload(files[0], 'req') : uploadMulti(files)
    }

    const delVendor = async (filename) => {
        await fetch(`/api/upload/vendor/${filename}`, { method: 'DELETE' })
        showToast(`Removed ${filename}`, 'info'); await loadSystemInfo()
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">New Vendor Evaluation</h1>
                <p className="page-subtitle">Upload documents, configure priorities, launch</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, maxWidth: 860 }}>
                {/* Requirements */}
                <motion.div {...fade(0.03)}>
                    <div className="card">
                        <div className="card-header"><span className="section-title">Company Requirements</span></div>
                        <div className="card-body">
                            {uploading === 'req' ? (
                                <div className="drop-zone" style={{ pointerEvents: 'none' }}>
                                    <div className="spin" style={{ margin: '0 auto 8px' }} />
                                    <div style={{ fontSize: 12, color: 'var(--color-text-dim)' }}>Uploading…</div>
                                </div>
                            ) : systemInfo?.has_requirements ? (
                                <div className={`drop-zone filled ${reqDrag ? 'over' : ''}`}
                                    onClick={() => reqRef.current?.click()}
                                    onDrop={e => drop(e, 'req')} onDragOver={e => { e.preventDefault(); setReqDrag(true) }} onDragLeave={() => setReqDrag(false)}>
                                    <div style={{ fontSize: 24, marginBottom: 6 }}>📄</div>
                                    <div style={{ fontWeight: 600, fontSize: 13 }}>{systemInfo.requirements_file}</div>
                                    <div style={{ fontSize: 11, color: 'var(--color-success)', marginTop: 3 }}>✓ Loaded</div>
                                    <div style={{ fontSize: 10, color: 'var(--color-text-dim)', marginTop: 6 }}>
                                        {reqDrag ? '⬇ Drop to replace' : 'Click or drop to replace'}
                                    </div>
                                </div>
                            ) : (
                                <div className={`drop-zone ${reqDrag ? 'over' : ''}`}
                                    onClick={() => reqRef.current?.click()}
                                    onDrop={e => drop(e, 'req')} onDragOver={e => { e.preventDefault(); setReqDrag(true) }} onDragLeave={() => setReqDrag(false)}>
                                    <div style={{ fontSize: 28, marginBottom: 6 }}>📁</div>
                                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Drop PDF here</div>
                                    <div style={{ fontSize: 11, color: 'var(--color-text-dim)' }}>or click to browse</div>
                                </div>
                            )}
                            <input ref={reqRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) upload(e.target.files[0], 'req'); e.target.value = '' }} />
                        </div>
                    </div>
                </motion.div>

                {/* Vendors */}
                <motion.div {...fade(0.06)}>
                    <div className="card">
                        <div className="card-header">
                            <span className="section-title">Vendor Proposals</span>
                            {vendors.length > 0 && <span className="chip chip-info">{vendors.length}</span>}
                        </div>
                        <div className="card-body">
                            {vendors.map(v => (
                                <div className="file-chip" key={v.file}>
                                    <span style={{ fontSize: 16 }}>📋</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: 12 }}>{v.name}</div>
                                        <div style={{ fontSize: 10, color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>{v.file}</div>
                                    </div>
                                    <button className="file-chip-remove" onClick={() => delVendor(v.file)}>✕</button>
                                </div>
                            ))}
                            <div className={`drop-zone ${venDrag ? 'over' : ''}`}
                                onClick={() => venRef.current?.click()}
                                onDrop={e => drop(e, 'ven')} onDragOver={e => { e.preventDefault(); setVenDrag(true) }} onDragLeave={() => setVenDrag(false)}
                                style={{ padding: vendors.length > 0 ? 16 : 32, marginTop: vendors.length > 0 ? 6 : 0 }}>
                                {uploading === 'ven' ? <><div className="spin" style={{ margin: '0 auto 6px' }} /><div style={{ fontSize: 11, color: 'var(--color-text-dim)' }}>Uploading…</div></> : <>
                                    <div style={{ fontSize: vendors.length > 0 ? 16 : 24, marginBottom: 4 }}>➕</div>
                                    <div style={{ fontWeight: 600, fontSize: 12 }}>{vendors.length > 0 ? 'Add more' : 'Drop vendor PDFs here'}</div>
                                    <div style={{ fontSize: 10, color: 'var(--color-text-dim)' }}>Multiple files OK</div>
                                </>}
                            </div>
                            <input ref={venRef} type="file" accept=".pdf" multiple style={{ display: 'none' }} onChange={e => { if (e.target.files.length) uploadMulti(Array.from(e.target.files)); e.target.value = '' }} />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Priorities */}
            <motion.div {...fade(0.09)} style={{ marginTop: 14, maxWidth: 860 }}>
                <div className="card">
                    <div className="card-header">
                        <div>
                            <span className="section-title">Evaluation Priorities</span>
                            <div className="section-hint">Adjust scoring weights</div>
                        </div>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                            <Slider label="Technical" icon="🔧" value={priorities.technical} color="var(--color-primary)" onChange={v => setPriorities({ ...priorities, technical: +v })} />
                            <Slider label="Compliance" icon="🛡️" value={priorities.compliance} color="var(--color-success)" onChange={v => setPriorities({ ...priorities, compliance: +v })} />
                            <Slider label="Price" icon="💰" value={priorities.price} color="var(--color-warning)" onChange={v => setPriorities({ ...priorities, price: +v })} />
                        </div>
                    </div>
                    <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn btn-primary btn-lg" onClick={startEvaluation} disabled={busy || vendors.length === 0 || !systemInfo?.has_requirements}>
                            {busy ? <><div className="spin" /> Running…</> : <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" style={{ width: 14, height: 14 }}><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                Start AI Evaluation
                            </>}
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    )
}

function Slider({ label, icon, value, color, onChange }) {
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{icon} {label}</span>
                <span style={{ fontSize: 18, fontWeight: 800, color, fontFamily: 'var(--font-mono)' }}>{value}</span>
            </div>
            <input type="range" min="0" max="80" value={value} onChange={e => onChange(e.target.value)} className="slider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--color-text-dim)', marginTop: 3, letterSpacing: 0.3, textTransform: 'uppercase' }}>
                <span>Low</span><span>High</span>
            </div>
        </div>
    )
}
