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

const SESSION_KEY = 'qassure.session'

type View = 'overview' | 'projects' | 'requirements' | 'risks' | 'testCases'

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
        <p>Turn requirements and risks into traceable test evidence from one QA workspace.</p>
        <div className="authSignals">
          <span>✓ Risk-based testing</span>
          <span>✓ Test design techniques</span>
          <span>✓ Requirement traceability</span>
        </div>
      </section>

      <form className="loginCard" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">QASSURE ACCESS</p>
          <h2>Welcome back</h2>
          <p className="muted">Phase 2 · Risk Analysis & Test Cases</p>
        </div>
        <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required /></label>
        <label>Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required /></label>
        {error && <p className="errorBox">{error}</p>}
        <button className="primary full" disabled={busy} type="submit">{busy ? 'Signing in…' : 'Sign in to QAssure'}</button>
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
  const [risks, setRisks] = useState<RiskItem[]>([])
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
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

  async function loadProjectData(projectId: string) {
    setMessage('')
    try {
      const [nextRequirements, nextRisks, nextTestCases] = await Promise.all([
        getRequirements(session.accessToken, projectId),
        getRisks(session.accessToken, projectId),
        getTestCases(session.accessToken, projectId),
      ])
      setRequirements(nextRequirements)
      setRisks(nextRisks)
      setTestCases(nextTestCases)
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to load project QA data.')
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

  async function handleCreateRisk(payload: {
    requirementId: string | null
    code: string
    title: string
    description: string
    probability: number
    impact: number
    mitigation: string
  }) {
    if (!selectedProjectId) return
    try {
      const risk = await createRisk(session.accessToken, selectedProjectId, payload)
      setRisks((current) => [...current, risk].sort((a, b) => b.score - a.score || a.code.localeCompare(b.code)))
      setMessage(`Risk ${risk.code} registered with score ${risk.score}.`)
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to create risk.')
    }
  }

  async function handleRiskAction(riskId: string, action: 'mitigate' | 'accept') {
    if (!selectedProjectId) return
    try {
      const updated = action === 'mitigate'
        ? await mitigateRisk(session.accessToken, selectedProjectId, riskId)
        : await acceptRisk(session.accessToken, selectedProjectId, riskId)
      setRisks((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setMessage(`Risk ${updated.code} is now ${updated.status}.`)
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to update risk.')
    }
  }

  async function handleCreateTestCase(payload: {
    requirementId: string | null
    riskId: string | null
    code: string
    title: string
    level: number
    type: number
    technique: number
    priority: number
    objective: string
    preconditions: string
    steps: string
    testData: string
    expectedResult: string
    postconditions: string
  }) {
    if (!selectedProjectId) return
    try {
      const testCase = await createTestCase(session.accessToken, selectedProjectId, payload)
      setTestCases((current) => [...current, testCase].sort((a, b) => a.code.localeCompare(b.code)))
      setMessage(`Test case ${testCase.code} created.`)
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to create test case.')
    }
  }

  async function handleReady(testCaseId: string) {
    if (!selectedProjectId) return
    try {
      const updated = await markTestCaseReady(session.accessToken, selectedProjectId, testCaseId)
      setTestCases((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setMessage(`Test case ${updated.code} is ready for execution.`)
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to mark test case ready.')
    }
  }

  const titleByView: Record<View, string> = {
    overview: 'Quality workspace',
    projects: 'QA Projects',
    requirements: 'Requirements',
    risks: 'Risk Analysis',
    testCases: 'Test Cases',
  }

  return (
    <div className="workspace">
      <aside className="sidebar">
        <div className="brand">
          <span className="brandMark">Q✓</span>
          <div><strong>QAssure</strong><small>Quality Assurance</small></div>
        </div>

        <nav>
          <button className={view === 'overview' ? 'navActive' : ''} onClick={() => setView('overview')}>Overview</button>
          <button className={view === 'projects' ? 'navActive' : ''} onClick={() => setView('projects')}>Projects</button>
          <button className={view === 'requirements' ? 'navActive' : ''} onClick={() => setView('requirements')}>Requirements</button>
          <button className={view === 'risks' ? 'navActive' : ''} onClick={() => setView('risks')}>Risk Analysis</button>
          <button className={view === 'testCases' ? 'navActive' : ''} onClick={() => setView('testCases')}>Test Cases</button>
          <span className="navDivider">COMING NEXT</span>
          <button disabled>Test Runs</button>
          <button disabled>Defects</button>
          <button disabled>Traceability</button>
        </nav>

        <div className="userCard">
          <span className="avatar">{session.user.displayName.slice(0, 1).toUpperCase()}</span>
          <div><strong>{session.user.displayName}</strong><small>{session.user.role}</small></div>
          <button onClick={onLogout} title="Sign out">↗</button>
        </div>
      </aside>

      <main className="content">
        <header className="contentHeader">
          <div><p className="eyebrow">ISO-410 · PHASE 2</p><h2>{titleByView[view]}</h2></div>
          <span className="phaseBadge">Risk-based · Traceable · Testable</span>
        </header>

        {message && <div className="notice">{message}</div>}
        {loading && <div className="notice">Loading QA workspace…</div>}

        {view === 'overview' && (
          <Overview projects={projects} requirements={requirements} risks={risks} testCases={testCases} />
        )}
        {view === 'projects' && (
          <ProjectsPanel
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelect={(id) => { setSelectedProjectId(id); setView('requirements') }}
            onCreate={handleCreateProject}
          />
        )}
        {view === 'requirements' && (
          <RequirementsPanel
            projects={projects}
            selectedProject={selectedProject}
            selectedProjectId={selectedProjectId}
            requirements={requirements}
            canApprove={canLead}
            onProjectChange={setSelectedProjectId}
            onCreate={handleCreateRequirement}
            onApprove={handleApprove}
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
            onCreate={handleCreateRisk}
            onAction={handleRiskAction}
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
            onCreate={handleCreateTestCase}
            onReady={handleReady}
          />
        )}
      </main>
    </div>
  )
}

function Overview({ projects, requirements, risks, testCases }: {
  projects: Project[]
  requirements: Requirement[]
  risks: RiskItem[]
  testCases: TestCase[]
}) {
  const approved = requirements.filter((item) => item.status === 'Approved').length
  const criticalOpenRisks = risks.filter((item) => item.level === 'Critical' && item.status === 'Open').length
  const readyCases = testCases.filter((item) => item.status === 'Ready').length
  const coveredRequirementIds = new Set(testCases.flatMap((item) => item.requirementId ? [item.requirementId] : []))
  const coverage = requirements.length === 0 ? 0 : Math.round((coveredRequirementIds.size / requirements.length) * 100)

  const cards = [
    [projects.length.toString(), 'QA projects'],
    [approved.toString(), 'Approved requirements'],
    [criticalOpenRisks.toString(), 'Critical open risks'],
    [readyCases.toString(), 'Ready test cases'],
  ]

  return (
    <>
      <section className="metricGrid">
        {cards.map(([value, label]) => <article className="metricCard" key={label}><strong>{value}</strong><span>{label}</span></article>)}
      </section>
      <section className="panel tracePanel">
        <div className="panelTitle">
          <div><p className="eyebrow">TRACEABILITY</p><h3>Requirement → Risk → Test Case</h3></div>
          <span className="statusGood">● {coverage}% requirement coverage</span>
        </div>
        <div className="flow">
          {['Project', 'Requirement', 'Risk', 'Test Case', 'Execution', 'Validation'].map((step, index) => (
            <div className={`flowStep ${index < 4 ? 'flowReady' : ''}`} key={step}>
              <span>{index < 4 ? '✓' : index + 1}</span><strong>{step}</strong>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

function ProjectsPanel({ projects, selectedProjectId, onSelect, onCreate }: {
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
    setName(''); setKey(''); setDescription('')
  }

  return (
    <section className="splitLayout">
      <div className="panel">
        <div className="panelTitle"><h3>Projects</h3><span>{projects.length}</span></div>
        <div className="itemList">
          {projects.length === 0 && <p className="empty">No QA projects yet.</p>}
          {projects.map((project) => (
            <button className={`listItem ${project.id === selectedProjectId ? 'selected' : ''}`} key={project.id} onClick={() => onSelect(project.id)}>
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
          <label>Criticality<select value={criticality} onChange={(event) => setCriticality(Number(event.target.value))}><option value={1}>Low</option><option value={2}>Medium</option><option value={3}>High</option><option value={4}>Critical</option></select></label>
        </div>
        <button className="primary" type="submit">Create project</button>
      </form>
    </section>
  )
}

function ProjectPicker({ projects, selectedProject, selectedProjectId, onProjectChange }: {
  projects: Project[]
  selectedProject: Project | null
  selectedProjectId: string
  onProjectChange: (id: string) => void
}) {
  return (
    <section className="projectPicker panel">
      <div><p className="eyebrow">PROJECT CONTEXT</p><h3>{selectedProject?.name ?? 'Select project'}</h3></div>
      <select value={selectedProjectId} onChange={(event) => onProjectChange(event.target.value)}>
        {projects.map((project) => <option value={project.id} key={project.id}>{project.key} · {project.name}</option>)}
      </select>
    </section>
  )
}

function RequirementsPanel({ projects, selectedProject, selectedProjectId, requirements, canApprove, onProjectChange, onCreate, onApprove }: {
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
    setCode(''); setTitle(''); setDescription(''); setAcceptanceCriteria('')
  }

  if (projects.length === 0) return <EmptyProjectState />

  return (
    <>
      <ProjectPicker projects={projects} selectedProject={selectedProject} selectedProjectId={selectedProjectId} onProjectChange={onProjectChange} />
      <section className="splitLayout requirementsLayout">
        <div className="panel">
          <div className="panelTitle"><h3>Requirements</h3><span>{requirements.length}</span></div>
          <div className="requirementsList">
            {requirements.length === 0 && <p className="empty">No requirements registered for this project.</p>}
            {requirements.map((requirement) => (
              <article className="requirementCard" key={requirement.id}>
                <div className="requirementTop"><span className="itemCode">{requirement.code}</span><span className={`priority priority${requirement.priority}`}>{requirement.priority}</span><span className={`pill ${requirement.status.toLowerCase()}`}>{requirement.status}</span></div>
                <h4>{requirement.title}</h4><p>{requirement.description}</p>
                <div className="criteria"><strong>Acceptance:</strong> {requirement.acceptanceCriteria}</div>
                <footer><span>{requirement.type}</span>{canApprove && requirement.status !== 'Approved' && <button className="linkButton" onClick={() => void onApprove(requirement.id)}>Approve</button>}</footer>
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

function RisksPanel({ projects, selectedProject, selectedProjectId, requirements, risks, canLead, onProjectChange, onCreate, onAction }: {
  projects: Project[]
  selectedProject: Project | null
  selectedProjectId: string
  requirements: Requirement[]
  risks: RiskItem[]
  canLead: boolean
  onProjectChange: (id: string) => void
  onCreate: (payload: { requirementId: string | null; code: string; title: string; description: string; probability: number; impact: number; mitigation: string }) => Promise<void>
  onAction: (id: string, action: 'mitigate' | 'accept') => Promise<void>
}) {
  const [requirementId, setRequirementId] = useState('')
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [probability, setProbability] = useState(3)
  const [impact, setImpact] = useState(3)
  const [mitigation, setMitigation] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onCreate({ requirementId: requirementId || null, code, title, description, probability, impact, mitigation })
    setCode(''); setTitle(''); setDescription(''); setMitigation('')
  }

  if (projects.length === 0) return <EmptyProjectState />

  return (
    <>
      <ProjectPicker projects={projects} selectedProject={selectedProject} selectedProjectId={selectedProjectId} onProjectChange={onProjectChange} />
      <section className="splitLayout requirementsLayout">
        <div className="panel">
          <div className="panelTitle"><h3>Risk register</h3><span>{risks.length}</span></div>
          <div className="requirementsList">
            {risks.length === 0 && <p className="empty">No risks registered for this project.</p>}
            {risks.map((risk) => (
              <article className={`riskCard risk${risk.level}`} key={risk.id}>
                <div className="requirementTop"><span className="itemCode">{risk.code}</span><span className={`riskScore score${risk.level}`}>{risk.score} · {risk.level}</span><span className={`pill ${risk.status.toLowerCase()}`}>{risk.status}</span></div>
                <h4>{risk.title}</h4><p>{risk.description}</p>
                <div className="riskMeta"><span>P {risk.probability}/5</span><span>I {risk.impact}/5</span><span>{risk.requirementId ? 'Requirement linked' : 'Project-level risk'}</span></div>
                <div className="criteria"><strong>Mitigation:</strong> {risk.mitigation}</div>
                {canLead && risk.status === 'Open' && <footer className="inlineActions"><button className="linkButton" onClick={() => void onAction(risk.id, 'mitigate')}>Mark mitigated</button><button className="linkButton" onClick={() => void onAction(risk.id, 'accept')}>Accept risk</button></footer>}
              </article>
            ))}
          </div>
        </div>
        <form className="panel formPanel" onSubmit={submit}>
          <div className="panelTitle"><h3>Register risk</h3></div>
          <label>Requirement trace<select value={requirementId} onChange={(event) => setRequirementId(event.target.value)}><option value="">Project-level risk</option>{requirements.map((requirement) => <option key={requirement.id} value={requirement.id}>{requirement.code} · {requirement.title}</option>)}</select></label>
          <label>Code<input value={code} onChange={(event) => setCode(event.target.value)} placeholder="RSK-001" required /></label>
          <label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
          <label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} required /></label>
          <div className="formRow">
            <label>Probability<select value={probability} onChange={(event) => setProbability(Number(event.target.value))}>{[1,2,3,4,5].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label>Impact<select value={impact} onChange={(event) => setImpact(Number(event.target.value))}>{[1,2,3,4,5].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          </div>
          <div className="scorePreview">Risk score preview: <strong>{probability * impact}</strong></div>
          <label>Mitigation strategy<textarea value={mitigation} onChange={(event) => setMitigation(event.target.value)} rows={4} required /></label>
          <button className="primary" type="submit">Add risk</button>
        </form>
      </section>
    </>
  )
}

function TestCasesPanel({ projects, selectedProject, selectedProjectId, requirements, risks, testCases, onProjectChange, onCreate, onReady }: {
  projects: Project[]
  selectedProject: Project | null
  selectedProjectId: string
  requirements: Requirement[]
  risks: RiskItem[]
  testCases: TestCase[]
  onProjectChange: (id: string) => void
  onCreate: (payload: { requirementId: string | null; riskId: string | null; code: string; title: string; level: number; type: number; technique: number; priority: number; objective: string; preconditions: string; steps: string; testData: string; expectedResult: string; postconditions: string }) => Promise<void>
  onReady: (id: string) => Promise<void>
}) {
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onCreate({ requirementId: requirementId || null, riskId: riskId || null, code, title, level, type, technique, priority, objective, preconditions, steps, testData, expectedResult, postconditions })
    setCode(''); setTitle(''); setObjective(''); setPreconditions(''); setSteps(''); setTestData(''); setExpectedResult(''); setPostconditions('')
  }

  if (projects.length === 0) return <EmptyProjectState />

  return (
    <>
      <ProjectPicker projects={projects} selectedProject={selectedProject} selectedProjectId={selectedProjectId} onProjectChange={onProjectChange} />
      <section className="splitLayout testCaseLayout">
        <div className="panel">
          <div className="panelTitle"><h3>Test design repository</h3><span>{testCases.length}</span></div>
          <div className="requirementsList">
            {testCases.length === 0 && <p className="empty">No test cases designed for this project.</p>}
            {testCases.map((testCase) => (
              <article className="testCaseCard" key={testCase.id}>
                <div className="requirementTop"><span className="itemCode">{testCase.code}</span><span className={`priority priority${testCase.priority}`}>{testCase.priority}</span><span className={`pill ${testCase.status.toLowerCase()}`}>{testCase.status}</span></div>
                <h4>{testCase.title}</h4>
                <div className="tagRow"><span>{testCase.level}</span><span>{testCase.type}</span><span className="techniqueTag">{humanizeTechnique(testCase.technique)}</span></div>
                <p>{testCase.objective}</p>
                <div className="traceLinks"><span>{testCase.requirementId ? '✓ Requirement' : '○ Requirement'}</span><span>{testCase.riskId ? '✓ Risk' : '○ Risk'}</span></div>
                <details><summary>Test design details</summary><div className="testDetails"><strong>Preconditions</strong><p>{testCase.preconditions}</p><strong>Steps</strong><p>{testCase.steps}</p><strong>Test data</strong><p>{testCase.testData}</p><strong>Expected</strong><p>{testCase.expectedResult}</p><strong>Postconditions</strong><p>{testCase.postconditions}</p></div></details>
                {testCase.status === 'Draft' && <footer><span>Design complete?</span><button className="linkButton" onClick={() => void onReady(testCase.id)}>Mark ready</button></footer>}
              </article>
            ))}
          </div>
        </div>
        <form className="panel formPanel denseForm" onSubmit={submit}>
          <div className="panelTitle"><h3>Design test case</h3></div>
          <div className="formRow"><label>Requirement<select value={requirementId} onChange={(event) => setRequirementId(event.target.value)}><option value="">No requirement</option>{requirements.map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}</select></label><label>Risk<select value={riskId} onChange={(event) => setRiskId(event.target.value)}><option value="">No risk</option>{risks.map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}</select></label></div>
          <label>Code<input value={code} onChange={(event) => setCode(event.target.value)} placeholder="TC-001" required /></label>
          <label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
          <div className="formRow"><label>Level<select value={level} onChange={(event) => setLevel(Number(event.target.value))}><option value={0}>Component</option><option value={1}>Integration</option><option value={2}>System</option><option value={3}>Acceptance</option></select></label><label>Type<select value={type} onChange={(event) => setType(Number(event.target.value))}><option value={0}>Functional</option><option value={1}>Non-functional</option></select></label></div>
          <div className="formRow"><label>Technique<select value={technique} onChange={(event) => setTechnique(Number(event.target.value))}>{techniqueOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Priority<select value={priority} onChange={(event) => setPriority(Number(event.target.value))}><option value={1}>Low</option><option value={2}>Medium</option><option value={3}>High</option><option value={4}>Critical</option></select></label></div>
          <label>Objective<textarea value={objective} onChange={(event) => setObjective(event.target.value)} rows={3} required /></label>
          <label>Preconditions<textarea value={preconditions} onChange={(event) => setPreconditions(event.target.value)} rows={3} required /></label>
          <label>Steps<textarea value={steps} onChange={(event) => setSteps(event.target.value)} rows={4} required /></label>
          <label>Test data<textarea value={testData} onChange={(event) => setTestData(event.target.value)} rows={3} required /></label>
          <label>Expected result<textarea value={expectedResult} onChange={(event) => setExpectedResult(event.target.value)} rows={3} required /></label>
          <label>Postconditions<textarea value={postconditions} onChange={(event) => setPostconditions(event.target.value)} rows={3} required /></label>
          <button className="primary" type="submit">Create test case</button>
        </form>
      </section>
    </>
  )
}

const techniqueOptions: Array<[number, string]> = [
  [1, 'Equivalence Partitioning'], [2, 'Boundary Value Analysis'], [3, 'Decision Table'],
  [4, 'State Transition'], [5, 'Use Case'], [6, 'Statement Coverage'],
  [7, 'Decision Coverage'], [8, 'Exploratory'], [9, 'Error Guessing'],
]

function humanizeTechnique(value: string): string {
  return value.replace(/([a-z])([A-Z])/g, '$1 $2')
}

function EmptyProjectState() {
  return <section className="panel emptyState"><h3>Create a project first</h3><p>Phase 2 evidence is always scoped to a QA project.</p></section>
}

export default App
