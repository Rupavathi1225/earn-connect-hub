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
import {
  createAdminAccount,
  deleteAdminAccount,
  resetAdminPassword,
  setUserRoleFlags,
  listUserRoles,
} from "@/lib/superadmin.functions";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/superadmin/admins")({
  head: () => ({
    meta: [
      { title: "Manage Admins · Super Admin · GlobalPrime" },
      { name: "description", content: "Create admin logins, assign roles, reset passwords and revoke access." },
      { property: "og:title", content: "Manage Admins · Super Admin" },
      { property: "og:description", content: "Admin accounts, roles and revenue share." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admins,
});

function Admins() {
  const qc = useQueryClient();
  const createFn = useServerFn(createAdminAccount);
  const deleteFn = useServerFn(deleteAdminAccount);
  const resetFn = useServerFn(resetAdminPassword);
  const roleFn = useServerFn(setUserRoleFlags);
  const rolesFn = useServerFn(listUserRoles);

  const [open, setOpen] = useState(false);
  const [pwFor, setPwFor] = useState<any | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role_key: "admin", revenue_share: 0, notes: "" });
  const [pw, setPw] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["sa", "admins"],
    queryFn: async () => {
      const { data, error } = await supabase.from("admins").select("*").order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const { data: roles } = useQuery({ queryKey: ["sa", "user_roles"], queryFn: () => rolesFn({}) });
  const roleSet = new Set((roles ?? []).map((r) => `${r.user_id}:${r.role}`));

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["sa", "admins"] });
    qc.invalidateQueries({ queryKey: ["sa", "user_roles"] });
  };

  const create = useMutation({
    mutationFn: () => createFn({ data: { ...form, revenue_share: Number(form.revenue_share) } }),
    onSuccess: () => {
      toast.success("Admin created");
      setOpen(false);
      setForm({ name: "", email: "", password: "", role_key: "admin", revenue_share: 0, notes: "" });
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Admin removed");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reset = useMutation({
    mutationFn: () => resetFn({ data: { id: pwFor.id, password: pw } }),
    onSuccess: () => {
      toast.success("Password updated");
      setPwFor(null);
      setPw("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleSuper = useMutation({
    mutationFn: (v: { user_id: string; super_admin: boolean }) => roleFn({ data: v }),
    onSuccess: () => {
      toast.success("Role updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <SectionTitle right={<Btn onClick={() => setOpen(true)}>+ Create Admin</Btn>}>Admin Accounts</SectionTitle>

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} />
      ) : (
        <DataTable
          rows={(data ?? []) as any[]}
          exportName="admins"
          exportFormats={["csv", "xls", "pdf"]}
          columns={[
            { key: "name", header: "Name" },
            { key: "email", header: "Email" },
            { key: "role_key", header: "Role", render: (r) => <Badge tone="purple">{r.role_key}</Badge> },
            { key: "revenue_share", header: "Rev Share %" },
            {
              key: "super",
              header: "Super Admin",
              value: (r) => (r.user_id && roleSet.has(`${r.user_id}:super_admin`) ? "yes" : "no"),
              render: (r) => <Badge>{r.user_id && roleSet.has(`${r.user_id}:super_admin`) ? "yes" : "no"}</Badge>,
            },
            { key: "status", header: "Status", render: (r) => <Badge>{r.status ?? "active"}</Badge> },
            { key: "created_at", header: "Created", render: (r) => fmtDate(r.created_at) },
            {
              key: "__a",
              header: "Actions",
              sortable: false,
              render: (r) => {
                const isSuper = Boolean(r.user_id && roleSet.has(`${r.user_id}:super_admin`));
                return (
                  <div className="flex flex-wrap gap-1.5">
                    {r.user_id && (
                      <Btn
                        tone={isSuper ? "dark" : "purple"}
                        onClick={() => toggleSuper.mutate({ user_id: r.user_id, super_admin: !isSuper })}
                      >
                        {isSuper ? "Revoke Super" : "Make Super"}
                      </Btn>
                    )}
                    <Btn tone="dark" onClick={() => setPwFor(r)}>
                      Reset Password
                    </Btn>
                    <ConfirmButton message={`Remove ${r.email}? Their admin access is revoked.`} onConfirm={() => del.mutate(r.id)}>
                      Delete
                    </ConfirmButton>
                  </div>
                );
              },
            },
          ]}
        />
      )}

      {open && (
        <Modal title="Create Admin Account" onClose={() => setOpen(false)} wide>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Name">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Email">
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Password">
              <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Field>
            <Field label="Role">
              <select value={form.role_key} onChange={(e) => setForm({ ...form, role_key: e.target.value })}>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </Field>
            <Field label="Revenue Share %">
              <input
                type="number"
                value={form.revenue_share}
                onChange={(e) => setForm({ ...form, revenue_share: Number(e.target.value) })}
              />
            </Field>
            <Field label="Notes" className="md:col-span-2">
              <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Btn tone="dark" onClick={() => setOpen(false)}>
              Cancel
            </Btn>
            <Btn tone="green" disabled={create.isPending} onClick={() => create.mutate()}>
              {create.isPending ? "Creating…" : "Create"}
            </Btn>
          </div>
        </Modal>
      )}

      {pwFor && (
        <Modal title={`Reset password · ${pwFor.email}`} onClose={() => setPwFor(null)}>
          <Field label="New password (min 8 characters)">
            <input value={pw} onChange={(e) => setPw(e.target.value)} />
          </Field>
          <div className="mt-5 flex justify-end gap-2">
            <Btn tone="dark" onClick={() => setPwFor(null)}>
              Cancel
            </Btn>
            <Btn tone="green" disabled={reset.isPending} onClick={() => reset.mutate()}>
              Update
            </Btn>
          </div>
        </Modal>
      )}
    </Card>
  );
}
