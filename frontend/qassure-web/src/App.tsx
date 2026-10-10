import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { createProject, getProjects, getRequirements, getRisks, getTestCases, login } from './api'
import type { AuthSession, Project, Requirement, RiskItem, TestCase } from './api'
import TestRunsPanel from './TestRunsPanel'
import DefectsPanel from './DefectsPanel'
import TraceabilityPanel from './TraceabilityPanel'
import ReportsPanel from './ReportsPanel'
import ValidationPanel from './ValidationPanel'
import QaDashboard from './QaDashboard'
import { ProjectsPanel, RequirementsPanel, RisksPanel, TestCasesPanel } from './CorePanels'
import { displayNameEs, errorMessageEs, labelEs } from './locale'
import './final.css'
import './mockup.css'

const SESSION_KEY = 'qassure.session'
type View = 'overview' | 'projects' | 'requirements' | 'risks' | 'testCases' | 'testRuns' | 'defects' | 'traceability' | 'reports' | 'validation'

function readSession(): AuthSession | null {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() => readSession())

  if (!session) {
    return (
      <LoginScreen
        onAuthenticated={(value) => {
          localStorage.setItem(SESSION_KEY, JSON.stringify(value))
          setSession(value)
        }}
      />
    )
  }

  return (
    <Workspace
      session={session}
      onLogout={() => {
        localStorage.removeItem(SESSION_KEY)
        setSession(null)
      }}
    />
  )
}

function LoginScreen({ onAuthenticated }: { onAuthenticated: (session: AuthSession) => void }) {
  const [email, setEmail] = useState('admin@qassure.local')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      onAuthenticated(await login(email, password))
    } catch (reason) {
      setError(errorMessageEs(reason, 'No se pudo iniciar sesión.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="authShell">
      <section className="authBrand">
        <span className="brandMark brandMarkLarge">Q✓</span>
        <p className="eyebrow">ASEGURAMIENTO DE CALIDAD DE SOFTWARE</p>
        <h1>Verifica. Valida. Asegura.</h1>
        <p>Planifica, ejecuta, traza y demuestra la calidad del software desde los requisitos hasta la preparación para el lanzamiento.</p>
        <div className="authSignals">
          <span>✓ Pruebas basadas en riesgos</span>
          <span>✓ Ciclo de defectos y re-pruebas</span>
          <span>✓ Trazabilidad bidireccional</span>
          <span>✓ Puertas de calidad</span>
          <span>✓ Validación final</span>
        </div>
      </section>

      <form className="loginCard" onSubmit={submit}>
        <div>
          <p className="eyebrow">QASSURE 1.0 RC</p>
          <h2>Bienvenido de nuevo</h2>
          <p className="muted">ISO-410 · Centro integral de QA</p>
        </div>
        <label>Correo electrónico<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required /></label>
        <label>Contraseña<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required /></label>
        {error && <p className="errorBox">{error}</p>}
        <button className="primary full" disabled={busy}>{busy ? 'Iniciando sesión…' : 'Entrar a QAssure'}</button>
        <small className="muted">Administrador local: admin@qassure.local</small>
      </form>
    </main>
  )
}

function Workspace({ session, onLogout }: { session: AuthSession; onLogout: () => void }) {
  const [view, setView] = useState<View>('overview')
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [risks, setRisks] = useState<RiskItem[]>([])
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const selectedProject = useMemo(
    () => projects.find((item) => item.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  )
  const canLead = session.user.role === 'Admin' || session.user.role === 'QaLead'
  const userName = displayNameEs(session.user.displayName)

  useEffect(() => { void loadProjects() }, [])
  useEffect(() => {
    if (!selectedProjectId) {
      setRequirements([])
      setRisks([])
      setTestCases([])
      return
    }
    void loadProjectData(selectedProjectId)
  }, [selectedProjectId])

  async function loadProjects() {
    setLoading(true)
    try {
      const data = await getProjects(session.accessToken)
      setProjects(data)
      if (!selectedProjectId && data.length) setSelectedProjectId(data[0].id)
    } catch (reason) {
      setMessage(errorMessageEs(reason, 'No se pudieron cargar los proyectos.'))
    } finally {
      setLoading(false)
    }
  }

  async function loadProjectData(projectId: string) {
    try {
      const [nextRequirements, nextRisks, nextCases] = await Promise.all([
        getRequirements(session.accessToken, projectId),
        getRisks(session.accessToken, projectId),
        getTestCases(session.accessToken, projectId),
      ])
      setRequirements(nextRequirements)
      setRisks(nextRisks)
      setTestCases(nextCases)
    } catch (reason) {
      setMessage(errorMessageEs(reason, 'No se pudieron cargar los datos de QA del proyecto.'))
    }
  }

  const titles: Record<View, string> = {
    overview: 'Centro de control de calidad',
    projects: 'Proyectos de QA',
    requirements: 'Requisitos',
    risks: 'Análisis de riesgos',
    testCases: 'Casos de prueba',
    testRuns: 'Ciclos y ejecución de pruebas',
    defects: 'Defectos y re-pruebas',
    traceability: 'Matriz de trazabilidad',
    reports: 'Informe y puertas de calidad',
    validation: 'Validación final',
  }

  const phaseByView: Record<View, string> = {
    overview: 'CANDIDATO A LANZAMIENTO',
    projects: 'FASE 1',
    requirements: 'FASE 1',
    risks: 'FASE 2',
    testCases: 'FASE 2',
    testRuns: 'FASE 3',
    defects: 'FASE 4',
    traceability: 'FASE 5',
    reports: 'FASE 6',
    validation: 'FASE 7',
  }

  return (
    <div className="workspace">
      <aside className="sidebar">
        <button className="brand brandButton" onClick={() => setView('overview')} aria-label="Ir al panel principal">
          <span className="brandMark">Q✓</span>
          <div><strong>QAssure</strong><small>Quality Assurance</small></div>
        </button>
        <nav aria-label="Módulos de QAssure">
          <Nav label="Inicio" active={view === 'overview'} onClick={() => setView('overview')} />
          <Nav label="Proyectos QA" active={view === 'projects'} onClick={() => setView('projects')} />
          <Nav label="Requisitos" active={view === 'requirements'} onClick={() => setView('requirements')} />
          <Nav label="Análisis de riesgos" active={view === 'risks'} onClick={() => setView('risks')} />
          <Nav label="Casos de prueba" active={view === 'testCases'} onClick={() => setView('testCases')} />
          <Nav label="Ciclos de prueba" active={view === 'testRuns'} onClick={() => setView('testRuns')} />
          <Nav label="Defectos" active={view === 'defects'} onClick={() => setView('defects')} />
          <Nav label="Trazabilidad" active={view === 'traceability'} onClick={() => setView('traceability')} />
          <Nav label="Reporte de calidad" active={view === 'reports'} onClick={() => setView('reports')} />
          <Nav label="Validación final" active={view === 'validation'} onClick={() => setView('validation')} />
        </nav>
        <div className="userCard">
          <span className="avatar">{userName.slice(0, 1).toUpperCase()}</span>
          <div><strong>{userName}</strong><small>{labelEs(session.user.role)}</small></div>
          <button onClick={onLogout} title="Cerrar sesión">↗</button>
        </div>
      </aside>

      <main className="content">
        {view !== 'overview' && (
          <header className="contentHeader">
            <div><p className="eyebrow">ISO-410 · {phaseByView[view]}</p><h2>{titles[view]}</h2></div>
            <span className="phaseBadge">Verifica · Valida · Asegura</span>
          </header>
        )}

        {message && <div className="notice">{message}</div>}
        {loading && <div className="notice">Cargando espacio de trabajo de QA…</div>}

        {view === 'overview' && (
          <QaDashboard
            token={session.accessToken}
            projects={projects}
            selectedProject={selectedProject}
            selectedProjectId={selectedProjectId}
            requirements={requirements}
            risks={risks}
            testCases={testCases}
            onProjectChange={setSelectedProjectId}
            onNavigate={(target) => setView(target)}
          />
        )}
        {view === 'projects' && (
          <ProjectsPanel
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelect={(id) => { setSelectedProjectId(id); setView('requirements') }}
            onCreated={async (payload) => {
              try {
                const item = await createProject(session.accessToken, payload)
                setProjects((current) => [...current, item])
                setSelectedProjectId(item.id)
                setMessage(`Proyecto ${item.key} creado.`)
              } catch (reason) {
                setMessage(errorMessageEs(reason, 'No se pudo crear el proyecto.'))
              }
            }}
          />
        )}
        {view === 'requirements' && <RequirementsPanel projects={projects} selectedProject={selectedProject} selectedProjectId={selectedProjectId} requirements={requirements} canLead={canLead} onProjectChange={setSelectedProjectId} onReload={() => loadProjectData(selectedProjectId)} token={session.accessToken} setMessage={setMessage} />}
        {view === 'risks' && <RisksPanel projects={projects} selectedProject={selectedProject} selectedProjectId={selectedProjectId} requirements={requirements} risks={risks} canLead={canLead} onProjectChange={setSelectedProjectId} onReload={() => loadProjectData(selectedProjectId)} token={session.accessToken} setMessage={setMessage} />}
        {view === 'testCases' && <TestCasesPanel projects={projects} selectedProject={selectedProject} selectedProjectId={selectedProjectId} requirements={requirements} risks={risks} testCases={testCases} onProjectChange={setSelectedProjectId} onReload={() => loadProjectData(selectedProjectId)} token={session.accessToken} setMessage={setMessage} />}
        {view === 'testRuns' && <TestRunsPanel token={session.accessToken} projects={projects} selectedProject={selectedProject} selectedProjectId={selectedProjectId} testCases={testCases} canLead={canLead} onProjectChange={setSelectedProjectId} />}
        {view === 'defects' && <DefectsPanel token={session.accessToken} projects={projects} selectedProject={selectedProject} selectedProjectId={selectedProjectId} canLead={canLead} onProjectChange={setSelectedProjectId} />}
        {view === 'traceability' && <TraceabilityPanel token={session.accessToken} projects={projects} selectedProject={selectedProject} selectedProjectId={selectedProjectId} onProjectChange={setSelectedProjectId} />}
        {view === 'reports' && <ReportsPanel token={session.accessToken} projects={projects} selectedProject={selectedProject} selectedProjectId={selectedProjectId} onProjectChange={setSelectedProjectId} />}
        {view === 'validation' && <ValidationPanel token={session.accessToken} projects={projects} selectedProject={selectedProject} selectedProjectId={selectedProjectId} canLead={canLead} onProjectChange={setSelectedProjectId} />}
      </main>
    </div>
  )
}

function Nav({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button className={active ? 'navActive' : ''} onClick={onClick}>{label}</button>
}
