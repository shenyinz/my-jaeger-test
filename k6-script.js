import http from 'k6/http';
import { check, sleep } from 'k6';

// Helper function to generate a random hex string for Tracing IDs
function randomHex(length) {
  let result = '';
  const characters = '0123456789abcdef';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Performance test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Gradually increase to 20 virtual users over 30 seconds
    { duration: '30s', target: 20 },  // Keep 20 concurrent users running for 30 seconds
    { duration: '10s', target: 0 },  // Gradually decrease to 0 virtual users over 10 seconds
  ],
  thresholds: {
    // Set performance thresholds, test failure conditions
    http_req_duration: ['p(95)<500'], // 95% of requests must have a response time under 500ms
    http_req_failed: ['rate<0.01'],   // Error rate must be less than 1%
  },
};

export default function () {
  // Generate a W3C traceparent header (00-traceId-spanId-01)
  const traceId = randomHex(32);
  const spanId = randomHex(16);
  const params = {
    headers: {
      'traceparent': `00-${traceId}-${spanId}-01`,
    },
  };

  // Request the app-service with Tracing headers injected
  const res = http.get('http://app-service:8000/', params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'transaction time OK': (r) => r.timings.duration < 200,
  });

  // Simulate user think time
  sleep(1);
}
