import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { guardAdminPanel } from "@/lib/admin-guard";

export const Route = createFileRoute("/_authenticated/admin/surveys")({
  beforeLoad: async ({ context }) => {
    await guardAdminPanel(context.user.id);
  },
  component: S,
});

function S() {
  const [items, setItems] = useState<any[]>([]);
  const [edit, setEdit] = useState<any | null>(null);
  async function refresh() { const { data } = await supabase.from("surveys").select("*").order("created_at", { ascending: false }); setItems(data ?? []); }
  useEffect(() => { refresh(); }, []);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    const payload = { ...edit };
    delete payload.id; delete payload.created_at; delete payload.updated_at;
    if (typeof payload.countries === "string") payload.countries = payload.countries ? payload.countries.split(",").map((s: string) => s.trim()) : [];
    if (edit.id) await supabase.from("surveys").update(payload).eq("id", edit.id);
    else await supabase.from("surveys").insert(payload);
    setEdit(null); refresh();
  }
  async function del(id: string) { if (confirm("Delete?")) { await supabase.from("surveys").delete().eq("id", id); refresh(); } }
  async function toggle(s: any) { await supabase.from("surveys").update({ active: !s.active }).eq("id", s.id); refresh(); }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-lg font-bold text-[#1a1c3a]">📋 Surveys</h1>
        <button onClick={() => setEdit({ network_name: "", network_url: "", points: 100, user_variable: "aff_sub", active: true, countries: [] })} className="bg-[#e8734a] text-white text-xs font-semibold px-4 py-2 rounded">+ Add Survey</button>
      </div>
      <div className="bg-white rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-[#1a1c3a] text-white"><tr>{["Network", "Points", "Offer ID", "Active", "Actions"].map((h) => <th key={h} className="p-2 text-left">{h}</th>)}</tr></thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id} className="border-b">
                <td className="p-2">{s.network_name}</td>
                <td className="p-2">{s.points}</td>
                <td className="p-2">{s.offer_id || "-"}</td>
                <td className="p-2"><button onClick={() => toggle(s)} className={`text-[10px] px-2 py-0.5 rounded ${s.active ? "bg-green-100 text-green-700" : "bg-gray-100"}`}>{s.active ? "Active" : "Inactive"}</button></td>
                <td className="p-2 flex gap-1">
                  <button onClick={() => setEdit({ ...s, countries: (s.countries ?? []).join(",") })} className="bg-[#2563eb] text-white px-2 py-1 rounded text-[10px]">Edit</button>
                  <button onClick={() => del(s.id)} className="bg-[#ef4444] text-white px-2 py-1 rounded text-[10px]">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {edit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={save} className="bg-white p-4 rounded-lg w-full max-w-lg space-y-2 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold">{edit.id ? "Edit Survey" : "New Survey"}</h3>
            {[
              ["network_name", "Network Name"], ["network_url", "Network URL"], ["points", "Points", "number"],
              ["user_variable", "User Variable (aff_sub / aff_sub2)"], ["banner_url", "Banner URL"], ["offer_id", "Offer ID"],
              ["description", "Description"], ["countries", "Country Codes (comma separated)"],
            ].map(([k, l, t]) => (
              <div key={k as string}>
                <label className="text-xs font-semibold">{l}</label>
                <input type={(t as string) || "text"} value={edit[k as string] ?? ""} onChange={(e) => setEdit({ ...edit, [k as string]: (t === "number" ? Number(e.target.value) : e.target.value) })} className="w-full border rounded px-3 py-2 text-sm" required={k === "network_name" || k === "network_url"} />
              </div>
            ))}
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} /> Active</label>
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
