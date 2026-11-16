// Setup: ek baar login karke session (.auth/user.json) save karta hai. Baqi tests isay reuse karte hain.
import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { ENV } from '../../config/env';

export const authFile = '.auth/user.json';

setup('login and save session', async ({ page }) => {
  setup.skip(!ENV.hasCredentials, 'Set ITZ_EMAIL / ITZ_PASSWORD in .env');
  const loginPage = new LoginPage(page);
  await loginPage.open();
  await loginPage.login(ENV.email, ENV.password);
  await expect(page).toHaveURL(/\/workspaces\//);
  await page.context().storageState({ path: authFile });
});
