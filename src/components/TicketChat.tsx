import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Msg = {
  id: string;
  sender_id: string;
  is_admin: boolean;
  message: string;
  created_at: string;
};

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "?";
}

function timeOf(ts: string) {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function TicketChat({
  ticketId,
  currentUserId,
  isAdmin,
  seedMessage,
  seedAt,
  seedSenderName,
  counterpartName,
  counterpartSubtitle,
}: {
  ticketId: string;
  currentUserId: string;
  isAdmin: boolean;
  seedMessage: string;
  seedAt: string;
  seedSenderName: string;
  counterpartName: string;
  counterpartSubtitle?: string;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  async function load() {
    const { data } = await supabase
      .from("ticket_messages")
      .select("id,sender_id,is_admin,message,created_at")
      .eq("ticket_id", ticketId)
      .order("created_at");
    setMsgs((data ?? []) as Msg[]);
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`tm_${ticketId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ticket_messages", filter: `ticket_id=eq.${ticketId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [msgs.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    const { error } = await supabase.from("ticket_messages").insert({
      ticket_id: ticketId,
      sender_id: currentUserId,
      is_admin: isAdmin,
      message: body,
    });
    if (error) alert(error.message);
  }

  async function saveEdit(id: string) {
    const body = editText.trim();
    if (!body) return;
    const { error } = await supabase.from("ticket_messages").update({ message: body }).eq("id", id);
    if (error) return alert(error.message);
    setEditingId(null);
    setEditText("");
  }

  async function del(id: string) {
    if (!confirm("Delete this message?")) return;
    const { error } = await supabase.from("ticket_messages").delete().eq("id", id);
    if (error) alert(error.message);
    setMenuFor(null);
  }

  return (
    <div className="flex flex-col h-[520px] bg-[#efeae2] rounded-lg overflow-hidden border">
      {/* header */}
      <div className="bg-[#008069] text-white px-4 py-3 flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center font-bold">
          {initials(counterpartName)}
        </div>
        <div className="min-w-0">
          <div className="font-semibold truncate">{counterpartName}</div>
          {counterpartSubtitle && <div className="text-[11px] text-white/80 truncate">{counterpartSubtitle}</div>}
        </div>
      </div>

      {/* messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
        style={{
          backgroundImage:
            "radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
        onClick={() => setMenuFor(null)}
      >
        {/* seed / original ticket body — always from the ticket owner */}
        <Bubble mine={!isAdmin} side={isAdmin ? "left" : "right"} name={isAdmin ? seedSenderName : "You"} time={timeOf(seedAt)}>
          {seedMessage}
        </Bubble>

        {msgs.map((m) => {
          const mine = m.sender_id === currentUserId;
          const senderLabel = m.is_admin ? "Support" : counterpartName === seedSenderName && !isAdmin ? "You" : seedSenderName;
          return (
            <Bubble
              key={m.id}
              mine={mine}
              side={mine ? "right" : "left"}
              name={mine ? "You" : m.is_admin ? "Support" : senderLabel}
              time={timeOf(m.created_at)}
              onMenu={mine ? () => setMenuFor(menuFor === m.id ? null : m.id) : undefined}
              menuOpen={menuFor === m.id}
              onEdit={() => {
                setEditingId(m.id);
                setEditText(m.message);
                setMenuFor(null);
              }}
              onDelete={() => del(m.id)}
            >
              {editingId === m.id ? (
                <div className="flex flex-col gap-1">
                  <textarea
                    autoFocus
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="border rounded px-2 py-1 text-sm text-gray-900 bg-white min-w-[200px]"
                    rows={2}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setEditText("");
                      }}
                      className="text-[11px] px-2 py-1 rounded bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => saveEdit(m.id)}
                      className="text-[11px] px-2 py-1 rounded bg-[#008069] text-white"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                m.message
              )}
            </Bubble>
          );
        })}
      </div>

      {/* composer */}
      <form onSubmit={send} className="p-3 bg-[#f0f2f5] flex gap-2 shrink-0">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message"
          className="flex-1 border-0 rounded-full px-4 py-2 text-sm bg-white focus:outline-none"
        />
        <button
          type="submit"
          className="bg-[#008069] text-white px-5 rounded-full text-sm font-semibold"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function Bubble({
  children,
  mine,
  side,
  name,
  time,
  onMenu,
  menuOpen,
  onEdit,
  onDelete,
}: {
  children: React.ReactNode;
  mine: boolean;
  side: "left" | "right";
  name: string;
  time: string;
  onMenu?: () => void;
  menuOpen?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className={`flex ${side === "right" ? "justify-end" : "justify-start"}`}>
      <div className="relative max-w-[75%] group">
        <div
          className={`rounded-lg px-3 py-2 text-sm shadow-sm ${
            mine ? "bg-[#d9fdd3] text-gray-900" : "bg-white text-gray-900"
          }`}
        >
          <div className={`text-[10px] font-semibold mb-0.5 ${mine ? "text-[#008069]" : "text-[#e8734a]"}`}>
            {name}
          </div>
          <div className="whitespace-pre-wrap break-words">{children}</div>
          <div className="text-[9px] text-gray-500 text-right mt-1">{time}</div>
        </div>
        {onMenu && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMenu();
            }}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border shadow text-xs opacity-0 group-hover:opacity-100 hover:opacity-100"
            aria-label="Message options"
          >
            ⋯
          </button>
        )}
        {menuOpen && (
          <div className="absolute right-0 top-6 z-10 bg-white border rounded shadow-md text-xs w-28 overflow-hidden">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
              className="block w-full text-left px-3 py-1.5 hover:bg-gray-100"
            >
              ✏️ Edit
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              className="block w-full text-left px-3 py-1.5 hover:bg-gray-100 text-red-600"
            >
              🗑 Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
