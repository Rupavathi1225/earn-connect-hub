import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { guardAdminPanel } from "@/lib/admin-guard";
import { fmtMoney, fmtPoints } from "@/lib/format";
import { adminAwardPoints, updateUserFlags } from "@/lib/rewards.functions";
import { createUserAccount } from "@/lib/superadmin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/users")({
  beforeLoad: async ({ context }) => {
    await guardAdminPanel(context.user.id);
  },
  head: () => ({ meta: [{ title: "Users — Admin — Global Prime" }, { name: "description", content: "Manage users." }] }),
  component: Users,
});

function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [awardFor, setAwardFor] = useState<any | null>(null);
  const [pts, setPts] = useState(""); const [desc, setDesc] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "" });

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
  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createUserAccount({ data: createForm });
      toast.success("User account created successfully!");
      setCreateOpen(false);
      setCreateForm({ name: "", email: "", password: "" });
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to create user account");
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-lg font-bold text-[#1a1c3a]">👤 Users</h1>
        <button onClick={() => setCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-xs font-semibold">
          + Create User
        </button>
      </div>
      
      <div className="bg-white rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-[#1a1c3a] text-white"><tr>
            {["Name", "Email", "Created By", "Phone", "Country", "Points", "Cash", "Verified", "Banned", "Actions"].map((h) => <th key={h} className="p-2 text-left">{h}</th>)}
          </tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="p-2">{u.name || "-"}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">
                  {(() => {
                    if (!u.created_by) return <span className="text-gray-400">Self Sign Up</span>;
                    const creator = users.find((x) => x.id === u.created_by);
                    return <span className="font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{creator ? (creator.name || creator.email) : "Admin"}</span>;
                  })()}
                </td>
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

      {createOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={handleCreateUser} className="bg-white p-5 rounded-lg w-96 space-y-4 shadow-xl">
            <h3 className="font-bold text-lg text-[#1a1c3a] border-b pb-2">➕ Create User Account</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
                <input required type="text" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="John Doe" className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
                <input required type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} placeholder="john@example.com" className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
                <input required type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} placeholder="Min 8 characters" className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button type="button" onClick={() => setCreateOpen(false)} className="flex-1 border rounded py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded py-2 text-sm font-semibold">Create Account</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
