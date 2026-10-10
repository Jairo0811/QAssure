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
import { errorMessageEs, formatDateEs, labelEs } from './locale'
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
  const [name, setName] = useState('Ciclo de regresión')
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
      setRuns([])
      setDetail(null)
      setSelectedRunId('')
      return
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
      setMessage(errorMessageEs(reason, 'No se pudieron cargar los ciclos de prueba.'))
    }
  }

  async function openRun(runId: string) {
    setSelectedRunId(runId)
    try {
      setDetail(await getTestRun(token, selectedProjectId, runId))
    } catch (reason) {
      setMessage(errorMessageEs(reason, 'No se pudo cargar el ciclo de prueba.'))
    }
  }

  async function createRun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const created = await createTestRun(token, selectedProjectId, { name, buildVersion, environment, type, testCaseIds: selectedCaseIds })
      setSelectedCaseIds([])
      setMessage(`Ciclo “${created.name}” creado con ${created.total} casos.`)
      await refreshRuns(created.id)
    } catch (reason) {
      setMessage(errorMessageEs(reason, 'No se pudo crear el ciclo de prueba.'))
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
      setMessage(`El ciclo de prueba ahora está ${labelEs(updated.status).toLowerCase()}.`)
      await refreshRuns(selectedRunId)
    } catch (reason) {
      setMessage(errorMessageEs(reason, 'No se pudo actualizar el ciclo de prueba.'))
    }
  }

  async function saveExecution(execution: TestExecution, payload: { result: number; actualResult: string; notes: string; evidence: string }) {
    if (!detail) return
    try {
      await recordTestExecution(token, selectedProjectId, detail.run.id, execution.id, payload)
      setMessage(`Ejecución de ${execution.testCaseCode} guardada.`)
      await refreshRuns(detail.run.id)
    } catch (reason) {
      setMessage(errorMessageEs(reason, 'No se pudo guardar la ejecución.'))
    }
  }

  if (projects.length === 0) {
    return (
      <section className="panel emptyState">
        <h3>Crea un proyecto primero</h3>
        <p>La evidencia de ejecución siempre pertenece a un proyecto de QA.</p>
      </section>
    )
  }

  return (
    <>
      <section className="projectPicker panel">
        <div>
          <p className="eyebrow">CONTEXTO DEL PROYECTO</p>
          <h3>{selectedProject?.name ?? 'Selecciona un proyecto'}</h3>
        </div>
        <select value={selectedProjectId} onChange={(event) => onProjectChange(event.target.value)}>
          {projects.map((project) => <option value={project.id} key={project.id}>{project.key} · {project.name}</option>)}
        </select>
      </section>

      {message && <div className="notice">{message}</div>}

      <section className="runMetrics">
        <article><strong>{runs.length}</strong><span>Ciclos de prueba</span></article>
        <article><strong>{runs.filter((run) => run.status === 'InProgress').length}</strong><span>En progreso</span></article>
        <article><strong>{runs.reduce((sum, run) => sum + run.failed, 0)}</strong><span>Ejecuciones fallidas</span></article>
        <article><strong>{runs.filter((run) => run.status === 'Completed').length}</strong><span>Ciclos completados</span></article>
      </section>

      <section className="runsLayout">
        <div className="panel">
          <div className="panelTitle"><h3>Ciclos de ejecución</h3><span>{runs.length}</span></div>
          <div className="runList">
            {runs.length === 0 && <p className="empty">Todavía no hay ciclos. Crea uno a partir de casos de prueba en estado Listo.</p>}
            {runs.map((run) => (
              <button key={run.id} className={`runItem ${run.id === selectedRunId ? 'runSelected' : ''}`} onClick={() => void openRun(run.id)}>
                <div>
                  <strong>{run.name}</strong>
                  <small>{labelEs(run.type)} · {labelEs(run.environment)} · compilación {run.buildVersion}</small>
                </div>
                <span className={`pill ${run.status.toLowerCase()}`}>{labelEs(run.status)}</span>
                <div className="runMini"><span>✓ {run.passed}</span><span>✕ {run.failed}</span><span>! {run.blocked}</span><span>○ {run.notRun}</span></div>
              </button>
            ))}
          </div>
        </div>

        <form className="panel formPanel" onSubmit={createRun}>
          <div className="panelTitle"><h3>Crear ciclo de prueba</h3></div>
          <label>Nombre del ciclo<input value={name} onChange={(event) => setName(event.target.value)} required /></label>
          <label>Compilación / versión<input value={buildVersion} onChange={(event) => setBuildVersion(event.target.value)} required /></label>
          <div className="formRow">
            <label>Entorno<select value={environment} onChange={(event) => setEnvironment(Number(event.target.value))}><option value={0}>Desarrollo</option><option value={1}>QA</option><option value={2}>Preproducción</option><option value={3}>Similar a producción</option></select></label>
            <label>Tipo de ciclo<select value={type} onChange={(event) => setType(Number(event.target.value))}><option value={1}>Prueba de humo</option><option value={2}>Regresión</option><option value={3}>Sistema</option><option value={4}>Aceptación</option></select></label>
          </div>
          <fieldset className="caseSelector">
            <legend>Casos de prueba listos</legend>
            {readyCases.length === 0 && <p className="muted">Marca casos como Listos antes de crear un ciclo.</p>}
            {readyCases.map((item) => (
              <label className="checkRow" key={item.id}>
                <input
                  type="checkbox"
                  checked={selectedCaseIds.includes(item.id)}
                  onChange={(event) => setSelectedCaseIds((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))}
                />
                <span><strong>{item.code}</strong> {item.title}</span>
              </label>
            ))}
          </fieldset>
          <button className="primary" type="submit" disabled={selectedCaseIds.length === 0}>Crear ciclo de ejecución</button>
        </form>
      </section>

      {detail && (
        <section className="panel executionBoard">
          <div className="runHeader">
            <div>
              <p className="eyebrow">CICLO ACTIVO</p>
              <h3>{detail.run.name}</h3>
              <p className="muted">{labelEs(detail.run.type)} · {labelEs(detail.run.environment)} · compilación {detail.run.buildVersion}</p>
            </div>
            <div className="runActions">
              <span className={`pill ${detail.run.status.toLowerCase()}`}>{labelEs(detail.run.status)}</span>
              {detail.run.status === 'Draft' && <button className="primary" onClick={() => void action('start')}>Iniciar ciclo</button>}
              {detail.run.status === 'InProgress' && <button className="primary" disabled={detail.run.notRun > 0} onClick={() => void action('complete')}>Completar ciclo</button>}
              {canLead && detail.run.status !== 'Completed' && detail.run.status !== 'Cancelled' && <button className="dangerButton" onClick={() => void action('cancel')}>Cancelar</button>}
            </div>
          </div>

          <div className="resultStrip">
            <span>Tasa de aprobación <strong>{detail.run.passRate}%</strong></span>
            <span>Aprobadas <strong>{detail.run.passed}</strong></span>
            <span>Fallidas <strong>{detail.run.failed}</strong></span>
            <span>Bloqueadas <strong>{detail.run.blocked}</strong></span>
            <span>Omitidas <strong>{detail.run.skipped}</strong></span>
            <span>Pendientes <strong>{detail.run.notRun}</strong></span>
          </div>

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
    setActualResult(execution.actualResult)
    setNotes(execution.notes)
    setEvidence(execution.evidence)
  }, [execution.id, execution.result, execution.actualResult, execution.notes, execution.evidence])

  return (
    <article className={`executionCard result${execution.result}`}>
      <div className="executionTitle">
        <div><span className="itemCode">{execution.testCaseCode}</span><h4>{execution.testCaseTitle}</h4></div>
        <span className={`priority priority${execution.priority}`}>{labelEs(execution.priority)}</span>
      </div>
      <div className="expectedBox"><strong>Resultado esperado</strong><p>{execution.expectedResult}</p></div>

      {editable ? (
        <div className="executionForm">
          <label>Resultado<select value={result} onChange={(event) => setResult(Number(event.target.value))}><option value={1}>Aprobado</option><option value={2}>Fallido</option><option value={3}>Bloqueado</option><option value={4}>Omitido</option></select></label>
          <label>Resultado real<textarea rows={3} value={actualResult} onChange={(event) => setActualResult(event.target.value)} required /></label>
          <div className="formRow">
            <label>Notas<textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
            <label>Referencia de evidencia<textarea rows={2} value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="Captura, ticket, log, URL…" /></label>
          </div>
          <button className="linkButton saveResult" disabled={actualResult.trim().length < 2} onClick={() => void onSave(execution, { result, actualResult, notes, evidence })}>Guardar resultado</button>
        </div>
      ) : (
        <div className="recordedResult">
          <span className={`resultBadge ${execution.result.toLowerCase()}`}>{labelEs(execution.result)}</span>
          <div>
            <strong>Resultado real</strong>
            <p>{execution.actualResult || 'Ejecución pendiente'}</p>
            {execution.executedBy && <small>{execution.executedBy} · {execution.executedAtUtc ? formatDateEs(execution.executedAtUtc) : ''}</small>}
          </div>
        </div>
      )}
    </article>
  )
}
