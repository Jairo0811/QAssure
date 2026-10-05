const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

export interface CurrentUser { id: string; email: string; displayName: string; role: string }
export interface AuthSession { accessToken: string; expiresAtUtc: string; user: CurrentUser }
export interface Project { id: string; name: string; key: string; description: string; version: string; criticality: string; status: string; createdAtUtc: string }
export interface Requirement { id: string; projectId: string; code: string; title: string; description: string; acceptanceCriteria: string; type: string; priority: string; status: string }
export interface RiskItem { id: string; projectId: string; requirementId: string | null; code: string; title: string; description: string; probability: number; impact: number; score: number; level: string; mitigation: string; status: string }
export interface TestCase { id: string; projectId: string; requirementId: string | null; riskId: string | null; code: string; title: string; level: string; type: string; technique: string; priority: string; status: string; objective: string; preconditions: string; steps: string; testData: string; expectedResult: string; postconditions: string }

export interface TestRunSummary {
  id: string
  projectId: string
  name: string
  buildVersion: string
  environment: string
  type: string
  status: string
  createdAtUtc: string
  startedAtUtc: string | null
  completedAtUtc: string | null
  total: number
  notRun: number
  passed: number
  failed: number
  blocked: number
  skipped: number
  passRate: number
}

export interface TestExecution {
  id: string
  testCaseId: string
  testCaseCode: string
  testCaseTitle: string
  priority: string
  expectedResult: string
  result: string
  actualResult: string
  notes: string
  evidence: string
  executedBy: string
  executedAtUtc: string | null
}

export interface TestRunDetail { run: TestRunSummary; executions: TestExecution[] }

interface ApiErrorBody { message?: string }

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`
    try {
      const body = (await response.json()) as ApiErrorBody
      if (body.message) message = body.message
    } catch { /* status message is enough */ }
    throw new Error(message)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export function login(email: string, password: string): Promise<AuthSession> {
  return request<AuthSession>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
}

export function getProjects(token: string): Promise<Project[]> { return request<Project[]>('/api/projects', {}, token) }
export function createProject(token: string, payload: { name: string; key: string; description: string; version: string; criticality: number }): Promise<Project> {
  return request<Project>('/api/projects', { method: 'POST', body: JSON.stringify(payload) }, token)
}

export function getRequirements(token: string, projectId: string): Promise<Requirement[]> { return request<Requirement[]>(`/api/projects/${projectId}/requirements`, {}, token) }
export function createRequirement(token: string, projectId: string, payload: { code: string; title: string; description: string; acceptanceCriteria: string; type: number; priority: number }): Promise<Requirement> {
  return request<Requirement>(`/api/projects/${projectId}/requirements`, { method: 'POST', body: JSON.stringify(payload) }, token)
}
export function approveRequirement(token: string, projectId: string, requirementId: string): Promise<Requirement> {
  return request<Requirement>(`/api/projects/${projectId}/requirements/${requirementId}/approve`, { method: 'POST' }, token)
}

export function getRisks(token: string, projectId: string): Promise<RiskItem[]> { return request<RiskItem[]>(`/api/projects/${projectId}/risks`, {}, token) }
export function createRisk(token: string, projectId: string, payload: { requirementId: string | null; code: string; title: string; description: string; probability: number; impact: number; mitigation: string }): Promise<RiskItem> {
  return request<RiskItem>(`/api/projects/${projectId}/risks`, { method: 'POST', body: JSON.stringify(payload) }, token)
}
export function mitigateRisk(token: string, projectId: string, riskId: string): Promise<RiskItem> { return request<RiskItem>(`/api/projects/${projectId}/risks/${riskId}/mitigate`, { method: 'POST' }, token) }
export function acceptRisk(token: string, projectId: string, riskId: string): Promise<RiskItem> { return request<RiskItem>(`/api/projects/${projectId}/risks/${riskId}/accept`, { method: 'POST' }, token) }

export function getTestCases(token: string, projectId: string): Promise<TestCase[]> { return request<TestCase[]>(`/api/projects/${projectId}/test-cases`, {}, token) }
export function createTestCase(token: string, projectId: string, payload: { requirementId: string | null; riskId: string | null; code: string; title: string; level: number; type: number; technique: number; priority: number; objective: string; preconditions: string; steps: string; testData: string; expectedResult: string; postconditions: string }): Promise<TestCase> {
  return request<TestCase>(`/api/projects/${projectId}/test-cases`, { method: 'POST', body: JSON.stringify(payload) }, token)
}
export function markTestCaseReady(token: string, projectId: string, testCaseId: string): Promise<TestCase> { return request<TestCase>(`/api/projects/${projectId}/test-cases/${testCaseId}/ready`, { method: 'POST' }, token) }

export function getTestRuns(token: string, projectId: string): Promise<TestRunSummary[]> {
  return request<TestRunSummary[]>(`/api/projects/${projectId}/test-runs`, {}, token)
}
export function getTestRun(token: string, projectId: string, runId: string): Promise<TestRunDetail> {
  return request<TestRunDetail>(`/api/projects/${projectId}/test-runs/${runId}`, {}, token)
}
export function createTestRun(token: string, projectId: string, payload: { name: string; buildVersion: string; environment: number; type: number; testCaseIds: string[] }): Promise<TestRunSummary> {
  return request<TestRunSummary>(`/api/projects/${projectId}/test-runs`, { method: 'POST', body: JSON.stringify(payload) }, token)
}
export function startTestRun(token: string, projectId: string, runId: string): Promise<TestRunSummary> {
  return request<TestRunSummary>(`/api/projects/${projectId}/test-runs/${runId}/start`, { method: 'POST' }, token)
}
export function completeTestRun(token: string, projectId: string, runId: string): Promise<TestRunSummary> {
  return request<TestRunSummary>(`/api/projects/${projectId}/test-runs/${runId}/complete`, { method: 'POST' }, token)
}
export function cancelTestRun(token: string, projectId: string, runId: string): Promise<TestRunSummary> {
  return request<TestRunSummary>(`/api/projects/${projectId}/test-runs/${runId}/cancel`, { method: 'POST' }, token)
}
export function recordTestExecution(token: string, projectId: string, runId: string, executionId: string, payload: { result: number; actualResult: string; notes: string; evidence: string }): Promise<unknown> {
  return request<unknown>(`/api/projects/${projectId}/test-runs/${runId}/executions/${executionId}`, { method: 'PUT', body: JSON.stringify(payload) }, token)
}
