import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Btn,
  Card,
  Column,
  ConfirmButton,
  DataTable,
  ErrorState,
  Field,
  Loading,
  Modal,
  SectionTitle,
} from "./kit";

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select" | "checkbox" | "date" | "datetime-local" | "url";
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  defaultValue?: unknown;
  full?: boolean;
};

type Row = Record<string, any>;

export function useTable(table: string, order = "created_at", ascending = false, select = "*") {
  return useQuery({
    queryKey: ["sa", table, order, select],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)(table)
        .select(select)
        .order(order, { ascending })
        .limit(1000);
      if (error) throw new Error(error.message);
      return (data ?? []) as Row[];
    },
  });
}

export function CrudPage({
  table,
  title,
  subtitle,
  columns,
  fields,
  order = "created_at",
  ascending = false,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  extraActions,
  beforeSave,
}: {
  table: string;
  title: string;
  subtitle?: string;
  columns: Column<Row>[];
  fields: FieldDef[];
  order?: string;
  ascending?: boolean;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  extraActions?: (row: Row) => React.ReactNode;
  beforeSave?: (values: Row) => Row;
}) {
  const qc = useQueryClient();
  const { data, isLoading, error } = useTable(table, order, ascending);
  const [editing, setEditing] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["sa", table] });

  const save = useMutation({
    mutationFn: async (values: Row) => {
      const payload = beforeSave ? beforeSave(values) : values;
      if (editing?.id) {
        const { error } = await (supabase.from as any)(table).update(payload).eq("id", editing.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await (supabase.from as any)(table).insert(payload);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success(editing?.id ? "Saved" : "Created");
      setOpen(false);
      setEditing(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from as any)(table).delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const allColumns: Column<Row>[] =
    canEdit || canDelete || extraActions
      ? [
          ...columns,
          {
            key: "__actions",
            header: "Actions",
            sortable: false,
            render: (row) => (
              <div className="flex flex-wrap gap-1.5">
                {extraActions?.(row)}
                {canEdit && (
                  <Btn
                    tone="dark"
                    onClick={() => {
                      setEditing(row);
                      setOpen(true);
                    }}
                  >
                    Edit
                  </Btn>
                )}
                {canDelete && (
                  <ConfirmButton message="This cannot be undone. Delete this record?" onConfirm={() => remove.mutate(row.id)}>
                    Delete
                  </ConfirmButton>
                )}
              </div>
            ),
          },
        ]
      : columns;

  return (
    <Card>
      <SectionTitle
        right={
          canCreate ? (
            <Btn
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              + Add New
            </Btn>
          ) : undefined
        }
      >
        {title}
        {subtitle ? <span className="ml-2 font-normal text-[var(--sa-muted)]">· {subtitle}</span> : null}
      </SectionTitle>

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} />
      ) : (
        <DataTable rows={data ?? []} columns={allColumns} exportName={table} exportFormats={["csv", "xls", "pdf"]} />
      )}

      {open && (
        <RecordForm
          title={editing?.id ? `Edit ${title}` : `New ${title}`}
          fields={fields}
          initial={editing ?? {}}
          busy={save.isPending}
          onClose={() => {
            setOpen(false);
            setEditing(null);
          }}
          onSubmit={(v) => save.mutate(v)}
        />
      )}
    </Card>
  );
}

export function RecordForm({
  title,
  fields,
  initial,
  onClose,
  onSubmit,
  busy,
}: {
  title: string;
  fields: FieldDef[];
  initial: Row;
  onClose: () => void;
  onSubmit: (values: Row) => void;
  busy?: boolean;
}) {
  const [values, setValues] = useState<Row>(() => {
    const v: Row = {};
    for (const f of fields) {
      let raw = initial[f.name];
      if (Array.isArray(raw)) {
        raw = raw.join(", ");
      }
      v[f.name] = raw ?? f.defaultValue ?? (f.type === "checkbox" ? false : "");
    }
    return v;
  });

  function set(name: string, value: unknown) {
    setValues((s) => ({ ...s, [name]: value }));
  }

  function submit() {
    const out: Row = {};
    for (const f of fields) {
      let v = values[f.name];
      if (f.required && (v === "" || v === null || v === undefined)) {
        toast.error(`${f.label} is required`);
        return;
      }
      if (f.type === "number") v = v === "" ? null : Number(v);
      if (v === "") v = null;
      out[f.name] = v;
    }
    onSubmit(out);
  }

  return (
    <Modal title={title} onClose={onClose} wide>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {fields.map((f) => (
          <Field key={f.name} label={f.label} className={f.full ? "md:col-span-2" : ""}>
            {f.type === "textarea" ? (
              <textarea
                rows={3}
                value={values[f.name] ?? ""}
                placeholder={f.placeholder}
                onChange={(e) => set(f.name, e.target.value)}
              />
            ) : f.type === "select" ? (
              <select value={values[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)}>
                <option value="">— select —</option>
                {(f.options ?? []).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : f.type === "checkbox" ? (
              <label className="flex items-center gap-2 text-[11px] text-[var(--sa-soft)]">
                <input
                  type="checkbox"
                  className="!w-auto"
                  checked={Boolean(values[f.name])}
                  onChange={(e) => set(f.name, e.target.checked)}
                />
                Enabled
              </label>
            ) : (
              <input
                type={f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "datetime-local" ? "datetime-local" : "text"}
                value={values[f.name] ?? ""}
                placeholder={f.placeholder}
                onChange={(e) => set(f.name, e.target.value)}
              />
            )}
          </Field>
        ))}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Btn tone="dark" onClick={onClose}>
          Cancel
        </Btn>
        <Btn tone="green" onClick={submit} disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </Btn>
      </div>
    </Modal>
  );
}
