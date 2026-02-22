import { motion } from 'framer-motion'
import useAuthStore from '../store/authStore'
import './Login.css'

export default function Login() {
    const { signInWithGoogle, authError } = useAuthStore()

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
    }

    return (
        <div className="landing-page">
            {/* Top Navigation */}
            <nav className="landing-nav">
                <div className="landing-logo">
                    <div className="icon">🧠</div>
                    <span>Agentic<span style={{ color: '#60A5FA' }}>Procure</span></span>
                </div>
                <div>
                    <button onClick={signInWithGoogle} className="btn-nav-signin">
                        Sign In
                    </button>
                </div>
            </nav>

            {/* Background Effects */}
            <div className="glow-bg" />

            {/* Auth Error Notification */}
            {authError && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="auth-error">
                    {authError}
                </motion.div>
            )}

            {/* Hero Section */}
            <main className="landing-hero">
                <motion.div variants={containerVariants} initial="hidden" animate="visible">
                    <motion.div variants={itemVariants} className="hero-badge">
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#60A5FA', display: 'inline-block' }} />
                        Enterprise Vendor Evaluation Engine
                    </motion.div>

                    <motion.h1 variants={itemVariants} className="hero-title">
                        Procurement Intelligence<br />Powered by AI Agents
                    </motion.h1>

                    <motion.p variants={itemVariants} className="hero-subtitle">
                        Automate vendor evaluations, compliance checks, and pricing analysis in minutes. Actionable insights driven by multi-agent reasoning, built for modern finance teams.
                    </motion.p>

                    <motion.div variants={itemVariants} className="hero-cta">
                        <button onClick={signInWithGoogle} className="btn-g-signin">
                            <svg width="24" height="24" viewBox="0 0 48 48">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                            </svg>
                            Continue with Google
                        </button>
                    </motion.div>
                </motion.div>
            </main>

            {/* Dashboard Mockup Visual */}
            <div className="mockup-container">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
                    className="mockup-frame"
                >
                    <div className="mockup-inner">
                        <div className="mockup-header">
                            <div className="mockup-dot" style={{ background: '#EF4444' }} />
                            <div className="mockup-dot" style={{ background: '#F59E0B' }} />
                            <div className="mockup-dot" style={{ background: '#10B981' }} />
                        </div>
                        <div className="mockup-body">
                            <div className="mockup-sidebar">
                                <div className="mockup-line" style={{ width: '80%', marginBottom: 16 }} />
                                <div className="mockup-line" style={{ width: '100%' }} />
                                <div className="mockup-line" style={{ width: '90%' }} />
                                <div className="mockup-line" style={{ width: '95%' }} />
                            </div>
                            <div className="mockup-content">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                                    <div className="mockup-card" />
                                    <div className="mockup-card" />
                                    <div className="mockup-card" />
                                </div>
                                <div className="mockup-card" style={{ height: 200 }} />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Features Section */}
            <section className="features-section">
                <div style={{ textAlign: 'center', marginBottom: 60 }}>
                    <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16 }}>Multi-Agent Workflow</h2>
                    <p style={{ color: '#94A3B8', fontSize: 18, maxWidth: 600, margin: '0 auto' }}>Specialized AI agents working continuously to evaluate, verify, and score every detail.</p>
                </div>

                <div className="features-grid">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="feature-card">
                        <div className="f-icon">📚</div>
                        <h3 className="f-title">AI Librarian</h3>
                        <p className="f-desc">Extracts structured clauses and key requirements from complex RFPs, NDAs, and vendor proposals instantly.</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="feature-card">
                        <div className="f-icon">⚙️</div>
                        <h3 className="f-title">Lead Engineer</h3>
                        <p className="f-desc">Performs deep technical assessments, ensuring proposed materials and architectures meet strict standards.</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="feature-card">
                        <div className="f-icon">⚖️</div>
                        <h3 className="f-title">Compliance Officer</h3>
                        <p className="f-desc">Audits certifications, SLA terms, and compliance frameworks automatically against your internal risk policies.</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="feature-card">
                        <div className="f-icon">📊</div>
                        <h3 className="f-title">Dynamic Scorer</h3>
                        <p className="f-desc">Calculates multidimensional rankings based on Technical, Financial, and Risk vertices customized to your weights.</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="feature-card">
                        <div className="f-icon">⚡</div>
                        <h3 className="f-title">Live Intelligence</h3>
                        <p className="f-desc">Monitor evaluations in real-time through SSE streams with 100% visibility into the AI's reasoning chain.</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="feature-card">
                        <div className="f-icon">🤝</div>
                        <h3 className="f-title">Human-in-the-Loop</h3>
                        <p className="f-desc">Maintain ultimate control with mandatory managerial sign-offs, feedback loops, and dynamic re-evaluations.</p>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div style={{ marginBottom: 16 }}>
                    <div className="icon" style={{ display: 'inline-block', fontSize: 24 }}>🧠</div>
                </div>
                <div>&copy; {new Date().getFullYear()} AgenticProcure Systems. All rights reserved.</div>
                <div style={{ marginTop: 8 }}>Secured by Google Cloud & Firebase.</div>
            </footer>
        </div>
    )
}
