const { test, expect } = require('@playwright/test')

test.beforeEach(async ({ page }) => {
  await page.addStyleTag({
    content: '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }',
  })
})

test('settings page - empty', async ({ page }) => {
  await page.goto('/settings')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('settings-empty.png')
})

test('settings page - PAT entered', async ({ page }) => {
  await page.goto('/settings')
  await page.waitForLoadState('networkidle')
  await page.fill('[placeholder="ghp_..."]', 'ghp_test_token_example12345')
  await expect(page).toHaveScreenshot('settings-pat-entered.png')
})

test('settings page - PAT revealed', async ({ page }) => {
  await page.goto('/settings')
  await page.waitForLoadState('networkidle')
  await page.fill('[placeholder="ghp_..."]', 'ghp_test_token_example12345')
  await page.locator('[data-testid="VisibilityIcon"]').click()
  await expect(page).toHaveScreenshot('settings-pat-revealed.png')
})

test('settings page - saved snackbar', async ({ page }) => {
  await page.goto('/settings')
  await page.waitForLoadState('networkidle')
  await page.fill('[placeholder="ghp_..."]', 'ghp_test_token_example12345')
  await page.getByRole('button', { name: 'Save' }).click()
  await page.getByRole('alert').waitFor({ state: 'visible' })
  await expect(page).toHaveScreenshot('settings-saved.png')
})
