import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Audits', () => {
  // We can't guarantee 100% compliance out of the box because Chart.js 
  // generates <canvas> elements that are inherently hard to make perfectly accessible,
  // but we can scan the rest of our custom DOM.
  
  test('should not have any automatically detectable accessibility issues on the Overview tab', async ({ page }) => {
    await page.goto('/');
    
    // Wait for main content to render
    await page.waitForSelector('.chapter');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      // Exclude charts as they are canvas elements and we handle them via <AccessibleTable>
      .exclude('.chart-box')
      .analyze();
      
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have any accessibility issues in the Data tab (Table View)', async ({ page }) => {
    await page.goto('/#data');
    
    // Wait for the data table to render
    await page.waitForSelector('#dataTable');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .analyze();
      
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
