import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  cancelTestRun,
  completeTestRun,
  createTestRun,
  getTestRun,
  getTestRuns,
  recordTestExecution,
  startTestRun,
} from './api'
import type { Project, TestCase, TestExecution, TestRunDetail, TestRunSummary } from './api'
import './phase3.css'

interface Props {
  token: string
  projects: Project[]
  selectedProject: Project | null
  selectedProjectId: string
  testCases: TestCase[]
  canLead: boolean
  onProjectChange: (id: string) => void
}

export default function TestRunsPanel({ token, projects, selectedProject, selectedProjectId, testCases, canLead, onProjectChange }: Props) {
  const [runs, setRuns] = useState<TestRunSummary[]>([])
  const [detail, setDetail] = useState<TestRunDetail | null>(null)
  const [selectedRunId, setSelectedRunId] = useState('')
  const [message, setMessage] = useState('')
  const [name, setName] = useState('Regression cycle')
  const [buildVersion, setBuildVersion] = useState(selectedProject?.version ?? '0.1.0')
  const [environment, setEnvironment] = useState(1)
  const [type, setType] = useState(2)
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([])
  const readyCases = useMemo(() => testCases.filter((item) => item.status === 'Ready'), [testCases])

  useEffect(() => {
    setBuildVersion(selectedProject?.version ?? '0.1.0')
  }, [selectedProject?.id])

  useEffect(() => {
    if (!selectedProjectId) {
      setRuns([]); setDetail(null); setSelectedRunId(''); return
    }
    void refreshRuns()
  }, [selectedProjectId])

  async function refreshRuns(focusId?: string) {
    try {
      const next = await getTestRuns(token, selectedProjectId)
      setRuns(next)
      const nextId = focusId ?? selectedRunId ?? next[0]?.id ?? ''
      setSelectedRunId(nextId)
      if (nextId) setDetail(await getTestRun(token, selectedProjectId, nextId))
      else setDetail(null)
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to load test runs.')
    }
  }

  async function openRun(runId: string) {
    setSelectedRunId(runId)
    try { setDetail(await getTestRun(token, selectedProjectId, runId)) }
    catch (reason) { setMessage(reason instanceof Error ? reason.message : 'Unable to load test run.') }
  }

  async function createRun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const created = await createTestRun(token, selectedProjectId, { name, buildVersion, environment, type, testCaseIds: selectedCaseIds })
      setSelectedCaseIds([])
      setMessage(`Test run “${created.name}” created with ${created.total} cases.`)
      await refreshRuns(created.id)
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to create test run.')
    }
  }

  async function action(kind: 'start' | 'complete' | 'cancel') {
    if (!selectedRunId) return
    try {
      const updated = kind === 'start'
        ? await startTestRun(token, selectedProjectId, selectedRunId)
        : kind === 'complete'
          ? await completeTestRun(token, selectedProjectId, selectedRunId)
          : await cancelTestRun(token, selectedProjectId, selectedRunId)
      setMessage(`Test run is now ${updated.status}.`)
      await refreshRuns(selectedRunId)
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to update test run.')
    }
  }

  async function saveExecution(execution: TestExecution, payload: { result: number; actualResult: string; notes: string; evidence: string }) {
    if (!detail) return
    try {
      await recordTestExecution(token, selectedProjectId, detail.run.id, execution.id, payload)
      setMessage(`${execution.testCaseCode} execution saved.`)
      await refreshRuns(detail.run.id)
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to save execution.')
    }
  }

  if (projects.length === 0) return <section className="panel emptyState"><h3>Create a project first</h3><p>Test execution evidence is always scoped to a QA project.</p></section>

  return (
    <>
      <section className="projectPicker panel">
        <div><p className="eyebrow">PROJECT CONTEXT</p><h3>{selectedProject?.name ?? 'Select project'}</h3></div>
        <select value={selectedProjectId} onChange={(event) => onProjectChange(event.target.value)}>
          {projects.map((project) => <option value={project.id} key={project.id}>{project.key} · {project.name}</option>)}
        </select>
      </section>

      {message && <div className="notice">{message}</div>}

      <section className="runMetrics">
        <article><strong>{runs.length}</strong><span>Test runs</span></article>
        <article><strong>{runs.filter((run) => run.status === 'InProgress').length}</strong><span>In progress</span></article>
        <article><strong>{runs.reduce((sum, run) => sum + run.failed, 0)}</strong><span>Failed executions</span></article>
        <article><strong>{runs.filter((run) => run.status === 'Completed').length}</strong><span>Completed cycles</span></article>
      </section>

      <section className="runsLayout">
        <div className="panel">
          <div className="panelTitle"><h3>Execution cycles</h3><span>{runs.length}</span></div>
          <div className="runList">
            {runs.length === 0 && <p className="empty">No test runs yet. Create a cycle from Ready test cases.</p>}
            {runs.map((run) => (
              <button key={run.id} className={`runItem ${run.id === selectedRunId ? 'runSelected' : ''}`} onClick={() => void openRun(run.id)}>
                <div><strong>{run.name}</strong><small>{run.type} · {run.environment} · build {run.buildVersion}</small></div>
                <span className={`pill ${run.status.toLowerCase()}`}>{run.status}</span>
                <div className="runMini"><span>✓ {run.passed}</span><span>✕ {run.failed}</span><span>! {run.blocked}</span><span>○ {run.notRun}</span></div>
              </button>
            ))}
          </div>
        </div>

        <form className="panel formPanel" onSubmit={createRun}>
          <div className="panelTitle"><h3>Create test run</h3></div>
          <label>Cycle name<input value={name} onChange={(event) => setName(event.target.value)} required /></label>
          <label>Build / version<input value={buildVersion} onChange={(event) => setBuildVersion(event.target.value)} required /></label>
          <div className="formRow">
            <label>Environment<select value={environment} onChange={(event) => setEnvironment(Number(event.target.value))}><option value={0}>Development</option><option value={1}>QA</option><option value={2}>Staging</option><option value={3}>Production-like</option></select></label>
            <label>Run type<select value={type} onChange={(event) => setType(Number(event.target.value))}><option value={1}>Smoke</option><option value={2}>Regression</option><option value={3}>System</option><option value={4}>Acceptance</option></select></label>
          </div>
          <fieldset className="caseSelector"><legend>Ready test cases</legend>
            {readyCases.length === 0 && <p className="muted">Mark test cases Ready before creating a run.</p>}
            {readyCases.map((item) => (
              <label className="checkRow" key={item.id}><input type="checkbox" checked={selectedCaseIds.includes(item.id)} onChange={(event) => setSelectedCaseIds((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} /><span><strong>{item.code}</strong> {item.title}</span></label>
            ))}
          </fieldset>
          <button className="primary" type="submit" disabled={selectedCaseIds.length === 0}>Create execution cycle</button>
        </form>
      </section>

      {detail && (
        <section className="panel executionBoard">
          <div className="runHeader">
            <div><p className="eyebrow">ACTIVE RUN</p><h3>{detail.run.name}</h3><p className="muted">{detail.run.type} · {detail.run.environment} · build {detail.run.buildVersion}</p></div>
            <div className="runActions">
              <span className={`pill ${detail.run.status.toLowerCase()}`}>{detail.run.status}</span>
              {detail.run.status === 'Draft' && <button className="primary" onClick={() => void action('start')}>Start run</button>}
              {detail.run.status === 'InProgress' && <button className="primary" disabled={detail.run.notRun > 0} onClick={() => void action('complete')}>Complete run</button>}
              {canLead && detail.run.status !== 'Completed' && detail.run.status !== 'Cancelled' && <button className="dangerButton" onClick={() => void action('cancel')}>Cancel</button>}
            </div>
          </div>

          <div className="resultStrip"><span>Pass rate <strong>{detail.run.passRate}%</strong></span><span>Passed <strong>{detail.run.passed}</strong></span><span>Failed <strong>{detail.run.failed}</strong></span><span>Blocked <strong>{detail.run.blocked}</strong></span><span>Skipped <strong>{detail.run.skipped}</strong></span><span>Pending <strong>{detail.run.notRun}</strong></span></div>

          <div className="executionList">
            {detail.executions.map((execution) => (
              <ExecutionEditor key={execution.id} execution={execution} editable={detail.run.status === 'InProgress'} onSave={saveExecution} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}

function ExecutionEditor({ execution, editable, onSave }: { execution: TestExecution; editable: boolean; onSave: (execution: TestExecution, payload: { result: number; actualResult: string; notes: string; evidence: string }) => Promise<void> }) {
  const initialResult = execution.result === 'Passed' ? 1 : execution.result === 'Failed' ? 2 : execution.result === 'Blocked' ? 3 : execution.result === 'Skipped' ? 4 : 1
  const [result, setResult] = useState(initialResult)
  const [actualResult, setActualResult] = useState(execution.actualResult)
  const [notes, setNotes] = useState(execution.notes)
  const [evidence, setEvidence] = useState(execution.evidence)

  useEffect(() => {
    setResult(execution.result === 'Passed' ? 1 : execution.result === 'Failed' ? 2 : execution.result === 'Blocked' ? 3 : execution.result === 'Skipped' ? 4 : 1)
    setActualResult(execution.actualResult); setNotes(execution.notes); setEvidence(execution.evidence)
  }, [execution.id, execution.result, execution.actualResult, execution.notes, execution.evidence])

  return (
    <article className={`executionCard result${execution.result}`}>
      <div className="executionTitle"><div><span className="itemCode">{execution.testCaseCode}</span><h4>{execution.testCaseTitle}</h4></div><span className={`priority priority${execution.priority}`}>{execution.priority}</span></div>
      <div className="expectedBox"><strong>Expected</strong><p>{execution.expectedResult}</p></div>
      {editable ? (
        <div className="executionForm">
          <label>Result<select value={result} onChange={(event) => setResult(Number(event.target.value))}><option value={1}>Passed</option><option value={2}>Failed</option><option value={3}>Blocked</option><option value={4}>Skipped</option></select></label>
          <label>Actual result<textarea rows={3} value={actualResult} onChange={(event) => setActualResult(event.target.value)} required /></label>
          <div className="formRow"><label>Notes<textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} /></label><label>Evidence reference<textarea rows={2} value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="Screenshot, ticket, log, URL…" /></label></div>
          <button className="linkButton saveResult" disabled={actualResult.trim().length < 2} onClick={() => void onSave(execution, { result, actualResult, notes, evidence })}>Save result</button>
        </div>
      ) : (
        <div className="recordedResult"><span className={`resultBadge ${execution.result.toLowerCase()}`}>{execution.result}</span><div><strong>Actual result</strong><p>{execution.actualResult || 'Pending execution'}</p>{execution.executedBy && <small>{execution.executedBy} · {execution.executedAtUtc ? new Date(execution.executedAtUtc).toLocaleString() : ''}</small>}</div></div>
      )}
    </article>
  )
}
