import { test, expect } from '@playwright/test';

test.describe('Dashboard User Journey', () => {
  test('should load the overview tab on initial load', async ({ page }) => {
    await page.goto('/');
    
    // Check page title
    await expect(page).toHaveTitle(/Sporting CP Finances/);
    
    // Check that the Overview tab button is active
    const activeTab = page.locator('.tabs button.active');
    await expect(activeTab).toBeVisible();
    await expect(activeTab).toContainText('Overview');
    
    // Check that the Hero section is rendered
    await expect(page.locator('.hero h1')).toBeVisible();
  });

  test('should navigate to Squad & Transfers tab and update URL', async ({ page }) => {
    await page.goto('/');
    
    // Click the Squad tab
    const squadTab = page.locator('button[data-tab="squad"]');
    await clickWithWait(page, squadTab);
    
    // URL should update to /?tab=squad
    await expect(page).toHaveURL(/tab=squad/);
    
    // Check that there is a Chart visible
    await expect(page.locator('.chart-box').first()).toBeVisible();
  });

  test('should change language to Portuguese', async ({ page }) => {
    await page.goto('/');
    
    // Initially english text is present
    await expect(page.locator('.hero h1')).toContainText('From insolvency');
    
    // Click language toggle
    const langBtn = page.locator('a[data-lang="pt"]');
    await clickWithWait(page, langBtn);
    
    // Text should now be Portuguese
    await expect(page.locator('.hero h1')).toContainText('Da insolvência');
  });

  test('should open and close the image lightbox', async ({ page }) => {
    await page.goto('/?tab=club');
    
    // Click the first gallery image
    const stadiumImg = page.locator('.stadium-panorama-img').first();
    await expect(stadiumImg).toBeVisible();
    await stadiumImg.click();
    
    // Lightbox should be visible
    const lightbox = page.locator('#imageLightbox');
    await expect(lightbox).toBeVisible();
    
    // Close lightbox
    const closeBtn = page.locator('#closeLightboxBtn');
    await closeBtn.click();
    
    // Lightbox should be hidden
    await expect(lightbox).not.toBeVisible();
  });
});

async function clickWithWait(page: any, locator: any) {
  await locator.click();
  // Small wait for animations/state to settle
  await page.waitForTimeout(100);
}
