// Shared announcement category metadata: labels, colors, and the default
// call-to-action for each type. Used by the company form, the newsroom, the
// profile card, and the admin view so everything stays in sync.

export const CAT_LABEL = {
  partnership: "Partnership", raise_open: "Now raising", raise_close: "Raise",
  product: "Product", award: "Award", hire: "Key hire", milestone: "Milestone",
  expansion: "Expansion", other: "News",
};

export const CAT_COLOR = {
  raise_close: "#7c3aed", raise_open: "#2d6a4f", partnership: "#0ea5e9",
  product: "#d97706", award: "#059669", hire: "#4f46e5", milestone: "#0d9488",
  expansion: "#db2777", other: "#64748b",
};

// Default CTA label + a placeholder hint for the target URL, per category.
export const CTA = {
  partnership: { label: "Partner with us", ph: "Link to partnerships or contact page" },
  raise_open: { label: "Investor inquiry", ph: "Data room or intro-call link" },
  raise_close: { label: "Work with us", ph: "Careers or sales / contact link" },
  product: { label: "Request a demo", ph: "Demo request or product page link" },
  award: { label: "Learn more", ph: "Press release or details link" },
  hire: { label: "See open roles", ph: "Careers page link" },
  milestone: { label: "Get in touch", ph: "Contact or details link" },
  expansion: { label: "Connect with us", ph: "Contact or details link" },
  other: { label: "Learn more", ph: "Any relevant link" },
};

export const ctaLabelFor = (category, meta) => (meta && meta.cta_label) || CTA[category]?.label || "Learn more";
