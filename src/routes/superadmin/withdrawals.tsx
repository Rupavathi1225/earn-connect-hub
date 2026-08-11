import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, DataTable, Badge, Loading, ErrorState, SectionTitle, Btn, StatCard } from "@/components/superadmin/kit";
import { setWithdrawalStatus } from "@/lib/superadmin.functions";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/superadmin/withdrawals")({
  head: () => ({
    meta: [
      { title: "Withdrawals · Super Admin · Global Prime" },
      { name: "description", content: "Approve, reject or mark paid every withdrawal request across all domains." },
      { property: "og:title", content: "Withdrawals · Super Admin" },
      { property: "og:description", content: "Network-wide payout queue management." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Withdrawals,
});

function Withdrawals() {
  const qc = useQueryClient();
  const setStatus = useServerFn(setWithdrawalStatus);

  const { data, isLoading, error } = useQuery({
    queryKey: ["sa", "withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw new Error(error.message);
      const ids = [...new Set((data ?? []).map((w) => w.user_id))];
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("id,name,email").in("id", ids)
        : { data: [] as any[] };
      const map = new Map((profiles ?? []).map((p) => [p.id, p]));
      return (data ?? []).map((w) => ({
        ...w,
        user_name: map.get(w.user_id)?.name ?? map.get(w.user_id)?.email?.split("@")[0] ?? "—",
        user_email: map.get(w.user_id)?.email ?? "—",
      }));
    },
  });

  const act = useMutation({
    mutationFn: (v: { id: string; status: "approved" | "rejected" | "paid" }) => setStatus({ data: v }),
    onSuccess: () => {
      toast.success("Withdrawal updated");
      qc.invalidateQueries({ queryKey: ["sa", "withdrawals"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = data ?? [];
  const pending = rows.filter((r) => r.status === "pending");
  const total = rows.reduce((s, r) => s + Number(r.amount ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total Requests" value={rows.length} />
        <StatCard label="Pending" value={pending.length} accent="var(--sa-yellow, #f59e0b)" />
        <StatCard label="Approved" value={rows.filter((r) => r.status === "approved").length} accent="#10b981" />
        <StatCard label="Total Volume" value={`$${total.toFixed(2)}`} />
      </div>

      <Card>
        <SectionTitle>Withdrawal Requests</SectionTitle>
        {isLoading ? (
          <Loading />
        ) : error ? (
          <ErrorState error={error} />
        ) : (
          <DataTable
            rows={rows as any[]}
            exportName="withdrawals"
            exportFormats={["csv", "xls", "pdf"]}
            columns={[
              { key: "user_name", header: "User" },
              { key: "user_email", header: "Email" },
              { key: "method_code", header: "Method" },
              { key: "amount", header: "Amount", render: (r) => `${r.currency === "INR" ? "₹" : "$"}${Number(r.amount).toFixed(2)}` },
              { key: "points_used", header: "Points" },
              { key: "status", header: "Status", render: (r) => <Badge>{r.status}</Badge> },
              { key: "created_at", header: "Requested", render: (r) => fmtDate(r.created_at) },
              {
                key: "__a",
                header: "Actions",
                sortable: false,
                render: (r) =>
                  r.status === "pending" ? (
                    <div className="flex gap-1.5">
                      <Btn tone="green" onClick={() => act.mutate({ id: r.id, status: "approved" })}>
                        Approve
                      </Btn>
                      <Btn tone="red" onClick={() => act.mutate({ id: r.id, status: "rejected" })}>
                        Reject
                      </Btn>
                    </div>
                  ) : (
                    <Btn tone="dark" onClick={() => act.mutate({ id: r.id, status: "paid" })}>
                      Mark Paid
                    </Btn>
                  ),
              },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
