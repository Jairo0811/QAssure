import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import {
  getDefects,
  getQualityReport,
  getTestRuns,
  getTraceability,
  getValidationEvidence,
} from './api'
import type {
  Defect,
  Project,
  QualityReport,
  Requirement,
  RiskItem,
  TestCase,
  TestRunSummary,
  TraceabilityResponse,
  ValidationEvidence,
} from './api'
import { errorMessageEs, formatDateEs, gateEvidenceEs, gateNameEs, labelEs } from './locale'

type DashboardTarget = 'projects' | 'requirements' | 'risks' | 'testCases' | 'testRuns' | 'defects' | 'traceability' | 'reports' | 'validation'

type IconName = 'home' | 'folder' | 'requirement' | 'risk' | 'test' | 'run' | 'bug' | 'trace' | 'report' | 'validation' | 'search' | 'shield' | 'pulse'

interface Props {
  token: string
  projects: Project[]
  selectedProject: Project | null
  selectedProjectId: string
  requirements: Requirement[]
  risks: RiskItem[]
  testCases: TestCase[]
  onProjectChange: (id: string) => void
  onNavigate: (view: DashboardTarget) => void
}

const modules: Array<{ label: string; target: DashboardTarget; icon: IconName; keywords: string }> = [
  { label: 'Proyectos QA', target: 'projects', icon: 'folder', keywords: 'proyectos qa calidad' },
  { label: 'Requisitos', target: 'requirements', icon: 'requirement', keywords: 'requisitos cobertura requerimientos' },
  { label: 'Análisis de riesgos', target: 'risks', icon: 'risk', keywords: 'riesgos probabilidad impacto' },
  { label: 'Casos de prueba', target: 'testCases', icon: 'test', keywords: 'casos pruebas diseño testing' },
  { label: 'Ciclos de prueba', target: 'testRuns', icon: 'run', keywords: 'ciclos ejecucion regression smoke' },
  { label: 'Defectos', target: 'defects', icon: 'bug', keywords: 'defectos bugs incidencias repruebas' },
  { label: 'Trazabilidad', target: 'traceability', icon: 'trace', keywords: 'trazabilidad matriz cobertura' },
  { label: 'Reporte de calidad', target: 'reports', icon: 'report', keywords: 'reporte informe gate calidad release' },
  { label: 'Validación final', target: 'validation', icon: 'validation', keywords: 'validacion seguridad rendimiento usabilidad uat' },
]

export default function QaDashboard({ token, projects, selectedProject, selectedProjectId, requirements, risks, testCases, onProjectChange, onNavigate }: Props) {
  const [runs, setRuns] = useState<TestRunSummary[]>([])
  const [defects, setDefects] = useState<Defect[]>([])
  const [report, setReport] = useState<QualityReport | null>(null)
  const [traceability, setTraceability] = useState<TraceabilityResponse | null>(null)
  const [validation, setValidation] = useState<ValidationEvidence[]>([])
  const [loading, setLoading] = useState(false)
  const [loadMessage, setLoadMessage] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!selectedProjectId) {
      setRuns([])
      setDefects([])
      setReport(null)
      setTraceability(null)
      setValidation([])
      return
    }

    let cancelled = false
    setLoading(true)
    setLoadMessage('')

    void Promise.allSettled([
      getTestRuns(token, selectedProjectId),
      getDefects(token, selectedProjectId),
      getQualityReport(token, selectedProjectId),
      getTraceability(token, selectedProjectId),
      getValidationEvidence(token, selectedProjectId),
    ]).then((results) => {
      if (cancelled) return
      const [runResult, defectResult, reportResult, traceResult, validationResult] = results
      if (runResult.status === 'fulfilled') setRuns(runResult.value)
      if (defectResult.status === 'fulfilled') setDefects(defectResult.value)
      if (reportResult.status === 'fulfilled') setReport(reportResult.value)
      if (traceResult.status === 'fulfilled') setTraceability(traceResult.value)
      if (validationResult.status === 'fulfilled') setValidation(validationResult.value)
      if (results.some((result) => result.status === 'rejected')) {
        const rejected = results.find((result) => result.status === 'rejected')
        setLoadMessage(errorMessageEs(rejected && rejected.status === 'rejected' ? rejected.reason : null, 'Algunas métricas del panel no pudieron cargarse.'))
      }
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [selectedProjectId, token])

  const derived = useMemo(() => {
    const coveredIds = new Set(testCases.flatMap((item) => item.requirementId ? [item.requirementId] : []))
    const fallbackCoverage = requirements.length ? Math.round(coveredIds.size * 100 / requirements.length) : 0
    const totalRunCases = runs.reduce((sum, run) => sum + run.total, 0)
    const pending = runs.reduce((sum, run) => sum + run.notRun, 0)
    const executed = Math.max(0, totalRunCases - pending)
    const executionCoverage = totalRunCases ? Math.round(executed * 100 / totalRunCases) : 0
    const passRate = report?.metrics.passRate ?? (executed ? Math.round(runs.reduce((sum, run) => sum + run.passed, 0) * 100 / executed) : 0)
    const requirementCoverage = report?.metrics.requirementCoverage ?? traceability?.summary.requirementCoverage ?? fallbackCoverage
    const openDefects = report?.metrics.openDefects ?? defects.filter((item) => item.status !== 'Closed').length
    const criticalOpenDefects = report?.metrics.criticalOpenDefects ?? defects.filter((item) => item.severity === 'Critical' && item.status !== 'Closed').length
    const criticalOpenRisks = risks.filter((item) => item.level === 'Critical' && item.status === 'Open').length
    const approvedRequirements = report?.metrics.approvedRequirements ?? requirements.filter((item) => item.status === 'Approved').length
    const readyCases = report?.metrics.readyTestCases ?? testCases.filter((item) => item.status === 'Ready').length
    const completedRuns = report?.metrics.completedRuns ?? runs.filter((item) => item.status === 'Completed').length
    const validationPassed = report?.metrics.validationAreasPassed ?? new Set(validation.filter((item) => item.result === 'Passed').map((item) => item.category)).size
    const currentRun = runs.find((item) => item.status === 'InProgress') ?? runs[0] ?? null
    const currentProgress = currentRun?.total ? Math.round((currentRun.total - currentRun.notRun) * 100 / currentRun.total) : 0

    return {
      requirementCoverage,
      executionCoverage,
      passRate,
      openDefects,
      criticalOpenDefects,
      criticalOpenRisks,
      approvedRequirements,
      readyCases,
      completedRuns,
      validationPassed,
      currentRun,
      currentProgress,
      totalRunCases,
      executed,
    }
  }, [defects, report, requirements, risks, runs, testCases, traceability, validation])

  const filteredModules = query.trim()
    ? modules.filter((item) => `${item.label} ${item.keywords}`.toLowerCase().includes(query.trim().toLowerCase()))
    : []

  function searchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && filteredModules.length) {
      onNavigate(filteredModules[0].target)
      setQuery('')
    }
    if (event.key === 'Escape') setQuery('')
  }

  if (!projects.length) {
    return (
      <section className="qaEmptyLaunch panel">
        <div className="qaEmptyMark"><span>Q</span><b>✓</b></div>
        <p className="eyebrow">CENTRO DE CONTROL QA</p>
        <h3>Crea tu primer proyecto de calidad</h3>
        <p>QAssure conectará requisitos, riesgos, casos, ejecuciones, defectos, trazabilidad y validación en un mismo flujo.</p>
        <button className="primary" onClick={() => onNavigate('projects')}>Crear proyecto QA</button>
      </section>
    )
  }

  const gateDecision = report?.gate.decision ?? 'Conditional'
  const gateReady = gateDecision === 'Ready'
  const activity = runs.slice(0, 8).reverse()
  const sparkValues = activity.length ? activity.map((run) => run.passRate) : [0, 0, 0, 0, 0, 0]
  const latestEvidence = validation.slice(0, 4)
  const traceRows = traceability?.rows.slice(0, 5) ?? []

  return (
    <div className="qaDashboard">
      <section className="qaCommandBar">
        <div className="qaSearchWrap">
          <Glyph name="search" />
          <input
            aria-label="Buscar módulos de QAssure"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={searchKeyDown}
            placeholder="Buscar proyectos, requisitos, casos de prueba…"
          />
          <kbd>Enter</kbd>
          {!!filteredModules.length && (
            <div className="qaSearchResults">
              {filteredModules.slice(0, 5).map((item) => (
                <button key={item.target} onClick={() => { onNavigate(item.target); setQuery('') }}>
                  <Glyph name={item.icon} /><span>{item.label}</span><b>↗</b>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="qaCommandStatus"><span className="qaLiveDot" /> Plataforma QA operativa</div>
      </section>

      {loadMessage && <div className="notice">{loadMessage}</div>}

      <section className="qaHero">
        <div className="qaHeroCopy">
          <p className="eyebrow">QASSURE · SOFTWARE QUALITY ASSURANCE</p>
          <h1>Verifica. <span>Valida.</span> <em>Asegura.</em></h1>
          <p>Gestión integral de calidad de software desde los requisitos hasta la liberación.</p>
          <div className="qaHeroChips">
            <span><Glyph name="shield" /> Pruebas basadas en riesgo</span>
            <span><Glyph name="bug" /> Defecto ↔ re-prueba</span>
            <span><Glyph name="trace" /> Trazabilidad bidireccional</span>
            <span><Glyph name="validation" /> Validación final</span>
          </div>
        </div>
        <div className="qaHeroLogo" aria-hidden="true"><span>Q</span><b>✓</b></div>
        <article className="qaCurrentProject">
          <div className="qaCardHead">
            <div><small>PROYECTO ACTUAL</small><strong>{selectedProject?.name ?? 'Proyecto QA'}</strong></div>
            <span className="qaStatusChip"><i /> {labelEs(derived.currentRun?.status ?? selectedProject?.status ?? 'Active')}</span>
          </div>
          <select value={selectedProjectId} onChange={(event) => onProjectChange(event.target.value)}>
            {projects.map((project) => <option value={project.id} key={project.id}>{project.key} · {project.name}</option>)}
          </select>
          <div className="qaProjectMeta"><span>Versión {selectedProject?.version}</span><span>{labelEs(selectedProject?.criticality)}</span></div>
          <div className="qaProgressLabel"><span>Progreso del ciclo actual</span><strong>{derived.currentProgress}%</strong></div>
          <div className="qaProgress"><i style={{ width: `${derived.currentProgress}%` }} /></div>
          <small>{derived.currentRun ? `${labelEs(derived.currentRun.type)} · ${labelEs(derived.currentRun.environment)}` : 'Aún no hay un ciclo de prueba activo'}</small>
        </article>
      </section>

      <section className="qaKpiGrid">
        <KpiCard icon="requirement" tone="teal" label="Requisitos" value={requirements.length} percent={derived.requirementCoverage} detail={`${derived.approvedRequirements} aprobados`} onClick={() => onNavigate('requirements')} />
        <KpiCard icon="test" tone="blue" label="Casos de prueba" value={testCases.length} percent={derived.passRate} detail={`${derived.readyCases} listos`} onClick={() => onNavigate('testCases')} />
        <KpiCard icon="bug" tone="red" label="Defectos" value={derived.openDefects} percent={Math.max(0, 100 - Math.min(100, derived.openDefects * 8))} detail={`${derived.criticalOpenDefects} críticos abiertos`} onClick={() => onNavigate('defects')} />
        <KpiCard icon="trace" tone="cyan" label="Cobertura de requisitos" value={`${derived.requirementCoverage}%`} percent={derived.requirementCoverage} detail={`${traceability?.summary.coveredRequirements ?? 0} / ${traceability?.summary.requirements ?? requirements.length} cubiertos`} onClick={() => onNavigate('traceability')} />
      </section>

      <section className="qaMiddleGrid">
        <article className="qaGlassCard qaExecutionChart">
          <div className="qaCardHead"><div><small>EJECUCIÓN DE CASOS DE PRUEBA</small><strong>Actividad de los últimos ciclos</strong></div><span className="qaTinyBadge"><Glyph name="pulse" /> En vivo</span></div>
          {activity.length ? (
            <div className="qaActivityPlot">
              <svg viewBox="0 0 420 100" preserveAspectRatio="none" aria-hidden="true">
                <defs><linearGradient id="qaSparkGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#2be5dc" stopOpacity=".42"/><stop offset="1" stopColor="#2be5dc" stopOpacity="0"/></linearGradient></defs>
                <path d={`${sparkPath(sparkValues, 420, 100)} L420 100 L0 100 Z`} fill="url(#qaSparkGradient)" />
                <path d={sparkPath(sparkValues, 420, 100)} fill="none" stroke="#42e9df" strokeWidth="3" vectorEffect="non-scaling-stroke" />
              </svg>
              <div className="qaRunBars">
                {activity.map((run) => {
                  const max = Math.max(1, run.total)
                  return <div className="qaRunBar" key={run.id} title={`${run.name}: ${run.passRate}%`}>
                    <span className="pass" style={{ height: `${Math.max(4, run.passed * 100 / max)}%` }} />
                    <span className="fail" style={{ height: `${run.failed * 100 / max}%` }} />
                    <span className="block" style={{ height: `${run.blocked * 100 / max}%` }} />
                    <small>{run.passRate}%</small>
                  </div>
                })}
              </div>
            </div>
          ) : <div className="qaNoData">Crea y ejecuta un ciclo de pruebas para visualizar actividad.</div>}
          <div className="qaLegend"><span><i className="pass" /> Aprobadas</span><span><i className="fail" /> Fallidas</span><span><i className="block" /> Bloqueadas</span></div>
          <button className="qaCardLink" onClick={() => onNavigate('testRuns')}>Abrir ciclos de prueba <b>→</b></button>
        </article>

        <article className="qaGlassCard qaDefectState">
          <div className="qaCardHead"><div><small>ESTADO DE DEFECTOS</small><strong>Salud de incidencias</strong></div><Glyph name="bug" /></div>
          <Donut value={derived.openDefects ? Math.max(0, Math.round((defects.filter((item) => item.status === 'Closed').length * 100) / Math.max(1, defects.length))) : 100} center={`${defects.length}`} subtitle="Total" tone="multi" />
          <div className="qaDefectLegend">
            {['Critical', 'High', 'Medium', 'Low'].map((level) => <span key={level}><i className={`severityDot ${level.toLowerCase()}`} /> {defects.filter((item) => item.severity === level && item.status !== 'Closed').length} {labelEs(level)}</span>)}
            <span><i className="severityDot closed" /> {defects.filter((item) => item.status === 'Closed').length} cerrados</span>
          </div>
          <button className="qaCardLink" onClick={() => onNavigate('defects')}>Gestionar defectos <b>→</b></button>
        </article>

        <article className={`qaGlassCard qaQualityGate ${gateReady ? 'ready' : ''}`}>
          <div className="qaCardHead"><div><small>CALIDAD DE LA VERSIÓN</small><strong>Puerta de lanzamiento</strong></div><span className={`qaGateBadge gate${gateDecision}`}>{labelEs(gateDecision)}</span></div>
          <div className="qaGateSummary"><span className="qaGateOrb">{gateReady ? '✓' : gateDecision === 'Blocked' ? '!' : '~'}</span><div><strong>{labelEs(gateDecision)}</strong><small>{derived.validationPassed}/4 áreas de validación aprobadas</small></div></div>
          <div className="qaGateMiniList">
            {(report?.gate.checks ?? []).slice(0, 4).map((check) => <div key={check.name} className={check.passed ? 'pass' : 'fail'}><span>{check.passed ? '✓' : '×'}</span><p>{gateNameEs(check.name)}<small>{gateEvidenceEs(check.evidence)}</small></p></div>)}
            {!report && <><div className="fail"><span>○</span><p>Cobertura y ejecución<small>Pendiente de evidencia suficiente</small></p></div><div className="fail"><span>○</span><p>Validación final<small>{derived.validationPassed}/4 áreas aprobadas</small></p></div></>}
          </div>
          <button className="qaGateButton" onClick={() => onNavigate('reports')}><Glyph name="validation" /> Ver reporte de calidad <b>→</b></button>
        </article>
      </section>

      <section className="qaBottomGrid">
        <article className="qaGlassCard qaTracePreview">
          <div className="qaCardHead"><div><small>TRAZABILIDAD BIDIRECCIONAL</small><strong>Requisitos ↔ Pruebas ↔ Defectos</strong></div><button onClick={() => onNavigate('traceability')}>Ver matriz completa →</button></div>
          <div className="qaTraceTable">
            <div className="head"><span>Requisito</span><span>Casos</span><span>Cobertura</span><span>Defectos</span></div>
            {traceRows.length ? traceRows.map((row) => {
              const rowCoverage = row.testCases.length ? Math.min(100, Math.round((row.passed > 0 ? row.passed : row.executions) * 100 / Math.max(1, row.executions || row.testCases.length))) : 0
              return <div className="row" key={row.requirementId}><span><b>{row.code}</b><small>{row.title}</small></span><span>{row.testCases.length}</span><span><i><b style={{ width: `${rowCoverage}%` }} /></i><small>{row.covered ? 'Cubierto' : 'Sin cobertura'}</small></span><span className={row.openDefects ? 'danger' : 'ok'}>{row.openDefects}</span></div>
            }) : <div className="qaNoRows">Aún no hay filas de trazabilidad para mostrar.</div>}
          </div>
        </article>

        <article className="qaGlassCard qaRiskPreview">
          <div className="qaCardHead"><div><small>ANÁLISIS DE RIESGOS</small><strong>Exposición actual</strong></div><Glyph name="risk" /></div>
          <div className="qaRiskList">
            <RiskLine label="Riesgos identificados" value={risks.length} tone="all" />
            <RiskLine label="Riesgos críticos" value={derived.criticalOpenRisks} tone="critical" />
            <RiskLine label="Riesgos altos" value={risks.filter((item) => item.level === 'High' && item.status === 'Open').length} tone="high" />
            <RiskLine label="Riesgos medios" value={risks.filter((item) => item.level === 'Medium' && item.status === 'Open').length} tone="medium" />
            <RiskLine label="Riesgos bajos" value={risks.filter((item) => item.level === 'Low' && item.status === 'Open').length} tone="low" />
          </div>
          <button className="qaCardLink" onClick={() => onNavigate('risks')}>Ver análisis de riesgos <b>→</b></button>
        </article>

        <article className="qaGlassCard qaEvidencePreview">
          <div className="qaCardHead"><div><small>EVIDENCIAS DE VALIDACIÓN</small><strong>Últimos registros</strong></div><button onClick={() => onNavigate('validation')}>Ver todas →</button></div>
          <div className="qaEvidenceGrid">
            {latestEvidence.length ? latestEvidence.map((item) => <button className="qaEvidenceTile" key={item.id} onClick={() => onNavigate('validation')}><span className={item.result.toLowerCase()}><Glyph name={categoryIcon(item.category)} /></span><strong>{labelEs(item.category)}</strong><small>{labelEs(item.result)}</small><em>{formatDateEs(item.executedAtUtc)}</em></button>) : <div className="qaNoRows">Registra evidencias de seguridad, rendimiento, usabilidad y UAT.</div>}
          </div>
        </article>
      </section>

      <section className="qaLifecycleStrip">
        <div><p className="eyebrow">CICLO QA INTEGRADO</p><strong>De la especificación a la decisión de liberar</strong></div>
        <div className="qaLifecycleFlow">
          {[
            ['Requisitos', 'requirements', 'requirement'],
            ['Riesgos', 'risks', 'risk'],
            ['Casos', 'testCases', 'test'],
            ['Ejecución', 'testRuns', 'run'],
            ['Defectos', 'defects', 'bug'],
            ['Trazabilidad', 'traceability', 'trace'],
            ['Validación', 'validation', 'validation'],
          ].map(([label, target, icon], index) => <button key={label} onClick={() => onNavigate(target as DashboardTarget)}><span><Glyph name={icon as IconName} /></span><strong>{label}</strong>{index < 6 && <i>→</i>}</button>)}
        </div>
        <div className="qaLifecycleStats"><span><b>{derived.executionCoverage}%</b> ejecución</span><span><b>{derived.passRate}%</b> aprobación</span><span><b>{derived.completedRuns}</b> ciclos cerrados</span><span><b>{derived.validationPassed}/4</b> validación</span></div>
      </section>

      {loading && <div className="qaLoadingPulse" aria-label="Actualizando métricas"><span /><span /><span /></div>}
    </div>
  )
}

function KpiCard({ icon, tone, label, value, percent, detail, onClick }: { icon: IconName; tone: string; label: string; value: number | string; percent: number; detail: string; onClick: () => void }) {
  return <button className={`qaKpiCard tone-${tone}`} onClick={onClick}>
    <div className="qaKpiIcon"><Glyph name={icon} /></div>
    <div className="qaKpiText"><small>{label.toUpperCase()}</small><strong>{value}</strong><span>{detail}</span></div>
    <Donut value={percent} center={`${Math.round(percent)}%`} subtitle="" tone={tone} compact />
  </button>
}

function Donut({ value, center, subtitle, tone, compact = false }: { value: number; center: string; subtitle: string; tone: string; compact?: boolean }) {
  const clamped = Math.max(0, Math.min(100, value))
  const color = tone === 'red' ? '#ff6480' : tone === 'blue' ? '#259bff' : tone === 'cyan' ? '#34d7ff' : tone === 'multi' ? '#2ee4c5' : '#2ee4c5'
  const style: CSSProperties = { background: `conic-gradient(${color} ${clamped * 3.6}deg, rgba(73,118,151,.18) 0deg)` }
  return <div className={`qaDonut ${compact ? 'compact' : ''}`} style={style}><div><strong>{center}</strong>{subtitle && <small>{subtitle}</small>}</div></div>
}

function RiskLine({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <div className="qaRiskLine"><span className={`risk-${tone}`} /><p>{label}</p><strong>{value}</strong></div>
}

function categoryIcon(category: string): IconName {
  if (category === 'Security') return 'shield'
  if (category === 'Performance') return 'pulse'
  if (category === 'Usability') return 'home'
  return 'validation'
}

function sparkPath(values: number[], width: number, height: number): string {
  const safe = values.length > 1 ? values : [values[0] ?? 0, values[0] ?? 0]
  const max = Math.max(100, ...safe)
  const step = width / (safe.length - 1)
  return safe.map((value, index) => {
    const x = index * step
    const y = height - Math.max(5, Math.min(height - 5, value / max * (height - 10)))
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')
}

function Glyph({ name }: { name: IconName }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const paths: Record<IconName, React.ReactNode> = {
    home: <><path {...common} d="M3 10.5 12 3l9 7.5"/><path {...common} d="M5.5 9.5V21h13V9.5M9 21v-7h6v7"/></>,
    folder: <><path {...common} d="M3 6.5h6l2 2h10v9.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path {...common} d="M3 9h18"/></>,
    requirement: <><rect {...common} x="5" y="3" width="14" height="18" rx="2"/><path {...common} d="M8 8h8M8 12h8M8 16h5"/><path {...common} d="m14.5 17.5 1.4 1.4 3-3"/></>,
    risk: <><path {...common} d="M12 3 2.8 20h18.4z"/><path {...common} d="M12 9v4M12 17h.01"/></>,
    test: <><path {...common} d="M8 3h8M9 3v5l-5 9a3 3 0 0 0 2.6 4.5h10.8A3 3 0 0 0 20 17l-5-9V3"/><path {...common} d="M7.5 14h9"/><path {...common} d="m9 17 1.5 1.5L14 15"/></>,
    run: <><circle {...common} cx="12" cy="12" r="9"/><path {...common} d="m10 8 6 4-6 4z"/></>,
    bug: <><rect {...common} x="7" y="7" width="10" height="12" rx="5"/><path {...common} d="M9 5 7 3M15 5l2-2M4 10h3M17 10h3M4 15h3M17 15h3M10 11h4M12 7v12"/></>,
    trace: <><circle {...common} cx="5" cy="6" r="2"/><circle {...common} cx="19" cy="6" r="2"/><circle {...common} cx="5" cy="18" r="2"/><circle {...common} cx="19" cy="18" r="2"/><path {...common} d="M7 6h10M5 8v8M19 8v8M7 18h10M7 7.5l10 9M17 7.5 7 16.5"/></>,
    report: <><path {...common} d="M5 3h10l4 4v14H5z"/><path {...common} d="M15 3v5h4M8 17v-4M12 17v-7M16 17v-2"/></>,
    validation: <><path {...common} d="M12 3 4 6v5c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6z"/><path {...common} d="m8.5 12 2.2 2.2 4.8-5"/></>,
    search: <><circle {...common} cx="10.8" cy="10.8" r="6.8"/><path {...common} d="m16 16 5 5"/></>,
    shield: <><path {...common} d="M12 3 4 6v5c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6z"/><path {...common} d="M9 12h6M12 9v6"/></>,
    pulse: <><path {...common} d="M3 13h4l2-6 4 11 2-7 2 2h4"/></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}
