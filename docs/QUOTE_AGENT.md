# Quote and product discovery agent

## Goal

Reduce repeated data entry while helping a signed-in user find comparable life cover information and, where the provider permits it, obtain a provider-issued quote.

The agent must not invent prices or treat a website estimate, product page, or stored example as a live quote. A quote shown as provider-issued must come from an approved quoting channel and retain the provider, distributor, product, quote reference, retrieval time, validity, and exact assumptions used.

## Proposed user flow

1. Build a private underwriting profile from information the user enters. Reuse saved cover type, amount, age, state, and premium basis from the existing comparison where applicable.
2. Ask only for fields needed by the selected provider and quote. Do not gather an entire medical history in advance just in case.
3. Explain which answers are sensitive, why each is needed, how Artemis stores it, how long it is kept, and which provider will receive it. Get separate affirmative consent to store underwriting details and to send them to each provider.
4. Show a review screen with the exact answers, provider, product, and purpose before submission. Require the user to confirm. Never purchase a policy or submit an application on the user's behalf.
5. Store the provider response separately from the reusable profile, including quote reference, premium basis, validity/expiry, retrieval time, exact assumptions, and source/channel.
6. Allow the user to inspect, correct, and delete the underwriting profile and quote history, subject to any retention obligations confirmed with qualified counsel.

## Sensitive-data boundary

The user has now directed that underwriting information may be collected and stored for quote retrieval. This supersedes the earlier product assumption that health, smoking, and occupation would be excluded. It does not authorize collecting real data in development fixtures or logs, or sending data to a provider without the user's specific confirmation.

Before implementation, define the exact provider-specific fields, consent copy, permitted uses, recipients, retention period, deletion behavior, access roles, incident response, and privacy notice. Health answers are sensitive information. Collect only what is necessary for a selected quote, encrypt underwriting values at the application layer with a managed key outside Postgres, restrict reads to the profile owner and narrowly authorized services, and keep the decryption key out of the browser, database, prompts, analytics, and logs. Supabase RLS remains mandatory but does not replace encryption or privacy review.

The OAIC's current APP 3 guidance says sensitive information may be collected with consent where it is reasonably necessary, and recommends data minimisation. APP 11 guidance requires reasonable security steps and destruction or de-identification when information is no longer needed, subject to exceptions. See the [OAIC APP 3 guidance](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-3-app-3-collection-of-solicited-personal-information) and [OAIC APP 11 guidance](https://www.oaic.gov.au/__data/assets/pdf_file/0035/256958/APP-Guidelines-Chapter-11-Security-of-personal-information-October-2025-v1.3.PDF). Have qualified Australian privacy counsel review the product's actual obligations before collecting real underwriting information.

Use a deterministic provider adapter for mapping answers to a permitted quote flow. Do not ask an LLM to infer, rewrite, or fill missing answers. If a user is unsure, pause and let them answer or skip that provider.

## Provider review register

Reviewed 9 November 2026. This is an initial product/terms review, not legal advice. Recheck current provider terms and obtain written permission or an approved integration before enabling automated connections.

| Provider | Public page and quote route | Initial finding | Automated use status |
| --- | --- | --- | --- |
| TAL | [Life insurance](https://www.tal.com.au/life-insurance) links to CoverBuilder | TAL advertises an online quick quote. Its terms describe website information as general and note further personal/sensitive information may be requested during underwriting. | Hold. TAL's [Terms of Use](https://www.tal.com.au/disclaimer) grant a limited personal, non-commercial materials license and restrict storage/reproduction without written consent except as allowed by law. Artemis has no approval for automated commercial retrieval. |
| Budget Direct | [Life insurance](https://www.budgetdirect.com.au/life-insurance.html) links to an online quote tool | The quote flow is hosted on a separate Budget Direct quote domain. | Do not automate without written permission or an approved API. The current [Website Terms of Use](https://www.budgetdirect.com.au/website-terms-of-use.html) prohibit scraping, robots/spiders, scripted responses, content analysis/repackaging, and systematic or repetitive quote/pricing collection. |
| Zurich | [Life insurance](https://www.zurich.com.au/life-insurance) links to direct Zurich Ezicover | Zurich distinguishes adviser products from direct online Ezicover; they are not necessarily the same products or terms. | Hold. Verify the direct quote channel's current terms and obtain provider approval before connecting it. |
| Medibank | [Life insurance](https://www.medibank.com.au/life-insurance/) advertises a quick quote | The page says the product is issued by Zurich Australia. It says no medical tests are required, but product disclosure material describes health questions in underwriting. No medical exam does not mean no underwriting information. | Hold. Verify quote-flow terms and get approval before automating. The [Medibank online support terms](https://www.medibank.com.au/content/dam/retail/members/Nurse_Triage_Webchat_Online_Suppor_Services_Terms_of_Use.pdf) prohibit automated scripting/data mining for that service; the terms applicable to its life quote flow still need confirmation. |

Because TAL and Medibank have Zurich-issued products, model insurer, distributor/brand, product, and sales channel separately. Do not merge similar-looking products or prices unless equivalence is verified from current documents.

## Recommended delivery stages

1. Confirm the audience, quote journey, privacy notice, sensitive-data consent, encryption/key management, retention, deletion, and access model.
2. Obtain a documented API/partner feed or written permission and data reuse rights from each insurer/distributor. Agree on allowed fields, frequency, quote validity, rate limits, and change handling. Budget Direct is explicitly excluded until it grants permission or provides an approved API.
3. Build a private encrypted underwriting profile and provider-specific field mapping. Collect only fields that the chosen quote flow requires.
4. Build a single-user quote flow that previews exact answers and obtains confirmation before submission. Stop on CAPTCHA, missing/ambiguous answers, site policy blocks, or any step that could buy or apply for insurance.
5. Compare provider-issued quote results only when product, cover, assumptions, and premium basis match. Label different or incomplete assumptions and omit price comparisons where an exact match cannot be established.

## Blocked-flow behavior

If a provider's terms, required fields, or connection status blocks automated retrieval, explain why, offer its official quote link, and return no quote. Do not silently substitute an estimated premium. A user-supplied quote import can be considered separately after its redaction, provenance, and privacy behavior is designed.
