import { browser } from 'k6/browser';
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    ui_and_api: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
};

export default async function () {
  const page = await browser.newPage();
  let idToken = null;

  try {
    // 1. Listen to network responses to capture the OAuth token
    page.on('response', async (response) => {
      if (response.url().includes('oauth2/v2.0/token')) {
        try {
          const body = await response.json();
          if (body.id_token) {
            idToken = body.id_token;
            console.log('ID Token captured successfully.');
          }
        } catch (e) {
          // Ignore JSON parsing errors for other requests
        }
      }
    });

    // 2. Launch and Login
    await page.goto('https://timeandattendance-int.qut.imminently.co/timesheets');
    
    await page.locator('input[name="loginfmt"]').fill('tannagac@adqa.qut.edu.au');
    await page.locator('#idSIButton9').click();
    
    // Wait for the password field to be visible and interactable
    const passwordField = page.locator('input[name="passwd"]');
    await passwordField.waitFor({ state: 'visible' });
    await passwordField.fill('miS2w8f2TIMwXQBaMU7F');
    await page.locator('#idSIButton9').click();
    
    // Handle "Stay signed in?" or "ProofUp" redirects if they appear
    try {
      const proofUpRedirect = page.locator('#idSubmit_ProofUp_Redirect');
      await proofUpRedirect.waitFor({ state: 'visible', timeout: 5000 });
      await proofUpRedirect.click();
    } catch (e) {
      console.log('ProofUp redirect not found or skipped.');
    }
    
    try {
      const skipSetupBtn = page.locator('button:has-text("Skip setup")');
      await skipSetupBtn.waitFor({ state: 'visible', timeout: 5000 });
      await skipSetupBtn.click();
    } catch (e) {
      console.log('Skip setup button not found or skipped.');
    }

    // Wait for the timesheets page to finish loading
    await page.locator('p:has-text("Start logging your work time.")').waitFor({ state: 'visible' });
    
  } finally {
    // Close the browser page context
    await page.close();
  }

  // Ensure we captured the token before proceeding to API calls
  if (!idToken) {
    console.error('Failed to capture ID_Token from the login flow.');
    return;
  }

  // --- API Calls (HTTP Requests) ---
  const baseUrl = 'https://timeandattendance-api-int.qut.imminently.co/timesheets';
  
  const params = {
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'X-TENANCY': 'QUT',
    },
  };

  // HTTP Request 1: GET specific timesheet date
  let res1 = http.get(`${baseUrl}/2026-01-10`, params);
  check(res1, {
    'GET specific timesheet status is 200': (r) => r.status === 200,
  });

  // HTTP Request 2: GET timesheets with complex query parameters
  const queryString = [
    '$fields=id',
    '$fields=indices.startDate',
    '$fields=indices.mustSubmit',
    '$fields=indices.positionStatus',
    '$limit=10',
    '$orderBy=indices.startDate:desc',
    'startDate=$lt=2026-01-10'
  ].join('&');

  let res2 = http.get(`${baseUrl}/?${queryString}`, params);
  check(res2, {
    'GET timesheets list status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
