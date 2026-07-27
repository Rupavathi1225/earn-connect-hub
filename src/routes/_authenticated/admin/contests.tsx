import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { guardAdminPanel } from "@/lib/admin-guard";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/contests")({
  beforeLoad: async ({ context }) => {
    await guardAdminPanel(context.user.id);
  },
  component: C,
});

function C() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", description: "", prize: "", start_at: "", end_at: "" });
  const [top, setTop] = useState<any[]>([]);
  async function refresh() {
    const { data } = await supabase.from("contests").select("*").order("start_at", { ascending: false }); setItems(data ?? []);
    const { data: t } = await supabase.from("profiles").select("name,email,points_balance").order("points_balance", { ascending: false }).limit(10); setTop(t ?? []);
  }
  useEffect(() => { refresh(); }, []);
  async function create(e: React.FormEvent) { e.preventDefault(); await supabase.from("contests").insert(form as any); setForm({ name: "", description: "", prize: "", start_at: "", end_at: "" }); refresh(); }
  async function toggle(c: any) { await supabase.from("contests").update({ active: !c.active }).eq("id", c.id); refresh(); }
  async function del(id: string) { if (confirm("Delete?")) { await supabase.from("contests").delete().eq("id", id); refresh(); } }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <form onSubmit={create} className="bg-white rounded-lg p-4 space-y-2">
        <h2 className="font-bold text-sm">🏆 New Contest</h2>
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="w-full border rounded px-3 py-2 text-sm" />
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="w-full border rounded px-3 py-2 text-sm h-20" />
        <input required value={form.prize} onChange={(e) => setForm({ ...form, prize: e.target.value })} placeholder="Prize" className="w-full border rounded px-3 py-2 text-sm" />
        <input required type="datetime-local" value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
        <input required type="datetime-local" value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
        <button className="w-full bg-[#e8734a] text-white font-bold py-2 rounded text-sm">Create</button>
      </form>
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-[#1a1c3a] text-white"><tr>{["Name", "Prize", "Start", "End", "Status", ""].map((h) => <th key={h} className="p-2 text-left">{h}</th>)}</tr></thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-b">
                  <td className="p-2">{c.name}</td>
                  <td className="p-2">{c.prize}</td>
                  <td className="p-2">{fmtDate(c.start_at)}</td>
                  <td className="p-2">{fmtDate(c.end_at)}</td>
                  <td className="p-2"><button onClick={() => toggle(c)} className={`text-[10px] px-2 py-0.5 rounded ${c.active ? "bg-green-100 text-green-700" : "bg-gray-100"}`}>{c.active ? "Active" : "Off"}</button></td>
                  <td className="p-2"><button onClick={() => del(c.id)} className="bg-red-500 text-white px-2 py-1 rounded text-[10px]">×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-white rounded-lg p-4">
          <h2 className="font-bold text-sm mb-2">🥇 Top Earners</h2>
          <ol className="space-y-1">
            {top.map((t, i) => (
              <li key={i} className="flex justify-between text-xs border-b py-1">
                <span>{i + 1}. {t.name || t.email}</span><b>{t.points_balance} pts</b>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
