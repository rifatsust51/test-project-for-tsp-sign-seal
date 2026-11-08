/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TSP_GATEWAY_URL?: string;
  readonly VITE_TSP_ADMIN_TOKEN_URL?: string;
  readonly VITE_TSP_ADMIN_USER_ID?: string;
  readonly VITE_TSP_ADMIN_DIGITAL_IDENTITY_ID?: string;
  readonly VITE_AAS_CONFIG_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
