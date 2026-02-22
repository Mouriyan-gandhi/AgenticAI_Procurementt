import { useEffect, useState } from 'react'

export default function Toast({ message, type = 'info' }) {
    const [hiding, setHiding] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setHiding(true), 3700)
        return () => clearTimeout(timer)
    }, [])

    const colors = {
        info: 'var(--blue)',
        success: 'var(--green)',
        warning: 'var(--amber)',
        error: 'var(--red)',
    }

    return (
        <div className={`toast ${hiding ? 'hiding' : ''}`} style={{ borderLeft: `3px solid ${colors[type]}` }}>
            {message}
        </div>
    )
}
