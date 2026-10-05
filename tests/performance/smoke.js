import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  vus: 1,
  duration: '10s',
}

export default function () {
  const response = http.get(__ENV.QASSURE_API_URL || 'http://localhost:5000/health')
  check(response, {
    'health returns 200': (r) => r.status === 200,
  })
  sleep(1)
}
