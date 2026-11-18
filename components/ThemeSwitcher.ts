// Theme buttons (Light / Dark / System). They are on the login page and on every page of the app.
import { Locator, Page, expect } from '@playwright/test';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeLook = 'light' | 'dark';

// Page background in these two themes (taken from the app's CSS)
export const THEME_BACKGROUND: Record<ThemeLook, string> = {
  light: 'rgb(246, 247, 250)',
  dark: 'rgb(10, 12, 16)',
};

// The name under which the browser saves the theme (localStorage key)
export const THEME_STORAGE_KEY = 'itzflow-theme';

export class ThemeSwitcher {
  readonly buttons: Record<ThemeMode, Locator>;

  constructor(private readonly page: Page) {
    // exact: true is required, otherwise a button like "Lighten Image AI Photo" in the app also matches "Light"
    this.buttons = {
      light: page.getByRole('button', { name: 'Light', exact: true }),
      dark: page.getByRole('button', { name: 'Dark', exact: true }),
      system: page.getByRole('button', { name: 'System', exact: true }),
    };
  }

  async select(mode: ThemeMode): Promise<void> {
    await this.buttons[mode].click();
  }

  // Only the button we want is selected (aria-pressed), the other two are not
  async expectSelected(mode: ThemeMode): Promise<void> {
    for (const m of Object.keys(this.buttons) as ThemeMode[]) {
      await expect(this.buttons[m]).toHaveAttribute('aria-pressed', m === mode ? 'true' : 'false');
    }
  }

  // The page actually looks light or dark (background + color-scheme)
  async expectLook(look: ThemeLook): Promise<void> {
    await expect(this.page.locator('body')).toHaveCSS('background-color', THEME_BACKGROUND[look]);
    await expect(this.page.locator('html')).toHaveCSS('color-scheme', look);
  }

  async storedValue(): Promise<string | null> {
    return this.page.evaluate((key) => localStorage.getItem(key), THEME_STORAGE_KEY);
  }
}
