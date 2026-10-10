import { useEffect, useState } from 'react'
import { getQualityReport } from './api'
import type { Project, QualityReport } from './api'
import { errorMessageEs, formatDateEs, gateEvidenceEs, gateNameEs, labelEs } from './locale'

export default function ReportsPanel({ token, projects, selectedProject, selectedProjectId, onProjectChange }: { token: string; projects: Project[]; selectedProject: Project | null; selectedProjectId: string; onProjectChange: (id: string) => void }) {
  const [report, setReport] = useState<QualityReport | null>(null)
  const [error, setError] = useState('')

  const load = () => {
    if (!selectedProjectId) return
    setError('')
    getQualityReport(token, selectedProjectId)
      .then(setReport)
      .catch((reason) => setError(errorMessageEs(reason, 'No se pudo generar el informe de calidad.')))
  }

  useEffect(load, [selectedProjectId])

  if (!projects.length) return <section className="panel emptyState"><h3>Crea un proyecto primero</h3></section>

  return (
    <>
      <section className="projectPicker panel">
        <div><p className="eyebrow">FASE 6 · INFORME DE CALIDAD</p><h3>{selectedProject?.name}</h3></div>
        <div className="inlineActions">
          <select value={selectedProjectId} onChange={(event) => onProjectChange(event.target.value)}>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.key} · {project.name}</option>)}
          </select>
          <button className="primary" onClick={load}>Actualizar</button>
        </div>
      </section>

      {error && <div className="errorBox">{error}</div>}

      {report && (
        <>
          <section className="gateHero panel">
            <div>
              <p className="eyebrow">PUERTA DE CALIDAD DE LANZAMIENTO</p>
              <h3>{labelEs(report.gate.decision)}</h3>
              <p className="muted">Generado el {formatDateEs(report.generatedAtUtc)}</p>
            </div>
            <div className={`gateOrb gate${report.gate.decision}`}>
              {report.gate.decision === 'Ready' ? '✓' : report.gate.decision === 'Blocked' ? '!' : '~'}
            </div>
          </section>

          <section className="metricGrid">
            <article className="metricCard"><strong>{report.metrics.requirementCoverage}%</strong><span>Cobertura de requisitos</span></article>
            <article className="metricCard"><strong>{report.metrics.passRate}%</strong><span>Tasa de aprobación</span></article>
            <article className="metricCard"><strong>{report.metrics.openDefects}</strong><span>Defectos abiertos</span></article>
            <article className="metricCard"><strong>{report.metrics.validationAreasPassed}/4</strong><span>Áreas de validación</span></article>
          </section>

          <section className="panel">
            <div className="panelTitle"><h3>Comprobaciones de la puerta de calidad</h3></div>
            <div className="gateChecks">
              {report.gate.checks.map((check) => (
                <article className={check.passed ? 'gateCheck pass' : 'gateCheck fail'} key={check.name}>
                  <span>{check.passed ? '✓' : '×'}</span>
                  <div>
                    <strong>{gateNameEs(check.name)}</strong>
                    <small>{gateEvidenceEs(check.evidence)}</small>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  )
}
