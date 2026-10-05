const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

export interface CurrentUser { id: string; email: string; displayName: string; role: string }
export interface AuthSession { accessToken: string; expiresAtUtc: string; user: CurrentUser }
export interface Project { id: string; name: string; key: string; description: string; version: string; criticality: string; status: string; createdAtUtc: string }
export interface Requirement { id: string; projectId: string; code: string; title: string; description: string; acceptanceCriteria: string; type: string; priority: string; status: string }
export interface RiskItem { id: string; projectId: string; requirementId: string | null; code: string; title: string; description: string; probability: number; impact: number; score: number; level: string; mitigation: string; status: string }
export interface TestCase { id: string; projectId: string; requirementId: string | null; riskId: string | null; code: string; title: string; level: string; type: string; technique: string; priority: string; status: string; objective: string; preconditions: string; steps: string; testData: string; expectedResult: string; postconditions: string }

export interface TestRunSummary { id: string; projectId: string; name: string; buildVersion: string; environment: string; type: string; status: string; createdAtUtc: string; startedAtUtc: string | null; completedAtUtc: string | null; total: number; notRun: number; passed: number; failed: number; blocked: number; skipped: number; passRate: number }
export interface TestExecution { id: string; testCaseId: string; testCaseCode: string; testCaseTitle: string; priority: string; expectedResult: string; result: string; actualResult: string; notes: string; evidence: string; executedBy: string; executedAtUtc: string | null }
export interface TestRunDetail { run: TestRunSummary; executions: TestExecution[] }

export interface Defect { id: string; projectId: string; executionId: string; testCaseId: string; retestExecutionId: string | null; testCaseCode: string; code: string; title: string; severity: string; priority: string; status: string; description: string; reproductionSteps: string; expectedResult: string; actualResult: string; assignedTo: string; resolution: string; createdAtUtc: string; updatedAtUtc: string | null }
export interface TraceabilityRisk { id: string; code: string; level: string; status: string }
export interface TraceabilityCase { id: string; code: string; title: string; status: string; technique: string }
export interface TraceabilityRow { requirementId: string; code: string; title: string; requirementStatus: string; risks: TraceabilityRisk[]; testCases: TraceabilityCase[]; executions: number; passed: number; failed: number; openDefects: number; covered: boolean }
export interface TraceabilityResponse { summary: { requirements: number; coveredRequirements: number; requirementCoverage: number; testCases: number; executions: number; executionCoverage: number; defects: number; openDefects: number }; rows: TraceabilityRow[] }
export interface QualityGateCheck { name: string; passed: boolean; evidence: string }
export interface QualityReport { generatedAtUtc: string; metrics: { requirements: number; approvedRequirements: number; requirementCoverage: number; testCases: number; readyTestCases: number; testRuns: number; completedRuns: number; executions: number; passed: number; failed: number; blocked: number; passRate: number; defects: number; openDefects: number; criticalOpenDefects: number; validationAreasPassed: number }; gate: { decision: string; checks: QualityGateCheck[] } }
export interface ValidationEvidence { id: string; category: string; result: string; title: string; evidence: string; executedBy: string; executedAtUtc: string }

interface ApiErrorBody { message?: string }
async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers); headers.set('Content-Type', 'application/json'); if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`
    try { const body = (await response.json()) as ApiErrorBody; if (body.message) message = body.message } catch { /* keep status message */ }
    throw new Error(message)
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export const login = (email: string, password: string) => request<AuthSession>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
export const getProjects = (token: string) => request<Project[]>('/api/projects', {}, token)
export const createProject = (token: string, payload: { name: string; key: string; description: string; version: string; criticality: number }) => request<Project>('/api/projects', { method: 'POST', body: JSON.stringify(payload) }, token)
export const getRequirements = (token: string, projectId: string) => request<Requirement[]>(`/api/projects/${projectId}/requirements`, {}, token)
export const createRequirement = (token: string, projectId: string, payload: { code: string; title: string; description: string; acceptanceCriteria: string; type: number; priority: number }) => request<Requirement>(`/api/projects/${projectId}/requirements`, { method: 'POST', body: JSON.stringify(payload) }, token)
export const approveRequirement = (token: string, projectId: string, requirementId: string) => request<Requirement>(`/api/projects/${projectId}/requirements/${requirementId}/approve`, { method: 'POST' }, token)
export const getRisks = (token: string, projectId: string) => request<RiskItem[]>(`/api/projects/${projectId}/risks`, {}, token)
export const createRisk = (token: string, projectId: string, payload: { requirementId: string | null; code: string; title: string; description: string; probability: number; impact: number; mitigation: string }) => request<RiskItem>(`/api/projects/${projectId}/risks`, { method: 'POST', body: JSON.stringify(payload) }, token)
export const mitigateRisk = (token: string, projectId: string, riskId: string) => request<RiskItem>(`/api/projects/${projectId}/risks/${riskId}/mitigate`, { method: 'POST' }, token)
export const acceptRisk = (token: string, projectId: string, riskId: string) => request<RiskItem>(`/api/projects/${projectId}/risks/${riskId}/accept`, { method: 'POST' }, token)
export const getTestCases = (token: string, projectId: string) => request<TestCase[]>(`/api/projects/${projectId}/test-cases`, {}, token)
export const createTestCase = (token: string, projectId: string, payload: { requirementId: string | null; riskId: string | null; code: string; title: string; level: number; type: number; technique: number; priority: number; objective: string; preconditions: string; steps: string; testData: string; expectedResult: string; postconditions: string }) => request<TestCase>(`/api/projects/${projectId}/test-cases`, { method: 'POST', body: JSON.stringify(payload) }, token)
export const markTestCaseReady = (token: string, projectId: string, testCaseId: string) => request<TestCase>(`/api/projects/${projectId}/test-cases/${testCaseId}/ready`, { method: 'POST' }, token)

export const getTestRuns = (token: string, projectId: string) => request<TestRunSummary[]>(`/api/projects/${projectId}/test-runs`, {}, token)
export const getTestRun = (token: string, projectId: string, runId: string) => request<TestRunDetail>(`/api/projects/${projectId}/test-runs/${runId}`, {}, token)
export const createTestRun = (token: string, projectId: string, payload: { name: string; buildVersion: string; environment: number; type: number; testCaseIds: string[] }) => request<TestRunSummary>(`/api/projects/${projectId}/test-runs`, { method: 'POST', body: JSON.stringify(payload) }, token)
export const startTestRun = (token: string, projectId: string, runId: string) => request<TestRunSummary>(`/api/projects/${projectId}/test-runs/${runId}/start`, { method: 'POST' }, token)
export const completeTestRun = (token: string, projectId: string, runId: string) => request<TestRunSummary>(`/api/projects/${projectId}/test-runs/${runId}/complete`, { method: 'POST' }, token)
export const cancelTestRun = (token: string, projectId: string, runId: string) => request<TestRunSummary>(`/api/projects/${projectId}/test-runs/${runId}/cancel`, { method: 'POST' }, token)
export const recordTestExecution = (token: string, projectId: string, runId: string, executionId: string, payload: { result: number; actualResult: string; notes: string; evidence: string }) => request<unknown>(`/api/projects/${projectId}/test-runs/${runId}/executions/${executionId}`, { method: 'PUT', body: JSON.stringify(payload) }, token)

export const getDefects = (token: string, projectId: string) => request<Defect[]>(`/api/projects/${projectId}/defects`, {}, token)
export const createDefect = (token: string, projectId: string, payload: { executionId: string; code: string; title: string; severity: number; priority: number; description: string; reproductionSteps: string }) => request<Defect>(`/api/projects/${projectId}/defects`, { method: 'POST', body: JSON.stringify(payload) }, token)
export const startDefect = (token: string, projectId: string, defectId: string, assignedTo: string) => request<Defect>(`/api/projects/${projectId}/defects/${defectId}/start`, { method: 'POST', body: JSON.stringify({ assignedTo }) }, token)
export const resolveDefect = (token: string, projectId: string, defectId: string, resolution: string) => request<Defect>(`/api/projects/${projectId}/defects/${defectId}/resolve`, { method: 'POST', body: JSON.stringify({ resolution }) }, token)
export const verifyDefectRetest = (token: string, projectId: string, defectId: string, retestExecutionId: string) => request<Defect>(`/api/projects/${projectId}/defects/${defectId}/verify-retest`, { method: 'POST', body: JSON.stringify({ retestExecutionId }) }, token)
export const getTraceability = (token: string, projectId: string) => request<TraceabilityResponse>(`/api/projects/${projectId}/traceability`, {}, token)
export const getQualityReport = (token: string, projectId: string) => request<QualityReport>(`/api/projects/${projectId}/quality/report`, {}, token)
export const getValidationEvidence = (token: string, projectId: string) => request<ValidationEvidence[]>(`/api/projects/${projectId}/quality/validation`, {}, token)
export const createValidationEvidence = (token: string, projectId: string, payload: { category: number; result: number; title: string; evidence: string }) => request<ValidationEvidence>(`/api/projects/${projectId}/quality/validation`, { method: 'POST', body: JSON.stringify(payload) }, token)
