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

  // New method form states
  const [newMethodName, setNewMethodName] = useState("");
  const [newMethodCode, setNewMethodCode] = useState("");
  const [newMethodMin, setNewMethodMin] = useState("5.00");
  const [newMethodFields, setNewMethodFields] = useState("email:Email Address");

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

  async function addMethod(e: React.FormEvent) {
    e.preventDefault();
    // Parse fields from string "key:label,key2:label2"
    const parsedFields = newMethodFields.split(",").map(part => {
      const [k, l] = part.split(":");
      return { key: k?.trim() || "", label: l?.trim() || k?.trim() || "" };
    }).filter(f => f.key);

    const { error } = await supabase.from("withdraw_methods").insert({
      code: newMethodCode.trim().toLowerCase(),
      display_name: newMethodName.trim(),
      min_amount: Number(newMethodMin) || 0,
      active: true,
      fields: parsedFields as any
    });

    if (error) {
      alert(error.message);
    } else {
      setNewMethodName("");
      setNewMethodCode("");
      setNewMethodFields("email:Email Address");
      refresh();
    }
  }

  async function deleteMethod(id: string) {
    if (confirm("Are you sure you want to delete this withdraw method?")) {
      const { error } = await supabase.from("withdraw_methods").delete().eq("id", id);
      if (error) alert(error.message);
      else refresh();
    }
  }

  if (!settings) return <div className="p-4">Loading…</div>;
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-lg font-bold text-[#1a1c3a]">⚙️ Platform Settings</h1>
      <form onSubmit={save} className="bg-white rounded-lg p-4 grid grid-cols-2 gap-3 shadow-sm border border-gray-100">
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
          <button className="bg-[#e8734a] text-white font-bold px-6 py-2 rounded text-sm hover:bg-[#d05c36] transition">Save Settings</button>
          {msg && <span className="text-xs font-semibold">{msg}</span>}
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Add method form */}
        <form onSubmit={addMethod} className="bg-white rounded-lg p-4 space-y-3 shadow-sm border border-gray-100">
          <h2 className="font-bold text-sm">💳 Add Withdraw Method</h2>
          <div>
            <label className="text-xs font-semibold block mb-0.5">Method Name (e.g. PayPal)</label>
            <input required type="text" value={newMethodName} onChange={(e) => setNewMethodName(e.target.value)} className="w-full border rounded px-3 py-1.5 text-xs" />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-0.5">Method Code (e.g. paypal)</label>
            <input required type="text" value={newMethodCode} onChange={(e) => setNewMethodCode(e.target.value)} className="w-full border rounded px-3 py-1.5 text-xs" />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-0.5">Minimum Amount ($)</label>
            <input required type="number" step="0.01" value={newMethodMin} onChange={(e) => setNewMethodMin(e.target.value)} className="w-full border rounded px-3 py-1.5 text-xs" />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-0.5">Required Fields (comma separated key:label)</label>
            <input required type="text" value={newMethodFields} onChange={(e) => setNewMethodFields(e.target.value)} className="w-full border rounded px-3 py-1.5 text-xs font-mono" />
          </div>
          <button className="bg-[#1a8a7d] hover:bg-[#146e63] text-white font-bold px-4 py-2 rounded text-xs transition">Add Method</button>
        </form>

        {/* Methods list */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 overflow-x-auto">
          <h2 className="font-bold text-sm mb-3">💳 Withdraw Methods</h2>
          <table className="w-full text-xs">
            <thead className="bg-[#1a1c3a] text-white">
              <tr>
                <th className="p-2 text-left">Code</th>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Min</th>
                <th className="p-2 text-left">Active</th>
                <th className="p-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {methods.map((m) => (
                <tr key={m.id} className="border-b">
                  <td className="p-2 font-mono">{m.code}</td>
                  <td className="p-2">{m.display_name}</td>
                  <td className="p-2">${m.min_amount}</td>
                  <td className="p-2">
                    <button onClick={() => toggleMethod(m)} className={`text-[10px] px-2 py-0.5 rounded font-semibold ${m.active ? "bg-green-100 text-green-700" : "bg-gray-100"}`}>
                      {m.active ? "On" : "Off"}
                    </button>
                  </td>
                  <td className="p-2 text-center">
                    <button onClick={() => deleteMethod(m.id)} className="bg-red-100 hover:bg-red-200 text-red-700 px-2 py-0.5 rounded text-[10px] font-semibold transition">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {methods.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-400 italic">No methods added yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
