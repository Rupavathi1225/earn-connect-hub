import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/offerwalls")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", context.user.id).eq("role", "admin").maybeSingle();
    if (!data) throw redirect({ to: "/dashboard" });
  },
  component: OW,
});

function OW() {
  const [items, setItems] = useState<any[]>([]);
  const [edit, setEdit] = useState<any | null>(null);
  async function refresh() { const { data } = await supabase.from("offerwalls").select("*").order("display_name"); setItems(data ?? []); }
  useEffect(() => { refresh(); }, []);
  async function save(e: React.FormEvent) {
    e.preventDefault(); if (!edit) return;
    const p = { ...edit }; delete p.id; delete p.created_at; delete p.updated_at;
    if (edit.id) await supabase.from("offerwalls").update(p).eq("id", edit.id);
    else await supabase.from("offerwalls").insert(p);
    setEdit(null); refresh();
  }
  async function del(id: string) { if (confirm("Delete?")) { await supabase.from("offerwalls").delete().eq("id", id); refresh(); } }
  async function toggle(o: any) { await supabase.from("offerwalls").update({ active: !o.active }).eq("id", o.id); refresh(); }
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-lg font-bold text-[#1a1c3a]">🎯 Offer Walls</h1>
        <button onClick={() => setEdit({ provider: "", display_name: "", url_template: "", active: true })} className="bg-[#e8734a] text-white text-xs font-semibold px-4 py-2 rounded">+ Add</button>
      </div>
      <div className="bg-white rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-[#1a1c3a] text-white"><tr>{["Provider", "Display Name", "URL Template", "Active", "Actions"].map((h) => <th key={h} className="p-2 text-left">{h}</th>)}</tr></thead>
          <tbody>
            {items.map((o) => (
              <tr key={o.id} className="border-b">
                <td className="p-2 font-mono">{o.provider}</td>
                <td className="p-2">{o.display_name}</td>
                <td className="p-2 truncate max-w-xs">{o.url_template}</td>
                <td className="p-2"><button onClick={() => toggle(o)} className={`text-[10px] px-2 py-0.5 rounded ${o.active ? "bg-green-100 text-green-700" : "bg-gray-100"}`}>{o.active ? "Enabled" : "Disabled"}</button></td>
                <td className="p-2 flex gap-1">
                  <button onClick={() => setEdit(o)} className="bg-[#2563eb] text-white px-2 py-1 rounded text-[10px]">Edit</button>
                  <button onClick={() => del(o.id)} className="bg-[#ef4444] text-white px-2 py-1 rounded text-[10px]">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {edit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={save} className="bg-white p-4 rounded-lg w-full max-w-lg space-y-2">
            <h3 className="font-bold">{edit.id ? "Edit" : "New"} Offer Wall</h3>
            {[["provider", "Provider Slug (unique, lowercase)"], ["display_name", "Display Name"], ["url_template", "URL Template (use {user_id})"], ["logo_url", "Logo URL"], ["description", "Description"]].map(([k, l]) => (
              <div key={k}>
                <label className="text-xs font-semibold">{l}</label>
                <input value={edit[k] ?? ""} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" required={k === "provider" || k === "display_name" || k === "url_template"} />
              </div>
            ))}
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} /> Enabled</label>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setEdit(null)} className="flex-1 border rounded py-2 text-sm">Cancel</button>
              <button className="flex-1 bg-[#1a8a7d] text-white rounded py-2 text-sm font-semibold">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
