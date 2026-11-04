// End-to-end tests for the main HustleHub+ flows.
// Requires the stack to be running with the demo data from `npm run seed`
// (accounts use the password given in SEED_PASSWORD; the tests read it from E2E_PASSWORD).
import { test, expect } from '@playwright/test';

const PASSWORD = process.env.E2E_PASSWORD;
if (!PASSWORD) throw new Error('Set E2E_PASSWORD to the SEED_PASSWORD used when seeding the database.');
const CLIENT = 'client@example.com';
const FREELANCER = 'freelancer@example.com';

async function login(page, email, password = PASSWORD) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
}

test.describe('public pages', () => {
  test('home page loads and gig browsing shows seeded gigs', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.getByRole('link', { name: 'Browse Gigs' }).first().click();
    await expect(page).toHaveURL(/\/gigs$/);
    await expect(page.getByRole('heading', { name: 'Browse Gigs' })).toBeVisible();
    await expect(page.getByTestId('gig-card').first()).toBeVisible();
    expect(await page.getByTestId('gig-card').count()).toBeGreaterThanOrEqual(3);
  });
});

test.describe('authentication and access control', () => {
  test('wrong password shows a generic error and does not log in', async ({ page }) => {
    await login(page, CLIENT, 'Wrong-Password-1!');
    await expect(page.getByTestId('alert-error')).toContainText('Invalid email or password');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('protected pages redirect anonymous visitors to the login page', async ({ page }) => {
    await page.goto('/freelancer/dashboard');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('a client cannot open the freelancer dashboard (role check)', async ({ page }) => {
    await login(page, CLIENT);
    await expect(page).toHaveURL(/\/gigs$/);
    await page.goto('/freelancer/dashboard');
    await expect(page.getByRole('heading', { name: /Income & Tax Dashboard/ })).toHaveCount(0);
  });
});

test.describe('booking and income flow', () => {
  test('client logs in, books a gig and receives a transaction reference', async ({ page }) => {
    await login(page, CLIENT);
    await expect(page).toHaveURL(/\/gigs$/);

    await page.getByTestId('gig-card').first().getByRole('link', { name: 'View details' }).click();
    await page.getByRole('button', { name: 'Book this gig' }).click();

    await expect(page.getByTestId('alert-success')).toContainText(/Booking confirmed! Reference: SIM-/);
  });

  test('freelancer sees income and the estimated tax on the dashboard', async ({ page }) => {
    await login(page, FREELANCER);
    await page.getByRole('link', { name: 'Income & Tax' }).click();

    await expect(page.getByRole('heading', { name: /Income & Tax Dashboard/ })).toBeVisible();
    await expect(page.getByTestId('stat-gross')).toBeVisible();
    await expect(page.getByTestId('stat-tax')).toBeVisible();
    await expect(page.getByTestId('stat-net')).toBeVisible();
    await expect(page.getByText(/not professional tax advice/i)).toBeVisible();
  });
});
