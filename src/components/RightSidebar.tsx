import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChatFeed } from "./ChatFeed";

type Member = { id: string; name: string | null; email: string; points_balance: number };
type SurveyLite = { id: string; network_name: string };
type CreditedLite = { id: string; points: number; type: string; created_at: string; user_id: string; display_name?: string };

export function RightSidebar() {
  const [top, setTop] = useState<Member[]>([]);
  const [recent, setRecent] = useState<SurveyLite[]>([]);
  const [credited, setCredited] = useState<CreditedLite[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: t }, { data: r }, { data: l }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,name,email,points_balance")
          .order("points_balance", { ascending: false })
          .limit(5),
        supabase
          .from("surveys")
          .select("id,network_name")
          .eq("active", true)
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("points_ledger")
          .select("id,points,type,created_at,user_id")
          .gt("points", 0)
          .order("created_at", { ascending: false })
          .limit(8),
      ]);
      setTop((t ?? []) as Member[]);
      setRecent((r ?? []) as SurveyLite[]);

      const ledger = (l ?? []) as CreditedLite[];
      if (ledger.length) {
        const ids = Array.from(new Set(ledger.map((x) => x.user_id)));
        const { data: profs } = await supabase.from("profiles").select("id,name,email").in("id", ids);
        const map = new Map((profs ?? []).map((p: any) => [p.id, p.name ?? p.email?.split("@")[0] ?? "User"]));
        setCredited(ledger.map((x) => ({ ...x, display_name: map.get(x.user_id) ?? "User" })));
      } else {
        setCredited([]);
      }
    })();
  }, []);

  return (
    <aside className="w-72 shrink-0 space-y-4">
      <div className="bg-[#1a1c3a] text-white rounded-lg overflow-hidden">
        <div className="px-3 py-2 font-bold text-sm border-b border-white/10">Globalprime Chat Box</div>
        <ChatFeed compact />
      </div>

      <div className="bg-[#1a1c3a] text-white rounded-lg overflow-hidden">
        <div className="px-3 py-2 font-bold text-sm text-center border-b border-white/10">Top Members</div>
        <ul>
          {top.map((m) => (
            <li key={m.id} className="flex items-center gap-2 px-3 py-2 border-b border-white/5 text-xs">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm shrink-0">
                {(m.name ?? m.email)[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{m.name ?? m.email.split("@")[0]}</div>
                <div className="text-[10px] text-white/60">Earned P{Math.floor(Number(m.points_balance))}</div>
              </div>
              <span className="text-green-400 text-sm">✓</span>
            </li>
          ))}
          {top.length === 0 && <li className="px-3 py-3 text-[11px] text-white/40 text-center">No members yet</li>}
        </ul>
      </div>

      <div className="bg-white rounded-lg overflow-hidden">
        <div className="px-3 py-2 font-bold text-sm text-[#1a1c3a] border-b">Recently Credited Users</div>
        <ul>
          {credited.map((c) => (
            <li key={c.id} className="px-3 py-1.5 text-xs border-b last:border-0 flex justify-between gap-2">
              <span className="truncate text-[#1a1c3a] font-medium">{c.display_name}</span>
              <span className="text-green-600 font-bold shrink-0">+{Math.floor(Number(c.points))}p</span>
            </li>
          ))}
          {credited.length === 0 && <li className="px-3 py-3 text-[11px] text-gray-400 text-center">No credits yet</li>}
        </ul>
      </div>

      <div className="bg-white rounded-lg overflow-hidden">
        <div className="px-3 py-2 font-bold text-sm text-[#1a1c3a] border-b">Recently Added</div>
        <ul>
          {recent.map((s) => (
            <li key={s.id} className="px-3 py-1.5 text-xs text-[#2563eb] border-b last:border-0 truncate">
              {s.network_name}
            </li>
          ))}
          {recent.length === 0 && <li className="px-3 py-3 text-[11px] text-gray-400 text-center">No surveys yet</li>}
        </ul>
      </div>
    </aside>
  );
}
