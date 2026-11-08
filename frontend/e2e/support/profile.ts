import { expect, type Page } from "@playwright/test";

export const PROFILE = {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  phoneNumber: "+8801700000000",
  dob: "1990-05-14",
  nid: "19901234567890",
  currentSalary: "75000",
  emergencyContactName: "Fatima Rahman",
  emergencyContactNumber: "+8801800000000",
};

const LABELS: Record<keyof typeof PROFILE, string> = {
  fullName: "Full name",
  email: "Email address",
  phoneNumber: "Phone number",
  dob: "Date of birth",
  nid: "National ID (NID)",
  currentSalary: "Current salary",
  emergencyContactName: "Contact full name",
  emergencyContactNumber: "Contact phone number",
};

export async function fillProfileForm(page: Page, profile = PROFILE) {
  for (const [key, label] of Object.entries(LABELS) as [keyof typeof PROFILE, string][]) {
    await page.getByLabel(label, { exact: true }).fill(profile[key]);
  }
}

/** Fills the form and lands on the preview page. */
export async function submitProfile(page: Page) {
  await page.goto("/");
  await fillProfileForm(page);
  await page.getByRole("button", { name: "Generate PDF preview" }).click();
  await expect(page).toHaveURL(/\/preview$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Review & sign");
}
