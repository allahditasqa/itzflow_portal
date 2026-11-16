// "Your work" page (/my-work): user ke apne tickets aur counters.
import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class MyWorkPage extends BasePage {
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Your work' });
  }

  async open(): Promise<void> {
    await this.goto('/my-work');
    await expect(this.heading).toBeVisible();
  }

  counter(label: 'Open' | 'Overdue' | 'Due today'): Locator {
    return this.page.getByText(label, { exact: true }).first();
  }
}
