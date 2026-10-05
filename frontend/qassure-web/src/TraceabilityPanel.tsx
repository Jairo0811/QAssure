import { useEffect, useState } from 'react'
import { getTraceability } from './api'
import type { Project, TraceabilityResponse } from './api'

export default function TraceabilityPanel({ token, projects, selectedProject, selectedProjectId, onProjectChange }: { token: string; projects: Project[]; selectedProject: Project | null; selectedProjectId: string; onProjectChange: (id: string) => void }) {
  const [data, setData] = useState<TraceabilityResponse | null>(null); const [error, setError] = useState('')
  useEffect(() => { if (!selectedProjectId) return; getTraceability(token, selectedProjectId).then(setData).catch((e) => setError(e instanceof Error ? e.message : 'Unable to load traceability.')) }, [selectedProjectId])
  if (!projects.length) return <section className="panel emptyState"><h3>Create a project first</h3></section>
  return <><section className="projectPicker panel"><div><p className="eyebrow">PHASE 5 · PROJECT</p><h3>{selectedProject?.name}</h3></div><select value={selectedProjectId} onChange={(e) => onProjectChange(e.target.value)}>{projects.map((p) => <option key={p.id} value={p.id}>{p.key} · {p.name}</option>)}</select></section>{error && <div className="errorBox">{error}</div>}{data && <>
    <section className="metricGrid"><article className="metricCard"><strong>{data.summary.requirementCoverage}%</strong><span>Requirement coverage</span></article><article className="metricCard"><strong>{data.summary.executionCoverage}%</strong><span>Execution coverage</span></article><article className="metricCard"><strong>{data.summary.testCases}</strong><span>Test cases</span></article><article className="metricCard"><strong>{data.summary.openDefects}</strong><span>Open defects</span></article></section>
    <section className="panel matrixPanel"><div className="panelTitle"><div><p className="eyebrow">BIDIRECTIONAL TRACEABILITY</p><h3>Requirement → Risk → Test → Execution → Defect</h3></div></div><div className="matrixTable"><div className="matrixHead"><span>Requirement</span><span>Risks</span><span>Tests</span><span>Execution</span><span>Defects</span></div>{data.rows.map((row) => <div className={`matrixRow ${row.covered ? '' : 'uncovered'}`} key={row.requirementId}><span><strong>{row.code}</strong><small>{row.title}</small></span><span>{row.risks.map((x) => <em key={x.id}>{x.code} · {x.level}</em>)}</span><span>{row.testCases.map((x) => <em key={x.id}>{x.code} · {x.status}</em>)}</span><span>{row.executions} total · {row.passed} passed · {row.failed} failed</span><span>{row.openDefects} open</span></div>)}</div></section>
  </>}</>
}
