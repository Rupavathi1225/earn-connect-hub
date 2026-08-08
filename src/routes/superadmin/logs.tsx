import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card, DataTable, Badge, Loading, ErrorState, SectionTitle, Empty } from "@/components/superadmin/kit";
import { fmtDate } from "@/lib/format";
import { listSystemLogs } from "@/lib/superadmin.functions";

export const Route = createFileRoute("/superadmin/logs")({
  head: () => ({
    meta: [
      { title: "System Logs · Super Admin · PrimePath Services" },
      { name: "description", content: "Browse platform system logs by level, category and actor." },
      { property: "og:title", content: "System Logs · Super Admin" },
      { property: "og:description", content: "Platform system log stream." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Logs,
});

function Logs() {
  const logsFn = useServerFn(listSystemLogs);
  const { data, isLoading, error } = useQuery({
    queryKey: ["sa", "system_logs"],
    queryFn: () => logsFn({}),
  });

  return (
    <Card>
      <SectionTitle>System Logs</SectionTitle>
      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} />
      ) : (data?.length ? (
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
      ) : (
        <Empty>No system log entries found yet.</Empty>
      ))}
    </Card>
  );
}
