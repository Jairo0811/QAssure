import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  approveRequirement,
  createProject,
  createRequirement,
  getProjects,
  getRequirements,
  login,
} from './api'
import type { AuthSession, Project, Requirement } from './api'

const SESSION_KEY = 'qassure.session'

type View = 'overview' | 'projects' | 'requirements'

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

function App() {
  const [session, setSession] = useState<AuthSession | null>(() => readSession())

  if (!session) {
    return (
      <LoginScreen
        onAuthenticated={(nextSession) => {
          localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
          setSession(nextSession)
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')

    try {
      onAuthenticated(await login(email, password))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to sign in.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="authShell">
      <section className="authBrand">
        <span className="brandMark brandMarkLarge">Q✓</span>
        <p className="eyebrow">SOFTWARE QUALITY ASSURANCE</p>
        <h1>Verify. Validate. Assure.</h1>
        <p>
          Manage requirements and quality evidence from one traceable QA workspace.
        </p>
        <div className="authSignals">
          <span>✓ Requirements</span>
          <span>✓ Traceability</span>
          <span>✓ Validation evidence</span>
        </div>
      </section>

      <form className="loginCard" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">QASSURE ACCESS</p>
          <h2>Welcome back</h2>
          <p className="muted">Phase 1 · Authentication, Projects & Requirements</p>
        </div>

        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
        </label>
        <label>
          Password
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
        </label>

        {error && <p className="errorBox">{error}</p>}

        <button className="primary full" disabled={busy} type="submit">
          {busy ? 'Signing in…' : 'Sign in to QAssure'}
        </button>
        <small className="muted">Development admin: admin@qassure.local</small>
      </form>
    </main>
  )
}

function Workspace({ session, onLogout }: { session: AuthSession; onLogout: () => void }) {
  const [view, setView] = useState<View>('overview')
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  )

  const approvedRequirements = requirements.filter((requirement) => requirement.status === 'Approved').length

  useEffect(() => {
    void loadProjects()
  }, [])

  useEffect(() => {
    if (!selectedProjectId) {
      setRequirements([])
      return
    }

    void loadRequirements(selectedProjectId)
  }, [selectedProjectId])

  async function loadProjects() {
    setLoading(true)
    setMessage('')
    try {
      const data = await getProjects(session.accessToken)
      setProjects(data)
      if (!selectedProjectId && data.length > 0) setSelectedProjectId(data[0].id)
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to load projects.')
    } finally {
      setLoading(false)
    }
  }

  async function loadRequirements(projectId: string) {
    setMessage('')
    try {
      setRequirements(await getRequirements(session.accessToken, projectId))
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to load requirements.')
    }
  }

  async function handleCreateProject(payload: {
    name: string
    key: string
    description: string
    version: string
    criticality: number
  }) {
    try {
      const project = await createProject(session.accessToken, payload)
      setProjects((current) => [...current, project].sort((a, b) => a.name.localeCompare(b.name)))
      setSelectedProjectId(project.id)
      setMessage(`Project ${project.key} created.`)
      setView('requirements')
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to create project.')
    }
  }

  async function handleCreateRequirement(payload: {
    code: string
    title: string
    description: string
    acceptanceCriteria: string
    type: number
    priority: number
  }) {
    if (!selectedProjectId) return

    try {
      const requirement = await createRequirement(session.accessToken, selectedProjectId, payload)
      setRequirements((current) => [...current, requirement].sort((a, b) => a.code.localeCompare(b.code)))
      setMessage(`Requirement ${requirement.code} created.`)
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to create requirement.')
    }
  }

  async function handleApprove(requirementId: string) {
    if (!selectedProjectId) return

    try {
      const updated = await approveRequirement(session.accessToken, selectedProjectId, requirementId)
      setRequirements((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setMessage(`Requirement ${updated.code} approved.`)
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to approve requirement.')
    }
  }

  return (
    <div className="workspace">
      <aside className="sidebar">
        <div className="brand">
          <span className="brandMark">Q✓</span>
          <div>
            <strong>QAssure</strong>
            <small>Quality Assurance</small>
          </div>
        </div>

        <nav>
          <button className={view === 'overview' ? 'navActive' : ''} onClick={() => setView('overview')}>Overview</button>
          <button className={view === 'projects' ? 'navActive' : ''} onClick={() => setView('projects')}>Projects</button>
          <button className={view === 'requirements' ? 'navActive' : ''} onClick={() => setView('requirements')}>Requirements</button>
          <span className="navDivider">COMING NEXT</span>
          <button disabled>Test Cases</button>
          <button disabled>Test Runs</button>
          <button disabled>Defects</button>
          <button disabled>Traceability</button>
        </nav>

        <div className="userCard">
          <span className="avatar">{session.user.displayName.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{session.user.displayName}</strong>
            <small>{session.user.role}</small>
          </div>
          <button onClick={onLogout} title="Sign out">↗</button>
        </div>
      </aside>

      <main className="content">
        <header className="contentHeader">
          <div>
            <p className="eyebrow">ISO-410 · PHASE 1</p>
            <h2>{view === 'overview' ? 'Quality workspace' : view === 'projects' ? 'QA Projects' : 'Requirements'}</h2>
          </div>
          <span className="phaseBadge">Verify · Validate · Assure</span>
        </header>

        {message && <div className="notice">{message}</div>}
        {loading && <div className="notice">Loading QA workspace…</div>}

        {view === 'overview' && (
          <Overview projects={projects} requirements={requirements} approvedRequirements={approvedRequirements} />
        )}

        {view === 'projects' && (
          <ProjectsPanel
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelect={(id) => {
              setSelectedProjectId(id)
              setView('requirements')
            }}
            onCreate={handleCreateProject}
          />
        )}

        {view === 'requirements' && (
          <RequirementsPanel
            projects={projects}
            selectedProject={selectedProject}
            selectedProjectId={selectedProjectId}
            requirements={requirements}
            canApprove={session.user.role === 'Admin' || session.user.role === 'QaLead'}
            onProjectChange={setSelectedProjectId}
            onCreate={handleCreateRequirement}
            onApprove={handleApprove}
          />
        )}
      </main>
    </div>
  )
}

function Overview({
  projects,
  requirements,
  approvedRequirements,
}: {
  projects: Project[]
  requirements: Requirement[]
  approvedRequirements: number
}) {
  const cards = [
    [projects.length.toString(), 'QA projects'],
    [requirements.length.toString(), 'Requirements in focus'],
    [approvedRequirements.toString(), 'Approved requirements'],
    [requirements.filter((item) => item.priority === 'Critical').length.toString(), 'Critical requirements'],
  ]

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
            <p className="eyebrow">QUALITY FLOW</p>
            <h3>Traceability starts with the requirement</h3>
          </div>
          <span className="statusGood">● Phase 1 active</span>
        </div>
        <div className="flow">
          {['Project', 'Requirement', 'Test Case', 'Execution', 'Defect', 'Validation'].map((step, index) => (
            <div className={`flowStep ${index < 2 ? 'flowReady' : ''}`} key={step}>
              <span>{index < 2 ? '✓' : index + 1}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

function ProjectsPanel({
  projects,
  selectedProjectId,
  onSelect,
  onCreate,
}: {
  projects: Project[]
  selectedProjectId: string
  onSelect: (id: string) => void
  onCreate: (payload: { name: string; key: string; description: string; version: string; criticality: number }) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [description, setDescription] = useState('')
  const [version, setVersion] = useState('0.1.0')
  const [criticality, setCriticality] = useState(2)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onCreate({ name, key, description, version, criticality })
    setName('')
    setKey('')
    setDescription('')
  }

  return (
    <section className="splitLayout">
      <div className="panel">
        <div className="panelTitle"><h3>Projects</h3><span>{projects.length}</span></div>
        <div className="itemList">
          {projects.length === 0 && <p className="empty">No QA projects yet.</p>}
          {projects.map((project) => (
            <button
              className={`listItem ${project.id === selectedProjectId ? 'selected' : ''}`}
              key={project.id}
              onClick={() => onSelect(project.id)}
            >
              <span className="itemCode">{project.key}</span>
              <div><strong>{project.name}</strong><small>{project.version} · {project.criticality}</small></div>
              <span className={`pill ${project.status.toLowerCase()}`}>{project.status}</span>
            </button>
          ))}
        </div>
      </div>

      <form className="panel formPanel" onSubmit={submit}>
        <div className="panelTitle"><h3>Create QA project</h3></div>
        <label>Name<input value={name} onChange={(event) => setName(event.target.value)} required /></label>
        <label>Project key<input value={key} onChange={(event) => setKey(event.target.value)} placeholder="QA-410" required /></label>
        <label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} /></label>
        <div className="formRow">
          <label>Version<input value={version} onChange={(event) => setVersion(event.target.value)} required /></label>
          <label>Criticality
            <select value={criticality} onChange={(event) => setCriticality(Number(event.target.value))}>
              <option value={1}>Low</option><option value={2}>Medium</option><option value={3}>High</option><option value={4}>Critical</option>
            </select>
          </label>
        </div>
        <button className="primary" type="submit">Create project</button>
      </form>
    </section>
  )
}

function RequirementsPanel({
  projects,
  selectedProject,
  selectedProjectId,
  requirements,
  canApprove,
  onProjectChange,
  onCreate,
  onApprove,
}: {
  projects: Project[]
  selectedProject: Project | null
  selectedProjectId: string
  requirements: Requirement[]
  canApprove: boolean
  onProjectChange: (id: string) => void
  onCreate: (payload: { code: string; title: string; description: string; acceptanceCriteria: string; type: number; priority: number }) => Promise<void>
  onApprove: (id: string) => Promise<void>
}) {
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('')
  const [type, setType] = useState(1)
  const [priority, setPriority] = useState(2)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onCreate({ code, title, description, acceptanceCriteria, type, priority })
    setCode('')
    setTitle('')
    setDescription('')
    setAcceptanceCriteria('')
  }

  if (projects.length === 0) {
    return <section className="panel emptyState"><h3>Create a project first</h3><p>Requirements are always traceable to a QA project.</p></section>
  }

  return (
    <>
      <section className="projectPicker panel">
        <div><p className="eyebrow">PROJECT CONTEXT</p><h3>{selectedProject?.name ?? 'Select project'}</h3></div>
        <select value={selectedProjectId} onChange={(event) => onProjectChange(event.target.value)}>
          {projects.map((project) => <option value={project.id} key={project.id}>{project.key} · {project.name}</option>)}
        </select>
      </section>

      <section className="splitLayout requirementsLayout">
        <div className="panel">
          <div className="panelTitle"><h3>Requirements</h3><span>{requirements.length}</span></div>
          <div className="requirementsList">
            {requirements.length === 0 && <p className="empty">No requirements registered for this project.</p>}
            {requirements.map((requirement) => (
              <article className="requirementCard" key={requirement.id}>
                <div className="requirementTop">
                  <span className="itemCode">{requirement.code}</span>
                  <span className={`priority priority${requirement.priority}`}>{requirement.priority}</span>
                  <span className={`pill ${requirement.status.toLowerCase()}`}>{requirement.status}</span>
                </div>
                <h4>{requirement.title}</h4>
                <p>{requirement.description}</p>
                <div className="criteria"><strong>Acceptance:</strong> {requirement.acceptanceCriteria}</div>
                <footer>
                  <span>{requirement.type}</span>
                  {canApprove && requirement.status !== 'Approved' && (
                    <button className="linkButton" onClick={() => void onApprove(requirement.id)}>Approve</button>
                  )}
                </footer>
              </article>
            ))}
          </div>
        </div>

        <form className="panel formPanel" onSubmit={submit}>
          <div className="panelTitle"><h3>New requirement</h3></div>
          <label>Code<input value={code} onChange={(event) => setCode(event.target.value)} placeholder="REQ-001" required /></label>
          <label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
          <label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} required /></label>
          <label>Acceptance criteria<textarea value={acceptanceCriteria} onChange={(event) => setAcceptanceCriteria(event.target.value)} rows={4} required /></label>
          <div className="formRow">
            <label>Type<select value={type} onChange={(event) => setType(Number(event.target.value))}><option value={1}>Functional</option><option value={2}>Non-functional</option></select></label>
            <label>Priority<select value={priority} onChange={(event) => setPriority(Number(event.target.value))}><option value={1}>Low</option><option value={2}>Medium</option><option value={3}>High</option><option value={4}>Critical</option></select></label>
          </div>
          <button className="primary" type="submit">Add requirement</button>
        </form>
      </section>
    </>
  )
}

export default App
