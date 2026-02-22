import { create } from 'zustand'

const useStore = create((set, get) => ({
    // Navigation
    view: 'dashboard',
    setView: (view) => set({ view }),

    // System
    systemInfo: null,
    setSystemInfo: (info) => set({ systemInfo: info }),

    // Evaluation
    evalId: null,
    pipelineStatus: 'idle', // idle | running | awaiting_review | complete | error
    logs: [],
    rankings: null,
    requirements: null,
    progress: 0,
    logStartTime: null,
    eventSource: null,
    priorities: { technical: 40, compliance: 30, price: 30 },

    setPriorities: (p) => set({ priorities: p }),

    // Toast
    toasts: [],
    showToast: (message, type = 'info') => {
        const id = Date.now()
        set(s => ({ toasts: [...s.toasts, { id, message, type }] }))
        setTimeout(() => {
            set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
        }, 4000)
    },

    // Actions
    loadSystemInfo: async () => {
        try {
            const res = await fetch('/api/system/info')
            const data = await res.json()
            set({ systemInfo: data })
        } catch (e) { console.error(e) }
    },

    startEvaluation: async () => {
        const { showToast, connectSSE, priorities } = get()
        try {
            const res = await fetch('/api/evaluate/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priorities }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.detail || 'Failed')

            set({
                evalId: data.eval_id,
                logs: [],
                rankings: null,
                pipelineStatus: 'running',
                progress: 0,
                logStartTime: Date.now(),
                view: 'pipeline',
            })

            showToast(`Pipeline started (${data.eval_id})`)
            connectSSE(data.eval_id)
        } catch (e) {
            showToast(`Error: ${e.message}`, 'error')
        }
    },

    connectSSE: (evalId) => {
        const prev = get().eventSource
        if (prev) prev.close()

        const es = new EventSource(`/api/evaluate/${evalId}/stream`)
        set({ eventSource: es })

        es.onmessage = (event) => {
            const msg = JSON.parse(event.data)
            get().handleSSE(msg, evalId, es)
        }
        es.onerror = () => {
            es.close()
            set({ eventSource: null })
        }
    },

    handleSSE: (msg, evalId, es) => {
        set(s => ({ logs: [...s.logs, msg] }))

        // Progress
        const vt = msg.vendors_total || 0
        const vc = msg.vendors_completed || 0
        if (vt > 0) {
            let p = 0
            switch (msg.status) {
                case 'parsing_requirements': p = 0.08; break
                case 'evaluating_vendors': p = 0.1 + (vc / vt) * 0.6; break
                case 're_evaluating': p = 0.1 + (vc / vt) * 0.6; break
                case 'generating_report': p = 0.78; break
                case 'awaiting_review': p = 0.88; break
                case 'complete': p = 1.0; break
            }
            set({ progress: p })
        }

        set({ pipelineStatus: msg.status || 'running' })

        // Capture rankings whenever they appear in SSE data
        if (msg.data?.rankings) {
            set({ rankings: msg.data.rankings })
        }

        // Navigate to Review when pipeline reaches HITL step
        if (msg.status === 'awaiting_review') {
            const currentRankings = get().rankings
            if (currentRankings && currentRankings.length > 0) {
                set({ view: 'review' })
                get().showToast('🔔 Evaluation complete — your review is needed!', 'warning')
            } else {
                // Fallback: fetch rankings from status endpoint
                fetch(`/api/evaluate/${evalId}/status`)
                    .then(r => r.json())
                    .then(d => {
                        if (d.rankings) {
                            set({ rankings: d.rankings, view: 'review' })
                            get().showToast('🔔 Evaluation complete — your review is needed!', 'warning')
                        }
                    })
            }
        }

        if (msg.status === 'complete' || msg.level === 'complete') {
            set({ progress: 1, pipelineStatus: 'complete' })
            es.close()
            set({ eventSource: null })
            fetch(`/api/evaluate/${evalId}/status`)
                .then(r => r.json())
                .then(d => {
                    if (d.rankings) set({ rankings: d.rankings, view: 'results' })
                })
        }
    },

    submitReview: async (action, feedback) => {
        const { evalId, showToast, connectSSE, rankings } = get()
        if (!evalId) return
        try {
            const res = await fetch(`/api/evaluate/${evalId}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, feedback: action === 'feedback' ? feedback : null }),
            })
            if (!res.ok) throw new Error('Failed')

            if (action === 'approve') {
                showToast('✅ Rankings approved!')
                set({ view: 'results' })

                // Auto-save to Firestore
                try {
                    const { default: useAuthStore } = await import('./authStore')
                    const saveReport = useAuthStore.getState().saveReport
                    const statusRes = await fetch(`/api/evaluate/${evalId}/status`)
                    const statusData = await statusRes.json()
                    const docId = await saveReport({
                        rankings: statusData.rankings || rankings,
                        requirements: statusData.requirements || {},
                        report: statusData.report || '',
                        status: 'approved',
                    })
                    if (docId) showToast('📁 Report saved to cloud', 'success')
                } catch (fe) {
                    console.warn('Firebase save skipped:', fe)
                }
            } else {
                showToast(`Re-evaluating: "${feedback}"`)
                set({
                    logs: [], pipelineStatus: 'running', progress: 0,
                    logStartTime: Date.now(), rankings: null, view: 'pipeline',
                })
                connectSSE(evalId)
            }
        } catch (e) {
            showToast(`Error: ${e.message}`, 'error')
        }
    },
}))

export default useStore
