// BasePage: common behaviour of every page lives here. The other pages "extend" it.
import { Page } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path = '/'): Promise<void> {
    await this.page.goto(path);
  }

  get url(): string {
    return this.page.url();
  }
}
