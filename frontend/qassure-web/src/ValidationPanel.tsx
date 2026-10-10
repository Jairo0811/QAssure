import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { createValidationEvidence, getValidationEvidence } from './api'
import type { Project, ValidationEvidence } from './api'
import { errorMessageEs, formatDateEs, labelEs } from './locale'

const categories = [
  { value: 1, key: 'Security', label: 'Seguridad' },
  { value: 2, key: 'Performance', label: 'Rendimiento' },
  { value: 3, key: 'Usability', label: 'Usabilidad' },
  { value: 4, key: 'UserAcceptance', label: 'Aceptación de usuario' },
] as const

export default function ValidationPanel({ token, projects, selectedProject, selectedProjectId, canLead, onProjectChange }: { token: string; projects: Project[]; selectedProject: Project | null; selectedProjectId: string; canLead: boolean; onProjectChange: (id: string) => void }) {
  const [items, setItems] = useState<ValidationEvidence[]>([])
  const [category, setCategory] = useState(1)
  const [result, setResult] = useState(1)
  const [title, setTitle] = useState('')
  const [evidence, setEvidence] = useState('')
  const [message, setMessage] = useState('')

  const load = () => {
    if (!selectedProjectId) return
    getValidationEvidence(token, selectedProjectId)
      .then(setItems)
      .catch((reason) => setMessage(errorMessageEs(reason, 'No se pudo cargar la evidencia de validación.')))
  }

  useEffect(load, [selectedProjectId])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!selectedProjectId) return

    try {
      await createValidationEvidence(token, selectedProjectId, { category, result, title, evidence })
      setTitle('')
      setEvidence('')
      setMessage('Evidencia de validación registrada.')
      load()
    } catch (reason) {
      setMessage(errorMessageEs(reason, 'No se pudo registrar la evidencia.'))
    }
  }

  const latest = new Map<string, ValidationEvidence>()
  for (const item of items) {
    if (!latest.has(item.category)) latest.set(item.category, item)
  }

  if (!projects.length) return <section className="panel emptyState"><h3>Crea un proyecto primero</h3></section>

  return (
    <>
      <section className="projectPicker panel">
        <div><p className="eyebrow">FASE 7 · VALIDACIÓN FINAL</p><h3>{selectedProject?.name}</h3></div>
        <select value={selectedProjectId} onChange={(event) => onProjectChange(event.target.value)}>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.key} · {project.name}</option>)}
        </select>
      </section>

      {message && <div className="notice">{message}</div>}

      <section className="validationGrid">
        {categories.map((categoryOption) => {
          const item = latest.get(categoryOption.key)
          return (
            <article className="panel validationCard" key={categoryOption.key}>
              <span className={`validationIcon ${item?.result.toLowerCase() ?? ''}`}>
                {item?.result === 'Passed' ? '✓' : item?.result === 'Failed' ? '×' : '○'}
              </span>
              <div>
                <p className="eyebrow">{categoryOption.label.toUpperCase()}</p>
                <h3>{item ? labelEs(item.result) : 'Sin evidencia'}</h3>
                <p className="muted">{item?.title ?? 'Registra evidencia formal de validación.'}</p>
              </div>
            </article>
          )
        })}
      </section>

      <section className="splitLayout">
        <div className="panel">
          <div className="panelTitle"><h3>Historial de evidencias de validación</h3><span>{items.length}</span></div>
          <div className="requirementsList">
            {!items.length && <p className="empty">Todavía no hay evidencias registradas.</p>}
            {items.map((item) => (
              <article className="requirementCard" key={item.id}>
                <div className="requirementTop">
                  <span className="itemCode">{labelEs(item.category)}</span>
                  <span className={`pill ${item.result.toLowerCase()}`}>{labelEs(item.result)}</span>
                </div>
                <h4>{item.title}</h4>
                <p>{item.evidence}</p>
                <footer><span>{item.executedBy}</span><span>{formatDateEs(item.executedAtUtc)}</span></footer>
              </article>
            ))}
          </div>
        </div>

        {canLead && (
          <form className="panel formPanel" onSubmit={submit}>
            <div className="panelTitle"><h3>Registrar validación</h3></div>
            <label>
              Categoría
              <select value={category} onChange={(event) => setCategory(Number(event.target.value))}>
                {categories.map((categoryOption) => <option key={categoryOption.value} value={categoryOption.value}>{categoryOption.label}</option>)}
              </select>
            </label>
            <label>Resultado<select value={result} onChange={(event) => setResult(Number(event.target.value))}><option value={1}>Aprobado</option><option value={2}>Fallido</option><option value={3}>Condicional</option></select></label>
            <label>Título<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
            <label>Evidencia<textarea rows={8} value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="Procedimiento, resultado, métricas, observaciones, referencia de evidencia…" required /></label>
            <button className="primary">Registrar evidencia</button>
          </form>
        )}
      </section>
    </>
  )
}
