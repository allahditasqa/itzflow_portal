// Setup: logs in once and saves the session (.auth/user.json). The other tests reuse it.
// Login is done through the API (faster and more stable than the UI). The real UI login coverage is in tests/auth/login.spec.ts.
import { test as setup, expect } from '@playwright/test';
import { AuthApi } from '../../api/AuthApi';
import { ENV } from '../../config/env';

export const authFile = '.auth/user.json';

setup('login (API) and save session', async ({ request }) => {
  setup.skip(!ENV.hasCredentials, 'Set ITZ_EMAIL / ITZ_PASSWORD in .env');
  const response = await new AuthApi(request).login(ENV.email, ENV.password);
  expect(response.status(), 'login API status').toBe(200);
  await request.storageState({ path: authFile });
});
