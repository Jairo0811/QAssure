import { Component, StrictMode } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { clearStoredSession, readSafeSession } from './runtime-guard'
import './styles.css'
import './phase2.css'
import './mockup.css'
import './responsive.css'
import './brand.css'

// Sanitize stale/corrupt persisted sessions before App reads localStorage.
// This prevents a malformed legacy session from crashing the whole workspace.
readSafeSession()

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('QAssure UI error:', error, info)
  }

  private recover = () => {
    clearStoredSession()
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="runtimeRecovery" role="alert">
        <img src="/qassure-logo.png" alt="QAssure" />
        <p>RECUPERACIÓN DE INTERFAZ</p>
        <h1>QAssure necesita reiniciar la sesión local</h1>
        <span>Se detectó un estado del navegador incompatible con la versión actual. Tus datos del proyecto permanecen en la API y la base de datos.</span>
        <button type="button" onClick={this.recover}>Limpiar sesión y volver a entrar</button>
      </main>
    )
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
