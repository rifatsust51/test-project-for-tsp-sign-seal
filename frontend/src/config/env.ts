/**
 * Runtime configuration, read once from Vite's `import.meta.env`.
 *
 * Every value here is compiled into the public bundle, so nothing secret may
 * live in a `VITE_*` variable. See `.env.example` for the full list.
 */

type EnvKey =
  | "VITE_TSP_GATEWAY_URL"
  | "VITE_TSP_ADMIN_TOKEN_URL"
  | "VITE_TSP_ADMIN_USER_ID"
  | "VITE_TSP_ADMIN_DIGITAL_IDENTITY_ID"
  | "VITE_AAS_CONFIG_PATH";

type EnvSource = Partial<Record<EnvKey, string | undefined>>;

export interface AppConfig {
  /** Base URL of the TSP gateway service, without a trailing slash. */
  tspGatewayUrl: string;
  /** Endpoint that issues the TSP admin bearer token. */
  tspAdminTokenUrl: string;
  /** TSP user that owns admin signatures and verification requests. */
  tspAdminUserId: string;
  /** Digital identity used for admin (organisation) signatures. */
  tspAdminDigitalIdentityId: string;
  /** Path of the AAS (Keycloak) client config, relative to the site root. */
  aasConfigPath: string;
}

export class ConfigError extends Error {
  override name = "ConfigError";
}

function required(source: EnvSource, key: EnvKey, missing: string[]): string {
  const value = source[key]?.trim();
  if (!value) {
    missing.push(key);
    return "";
  }
  return value;
}

function requiredUrl(source: EnvSource, key: EnvKey, missing: string[]): string {
  const value = required(source, key, missing);
  if (!value) return value;
  try {
    new URL(value);
  } catch {
    throw new ConfigError(`${key} is not a valid absolute URL: "${value}"`);
  }
  return value.replace(/\/+$/, "");
}

/** Validates raw env values; throws a ConfigError naming every missing variable. */
export function parseConfig(source: EnvSource): AppConfig {
  const missing: string[] = [];
  const config: AppConfig = {
    tspGatewayUrl: requiredUrl(source, "VITE_TSP_GATEWAY_URL", missing),
    tspAdminTokenUrl: requiredUrl(source, "VITE_TSP_ADMIN_TOKEN_URL", missing),
    tspAdminUserId: required(source, "VITE_TSP_ADMIN_USER_ID", missing),
    tspAdminDigitalIdentityId: required(source, "VITE_TSP_ADMIN_DIGITAL_IDENTITY_ID", missing),
    aasConfigPath: source.VITE_AAS_CONFIG_PATH?.trim() || "aas.json",
  };

  if (missing.length > 0) {
    throw new ConfigError(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        "Copy .env.example to .env.local and fill them in.",
    );
  }
  return config;
}

export const config: AppConfig = parseConfig(import.meta.env);
