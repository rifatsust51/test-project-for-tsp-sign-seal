import { describe, expect, it } from "vitest";
import { INITIAL_SIGNING_STATE, deriveSigningView, type SigningState } from "./signingStatus";

const state = (overrides: Partial<SigningState>): SigningState => ({
  ...INITIAL_SIGNING_STATE,
  ...overrides,
});

describe("deriveSigningView", () => {
  it("asks a guest to log in", () => {
    const view = deriveSigningView(INITIAL_SIGNING_STATE, false);
    expect(view).toMatchObject({
      tone: "guest",
      eyebrow: "Guest",
      title: "Authorization required",
      identityStepState: "active",
      signStepState: "pending",
    });
  });

  it("is ready once authenticated", () => {
    expect(deriveSigningView(INITIAL_SIGNING_STATE, true)).toMatchObject({
      tone: "ready",
      eyebrow: "Authenticated",
      identityStepState: "done",
      signStepState: "active",
    });
  });

  it("shows the current user step while busy and hides old failures", () => {
    const view = deriveSigningView(
      state({
        activeJob: "user",
        userStep: "Signing document…",
        failure: { mode: "user", kind: "error", message: "old" },
      }),
      true,
    );
    expect(view).toMatchObject({ tone: "busy", title: "Signing document…", isBusy: true });
    expect(view.failureReason).toBeUndefined();
  });

  it("reports admin failures with the reason", () => {
    const view = deriveSigningView(
      state({ failure: { mode: "admin", kind: "error", message: "Admin signing failed: 500" } }),
      false,
    );
    expect(view).toMatchObject({
      tone: "failed",
      title: "Admin signing failed",
      failureReason: "Admin signing failed: 500",
    });
  });

  it("distinguishes a verification failure", () => {
    const view = deriveSigningView(
      state({ failure: { mode: "user", kind: "verification", message: "x" } }),
      true,
    );
    expect(view.title).toBe("Verification failed");
    expect(view.detail).toMatch(/couldn't be verified/);
  });

  it("prefers the user's verified signature over the admin one", () => {
    const view = deriveSigningView(state({ userVerified: true, adminSigned: true }), true);
    expect(view).toMatchObject({
      tone: "signed",
      eyebrow: "Verified",
      title: "Document signed",
      isSigned: true,
      signStepState: "done",
    });
  });

  it("marks an admin-signed guest document as signed", () => {
    expect(deriveSigningView(state({ adminSigned: true }), false)).toMatchObject({
      title: "Signed by admin",
      identityStepState: "pending",
      signStepDetail: "Signed by admin",
    });
  });
});
