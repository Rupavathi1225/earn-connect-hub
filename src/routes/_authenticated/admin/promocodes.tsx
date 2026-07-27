import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { guardAdminPanel } from "@/lib/admin-guard";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/promocodes")({
  beforeLoad: async ({ context }) => {
    await guardAdminPanel(context.user.id);
  },
  component: P,
});

function P() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ code: "", points: 100, expires_at: "", usage_limit: 1 });
  async function refresh() { const { data } = await supabase.from("promocodes").select("*").order("created_at", { ascending: false }); setItems(data ?? []); }
  useEffect(() => { refresh(); }, []);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from("promocodes").insert({ code: form.code.toUpperCase(), points: form.points, usage_limit: form.usage_limit, expires_at: form.expires_at || null });
    setForm({ code: "", points: 100, expires_at: "", usage_limit: 1 }); refresh();
  }
  async function toggle(p: any) { await supabase.from("promocodes").update({ active: !p.active }).eq("id", p.id); refresh(); }
  async function del(id: string) { if (confirm("Delete?")) { await supabase.from("promocodes").delete().eq("id", id); refresh(); } }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <form onSubmit={create} className="bg-white rounded-lg p-4 space-y-2">
        <h2 className="font-bold text-sm">🎁 New Promo Code</h2>
        <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Code" className="w-full border rounded px-3 py-2 text-sm font-mono uppercase" />
        <input required type="number" value={form.points} onChange={(e) => setForm({ ...form, points: +e.target.value })} placeholder="Points" className="w-full border rounded px-3 py-2 text-sm" />
        <input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
        <input required type="number" min={1} value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: +e.target.value })} placeholder="Usage limit" className="w-full border rounded px-3 py-2 text-sm" />
        <button className="w-full bg-[#e8734a] text-white font-bold py-2 rounded text-sm">Create</button>
      </form>
      <div className="lg:col-span-2 bg-white rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-[#1a1c3a] text-white"><tr>{["Code", "Points", "Used", "Limit", "Expires", "Status", ""].map((h) => <th key={h} className="p-2 text-left">{h}</th>)}</tr></thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="p-2 font-mono">{p.code}</td>
                <td className="p-2">{p.points}</td>
                <td className="p-2">{p.used_count}</td>
                <td className="p-2">{p.usage_limit}</td>
                <td className="p-2">{p.expires_at ? fmtDate(p.expires_at) : "-"}</td>
                <td className="p-2"><button onClick={() => toggle(p)} className={`text-[10px] px-2 py-0.5 rounded ${p.active ? "bg-green-100 text-green-700" : "bg-gray-100"}`}>{p.active ? "Active" : "Off"}</button></td>
                <td className="p-2"><button onClick={() => del(p.id)} className="bg-red-500 text-white px-2 py-1 rounded text-[10px]">×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
