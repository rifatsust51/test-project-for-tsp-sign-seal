# RVL-TSP — Sign & Seal (frontend)

React + TypeScript SPA that turns an employee-profile form into a PDF and signs
it through the RVL TSP gateway (PAdES), either with the signed-in user's own
identity or with the organisation's admin identity.

## Flow

1. **Details** (`/`) — the user fills in the profile form (validated client-side).
2. **Preview** (`/preview`) — the profile is rendered as a document.
3. **Sign & seal**
   - _Log in & sign_: AAS (Keycloak) login → sign with the user's identity → verify → download.
   - _Sign as admin_: sign with the organisation identity → download.

The submitted profile is kept in `sessionStorage` so it survives the login redirect.

## Getting started

```bash
cp .env.example .env.local   # then adjust values
npm install
npm run dev                  # http://127.0.0.1:8082
```

The AAS client config is served from `public/aas.json`; the SDK itself is
`public/aas.min.js`, loaded by `index.html`.

## Scripts

| Command             | Purpose                                 |
| ------------------- | --------------------------------------- |
| `npm run dev`       | Vite dev server                         |
| `npm run build`     | Type-check and production build         |
| `npm run check`     | Type-check + lint + unit tests (run before pushing) |
| `npm test`          | Unit tests (Vitest)                     |
| `npm run test:watch`| Tests in watch mode                     |
| `npm run test:e2e`  | End-to-end tests (Playwright)           |

## Testing

- **Unit** (`src/**/*.test.ts`, Vitest): validation, formatting, storage
  parsing, signing status logic, token/claims parsing, and the gateway client
  with a mocked `fetch`.
- **End-to-end** (`e2e/`, Playwright): drives the real app in Chrome through
  form validation, preview, the login redirect, user signing + verification,
  admin signing, failures, logout and the signed-PDF download. The AAS SDK and
  the TSP gateway are replaced by fakes (`e2e/support/fakes.ts`), so the suite
  is offline and deterministic. It uses the installed Google Chrome; run
  `PW_CHANNEL= npx playwright install chromium` to use Playwright's Chromium instead.

## Configuration

All settings are `VITE_*` variables, validated at startup by
`src/config/env.ts` (the app fails fast with a list of anything missing). See
`.env.example`. They are compiled into the public bundle — **never put secrets
in them**.

## Project structure

```
src/
  app/                 App shell, routes
  auth/                AAS SDK typing, AuthProvider + useAuth
  config/              Validated environment config
  services/            TSP gateway client (sign, admin sign, verify)
  features/
    profile/           Form page, schema/validation, storage, formatting, PDF rendering
    signing/           Preview page, document, signing panel, useDocumentSigning, status logic
  components/          Shared UI: icons, sidebar shell, flow stepper
  lib/                 Small framework-free helpers (guards, errors, files)
```

Conventions: business logic lives in plain `.ts` modules with co-located
`*.test.ts` files; components stay presentational; untrusted data (API bodies,
token claims, storage) is validated before use.

## Credentials

Certificates, keys and env files are git-ignored (`certificates/`, `*.pfx`,
`*.p12`, `*.pem`, `*.key`, `.env*`). Keep the TSP client certificate
(`certificates/tspgw_client.pfx`) locally or in a secret store — never commit it.

## Known limitations

- **Admin signing runs in the browser.** The admin token endpoint is called
  directly from the client, so anyone who can open the app can sign as the
  organisation. Admin token retrieval, admin signing and verification must
  move behind an authenticated backend before production.
- Admin signature attributes (signer name, location…) in
  `src/services/tspGateway.ts` are placeholders.
