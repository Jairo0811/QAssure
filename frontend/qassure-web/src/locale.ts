const labels: Record<string, string> = {
  Admin: 'Administrador',
  QaLead: 'Líder QA',
  Tester: 'Tester QA',
  Developer: 'Desarrollador',
  Stakeholder: 'Parte interesada',

  Draft: 'Borrador',
  Active: 'Activo',
  Closed: 'Cerrado',
  Approved: 'Aprobado',
  Rejected: 'Rechazado',
  Open: 'Abierto',
  Mitigated: 'Mitigado',
  Accepted: 'Aceptado',
  Ready: 'Listo',
  Deprecated: 'Obsoleto',
  InProgress: 'En progreso',
  Completed: 'Completado',
  Cancelled: 'Cancelado',
  New: 'Nuevo',
  Resolved: 'Resuelto',
  Reopened: 'Reabierto',
  Passed: 'Aprobado',
  Failed: 'Fallido',
  Blocked: 'Bloqueado',
  Skipped: 'Omitido',
  NotRun: 'No ejecutado',
  Conditional: 'Condicional',

  Low: 'Bajo',
  Medium: 'Medio',
  High: 'Alto',
  Critical: 'Crítico',

  Functional: 'Funcional',
  NonFunctional: 'No funcional',
  'Non-functional': 'No funcional',
  Component: 'Componente',
  Integration: 'Integración',
  System: 'Sistema',
  Acceptance: 'Aceptación',

  EquivalencePartitioning: 'Partición de equivalencia',
  BoundaryValueAnalysis: 'Análisis de valores límite',
  DecisionTable: 'Tabla de decisión',
  StateTransition: 'Transición de estados',
  UseCase: 'Caso de uso',
  StatementCoverage: 'Cobertura de sentencias',
  DecisionCoverage: 'Cobertura de decisiones',
  Exploratory: 'Prueba exploratoria',
  ErrorGuessing: 'Adivinación de errores',

  Development: 'Desarrollo',
  Qa: 'QA',
  QA: 'QA',
  Staging: 'Preproducción',
  ProductionLike: 'Similar a producción',
  Smoke: 'Prueba de humo',
  Regression: 'Regresión',

  Security: 'Seguridad',
  Performance: 'Rendimiento',
  Usability: 'Usabilidad',
  UserAcceptance: 'Aceptación de usuario',
}

const gateNames: Record<string, string> = {
  'Requirement coverage': 'Cobertura de requisitos',
  'Pass rate': 'Tasa de aprobación',
  'Completed test run': 'Ciclo de prueba completado',
  'Pending executions': 'Ejecuciones pendientes',
  'Critical defects': 'Defectos críticos',
  'Critical risks': 'Riesgos críticos',
  'Final validation': 'Validación final',
}

const exactErrors: Record<string, string> = {
  'Failed to fetch': 'No se pudo conectar con el servidor.',
  'Project not found.': 'Proyecto no encontrado.',
  'Test run not found.': 'Ciclo de prueba no encontrado.',
  'Execution not found.': 'Ejecución no encontrada.',
  'Select at least one ready test case for the run.': 'Selecciona al menos un caso de prueba listo para crear el ciclo.',
  'One or more selected test cases do not belong to this project.': 'Uno o más casos seleccionados no pertenecen a este proyecto.',
  'Only Ready test cases can be added to a test run.': 'Solo se pueden agregar casos de prueba en estado Listo a un ciclo.',
  'Executions can only be recorded while the test run is in progress.': 'Las ejecuciones solo pueden registrarse mientras el ciclo esté en progreso.',
}

export function labelEs(value: string | null | undefined): string {
  if (!value) return ''
  return labels[value] ?? value.replace(/([a-z])([A-Z])/g, '$1 $2')
}

export function displayNameEs(value: string): string {
  return value === 'QAssure Administrator' ? 'Administrador de QAssure' : value
}

export function formatDateEs(value: string): string {
  return new Date(value).toLocaleString('es-DO')
}

export function gateNameEs(value: string): string {
  return gateNames[value] ?? value
}

export function gateEvidenceEs(value: string): string {
  let match = value.match(/^(\d+) completed$/)
  if (match) return `${match[1]} completado${match[1] === '1' ? '' : 's'}`

  match = value.match(/^(\d+) pending$/)
  if (match) return `${match[1]} pendiente${match[1] === '1' ? '' : 's'}`

  match = value.match(/^(\d+) open$/)
  if (match) return `${match[1]} abierto${match[1] === '1' ? '' : 's'}`

  match = value.match(/^(\d+)\/4 areas passed$/)
  if (match) return `${match[1]}/4 áreas aprobadas`

  return value
}

export function errorMessageEs(reason: unknown, fallback: string): string {
  if (!(reason instanceof Error)) return fallback
  const message = reason.message.trim()
  if (exactErrors[message]) return exactErrors[message]

  const status = message.match(/^Request failed with status (\d+)\.$/)
  if (status) return `La solicitud falló con el estado ${status[1]}.`

  return fallback
}
