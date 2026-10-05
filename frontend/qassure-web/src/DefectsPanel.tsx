import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { createDefect, getDefects, getTestRun, getTestRuns, resolveDefect, startDefect, verifyDefectRetest } from './api'
import type { Defect, Project, TestExecution } from './api'

interface Props { token: string; projects: Project[]; selectedProject: Project | null; selectedProjectId: string; canLead: boolean; onProjectChange: (id: string) => void }

export default function DefectsPanel({ token, projects, selectedProject, selectedProjectId, canLead, onProjectChange }: Props) {
  const [defects, setDefects] = useState<Defect[]>([])
  const [executions, setExecutions] = useState<TestExecution[]>([])
  const [executionId, setExecutionId] = useState(''); const [code, setCode] = useState(''); const [title, setTitle] = useState('')
  const [severity, setSeverity] = useState(3); const [priority, setPriority] = useState(3); const [description, setDescription] = useState(''); const [steps, setSteps] = useState('')
  const [message, setMessage] = useState('')

  async function load() {
    if (!selectedProjectId) return
    try {
      const [nextDefects, runs] = await Promise.all([getDefects(token, selectedProjectId), getTestRuns(token, selectedProjectId)])
      const details = await Promise.all(runs.map((run) => getTestRun(token, selectedProjectId, run.id)))
      setDefects(nextDefects); setExecutions(details.flatMap((x) => x.executions))
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to load defects.') }
  }
  useEffect(() => { void load() }, [selectedProjectId])

  const eligible = useMemo(() => executions.filter((x) => x.result === 'Failed' || x.result === 'Blocked'), [executions])
  const finalExecutions = useMemo(() => executions.filter((x) => x.result !== 'NotRun'), [executions])

  async function submit(event: FormEvent) {
    event.preventDefault(); if (!selectedProjectId || !executionId) return
    try { await createDefect(token, selectedProjectId, { executionId, code, title, severity, priority, description, reproductionSteps: steps }); setCode(''); setTitle(''); setDescription(''); setSteps(''); setMessage('Defect registered from execution evidence.'); await load() }
    catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to create defect.') }
  }

  if (!projects.length) return <section className="panel emptyState"><h3>Create a project first</h3></section>
  return <>
    <section className="projectPicker panel"><div><p className="eyebrow">PROJECT CONTEXT</p><h3>{selectedProject?.name ?? 'Select project'}</h3></div><select value={selectedProjectId} onChange={(e) => onProjectChange(e.target.value)}>{projects.map((p) => <option value={p.id} key={p.id}>{p.key} · {p.name}</option>)}</select></section>
    {message && <div className="notice">{message}</div>}
    <section className="splitLayout defectLayout">
      <div className="panel"><div className="panelTitle"><div><p className="eyebrow">PHASE 4</p><h3>Defect lifecycle</h3></div><span>{defects.length}</span></div>
        <div className="requirementsList">{!defects.length && <p className="empty">No defects registered.</p>}{defects.map((d) => <article className={`defectCard severity${d.severity}`} key={d.id}>
          <div className="requirementTop"><span className="itemCode">{d.code}</span><span className={`priority priority${d.severity}`}>{d.severity}</span><span className={`pill ${d.status.toLowerCase()}`}>{d.status}</span></div>
          <h4>{d.title}</h4><p>{d.description}</p><div className="traceLinks"><span>Test: {d.testCaseCode || d.testCaseId.slice(0,8)}</span><span>Original execution ✓</span><span>{d.retestExecutionId ? 'Re-test ✓' : 'Re-test ○'}</span></div>
          <details><summary>Evidence</summary><div className="testDetails"><strong>Expected</strong><p>{d.expectedResult}</p><strong>Actual</strong><p>{d.actualResult}</p><strong>Reproduction</strong><p>{d.reproductionSteps}</p>{d.resolution && <><strong>Resolution</strong><p>{d.resolution}</p></>}</div></details>
          <footer className="inlineActions">
            {(d.status === 'New' || d.status === 'Reopened') && <button className="linkButton" onClick={() => { const who = prompt('Assign to'); if (who) void startDefect(token, selectedProjectId, d.id, who).then(load) }}>Start work</button>}
            {canLead && d.status !== 'Closed' && d.status !== 'Resolved' && <button className="linkButton" onClick={() => { const text = prompt('Resolution'); if (text) void resolveDefect(token, selectedProjectId, d.id, text).then(load) }}>Resolve</button>}
            {d.status === 'Resolved' && <button className="linkButton" onClick={() => { const candidates = finalExecutions.filter((x) => x.testCaseId === d.testCaseId); const id = prompt(`Re-test execution id (${candidates.length} candidates)`, candidates.at(-1)?.id ?? ''); if (id) void verifyDefectRetest(token, selectedProjectId, d.id, id).then(load) }}>Verify re-test</button>}
          </footer>
        </article>)}</div>
      </div>
      <form className="panel formPanel" onSubmit={submit}><div className="panelTitle"><h3>Create defect</h3></div>
        <label>Failed/Blocked execution<select value={executionId} onChange={(e) => setExecutionId(e.target.value)} required><option value="">Select evidence</option>{eligible.map((x) => <option value={x.id} key={x.id}>{x.testCaseCode} · {x.result} · {x.actualResult.slice(0,50)}</option>)}</select></label>
        <label>Code<input value={code} onChange={(e) => setCode(e.target.value)} placeholder="DEF-001" required /></label><label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
        <div className="formRow"><label>Severity<select value={severity} onChange={(e) => setSeverity(Number(e.target.value))}><option value={1}>Low</option><option value={2}>Medium</option><option value={3}>High</option><option value={4}>Critical</option></select></label><label>Priority<select value={priority} onChange={(e) => setPriority(Number(e.target.value))}><option value={1}>Low</option><option value={2}>Medium</option><option value={3}>High</option><option value={4}>Critical</option></select></label></div>
        <label>Description<textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} required /></label><label>Reproduction steps<textarea rows={5} value={steps} onChange={(e) => setSteps(e.target.value)} required /></label><button className="primary">Register defect</button>
      </form>
    </section>
  </>
}
