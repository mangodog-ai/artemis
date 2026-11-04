# Microsoft Entra ID setup run sheet

This configures single-tenant Microsoft sign-in for assigned users. The landing
page and `/login` remain public; `/account` requires a valid Artemis session.
There are no app roles yet, so every user assigned to the enterprise application
gets the same sign-in access. Do not use this as authorization for future
comparison data or administrative actions without adding server-side role checks.

## 1. Register the application

1. Open the [Microsoft Entra admin center](https://entra.microsoft.com/) and go
   to **Identity → Applications → App registrations → New registration**.
2. Name the app `Artemis`.
3. Under supported account types, choose **Accounts in this organizational
   directory only (Single tenant)**.
4. Under **Redirect URI**, choose **Web** and add both:
   - `http://localhost:3000/api/auth/callback/azure-ad`
   - `https://artemis-mrai.vercel.app/api/auth/callback/azure-ad`
5. Select **Register**. From **Overview**, copy the **Application (client) ID**
   and **Directory (tenant) ID**.

If the production hostname changes, update the redirect URI here and set
`NEXTAUTH_URL` to that same canonical HTTPS origin in Vercel.

## 2. Create and assign access

1. In the app registration, open **Certificates & secrets → Client secrets →
   New client secret**. Set a description and an expiry that matches your
   organization's credential-rotation policy.
2. Copy the secret **Value** immediately. It is shown only once; the **Secret
   ID** is not the value the app needs.
3. Open the app's **Enterprise application** (from the registration overview or
   **Identity → Applications → Enterprise applications**).
4. Under **Properties**, set **Assignment required?** to **Yes**, then save.
5. Under **Users and groups**, assign only the people or groups that should be
   able to sign in. With no app roles configured, assign the default access.
6. Under **App registrations → Artemis → API permissions**, no Microsoft Graph
   permission is required for this sign-in flow. The app requests only the
   standard OpenID Connect `openid`, `profile`, and `email` scopes; it does not
   call Microsoft Graph.

Do not enable implicit ID/access token grants. The app uses the server-side
authorization-code flow.

## 3. Store credentials safely

The app reads server-only environment variables. None use a `NEXT_PUBLIC_`
prefix, and no credentials belong in source control.

| Variable | Value | Sensitive |
| --- | --- | --- |
| `NEXTAUTH_URL` | `http://localhost:3000` locally; canonical HTTPS app origin in Vercel | No |
| `NEXTAUTH_SECRET` | Generate a unique random value with `openssl rand -base64 32` | Yes |
| `AZURE_AD_TENANT_ID` | Directory (tenant) ID from the registration overview | No |
| `AZURE_AD_CLIENT_ID` | Application (client) ID from the registration overview | No |
| `AZURE_AD_CLIENT_SECRET` | Client secret **Value** copied in step 2 | Yes |

- **Local development:** put these values in `.env.local` (copy
  `.env.example` as a template). `.env.local` is ignored by Git. Keep it on a
  trusted, encrypted device; do not paste secret values into chat, tickets, or
  commits.
- **Vercel:** add the variables in **Project → Settings → Environment
  Variables** for **Production**. Mark `NEXTAUTH_SECRET` and
  `AZURE_AD_CLIENT_SECRET` as **Sensitive** where the plan supports it, limit
  project access, and redeploy after changing values. Vercel is the runtime
  secret store; do not add them as build-time public variables.
- Do not share production credentials with Preview deployments. If preview
  sign-in is needed, create a separate Entra registration and secret with its
  own exact redirect URI and Vercel Preview variables.
- Keep the Entra secret's expiry in an owner-maintained calendar or secret
  manager. To rotate it, add a new secret, update the Vercel value, redeploy and
  test sign-in, then remove the old secret before it expires.

## 4. Verify the setup

1. Run `npm run dev`, then open `http://localhost:3000/login`.
2. Select **Continue with Microsoft** and sign in with an assigned account from
   the configured tenant. Confirm the browser returns to `/account`.
3. Sign out and confirm `/account` redirects to `/login`.
4. Try an account not assigned to the enterprise app; Entra should deny access.
5. After setting the Production variables, redeploy and repeat the test at the
   production hostname.

If sign-in is rejected, confirm the tenant ID, client ID and secret **Value**,
the exact callback URI, assignment-required setting, user/group assignment,
`NEXTAUTH_URL`, and `NEXTAUTH_SECRET`. Never put secret values in diagnostic
logs.
