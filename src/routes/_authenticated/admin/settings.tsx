import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { guardAdminPanel } from "@/lib/admin-guard";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  beforeLoad: async ({ context }) => {
    await guardAdminPanel(context.user.id);
  },
  component: S,
});

function S() {
  const [settings, setSettings] = useState<any>(null);
  const [methods, setMethods] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  async function refresh() {
    const { data } = await supabase.from("app_settings").select("*").eq("id", 1).maybeSingle(); setSettings(data);
    const { data: m } = await supabase.from("withdraw_methods").select("*").order("display_name"); setMethods(m ?? []);
  }
  useEffect(() => { refresh(); }, []);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const patch = { ...settings }; delete patch.updated_at;
    const { error } = await supabase.from("app_settings").update(patch).eq("id", 1);
    setMsg(error ? error.message : "✅ Saved"); setTimeout(() => setMsg(null), 2000);
  }
  async function toggleMethod(m: any) { await supabase.from("withdraw_methods").update({ active: !m.active }).eq("id", m.id); refresh(); }
  if (!settings) return <div className="p-4">Loading…</div>;
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-lg font-bold text-[#1a1c3a]">⚙️ Platform Settings</h1>
      <form onSubmit={save} className="bg-white rounded-lg p-4 grid grid-cols-2 gap-3">
        {[
          ["signup_bonus_points", "Signup Bonus Points"],
          ["referral_commission_points", "Referral Commission (pts)"],
          ["lock_percentage", "Lock Percentage (%)"],
          ["lock_days", "Lock Duration (days)"],
          ["points_per_inr", "Points per ₹1"],
          ["points_per_usd", "Points per $1"],
        ].map(([k, l]) => (
          <div key={k}>
            <label className="text-xs font-semibold">{l}</label>
            <input type="number" step="0.01" value={settings[k]} onChange={(e) => setSettings({ ...settings, [k]: Number(e.target.value) })} className="w-full border rounded px-3 py-2 text-sm" />
          </div>
        ))}
        <div className="col-span-2 flex items-center gap-3">
          <button className="bg-[#e8734a] text-white font-bold px-6 py-2 rounded text-sm">Save Settings</button>
          {msg && <span className="text-xs">{msg}</span>}
        </div>
      </form>

      <div className="bg-white rounded-lg p-4">
        <h2 className="font-bold text-sm mb-3">💳 Withdraw Methods</h2>
        <table className="w-full text-xs">
          <thead className="bg-[#1a1c3a] text-white"><tr>{["Code", "Name", "Min", "Active"].map((h) => <th key={h} className="p-2 text-left">{h}</th>)}</tr></thead>
          <tbody>
            {methods.map((m) => (
              <tr key={m.id} className="border-b">
                <td className="p-2 font-mono">{m.code}</td>
                <td className="p-2">{m.display_name}</td>
                <td className="p-2">{m.min_amount}</td>
                <td className="p-2"><button onClick={() => toggleMethod(m)} className={`text-[10px] px-2 py-0.5 rounded ${m.active ? "bg-green-100 text-green-700" : "bg-gray-100"}`}>{m.active ? "On" : "Off"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-4 text-xs">
        <b>📡 Postback URLs</b>
        <p className="mt-1 text-gray-700">Configure these callback URLs in each provider's dashboard:</p>
        <code className="block mt-2 bg-white p-2 rounded font-mono">
          {typeof window !== "undefined" ? window.location.origin : ""}/api/public/postback/[provider]?user_id={"{sub_id}"}&points={"{reward}"}&tx_id={"{trans_id}"}&sig={"{signature}"}
        </code>
        <p className="mt-2 text-gray-600">
          Providers: <code>cpx_research</code>, <code>bitlabs</code>, <code>pollfish</code>, <code>adscend</code>, <code>lootably</code>, <code>monlix</code>, <code>gemiads</code>, <code>primewall</code>.
        </p>
        <p className="mt-2 text-gray-600">Add each provider's signing secret as a Lovable Cloud secret named <code>POSTBACK_SECRET_&lt;PROVIDER&gt;</code> (uppercase, e.g. <code>POSTBACK_SECRET_CPX_RESEARCH</code>).</p>
      </div>
    </div>
  );
}
