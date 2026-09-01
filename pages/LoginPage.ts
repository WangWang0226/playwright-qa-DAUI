import { expect, type Locator, type Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/login');
    await expect(this.page).toHaveURL(/\/login/);
  }

  async login(username: string, password: string) {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.submit();
  }

  async loginWithFallback(username: string, password: string, fallbackQuickSelect: string) {
    await this.login(username, password);

    if (!this.page.url().endsWith('/login')) {
      return;
    }

    const error = this.page.getByText(/invalid user id or password|invalid credentials|sign in failed/i);
    if (!(await error.isVisible().catch(() => false))) {
      return;
    }

    const fallbackAccount = this.page.getByRole('button', { name: new RegExp(fallbackQuickSelect, 'i') });
    await expect(fallbackAccount).toBeVisible();
    await fallbackAccount.click();
    await this.submit();
  }

  async expectLoaded() {
    await expect(this.page.getByRole('button', { name: /sign in|login/i })).toBeVisible();
    await expect(this.usernameInput()).toBeVisible();
  }

  usernameInput(): Locator {
    return this.page
      .getByPlaceholder(/username|email|user id/i)
      .or(this.page.getByLabel(/username|email|user id/i))
      .or(this.page.locator('input[type="text"]').first());
  }

  passwordInput(): Locator {
    return this.page
      .getByPlaceholder(/password/i)
      .or(this.page.getByLabel(/password/i))
      .or(this.page.locator('input[type="password"]').first());
  }

  submitButton(): Locator {
    return this.page.getByRole('button', { name: /sign in|login/i });
  }

  private async fillUsername(username: string) {
    await this.usernameInput().fill(username);
  }

  private async fillPassword(password: string) {
    await this.passwordInput().fill(password);
  }

  private async submit() {
    await Promise.all([
      this.page.waitForURL(url => !url.pathname.endsWith('/login'), { timeout: 15000 }).catch(() => undefined),
      this.submitButton().click()
    ]);
  }
}
