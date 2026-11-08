import { config } from "../config/env";
import { isRecord, nonEmptyString } from "../lib/guards";

/**
 * Typed surface of the AAS SDK (a Keycloak wrapper) loaded by index.html from
 * public/aas.min.js. Only the wrapper methods this app uses are declared, and
 * they are typed after what the wrapper actually does — not what Keycloak's
 * own API accepts.
 */
export interface AasClient {
  /**
   * Runs Keycloak `login-required` with PKCE (S256). The wrapper takes no
   * options. Redirects to the login page when there is no session; resolves
   * `true` once a session (or a returning login callback) is established.
   */
  init(): Promise<boolean>;
  /** Current raw access token, if authenticated. */
  getToken(): string | undefined;
  /** Parsed access-token claims, serialised as a JSON string (not an object). */
  getTokenParsed(): string;
  /** Refreshes the token if it expires within 5 s; rejects without a refresh token. */
  updateToken(): Promise<boolean>;
  /** Ends the SSO session and redirects to the realm's configured logout target. */
  logout(): unknown;
}

type AasFactory = (configPath: string) => AasClient;

declare global {
  interface Window {
    AAS?: AasFactory;
  }
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
}

export class AasUnavailableError extends Error {
  override name = "AasUnavailableError";
  constructor() {
    super("The sign-in SDK failed to load. Check your connection and reload the page.");
  }
}

/** Creates a fresh SDK instance. Keycloak instances can only be initialised once. */
export function createAasClient(): AasClient {
  if (!window.AAS) throw new AasUnavailableError();
  return window.AAS(config.aasConfigPath);
}

/** True when the URL carries a Keycloak authorization-code callback (query or fragment mode). */
export function isLoginCallback(url: string): boolean {
  return (
    (url.includes("code=") && url.includes("state=")) ||
    (url.includes("#state=") && url.includes("&code="))
  );
}

/** Builds the signed-in user's profile from the SDK's serialised token claims. */
export function parseUserProfile(tokenClaimsJson: string): UserProfile | null {
  let claims: unknown;
  try {
    claims = JSON.parse(tokenClaimsJson);
  } catch {
    return null;
  }
  if (!isRecord(claims)) return null;

  const id = nonEmptyString(claims.sub);
  if (!id) return null;

  return {
    id,
    name: nonEmptyString(claims.name) ?? nonEmptyString(claims.preferred_username) ?? "",
    email: nonEmptyString(claims.email) ?? "No Email",
  };
}

/** Removes the login-callback parameters from the address bar without a reload. */
export function clearLoginCallbackFromUrl(): void {
  window.history.replaceState(window.history.state, document.title, window.location.pathname);
}
