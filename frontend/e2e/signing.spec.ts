import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import {
  ADMIN_TOKEN,
  SIGNED_PDF_BASE64,
  TEST_USER,
  USER_TOKEN,
  fakeAasSdk,
  fakeGateway,
} from "./support/fakes";
import { PROFILE, submitProfile } from "./support/profile";

const status = (page: Page) => page.locator("#sign-status-title");
const downloadButton = (page: Page) => page.getByRole("button", { name: "Download signed PDF" });

async function expectSignedDownload(page: Page) {
  await expect(downloadButton(page)).toBeEnabled();
  const [download] = await Promise.all([page.waitForEvent("download"), downloadButton(page).click()]);
  expect(download.suggestedFilename()).toBe("Signed_Profile_Ada_Lovelace.pdf");
  const bytes = await readFile(await download.path());
  expect(bytes.toString("base64")).toBe(SIGNED_PDF_BASE64);
}

test.beforeEach(async ({ page }) => {
  await fakeAasSdk(page);
});

test.describe("admin signing", () => {
  test("signs with the organisation identity and offers the signed PDF", async ({ page }) => {
    const gateway = await fakeGateway(page);
    await submitProfile(page);

    await expect(status(page)).toHaveText("Authorization required");
    await expect(downloadButton(page)).toBeDisabled();

    await page.getByRole("button", { name: "Sign as admin" }).click();
    await expect(status(page)).toHaveText("Signed by admin");
    await expect(page.getByRole("button", { name: "Document signed by admin" })).toBeDisabled();

    const [signRequest] = gateway.to("/v2/signFile");
    expect(signRequest.headers()["authorization"]).toBe(`Bearer ${ADMIN_TOKEN}`);
    const body = signRequest.postDataJSON();
    expect(body).toMatchObject({
      digitalIdentityId: "e2e-admin-identity",
      userId: "e2e-admin-user",
      signatureType: "PADES",
      documents: [{ fileName: "Profile_Ada_Lovelace.pdf" }],
    });
    // The document sent for signing is a real PDF generated in the browser.
    expect(Buffer.from(body.documents[0].data, "base64").subarray(0, 5).toString()).toBe("%PDF-");

    await expectSignedDownload(page);
  });

  test("shows the gateway's reason when admin signing fails", async ({ page }) => {
    await fakeGateway(page, {
      adminSign: () => ({ status: 500, body: { message: "Signing key unavailable" } }),
    });
    await submitProfile(page);

    await page.getByRole("button", { name: "Sign as admin" }).click();
    await expect(status(page)).toHaveText("Admin signing failed");
    await expect(page.getByText("Admin signing failed: Signing key unavailable")).toBeVisible();
    await expect(downloadButton(page)).toBeDisabled();
    await expect(page.getByRole("button", { name: "Sign as admin" })).toBeEnabled();
  });
});

test.describe("user signing", () => {
  test("logs in, keeps the profile through the redirect, signs and verifies", async ({ page }) => {
    const gateway = await fakeGateway(page);
    await submitProfile(page);

    await page.getByRole("button", { name: "Log in & sign" }).click();

    // Back from the identity provider: signed in, callback params removed, profile intact.
    await expect(page.getByText(TEST_USER.email).first()).toBeVisible();
    await expect(page).toHaveURL(/\/preview$/);
    await expect(page.getByRole("article", { name: "Document preview" })).toContainText(
      PROFILE.fullName,
    );
    await expect(status(page)).toHaveText("Ready to sign");

    await page.getByRole("button", { name: "Complete signature" }).click();
    await expect(status(page)).toHaveText("Document signed");
    await expect(page.getByRole("button", { name: "Successfully signed" })).toBeDisabled();

    const [signRequest] = gateway.to("/signFile");
    expect(signRequest.headers()["authorization"]).toBe(`Bearer ${USER_TOKEN}`);
    expect(signRequest.postDataJSON()).toMatchObject({
      userId: TEST_USER.sub,
      fileNames: ["Profile_Ada_Lovelace.pdf"],
    });

    const [verifyRequest] = gateway.to("/verifyFile");
    expect(verifyRequest.headers()["authorization"]).toBe(`Bearer ${ADMIN_TOKEN}`);
    expect(verifyRequest.postDataJSON()).toMatchObject({ data: SIGNED_PDF_BASE64 });

    await expectSignedDownload(page);
  });

  test("reports a signature that fails verification", async ({ page }) => {
    await fakeGateway(page, { verify: () => ({ body: { code: 3, message: "Invalid signature" } }) });
    await submitProfile(page);
    await page.getByRole("button", { name: "Log in & sign" }).click();
    await expect(status(page)).toHaveText("Ready to sign");

    await page.getByRole("button", { name: "Complete signature" }).click();
    await expect(status(page)).toHaveText("Verification failed");
    await expect(downloadButton(page)).toBeDisabled();
    await expect(page.getByRole("button", { name: "Complete signature" })).toBeEnabled();
  });

  test("logging out returns to guest mode", async ({ page }) => {
    await fakeGateway(page);
    await submitProfile(page);
    await page.getByRole("button", { name: "Log in & sign" }).click();
    await expect(status(page)).toHaveText("Ready to sign");

    await page.getByRole("button", { name: "Log out", exact: true }).click();
    await expect(status(page)).toHaveText("Authorization required");
    expect(await page.evaluate(() => (globalThis as { __aasLoggedOut?: boolean }).__aasLoggedOut)).toBe(true);
  });
});
