import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createWithdrawal } from "@/lib/rewards.functions";
import { fmtDate, fmtMoney } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/_authenticated/withdraw")({
  head: () => ({ meta: [{ title: "Withdraw — GlobalPrime" }, { name: "description", content: "Request a withdrawal." }] }),
  component: WithdrawPage,
});

type Method = { id: string; code: string; display_name: string; fields: Array<{ key: string; label: string }>; min_amount: number };

function WithdrawPage() {
  const { user } = Route.useRouteContext();
  const [methods, setMethods] = useState<Method[]>([]);
  const [selected, setSelected] = useState<Method | null>(null);
  const [amount, setAmount] = useState("");
  const [details, setDetails] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [balance, setBalance] = useState<{ cash: number; currency: string } | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  async function refresh() {
    const [{ data: m }, { data: p }, { data: h }] = await Promise.all([
      supabase.from("withdraw_methods").select("id,code,display_name,fields,min_amount").eq("active", true),
      supabase.from("profiles").select("cash_balance,currency").eq("id", user.id).maybeSingle(),
      supabase.from("withdrawals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setMethods((m ?? []) as Method[]);
    if (p) setBalance({ cash: Number(p.cash_balance), currency: p.currency });
    setHistory(h ?? []);
  }
  useEffect(() => { refresh(); }, [user.id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true); setMsg(null);
    try {
      await createWithdrawal({ data: { method_code: selected.code, amount: Number(amount), payment_details: details } });
      setMsg("✅ Withdrawal request submitted!");
      setAmount(""); setDetails({}); setSelected(null);
      refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Failed"); } finally { setBusy(false); }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white rounded-lg p-4">
        <h1 className="text-lg font-bold text-[#1a1c3a] mb-1">💸 Withdraw</h1>
        {balance && <p className="text-xs text-gray-500 mb-4">Available: <b>{fmtMoney(balance.cash, balance.currency as any)}</b></p>}
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold">Payment Method</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {methods.map((m) => (
                <button type="button" key={m.id} onClick={() => { setSelected(m); setDetails({}); }} className={`text-xs py-2 rounded border ${selected?.id === m.id ? "bg-[#1a8a7d] text-white border-[#1a8a7d]" : "bg-white"}`}>
                  {m.display_name}
                </button>
              ))}
            </div>
          </div>
          {selected && (
            <>
              <div>
                <label className="text-xs font-semibold">Amount (min {selected.min_amount})</label>
                <input required type="number" step="0.01" min={selected.min_amount} value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border rounded px-3 py-2 text-sm mt-1" />
              </div>
              {selected.fields.map((f) => (
                <div key={f.key}>
                  <label className="text-xs font-semibold">{f.label}</label>
                  <input required value={details[f.key] ?? ""} onChange={(e) => setDetails({ ...details, [f.key]: e.target.value })} className="w-full border rounded px-3 py-2 text-sm mt-1" />
                </div>
              ))}
              <button disabled={busy} className="w-full bg-[#e8734a] text-white font-bold py-2.5 rounded disabled:opacity-60">{busy ? "Submitting…" : "Request Withdrawal"}</button>
            </>
          )}
          {msg && <div className="text-xs">{msg}</div>}
        </form>
      </div>

      <div className="bg-white rounded-lg p-4">
        <h2 className="font-bold text-sm mb-3">Withdrawal History</h2>
        {history.length === 0 ? <div className="text-xs text-gray-400 py-8 text-center">No withdrawals yet.</div> : (
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#1a1c3a] text-white sticky top-0"><tr>
                <th className="p-2 text-left">Date</th><th className="p-2 text-left">Method</th><th className="p-2 text-left">Amount</th><th className="p-2 text-left">Status</th>
              </tr></thead>
              <tbody>
                {history.map((w) => (
                  <tr key={w.id} className="border-b">
                    <td className="p-2">{fmtDate(w.created_at)}</td>
                    <td className="p-2 uppercase">{w.method_code}</td>
                    <td className="p-2">{fmtMoney(Number(w.amount), w.currency)}</td>
                    <td className="p-2"><StatusBadge s={w.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
