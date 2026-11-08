import { config } from "../config/env";
import { isRecord, nonEmptyString } from "../lib/guards";

/**
 * Client for the TSP gateway: PAdES signing (as the end user or as the
 * organisation/admin identity) and signature verification.
 *
 * SECURITY NOTE: admin signing and verification use an admin token fetched
 * directly by the browser. Anyone who can load this app can therefore sign as
 * the organisation. Before production, move `fetchAdminToken`, `signAsAdmin`
 * and `verifySignature` behind an authenticated backend.
 */

export class TspApiError extends Error {
  override name = "TspApiError";
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

const HTTP_UNAUTHORIZED = 401;

/** Visible-signature placement and format shared by every signing request. */
const PADES_SIGNATURE = {
  packaging: "ENVELOPED",
  signAlgorithm: "SHA256withRSA",
  signatureType: "PADES",
  signatureSubType: "PAdES_BASELINE_B",
} as const;

const USER_SIGNATURE_POSITION = { vSigPage: 1, vSigXPosition: 430, vSigYPosition: 750 } as const;
const ADMIN_SIGNATURE_POSITION = { vSigPage: 1, vSigXPosition: 197, vSigYPosition: 120 } as const;

const USER_SIGN_NOTIFICATION = "This sign will be used for document approval in a test project ";

/**
 * B-level signature attributes embedded in admin signatures.
 * TODO: placeholder values — replace with the organisation's real details.
 */
const ADMIN_SIGNATURE_ATTRIBUTES = {
  claimedSignerRole: "Signer",
  contactInfo: "contact@example.com",
  location: "Jakarta, Indonesia",
  reason: "Document Approval",
  signatureProductionPlace: {
    city: "Jakarta",
    country: "Indonesia",
    postalCode: "12345",
    stateOrProvince: "DKI Jakarta",
    street: "Jl. Sudirman No. 1",
  },
  signerName: "John Doe",
} as const;

// ── HTTP ──────────────────────────────────────────────────────────────────────

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** The service's own message from a response body, if it sent one. */
function serviceMessage(body: unknown): string | undefined {
  if (!isRecord(body)) return undefined;
  return (
    nonEmptyString(body.message) ??
    (isRecord(body.data) ? nonEmptyString(body.data.message) : undefined)
  );
}

async function requestJson(
  url: string,
  init: { method: "GET" | "POST"; token?: string; body?: unknown },
  failureLabel: string,
): Promise<unknown> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  if (init.token) headers.Authorization = `Bearer ${init.token}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: init.method,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new TspApiError(`${failureLabel}: the signing service is unreachable`);
  }

  const body = await readJson(response);
  if (!response.ok) {
    const detail = serviceMessage(body) ?? (response.statusText || `HTTP ${response.status}`);
    throw new TspApiError(`${failureLabel}: ${detail}`, response.status);
  }
  return body;
}

// ── Admin token ───────────────────────────────────────────────────────────────

let cachedAdminToken: string | null = null;

/** Extracts the bare token from `{ data: { token: "Bearer …" } }`. */
export function parseAdminToken(body: unknown): string {
  const raw = isRecord(body) && isRecord(body.data) ? nonEmptyString(body.data.token) : undefined;
  const token = raw?.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new TspApiError("Admin token response did not include a token");
  return token;
}

async function getAdminToken(): Promise<string> {
  if (!cachedAdminToken) {
    const body = await requestJson(
      config.tspAdminTokenUrl,
      { method: "GET" },
      "Fetching admin token failed",
    );
    cachedAdminToken = parseAdminToken(body);
  }
  return cachedAdminToken;
}

/** Runs a request with the admin token, refreshing it once if it was rejected. */
async function withAdminToken<T>(request: (token: string) => Promise<T>): Promise<T> {
  try {
    return await request(await getAdminToken());
  } catch (error) {
    if (!(error instanceof TspApiError) || error.status !== HTTP_UNAUTHORIZED) throw error;
    cachedAdminToken = null;
    return request(await getAdminToken());
  }
}

// ── Response parsing ──────────────────────────────────────────────────────────

/**
 * Pulls the signed PDF (base64) out of a sign response. The gateway returns it
 * as `signedData` at the top level or under `data`, as a string or a
 * single-item array.
 */
export function parseSignedData(body: unknown): string {
  const container = isRecord(body) ? body : {};
  const raw =
    (isRecord(container.data) ? container.data.signedData : undefined) ?? container.signedData;
  const signedData = nonEmptyString(Array.isArray(raw) ? raw[0] : raw);
  if (!signedData) {
    throw new TspApiError(serviceMessage(body) ?? "Signing response did not include signed data");
  }
  return signedData;
}

/** The gateway reports a valid signature as `{ code: 0, message: "Success" }`. */
export function isVerificationSuccessful(body: unknown): boolean {
  return isRecord(body) && body.code === 0 && body.message === "Success";
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface SignRequest {
  /** PDF contents, base64 encoded. */
  pdfBase64: string;
  fileName: string;
}

/** Signs with the signed-in user's own identity. Returns the signed PDF (base64). */
export async function signAsUser(
  { pdfBase64, fileName }: SignRequest,
  user: { id: string; accessToken: string },
): Promise<string> {
  const body = await requestJson(
    `${config.tspGatewayUrl}/signFile`,
    {
      method: "POST",
      token: user.accessToken,
      body: {
        ...PADES_SIGNATURE,
        ...USER_SIGNATURE_POSITION,
        data: pdfBase64,
        attached: true,
        fileNames: [fileName],
        hashAlgorithm: "SHA256",
        customNotification: USER_SIGN_NOTIFICATION,
        userId: user.id,
        vSigEnabled: true,
      },
    },
    "Signing failed",
  );
  return parseSignedData(body);
}

/** Signs with the organisation's admin identity. Returns the signed PDF (base64). */
export async function signAsAdmin({ pdfBase64, fileName }: SignRequest): Promise<string> {
  const body = await withAdminToken((token) =>
    requestJson(
      `${config.tspGatewayUrl}/v2/signFile`,
      {
        method: "POST",
        token,
        body: {
          ...PADES_SIGNATURE,
          bLevel: ADMIN_SIGNATURE_ATTRIBUTES,
          filledBLevelParameters: true,
          customNotification: "",
          digitalIdentityId: config.tspAdminDigitalIdentityId,
          documents: [
            { data: pdfBase64, fileName, vSigEnabled: true, ...ADMIN_SIGNATURE_POSITION },
          ],
          tsaHashAlgorithm: "SHA256",
          userId: config.tspAdminUserId,
        },
      },
      "Admin signing failed",
    ),
  );
  return parseSignedData(body);
}

/** Asks the gateway to validate a signed PDF. Resolves true when the signature is valid. */
export async function verifySignature({ pdfBase64, fileName }: SignRequest): Promise<boolean> {
  const body = await withAdminToken((token) =>
    requestJson(
      `${config.tspGatewayUrl}/verifyFile`,
      {
        method: "POST",
        token,
        body: {
          data: pdfBase64,
          localization: "en",
          fileNames: [fileName],
          userId: config.tspAdminUserId,
        },
      },
      "Verification failed",
    ),
  );
  return isVerificationSuccessful(body);
}
