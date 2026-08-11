import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  DataTable,
  Badge,
  Loading,
  ErrorState,
  SectionTitle,
  Btn,
  Modal,
  Field,
  ConfirmButton,
} from "@/components/superadmin/kit";
import { reviewNetworkRequest } from "@/lib/superadmin.functions";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/superadmin/network-requests")({
  head: () => ({
    meta: [
      { title: "Network Requests · Super Admin · Global Prime" },
      { name: "description", content: "Review and approve/reject custom network integrations." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NetworkRequests,
});

function NetworkRequests() {
  const qc = useQueryClient();
  const reviewFn = useServerFn(reviewNetworkRequest);

  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [rejectReq, setRejectReq] = useState<any | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["sa", "network_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("network_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["sa", "network_requests"] });
    qc.invalidateQueries({ queryKey: ["sa", "networks"] });
    qc.invalidateQueries({ queryKey: ["sa", "dashboard"] });
  };

  const review = useMutation({
    mutationFn: async (vars: { id: string; action: "approve" | "reject"; note?: string }) => {
      return reviewFn({
        data: {
          id: vars.id,
          action: vars.action,
          note: vars.note,
          base_url: window.location.origin,
        },
      });
    },
    onSuccess: (res) => {
      toast.success(res.status === "approved" ? "Approved & Postback Generated!" : "Request Rejected");
      setSelectedReq(null);
      setRejectReq(null);
      setRejectNote("");
      invalidate();
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} />;

  const requests = data ?? [];

  const filtered = requests.filter((r) => {
    if (activeTab === "all") return true;
    return r.status === activeTab;
  });

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>Network Requests</SectionTitle>
        <p className="mb-4 text-xs text-[var(--sa-muted)]">
          Review network request applications submitted by admins. Approving a request automatically inserts the network and generates its Postback callback URL.
        </p>

        <div className="flex gap-2">
          <Btn
            tone={activeTab === "all" ? "blue" : "dark"}
            onClick={() => setActiveTab("all")}
          >
            All ({requests.length})
          </Btn>
          <Btn
            tone={activeTab === "pending" ? "blue" : "dark"}
            onClick={() => setActiveTab("pending")}
          >
            Pending ({pendingCount})
          </Btn>
          <Btn
            tone={activeTab === "approved" ? "blue" : "dark"}
            onClick={() => setActiveTab("approved")}
          >
            Approved
          </Btn>
          <Btn
            tone={activeTab === "rejected" ? "blue" : "dark"}
            onClick={() => setActiveTab("rejected")}
          >
            Rejected
          </Btn>
        </div>
      </Card>

      <Card>
        <DataTable
          rows={filtered}
          exportName="network_requests"
          columns={[
            { key: "admin_name", header: "Admin" },
            { key: "network_name", header: "Network" },
            {
              key: "tracking_url",
              header: "URL",
              render: (r) => (
                <span className="font-mono text-[10px] text-blue-400 break-all max-w-[200px] block truncate" title={r.tracking_url}>
                  {r.tracking_url}
                </span>
              ),
            },
            { key: "offer_id", header: "Offer ID" },
            { key: "points", header: "Points" },
            { key: "user_variable", header: "User Var" },
            {
              key: "status",
              header: "Status",
              render: (r) => (
                <Badge tone={r.status === "approved" ? "green" : r.status === "pending" ? "yellow" : "red"}>
                  {r.status}
                </Badge>
              ),
            },
            { key: "created_at", header: "Requested", render: (r) => fmtDate(r.created_at) },
            {
              key: "__actions",
              header: "Actions",
              sortable: false,
              render: (r) => (
                <div className="flex flex-wrap gap-1.5">
                  {r.status === "pending" && (
                    <>
                      <ConfirmButton
                        message={`Approve ${r.network_name}? This will generate the postback URL.`}
                        onConfirm={() => review.mutate({ id: r.id, action: "approve" })}
                      >
                        ✓ Approve
                      </ConfirmButton>
                      <Btn tone="red" onClick={() => setRejectReq(r)}>
                        ✕ Reject
                      </Btn>
                    </>
                  )}
                  {r.status === "approved" && (
                    <Btn tone="purple" onClick={() => setSelectedReq(r)}>
                      🔗 Postback
                    </Btn>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>

      {selectedReq && (
        <Modal title={`Postback for ${selectedReq.network_name}`} onClose={() => setSelectedReq(null)}>
          <div className="space-y-3 text-xs">
            <p className="text-[var(--sa-muted)]">
              This postback URL must be pasted into the network dashboard. It uses the placeholders you defined.
            </p>
            <div>
              <span className="font-semibold text-[var(--sa-muted)] block mb-1 uppercase tracking-wider text-[10px]">
                Generated Postback URL
              </span>
              <div className="code-block relative rounded-md border border-[var(--sa-border)] bg-[var(--sa-input)] p-3 font-mono leading-relaxed break-all text-[var(--sa-text)]">
                {selectedReq.callback_url || "No callback URL generated."}
                <button
                  className="copy-btn absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white rounded px-2 py-0.5 text-[10px]"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedReq.callback_url || "");
                    toast.success("Postback URL copied to clipboard!");
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Btn tone="dark" onClick={() => setSelectedReq(null)}>
                Close
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {rejectReq && (
        <Modal title={`Reject Request: ${rejectReq.network_name}`} onClose={() => setRejectReq(null)}>
          <div className="space-y-4">
            <Field label="Rejection Reason/Note">
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Explain why this request is being rejected..."
                rows={3}
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Btn tone="dark" onClick={() => setRejectReq(null)}>
                Cancel
              </Btn>
              <Btn
                tone="red"
                disabled={review.isPending}
                onClick={() => review.mutate({ id: rejectReq.id, action: "reject", note: rejectNote })}
              >
                Reject Request
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
