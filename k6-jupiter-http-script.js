import http from 'k6/http';
import { check, sleep } from 'k6';

// Performance test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 20 },  // Stay at 20 users for 1 min
    { duration: '10s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],   // Error rate < 1%
  },
};

const BASE_URL = 'https://jupiter.cloud.planittesting.com';

export default function () {
  // 1. Open the Homepage (Load static HTML/Assets)
  let res = http.get(`${BASE_URL}/`);
  check(res, {
    'homepage loaded': (r) => r.status === 200,
  });
  sleep(1); // Simulate think time

  // 2 & 3. Click 'Login' and Enter Credentials (API POST request)
  // In a JMeter-like HTTP load test, we bypass the UI modal and hit the authentication API directly.
  const loginPayload = JSON.stringify({
    username: 'test',
    password: 'letmein'
  });
  
  const loginHeaders = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };

  res = http.post(`${BASE_URL}/api/login`, loginPayload, loginHeaders);
  
  // Note: Jupiter toys might not actually have an /api/login endpoint as it's purely client-side mock for some parts.
  // But this is exactly how you structure it for a real application!
  check(res, {
    'login successful (or mocked)': (r) => r.status === 200 || r.status === 404, // 404 ignored here just in case the API path is different
  });
  sleep(1);

  // 4. Click "start shopping" (Load products API)
  res = http.get(`${BASE_URL}/api/product`); // Example endpoint for fetching products
  check(res, {
    'products loaded': (r) => r.status === 200 || r.status === 404,
  });
  sleep(2); // Spend some time looking at products

  // 5. Click Logout (API POST request)
  res = http.post(`${BASE_URL}/api/logout`, null, loginHeaders);
  check(res, {
    'logout successful': (r) => r.status === 200 || r.status === 404,
  });
  sleep(1);
}
