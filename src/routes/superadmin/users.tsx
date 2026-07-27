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
  StatCard,
} from "@/components/superadmin/kit";
import { adjustUserBalance, setUserStatus, setUserRoleFlags, listUserRoles } from "@/lib/superadmin.functions";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/superadmin/users")({
  head: () => ({
    meta: [
      { title: "Users · Super Admin · GlobalPrime" },
      { name: "description", content: "Full member directory with balances, verification, bans and role control." },
      { property: "og:title", content: "Users · Super Admin" },
      { property: "og:description", content: "Global member directory and balance tools." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Users,
});

function Users() {
  const qc = useQueryClient();
  const adjustFn = useServerFn(adjustUserBalance);
  const statusFn = useServerFn(setUserStatus);
  const roleFn = useServerFn(setUserRoleFlags);
  const rolesFn = useServerFn(listUserRoles);

  const [adj, setAdj] = useState<any | null>(null);
  const [form, setForm] = useState({ cash_delta: 0, points_delta: 0, reason: "" });

  const { data, isLoading, error } = useQuery({
    queryKey: ["sa", "profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(1000);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const { data: roles } = useQuery({ queryKey: ["sa", "user_roles"], queryFn: () => rolesFn({}) });
  const roleSet = new Set((roles ?? []).map((r) => `${r.user_id}:${r.role}`));

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["sa", "profiles"] });
    qc.invalidateQueries({ queryKey: ["sa", "user_roles"] });
  };

  const adjust = useMutation({
    mutationFn: () =>
      adjustFn({
        data: {
          user_id: adj.id,
          cash_delta: Number(form.cash_delta),
          points_delta: Number(form.points_delta),
          reason: form.reason || "Manual adjustment",
        },
      }),
    onSuccess: () => {
      toast.success("Balance updated");
      setAdj(null);
      setForm({ cash_delta: 0, points_delta: 0, reason: "" });
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const status = useMutation({
    mutationFn: (v: { user_id: string; banned?: boolean; verified?: boolean }) => statusFn({ data: v }),
    onSuccess: () => {
      toast.success("User updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const role = useMutation({
    mutationFn: (v: { user_id: string; super_admin?: boolean; admin?: boolean }) => roleFn({ data: v }),
    onSuccess: () => {
      toast.success("Roles updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = data ?? [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total Users" value={rows.length} />
        <StatCard label="Verified" value={rows.filter((r: any) => r.verified).length} accent="#10b981" />
        <StatCard label="Banned" value={rows.filter((r: any) => r.banned).length} accent="#ef4444" />
        <StatCard
          label="Total Points"
          value={rows.reduce((s: number, r: any) => s + Number(r.points_balance ?? 0), 0).toLocaleString()}
        />
      </div>

      <Card>
        <SectionTitle>All Users</SectionTitle>
        {isLoading ? (
          <Loading />
        ) : error ? (
          <ErrorState error={error} />
        ) : (
          <DataTable
            rows={rows as any[]}
            exportName="users"
            exportFormats={["csv", "xls", "pdf"]}
            columns={[
              { key: "name", header: "Name" },
              { key: "email", header: "Email" },
              { key: "phone", header: "Phone" },
              { key: "country", header: "Country" },
              { key: "currency", header: "Currency" },
              { key: "points_balance", header: "Points" },
              { key: "cash_balance", header: "Cash", render: (r: any) => Number(r.cash_balance ?? 0).toFixed(2) },
              { key: "locked_balance", header: "Locked", render: (r: any) => Number(r.locked_balance ?? 0).toFixed(2) },
              {
                key: "verified",
                header: "Verified",
                value: (r: any) => (r.verified ? "yes" : "no"),
                render: (r: any) => <Badge>{r.verified ? "verified" : "pending"}</Badge>,
              },
              {
                key: "banned",
                header: "Status",
                value: (r: any) => (r.banned ? "banned" : "active"),
                render: (r: any) => <Badge>{r.banned ? "banned" : "active"}</Badge>,
              },
              {
                key: "role",
                header: "Role",
                value: (r: any) =>
                  roleSet.has(`${r.id}:super_admin`) ? "super_admin" : roleSet.has(`${r.id}:admin`) ? "admin" : "user",
                render: (r: any) => (
                  <Badge tone="purple">
                    {roleSet.has(`${r.id}:super_admin`) ? "super_admin" : roleSet.has(`${r.id}:admin`) ? "admin" : "user"}
                  </Badge>
                ),
              },
              { key: "created_at", header: "Joined", render: (r: any) => fmtDate(r.created_at) },
              {
                key: "__a",
                header: "Actions",
                sortable: false,
                render: (r: any) => (
                  <div className="flex flex-wrap gap-1.5">
                    <Btn onClick={() => setAdj(r)}>Balance</Btn>
                    <Btn tone={r.verified ? "dark" : "green"} onClick={() => status.mutate({ user_id: r.id, verified: !r.verified })}>
                      {r.verified ? "Unverify" : "Verify"}
                    </Btn>
                    <Btn tone={r.banned ? "dark" : "red"} onClick={() => status.mutate({ user_id: r.id, banned: !r.banned })}>
                      {r.banned ? "Unban" : "Ban"}
                    </Btn>
                    <Btn
                      tone="purple"
                      onClick={() =>
                        role.mutate({
                          user_id: r.id,
                          super_admin: !roleSet.has(`${r.id}:super_admin`),
                          admin: !roleSet.has(`${r.id}:super_admin`),
                        })
                      }
                    >
                      {roleSet.has(`${r.id}:super_admin`) ? "Revoke Super" : "Make Super"}
                    </Btn>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Card>

      {adj && (
        <Modal title={`Adjust balance · ${adj.name ?? adj.email}`} onClose={() => setAdj(null)}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cash delta">
              <input type="number" value={form.cash_delta} onChange={(e) => setForm({ ...form, cash_delta: Number(e.target.value) })} />
            </Field>
            <Field label="Points delta">
              <input type="number" value={form.points_delta} onChange={(e) => setForm({ ...form, points_delta: Number(e.target.value) })} />
            </Field>
            <Field label="Reason" className="col-span-2">
              <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </Field>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Btn tone="dark" onClick={() => setAdj(null)}>
              Cancel
            </Btn>
            <Btn tone="green" disabled={adjust.isPending} onClick={() => adjust.mutate()}>
              Apply
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
