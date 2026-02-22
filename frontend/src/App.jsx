import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import './index.css'
import useStore from './store/evaluationStore'
import useAuthStore from './store/authStore'
import Topbar from './components/layout/Topbar'
import Sidebar from './components/layout/Sidebar'
import Dashboard from './pages/Dashboard'
import Pipeline from './pages/Pipeline'
import Results from './pages/Results'
import Review from './pages/Review'
import NewEvaluation from './pages/NewEvaluation'
import Login from './pages/Login'

const views = { dashboard: Dashboard, new: NewEvaluation, pipeline: Pipeline, results: Results, review: Review }

export default function App() {
  const { view, toasts, loadSystemInfo } = useStore()
  const { user, authLoading, initAuth } = useAuthStore()

  useEffect(() => { initAuth() }, [])
  useEffect(() => { if (user) loadSystemInfo() }, [user])

  const colors = { info: 'var(--color-primary)', success: 'var(--color-success)', warning: 'var(--color-warning)', error: 'var(--color-danger)' }

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0f4ff 0%, #e8ecf8 50%, #dfe6f6 100%)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spin" style={{ width: 32, height: 32, margin: '0 auto 12px' }} />
          <div style={{ fontSize: 13, color: '#64748b' }}>Loading...</div>
        </div>
      </div>
    )
  }

  // Show login if not authenticated
  if (!user) {
    return <Login />
  }

  const Page = views[view] || Dashboard

  return (
    <div className="app-shell">
      <Topbar />
      <div className="app-body">
        <Sidebar />
        <main className="workspace">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Page />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <div className="toast-stack">
        {toasts.map(t => (
          <div key={t.id} className="toast-item" style={{ borderLeft: `3px solid ${colors[t.type]}` }}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}
