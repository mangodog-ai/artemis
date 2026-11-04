# Feature list

Status labels: **Candidate** means proposed for consideration; **Blocked on decision** means scope depends on an unresolved product or data decision; **Later** means explicitly outside the first thin slice for now.

Checked items indicate implemented application/database code. Supabase setup,
migration application, verified provider data, and production sign-in still
need to be completed in the project using [the setup run sheet](ENTRA_SETUP.md).

## Starter site

- [x] Under-construction home page with a sign-in entry point.
- [x] Login screen for invited Microsoft Entra users.
- [ ] Configure the Supabase Auth Azure provider and production callback for the single-tenant Entra app.

## MVP candidates

- [ ] Supabase Auth Azure sign-in and sign-out, restricted to the configured tenant and assigned users (awaiting portal migration and Vercel verification).
- [ ] Authorization mapped to explicitly approved Entra app roles or groups.
- [x] Per-user comparison storage and RLS; each user can read/delete only their own history.
- [x] Comparison input flow for cover type, amount, age, state, and premium basis, with a save notice.
- [x] Side-by-side comparison table for verified cover details; prices appear only for exact, source-backed assumption matches.
- [x] Product facts and sourced premium examples retain source URL, captured date, and effective dates.
- [x] Admin-only catalog entry and source verification workflow; admin identities are explicitly allow-listed in the database.
- [x] Empty state when no verified source-backed products match; invalid-input, authentication, and database errors are surfaced.
- [ ] Privacy notice, consent, retention, and deletion behavior defined for any personal data collected.
- [ ] Full audit trail for every administrative catalog change.

## Blocked on product/data decisions

- [ ] Personal quote requests or insurer quote integrations.
- [ ] Recommendations, rankings, suitability scores, or “best policy” language.
- [ ] Adviser/broker referral or lead capture.
- [ ] Application or purchase handoff.
- [ ] Adviser workspaces, saved customer comparisons, or organization hierarchies.
- [ ] Consumer self-registration or access outside a managed Entra tenant.

## Later candidates

- [x] Saved private comparisons and comparison history, with user-initiated deletion.
- [ ] Notifications when source data changes.
- [ ] Additional cover categories and more insurer data sources.
- [ ] Exportable comparison summaries.
- [ ] Analytics on usage and funnel completion, with privacy-conscious aggregation.

## Not in scope until explicitly agreed

- Medical underwriting or automated eligibility decisions.
- Binding insurance advice or policy purchase within the app.
- Claims management.
- Any representation that a displayed amount is an insurer-approved quote unless the source explicitly confirms it.
