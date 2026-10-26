import { expect, test, type Page } from '@playwright/test';

async function onboard(page: Page) {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'When does your budget month begin?' }).fill('25');
  await page.getByRole('button', { name: 'Let’s begin' }).click();
  await expect(page.getByRole('tab', { name: 'Home', exact: true })).toBeVisible();
}

test('onboarding, entry validation, income and expense reconcile in the live UI', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await onboard(page);
  await page.getByRole('button', { name: 'Add expense', exact: true }).click();
  await page.getByRole('button', { name: 'Save entry', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Enter an amount');
  await page.getByRole('textbox', { name: 'Amount · NGN' }).fill('1250.50');
  await page.getByRole('button', { name: 'Feeding', exact: true }).click();
  await page.getByRole('textbox', { name: 'Merchant or source' }).fill('Campus canteen');
  await page.getByRole('textbox', { name: 'Note (optional)' }).fill('Lunch');
  await page.getByRole('button', { name: 'Save entry', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.pablooooTest.state().transactions.length)).toBe(1);
  await page.getByRole('button', { name: 'Add income', exact: true }).click();
  await page.getByRole('textbox', { name: 'Amount · NGN' }).fill('10000');
  await page.getByRole('button', { name: 'Salary', exact: true }).click();
  await page.getByRole('button', { name: 'Save entry', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.pablooooTest.state().transactions.length)).toBe(2);
  expect(await page.evaluate(() => window.pablooooTest.state().settings.cycleStartDay)).toBe(25);
  await expect(page.getByText('₦8,749.50', { exact: true })).toBeVisible();
  await page.screenshot({ path: '.expo/ui-preview/home-populated.png' });
  expect(errors).toEqual([]);
});

test('insights tolerate bad date input, show hourly chart and generate XLSX', async ({ page }) => {
  await onboard(page);
  await page.getByRole('tab', { name: 'Insights', exact: true }).click();
  await page.getByRole('textbox', { name: 'Date within period' }).fill('9999-12-31');
  await expect(page.getByRole('alert')).toContainText('calendar');
  await page.getByRole('textbox', { name: 'Date within period' }).fill('2026-10-26');
  await page.getByRole('button', { name: 'Day', exact: true }).click();
  await expect(page.getByText('Hour by hour · local time')).toBeVisible();
  await page.getByRole('button', { name: 'Export this report' }).click();
  await expect.poll(() => page.evaluate(() => window.pablooooTest.exportedBytes())).toBeGreaterThan(1000);
  await page.screenshot({ path: '.expo/ui-preview/insights.png' });
});

test('calculator result flows into entry and theme settings persist in state', async ({ page }) => {
  await onboard(page);
  await page.getByRole('button', { name: 'Calculate', exact: true }).click();
  for (const name of ['1', '0', '0', '+', '5', '0']) await page.getByRole('button', { name, exact: true }).click();
  await page.getByRole('button', { name: 'Use as expense', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Amount · NGN' })).toHaveValue('150.00');
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('tab', { name: 'More', exact: true }).click();
  await page.getByRole('button', { name: 'Settings & data' }).click();
  await page.getByRole('tab', { name: 'Dark', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.pablooooTest.state().settings.theme)).toBe('dark');
  await page.screenshot({ path: '.expo/ui-preview/settings-dark.png' });
});

test('custom subcategories, cycle budgets and savings goals save through their editors', async ({ page }) => {
  await onboard(page);
  await page.getByRole('tab', { name: 'More', exact: true }).click();
  await page.getByRole('button', { name: 'Categories', exact: true }).click();
  await page.getByRole('button', { name: 'New', exact: true }).click();
  await page.getByRole('textbox', { name: 'Category name' }).fill('Campus meals');
  await page.getByRole('button', { name: 'Feeding', exact: true }).click();
  await page.getByRole('button', { name: 'Save category', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.pablooooTest.state().categories.find(category => category.name === 'Campus meals')?.parentId)).toBe('category-feeding');
  await page.getByRole('tab', { name: 'Plan', exact: true }).click();
  await page.getByRole('textbox', { name: 'Expected cycle income · NGN' }).fill('100000');
  await page.getByRole('button', { name: 'Update plan', exact: true }).click();
  await page.getByRole('button', { name: 'Add category budgets', exact: true }).click();
  await page.getByRole('button', { name: 'Feeding / Campus meals', exact: true }).click();
  await page.getByRole('textbox', { name: 'Spending limit · NGN' }).fill('20000');
  await page.getByRole('button', { name: 'Save budget', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.pablooooTest.state().budgets.length)).toBe(1);
  await page.getByRole('button', { name: 'Add things worth saving for', exact: true }).click();
  await page.getByRole('textbox', { name: 'Goal name' }).fill('Rainy-day fund');
  await page.getByRole('textbox', { name: 'Target · NGN' }).fill('50000');
  await page.getByRole('textbox', { name: 'Already saved · NGN' }).fill('5000');
  await page.getByRole('button', { name: 'Save goal', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.pablooooTest.state().goals[0]?.savedKobo)).toBe(500000);
  await expect.poll(() => page.evaluate(() => window.pablooooTest.state().settings.plannedIncomeKobo)).toBe(10000000);
});

test('recurring schedules save and pause without inventing expenses', async ({ page }) => {
  await onboard(page);
  await page.getByRole('tab', { name: 'More', exact: true }).click();
  await page.getByRole('button', { name: 'Recurring entries', exact: true }).click();
  await page.getByRole('button', { name: 'New', exact: true }).click();
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Internet subscription');
  await page.getByRole('textbox', { name: 'Amount · NGN' }).fill('5000');
  await page.getByRole('button', { name: 'Utilities', exact: true }).click();
  await page.getByRole('button', { name: 'Save recurring entry', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.pablooooTest.state().recurringRules.length)).toBe(1);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.pablooooTest.state().recurringRules[0]?.active)).toBe(false);
  expect(await page.evaluate(() => window.pablooooTest.state().transactions.length)).toBe(0);
});
