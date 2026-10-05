import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
}

export default function () {
  const baseUrl = __ENV.QASSURE_API_URL || 'http://localhost:5000'
  const response = http.get(`${baseUrl}/health`)
  check(response, {
    'health returns 200': (r) => r.status === 200,
    'health responds under 500ms': (r) => r.timings.duration < 500,
  })
  sleep(0.5)
}
