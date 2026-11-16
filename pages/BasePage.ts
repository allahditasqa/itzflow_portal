// BasePage: har page ke common kaam yahan hote hain. Baqi pages isay "extend" karte hain.
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
