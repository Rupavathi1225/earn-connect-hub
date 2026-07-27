import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { guardAdminPanel } from "@/lib/admin-guard";
import { fmtMoney, fmtPoints } from "@/lib/format";
import { adminAwardPoints, updateUserFlags } from "@/lib/rewards.functions";

export const Route = createFileRoute("/_authenticated/admin/users")({
  beforeLoad: async ({ context }) => {
    await guardAdminPanel(context.user.id);
  },
  head: () => ({ meta: [{ title: "Users — Admin — GlobalPrime" }, { name: "description", content: "Manage users." }] }),
  component: Users,
});

function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [awardFor, setAwardFor] = useState<any | null>(null);
  const [pts, setPts] = useState(""); const [desc, setDesc] = useState("");

  async function refresh() {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers(data ?? []);
  }
  useEffect(() => { refresh(); }, []);

  async function toggle(u: any, key: "banned" | "verified") {
    await updateUserFlags({ data: { user_id: u.id, [key]: !u[key] } as any });
    refresh();
  }
  async function award(e: React.FormEvent) {
    e.preventDefault(); if (!awardFor) return;
    await adminAwardPoints({ data: { user_id: awardFor.id, points: Number(pts), description: desc || "Admin bonus" } });
    setAwardFor(null); setPts(""); setDesc(""); refresh();
  }

  return (
    <div>
      <h1 className="text-lg font-bold text-[#1a1c3a] mb-3">👤 Users</h1>
      <div className="bg-white rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-[#1a1c3a] text-white"><tr>
            {["Name", "Email", "Phone", "Country", "Points", "Cash", "Verified", "Banned", "Actions"].map((h) => <th key={h} className="p-2 text-left">{h}</th>)}
          </tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="p-2">{u.name || "-"}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.phone || "-"}</td>
                <td className="p-2">{u.country || "-"}</td>
                <td className="p-2 font-semibold">{fmtPoints(u.points_balance)}</td>
                <td className="p-2 font-semibold">{fmtMoney(Number(u.cash_balance), u.currency)}</td>
                <td className="p-2"><button onClick={() => toggle(u, "verified")} className={`px-2 py-0.5 rounded text-[10px] ${u.verified ? "bg-green-100 text-green-700" : "bg-gray-100"}`}>{u.verified ? "Yes" : "No"}</button></td>
                <td className="p-2"><button onClick={() => toggle(u, "banned")} className={`px-2 py-0.5 rounded text-[10px] ${u.banned ? "bg-red-100 text-red-700" : "bg-gray-100"}`}>{u.banned ? "Banned" : "Active"}</button></td>
                <td className="p-2"><button onClick={() => setAwardFor(u)} className="text-[10px] bg-[#5a3dba] text-white px-2 py-1 rounded">Award Points</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {awardFor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={award} className="bg-white p-4 rounded-lg w-80 space-y-3">
            <h3 className="font-bold">Award points to {awardFor.name || awardFor.email}</h3>
            <input required type="number" value={pts} onChange={(e) => setPts(e.target.value)} placeholder="Points" className="w-full border rounded px-3 py-2 text-sm" />
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" className="w-full border rounded px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setAwardFor(null)} className="flex-1 border rounded py-2 text-sm">Cancel</button>
              <button className="flex-1 bg-[#e8734a] text-white rounded py-2 text-sm font-semibold">Award</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
