# Product brief

## Current direction

Build an Australia-focused app that helps users compare life insurance cover. Comparisons should make differences between products understandable and show where prices and terms came from. This brief records direction, not verified insurance, legal, or compliance requirements.

## Intended users

Not yet confirmed. Possible audiences include consumers comparing cover, advisers or brokers preparing comparisons, and internal staff maintaining product data. The initial access boundary is single-tenant Entra sign-in for assigned users; the intended audience and any role-based permissions remain open.

## Problem to solve

People need a trustworthy way to compare life cover when product definitions, pricing assumptions, exclusions, and eligibility differ. The app should make those differences visible rather than reducing the decision to a single price.


## MVP outcome

A user with permitted access can select or enter a defined set of comparison assumptions, view comparable life cover options, understand key differences and limitations, and see when and how each item of data was obtained.

## Product principles

1. **Comparable inputs:** make the assumptions behind each comparison visible.
2. **Explain differences:** present cover, exclusions, waiting/benefit conditions, and pricing context in plain language where source material supports it.
3. **Show provenance:** label data as live, indicative, manually maintained, or historical; show source and date.
4. **Minimize sensitive data:** do not collect health details or identity documents unless the selected user journey requires them.
5. **Respect boundaries:** the product's role (information, lead generation, advice, or quote facilitation) must be agreed before designing recommendation flows.

## MVP decisions to resolve

- Who uses the app: consumers, advisers, internal operations, or a combination?
- Who should administer product data? Initial catalog administrators are individually allow-listed in Supabase; group-based administration remains open.
- What formal privacy notice, retention period, and deletion process should apply before production use with real customer data?
- What is the business model and next step: self-service information, adviser handoff, referral, or purchase?
- Which insurer/product sources are available, and what are their permission, freshness, and redistribution terms? Medibank, AHM, and TAL are name-only initial entries; add other providers only when verified primary sources are available.
- What is the intended regulatory and compliance position? Obtain qualified Australian review before advice-like features or personal quote flows are built.
- What launch timeline, team ownership, and operational support are expected?

## Initial comparison behavior

- Compare manually maintained source-backed product facts across life, TPD, trauma, and income protection.
- Store cover type, amount, age, state, and premium basis with each comparison. Do not collect smoking, occupation, or health details.
- Show a price only for a verified source example with exactly matching assumptions. The engine does not calculate premiums or imply a sourced amount is an insurer quote.
- Comparison history is private per Supabase user. Age and state are stored only after acknowledging the notice; users can delete saved comparisons.

## Success measures (initial proposals)

- Users can complete a comparison without confusing indicative information for a confirmed quote.
- Every displayed product fact and price can be traced to a source and date.
- Users understand the main differences between compared options.
- Access is limited to the intended Entra identities and authorized roles.

Set measurable targets after the audience and comparison journey are chosen.
