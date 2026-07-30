import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { guardAdminPanel } from "@/lib/admin-guard";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/postback-logs")({
  beforeLoad: async ({ context }) => {
    await guardAdminPanel(context.user.id);
  },
  component: PL,
});

function PL() {
  const [items, setItems] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("postback_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => setItems(data ?? []));

    supabase
      .from("profiles")
      .select("id,name,email")
      .then(({ data }) => setProfiles(data ?? []));
  }, []);

  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  return (
    <div>
      <h1 className="text-lg font-bold text-[#1a1c3a] mb-3">📡 Postback Logs</h1>
      <div className="bg-white rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-[#1a1c3a] text-white">
            <tr>
              {["Time", "Provider", "TxID", "User", "Points", "Created By", "Valid", "Processed", "Error"].map((h) => (
                <th key={h} className="p-2 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((l) => {
              const creator = l.created_by_admin_id ? profileMap.get(l.created_by_admin_id) : null;
              return (
                <tr key={l.id} className="border-b">
                  <td className="p-2">{fmtDate(l.created_at)}</td>
                  <td className="p-2 font-mono">{l.provider}</td>
                  <td className="p-2 font-mono text-[10px]">{l.transaction_id}</td>
                  <td className="p-2 font-mono text-[10px]">{l.user_id?.slice(0, 8) ?? "-"}</td>
                  <td className="p-2">{l.points ?? "-"}</td>
                  <td className="p-2">
                    {l.created_by_admin_id ? (
                      <span className="font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        {creator ? (creator.name || creator.email) : "Admin"}
                      </span>
                    ) : (
                      <span className="text-gray-400">System / Direct</span>
                    )}
                  </td>
                  <td className="p-2">{l.signature_valid ? "✅" : "❌"}</td>
                  <td className="p-2">{l.processed ? "✅" : "-"}</td>
                  <td className="p-2 text-red-600">{l.error ?? ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
