import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, DataTable, Badge, Loading, ErrorState, SectionTitle } from "@/components/superadmin/kit";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/superadmin/logs")({
  head: () => ({
    meta: [
      { title: "System Logs · Super Admin · GlobalPrime" },
      { name: "description", content: "Browse platform system logs by level, category and actor." },
      { property: "og:title", content: "System Logs · Super Admin" },
      { property: "og:description", content: "Platform system log stream." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Logs,
});

function Logs() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["sa", "system_logs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("system_logs").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  return (
    <Card>
      <SectionTitle>System Logs</SectionTitle>
      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} />
      ) : (
        <DataTable
          rows={(data ?? []) as any[]}
          exportName="system_logs"
          exportFormats={["csv", "xls", "pdf"]}
          pageSize={15}
          columns={[
            { key: "created_at", header: "Time", render: (r) => fmtDate(r.created_at) },
            { key: "level", header: "Level", render: (r) => <Badge>{r.level}</Badge> },
            { key: "category", header: "Category" },
            { key: "action", header: "Action" },
            { key: "detail", header: "Detail" },
            { key: "actor_name", header: "Actor" },
            { key: "domain", header: "Domain" },
          ]}
        />
      )}
    </Card>
  );
}
