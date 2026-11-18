// Sign out flow. It runs with a fresh login because signing out can end the server-side session.
import { test, expect } from '../../fixtures/test-fixtures';
import { LOGGED_OUT, ROUTE } from '../../utils/constants';
import { ENV } from '../../config/env';

// Signing out can end the server-side session, so this test runs with its own fresh login.
test.describe('Sign out', () => {
  test.use({ storageState: LOGGED_OUT });

  test('TC_AUTH_01 - Login with valid email and valid password, click Sign out and check the login page opens', async ({
    page,
    loginPage,
    workspacePage,
  }) => {
    test.skip(!ENV.hasCredentials, 'Set ITZ_EMAIL / ITZ_PASSWORD in .env');
    await loginPage.open();
    await loginPage.login(ENV.email, ENV.password);
    await expect(page).toHaveURL(ROUTE.workspaces);
    await workspacePage.signOutButton.click();
    await expect(page).toHaveURL(ROUTE.login);
  });
});
