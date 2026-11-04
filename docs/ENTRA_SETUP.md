# Microsoft Entra ID and Supabase run sheet

The app uses Supabase Auth as the session broker for the existing single-tenant
Entra application. Users must be assigned to the Entra enterprise app. Supabase
Auth creates the verified session used by Postgres Row Level Security (RLS);
the app does not use a Supabase service-role key.

## 1. Configure the Entra app registration

1. In the [Microsoft Entra admin center](https://entra.microsoft.com/), open
   **Identity → Applications → App registrations → Artemis**.
2. Under **Authentication**, add a **Web** redirect URI for the Supabase Auth
   callback:
   `https://<your-project-ref>.supabase.co/auth/v1/callback`
3. Keep the application single-tenant. In **Enterprise applications**, keep
   **Assignment required?** set to **Yes**, and assign the permitted users or
   groups. Invited external users must accept their guest invitation and be
   assigned.
4. Under **Certificates & secrets → Client secrets**, create a secret. Copy
   the **Value** (not the Secret ID) when configuring the Supabase provider.
   Record its expiry and rotate before it expires.
5. To provide a verified-email indicator, add the following optional claims to
   the app registration manifest's `optionalClaims` object. Merge these into
   existing entries rather than replacing other configured claims:

   ```json
   {
     "idToken": [
       { "name": "xms_edov", "source": null, "essential": false, "additionalProperties": [] },
       { "name": "email", "source": null, "essential": false, "additionalProperties": [] }
     ],
     "accessToken": [
       { "name": "xms_edov", "source": null, "essential": false, "additionalProperties": [] }
     ],
     "saml2Token": []
   }
   ```

No Microsoft Graph API permission is required. The app requests the OIDC
`email` scope and does not call Graph.

## 2. Configure Supabase Auth with Azure

1. In Supabase, open **Authentication → Sign In / Providers → Azure** and
   enable the provider.
2. Enter the Entra **Application (client) ID** and the client secret **Value**.
   Store the secret in Supabase's provider configuration; do not put it in
   Vercel or the application.
3. Set **Azure Tenant URL** to
   `https://login.microsoftonline.com/<your-directory-tenant-id>` to pin
   authentication to the intended tenant. Do not leave it set to `common`.
4. Save the provider.
5. Under **Authentication → URL Configuration**, set the production **Site
   URL** to `https://<your-production-host>`. Add these **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://<your-production-host>/auth/callback`
   - Any exact Vercel preview callback URLs used for testing. Avoid broad
     wildcard entries unless their security implications are understood.

Supabase's Azure callback is the URI registered in Entra in step 1. The
application callback (`/auth/callback`) is where Supabase redirects after
processing its OAuth response.

## 3. Configure application environment

The app needs the project's URL and publishable key only. Both are intended for
browser use; database authorization is enforced by RLS.

| Variable | Value | Secret |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL from **Project Settings → API** | No |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Project publishable key from **Project Settings → API Keys** | No |

- **Local:** copy `.env.example` to `.env.local` and set both values.
  `.env.local` is ignored by Git.
- **Vercel:** add both values to the intended environments under **Project →
  Settings → Environment Variables**, then redeploy.
- Do not add a service-role/secret key, Entra client secret, or database
  password to the app environment.

After confirming the new Supabase-based sign-in works, remove the old
`NEXTAUTH_*` and `AZURE_AD_*` application environment variables from Vercel.
You can then remove the obsolete Entra callback URI ending in
`/api/auth/callback/azure-ad`.

## 4. Apply the comparison database migration

Apply
[`supabase/migrations/20261104000000_comparison_engine.sql`](../supabase/migrations/20261104000000_comparison_engine.sql)
to the configured Supabase project using the SQL Editor or the Supabase CLI.
The migration creates the provider catalog, source-backed product/cover data,
private comparison history and result snapshots, RLS policies, and admin
functions.

The migration seeds only provider names (Medibank, AHM, TAL) and cover-type
labels. It does not seed products, policy terms, or prices. Add only authorized,
source-backed product facts. Price examples must include the exact assumptions
and source; the comparison engine shows a price only for an exact match.

### Grant catalog-entry access

After the intended administrator has signed in once, find their UUID under
**Authentication → Users** and add it to the private admin allow-list in the
SQL Editor:

```sql
insert into public.artemis_admins (user_id)
values ('<supabase-auth-user-uuid>')
on conflict (user_id) do nothing;
```

Only this explicit database allow-list can add or verify provider catalog
records. Users cannot edit their own admin status through the application.

## 5. Verify deployment

1. Confirm the Azure provider is enabled and pinned to the correct tenant.
2. Confirm the Entra app has the Supabase Auth callback URI and assigned users.
3. Confirm the Supabase migration has been applied.
4. Set the two public Supabase environment variables in Vercel and redeploy.
5. Sign in at `/login`; confirm the browser returns to `/compare`.
6. Confirm a signed-out request to `/compare` redirects to sign-in.
7. Save a comparison and confirm it appears in `/comparisons`; sign in as a
   different assigned user and confirm the first user's comparison is not
   visible.
8. Add an administrator through the SQL allow-list, enter a draft catalog
   record at `/admin/catalog`, verify its source, then confirm only the verified
   entry appears in new comparisons.

The comparison form stores cover type, amount, age, state, and premium basis
after the user accepts the notice. It does not ask for health, smoking, or
occupation details. Users can delete their own saved comparisons. Set and
review the broader privacy, retention, backup, and deletion policy before
production use with real customer data.
