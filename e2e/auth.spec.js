import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('/');
  });

  test('should display welcome page when not authenticated', async ({ page }) => {
    // Check if we're on the welcome page
    await expect(page).toHaveURL(/.*welcome/);
    // Use a more specific selector to avoid multiple matches
    await expect(page.locator('h1:has-text("Streamline Your School")')).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    // Test navigation to different pages
    await page.click('text=Sign In');
    await expect(page).toHaveURL(/.*login/);
    
    await page.goto('/');
    await page.click('text=Get Started');
    await expect(page).toHaveURL(/.*signup/);
  });

  test('should validate signup form inputs', async ({ page }) => {
    await page.goto('/signup');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should still be on signup page
    await expect(page).toHaveURL(/.*signup/);
  });

  test('should handle invalid email in signup', async ({ page }) => {
    await page.goto('/signup');
    
    // Fill form with invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.fill('input[placeholder*="name"]', 'Test User');
    await page.click('button[type="submit"]');
    
    // Should still be on signup page
    await expect(page).toHaveURL(/.*signup/);
  });

  test('should have working navigation between auth pages', async ({ page }) => {
    await page.goto('/login');
    
    // Navigate to signup
    await page.click('text=Sign up');
    await expect(page).toHaveURL(/.*signup/);
    
    // Navigate back to login
    await page.click('text=Sign in');
    await expect(page).toHaveURL(/.*login/);
  });
});

test.describe('School Join Flow', () => {
  test('should allow joining with valid school code', async ({ page }) => {
    await page.goto('/join');
    
    // Enter valid school code format
    await page.fill('input[placeholder*="code"]', 'ABC123');
    await page.click('button[type="submit"]');
    
    // Should proceed to next step or show success
    await expect(page.locator('text=Join School')).toBeVisible();
  });

  test('should validate school code format', async ({ page }) => {
    await page.goto('/join');
    
    // Enter invalid school code
    await page.fill('input[placeholder*="code"]', 'abc');
    await page.click('button[type="submit"]');
    
    // Should show validation error
    await expect(page.locator('text=Please enter a valid school code')).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Check if mobile menu or responsive elements are present
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should work on tablet devices', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/');
    
    // Check if layout adapts properly
    await expect(page.locator('main')).toBeVisible();
  });
}); 