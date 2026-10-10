import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRightToBracket,
  faBars,
  faBug,
  faChartLine,
  faCircleCheck,
  faDiagramProject,
  faFlaskVial,
  faFolderOpen,
  faGaugeHigh,
  faListCheck,
  faPlay,
  faRightFromBracket,
  faShieldHalved,
  faTriangleExclamation,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
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

const SESSION_KEY = 'qassure.session'
type View = 'overview' | 'projects' | 'requirements' | 'risks' | 'testCases' | 'testRuns' | 'defects' | 'traceability' | 'reports' | 'validation'

type NavigationItem = {
  view: View
  label: string
  icon: IconDefinition
}

const navigation: NavigationItem[] = [
  { view: 'overview', label: 'Inicio', icon: faGaugeHigh },
  { view: 'projects', label: 'Proyectos QA', icon: faFolderOpen },
  { view: 'requirements', label: 'Requisitos', icon: faListCheck },
  { view: 'risks', label: 'Análisis de riesgos', icon: faTriangleExclamation },
  { view: 'testCases', label: 'Casos de prueba', icon: faFlaskVial },
  { view: 'testRuns', label: 'Ciclos de prueba', icon: faPlay },
  { view: 'defects', label: 'Defectos', icon: faBug },
  { view: 'traceability', label: 'Trazabilidad', icon: faDiagramProject },
  { view: 'reports', label: 'Reporte de calidad', icon: faChartLine },
  { view: 'validation', label: 'Validación final', icon: faShieldHalved },
]

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
          <span><FontAwesomeIcon icon={faCircleCheck} /> Pruebas basadas en riesgos</span>
          <span><FontAwesomeIcon icon={faCircleCheck} /> Ciclo de defectos y re-pruebas</span>
          <span><FontAwesomeIcon icon={faCircleCheck} /> Trazabilidad bidireccional</span>
          <span><FontAwesomeIcon icon={faCircleCheck} /> Puertas de calidad</span>
          <span><FontAwesomeIcon icon={faCircleCheck} /> Validación final</span>
        </div>
      </section>

      <form className="loginCard" onSubmit={submit}>
        <div className="loginHeading">
          <span className="loginIcon"><FontAwesomeIcon icon={faShieldHalved} /></span>
          <div>
            <p className="eyebrow">QASSURE 1.0 RC</p>
            <h2>Bienvenido de nuevo</h2>
            <p className="muted">ISO-410 · Centro integral de QA</p>
          </div>
        </div>
        <label>Correo electrónico<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required autoComplete="username" /></label>
        <label>Contraseña<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required autoComplete="current-password" /></label>
        {error && <p className="errorBox">{error}</p>}
        <button className="primary full loginAction" disabled={busy}>
          <FontAwesomeIcon icon={faArrowRightToBracket} />
          {busy ? 'Iniciando sesión…' : 'Entrar a QAssure'}
        </button>
        <small className="muted">Administrador local: admin@qassure.local</small>
      </form>
    </main>
  )
}

function Workspace({ session, onLogout }: { session: AuthSession; onLogout: () => void }) {
  const [view, setView] = useState<View>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
  const currentNav = navigation.find((item) => item.view === view) ?? navigation[0]

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

  useEffect(() => {
    if (!sidebarOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [sidebarOpen])

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

  function navigate(next: View) {
    setView(next)
    setSidebarOpen(false)
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
      <header className="mobileTopbar">
        <button className="mobileMenuButton" onClick={() => setSidebarOpen(true)} aria-label="Abrir navegación">
          <FontAwesomeIcon icon={faBars} />
        </button>
        <button className="mobileBrand" onClick={() => navigate('overview')} aria-label="Ir al inicio">
          <span className="brandMark">Q✓</span>
          <span><strong>QAssure</strong><small>{currentNav.label}</small></span>
        </button>
        <span className="mobileAvatar" aria-label={userName}>{userName.slice(0, 1).toUpperCase()}</span>
      </header>

      {sidebarOpen && <button className="sidebarBackdrop" onClick={() => setSidebarOpen(false)} aria-label="Cerrar navegación" />}

      <aside className={`sidebar ${sidebarOpen ? 'sidebarOpen' : ''}`}>
        <div className="sidebarBrandRow">
          <button className="brand brandButton" onClick={() => navigate('overview')} aria-label="Ir al panel principal">
            <span className="brandMark">Q✓</span>
            <div><strong>QAssure</strong><small>Quality Assurance</small></div>
          </button>
          <button className="mobileSidebarClose" onClick={() => setSidebarOpen(false)} aria-label="Cerrar navegación">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <nav aria-label="Módulos de QAssure">
          {navigation.map((item) => (
            <Nav
              key={item.view}
              label={item.label}
              icon={item.icon}
              active={view === item.view}
              onClick={() => navigate(item.view)}
            />
          ))}
        </nav>

        <div className="sidebarQualityHint">
          <FontAwesomeIcon icon={faShieldHalved} />
          <div><strong>QA Command Center</strong><small>7 fases · ciclo completo</small></div>
        </div>

        <div className="userCard">
          <span className="avatar">{userName.slice(0, 1).toUpperCase()}</span>
          <div><strong>{userName}</strong><small>{labelEs(session.user.role)}</small></div>
          <button onClick={onLogout} title="Cerrar sesión" aria-label="Cerrar sesión"><FontAwesomeIcon icon={faRightFromBracket} /></button>
        </div>
      </aside>

      <main className="content">
        {view !== 'overview' && (
          <header className="contentHeader">
            <div className="contentTitleGroup">
              <span className="contentTitleIcon"><FontAwesomeIcon icon={currentNav.icon} /></span>
              <div><p className="eyebrow">ISO-410 · {phaseByView[view]}</p><h2>{titles[view]}</h2></div>
            </div>
            <span className="phaseBadge"><FontAwesomeIcon icon={faShieldHalved} /> Verifica · Valida · Asegura</span>
          </header>
        )}

        {message && <div className="notice">{message}</div>}
        {loading && <div className="notice loadingNotice"><FontAwesomeIcon icon={faGaugeHigh} /> Cargando espacio de trabajo de QA…</div>}

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
            onNavigate={(target) => navigate(target)}
          />
        )}
        {view === 'projects' && (
          <ProjectsPanel
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelect={(id) => { setSelectedProjectId(id); navigate('requirements') }}
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

function Nav({ label, icon, active, onClick }: { label: string; icon: IconDefinition; active: boolean; onClick: () => void }) {
  return (
    <button className={active ? 'navActive' : ''} onClick={onClick} aria-current={active ? 'page' : undefined}>
      <span className="navIcon"><FontAwesomeIcon icon={icon} /></span>
      <span className="navLabel">{label}</span>
      {active && <span className="navActiveMarker" />}
    </button>
  )
}
