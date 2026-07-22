import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate } from "@/lib/format";
import { StatusBadge } from "./dashboard";

export const Route = createFileRoute("/_authenticated/tickets")({
  head: () => ({ meta: [{ title: "Support — GlobalPrime" }, { name: "description", content: "Raise a support ticket." }] }),
  component: TicketsPage,
});

function TicketsPage() {
  const { user } = Route.useRouteContext();
  const [tickets, setTickets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [subject, setSubject] = useState(""); const [body, setBody] = useState(""); const [priority, setPriority] = useState("medium");
  const [reply, setReply] = useState("");

  async function refresh() {
    const { data } = await supabase.from("tickets").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setTickets(data ?? []);
  }
  useEffect(() => { refresh(); }, [user.id]);
  useEffect(() => {
    if (!selected) return;
    supabase.from("ticket_messages").select("*").eq("ticket_id", selected.id).order("created_at").then(({ data }) => setMessages(data ?? []));
  }, [selected]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const { data, error } = await supabase.from("tickets").insert({ user_id: user.id, subject, body, priority: priority as any }).select().maybeSingle();
    if (error) return alert(error.message);
    setSubject(""); setBody("");
    refresh();
    if (data) setSelected(data);
  }
  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const { error } = await supabase.from("ticket_messages").insert({ ticket_id: selected.id, sender_id: user.id, is_admin: false, message: reply });
    if (error) return alert(error.message);
    setReply("");
    const { data } = await supabase.from("ticket_messages").select("*").eq("ticket_id", selected.id).order("created_at");
    setMessages(data ?? []);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-white rounded-lg p-4">
        <h1 className="text-lg font-bold text-[#1a1c3a] mb-3">🎫 Support Tickets</h1>
        {tickets.length === 0 ? <div className="text-xs text-gray-400 py-6 text-center">No tickets. Create one →</div> : (
          <ul className="space-y-2">
            {tickets.map((t) => (
              <li key={t.id} onClick={() => setSelected(t)} className={`p-3 rounded border cursor-pointer ${selected?.id === t.id ? "border-[#1a8a7d] bg-[#1a8a7d]/5" : ""}`}>
                <div className="flex justify-between">
                  <b className="text-sm">{t.subject}</b>
                  <StatusBadge s={t.status} />
                </div>
                <div className="text-[10px] text-gray-500">{fmtDate(t.created_at)} · Priority: {t.priority}</div>
              </li>
            ))}
          </ul>
        )}
        {selected && (
          <div className="mt-4 border-t pt-4">
            <div className="max-h-64 overflow-y-auto space-y-2 mb-3">
              <div className="bg-gray-50 p-2 rounded text-xs"><b>You:</b> {selected.body}</div>
              {messages.map((m) => (
                <div key={m.id} className={`p-2 rounded text-xs ${m.is_admin ? "bg-[#1a8a7d]/10" : "bg-gray-50"}`}>
                  <b>{m.is_admin ? "Admin" : "You"}:</b> {m.message}
                </div>
              ))}
            </div>
            <form onSubmit={sendReply} className="flex gap-2">
              <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type reply…" className="flex-1 border rounded px-3 py-2 text-sm" />
              <button className="bg-[#1a8a7d] text-white px-4 rounded text-sm">Send</button>
            </form>
          </div>
        )}
      </div>
      <div className="bg-white rounded-lg p-4">
        <h2 className="font-bold text-sm mb-3">New Ticket</h2>
        <form onSubmit={create} className="space-y-2">
          <input required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="w-full border rounded px-3 py-2 text-sm" />
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full border rounded px-3 py-2 text-sm">
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
          <textarea required value={body} onChange={(e) => setBody(e.target.value)} placeholder="Describe your issue…" className="w-full border rounded px-3 py-2 text-sm h-24" />
          <button className="w-full bg-[#e8734a] text-white font-bold py-2 rounded text-sm">Submit Ticket</button>
        </form>
      </div>
    </div>
  );
}
