// Page Object Model (POM): all elements (locators) and actions of the Login page live here.
// If the UI changes, only this file is updated, not the tests.
import { Locator, Page, Response, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly togglePasswordButton: Locator;
  readonly hidePasswordButton: Locator;
  readonly signInButton: Locator;
  readonly forgotText: Locator;
  readonly errorMessage: Locator;
  readonly themeLight: Locator;
  readonly themeDark: Locator;
  readonly themeSystem: Locator;

  // Number of times the login API was called (stays 0 if client-side validation blocks the request)
  readonly loginRequests: string[] = [];

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Welcome back' });
    this.subtitle = page.getByText('Sign in to your board.');
    this.emailInput = page.getByPlaceholder('you@theitzon.com');
    this.passwordInput = page.getByPlaceholder('••••••••');
    this.togglePasswordButton = page.getByRole('button', { name: 'Show password' });
    this.hidePasswordButton = page.getByRole('button', { name: 'Hide password' });
    this.signInButton = page.getByRole('button', { name: /Sign in/ });
    this.forgotText = page.getByText('Forgot? Ask the TPM');
    this.errorMessage = page.getByText('Incorrect email or password');
    this.themeLight = page.getByRole('button', { name: 'Light' });
    this.themeDark = page.getByRole('button', { name: 'Dark' });
    this.themeSystem = page.getByRole('button', { name: 'System' });

    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/api/auth/login')) this.loginRequests.push(req.url());
    });
  }

  // Open the login page and confirm it has loaded
  async open(): Promise<void> {
    await this.goto('/login');
    await expect(this.heading).toBeVisible();
  }

  // Only fill the fields (no submit).
  // NOTE: fill() triggers the email validation incorrectly in this app (login does not work),
  // so real typing (pressSequentially) is used. See GUIDELINES.md.
  async fillForm(email: string, password: string, delay = 10): Promise<void> {
    if (email) await this.emailInput.pressSequentially(email, { delay });
    if (password) await this.passwordInput.pressSequentially(password, { delay });
  }

  // Fill in email/password and click Sign in
  async login(email: string, password: string, delay = 10): Promise<void> {
    await this.fillForm(email, password, delay);
    await this.signInButton.click();
  }

  // Log in and return the server response (status): 200 = success, 401 = wrong credentials
  async loginAndGetResponse(email: string, password: string): Promise<Response> {
    await this.fillForm(email, password);
    const [response] = await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/api/auth/login') && r.request().method() === 'POST'),
      this.signInButton.click(),
    ]);
    return response;
  }

  // After submitting the form, confirm that no login request was sent to the server at all (client-side validation)
  async expectNoLoginRequest(): Promise<void> {
    // A short wait is needed to verify that "nothing happened"
    // eslint-disable-next-line playwright/no-wait-for-timeout -- there is no event to wait for when verifying an absence
    await this.page.waitForTimeout(700);
    expect(this.loginRequests).toHaveLength(0);
    await expect(this.page).toHaveURL(/\/login/);
  }
}
