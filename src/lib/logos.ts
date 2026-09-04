/** Resolve a logo image for an offerwall: admin-provided logo, else the provider's own favicon. */
export function wallLogo(logoUrl?: string | null, urlTemplate?: string | null): string | null {
  if (logoUrl && logoUrl.trim()) return logoUrl.trim();
  const raw = (urlTemplate || "").trim();
  const m = raw.match(/https?:\/\/([^/"'\s]+)/i);
  if (!m) return null;
  const host = m[1].replace(/^www\./i, "");
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
}
