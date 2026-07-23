import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/_authenticated/admin/tickets")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", context.user.id).eq("role", "admin").maybeSingle();
    if (!data) throw redirect({ to: "/dashboard" });
  },
  component: T,
});

function T() {
  const { user } = Route.useRouteContext();
  const [tickets, setTickets] = useState<any[]>([]);
  const [sel, setSel] = useState<any | null>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  async function refresh() { const { data } = await supabase.from("tickets").select("*, profiles!inner(name,email)").order("created_at", { ascending: false }); setTickets(data ?? []); }
  useEffect(() => { refresh(); }, []);
  useEffect(() => { if (sel) supabase.from("ticket_messages").select("*").eq("ticket_id", sel.id).order("created_at").then(({ data }) => setMsgs(data ?? [])); }, [sel]);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from("ticket_messages").insert({ ticket_id: sel.id, sender_id: user.id, is_admin: true, message: reply });
    setReply("");
    const { data } = await supabase.from("ticket_messages").select("*").eq("ticket_id", sel.id).order("created_at"); setMsgs(data ?? []);
  }
  async function setStatus(s: string) { await supabase.from("tickets").update({ status: s as any }).eq("id", sel.id); refresh(); setSel({ ...sel, status: s }); }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="bg-white rounded-lg p-4 lg:col-span-1">
        <h1 className="text-lg font-bold text-[#1a1c3a] mb-3">🎫 Tickets</h1>
        <table className="w-full text-xs">
          <thead className="bg-[#1a1c3a] text-white"><tr>{["ID", "User", "Subject", "Priority", "Status"].map((h) => <th key={h} className="p-2 text-left">{h}</th>)}</tr></thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id} className={`border-b cursor-pointer ${sel?.id === t.id ? "bg-[#1a8a7d]/10" : ""}`} onClick={() => setSel(t)}>
                <td className="p-2 font-mono text-[10px]">{t.id.slice(0, 6)}</td>
                <td className="p-2">{t.profiles?.name || t.profiles?.email}</td>
                <td className="p-2">{t.subject}</td>
                <td className="p-2">{t.priority}</td>
                <td className="p-2"><StatusBadge s={t.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="lg:col-span-2">
        {sel ? (
          <div className="bg-white rounded-lg p-4">
            <div className="flex justify-between mb-3">
              <div><b>{sel.subject}</b><div className="text-xs text-gray-500">{sel.profiles?.email} · {fmtDate(sel.created_at)}</div></div>
              <div className="flex gap-1">
                {["open", "in_progress", "closed"].map((s) => (
                  <button key={s} onClick={() => setStatus(s)} className={`text-[10px] px-2 py-1 rounded ${sel.status === s ? "bg-[#1a1c3a] text-white" : "border"}`}>{s}</button>
                ))}
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2 mb-3">
              <div className="bg-gray-50 p-2 rounded text-xs"><b>User:</b> {sel.body}</div>
              {msgs.map((m) => <div key={m.id} className={`p-2 rounded text-xs ${m.is_admin ? "bg-[#1a8a7d]/10" : "bg-gray-50"}`}><b>{m.is_admin ? "Admin" : "User"}:</b> {m.message}</div>)}
            </div>
            <form onSubmit={send} className="flex gap-2"><input required value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply…" className="flex-1 border rounded px-3 py-2 text-sm" /><button className="bg-[#1a8a7d] text-white px-4 rounded text-sm">Send</button></form>
          </div>
        ) : <div className="bg-white rounded-lg p-8 text-center text-gray-400 text-sm">Select a ticket to view</div>}
      </div>
    </div>
  );
}
