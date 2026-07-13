import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

test("referral reports can filter by an existing bank/user", async ({ page }) => {
  test.setTimeout(90_000);
  const bankSelect = page.locator('select[name="bank"]');
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await page.goto(`${baseUrl}/referral-reports?from=2021-07-01&to=2026-07-31`);
    if (await bankSelect.count()) break;
    await page.waitForTimeout(attempt * 2000);
  }
  await expect(bankSelect).toBeVisible({ timeout: 20_000 });

  const options = await bankSelect.locator("option").evaluateAll((items) =>
    items.map((item) => ({ value: (item as HTMLOptionElement).value, label: item.textContent?.trim() ?? "" }))
  );
  const bankOption = options.find((option) => option.value);

  expect(bankOption, "expected at least one bank/user option from referral data").toBeTruthy();

  await bankSelect.selectOption(bankOption!.value);
  await Promise.all([
    page.waitForURL((url) => url.searchParams.get("bank") === bankOption!.value, { waitUntil: "commit" }),
    page.getByRole("button", { name: "تطبيق" }).click()
  ]);

  await expect.poll(() => new URL(page.url()).searchParams.get("bank")).toBe(bankOption!.value);
  await expect(bankSelect).toBeVisible({ timeout: 45_000 });
  await expect(page.getByRole("cell", { name: /REF-2026-/ }).first()).toBeVisible({ timeout: 45_000 });
});
