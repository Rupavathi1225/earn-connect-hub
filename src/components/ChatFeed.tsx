import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FeedItem {
  id: string;
  event_type: string;
  message: string;
  created_at: string;
}

export function ChatFeed({ compact = false }: { compact?: boolean }) {
  const [items, setItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("chat_feed").select("id,event_type,message,created_at").order("created_at", { ascending: false }).limit(30);
      setItems((data ?? []) as FeedItem[]);
    })();
    const ch = supabase
      .channel("chat_feed_stream")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_feed" }, (payload) => {
        setItems((cur) => [payload.new as FeedItem, ...cur].slice(0, 30));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

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
        {items.map((i) => (
          <div key={i.id} className="px-3 py-1.5 text-[11px] border-b border-white/5 flex gap-2">
            <span>{iconFor(i.event_type)}</span>
            <span className="text-white/80 flex-1">{i.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
