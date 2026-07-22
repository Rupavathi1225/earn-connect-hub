import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { redeemPromocode } from "@/lib/rewards.functions";

export const Route = createFileRoute("/_authenticated/promocode")({
  head: () => ({ meta: [{ title: "Promo Code — GlobalPrime" }, { name: "description", content: "Redeem promo codes." }] }),
  component: P,
});

function P() {
  const [code, setCode] = useState(""); const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    try { const r = await redeemPromocode({ data: { code } }); setMsg(`✅ Redeemed! +${r.points} points`); setCode(""); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Failed"); } finally { setBusy(false); }
  }
  return (
    <div className="max-w-md">
      <h1 className="text-lg font-bold text-[#1a1c3a] mb-3">🎁 Redeem Promo Code</h1>
      <form onSubmit={submit} className="bg-white rounded-lg p-4 space-y-3">
        <input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Enter code" className="w-full border rounded px-3 py-2 text-sm uppercase font-mono" />
        <button disabled={busy} className="w-full bg-[#e8734a] text-white font-bold py-2 rounded disabled:opacity-60">{busy ? "Redeeming…" : "Redeem"}</button>
        {msg && <div className="text-xs">{msg}</div>}
      </form>
    </div>
  );
}
