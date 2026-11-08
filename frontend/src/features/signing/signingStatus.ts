/**
 * Signing state and its presentation, kept free of React so it can be tested
 * directly. `useDocumentSigning` owns the state; components render the view.
 */

export type SignMode = "user" | "admin";

export interface SigningFailure {
  mode: SignMode;
  /** "verification": signed, but the gateway rejected the signature. */
  kind: "verification" | "error";
  message: string;
}

export interface SigningState {
  /** The signing job in flight, if any. */
  activeJob: SignMode | null;
  /** Current step of the user flow, shown while it runs. */
  userStep: string;
  /** The user's own signature has been applied and verified. */
  userVerified: boolean;
  /** The organisation (admin) signature has been applied. */
  adminSigned: boolean;
  failure: SigningFailure | null;
}

export const INITIAL_SIGNING_STATE: SigningState = {
  activeJob: null,
  userStep: "",
  userVerified: false,
  adminSigned: false,
  failure: null,
};

export const USER_SIGNING_STEPS = {
  generating: "Generating PDF…",
  signing: "Signing document…",
  verifying: "Verifying signature…",
} as const;

export type StatusTone = "busy" | "signed" | "failed" | "ready" | "guest";
export type StepState = "done" | "active" | "pending";

export interface SigningView {
  isBusy: boolean;
  isSigned: boolean;
  tone: StatusTone;
  eyebrow: string;
  title: string;
  detail: string;
  /** Technical reason for a failure, shown beneath the detail. */
  failureReason?: string;
  /** One-line status for the sidebar's "Signed & verified" step. */
  signStepDetail: string;
  identityStepState: StepState;
  signStepState: StepState;
}

const ADMIN_BUSY_TITLE = "Signing as admin…";

function failureTitle(failure: SigningFailure): string {
  if (failure.mode === "admin") return "Admin signing failed";
  return failure.kind === "verification" ? "Verification failed" : "Signing failed";
}

function failureDetail(failure: SigningFailure): string {
  return failure.kind === "verification"
    ? "The signature was applied but couldn't be verified. Please try again."
    : "Something went wrong while signing. Please try again.";
}

export function deriveSigningView(state: SigningState, isAuthenticated: boolean): SigningView {
  const { activeJob, userStep, userVerified, adminSigned, failure } = state;
  const isBusy = activeJob !== null;
  const isSigned = userVerified || adminSigned;
  const activeFailure = isBusy ? null : failure;

  const busyTitle = activeJob === "admin" ? ADMIN_BUSY_TITLE : userStep;

  let tone: StatusTone;
  let title: string;
  let detail: string;

  if (isBusy) {
    tone = "busy";
    title = busyTitle;
    detail = "This usually takes a few seconds. Please keep this page open.";
  } else if (userVerified) {
    tone = "signed";
    title = "Document signed";
    detail = "Signature verified. Use the download button below to save the file.";
  } else if (adminSigned) {
    tone = "signed";
    title = "Signed by admin";
    detail = "The document carries the organisation's signature. Download it below.";
  } else if (activeFailure) {
    tone = "failed";
    title = failureTitle(activeFailure);
    detail = failureDetail(activeFailure);
  } else if (isAuthenticated) {
    tone = "ready";
    title = "Ready to sign";
    detail = "Apply your qualified digital signature to this document.";
  } else {
    tone = "guest";
    title = "Authorization required";
    detail = "You'll be asked to log in, then brought back here to sign.";
  }

  const eyebrow = userVerified
    ? "Verified"
    : adminSigned
      ? "Signed"
      : isAuthenticated
        ? "Authenticated"
        : "Guest";

  const signStepDetail = userVerified
    ? "Signature verified"
    : adminSigned
      ? "Signed by admin"
      : isBusy
        ? busyTitle
        : "Waiting for signature";

  return {
    isBusy,
    isSigned,
    tone,
    eyebrow,
    title,
    detail,
    failureReason: tone === "failed" ? activeFailure?.message : undefined,
    signStepDetail,
    identityStepState: isAuthenticated ? "done" : isSigned ? "pending" : "active",
    signStepState: isSigned ? "done" : isAuthenticated || isBusy ? "active" : "pending",
  };
}
