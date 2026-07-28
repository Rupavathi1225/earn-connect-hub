import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { guardAdminPanel } from "@/lib/admin-guard";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/offerwalls")({
  beforeLoad: async ({ context }) => {
    await guardAdminPanel(context.user.id);
  },
  component: OW,
});

function OW() {
  const [activeTab, setActiveTab] = useState<"offerwalls" | "requests">("offerwalls");
  const [items, setItems] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [edit, setEdit] = useState<any | null>(null);
  const [newRequest, setNewRequest] = useState<any | null>(null);
  const [profile, setProfile] = useState<any>(null);

  async function refresh() {
    const { data } = await supabase.from("offerwalls").select("*").order("display_name");
    setItems(data ?? []);
  }

  async function refreshRequests() {
    const { data } = await supabase.from("network_requests").select("*").order("created_at", { ascending: false });
    setRequests(data ?? []);
  }

  useEffect(() => {
    refresh();
    refreshRequests();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase.from("profiles").select("name, email").eq("id", user.id).maybeSingle();
        setProfile({ id: user.id, name: p?.name || p?.email || user.email });
      }
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    const p = { ...edit };
    delete p.id;
    delete p.created_at;
    delete p.updated_at;
    if (edit.id) {
      const { error } = await supabase.from("offerwalls").update(p).eq("id", edit.id);
      if (error) toast.error(error.message);
      else toast.success("Offer wall updated");
    } else {
      const { error } = await supabase.from("offerwalls").insert(p);
      if (error) toast.error(error.message);
      else toast.success("Offer wall added");
    }
    setEdit(null);
    refresh();
  }

  async function del(id: string) {
    if (confirm("Are you sure you want to delete this offer wall?")) {
      const { error } = await supabase.from("offerwalls").delete().eq("id", id);
      if (error) toast.error(error.message);
      else toast.success("Deleted successfully");
      refresh();
    }
  }

  async function toggle(o: any) {
    const { error } = await supabase.from("offerwalls").update({ active: !o.active }).eq("id", o.id);
    if (error) toast.error(error.message);
    else refresh();
  }

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!newRequest) return;
    const insertData = {
      network_name: newRequest.network_name,
      tracking_url: newRequest.tracking_url,
      user_variable: newRequest.user_variable || "user_id",
      payout_variable: newRequest.payout_variable || "payout",
      transaction_variable: newRequest.transaction_variable || "trans_id",
      status_variable: newRequest.status_variable || "status",
      offer_name: newRequest.offer_name || null,
      offer_id: newRequest.offer_id || null,
      points: Number(newRequest.points || 0),
      notes: newRequest.notes || null,
      requested_by: profile?.id,
      admin_name: profile?.name,
      status: "pending",
    };

    const { error } = await supabase.from("network_requests").insert(insertData);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Network integration request submitted!");
      setNewRequest(null);
      refreshRequests();
    }
  }

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex justify-between items-center border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("offerwalls")}
            className={`pb-2 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "offerwalls"
                ? "border-[#e8734a] text-[#e8734a]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            🎯 Offer Walls
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`pb-2 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "requests"
                ? "border-[#e8734a] text-[#e8734a]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            📡 Custom Network Requests
          </button>
        </div>

        {activeTab === "offerwalls" ? (
          <button
            onClick={() => setEdit({ provider: "", display_name: "", url_template: "", active: true })}
            className="bg-[#e8734a] hover:bg-[#d66339] text-white text-xs font-semibold px-4 py-2 rounded"
          >
            + Add Offerwall
          </button>
        ) : (
          <button
            onClick={() =>
              setNewRequest({
                network_name: "",
                tracking_url: "",
                user_variable: "user_id",
                payout_variable: "payout",
                transaction_variable: "trans_id",
                status_variable: "status",
                points: 0,
                offer_name: "",
                offer_id: "",
                notes: "",
              })
            }
            className="bg-[#1a8a7d] hover:bg-[#157267] text-white text-xs font-semibold px-4 py-2 rounded"
          >
            + Request Network
          </button>
        )}
      </div>

      {activeTab === "offerwalls" ? (
        <div className="bg-white rounded-lg overflow-hidden border border-gray-100 shadow-sm">
          <table className="w-full text-xs">
            <thead className="bg-[#1a1c3a] text-white">
              <tr>
                {["Provider", "Display Name", "URL Template", "Active", "Actions"].map((h) => (
                  <th key={h} className="p-3 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-400">
                    No offer walls configured.
                  </td>
                </tr>
              ) : (
                items.map((o) => (
                  <tr key={o.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-mono text-gray-700 font-semibold">{o.provider}</td>
                    <td className="p-3 font-medium text-gray-900">{o.display_name}</td>
                    <td className="p-3 truncate max-w-xs text-gray-500 font-mono">{o.url_template}</td>
                    <td className="p-3">
                      <button
                        onClick={() => toggle(o)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all ${
                          o.active
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {o.active ? "Enabled" : "Disabled"}
                      </button>
                    </td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => setEdit(o)}
                        className="bg-[#2563eb] hover:bg-blue-700 text-white px-2.5 py-1 rounded text-[10px] font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => del(o.id)}
                        className="bg-[#ef4444] hover:bg-red-700 text-white px-2.5 py-1 rounded text-[10px] font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg overflow-hidden border border-gray-100 shadow-sm">
          <table className="w-full text-xs">
            <thead className="bg-[#1a1c3a] text-white">
              <tr>
                {[
                  "Network",
                  "Tracking URL",
                  "User Var",
                  "Trans Var",
                  "Status",
                  "Callback URL",
                ].map((h) => (
                  <th key={h} className="p-3 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-400">
                    No custom network requests submitted.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-3">
                      <div className="font-semibold text-gray-900">{r.network_name}</div>
                      {r.notes && <div className="text-[10px] text-gray-400 max-w-xs truncate">{r.notes}</div>}
                    </td>
                    <td className="p-3 font-mono text-gray-500 truncate max-w-xs">{r.tracking_url}</td>
                    <td className="p-3 font-mono text-gray-600">{r.user_variable}</td>
                    <td className="p-3 font-mono text-gray-600">{r.transaction_variable}</td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          r.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : r.status === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-gray-600 select-all max-w-xs truncate">
                      {r.callback_url ? (
                        <div className="flex items-center gap-2">
                          <span className="bg-gray-100 p-1 rounded max-w-[180px] truncate select-all">{r.callback_url}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(r.callback_url);
                              toast.success("Callback URL copied!");
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded text-[10px]"
                          >
                            Copy
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Awaiting approval</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Offerwall Modal */}
      {edit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={save} className="bg-white p-6 rounded-lg w-full max-w-lg space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-gray-900 border-b pb-2">
              {edit.id ? "Edit" : "New"} Offer Wall
            </h3>
            {[
              ["provider", "Provider Slug (unique, lowercase, e.g. cpx_research)"],
              ["display_name", "Display Name"],
              ["url_template", "URL Template (use {user_id} placeholder)"],
              ["logo_url", "Logo URL (optional)"],
              ["description", "Description (optional)"],
            ].map(([k, l]) => (
              <div key={k} className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 block">{l}</label>
                <input
                  value={edit[k] ?? ""}
                  onChange={(e) => setEdit({ ...edit, [k]: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#e8734a]"
                  required={k === "provider" || k === "display_name" || k === "url_template"}
                />
              </div>
            ))}
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={edit.active}
                onChange={(e) => setEdit({ ...edit, active: e.target.checked })}
                className="rounded border-gray-300 text-[#e8734a] focus:ring-[#e8734a]"
              />
              Active / Enabled
            </label>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEdit(null)}
                className="flex-1 border rounded py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="flex-1 bg-[#e8734a] hover:bg-[#d66339] text-white rounded py-2 text-sm font-semibold">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Request Custom Network Modal */}
      {newRequest && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <form
            onSubmit={submitRequest}
            className="bg-white p-6 rounded-lg w-full max-w-lg space-y-3 shadow-xl my-8"
          >
            <h3 className="font-bold text-base text-gray-900 border-b pb-2">
              Request Custom Network Integration
            </h3>
            <p className="text-[11px] text-gray-500">
              Submit your tracking details. The Super Admin will review your parameters and generate a secure, signature-validated postback callback URL.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 block">Network Name *</label>
              <input
                value={newRequest.network_name}
                onChange={(e) => setNewRequest({ ...newRequest, network_name: e.target.value })}
                placeholder="e.g. AdGate Media, ClickWall"
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#e8734a]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 block">Tracking / Campaign URL *</label>
              <input
                value={newRequest.tracking_url}
                onChange={(e) => setNewRequest({ ...newRequest, tracking_url: e.target.value })}
                placeholder="https://tracker.com/click?aff_id=123&aff_sub={user_id}"
                className="w-full border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#e8734a]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 block">User Parameter</label>
                <input
                  value={newRequest.user_variable}
                  onChange={(e) => setNewRequest({ ...newRequest, user_variable: e.target.value })}
                  placeholder="e.g. user_id, aff_sub"
                  className="w-full border rounded px-3 py-1.5 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 block">Payout Parameter</label>
                <input
                  value={newRequest.payout_variable}
                  onChange={(e) => setNewRequest({ ...newRequest, payout_variable: e.target.value })}
                  placeholder="e.g. payout, reward"
                  className="w-full border rounded px-3 py-1.5 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 block">Transaction Parameter</label>
                <input
                  value={newRequest.transaction_variable}
                  onChange={(e) => setNewRequest({ ...newRequest, transaction_variable: e.target.value })}
                  placeholder="e.g. trans_id, click_id"
                  className="w-full border rounded px-3 py-1.5 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 block">Status Parameter</label>
                <input
                  value={newRequest.status_variable}
                  onChange={(e) => setNewRequest({ ...newRequest, status_variable: e.target.value })}
                  placeholder="e.g. status, event"
                  className="w-full border rounded px-3 py-1.5 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 block">Specific Offer ID (optional)</label>
                <input
                  value={newRequest.offer_id}
                  onChange={(e) => setNewRequest({ ...newRequest, offer_id: e.target.value })}
                  className="w-full border rounded px-3 py-1.5 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 block">Reward Points (optional)</label>
                <input
                  type="number"
                  value={newRequest.points}
                  onChange={(e) => setNewRequest({ ...newRequest, points: Number(e.target.value) })}
                  className="w-full border rounded px-3 py-1.5 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 block">Notes / Instructions</label>
              <textarea
                value={newRequest.notes}
                onChange={(e) => setNewRequest({ ...newRequest, notes: e.target.value })}
                rows={2}
                className="w-full border rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#e8734a]"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setNewRequest(null)}
                className="flex-1 border rounded py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="flex-1 bg-[#1a8a7d] hover:bg-[#157267] text-white rounded py-2 text-sm font-semibold">
                Submit Request
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
