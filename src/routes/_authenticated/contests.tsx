import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/contests")({
  head: () => ({ meta: [{ title: "Contests — PrimePath Services" }, { name: "description", content: "Compete and win prizes." }] }),
  component: C,
});

function C() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { supabase.from("contests").select("*").eq("active", true).order("start_at", { ascending: false }).then(({ data }) => setItems(data ?? [])); }, []);
  return (
    <div>
      <h1 className="text-lg font-bold text-[#1a1c3a] mb-3">🏆 Contests</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.length === 0 && <div className="bg-white rounded-lg p-8 text-center text-gray-400 text-sm col-span-full">No active contests.</div>}
        {items.map((c) => (
          <div key={c.id} className="bg-white rounded-lg p-4">
            <div className="text-2xl">🏆</div>
            <h2 className="font-bold text-[#1a1c3a] mt-2">{c.name}</h2>
            <div className="text-xs text-gray-500 mb-2">{fmtDate(c.start_at)} → {fmtDate(c.end_at)}</div>
            <div className="text-sm">Prize: <b className="text-[#e8734a]">{c.prize}</b></div>
            {c.description && <p className="text-xs text-gray-600 mt-2">{c.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
