import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate, fmtPoints } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/referrals")({
  head: () => ({ meta: [{ title: "Referrals — GlobalPrime" }, { name: "description", content: "Invite friends and earn commissions." }] }),
  component: RefPage,
});

function RefPage() {
  const { user } = Route.useRouteContext();
  const [code, setCode] = useState("");
  const [refs, setRefs] = useState<Array<{ id: string; referred_id: string; commission_points: number; created_at: string }>>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("referral_code").eq("id", user.id).maybeSingle(),
        supabase.from("referrals").select("id,referred_id,commission_points,created_at").eq("referrer_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (p) setCode(p.referral_code);
      setRefs((r ?? []) as any);
    })();
  }, [user.id]);

  const link = typeof window !== "undefined" ? `${window.location.origin}/auth?mode=signup&ref=${code}` : "";
  const total = refs.reduce((a, r) => a + Number(r.commission_points || 0), 0);

  return (
    <div className="max-w-3xl">
      <h1 className="text-lg font-bold text-[#1a1c3a] mb-3">👥 Referrals</h1>
      <div className="bg-white rounded-lg p-4 mb-4">
        <div className="text-xs text-gray-500">Your referral link</div>
        <div className="mt-1 flex gap-2">
          <input readOnly value={link} className="flex-1 border rounded px-3 py-2 text-xs bg-gray-50" />
          <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="bg-[#1a8a7d] text-white px-4 rounded text-xs font-semibold">
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-[#1a1c3a] text-white p-3 rounded"><div className="text-xs opacity-70">Total Referrals</div><div className="text-2xl font-bold">{refs.length}</div></div>
          <div className="bg-[#e8734a] text-white p-3 rounded"><div className="text-xs opacity-90">Total Commission</div><div className="text-2xl font-bold">{fmtPoints(total)} pts</div></div>
        </div>
      </div>
      <div className="bg-white rounded-lg p-4">
        <h2 className="font-bold text-sm mb-2">Referral History</h2>
        {refs.length === 0 ? <div className="text-xs text-gray-400 py-6 text-center">No referrals yet — share your link!</div> : (
          <table className="w-full text-xs">
            <thead className="bg-[#1a1c3a] text-white"><tr>
              <th className="p-2 text-left">Date</th><th className="p-2 text-left">User</th><th className="p-2 text-left">Commission</th>
            </tr></thead>
            <tbody>
              {refs.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="p-2">{fmtDate(r.created_at)}</td>
                  <td className="p-2 font-mono text-[10px]">{r.referred_id.slice(0, 8)}…</td>
                  <td className="p-2 font-bold text-[#e8734a]">+{fmtPoints(r.commission_points)} pts</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
