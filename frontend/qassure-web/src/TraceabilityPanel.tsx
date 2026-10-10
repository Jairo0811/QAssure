import { useEffect, useState } from 'react'
import { getTraceability } from './api'
import type { Project, TraceabilityResponse } from './api'
import { errorMessageEs, labelEs } from './locale'

export default function TraceabilityPanel({ token, projects, selectedProject, selectedProjectId, onProjectChange }: { token: string; projects: Project[]; selectedProject: Project | null; selectedProjectId: string; onProjectChange: (id: string) => void }) {
  const [data, setData] = useState<TraceabilityResponse | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!selectedProjectId) return
    getTraceability(token, selectedProjectId)
      .then(setData)
      .catch((reason) => setError(errorMessageEs(reason, 'No se pudo cargar la trazabilidad.')))
  }, [selectedProjectId])

  if (!projects.length) return <section className="panel emptyState"><h3>Crea un proyecto primero</h3></section>

  return (
    <>
      <section className="projectPicker panel">
        <div><p className="eyebrow">FASE 5 · PROYECTO</p><h3>{selectedProject?.name}</h3></div>
        <select value={selectedProjectId} onChange={(event) => onProjectChange(event.target.value)}>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.key} · {project.name}</option>)}
        </select>
      </section>

      {error && <div className="errorBox">{error}</div>}

      {data && (
        <>
          <section className="metricGrid">
            <article className="metricCard"><strong>{data.summary.requirementCoverage}%</strong><span>Cobertura de requisitos</span></article>
            <article className="metricCard"><strong>{data.summary.executionCoverage}%</strong><span>Cobertura de ejecución</span></article>
            <article className="metricCard"><strong>{data.summary.testCases}</strong><span>Casos de prueba</span></article>
            <article className="metricCard"><strong>{data.summary.openDefects}</strong><span>Defectos abiertos</span></article>
          </section>

          <section className="panel matrixPanel">
            <div className="panelTitle">
              <div>
                <p className="eyebrow">TRAZABILIDAD BIDIRECCIONAL</p>
                <h3>Requisito → Riesgo → Prueba → Ejecución → Defecto</h3>
              </div>
            </div>
            <div className="matrixTable">
              <div className="matrixHead">
                <span>Requisito</span>
                <span>Riesgos</span>
                <span>Pruebas</span>
                <span>Ejecución</span>
                <span>Defectos</span>
              </div>
              {data.rows.map((row) => (
                <div className={`matrixRow ${row.covered ? '' : 'uncovered'}`} key={row.requirementId}>
                  <span><strong>{row.code}</strong><small>{row.title}</small></span>
                  <span>{row.risks.map((risk) => <em key={risk.id}>{risk.code} · {labelEs(risk.level)}</em>)}</span>
                  <span>{row.testCases.map((testCase) => <em key={testCase.id}>{testCase.code} · {labelEs(testCase.status)}</em>)}</span>
                  <span>{row.executions} total · {row.passed} aprobadas · {row.failed} fallidas</span>
                  <span>{row.openDefects} abiertos</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  )
}
