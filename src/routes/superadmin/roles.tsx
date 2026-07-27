import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, DataTable, Badge, Loading, ErrorState, SectionTitle, Btn, Modal, Field, ConfirmButton } from "@/components/superadmin/kit";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/superadmin/roles")({
  head: () => ({
    meta: [
      { title: "Roles & Permissions · Super Admin · GlobalPrime" },
      { name: "description", content: "Define roles and toggle granular module permissions for admin accounts." },
      { property: "og:title", content: "Roles & Permissions · Super Admin" },
      { property: "og:description", content: "Role definitions and permission matrix." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Roles,
});

function Roles() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ key: "", label: "", description: "" });
  const [matrixFor, setMatrixFor] = useState<any | null>(null);

  const roles = useQuery({
    queryKey: ["sa", "roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("roles").select("*").order("created_at");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const perms = useQuery({
    queryKey: ["sa", "permissions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("permissions").select("*").order("module");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const rolePerms = useQuery({
    queryKey: ["sa", "role_permissions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("role_permissions").select("*");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["sa", "roles"] });
    qc.invalidateQueries({ queryKey: ["sa", "role_permissions"] });
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("roles").insert(form);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Role created");
      setOpen(false);
      setForm({ key: "", label: "", description: "" });
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("roles").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Role deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (v: { role_id: string; permission_id: string; on: boolean }) => {
      if (v.on) {
        const { error } = await supabase.from("role_permissions").insert({ role_id: v.role_id, permission_id: v.permission_id });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from("role_permissions")
          .delete()
          .eq("role_id", v.role_id)
          .eq("permission_id", v.permission_id);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sa", "role_permissions"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const has = (roleId: string, permId: string) =>
    (rolePerms.data ?? []).some((rp: any) => rp.role_id === roleId && rp.permission_id === permId);

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle right={<Btn onClick={() => setOpen(true)}>+ New Role</Btn>}>Roles</SectionTitle>
        {roles.isLoading ? (
          <Loading />
        ) : roles.error ? (
          <ErrorState error={roles.error} />
        ) : (
          <DataTable
            rows={(roles.data ?? []) as any[]}
            exportName="roles"
            columns={[
              { key: "label", header: "Role" },
              { key: "key", header: "Key", render: (r: any) => <Badge tone="purple">{r.key}</Badge> },
              { key: "description", header: "Description" },
              {
                key: "perms",
                header: "Permissions",
                value: (r: any) => (rolePerms.data ?? []).filter((rp: any) => rp.role_id === r.id).length,
              },
              { key: "created_at", header: "Created", render: (r: any) => fmtDate(r.created_at) },
              {
                key: "__a",
                header: "Actions",
                sortable: false,
                render: (r: any) => (
                  <div className="flex gap-1.5">
                    <Btn onClick={() => setMatrixFor(r)}>Permissions</Btn>
                    <ConfirmButton message={`Delete role ${r.label}?`} onConfirm={() => remove.mutate(r.id)}>
                      Delete
                    </ConfirmButton>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Card>

      {open && (
        <Modal title="Create Role" onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <Field label="Key">
              <input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="finance_admin" />
            </Field>
            <Field label="Name">
              <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            </Field>
            <Field label="Description">
              <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Btn tone="dark" onClick={() => setOpen(false)}>
              Cancel
            </Btn>
            <Btn tone="green" onClick={() => create.mutate()}>
              Create
            </Btn>
          </div>
        </Modal>
      )}

      {matrixFor && (
        <Modal title={`Permissions · ${matrixFor.label}`} onClose={() => setMatrixFor(null)} wide>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {(perms.data ?? []).map((p: any) => {
              const on = has(matrixFor.id, p.id);
              return (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--sa-border)] px-3 py-2 text-[11px] text-[var(--sa-soft)]"
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggle.mutate({ role_id: matrixFor.id, permission_id: p.id, on: !on })}
                  />
                  <span className="font-semibold text-[var(--sa-text)]">{p.module}</span>
                  <span>· {p.action}</span>
                </label>
              );
            })}
            {(perms.data ?? []).length === 0 && (
              <p className="text-[11px] text-[var(--sa-muted)]">No permissions defined yet.</p>
            )}
          </div>
          <div className="mt-5 flex justify-end">
            <Btn tone="dark" onClick={() => setMatrixFor(null)}>
              Done
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
