// Project page flow (read-only): header, tabs, back navigation.
import { test, expect } from '../../fixtures/test-fixtures';
import { stableApp } from '../../test-data/apps';

test.describe('Project page', () => {
  test.beforeEach(async ({ workspacePage, projectPage }) => {
    await workspacePage.open();
    await workspacePage.openApp(stableApp);
    await projectPage.expectOpen();
  });

  test('TC_PRJ_01 - header shows project name and tabs', async ({ projectPage }) => {
    await expect(projectPage.title(stableApp)).toBeVisible();
    await expect(projectPage.sprintsTab).toBeVisible();
    await expect(projectPage.historyTab).toBeVisible();
    await expect(projectPage.settingsTab).toBeVisible();
  });

  test('TC_PRJ_02 - sprints tab shows the sprint', async ({ page, projectPage }) => {
    await projectPage.sprintsTab.click();
    await expect(page.getByText(/Sprint 1/).first()).toBeVisible();
  });

  test('TC_PRJ_03 - history tab shows the change log', async ({ page, projectPage }) => {
    await projectPage.historyTab.click();
    await expect(page.getByText('CHANGES')).toBeVisible();
  });

  test('TC_PRJ_04 - settings tab shows project settings', async ({ page, projectPage }) => {
    await projectPage.settingsTab.click();
    await expect(page.getByText('Project settings')).toBeVisible();
    await expect(page.getByText('Documents').first()).toBeVisible();
  });

  test('TC_PRJ_05 - back returns to the workspace', async ({ page, projectPage }) => {
    await projectPage.backButton.click();
    await expect(page).not.toHaveURL(/\/projects\/[0-9a-f-]{20,}/);
  });
});
