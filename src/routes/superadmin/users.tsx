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
import { listProfiles, adjustUserBalance, lockUserPoints, setUserStatus, setUserRoleFlags, listUserRoles, createUserAccount } from "@/lib/superadmin.functions";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/superadmin/users")({
  head: () => ({
    meta: [
      { title: "Users · Super Admin · PrimePath Services" },
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
  const listProfilesFn = useServerFn(listProfiles);
  const adjustFn = useServerFn(adjustUserBalance);
  const lockFn = useServerFn(lockUserPoints);
  const statusFn = useServerFn(setUserStatus);
  const roleFn = useServerFn(setUserRoleFlags);
  const rolesFn = useServerFn(listUserRoles);
  const createUserFn = useServerFn(createUserAccount);

  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [modalAction, setModalAction] = useState<"adjust" | "lock" | null>(null);
  const [form, setForm] = useState({ cash_delta: 0, points_delta: 0, reason: "" });
  const [lockAmount, setLockAmount] = useState(0);
  const [lockReason, setLockReason] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "" });
  const selectedUserId =
    selectedUser?.id ?? selectedUser?.user_id ?? selectedUser?.profile_id ?? selectedUser?.email ?? "";

  const { data, isLoading, error } = useQuery({
    queryKey: ["sa", "profiles"],
    queryFn: () => listProfilesFn({}),
  });

  const { data: roles } = useQuery({ queryKey: ["sa", "user_roles"], queryFn: () => rolesFn({}) });
  const roleSet = new Set((roles ?? []).map((r) => `${r.user_id}:${r.role}`));

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["sa", "profiles"] });
    qc.invalidateQueries({ queryKey: ["sa", "user_roles"] });
  };

  const adjust = useMutation({
    mutationFn: () => {
      if (!selectedUserId) throw new Error("Selected user is missing an ID");
      return adjustFn({
        data: {
          user_id: selectedUserId,
          cash_delta: Number(form.cash_delta),
          points_delta: Number(form.points_delta),
          reason: form.reason || "Manual adjustment",
        },
      });
    },
    onSuccess: () => {
      toast.success("Balance updated");
      setSelectedUser(null);
      setModalAction(null);
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

  const lock = useMutation({
    mutationFn: () => {
      if (!selectedUserId) throw new Error("Selected user is missing an ID");
      return lockFn({
        data: {
          user_id: selectedUserId,
          points: Number(lockAmount),
          reason: lockReason || "Lock points",
        },
      });
    },
    onSuccess: () => {
      toast.success("Points locked");
      setSelectedUser(null);
      setModalAction(null);
      setLockAmount(0);
      setLockReason("");
      invalidate();
    },
    onError: (e: Error) => {
      toast.error(e.message);
      if (e.message === "Selected user is missing an ID") {
        setSelectedUser(null);
        setModalAction(null);
      }
    },
  });

  const role = useMutation({
    mutationFn: (v: { user_id: string; super_admin?: boolean; admin?: boolean }) => roleFn({ data: v }),
    onSuccess: () => {
      toast.success("Roles updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createUser = useMutation({
    mutationFn: () => createUserFn({ data: createForm }),
    onSuccess: () => {
      toast.success("User account created successfully!");
      setCreateOpen(false);
      setCreateForm({ name: "", email: "", password: "" });
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
        <SectionTitle right={<Btn onClick={() => setCreateOpen(true)}>+ Create User</Btn>}>All Users</SectionTitle>
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
              {
                key: "created_by",
                header: "Created By",
                value: (r: any) => {
                  if (!r.created_by) return "Self Sign Up";
                  const creator = rows.find((u: any) => u.id === r.created_by);
                  return creator ? `${creator.name || creator.email}` : "Admin";
                },
                render: (r: any) => {
                  if (!r.created_by) return <Badge tone="dark">Self Sign Up</Badge>;
                  const creator = rows.find((u: any) => u.id === r.created_by);
                  return (
                    <Badge tone="blue">
                      {creator ? `${creator.name || creator.email}` : "Admin"}
                    </Badge>
                  );
                },
              },
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
                    <Btn onClick={() => {
                      setSelectedUser(r);
                      setModalAction("adjust");
                      setForm({ cash_delta: 0, points_delta: 0, reason: "" });
                    }}>
                      Balance
                    </Btn>
                    <Btn tone="orange" onClick={() => {
                      setSelectedUser(r);
                      setModalAction("lock");
                      setLockAmount(0);
                      setLockReason("");
                    }}>
                      Lock Points
                    </Btn>
                    <Btn tone={r.verified ? "dark" : "green"} onClick={() => status.mutate({ user_id: r.id, verified: !r.verified })}>
                      {r.verified ? "Unverify" : "Verify"}
                    </Btn>
                    <Btn tone={r.banned ? "dark" : "red"} onClick={() => status.mutate({ user_id: r.id, banned: !r.banned })}>
                      {r.banned ? "Unban" : "Ban"}
                    </Btn>
                    <Btn
                      tone="blue"
                      disabled={role.isPending}
                      onClick={() =>
                        role.mutate({
                          user_id: r.id,
                          admin: !roleSet.has(`${r.id}:admin`),
                        })
                      }
                    >
                      {roleSet.has(`${r.id}:admin`) ? "Revoke Admin" : "Make Admin"}
                    </Btn>
                    <Btn
                      tone="purple"
                      disabled={role.isPending}
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

      {selectedUser && modalAction === "adjust" && (
        <Modal title={`Adjust balance · ${selectedUser.name ?? selectedUser.email}`} onClose={() => {
          setSelectedUser(null);
          setModalAction(null);
        }}>
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
            <Btn tone="dark" onClick={() => {
              setSelectedUser(null);
              setModalAction(null);
            }}>
              Cancel
            </Btn>
            <Btn tone="green" disabled={adjust.isPending} onClick={() => adjust.mutate()}>
              Apply
            </Btn>
          </div>
        </Modal>
      )}
      {selectedUser && modalAction === "lock" && (
        <Modal title={`Lock points · ${selectedUser.name ?? selectedUser.email}`} onClose={() => {
          setSelectedUser(null);
          setModalAction(null);
        }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 text-xs text-white/60">
              Available points: <span className="font-semibold text-white">{Number(selectedUser.points_balance ?? 0).toLocaleString()}</span>
            </div>
            <Field label="Points to lock" className="col-span-2">
              <input type="number" value={lockAmount} onChange={(e) => setLockAmount(Number(e.target.value))} />
            </Field>
            <Field label="Reason" className="col-span-2">
              <input value={lockReason} onChange={(e) => setLockReason(e.target.value)} placeholder="Visible to the user" />
            </Field>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Btn tone="dark" onClick={() => {
              setSelectedUser(null);
              setModalAction(null);
            }}>
              Cancel
            </Btn>
            <Btn tone="orange" disabled={lock.isPending} onClick={() => lock.mutate()}>
              Lock Points
            </Btn>
          </div>
        </Modal>
      )}

      {createOpen && (
        <Modal title="Create User Account" onClose={() => setCreateOpen(false)}>
          <div className="space-y-3">
            <Field label="Full Name">
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="John Doe"
              />
            </Field>
            <Field label="Email Address">
              <input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="john@example.com"
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="Min 8 characters"
              />
            </Field>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Btn tone="dark" onClick={() => setCreateOpen(false)}>
              Cancel
            </Btn>
            <Btn tone="green" disabled={createUser.isPending} onClick={() => createUser.mutate()}>
              Create Account
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
