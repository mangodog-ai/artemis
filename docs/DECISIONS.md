# Decision log

Record confirmed decisions here. Use **Proposed** for working assumptions and **Open** for unresolved questions.

## 2026-11-04 — Project direction and platform

- **Status:** Proposed, pending implementation decisions.
- **Context:** The user described a new project, first as car insurance and then corrected it to life insurance. They confirmed Australia as the launch market.
- **Decision:** Treat the product as an Australia-focused life insurance comparison app.
- **Platform direction:** GitHub repository mangodog-ai/artemis; Vercel hosting; Supabase database; Microsoft Entra ID as the source of app identity/permissions.
- **Initial implementation proposal:** Supabase Auth Microsoft/Azure provider, Supabase Postgres with RLS.
- **Starter implementation:** Next.js App Router + React in JavaScript, with a static landing page and login placeholder.
- **Open:** Audience/access boundary, role/group model, comparison inputs and cover categories, insurer/product data source, quote/live pricing capability, personal/health data needs, business model, and regulatory positioning.
- **Reasoning:** The hosting/database/identity preferences are user-stated. The framework and auth flow are initial proposals because no scaffold or provider configuration exists yet.

### 2026-11-04 — Initial Entra access boundary (superseded)

- **Status:** Accepted for the initial authentication implementation.
- **Context:** The login placeholder needed a concrete access boundary before connecting identity.
- **Decision:** Use single-tenant Microsoft Entra ID sign-in, require users to be assigned to the enterprise application, leave the landing and login pages public, and require a session for `/account`.
- **Consequences:** The initial NextAuth flow was replaced with Supabase Auth so Supabase RLS can use the authenticated user identity.

### 2026-11-04 — Comparison engine and Supabase identity

- **Status:** Accepted.
- **Context:** Save each user's comparisons in Supabase with database-enforced private ownership while retaining Entra as the identity provider.
- **Decision:** Use Supabase Auth's Azure provider to broker the existing single-tenant Entra app. Compare manually curated, source-backed product information for life, TPD, trauma, and income protection. The initial comparison form stores cover type, amount, age, state, and premium basis. Show a price only for a verified source premium with an exact match to all comparison assumptions; do not calculate prices.
- **Provider scope:** Seed provider-name entries for Medibank, AHM, and TAL. Add other providers/products only after source and redistribution rights are verified.
- **Authorization:** RLS limits comparison history and result snapshots to the signed-in Supabase user. Catalog administration uses a separate database allow-list; entries remain drafts until verified.
- **Consequences:** Supabase Auth must be configured with the Entra tenant, the Azure callback must point to Supabase, and the comparison SQL migration must be applied. No live insurer integrations or product facts/premiums are included.
- **Superseded:** The later quote-profile decision permits collecting and storing provider-required underwriting details for future quote requests, after its safeguards are implemented.

### 2026-11-09 — Underwriting profile for future quote retrieval

- **Status:** Accepted product direction; a fictional-data test implementation exists. Production use remains blocked on privacy/security design and provider permission.
- **Context:** The user wants Artemis to collect and store underwriting details once, then reuse them to reduce repeated data entry when requesting insurer quotes.
- **Decision:** Allow a future private, user-owned underwriting profile with only the fields needed by a selected provider quote. Obtain distinct affirmative consent to store those answers and to send them to each named provider. Preview exact answers and require confirmation before submission. Do not infer or fabricate answers; never purchase a policy or submit an application.
- **Security requirements:** The test profile and request snapshots use application-layer encryption, a server-only key, and owner-scoped RLS. Production use additionally needs reviewed consent, key management, access, and retention/deletion controls before real data is stored.
- **Provider access:** No insurer-site automation until the specific channel has an approved API/feed or written permission. Budget Direct terms expressly prohibit scraping and systematic quote gathering. See docs/QUOTE_AGENT.md.
- **Supersedes:** The earlier 2026-11-04 decision not to collect smoking, occupation, or health details for the initial comparison inputs. The comparison form remains unchanged; the separate quote lab accepts fictional test answers only.

## Decision template

### YYYY-MM-DD — Short title

- **Status:** Proposed / Accepted / Rejected / Superseded.
- **Context:** What choice needed to be made?
- **Decision:** What was chosen?
- **Consequences:** What changes or constraints follow?
