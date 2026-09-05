import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FeedItem {
  id: string;
  event_type: string;
  message: string;
  created_at: string;
}

const LIMIT = 30;
const POLL_MS = 10_000;

// When several events share the same timestamp (e.g. signup creates "joined" + "signup bonus"
// in one transaction), make sure the "joined" line always comes first.
const PRIORITY: Record<string, number> = {
  user_joined: 0,
  user_login: 1,
  withdrawal_approved: 2,
  withdrawal_requested: 3,
  survey_completed: 4,
  points_earned: 5,
};

function sortFeed(items: FeedItem[]) {
  return [...items].sort((a, b) => {
    const ta = new Date(a.created_at).getTime();
    const tb = new Date(b.created_at).getTime();
    if (tb !== ta) return tb - ta;
    return (PRIORITY[a.event_type] ?? 9) - (PRIORITY[b.event_type] ?? 9);
  });
}

function mergeFeed(current: FeedItem[], incoming: FeedItem[]) {
  const map = new Map<string, FeedItem>();
  for (const i of current) map.set(i.id, i);
  for (const i of incoming) map.set(i.id, i);
  return sortFeed(Array.from(map.values())).slice(0, LIMIT);
}

function timeAgo(iso: string, now: number) {
  const diff = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (diff < 45) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function ChatFeed({ compact = false }: { compact?: boolean }) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("chat_feed")
      .select("id,event_type,message,created_at")
      .order("created_at", { ascending: false })
      .limit(LIMIT);
    if (data) setItems((cur) => mergeFeed(cur, data as FeedItem[]));
    setNow(Date.now());
  }, []);

  useEffect(() => {
    void load();

    // Live stream of new events
    const ch = supabase
      .channel("chat_feed_stream")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_feed" }, (payload) => {
        setItems((cur) => mergeFeed(cur, [payload.new as FeedItem]));
        setNow(Date.now());
      })
      .subscribe((status) => {
        // If the live connection (re)opens, catch up on anything we may have missed
        if (status === "SUBSCRIBED") void load();
      });

    // Safety net: poll in case the live connection is blocked or drops silently
    const poll = setInterval(() => void load(), POLL_MS);
    const tick = setInterval(() => setNow(Date.now()), 30_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      supabase.removeChannel(ch);
      clearInterval(poll);
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  const iconFor = (t: string) => {
    if (t === "user_joined") return "👋";
    if (t === "user_login") return "🟢";
    if (t === "survey_completed") return "✅";
    if (t === "points_earned") return "💰";
    if (t === "withdrawal_requested") return "💸";
    if (t === "withdrawal_approved") return "🎉";
    return "•";
  };

  return (
    <div className="bg-[#1a1c3a] text-white rounded-lg overflow-hidden">
      <div className="px-3 py-2 font-bold text-sm text-center border-b border-white/10">💬 Live Activity</div>
      <div className={`overflow-y-auto ${compact ? "max-h-64" : "max-h-96"}`}>
        {items.length === 0 && <div className="p-3 text-xs text-white/40 text-center">Waiting for activity…</div>}
        {items.map((i) => {
          const joined = i.event_type === "user_joined";
          return (
            <div
              key={i.id}
              className={`px-3 py-1.5 text-[11px] border-b border-white/5 flex gap-2 items-start ${
                joined ? "bg-[#e8734a]/10" : ""
              }`}
            >
              <span>{iconFor(i.event_type)}</span>
              <span className={`flex-1 ${joined ? "text-[#f59e0b] font-semibold" : "text-white/80"}`}>{i.message}</span>
              <span className="text-[9px] text-white/40 shrink-0 whitespace-nowrap">{timeAgo(i.created_at, now)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
