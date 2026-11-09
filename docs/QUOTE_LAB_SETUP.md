# Fictional quote lab setup

The quote lab is a test-only page at /quote-lab. It stores only user-provided fictional test data. It does not connect to insurer quote sites, submit requests, or create real quotes.

## 1. Apply the migration

Apply supabase/migrations/20261109000000_underwriting_quote_lab.sql after 20261104000000_comparison_engine.sql in the same Supabase project. It creates:

- quote_profiles: one encrypted underwriting profile per Supabase user.
- quote_requests: an encrypted snapshot of the profile and the selected product/cover assumptions. Requests created by the UI remain drafts and are never sent.
- quote_results: owner-scoped result records. The current UI can save only simulated_test results.

RLS policies bind every profile, request, and result to the signed-in user's auth.uid(). The application does not use the service-role key.

## 2. Set the encryption key

Set UNDERWRITING_ENCRYPTION_KEY to a base64-encoded, randomly generated 32-byte key in local .env.local and the test deployment's server-only Vercel environment variables. For example, generate a key locally with openssl rand -base64 32. Do not commit the value or expose it with a NEXT_PUBLIC_ variable.

Keep the same key while encrypted rows exist. Losing it makes the stored test profile and request snapshots unreadable. Key rotation needs a versioned re-encryption procedure before changing the key.

## 3. Test workflow

1. Sign in through the configured Entra/Supabase test environment.
2. Open /quote-lab and enter fictional values only.
3. Save the profile. The server encrypts the JSON payload using AES-256-GCM before inserting it into Supabase.
4. Create a draft for one of the listed providers. It copies the encrypted profile snapshot and clearly records that no data was sent.
5. Add a fictional premium and source URL to exercise result storage. The result is marked simulated_test in the database and UI.

The underwriting profile can be deleted from the page. Delete each draft request separately to cascade-delete its simulated results.
