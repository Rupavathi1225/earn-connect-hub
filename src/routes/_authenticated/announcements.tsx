import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/announcements")({
  head: () => ({ meta: [{ title: "News — GlobalPrime" }, { name: "description", content: "Platform announcements." }] }),
  component: A,
});

function A() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { supabase.from("announcements").select("*").eq("active", true).order("created_at", { ascending: false }).then(({ data }) => setItems(data ?? [])); }, []);
  return (
    <div className="max-w-3xl">
      <h1 className="text-lg font-bold text-[#1a1c3a] mb-3">📢 News & Announcements</h1>
      <div className="space-y-3">
        {items.length === 0 && <div className="bg-white rounded-lg p-8 text-center text-gray-400 text-sm">No announcements yet.</div>}
        {items.map((a) => (
          <article key={a.id} className="bg-white rounded-lg p-4">
            <h2 className="font-bold text-[#1a1c3a]">{a.title}</h2>
            <div className="text-[10px] text-gray-400 mb-2">{fmtDate(a.created_at)}</div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{a.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
