import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { TicketChat } from "@/components/TicketChat";

export const Route = createFileRoute("/_authenticated/admin/tickets")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", context.user.id).eq("role", "admin").maybeSingle();
    if (!data) throw redirect({ to: "/dashboard" });
  },
  component: T,
});

type Profile = { name: string | null; email: string };
type Ticket = {
  id: string;
  user_id: string;
  subject: string;
  body: string;
  priority: string;
  status: string;
  created_at: string;
  profile: Profile;
};

function displayName(p: Profile | undefined) {
  if (!p) return "Member";
  if (p.name && p.name.trim()) return p.name.trim();
  if (p.email) return p.email.split("@")[0];
  return "Member";
}

function T() {
  const { user } = Route.useRouteContext();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [selId, setSelId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  async function refresh() {
    const { data: ts } = await supabase.from("tickets").select("*").order("created_at", { ascending: false });
    const rows = (ts ?? []) as any[];
    const ids = Array.from(new Set(rows.map((t) => t.user_id)));
    let map = new Map<string, Profile>();
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id,name,email").in("id", ids);
      map = new Map((profs ?? []).map((p: any) => [p.id, { name: p.name, email: p.email } as Profile]));
    }
    setTickets(rows.map((t) => ({ ...t, profile: map.get(t.user_id) ?? { name: null, email: "—" } })));
  }
  useEffect(() => { refresh(); }, []);

  // Group tickets by user
  const grouped = useMemo(() => {
    const g = new Map<string, { profile: Profile; tickets: Ticket[]; lastAt: string }>();
    for (const t of tickets) {
      const cur = g.get(t.user_id);
      if (cur) {
        cur.tickets.push(t);
        if (t.created_at > cur.lastAt) cur.lastAt = t.created_at;
      } else {
        g.set(t.user_id, { profile: t.profile, tickets: [t], lastAt: t.created_at });
      }
    }
    return Array.from(g.entries())
      .map(([uid, v]) => ({ uid, ...v }))
      .filter((u) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return displayName(u.profile).toLowerCase().includes(q) || (u.profile.email ?? "").toLowerCase().includes(q);
      })
      .sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));
  }, [tickets, query]);

  const activeUser = grouped.find((g) => g.uid === activeUserId);
  const selectedTicket = activeUser?.tickets.find((t) => t.id === selId) ?? activeUser?.tickets[0] ?? null;

  async function setStatus(s: string) {
    if (!selectedTicket) return;
    await supabase.from("tickets").update({ status: s as any }).eq("id", selectedTicket.id);
    refresh();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-140px)]">
      {/* Users list (WhatsApp-style sidebar) */}
      <div className="bg-white rounded-lg overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b">
          <h1 className="font-bold text-[#1a1c3a] text-sm mb-2">🎫 Support Chats</h1>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users…"
            className="w-full border rounded-full px-3 py-1.5 text-xs"
          />
        </div>
        <ul className="flex-1 overflow-y-auto">
          {grouped.length === 0 && <li className="p-4 text-xs text-gray-400 text-center">No tickets yet</li>}
          {grouped.map((g) => {
            const name = displayName(g.profile);
            const openCount = g.tickets.filter((t) => t.status !== "closed").length;
            const isActive = g.uid === activeUserId;
            return (
              <li
                key={g.uid}
                onClick={() => { setActiveUserId(g.uid); setSelId(g.tickets[0].id); }}
                className={`px-3 py-2.5 border-b cursor-pointer flex items-center gap-3 ${isActive ? "bg-[#1a8a7d]/10" : "hover:bg-gray-50"}`}
              >
                <div className="w-10 h-10 rounded-full bg-[#008069] text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <div className="font-semibold text-sm text-[#1a1c3a] truncate">{name}</div>
                    <div className="text-[9px] text-gray-400">{fmtDate(g.lastAt)}</div>
                  </div>
                  <div className="text-[11px] text-gray-500 truncate">{g.tickets[0].subject}</div>
                </div>
                {openCount > 0 && (
                  <span className="bg-[#e8734a] text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {openCount}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Chat panel */}
      <div className="flex flex-col gap-3 min-h-0">
        {activeUser && selectedTicket ? (
          <>
            {/* Ticket picker for this user + status controls */}
            <div className="bg-white rounded-lg p-3 flex flex-wrap items-center gap-2 justify-between">
              <div className="flex gap-2 flex-wrap items-center">
                <span className="text-xs text-gray-500">Tickets:</span>
                {activeUser.tickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelId(t.id)}
                    className={`text-[11px] px-2 py-1 rounded border flex items-center gap-1.5 ${selectedTicket.id === t.id ? "bg-[#1a1c3a] text-white border-[#1a1c3a]" : "bg-white"}`}
                    title={t.subject}
                  >
                    <span className="truncate max-w-[140px]">{t.subject}</span>
                    <StatusBadge s={t.status} />
                  </button>
                ))}
              </div>
              <div className="flex gap-1 items-center">
                <span className="text-[11px] text-gray-500 mr-1">Priority: <b>{selectedTicket.priority}</b></span>
                {["open", "in_progress", "closed"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`text-[10px] px-2 py-1 rounded ${selectedTicket.status === s ? "bg-[#1a8a7d] text-white" : "border"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 min-h-0">
              <TicketChat
                ticketId={selectedTicket.id}
                currentUserId={user.id}
                isAdmin={true}
                seedMessage={selectedTicket.body}
                seedAt={selectedTicket.created_at}
                seedSenderName={displayName(activeUser.profile)}
                counterpartName={displayName(activeUser.profile)}
                counterpartSubtitle={activeUser.profile.email}
              />
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg p-8 text-center text-gray-400 text-sm h-full flex items-center justify-center">
            Select a user to open their support chat
          </div>
        )}
      </div>
    </div>
  );
}
