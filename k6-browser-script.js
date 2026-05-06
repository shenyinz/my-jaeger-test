import { browser } from 'k6/browser';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations',
      vus: 2,           // Number of concurrent browsers (Keep this low to save memory!)
      iterations: 4,    // Total number of iterations to run across all VUs
      maxDuration: '1m',
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
  thresholds: {
    checks: ["rate==1.0"]
  }
};

export default async function () {
  const page = await browser.newPage();

  try {
    // 1. Open the homepage
    await page.goto('https://jupiter.cloud.planittesting.com/#/home');
    
    // Wait for the page to load completely
    await page.waitForSelector('.btn-success'); // Wait for "Start Shopping" button to ensure page loaded

    // 2. Click 'Login' button in the navigation bar
    await page.locator('//a[contains(., "Login")]').click();

    // 3. Enter Username "test" and Password "letmein"
    // The login modal appears, we wait for the input fields
    await page.locator('#loginUserName').waitFor();
    await page.locator('#loginUserName').type('test');
    await page.locator('#loginPassword').type('letmein');

    // Click the actual "Log In" submit button inside the modal
    await page.locator('.btn-primary').click();

    // Verify successful login (typically "Logout" button appears, or user greeting)
    const logoutVisible = await page.locator('//a[contains(., "Logout")]').isVisible();
    check(logoutVisible, { 'Logged in successfully': true });

    // 4. Click "start shopping" button on the homepage
    await page.locator('.btn-success').click();
    
    // Wait for the shop page to load
    await page.waitForSelector('.products'); // Wait for products to load

    // 5. Click Logout
    await page.locator('//a[contains(., "Logout")]').click();
    
    // Verify logout
    const loginVisible = await page.locator('//a[contains(., "Login")]').isVisible();
    check(loginVisible, { 'Logged out successfully': true });

  } finally {
    page.close();
  }
}
