import { expect, test } from "@playwright/test";
import { fakeAasSdk } from "./support/fakes";
import { PROFILE, fillProfileForm, submitProfile } from "./support/profile";

test.beforeEach(async ({ page }) => {
  await fakeAasSdk(page);
});

test("blocks submission and points at the first missing field", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Generate PDF preview" }).click();

  await expect(page.getByRole("status")).toHaveText("8 fields need your attention.");
  await expect(page.getByLabel("Full name", { exact: true })).toBeFocused();
  await expect(page.getByText("Full name is required")).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});

test("clears a field error as soon as it is fixed", async ({ page }) => {
  await page.goto("/");
  const email = page.getByLabel("Email address");
  await email.fill("not-an-email");
  await email.blur();
  await expect(page.getByText("Valid email is required")).toBeVisible();

  await email.fill("ada@example.com");
  await expect(page.getByText("Valid email is required")).toBeHidden();
});

test("rejects a date of birth in the future", async ({ page }) => {
  await page.goto("/");
  await fillProfileForm(page, { ...PROFILE, dob: "2999-01-01" });
  await page.getByRole("button", { name: "Generate PDF preview" }).click();
  await expect(page.getByText("Date of birth can't be in the future")).toBeVisible();
});

test("renders the submitted profile as a document", async ({ page }) => {
  await submitProfile(page);
  const doc = page.getByRole("article", { name: "Document preview" });

  await expect(doc.getByText(PROFILE.fullName, { exact: true })).toBeVisible();
  await expect(doc.getByText(PROFILE.email)).toBeVisible();
  await expect(doc.getByText("14 May 1990")).toBeVisible();
  await expect(doc.getByText(/BDT 75,000/)).toBeVisible();
  await expect(doc.getByText(PROFILE.emergencyContactName)).toBeVisible();
});

test("keeps the profile across a reload and when going back to edit", async ({ page }) => {
  await submitProfile(page);
  await page.reload();
  await expect(page.getByRole("article", { name: "Document preview" })).toContainText(PROFILE.nid);

  await page.getByRole("button", { name: "Edit details" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByLabel("Full name", { exact: true })).toHaveValue(PROFILE.fullName);
});

test("sends visitors without a profile back to the form", async ({ page }) => {
  await page.goto("/preview");
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/does-not-exist");
  await expect(page).toHaveURL(/\/$/);
});
