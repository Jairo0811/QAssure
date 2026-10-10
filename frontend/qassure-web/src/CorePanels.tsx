import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  acceptRisk,
  approveRequirement,
  createRequirement,
  createRisk,
  createTestCase,
  markTestCaseReady,
  mitigateRisk,
} from './api'
import type { Project, Requirement, RiskItem, TestCase } from './api'
import { errorMessageEs, labelEs } from './locale'

export function ProjectsPanel({ projects, selectedProjectId, onSelect, onCreated }: { projects: Project[]; selectedProjectId: string; onSelect: (id: string) => void; onCreated: (payload: { name: string; key: string; description: string; version: string; criticality: number }) => Promise<void> }) {
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [description, setDescription] = useState('')
  const [version, setVersion] = useState('1.0.0')
  const [criticality, setCriticality] = useState(2)

  async function submit(event: FormEvent) {
    event.preventDefault()
    await onCreated({ name, key, description, version, criticality })
    setName('')
    setKey('')
    setDescription('')
  }

  return (
    <section className="splitLayout">
      <div className="panel">
        <div className="panelTitle"><div><p className="eyebrow">PORTAFOLIO QA</p><h3>Proyectos</h3></div><span>{projects.length}</span></div>
        <div className="itemList">
          {projects.map((project) => (
            <button key={project.id} className={`listItem ${project.id === selectedProjectId ? 'selected' : ''}`} onClick={() => onSelect(project.id)}>
              <span className="itemCode">{project.key}</span>
              <div><strong>{project.name}</strong><small>{project.version} · {labelEs(project.criticality)}</small></div>
              <span className={`pill ${project.status.toLowerCase()}`}>{labelEs(project.status)}</span>
            </button>
          ))}
          {!projects.length && <p className="empty">Todavía no hay proyectos de QA.</p>}
        </div>
      </div>

      <form className="panel formPanel" onSubmit={submit}>
        <div className="panelTitle"><div><p className="eyebrow">NUEVO ESPACIO</p><h3>Crear proyecto de QA</h3></div></div>
        <label>Nombre<input value={name} onChange={(event) => setName(event.target.value)} required /></label>
        <label>Clave del proyecto<input value={key} onChange={(event) => setKey(event.target.value)} placeholder="QA-410" required /></label>
        <label>Descripción<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} /></label>
        <div className="formRow">
          <label>Versión<input value={version} onChange={(event) => setVersion(event.target.value)} required /></label>
          <label>Criticidad<select value={criticality} onChange={(event) => setCriticality(Number(event.target.value))}><option value={1}>Baja</option><option value={2}>Media</option><option value={3}>Alta</option><option value={4}>Crítica</option></select></label>
        </div>
        <button className="primary">Crear proyecto</button>
      </form>
    </section>
  )
}

export function RequirementsPanel({ projects, selectedProject, selectedProjectId, requirements, canLead, onProjectChange, onReload, token, setMessage }: { projects: Project[]; selectedProject: Project | null; selectedProjectId: string; requirements: Requirement[]; canLead: boolean; onProjectChange: (id: string) => void; onReload: () => Promise<void>; token: string; setMessage: (value: string) => void }) {
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [criteria, setCriteria] = useState('')
  const [type, setType] = useState(1)
  const [priority, setPriority] = useState(2)

  async function submit(event: FormEvent) {
    event.preventDefault()
    try {
      await createRequirement(token, selectedProjectId, { code, title, description, acceptanceCriteria: criteria, type, priority })
      setCode('')
      setTitle('')
      setDescription('')
      setCriteria('')
      setMessage('Requisito creado correctamente.')
      await onReload()
    } catch (reason) {
      setMessage(errorMessageEs(reason, 'No se pudo crear el requisito.'))
    }
  }

  if (!projects.length) return <Empty />

  return (
    <>
      <ProjectPicker projects={projects} selectedProject={selectedProject} selectedProjectId={selectedProjectId} onProjectChange={onProjectChange} eyebrow="CONTEXTO · REQUISITOS" />
      <section className="splitLayout requirementsLayout">
        <div className="panel">
          <div className="panelTitle"><div><p className="eyebrow">ESPECIFICACIÓN Y COBERTURA</p><h3>Requisitos</h3></div><span>{requirements.length}</span></div>
          <div className="requirementsList">
            {requirements.map((requirement) => (
              <article className="requirementCard" key={requirement.id}>
                <div className="requirementTop">
                  <span className="itemCode">{requirement.code}</span>
                  <span className={`priority priority${requirement.priority}`}>{labelEs(requirement.priority)}</span>
                  <span className={`pill ${requirement.status.toLowerCase()}`}>{labelEs(requirement.status)}</span>
                </div>
                <h4>{requirement.title}</h4>
                <p>{requirement.description}</p>
                <div className="criteria"><strong>Criterios de aceptación:</strong> {requirement.acceptanceCriteria}</div>
                <footer>
                  <span>{labelEs(requirement.type)}</span>
                  {canLead && requirement.status !== 'Approved' && <button className="linkButton" onClick={() => void approveRequirement(token, selectedProjectId, requirement.id).then(onReload)}>Aprobar</button>}
                </footer>
              </article>
            ))}
            {!requirements.length && <p className="empty">No hay requisitos registrados.</p>}
          </div>
        </div>

        <form className="panel formPanel" onSubmit={submit}>
          <div className="panelTitle"><div><p className="eyebrow">DISEÑO FUNCIONAL</p><h3>Nuevo requisito</h3></div></div>
          <label>Código<input value={code} onChange={(event) => setCode(event.target.value)} placeholder="REQ-001" required /></label>
          <label>Título<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
          <label>Descripción<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} required /></label>
          <label>Criterios de aceptación<textarea value={criteria} onChange={(event) => setCriteria(event.target.value)} rows={4} required /></label>
          <div className="formRow">
            <label>Tipo<select value={type} onChange={(event) => setType(Number(event.target.value))}><option value={1}>Funcional</option><option value={2}>No funcional</option></select></label>
            <label>Prioridad<select value={priority} onChange={(event) => setPriority(Number(event.target.value))}><option value={1}>Baja</option><option value={2}>Media</option><option value={3}>Alta</option><option value={4}>Crítica</option></select></label>
          </div>
          <button className="primary">Agregar requisito</button>
        </form>
      </section>
    </>
  )
}

export function RisksPanel({ projects, selectedProject, selectedProjectId, requirements, risks, canLead, onProjectChange, onReload, token, setMessage }: { projects: Project[]; selectedProject: Project | null; selectedProjectId: string; requirements: Requirement[]; risks: RiskItem[]; canLead: boolean; onProjectChange: (id: string) => void; onReload: () => Promise<void>; token: string; setMessage: (value: string) => void }) {
  const [requirementId, setRequirementId] = useState('')
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [probability, setProbability] = useState(3)
  const [impact, setImpact] = useState(3)
  const [mitigation, setMitigation] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    try {
      await createRisk(token, selectedProjectId, { requirementId: requirementId || null, code, title, description, probability, impact, mitigation })
      setCode('')
      setTitle('')
      setDescription('')
      setMitigation('')
      setMessage('Riesgo registrado correctamente.')
      await onReload()
    } catch (reason) {
      setMessage(errorMessageEs(reason, 'No se pudo registrar el riesgo.'))
    }
  }

  if (!projects.length) return <Empty />

  return (
    <>
      <ProjectPicker projects={projects} selectedProject={selectedProject} selectedProjectId={selectedProjectId} onProjectChange={onProjectChange} eyebrow="CONTEXTO · RIESGO" />
      <section className="splitLayout requirementsLayout">
        <div className="panel">
          <div className="panelTitle"><div><p className="eyebrow">RISK-BASED TESTING</p><h3>Registro de riesgos</h3></div><span>{risks.length}</span></div>
          <div className="requirementsList">
            {risks.map((risk) => (
              <article className={`riskCard risk${risk.level}`} key={risk.id}>
                <div className="requirementTop">
                  <span className="itemCode">{risk.code}</span>
                  <span className={`riskScore score${risk.level}`}>{risk.score} · {labelEs(risk.level)}</span>
                  <span className={`pill ${risk.status.toLowerCase()}`}>{labelEs(risk.status)}</span>
                </div>
                <h4>{risk.title}</h4>
                <p>{risk.description}</p>
                <div className="criteria"><strong>Mitigación:</strong> {risk.mitigation}</div>
                {canLead && risk.status === 'Open' && (
                  <footer className="inlineActions">
                    <button className="linkButton" onClick={() => void mitigateRisk(token, selectedProjectId, risk.id).then(onReload)}>Marcar mitigado</button>
                    <button className="linkButton" onClick={() => void acceptRisk(token, selectedProjectId, risk.id).then(onReload)}>Aceptar riesgo</button>
                  </footer>
                )}
              </article>
            ))}
            {!risks.length && <p className="empty">No hay riesgos registrados.</p>}
          </div>
        </div>

        <form className="panel formPanel" onSubmit={submit}>
          <div className="panelTitle"><div><p className="eyebrow">IDENTIFICACIÓN Y RESPUESTA</p><h3>Registrar riesgo</h3></div></div>
          <label>Requisito relacionado<select value={requirementId} onChange={(event) => setRequirementId(event.target.value)}><option value="">Riesgo a nivel de proyecto</option>{requirements.map((requirement) => <option value={requirement.id} key={requirement.id}>{requirement.code}</option>)}</select></label>
          <label>Código<input value={code} onChange={(event) => setCode(event.target.value)} placeholder="RSK-001" required /></label>
          <label>Título<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
          <label>Descripción<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} required /></label>
          <div className="formRow">
            <label>Probabilidad<select value={probability} onChange={(event) => setProbability(Number(event.target.value))}>{[1, 2, 3, 4, 5].map((value) => <option key={value}>{value}</option>)}</select></label>
            <label>Impacto<select value={impact} onChange={(event) => setImpact(Number(event.target.value))}>{[1, 2, 3, 4, 5].map((value) => <option key={value}>{value}</option>)}</select></label>
          </div>
          <div className="scorePreview">Puntuación del riesgo: <strong>{probability * impact}</strong></div>
          <label>Estrategia de mitigación<textarea value={mitigation} onChange={(event) => setMitigation(event.target.value)} rows={4} required /></label>
          <button className="primary">Agregar riesgo</button>
        </form>
      </section>
    </>
  )
}

const techniques: Array<[number, string]> = [
  [1, 'Partición de equivalencia'],
  [2, 'Análisis de valores límite'],
  [3, 'Tabla de decisión'],
  [4, 'Transición de estados'],
  [5, 'Caso de uso'],
  [6, 'Cobertura de sentencias'],
  [7, 'Cobertura de decisiones'],
  [8, 'Prueba exploratoria'],
  [9, 'Adivinación de errores'],
]

export function TestCasesPanel({ projects, selectedProject, selectedProjectId, requirements, risks, testCases, onProjectChange, onReload, token, setMessage }: { projects: Project[]; selectedProject: Project | null; selectedProjectId: string; requirements: Requirement[]; risks: RiskItem[]; testCases: TestCase[]; onProjectChange: (id: string) => void; onReload: () => Promise<void>; token: string; setMessage: (value: string) => void }) {
  const [requirementId, setRequirementId] = useState('')
  const [riskId, setRiskId] = useState('')
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [level, setLevel] = useState(2)
  const [type, setType] = useState(0)
  const [technique, setTechnique] = useState(1)
  const [priority, setPriority] = useState(2)
  const [objective, setObjective] = useState('')
  const [preconditions, setPreconditions] = useState('')
  const [steps, setSteps] = useState('')
  const [testData, setTestData] = useState('')
  const [expectedResult, setExpectedResult] = useState('')
  const [postconditions, setPostconditions] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    try {
      await createTestCase(token, selectedProjectId, { requirementId: requirementId || null, riskId: riskId || null, code, title, level, type, technique, priority, objective, preconditions, steps, testData, expectedResult, postconditions })
      setCode('')
      setTitle('')
      setObjective('')
      setPreconditions('')
      setSteps('')
      setTestData('')
      setExpectedResult('')
      setPostconditions('')
      setMessage('Caso de prueba creado correctamente.')
      await onReload()
    } catch (reason) {
      setMessage(errorMessageEs(reason, 'No se pudo crear el caso de prueba.'))
    }
  }

  if (!projects.length) return <Empty />

  return (
    <>
      <ProjectPicker projects={projects} selectedProject={selectedProject} selectedProjectId={selectedProjectId} onProjectChange={onProjectChange} eyebrow="CONTEXTO · DISEÑO DE PRUEBAS" />
      <section className="splitLayout testCaseLayout">
        <div className="panel">
          <div className="panelTitle"><div><p className="eyebrow">REPOSITORIO DE PRUEBAS</p><h3>Casos de prueba</h3></div><span>{testCases.length}</span></div>
          <div className="requirementsList">
            {testCases.map((testCase) => (
              <article className="testCaseCard" key={testCase.id}>
                <div className="requirementTop">
                  <span className="itemCode">{testCase.code}</span>
                  <span className={`priority priority${testCase.priority}`}>{labelEs(testCase.priority)}</span>
                  <span className={`pill ${testCase.status.toLowerCase()}`}>{labelEs(testCase.status)}</span>
                </div>
                <h4>{testCase.title}</h4>
                <div className="tagRow"><span>{labelEs(testCase.level)}</span><span>{labelEs(testCase.type)}</span><span className="techniqueTag">{labelEs(testCase.technique)}</span></div>
                <p>{testCase.objective}</p>
                <details>
                  <summary>Detalles del diseño de prueba</summary>
                  <div className="testDetails">
                    <strong>Precondiciones</strong><p>{testCase.preconditions}</p>
                    <strong>Pasos</strong><p>{testCase.steps}</p>
                    <strong>Datos de prueba</strong><p>{testCase.testData}</p>
                    <strong>Resultado esperado</strong><p>{testCase.expectedResult}</p>
                    <strong>Postcondiciones</strong><p>{testCase.postconditions}</p>
                  </div>
                </details>
                {testCase.status === 'Draft' && <footer><button className="linkButton" onClick={() => void markTestCaseReady(token, selectedProjectId, testCase.id).then(onReload)}>Marcar como listo</button></footer>}
              </article>
            ))}
            {!testCases.length && <p className="empty">No hay casos de prueba diseñados.</p>}
          </div>
        </div>

        <form className="panel formPanel denseForm" onSubmit={submit}>
          <div className="panelTitle"><div><p className="eyebrow">TÉCNICA + EVIDENCIA ESPERADA</p><h3>Diseñar caso de prueba</h3></div></div>
          <div className="formRow">
            <label>Requisito<select value={requirementId} onChange={(event) => setRequirementId(event.target.value)}><option value="">Sin requisito</option>{requirements.map((requirement) => <option key={requirement.id} value={requirement.id}>{requirement.code}</option>)}</select></label>
            <label>Riesgo<select value={riskId} onChange={(event) => setRiskId(event.target.value)}><option value="">Sin riesgo</option>{risks.map((risk) => <option key={risk.id} value={risk.id}>{risk.code}</option>)}</select></label>
          </div>
          <label>Código<input value={code} onChange={(event) => setCode(event.target.value)} placeholder="TC-001" required /></label>
          <label>Título<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
          <div className="formRow">
            <label>Nivel<select value={level} onChange={(event) => setLevel(Number(event.target.value))}><option value={0}>Componente</option><option value={1}>Integración</option><option value={2}>Sistema</option><option value={3}>Aceptación</option></select></label>
            <label>Tipo<select value={type} onChange={(event) => setType(Number(event.target.value))}><option value={0}>Funcional</option><option value={1}>No funcional</option></select></label>
          </div>
          <div className="formRow">
            <label>Técnica<select value={technique} onChange={(event) => setTechnique(Number(event.target.value))}>{techniques.map(([value, name]) => <option value={value} key={value}>{name}</option>)}</select></label>
            <label>Prioridad<select value={priority} onChange={(event) => setPriority(Number(event.target.value))}><option value={1}>Baja</option><option value={2}>Media</option><option value={3}>Alta</option><option value={4}>Crítica</option></select></label>
          </div>
          <label>Objetivo<textarea value={objective} onChange={(event) => setObjective(event.target.value)} rows={3} required /></label>
          <label>Precondiciones<textarea value={preconditions} onChange={(event) => setPreconditions(event.target.value)} rows={3} required /></label>
          <label>Pasos<textarea value={steps} onChange={(event) => setSteps(event.target.value)} rows={4} required /></label>
          <label>Datos de prueba<textarea value={testData} onChange={(event) => setTestData(event.target.value)} rows={3} required /></label>
          <label>Resultado esperado<textarea value={expectedResult} onChange={(event) => setExpectedResult(event.target.value)} rows={3} required /></label>
          <label>Postcondiciones<textarea value={postconditions} onChange={(event) => setPostconditions(event.target.value)} rows={3} required /></label>
          <button className="primary">Crear caso de prueba</button>
        </form>
      </section>
    </>
  )
}

function ProjectPicker({ projects, selectedProject, selectedProjectId, onProjectChange, eyebrow }: { projects: Project[]; selectedProject: Project | null; selectedProjectId: string; onProjectChange: (id: string) => void; eyebrow: string }) {
  return (
    <section className="projectPicker panel">
      <div><p className="eyebrow">{eyebrow}</p><h3>{selectedProject?.name ?? 'Selecciona un proyecto'}</h3></div>
      <select value={selectedProjectId} onChange={(event) => onProjectChange(event.target.value)}>{projects.map((project) => <option key={project.id} value={project.id}>{project.key} · {project.name}</option>)}</select>
    </section>
  )
}

function Empty() {
  return <section className="panel emptyState"><h3>Crea un proyecto primero</h3><p>La evidencia de QA siempre pertenece a un proyecto.</p></section>
}
