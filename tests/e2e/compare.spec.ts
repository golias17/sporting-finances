import { test, expect } from '@playwright/test';

test.describe('Compare Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?tab=compare');
  });

  test('should load compare tab with default seasons', async ({ page }) => {
    // Check that the compare tab is active
    await expect(page.locator('.tabs button.active')).toContainText('Compare');

    // Check that column headers are visible
    await expect(page.locator('.cmp-col-headers')).toBeVisible();

    // Season A should be the latest season
    const seasonA = page.locator('.cmp-col-header-season').first();
    await expect(seasonA).toContainText('2024/25');

    // Season B should be the earliest season
    const seasonB = page.locator('.cmp-col-header-season').last();
    await expect(seasonB).toContainText('2010/11');
  });

  test('should display comparison grid with metrics', async ({ page }) => {
    // Check that the comparison grid is visible
    await expect(page.locator('.comparison-grid')).toBeVisible();

    // Check that metric groups are rendered
    const groups = page.locator('.cmp-group');
    await expect(groups.first()).toBeVisible();
  });

  test('should toggle between Two seasons and Vs average modes', async ({ page }) => {
    // Find the toggle button
    const toggleBtn = page.locator('.cmp-controls .btn-preset').first();
    await expect(toggleBtn).toBeVisible();
    
    // Initially should show "Vs average"
    await expect(toggleBtn).toContainText('Vs average');

    // Click to switch to average mode
    await toggleBtn.click();
    await page.waitForTimeout(200);

    // Should now show "Two seasons"
    await expect(toggleBtn).toContainText('Two seasons');
  });

  test('should show average window options when in average mode', async ({ page }) => {
    // Switch to average mode
    const toggleBtn = page.locator('.cmp-controls .btn-preset').first();
    await toggleBtn.click();
    await page.waitForTimeout(200);

    // Check window buttons are visible
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Last 5' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Last 3' })).toBeVisible();

    // Check badge shows season count
    await expect(page.locator('.cmp-average-badge')).toContainText('seasons');

    // Check excluded season info
    await expect(page.locator('.cmp-average-excluded')).toContainText('excludes');
  });

  test('should update header when switching average windows', async ({ page }) => {
    // Switch to average mode
    const toggleBtn = page.locator('.cmp-controls .btn-preset').first();
    await toggleBtn.click();
    await page.waitForTimeout(200);

    // Default is "All" - header should show "Average (all)"
    const seasonB = page.locator('.cmp-col-header-season').last();
    await expect(seasonB).toContainText('Average (all)');

    // Click "Last 5"
    await page.getByRole('button', { name: 'Last 5' }).click();
    await expect(seasonB).toContainText('Average (last 5)');

    // Click "Last 3"
    await page.getByRole('button', { name: 'Last 3' }).click();
    await expect(seasonB).toContainText('Average (last 3)');
  });

  test('should display chart container', async ({ page }) => {
    // Check that the chart container is visible
    await expect(page.locator('#compareBarChart')).toBeVisible();
  });

  test('should change Season A selection', async ({ page }) => {
    // Find the Season A dropdown
    const seasonADropdown = page.locator('#compareSeasonA');

    // Change to a different season
    await seasonADropdown.selectOption('1'); // Select second option

    // Header should update
    const seasonA = page.locator('.cmp-col-header-season').first();
    await expect(seasonA).not.toContainText('2024/25');
  });

  test('should change Season B selection', async ({ page }) => {
    // Find the Season B dropdown
    const seasonBDropdown = page.locator('#compareSeasonB');

    // Change to a different season
    await seasonBDropdown.selectOption('5'); // Select 6th option

    // Header should update
    const seasonB = page.locator('.cmp-col-header-season').last();
    await expect(seasonB).not.toContainText('2010/11');
  });

  test('should display correct column labels', async ({ page }) => {
    // Check Season A label
    await expect(page.locator('.cmp-col-header-label').first()).toContainText('Season A');

    // Check Season B label
    await expect(page.locator('.cmp-col-header-label').last()).toContainText('Season B');
  });

  test('should display trend arrow between columns', async ({ page }) => {
    // Check that the arrow is visible
    await expect(page.locator('.cmp-col-trend')).toBeVisible();
    await expect(page.locator('.cmp-col-trend')).toContainText('→');
  });

  test('should show average labels in column headers when in average mode', async ({ page }) => {
    // Switch to average mode
    const toggleBtn = page.locator('.cmp-controls .btn-preset').first();
    await toggleBtn.click();
    await page.waitForTimeout(200);

    // Check that labels changed to "Average"
    await expect(page.locator('.cmp-col-header-label').first()).toContainText('Season A');
    await expect(page.locator('.cmp-col-header-label').last()).toContainText('Average');
  });
});
