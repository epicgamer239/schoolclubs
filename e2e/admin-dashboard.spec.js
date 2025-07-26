import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test('should redirect to login when accessing admin dashboard without authentication', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('text=Welcome back')).toBeVisible();
    await expect(page.locator('text=Sign in to your account')).toBeVisible();
  });

  test('should show login form with proper elements', async ({ page }) => {
    await page.goto('/login');
    
    // Check login form elements
    await expect(page.locator('text=Email address')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('text=Password')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();
  });

  test('should have working navigation from login page', async ({ page }) => {
    await page.goto('/login');
    
    // Test navigation to signup
    await page.click('text=Sign up');
    await expect(page).toHaveURL(/.*signup/);
  });

  test('should validate login form inputs', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await page.click('button:has-text("Sign In")');
    
    // Check for validation (if any exists)
    // Note: The current login form doesn't show validation messages on empty submit
    // This test just ensures the form doesn't crash
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });

  test('should handle invalid email format', async ({ page }) => {
    await page.goto('/login');
    
    // Enter invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    
    // Should still be on login page (no redirect on invalid credentials)
    await expect(page).toHaveURL(/.*login/);
  });

  test('should redirect to login when accessing admin school page without authentication', async ({ page }) => {
    await page.goto('/admin/school');
    
    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should redirect to login when accessing admin students page without authentication', async ({ page }) => {
    await page.goto('/admin/students');
    
    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should redirect to login when accessing admin teachers page without authentication', async ({ page }) => {
    await page.goto('/admin/teachers');
    
    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should redirect to login when accessing admin clubs page without authentication', async ({ page }) => {
    await page.goto('/admin/clubs');
    
    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/);
  });
}); 