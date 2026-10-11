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
readSafeSession()

type RecoveryState = {
  hasError: boolean
  errorMessage: string
}

class AppErrorBoundary extends Component<{ children: ReactNode }, RecoveryState> {
  state: RecoveryState = { hasError: false, errorMessage: '' }

  static getDerivedStateFromError(error: Error): RecoveryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Error de interfaz no identificado.',
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('QAssure UI error:', error, info)
  }

  private recover = () => {
    clearStoredSession()
    // Reset the boundary in-place instead of reloading the same broken tree.
    // App is remounted and reads a clean local session, returning to LoginScreen.
    this.setState({ hasError: false, errorMessage: '' })
  }

  private hardReload = () => {
    clearStoredSession()
    window.location.assign('/')
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="runtimeRecovery" role="alert">
        <img src="/qassure-logo.png" alt="QAssure" />
        <p>RECUPERACIÓN DE INTERFAZ</p>
        <h1>QAssure detectó un error de interfaz</h1>
        <span>La sesión local puede limpiarse sin afectar los datos almacenados en la API y SQL Server.</span>
        <code className="runtimeRecoveryError">{this.state.errorMessage}</code>
        <div className="runtimeRecoveryActions">
          <button type="button" onClick={this.recover}>Limpiar sesión y volver a entrar</button>
          <button type="button" className="secondary" onClick={this.hardReload}>Recargar aplicación</button>
        </div>
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
