import { useEffect, useState } from 'react'
import { getQualityReport } from './api'
import type { Project, QualityReport } from './api'

export default function ReportsPanel({ token, projects, selectedProject, selectedProjectId, onProjectChange }: { token: string; projects: Project[]; selectedProject: Project | null; selectedProjectId: string; onProjectChange: (id: string) => void }) {
  const [report, setReport] = useState<QualityReport | null>(null); const [error, setError] = useState('')
  const load = () => { if (!selectedProjectId) return; getQualityReport(token, selectedProjectId).then(setReport).catch((e) => setError(e instanceof Error ? e.message : 'Unable to build report.')) }
  useEffect(load, [selectedProjectId])
  if (!projects.length) return <section className="panel emptyState"><h3>Create a project first</h3></section>
  return <><section className="projectPicker panel"><div><p className="eyebrow">PHASE 6 · QUALITY REPORT</p><h3>{selectedProject?.name}</h3></div><div className="inlineActions"><select value={selectedProjectId} onChange={(e) => onProjectChange(e.target.value)}>{projects.map((p) => <option key={p.id} value={p.id}>{p.key} · {p.name}</option>)}</select><button className="primary" onClick={load}>Refresh</button></div></section>{error && <div className="errorBox">{error}</div>}{report && <>
    <section className="gateHero panel"><div><p className="eyebrow">RELEASE QUALITY GATE</p><h3>{report.gate.decision}</h3><p className="muted">Generated {new Date(report.generatedAtUtc).toLocaleString()}</p></div><div className={`gateOrb gate${report.gate.decision}`}>{report.gate.decision === 'Ready' ? '✓' : report.gate.decision === 'Blocked' ? '!' : '~'}</div></section>
    <section className="metricGrid"><article className="metricCard"><strong>{report.metrics.requirementCoverage}%</strong><span>Requirement coverage</span></article><article className="metricCard"><strong>{report.metrics.passRate}%</strong><span>Pass rate</span></article><article className="metricCard"><strong>{report.metrics.openDefects}</strong><span>Open defects</span></article><article className="metricCard"><strong>{report.metrics.validationAreasPassed}/4</strong><span>Validation areas</span></article></section>
    <section className="panel"><div className="panelTitle"><h3>Gate checks</h3></div><div className="gateChecks">{report.gate.checks.map((check) => <article className={check.passed ? 'gateCheck pass' : 'gateCheck fail'} key={check.name}><span>{check.passed ? '✓' : '×'}</span><div><strong>{check.name}</strong><small>{check.evidence}</small></div></article>)}</div></section>
  </>}</>
}
