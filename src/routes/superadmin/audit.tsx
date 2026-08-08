import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, DataTable, Badge, Loading, ErrorState, SectionTitle } from "@/components/superadmin/kit";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/superadmin/audit")({
  head: () => ({
    meta: [
      { title: "Audit Trail · Super Admin · PrimePath Services" },
      { name: "description", content: "Every privileged change made on the platform with before and after values." },
      { property: "og:title", content: "Audit Trail · Super Admin" },
      { property: "og:description", content: "Immutable record of privileged platform changes." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Audit,
});

function json(v: unknown) {
  if (v === null || v === undefined) return "-";
  const s = JSON.stringify(v);
  return s.length > 90 ? `${s.slice(0, 90)}…` : s;
}

function Audit() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["sa", "audit_logs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  return (
    <Card>
      <SectionTitle>Audit Trail</SectionTitle>
      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} />
      ) : (
        <DataTable
          rows={(data ?? []) as any[]}
          exportName="audit_logs"
          exportFormats={["csv", "xls", "pdf"]}
          pageSize={15}
          columns={[
            { key: "created_at", header: "Time", render: (r) => fmtDate(r.created_at) },
            { key: "actor_name", header: "Actor" },
            { key: "entity", header: "Entity" },
            { key: "action", header: "Action", render: (r) => <Badge>{r.action}</Badge> },
            { key: "old_value", header: "Before", value: (r) => json(r.old_value), render: (r) => json(r.old_value) },
            { key: "new_value", header: "After", value: (r) => json(r.new_value), render: (r) => json(r.new_value) },
            { key: "ip_address", header: "IP" },
          ]}
        />
      )}
    </Card>
  );
}
