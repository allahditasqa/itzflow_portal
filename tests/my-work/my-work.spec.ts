// My work page (read-only).
import { test, expect } from '../../fixtures/test-fixtures';

test('TC_MW_01 - my-work shows counters', async ({ myWorkPage }) => {
  await myWorkPage.open();
  for (const label of ['Open', 'Overdue', 'Due today'] as const) {
    await expect(myWorkPage.counter(label)).toBeVisible();
  }
});
