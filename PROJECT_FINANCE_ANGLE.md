# The "reverse" play: project-finance origination

## The insight

The market tracker was built for the *equity* side — VCs hunting startups raising rounds.
But look at what the data already contains: **project finance ($35.7B), debt ($29B), grants
($20B), and PPAs** — the entire *infrastructure* capital stack. That's a second, much larger
audience hiding in the same dataset.

Venture capital in climate is ~$50B/year. **Project finance for energy infrastructure is
trillions.** The financiers who deploy it — infrastructure PE (Brookfield, KKR Infra), development
banks (IFC, ADB, EBRD), commercial project-finance desks (BNP Paribas, ABN AMRO, Santander),
and increasingly pension/insurance/sovereign capital — are the biggest checks in the transition.
And they have the same core problem as VCs, just at the other end: **finding bankable projects
and knowing who else is financing them.**

So the "reverse" isn't a different product — it's the same tracker, pointed at the other side
of the market, unlocking a far larger and higher-willingness-to-pay audience.

## What the data already gives us (for free)

Every project-finance and debt event we extract names the **lead financier** (IFC, ADB, ABN AMRO,
BNP Paribas, CaixaBank…), the **developer/sponsor**, the **capacity** (MW / GWh), the **geography**,
and often the **PPA/offtake** status. That is exactly the raw material an infrastructure investor
or a developer needs. Three things fall out of it immediately:

1. **Most-active-financier league tables.** Rank the banks and DFIs by deals and capital deployed,
   sliced by sector and region. A developer seeking debt for a 200 MW solar farm in West Africa can
   see instantly *who actually funds those* — and a financier can see who they're competing with.
   Nobody publishes this; we can derive it from our own extraction.

2. **A bankable-project pipeline.** Developers list projects seeking finance (capacity, capital
   needed, stage, PPA status, geography). Financiers browse deal flow matched to their mandate.
   This is origination — the highest-value thing in project finance, and today it happens through
   scattered advisor relationships.

3. **Bankability signals.** A signed PPA or offtake is *the* de-risking event that makes a project
   financeable. We already capture PPAs. Surfacing "projects with a signed offtake, seeking debt"
   is a curated, high-intent list financiers would pay for.

## The two-sided flywheel, again — but for infrastructure

Same loop as the startup side, different participants:

- **Developers** list projects (or self-report financings) to reach lenders → they get seen by
  the exact capital that funds their asset class.
- **Financiers** come for the pipeline + the league-table intelligence → their presence is why
  developers list.
- Every financing that flows through enriches the league tables and comps → the intelligence
  compounds → more of both sides show up.

And it reinforces the equity side: a startup that graduates to building its first plant now needs
project finance — EP carries them across the whole capital journey, seed round to financial close.

## Why this is the stronger monetization

Infrastructure investors and project-finance desks have institutional budgets and pay real money
for deal origination and market intelligence (this is PitchBook/Inframation/IJGlobal territory —
five-figure seats). A climate-native, data-derived version — league tables + bankable pipeline +
PPA signals — is a credible wedge into that spend, and it's differentiated because it's built from
proprietary extraction, not a reskin of public filings.

## What to build (all leverages existing data)

1. **Financier league tables** — group project-finance/debt events by lead financier; rank by
   deal count and capital, filterable by sector/region. (Pure query on `funding_events`.)
2. **Bankable-project filters** — a view of project-finance / PPA events, filterable by capacity,
   geography, and offtake status. (Same tracker, infra lens.)
3. **Project listing intake** — let developers post a project seeking finance (a structured form,
   like the company-claim flow) → feeds the pipeline. (New, but small.)
4. **A "project finance" tab** in the investor product, alongside the venture wire.

## One-line pitch to a financier

"See every climate infrastructure financing as it happens, who's funding what by sector and
region, and a live pipeline of bankable projects seeking debt — the deal flow and the competitive
map in one place."
