export const COVER_TYPES = [
  { code: "life", name: "Life cover" },
  { code: "tpd", name: "Total and permanent disability (TPD)" },
  { code: "trauma", name: "Trauma / critical illness" },
  { code: "income_protection", name: "Income protection" },
];

export const AU_STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];
export const PREMIUM_BASES = ["monthly", "annual"];
export const FACT_KEYS = [
  "eligibility",
  "exclusions",
  "waiting_period",
  "benefit_period",
  "premium_type",
  "indexation",
  "renewability",
  "claims_conditions",
  "other",
];

export function parseComparisonInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const { cover_type, cover_amount, age, state, premium_basis } = input;
  if (
    !COVER_TYPES.some(({ code }) => code === cover_type) ||
    typeof cover_amount !== "number" ||
    !Number.isFinite(cover_amount) ||
    cover_amount <= 0 ||
    cover_amount > 100_000_000 ||
    !Number.isInteger(age) ||
    age < 18 ||
    age > 100 ||
    !AU_STATES.includes(state) ||
    !PREMIUM_BASES.includes(premium_basis)
  ) {
    return null;
  }

  return { cover_type, cover_amount, age, state, premium_basis };
}

function isOptionalIsoDate(value) {
  if (value === "" || value == null) {
    return true;
  }
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsedDate = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsedDate.valueOf()) &&
    parsedDate.toISOString().slice(0, 10) === value;
}

function isOptionalHttpsUrl(value) {
  if (value == null || value === "") {
    return true;
  }
  if (typeof value !== "string") {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch (error) {
    if (error instanceof TypeError) {
      return false;
    }
    throw error;
  }
}

export function parseCatalogEntry(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const strings = [
    input.provider_name,
    input.product_name,
    input.product_summary,
    input.coverage_summary,
    input.source_url,
    input.source_title,
  ];
  if (
    strings.some((value) => typeof value !== "string" || !value.trim()) ||
    input.provider_name.trim().length > 120 ||
    input.product_name.trim().length > 160 ||
    input.product_summary.trim().length > 1000 ||
    input.coverage_summary.trim().length > 2000 ||
    input.source_title.trim().length > 240 ||
    !isOptionalHttpsUrl(input.source_url.trim()) ||
    !isOptionalHttpsUrl(input.provider_website_url) ||
    !isOptionalIsoDate(input.effective_from) ||
    !isOptionalIsoDate(input.effective_to) ||
    (input.effective_from && input.effective_to &&
      input.effective_to < input.effective_from) ||
    !COVER_TYPES.some(({ code }) => code === input.cover_type) ||
    !Array.isArray(input.facts) ||
    input.facts.some(
      (fact) =>
        !fact ||
        typeof fact !== "object" ||
        !FACT_KEYS.includes(fact.key) ||
        typeof fact.value !== "string" ||
        !fact.value.trim() ||
        fact.value.trim().length > 4000,
    )
  ) {
    return null;
  }

  let premium = null;
  if (input.premium != null) {
    const parsedPremium = parseComparisonInput({
      cover_type: input.cover_type,
      cover_amount: input.premium.cover_amount,
      age: input.premium.age,
      state: input.premium.state,
      premium_basis: input.premium.premium_basis,
    });

    if (
      !parsedPremium ||
      typeof input.premium.premium_amount !== "number" ||
      !Number.isFinite(input.premium.premium_amount) ||
      input.premium.premium_amount < 0
    ) {
      return null;
    }

    premium = {
      ...parsedPremium,
      premium_amount: input.premium.premium_amount,
    };
  }

  return {
    provider_name: input.provider_name.trim(),
    provider_website_url: input.provider_website_url?.trim() || null,
    product_name: input.product_name.trim(),
    product_summary: input.product_summary.trim(),
    cover_type: input.cover_type,
    coverage_summary: input.coverage_summary.trim(),
    source_url: input.source_url.trim(),
    source_title: input.source_title.trim(),
    effective_from: input.effective_from || null,
    effective_to: input.effective_to || null,
    facts: input.facts.map(({ key, value }) => ({
      key,
      value: value.trim(),
    })),
    premium,
  };
}
