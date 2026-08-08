import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { TicketChat } from "@/components/TicketChat";

export const Route = createFileRoute("/_authenticated/tickets")({
  head: () => ({ meta: [{ title: "Support — PrimePath Services" }, { name: "description", content: "Raise a support ticket." }] }),
  component: TicketsPage,
});

function TicketsPage() {
  const { user } = Route.useRouteContext();
  const [tickets, setTickets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState("medium");

  async function refresh() {
    const { data } = await supabase.from("tickets").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setTickets(data ?? []);
  }
  useEffect(() => { refresh(); }, [user.id]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const { data, error } = await supabase.from("tickets").insert({ user_id: user.id, subject, body, priority: priority as any }).select().maybeSingle();
    if (error) return alert(error.message);
    setSubject(""); setBody("");
    refresh();
    if (data) setSelected(data);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-white rounded-lg p-4">
        <h1 className="text-lg font-bold text-[#1a1c3a] mb-3">🎫 Support Tickets</h1>
        {tickets.length === 0 ? <div className="text-xs text-gray-400 py-6 text-center">No tickets. Create one →</div> : (
          <ul className="space-y-2 mb-4">
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
          <TicketChat
            ticketId={selected.id}
            currentUserId={user.id}
            isAdmin={false}
            seedMessage={selected.body}
            seedAt={selected.created_at}
            seedSenderName="You"
            counterpartName="Support Team"
            counterpartSubtitle={selected.subject}
          />
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
