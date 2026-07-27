import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/superadmin/CrudPage";
import { Badge } from "@/components/superadmin/kit";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/superadmin/cron")({
  head: () => ({
    meta: [
      { title: "Cron Monitor · Super Admin · GlobalPrime" },
      { name: "description", content: "Monitor scheduled jobs, their last run status and queue depth." },
      { property: "og:title", content: "Cron Monitor · Super Admin" },
      { property: "og:description", content: "Scheduled job health and queue depth." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <CrudPage
      table="cron_jobs"
      title="Cron Job Monitor"
      subtitle="scheduled tasks"
      columns={[
        { key: "name", header: "Job" },
        { key: "schedule", header: "Schedule" },
        { key: "last_run_at", header: "Last Run", render: (r) => fmtDate(r.last_run_at) },
        { key: "last_status", header: "Status", render: (r) => <Badge>{r.last_status ?? "idle"}</Badge> },
        { key: "last_duration_ms", header: "Duration", render: (r) => (r.last_duration_ms ? `${r.last_duration_ms} ms` : "-") },
        { key: "queued", header: "Queued" },
        { key: "enabled", header: "Enabled", render: (r) => <Badge>{r.enabled ? "enabled" : "disabled"}</Badge> },
        { key: "last_error", header: "Last Error" },
      ]}
      fields={[
        { name: "name", label: "Job Name", required: true },
        { name: "schedule", label: "Schedule (cron)", placeholder: "0 * * * *" },
        { name: "queued", label: "Queued", type: "number", defaultValue: 0 },
        { name: "enabled", label: "Enabled", type: "checkbox", defaultValue: true },
      ]}
    />
  ),
});
