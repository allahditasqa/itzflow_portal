// Project (app) page: header, tabs Sprints / History / Settings.
import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProjectPage extends BasePage {
  readonly backButton: Locator;
  readonly sprintsTab: Locator;
  readonly historyTab: Locator;
  readonly settingsTab: Locator;

  constructor(page: Page) {
    super(page);
    this.backButton = page.getByRole('button', { name: 'Back' });
    this.sprintsTab = page.getByRole('button', { name: 'Sprints', exact: true });
    this.historyTab = page.getByRole('button', { name: 'History', exact: true });
    this.settingsTab = page.getByRole('button', { name: 'Settings', exact: true });
  }

  title(name: string): Locator {
    return this.page.getByRole('heading', { name }).first();
  }

  async expectOpen(): Promise<void> {
    await expect(this.page).toHaveURL(/\/projects\/[0-9a-f-]+/);
  }
}
