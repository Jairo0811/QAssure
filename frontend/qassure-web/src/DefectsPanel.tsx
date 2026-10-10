import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { createDefect, getDefects, getTestRun, getTestRuns, resolveDefect, startDefect, verifyDefectRetest } from './api'
import type { Defect, Project, TestExecution } from './api'
import { errorMessageEs, labelEs } from './locale'

interface Props {
  token: string
  projects: Project[]
  selectedProject: Project | null
  selectedProjectId: string
  canLead: boolean
  onProjectChange: (id: string) => void
}

export default function DefectsPanel({ token, projects, selectedProject, selectedProjectId, canLead, onProjectChange }: Props) {
  const [defects, setDefects] = useState<Defect[]>([])
  const [executions, setExecutions] = useState<TestExecution[]>([])
  const [executionId, setExecutionId] = useState('')
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [severity, setSeverity] = useState(3)
  const [priority, setPriority] = useState(3)
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState('')
  const [message, setMessage] = useState('')

  async function load() {
    if (!selectedProjectId) return
    try {
      const [nextDefects, runs] = await Promise.all([
        getDefects(token, selectedProjectId),
        getTestRuns(token, selectedProjectId),
      ])
      const details = await Promise.all(runs.map((run) => getTestRun(token, selectedProjectId, run.id)))
      setDefects(nextDefects)
      setExecutions(details.flatMap((item) => item.executions))
    } catch (reason) {
      setMessage(errorMessageEs(reason, 'No se pudieron cargar los defectos.'))
    }
  }

  useEffect(() => {
    void load()
  }, [selectedProjectId])

  const eligible = useMemo(
    () => executions.filter((execution) => execution.result === 'Failed' || execution.result === 'Blocked'),
    [executions],
  )
  const finalExecutions = useMemo(
    () => executions.filter((execution) => execution.result !== 'NotRun'),
    [executions],
  )

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!selectedProjectId || !executionId) return

    try {
      await createDefect(token, selectedProjectId, {
        executionId,
        code,
        title,
        severity,
        priority,
        description,
        reproductionSteps: steps,
      })
      setCode('')
      setTitle('')
      setDescription('')
      setSteps('')
      setMessage('Defecto registrado a partir de la evidencia de ejecución.')
      await load()
    } catch (reason) {
      setMessage(errorMessageEs(reason, 'No se pudo crear el defecto.'))
    }
  }

  if (!projects.length) {
    return <section className="panel emptyState"><h3>Crea un proyecto primero</h3></section>
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

      <section className="splitLayout defectLayout">
        <div className="panel">
          <div className="panelTitle">
            <div><p className="eyebrow">FASE 4</p><h3>Ciclo de vida de defectos</h3></div>
            <span>{defects.length}</span>
          </div>

          <div className="requirementsList">
            {!defects.length && <p className="empty">No hay defectos registrados.</p>}
            {defects.map((defect) => (
              <article className={`defectCard severity${defect.severity}`} key={defect.id}>
                <div className="requirementTop">
                  <span className="itemCode">{defect.code}</span>
                  <span className={`priority priority${defect.severity}`}>Sev. {defect.severity}</span>
                  <span className={`pill ${defect.status.toLowerCase()}`}>{labelEs(defect.status)}</span>
                </div>
                <h4>{defect.title}</h4>
                <p>{defect.description}</p>
                <div className="traceLinks">
                  <span>Prueba: {defect.testCaseCode || defect.testCaseId.slice(0, 8)}</span>
                  <span>Ejecución original ✓</span>
                  <span>{defect.retestExecutionId ? 'Re-prueba ✓' : 'Re-prueba ○'}</span>
                </div>
                <details>
                  <summary>Evidencia</summary>
                  <div className="testDetails">
                    <strong>Resultado esperado</strong><p>{defect.expectedResult}</p>
                    <strong>Resultado real</strong><p>{defect.actualResult}</p>
                    <strong>Pasos de reproducción</strong><p>{defect.reproductionSteps}</p>
                    {defect.resolution && <><strong>Resolución</strong><p>{defect.resolution}</p></>}
                  </div>
                </details>
                <footer className="inlineActions">
                  {(defect.status === 'New' || defect.status === 'Reopened') && (
                    <button
                      className="linkButton"
                      onClick={() => {
                        const who = prompt('Asignar a')
                        if (who) void startDefect(token, selectedProjectId, defect.id, who).then(load)
                      }}
                    >
                      Iniciar trabajo
                    </button>
                  )}
                  {canLead && defect.status !== 'Closed' && defect.status !== 'Resolved' && (
                    <button
                      className="linkButton"
                      onClick={() => {
                        const text = prompt('Resolución')
                        if (text) void resolveDefect(token, selectedProjectId, defect.id, text).then(load)
                      }}
                    >
                      Resolver
                    </button>
                  )}
                  {defect.status === 'Resolved' && (
                    <button
                      className="linkButton"
                      onClick={() => {
                        const candidates = finalExecutions.filter((execution) => execution.testCaseId === defect.testCaseId)
                        const id = prompt(`ID de ejecución de re-prueba (${candidates.length} candidatas)`, candidates.at(-1)?.id ?? '')
                        if (id) void verifyDefectRetest(token, selectedProjectId, defect.id, id).then(load)
                      }}
                    >
                      Verificar re-prueba
                    </button>
                  )}
                </footer>
              </article>
            ))}
          </div>
        </div>

        <form className="panel formPanel" onSubmit={submit}>
          <div className="panelTitle"><h3>Crear defecto</h3></div>
          <label>
            Ejecución fallida/bloqueada
            <select value={executionId} onChange={(event) => setExecutionId(event.target.value)} required>
              <option value="">Selecciona evidencia</option>
              {eligible.map((execution) => (
                <option value={execution.id} key={execution.id}>
                  {execution.testCaseCode} · {labelEs(execution.result)} · {execution.actualResult.slice(0, 50)}
                </option>
              ))}
            </select>
          </label>
          <label>Código<input value={code} onChange={(event) => setCode(event.target.value)} placeholder="DEF-001" required /></label>
          <label>Título<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
          <div className="formRow">
            <label>Severidad<select value={severity} onChange={(event) => setSeverity(Number(event.target.value))}><option value={1}>Baja</option><option value={2}>Media</option><option value={3}>Alta</option><option value={4}>Crítica</option></select></label>
            <label>Prioridad<select value={priority} onChange={(event) => setPriority(Number(event.target.value))}><option value={1}>Baja</option><option value={2}>Media</option><option value={3}>Alta</option><option value={4}>Crítica</option></select></label>
          </div>
          <label>Descripción<textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} required /></label>
          <label>Pasos de reproducción<textarea rows={5} value={steps} onChange={(event) => setSteps(event.target.value)} required /></label>
          <button className="primary">Registrar defecto</button>
        </form>
      </section>
    </>
  )
}
