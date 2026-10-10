import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  acceptRisk,
  approveRequirement,
  createProject,
  createRequirement,
  createRisk,
  createTestCase,
  getProjects,
  getRequirements,
  getRisks,
  getTestCases,
  login,
  markTestCaseReady,
  mitigateRisk,
} from './api'
import type { AuthSession, Project, Requirement, RiskItem, TestCase } from './api'
import TestRunsPanel from './TestRunsPanel'
import DefectsPanel from './DefectsPanel'
import TraceabilityPanel from './TraceabilityPanel'
import ReportsPanel from './ReportsPanel'
import ValidationPanel from './ValidationPanel'
import { displayNameEs, errorMessageEs, labelEs } from './locale'
import './final.css'

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
          <span>✓ Puertas de calidad</span>
          <span>✓ Validación final</span>
        </div>
      </section>

      <form className="loginCard" onSubmit={submit}>
        <div>
          <p className="eyebrow">QASSURE 1.0 RC</p>
          <h2>Bienvenido de nuevo</h2>
          <p className="muted">ISO-410 · Ciclo de vida completo de QA</p>
        </div>
        <label>
          Correo electrónico
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          Contraseña
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>
        {error && <p className="errorBox">{error}</p>}
        <button className="primary full" disabled={busy}>
          {busy ? 'Iniciando sesión…' : 'Entrar a QAssure'}
        </button>
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
    () => projects.find((x) => x.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  )
  const canLead = session.user.role === 'Admin' || session.user.role === 'QaLead'

  useEffect(() => {
    void loadProjects()
  }, [])

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
    overview: 'Panel de calidad',
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

  const userName = displayNameEs(session.user.displayName)

  return (
    <div className="workspace">
      <aside className="sidebar">
        <div className="brand">
          <span className="brandMark">Q✓</span>
          <div>
            <strong>QAssure</strong>
            <small>Aseguramiento de calidad</small>
          </div>
        </div>
        <nav>
          <Nav label="Resumen" active={view === 'overview'} onClick={() => setView('overview')} />
          <Nav label="Proyectos" active={view === 'projects'} onClick={() => setView('projects')} />
          <Nav label="Requisitos" active={view === 'requirements'} onClick={() => setView('requirements')} />
          <Nav label="Análisis de riesgos" active={view === 'risks'} onClick={() => setView('risks')} />
          <Nav label="Casos de prueba" active={view === 'testCases'} onClick={() => setView('testCases')} />
          <Nav label="Ciclos de prueba" active={view === 'testRuns'} onClick={() => setView('testRuns')} />
          <Nav label="Defectos" active={view === 'defects'} onClick={() => setView('defects')} />
          <Nav label="Trazabilidad" active={view === 'traceability'} onClick={() => setView('traceability')} />
          <Nav label="Informe de calidad" active={view === 'reports'} onClick={() => setView('reports')} />
          <Nav label="Validación final" active={view === 'validation'} onClick={() => setView('validation')} />
        </nav>
        <div className="userCard">
          <span className="avatar">{userName.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{userName}</strong>
            <small>{labelEs(session.user.role)}</small>
          </div>
          <button onClick={onLogout} title="Cerrar sesión">↗</button>
        </div>
      </aside>

      <main className="content">
        <header className="contentHeader">
          <div>
            <p className="eyebrow">ISO-410 · {phaseByView[view]}</p>
            <h2>{titles[view]}</h2>
          </div>
          <span className="phaseBadge">Verifica · Valida · Asegura</span>
        </header>

        {message && <div className="notice">{message}</div>}
        {loading && <div className="notice">Cargando espacio de trabajo de QA…</div>}

        {view === 'overview' && <Overview projects={projects} requirements={requirements} risks={risks} testCases={testCases} />}
        {view === 'projects' && (
          <ProjectsPanel
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelect={(id) => {
              setSelectedProjectId(id)
              setView('requirements')
            }}
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
        {view === 'requirements' && (
          <RequirementsPanel
            projects={projects}
            selectedProject={selectedProject}
            selectedProjectId={selectedProjectId}
            requirements={requirements}
            canLead={canLead}
            onProjectChange={setSelectedProjectId}
            onReload={() => loadProjectData(selectedProjectId)}
            token={session.accessToken}
            setMessage={setMessage}
          />
        )}
        {view === 'risks' && (
          <RisksPanel
            projects={projects}
            selectedProject={selectedProject}
            selectedProjectId={selectedProjectId}
            requirements={requirements}
            risks={risks}
            canLead={canLead}
            onProjectChange={setSelectedProjectId}
            onReload={() => loadProjectData(selectedProjectId)}
            token={session.accessToken}
            setMessage={setMessage}
          />
        )}
        {view === 'testCases' && (
          <TestCasesPanel
            projects={projects}
            selectedProject={selectedProject}
            selectedProjectId={selectedProjectId}
            requirements={requirements}
            risks={risks}
            testCases={testCases}
            onProjectChange={setSelectedProjectId}
            onReload={() => loadProjectData(selectedProjectId)}
            token={session.accessToken}
            setMessage={setMessage}
          />
        )}
        {view === 'testRuns' && (
          <TestRunsPanel
            token={session.accessToken}
            projects={projects}
            selectedProject={selectedProject}
            selectedProjectId={selectedProjectId}
            testCases={testCases}
            canLead={canLead}
            onProjectChange={setSelectedProjectId}
          />
        )}
        {view === 'defects' && (
          <DefectsPanel
            token={session.accessToken}
            projects={projects}
            selectedProject={selectedProject}
            selectedProjectId={selectedProjectId}
            canLead={canLead}
            onProjectChange={setSelectedProjectId}
          />
        )}
        {view === 'traceability' && (
          <TraceabilityPanel
            token={session.accessToken}
            projects={projects}
            selectedProject={selectedProject}
            selectedProjectId={selectedProjectId}
            onProjectChange={setSelectedProjectId}
          />
        )}
        {view === 'reports' && (
          <ReportsPanel
            token={session.accessToken}
            projects={projects}
            selectedProject={selectedProject}
            selectedProjectId={selectedProjectId}
            onProjectChange={setSelectedProjectId}
          />
        )}
        {view === 'validation' && (
          <ValidationPanel
            token={session.accessToken}
            projects={projects}
            selectedProject={selectedProject}
            selectedProjectId={selectedProjectId}
            canLead={canLead}
            onProjectChange={setSelectedProjectId}
          />
        )}
      </main>
    </div>
  )
}

function Nav({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button className={active ? 'navActive' : ''} onClick={onClick}>{label}</button>
}

function Overview({ projects, requirements, risks, testCases }: { projects: Project[]; requirements: Requirement[]; risks: RiskItem[]; testCases: TestCase[] }) {
  const covered = new Set(testCases.flatMap((item) => item.requirementId ? [item.requirementId] : []))
  const coverage = requirements.length ? Math.round(covered.size * 100 / requirements.length) : 0
  const cards: Array<[number | string, string]> = [
    [projects.length, 'Proyectos de QA'],
    [requirements.filter((item) => item.status === 'Approved').length, 'Requisitos aprobados'],
    [risks.filter((item) => item.level === 'Critical' && item.status === 'Open').length, 'Riesgos críticos abiertos'],
    [`${coverage}%`, 'Cobertura de requisitos'],
  ]
  const flow = ['Proyecto', 'Requisito', 'Riesgo', 'Caso de prueba', 'Ejecución', 'Validación']

  return (
    <>
      <section className="metricGrid">
        {cards.map(([value, label]) => (
          <article className="metricCard" key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </section>

      <section className="panel tracePanel">
        <div className="panelTitle">
          <div>
            <p className="eyebrow">CICLO DE VIDA COMPLETO DE QA</p>
            <h3>Del requisito a la puerta de lanzamiento</h3>
          </div>
          <span className="statusGood">● 7 fases implementadas</span>
        </div>
        <div className="flow">
          {flow.map((step) => (
            <div className="flowStep flowReady" key={step}>
              <span>✓</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="panel tracePanel">
        <div className="panelTitle">
          <h3>QAssure 1.0 RC</h3>
          <span>Verifica. Valida. Asegura.</span>
        </div>
        <p className="muted">Usa Defectos para cerrar re-pruebas, Trazabilidad para medir cobertura, Informe de calidad para las puertas de lanzamiento y Validación final para evidencias de seguridad, rendimiento, usabilidad y aceptación de usuario.</p>
      </section>
    </>
  )
}

function ProjectPicker({ projects, selectedProject, selectedProjectId, onProjectChange }: { projects: Project[]; selectedProject: Project | null; selectedProjectId: string; onProjectChange: (id: string) => void }) {
  return (
    <section className="projectPicker panel">
      <div>
        <p className="eyebrow">CONTEXTO DEL PROYECTO</p>
        <h3>{selectedProject?.name ?? 'Selecciona un proyecto'}</h3>
      </div>
      <select value={selectedProjectId} onChange={(e) => onProjectChange(e.target.value)}>
        {projects.map((project) => <option key={project.id} value={project.id}>{project.key} · {project.name}</option>)}
      </select>
    </section>
  )
}

function ProjectsPanel({ projects, selectedProjectId, onSelect, onCreated }: { projects: Project[]; selectedProjectId: string; onSelect: (id: string) => void; onCreated: (payload: { name: string; key: string; description: string; version: string; criticality: number }) => Promise<void> }) {
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [description, setDescription] = useState('')
  const [version, setVersion] = useState('1.0.0')
  const [criticality, setCriticality] = useState(2)

  async function submit(event: FormEvent) {
    event.preventDefault()
    await onCreated({ name, key, description, version, criticality })
    setName('')
    setKey('')
    setDescription('')
  }

  return (
    <section className="splitLayout">
      <div className="panel">
        <div className="panelTitle"><h3>Proyectos</h3><span>{projects.length}</span></div>
        <div className="itemList">
          {projects.map((project) => (
            <button key={project.id} className={`listItem ${project.id === selectedProjectId ? 'selected' : ''}`} onClick={() => onSelect(project.id)}>
              <span className="itemCode">{project.key}</span>
              <div><strong>{project.name}</strong><small>{project.version} · {labelEs(project.criticality)}</small></div>
              <span className={`pill ${project.status.toLowerCase()}`}>{labelEs(project.status)}</span>
            </button>
          ))}
          {!projects.length && <p className="empty">Todavía no hay proyectos de QA.</p>}
        </div>
      </div>

      <form className="panel formPanel" onSubmit={submit}>
        <div className="panelTitle"><h3>Crear proyecto de QA</h3></div>
        <label>Nombre<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
        <label>Clave del proyecto<input value={key} onChange={(e) => setKey(e.target.value)} placeholder="QA-410" required /></label>
        <label>Descripción<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} /></label>
        <div className="formRow">
          <label>Versión<input value={version} onChange={(e) => setVersion(e.target.value)} required /></label>
          <label>Criticidad<select value={criticality} onChange={(e) => setCriticality(Number(e.target.value))}><option value={1}>Baja</option><option value={2}>Media</option><option value={3}>Alta</option><option value={4}>Crítica</option></select></label>
        </div>
        <button className="primary">Crear proyecto</button>
      </form>
    </section>
  )
}

function RequirementsPanel({ projects, selectedProject, selectedProjectId, requirements, canLead, onProjectChange, onReload, token, setMessage }: { projects: Project[]; selectedProject: Project | null; selectedProjectId: string; requirements: Requirement[]; canLead: boolean; onProjectChange: (id: string) => void; onReload: () => Promise<void>; token: string; setMessage: (value: string) => void }) {
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [criteria, setCriteria] = useState('')
  const [type, setType] = useState(1)
  const [priority, setPriority] = useState(2)

  async function submit(event: FormEvent) {
    event.preventDefault()
    try {
      await createRequirement(token, selectedProjectId, { code, title, description, acceptanceCriteria: criteria, type, priority })
      setCode('')
      setTitle('')
      setDescription('')
      setCriteria('')
      setMessage('Requisito creado correctamente.')
      await onReload()
    } catch (reason) {
      setMessage(errorMessageEs(reason, 'No se pudo crear el requisito.'))
    }
  }

  if (!projects.length) return <Empty />

  return (
    <>
      <ProjectPicker projects={projects} selectedProject={selectedProject} selectedProjectId={selectedProjectId} onProjectChange={onProjectChange} />
      <section className="splitLayout requirementsLayout">
        <div className="panel">
          <div className="panelTitle"><h3>Requisitos</h3><span>{requirements.length}</span></div>
          <div className="requirementsList">
            {requirements.map((requirement) => (
              <article className="requirementCard" key={requirement.id}>
                <div className="requirementTop">
                  <span className="itemCode">{requirement.code}</span>
                  <span className={`priority priority${requirement.priority}`}>{labelEs(requirement.priority)}</span>
                  <span className={`pill ${requirement.status.toLowerCase()}`}>{labelEs(requirement.status)}</span>
                </div>
                <h4>{requirement.title}</h4>
                <p>{requirement.description}</p>
                <div className="criteria"><strong>Criterios de aceptación:</strong> {requirement.acceptanceCriteria}</div>
                <footer>
                  <span>{labelEs(requirement.type)}</span>
                  {canLead && requirement.status !== 'Approved' && <button className="linkButton" onClick={() => void approveRequirement(token, selectedProjectId, requirement.id).then(onReload)}>Aprobar</button>}
                </footer>
              </article>
            ))}
            {!requirements.length && <p className="empty">No hay requisitos registrados.</p>}
          </div>
        </div>

        <form className="panel formPanel" onSubmit={submit}>
          <div className="panelTitle"><h3>Nuevo requisito</h3></div>
          <label>Código<input value={code} onChange={(e) => setCode(e.target.value)} placeholder="REQ-001" required /></label>
          <label>Título<input value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
          <label>Descripción<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required /></label>
          <label>Criterios de aceptación<textarea value={criteria} onChange={(e) => setCriteria(e.target.value)} rows={4} required /></label>
          <div className="formRow">
            <label>Tipo<select value={type} onChange={(e) => setType(Number(e.target.value))}><option value={1}>Funcional</option><option value={2}>No funcional</option></select></label>
            <label>Prioridad<select value={priority} onChange={(e) => setPriority(Number(e.target.value))}><option value={1}>Baja</option><option value={2}>Media</option><option value={3}>Alta</option><option value={4}>Crítica</option></select></label>
          </div>
          <button className="primary">Agregar requisito</button>
        </form>
      </section>
    </>
  )
}

function RisksPanel({ projects, selectedProject, selectedProjectId, requirements, risks, canLead, onProjectChange, onReload, token, setMessage }: { projects: Project[]; selectedProject: Project | null; selectedProjectId: string; requirements: Requirement[]; risks: RiskItem[]; canLead: boolean; onProjectChange: (id: string) => void; onReload: () => Promise<void>; token: string; setMessage: (value: string) => void }) {
  const [requirementId, setRequirementId] = useState('')
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [probability, setProbability] = useState(3)
  const [impact, setImpact] = useState(3)
  const [mitigation, setMitigation] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    try {
      await createRisk(token, selectedProjectId, { requirementId: requirementId || null, code, title, description, probability, impact, mitigation })
      setCode('')
      setTitle('')
      setDescription('')
      setMitigation('')
      setMessage('Riesgo registrado correctamente.')
      await onReload()
    } catch (reason) {
      setMessage(errorMessageEs(reason, 'No se pudo registrar el riesgo.'))
    }
  }

  if (!projects.length) return <Empty />

  return (
    <>
      <ProjectPicker projects={projects} selectedProject={selectedProject} selectedProjectId={selectedProjectId} onProjectChange={onProjectChange} />
      <section className="splitLayout requirementsLayout">
        <div className="panel">
          <div className="panelTitle"><h3>Registro de riesgos</h3><span>{risks.length}</span></div>
          <div className="requirementsList">
            {risks.map((risk) => (
              <article className={`riskCard risk${risk.level}`} key={risk.id}>
                <div className="requirementTop">
                  <span className="itemCode">{risk.code}</span>
                  <span className={`riskScore score${risk.level}`}>{risk.score} · {labelEs(risk.level)}</span>
                  <span className={`pill ${risk.status.toLowerCase()}`}>{labelEs(risk.status)}</span>
                </div>
                <h4>{risk.title}</h4>
                <p>{risk.description}</p>
                <div className="criteria"><strong>Mitigación:</strong> {risk.mitigation}</div>
                {canLead && risk.status === 'Open' && (
                  <footer className="inlineActions">
                    <button className="linkButton" onClick={() => void mitigateRisk(token, selectedProjectId, risk.id).then(onReload)}>Marcar mitigado</button>
                    <button className="linkButton" onClick={() => void acceptRisk(token, selectedProjectId, risk.id).then(onReload)}>Aceptar riesgo</button>
                  </footer>
                )}
              </article>
            ))}
            {!risks.length && <p className="empty">No hay riesgos registrados.</p>}
          </div>
        </div>

        <form className="panel formPanel" onSubmit={submit}>
          <div className="panelTitle"><h3>Registrar riesgo</h3></div>
          <label>Requisito relacionado<select value={requirementId} onChange={(e) => setRequirementId(e.target.value)}><option value="">Riesgo a nivel de proyecto</option>{requirements.map((requirement) => <option value={requirement.id} key={requirement.id}>{requirement.code}</option>)}</select></label>
          <label>Código<input value={code} onChange={(e) => setCode(e.target.value)} placeholder="RSK-001" required /></label>
          <label>Título<input value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
          <label>Descripción<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required /></label>
          <div className="formRow">
            <label>Probabilidad<select value={probability} onChange={(e) => setProbability(Number(e.target.value))}>{[1, 2, 3, 4, 5].map((value) => <option key={value}>{value}</option>)}</select></label>
            <label>Impacto<select value={impact} onChange={(e) => setImpact(Number(e.target.value))}>{[1, 2, 3, 4, 5].map((value) => <option key={value}>{value}</option>)}</select></label>
          </div>
          <div className="scorePreview">Puntuación del riesgo: <strong>{probability * impact}</strong></div>
          <label>Estrategia de mitigación<textarea value={mitigation} onChange={(e) => setMitigation(e.target.value)} rows={4} required /></label>
          <button className="primary">Agregar riesgo</button>
        </form>
      </section>
    </>
  )
}

const techniques: Array<[number, string]> = [
  [1, 'Partición de equivalencia'],
  [2, 'Análisis de valores límite'],
  [3, 'Tabla de decisión'],
  [4, 'Transición de estados'],
  [5, 'Caso de uso'],
  [6, 'Cobertura de sentencias'],
  [7, 'Cobertura de decisiones'],
  [8, 'Prueba exploratoria'],
  [9, 'Adivinación de errores'],
]

function TestCasesPanel({ projects, selectedProject, selectedProjectId, requirements, risks, testCases, onProjectChange, onReload, token, setMessage }: { projects: Project[]; selectedProject: Project | null; selectedProjectId: string; requirements: Requirement[]; risks: RiskItem[]; testCases: TestCase[]; onProjectChange: (id: string) => void; onReload: () => Promise<void>; token: string; setMessage: (value: string) => void }) {
  const [requirementId, setRequirementId] = useState('')
  const [riskId, setRiskId] = useState('')
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [level, setLevel] = useState(2)
  const [type, setType] = useState(0)
  const [technique, setTechnique] = useState(1)
  const [priority, setPriority] = useState(2)
  const [objective, setObjective] = useState('')
  const [preconditions, setPreconditions] = useState('')
  const [steps, setSteps] = useState('')
  const [testData, setTestData] = useState('')
  const [expectedResult, setExpectedResult] = useState('')
  const [postconditions, setPostconditions] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    try {
      await createTestCase(token, selectedProjectId, { requirementId: requirementId || null, riskId: riskId || null, code, title, level, type, technique, priority, objective, preconditions, steps, testData, expectedResult, postconditions })
      setCode('')
      setTitle('')
      setObjective('')
      setPreconditions('')
      setSteps('')
      setTestData('')
      setExpectedResult('')
      setPostconditions('')
      setMessage('Caso de prueba creado correctamente.')
      await onReload()
    } catch (reason) {
      setMessage(errorMessageEs(reason, 'No se pudo crear el caso de prueba.'))
    }
  }

  if (!projects.length) return <Empty />

  return (
    <>
      <ProjectPicker projects={projects} selectedProject={selectedProject} selectedProjectId={selectedProjectId} onProjectChange={onProjectChange} />
      <section className="splitLayout testCaseLayout">
        <div className="panel">
          <div className="panelTitle"><h3>Repositorio de diseño de pruebas</h3><span>{testCases.length}</span></div>
          <div className="requirementsList">
            {testCases.map((testCase) => (
              <article className="testCaseCard" key={testCase.id}>
                <div className="requirementTop">
                  <span className="itemCode">{testCase.code}</span>
                  <span className={`priority priority${testCase.priority}`}>{labelEs(testCase.priority)}</span>
                  <span className={`pill ${testCase.status.toLowerCase()}`}>{labelEs(testCase.status)}</span>
                </div>
                <h4>{testCase.title}</h4>
                <div className="tagRow">
                  <span>{labelEs(testCase.level)}</span>
                  <span>{labelEs(testCase.type)}</span>
                  <span className="techniqueTag">{labelEs(testCase.technique)}</span>
                </div>
                <p>{testCase.objective}</p>
                <details>
                  <summary>Detalles del diseño de prueba</summary>
                  <div className="testDetails">
                    <strong>Precondiciones</strong><p>{testCase.preconditions}</p>
                    <strong>Pasos</strong><p>{testCase.steps}</p>
                    <strong>Datos de prueba</strong><p>{testCase.testData}</p>
                    <strong>Resultado esperado</strong><p>{testCase.expectedResult}</p>
                    <strong>Postcondiciones</strong><p>{testCase.postconditions}</p>
                  </div>
                </details>
                {testCase.status === 'Draft' && <footer><button className="linkButton" onClick={() => void markTestCaseReady(token, selectedProjectId, testCase.id).then(onReload)}>Marcar como listo</button></footer>}
              </article>
            ))}
            {!testCases.length && <p className="empty">No hay casos de prueba diseñados.</p>}
          </div>
        </div>

        <form className="panel formPanel denseForm" onSubmit={submit}>
          <div className="panelTitle"><h3>Diseñar caso de prueba</h3></div>
          <div className="formRow">
            <label>Requisito<select value={requirementId} onChange={(e) => setRequirementId(e.target.value)}><option value="">Sin requisito</option>{requirements.map((requirement) => <option key={requirement.id} value={requirement.id}>{requirement.code}</option>)}</select></label>
            <label>Riesgo<select value={riskId} onChange={(e) => setRiskId(e.target.value)}><option value="">Sin riesgo</option>{risks.map((risk) => <option key={risk.id} value={risk.id}>{risk.code}</option>)}</select></label>
          </div>
          <label>Código<input value={code} onChange={(e) => setCode(e.target.value)} placeholder="TC-001" required /></label>
          <label>Título<input value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
          <div className="formRow">
            <label>Nivel<select value={level} onChange={(e) => setLevel(Number(e.target.value))}><option value={0}>Componente</option><option value={1}>Integración</option><option value={2}>Sistema</option><option value={3}>Aceptación</option></select></label>
            <label>Tipo<select value={type} onChange={(e) => setType(Number(e.target.value))}><option value={0}>Funcional</option><option value={1}>No funcional</option></select></label>
          </div>
          <div className="formRow">
            <label>Técnica<select value={technique} onChange={(e) => setTechnique(Number(e.target.value))}>{techniques.map(([value, name]) => <option value={value} key={value}>{name}</option>)}</select></label>
            <label>Prioridad<select value={priority} onChange={(e) => setPriority(Number(e.target.value))}><option value={1}>Baja</option><option value={2}>Media</option><option value={3}>Alta</option><option value={4}>Crítica</option></select></label>
          </div>
          <label>Objetivo<textarea value={objective} onChange={(e) => setObjective(e.target.value)} rows={3} required /></label>
          <label>Precondiciones<textarea value={preconditions} onChange={(e) => setPreconditions(e.target.value)} rows={3} required /></label>
          <label>Pasos<textarea value={steps} onChange={(e) => setSteps(e.target.value)} rows={4} required /></label>
          <label>Datos de prueba<textarea value={testData} onChange={(e) => setTestData(e.target.value)} rows={3} required /></label>
          <label>Resultado esperado<textarea value={expectedResult} onChange={(e) => setExpectedResult(e.target.value)} rows={3} required /></label>
          <label>Postcondiciones<textarea value={postconditions} onChange={(e) => setPostconditions(e.target.value)} rows={3} required /></label>
          <button className="primary">Crear caso de prueba</button>
        </form>
      </section>
    </>
  )
}

function Empty() {
  return (
    <section className="panel emptyState">
      <h3>Crea un proyecto primero</h3>
      <p>La evidencia de QA siempre pertenece a un proyecto.</p>
    </section>
  )
}
