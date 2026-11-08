/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "127.0.0.1",
    port: 8082,
    allowedHosts: ["buirdly-humourless-cecelia.ngrok-free.dev"],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Deterministic config for unit tests, independent of the developer's .env.local.
    env: {
      VITE_TSP_GATEWAY_URL: "https://tsp.test/gateway",
      VITE_TSP_ADMIN_TOKEN_URL: "https://tsp.test/admin/token",
      VITE_TSP_ADMIN_USER_ID: "admin-user",
      VITE_TSP_ADMIN_DIGITAL_IDENTITY_ID: "admin-identity",
      VITE_AAS_CONFIG_PATH: "aas.json",
    },
  },
});
