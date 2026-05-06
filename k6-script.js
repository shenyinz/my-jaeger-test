import http from 'k6/http';
import { check, sleep } from 'k6';

// Performance test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Gradually increase to 20 virtual users over 30 seconds
    { duration: '1m', target: 20 },  // Keep 20 concurrent users running for 1 minute
    { duration: '10s', target: 0 },  // Gradually decrease to 0 virtual users over 10 seconds
  ],
  thresholds: {
    // Set performance thresholds, test failure conditions
    http_req_duration: ['p(95)<500'], // 95% of requests must have a response time under 500ms
    http_req_failed: ['rate<0.01'],   // Error rate must be less than 1%
  },
};

export default function () {
  // Request the app-service we defined in docker-compose
  const res = http.get('http://app-service:8000/');

  check(res, {
    'status is 200': (r) => r.status === 200,
    'transaction time OK': (r) => r.timings.duration < 200,
  });

  // Simulate user think time
  sleep(1);
}
