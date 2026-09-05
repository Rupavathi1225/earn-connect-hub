import { getSignedWallUrl } from "@/lib/offerwall.functions";
import { toast } from "sonner";

export type WallLike = {
  id: string;
  provider: string;
  display_name: string;
  url_template: string;
  logo_url?: string | null;
  description?: string | null;
};

/** Extract a usable link from the stored template (admins sometimes paste a full iframe snippet). */
export function cleanTemplate(o: Pick<WallLike, "url_template">): string {
  let tpl = (o.url_template || "").trim();
  const m = tpl.match(/src\s*=\s*["']([^"']+)["']/i);
  if (m) tpl = m[1];
  return tpl;
}

/** True while the link still contains setup placeholders (YOUR_APP_ID etc.) or isn't a URL. */
export function wallNotReady(o: Pick<WallLike, "url_template">): boolean {
  const tpl = cleanTemplate(o);
  if (!/^https?:\/\//i.test(tpl)) return true;
  return /YOUR[_A-Z]*/i.test(tpl.replace(/\{[^}]+\}/g, ""));
}

/** Opens the wall in a new tab with the user id (and any server-signed hash) filled in. */
export async function openWall(o: WallLike, userId: string) {
  const win = window.open("about:blank", "_blank", "noopener,noreferrer");
  let url = cleanTemplate(o)
    .replaceAll("{user_id}", userId)
    .replaceAll("{USER_ID}", userId)
    .replaceAll("%7Buser_id%7D", userId)
    .replaceAll("%7BUSER_ID%7D", userId);

  if (url.includes("{secure_hash}")) {
    const res = await getSignedWallUrl({ data: { offerwallId: o.id } }).catch(() => null);
    const signed = res?.url;
    if (!signed) {
      win?.close();
      toast.error("This offer wall isn't set up yet. Please try another one.");
      return;
    }
    url = signed.replaceAll("{user_id}", userId).replaceAll("{USER_ID}", userId);
  }

  if (!/^https?:\/\//i.test(url) || /YOUR[_A-Z]*/i.test(url.replace(/\{[^}]+\}/g, ""))) {
    win?.close();
    toast.error("This offer wall isn't set up yet. Please try another one.");
    return;
  }

  if (win) win.location.replace(url);
  else window.location.href = url;
}
