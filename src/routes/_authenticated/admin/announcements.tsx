import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/announcements")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", context.user.id).eq("role", "admin").maybeSingle();
    if (!data) throw redirect({ to: "/dashboard" });
  },
  component: A,
});

function A() {
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState(""); const [body, setBody] = useState("");
  async function refresh() { const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false }); setItems(data ?? []); }
  useEffect(() => { refresh(); }, []);
  async function create(e: React.FormEvent) { e.preventDefault(); await supabase.from("announcements").insert({ title, body }); setTitle(""); setBody(""); refresh(); }
  async function toggle(a: any) { await supabase.from("announcements").update({ active: !a.active }).eq("id", a.id); refresh(); }
  async function del(id: string) { if (confirm("Delete?")) { await supabase.from("announcements").delete().eq("id", id); refresh(); } }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <form onSubmit={create} className="bg-white rounded-lg p-4 space-y-2">
        <h2 className="font-bold text-sm">📢 New Announcement</h2>
        <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full border rounded px-3 py-2 text-sm" />
        <textarea required value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body" className="w-full border rounded px-3 py-2 text-sm h-32" />
        <button className="w-full bg-[#e8734a] text-white font-bold py-2 rounded text-sm">Publish</button>
      </form>
      <div className="lg:col-span-2 space-y-2">
        {items.map((a) => (
          <div key={a.id} className="bg-white rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div><b>{a.title}</b><div className="text-[10px] text-gray-400">{fmtDate(a.created_at)}</div></div>
              <div className="flex gap-1">
                <button onClick={() => toggle(a)} className={`text-[10px] px-2 py-1 rounded ${a.active ? "bg-green-100 text-green-700" : "bg-gray-100"}`}>{a.active ? "Active" : "Hidden"}</button>
                <button onClick={() => del(a.id)} className="bg-red-500 text-white px-2 py-1 rounded text-[10px]">Delete</button>
              </div>
            </div>
            <p className="text-sm mt-1 whitespace-pre-wrap">{a.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
