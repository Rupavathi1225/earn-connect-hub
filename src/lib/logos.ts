/** Known brand domains per offerwall provider key (falls back to the wall URL host). */
const PROVIDER_DOMAINS: Record<string, string> = {
  lootably: "lootably.com",
  pollfish: "pollfish.com",
  gemiads: "gemiads.com",
  cpx_research: "cpx-research.com",
  bitlabs: "bitlabs.ai",
  adscend: "adscendmedia.com",
  notik: "notik.me",
  lootwall: "lootwalls.com",
  primewall: "primewall.io",
  monlix: "monlix.com",
  adgatemedia: "adgatemedia.com",
  admaxflow: "admaxflow.com",
  adsfill: "adsfill.com",
  adtogame: "adtogame.com",
  ayet: "ayetstudios.com",
  offertoro: "offertoro.com",
  opinionuniverse: "opinionuniverse.com",
  pointclicktrack: "pointclicktrack.com",
  theoremreach: "theoremreach.com",
  timewall: "timewall.io",
};

/** Reduce a host to its registrable domain (wall.lootably.com -> lootably.com). */
function rootDomain(host: string): string {
  const parts = host.replace(/^www\./i, "").split(".");
  if (parts.length <= 2) return parts.join(".");
  const twoLevelTld = /^(co|com|net|org|gov|ac)\.[a-z]{2}$/i.test(parts.slice(-2).join("."));
  return parts.slice(twoLevelTld ? -3 : -2).join(".");
}

export function wallDomain(provider?: string | null, urlTemplate?: string | null): string | null {
  const key = (provider || "").toLowerCase().trim();
  if (PROVIDER_DOMAINS[key]) return PROVIDER_DOMAINS[key];
  const m = (urlTemplate || "").trim().match(/https?:\/\/([^/"'\s]+)/i);
  return m ? rootDomain(m[1]) : null;
}

/**
 * Candidate logo URLs, tried in order by the <WallLogo> component:
 * admin-provided logo -> provider favicon services -> letter fallback.
 */
export function wallLogoCandidates(
  logoUrl?: string | null,
  urlTemplate?: string | null,
  provider?: string | null,
): string[] {
  const out: string[] = [];
  if (logoUrl && logoUrl.trim()) out.push(logoUrl.trim());
  const domain = wallDomain(provider, urlTemplate);
  if (domain) {
    out.push(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`);
    out.push(`https://logo.clearbit.com/${domain}`);
    out.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
  }
  return out;
}

/** Legacy single-URL helper. */
export function wallLogo(logoUrl?: string | null, urlTemplate?: string | null, provider?: string | null): string | null {
  return wallLogoCandidates(logoUrl, urlTemplate, provider)[0] ?? null;
}
