// Unified investor model. One profile per investor lives in `vc_firms`
// (VCs, angels, philanthropic funders, family offices, CVCs, etc.). The
// self-serve onboarding request lives in `matched_requests`; on approval we
// create/link a vc_firms row. These helpers keep every surface consistent.

export const INVESTOR_TYPE_LABEL = {
  venture_capital: "Venture Capital",
  angel: "Angel Investor",
  family_office: "Family Office",
  foundation: "Philanthropic / Foundation",
  corporate_venture: "Corporate Venture (CVC)",
  debt_finance: "Debt / Project Finance",
  government: "Government / Sovereign",
  individual: "Individual / Retail",
  hedge_fund: "Hedge Fund / Public Equity",
  accelerator: "Accelerator / Incubator",
  other: "Other",
};
export const investorTypeLabel = (t) => INVESTOR_TYPE_LABEL[t] || (t ? String(t) : null);

// A self-serve onboarding request (matched_requests) -> vc_firms columns.
export function requestToFirmFields(mr) {
  const type = mr.investor_type || null;
  return {
    name: (mr.firm && mr.firm.trim()) || mr.name || "Investor",
    type: investorTypeLabel(type),              // existing UI reads `type`
    investor_type: type,
    investment_thesis: mr.thesis || null,
    climate_sectors: mr.focus || null,
    investment_stages_text: mr.stage || null,
    sweet_spot_check_size: mr.check_size || null,
    location: mr.location || null,
    website: mr.website || null,
    linkedin_url: mr.linkedin || null,
    twitter_url: mr.twitter_url || null,
    decision_makers: mr.point_of_contact || mr.primary_contact_name || null,
    accredited_investor: mr.accredited_investor || null,
    show_contact: mr.show_contact ?? true,
    tagline: mr.tagline || null,
    round_preference: mr.round_preference || null,
    previous_investments: mr.previous_investments || null,
  };
}

// A vc_firms row -> the shape the investor dashboard page expects.
export function firmToProfile(f) {
  if (!f) return null;
  const arr = (a) => (Array.isArray(a) && a.length ? a.join(", ") : null);
  return {
    id: f.id,
    name: f.name,
    firm: f.name,
    focus: f.climate_sectors || arr(f.climate_focus_areas),
    stage: f.investment_stages_text || arr(f.investment_stages),
    check_size: f.sweet_spot_check_size || null,
    thesis: f.investment_thesis || f.thesis || null,
    linkedin: f.linkedin_url || f.linkedin || null,
    website: f.website || f.url || null,
    location: f.location || null,
    point_of_contact: f.decision_makers || null,
    previous_investments: f.previous_investments || null,
    round_preference: f.round_preference || null,
    tagline: f.tagline || null,
    twitter_url: f.twitter_url || f.twitter || null,
    logo_url: f.logo_url || null,
    investor_type: f.investor_type || null,
    show_contact: f.show_contact ?? true,
    accredited_investor: f.accredited_investor || null,
  };
}

// Dashboard PATCH body -> vc_firms columns (only keys actually provided).
export function patchToFirmFields(body) {
  const u = {};
  const set = (k, v) => { if (v !== undefined) u[k] = v; };
  // Public display name — prefer the firm/investor name field.
  const name = body.firm ?? body.name;
  set("name", name);
  set("climate_sectors", body.focus);
  set("investment_stages_text", body.stage);
  set("sweet_spot_check_size", body.check_size);
  set("investment_thesis", body.thesis);
  set("linkedin_url", body.linkedin);
  set("website", body.website);
  set("location", body.location);
  set("decision_makers", body.point_of_contact);
  set("previous_investments", body.previous_investments);
  set("round_preference", body.round_preference);
  set("tagline", body.tagline);
  set("twitter_url", body.twitter_url);
  return u;
}
