import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/superadmin/api-keys")({
  head: () => ({
    meta: [
      { title: "Manage API Keys · Super Admin · Global Prime" },
      { name: "description", content: "Create, rotate and revoke system access API keys." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ApiKeysPage,
});

function ApiKeysPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [env, setEnv] = useState("production");
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});

  const { data: keys, isLoading, error } = useQuery({
    queryKey: ["sa", "api_keys"],
    queryFn: async () => {
      const { data, error } = await supabase.from("api_keys").select("*").order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["sa", "api_keys"] });

  const create = useMutation({
    mutationFn: async () => {
      if (!name) throw new Error("Key Name is required");
      const prefix = env === "production" ? "gp_live_" : "gp_test_";
      const randomPart = Array.from({ length: 32 }, () =>
        Math.floor(Math.random() * 36).toString(36)
      ).join("");
      const keyValue = `${prefix}${randomPart}`;

      const { error } = await supabase.from("api_keys").insert({
        name,
        environment: env,
        key_value: keyValue,
        active: true,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("API Key generated successfully!");
      setName("");
      invalidate();
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  const toggleActive = useMutation({
    mutationFn: async (vars: { id: string; active: boolean }) => {
      const { error } = await supabase.from("api_keys").update({ active: vars.active }).eq("id", vars.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Key status updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const regenerate = useMutation({
    mutationFn: async (id: string) => {
      const target = keys?.find((k) => k.id === id);
      if (!target) throw new Error("Key not found");

      const prefix = target.environment === "production" ? "gp_live_" : "gp_test_";
      const randomPart = Array.from({ length: 32 }, () =>
        Math.floor(Math.random() * 36).toString(36)
      ).join("");
      const newValue = `${prefix}${randomPart}`;

      const { error } = await supabase.from("api_keys").update({ key_value: newValue }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Key rotated successfully!");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("api_keys").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Key deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="space-y-4">
      {/* Create form */}
      <Card>
        <SectionTitle>Generate API Key</SectionTitle>
        <p className="mb-4 text-xs text-[var(--sa-muted)]">
          Create credentials for external scripts, developers or staging servers to interact with the platform.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Key Name">
            <input
              type="text"
              placeholder="e.g. Production Webhook Partner"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Environment">
            <select value={env} onChange={(e) => setEnv(e.target.value)}>
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="sandbox">Sandbox</option>
            </select>
          </Field>
        </div>

        <div className="mt-4">
          <Btn tone="blue" disabled={create.isPending} onClick={() => create.mutate()}>
            {create.isPending ? "Generating..." : "🔑 Generate New Key"}
          </Btn>
        </div>
      </Card>

      {/* Keys list */}
      <Card>
        <DataTable
          rows={keys ?? []}
          exportName="api_keys"
          columns={[
            { key: "name", header: "Name" },
            {
              key: "key_value",
              header: "API Key",
              render: (r) => {
                const isRevealed = Boolean(revealedKeys[r.id]);
                const masked = r.key_value.substring(0, 8) + "•".repeat(24);
                return (
                  <span className="font-mono text-xs select-all text-yellow-400">
                    {isRevealed ? r.key_value : masked}
                  </span>
                );
              },
            },
            {
              key: "environment",
              header: "Env",
              render: (r) => (
                <Badge tone={r.environment === "production" ? "green" : "blue"}>
                  {r.environment}
                </Badge>
              ),
            },
            {
              key: "active",
              header: "Active",
              render: (r) => (
                <button
                  onClick={() => toggleActive.mutate({ id: r.id, active: !r.active })}
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded transition ${
                    r.active
                      ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      : "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  }`}
                >
                  {r.active ? "enabled" : "disabled"}
                </button>
              ),
            },
            { key: "last_used_at", header: "Last Used", render: (r) => fmtDate(r.last_used_at) },
            { key: "created_at", header: "Created", render: (r) => fmtDate(r.created_at) },
            {
              key: "__actions",
              header: "Actions",
              sortable: false,
              render: (r) => {
                const isRevealed = Boolean(revealedKeys[r.id]);
                return (
                  <div className="flex flex-wrap gap-1.5">
                    <Btn
                      tone="dark"
                      className="px-2 py-0.5 text-[10px]"
                      onClick={() =>
                        setRevealedKeys((s) => ({ ...s, [r.id]: !isRevealed }))
                      }
                    >
                      {isRevealed ? "Hide" : "Reveal"}
                    </Btn>
                    <ConfirmButton
                      message="Are you sure you want to rotate this API key? Old key will stop working immediately."
                      onConfirm={() => regenerate.mutate(r.id)}
                    >
                      🔄 Rotate
                    </ConfirmButton>
                    <ConfirmButton
                      message="Are you sure you want to delete this API key?"
                      onConfirm={() => remove.mutate(r.id)}
                    >
                      🗑 Delete
                    </ConfirmButton>
                  </div>
                );
              },
            },
          ]}
        />
      </Card>
    </div>
  );
}
