# Decision log

Record confirmed decisions here. Use **Proposed** for working assumptions and **Open** for unresolved questions.

## 2026-11-04 — Project direction and platform

- **Status:** Proposed, pending implementation decisions.
- **Context:** The user described a new project, first as car insurance and then corrected it to life insurance. They confirmed Australia as the launch market.
- **Decision:** Treat the product as an Australia-focused life insurance comparison app.
- **Platform direction:** GitHub repository mangodog-ai/artemis; Vercel hosting; Supabase database; Microsoft Entra ID as the source of app identity/permissions.
- **Working implementation proposal:** Supabase Auth Microsoft/Azure provider, Supabase Postgres with RLS.
- **Starter implementation:** Next.js App Router + React in JavaScript, with a static landing page and login placeholder.
- **Open:** Audience/access boundary, role/group model, comparison inputs and cover categories, insurer/product data source, quote/live pricing capability, personal/health data needs, business model, and regulatory positioning.
- **Reasoning:** The hosting/database/identity preferences are user-stated. The framework and auth flow are initial proposals because no scaffold or provider configuration exists yet.

### 2026-11-04 — Initial Entra access boundary

- **Status:** Accepted for the initial authentication implementation.
- **Context:** The login placeholder needed a concrete access boundary before connecting identity.
- **Decision:** Use single-tenant Microsoft Entra ID sign-in, require users to be assigned to the enterprise application, leave the landing and login pages public, and require a session for `/account`.
- **Consequences:** Authentication is implemented directly with a server-side OAuth/OIDC flow. No app roles or group-based authorization are configured; all assigned users receive the same basic access. Credentials are supplied through server-only environment variables and configured in Entra/Vercel using [the setup run sheet](./ENTRA_SETUP.md).

## Decision template

### YYYY-MM-DD — Short title

- **Status:** Proposed / Accepted / Rejected / Superseded.
- **Context:** What choice needed to be made?
- **Decision:** What was chosen?
- **Consequences:** What changes or constraints follow?
