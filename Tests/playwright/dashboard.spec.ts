import { test, expect, APIRequestContext } from '@playwright/test';

/**
 * ASSUMPTIONS À VALIDER (pas d'accès au code source au moment de l'écriture) :
 * - Le bouton de capture porte un texte/role identifiable (ici on cherche par rôle "button" + texte).
 * - Le tableau d'historique a une ligne par capture (role "row").
 * - Le formulaire de seuils a des champs identifiables par label ("Cold"/"Hot" ou équivalent FR).
 * - L'app tourne avec FIXED_TEMPERATURE défini pour la déterminisme (voir README).
 *
 * Adapter les sélecteurs une fois le DOM réel inspecté (idéalement via data-testid
 * ajoutés dans l'app, ou via Playwright's codegen: `npx playwright codegen localhost:3000`).
 */

async function resetThresholds(request: APIRequestContext, coldMax: number, hotMin: number) {
  const res = await request.put('/api/thresholds', { data: { coldMax, hotMin } });
  expect(res.ok()).toBeTruthy();
}

test.describe('Dashboard — Capture section', () => {
  test.beforeEach(async ({ request }) => {
    // Ramène l'app dans un état de seuils connu avant chaque test -> indépendance des tests
    await resetThresholds(request, 10, 30);
  });

 test('déclenche une capture et l\'ajoute en tête de l\'historique', async ({ page }) => {
  await page.goto('/');
  const firstRowBefore = await page.locator('table tbody tr').first().textContent();

  await page.getByRole('button', { name: /capture|capturer/i }).click();

  await expect(async () => {
    const firstRowAfter = await page.locator('table tbody tr').first().textContent();
    expect(firstRowAfter).not.toBe(firstRowBefore);
  }).toPass();
});

  test('la valeur affichée avec FIXED_TEMPERATURE est stable sur plusieurs captures', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /capture|capturer/i }).click();
    const firstReading = await page.locator('.capture-result').textContent();

    await page.getByRole('button', { name: /capture|capturer/i }).click();
    const secondReading = await page.locator('.capture-result').textContent();

    expect(firstReading).toBe(secondReading);
  });

  test('l’historique n’affiche jamais plus de 15 lignes', async ({ page, request }) => {
    for (let i = 0; i < 17; i++) {
      await request.post('/api/temperature/capture');
    }

    await page.goto('/');
    const dataRows = await page.locator('table tbody tr').count();
    expect(dataRows).toBeLessThanOrEqual(15);
  });
});

test.describe('Dashboard — Thresholds section', () => {
  test('met à jour les seuils et les valeurs persistent après rechargement', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('#coldMax').fill('5');
    await page.locator('#hotMin').fill('35');
    await expect(page.locator('#coldMax')).toHaveValue('5');
    await expect(page.locator('#hotMin')).toHaveValue('35');
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/thresholds') && res.request().method() === 'PUT' && res.ok()),
      page.getByRole('button', { name: /save|enregistrer|update/i }).click(),
    ]);
    await expect(page.getByText(/saved|enregistré|success/i)).toBeVisible();

    await page.reload();
    await expect(page.locator('#coldMax')).toHaveValue('5');
    await expect(page.locator('#hotMin')).toHaveValue('35');
  });

  test('refuse un seuil cold supérieur ou égal au seuil hot (validation UI)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('#coldMax').fill('40');
    await page.locator('#hotMin').fill('30');
    await page.getByRole('button', { name: /save|enregistrer|update/i }).click();

    const thresholdForm = page.locator('section.card', { has: page.locator('#coldMax') });
  await expect(thresholdForm.getByText(/must be strictly less than/i)).toBeVisible();
  });

  test('une nouvelle capture reflète immédiatement les nouveaux seuils', async ({ page, request }) => {
    await resetThresholds(request, 10, 20); 
    await page.goto('/');
    await page.getByRole('button', { name: /capture|capturer/i }).click();

    await expect(page.locator('.capture-result')).toHaveText(/hot/i);
  });
});
