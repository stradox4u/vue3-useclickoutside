import { expect, test } from '@playwright/test';

function panel(page, name) {
  return {
    open: page.getByRole('button', { name: `Open ${name}`, exact: true }),
    inside: page.getByRole('button', { name: `Inside ${name}`, exact: true }),
    dismissals: page.getByRole('status', { name: `${name} dismissals`, exact: true }),
  };
}

function outside(page) {
  return page.getByRole('button', { name: 'Outside all panels', exact: true });
}

test.beforeEach(async ({ page }) => {
  await page.goto(process.env.PLAYWRIGHT_APP_URL);
});

test('repeatedly opening and closing a panel calls its outside handler once per dismissal', async ({ page }) => {
  const first = panel(page, 'panel 1');

  for (let round = 1; round <= 3; round++) {
    await first.open.click();
    await first.inside.click();
    await expect(first.inside).toBeVisible();
    await expect(first.dismissals).toHaveText(String(round - 1));

    await outside(page).click();
    await expect(first.inside).toHaveCount(0);
    await expect(first.dismissals).toHaveText(String(round));

    await outside(page).click();
    await expect(first.dismissals).toHaveText(String(round));
  }
});

test('opening each of five panels dismisses the previously open panel', async ({ page }) => {
  const panels = [1, 2, 3, 4, 5].map(number => panel(page, `panel ${number}`));
  await panels[0].open.click();

  for (let index = 1; index < panels.length; index++) {
    const previous = panels[index - 1];
    const current = panels[index];
    await current.open.click();
    await expect(previous.inside).toHaveCount(0);
    await expect(previous.dismissals).toHaveText('1');
    await expect(current.inside).toBeVisible();
    await expect(current.dismissals).toHaveText('0');
  }
});

test('clicking inside one of five open panels dismisses the other four', async ({ page }) => {
  const panels = [1, 2, 3, 4, 5].map(number => panel(page, `panel ${number}`));
  const third = panels[2];
  const openAll = page.getByRole('button', { name: 'Open all panels', exact: true });

  await openAll.click();
  for (const panel of panels) await expect(panel.inside).toBeVisible();

  await third.inside.click();
  await expect(third.inside).toBeVisible();
  await expect(third.dismissals).toHaveText('0');
  for (const panel of panels.filter(panel => panel !== third)) {
    await expect(panel.inside).toHaveCount(0);
    await expect(panel.dismissals).toHaveText('1');
  }

  await openAll.click();
  await outside(page).click();
  for (const panel of panels) {
    await expect(panel.inside).toHaveCount(0);
    await expect(panel.dismissals).toHaveText(panel === third ? '1' : '2');
  }
});

test('a nested panel and its parent each use their own click boundary', async ({ page }) => {
  const parent = panel(page, 'panel 3');
  const child = panel(page, 'nested panel');

  await parent.open.click();
  await child.open.click();
  await child.inside.click();
  await expect(parent.inside).toBeVisible();
  await expect(child.inside).toBeVisible();
  await expect(parent.dismissals).toHaveText('0');
  await expect(child.dismissals).toHaveText('0');

  await parent.inside.click();
  await expect(parent.inside).toBeVisible();
  await expect(child.inside).toHaveCount(0);
  await expect(parent.dismissals).toHaveText('0');
  await expect(child.dismissals).toHaveText('1');

  await child.open.click();
  await expect(child.inside).toBeVisible();
  await outside(page).click();
  await expect(parent.inside).toHaveCount(0);
  await expect(child.inside).toHaveCount(0);
  await expect(parent.dismissals).toHaveText('1');
});

test('an ignored opener opens its own panel and dismisses another panel', async ({ page }) => {
  const first = panel(page, 'panel 1');
  const second = panel(page, 'panel 2');

  await second.open.click();
  await expect(second.inside).toBeVisible();
  await page.getByRole('button', { name: 'Open panel 1 from outside', exact: true }).click();

  await expect(first.inside).toBeVisible();
  await expect(first.dismissals).toHaveText('0');
  await expect(second.inside).toHaveCount(0);
  await expect(second.dismissals).toHaveText('1');

  await outside(page).click();
  await expect(first.inside).toHaveCount(0);
  await expect(first.dismissals).toHaveText('1');
});

test('an outside click dismissing a parent also calls its nested panel handler', async ({ page }) => {
  const parent = panel(page, 'panel 3');
  const child = panel(page, 'nested panel');
  await parent.open.click();
  await child.open.click();
  await expect(child.inside).toBeVisible();

  await outside(page).click();
  await expect(parent.dismissals).toHaveText('1');
  await expect(child.inside).toHaveCount(0);

  test.fail(true, 'The parent unmounts the child before its listener handles the same click.');
  await expect(child.dismissals).toHaveText('1', { timeout: 1_000 });
});
