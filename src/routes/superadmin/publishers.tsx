import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/superadmin/CrudPage";
import { Badge } from "@/components/superadmin/kit";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/superadmin/publishers")({
  head: () => ({
    meta: [
      { title: "Publishers · Super Admin · GlobalPrime" },
      { name: "description", content: "Manage publisher accounts, traffic and revenue across the network." },
      { property: "og:title", content: "Publishers · Super Admin" },
      { property: "og:description", content: "Publisher accounts, clicks, conversions and revenue." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <CrudPage
      table="publishers"
      title="Publisher Management"
      subtitle="traffic partners"
      columns={[
        { key: "name", header: "Publisher" },
        { key: "email", header: "Email" },
        { key: "website", header: "Website" },
        { key: "country", header: "Country" },
        { key: "total_clicks", header: "Clicks" },
        { key: "total_conversions", header: "Conversions" },
        { key: "revenue", header: "Revenue", render: (r) => `$${Number(r.revenue ?? 0).toFixed(2)}` },
        { key: "postback_status", header: "Postback", render: (r) => <Badge>{r.postback_status ?? "not_configured"}</Badge> },
        { key: "status", header: "Status", render: (r) => <Badge>{r.status ?? "active"}</Badge> },
        { key: "created_at", header: "Joined", render: (r) => fmtDate(r.created_at) },
      ]}
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", required: true },
        { name: "website", label: "Website" },
        { name: "country", label: "Country" },
        { name: "total_clicks", label: "Total Clicks", type: "number", defaultValue: 0 },
        { name: "total_conversions", label: "Total Conversions", type: "number", defaultValue: 0 },
        { name: "revenue", label: "Revenue ($)", type: "number", defaultValue: 0 },
        {
          name: "postback_status",
          label: "Postback Status",
          type: "select",
          defaultValue: "not_configured",
          options: [
            { value: "active", label: "Active" },
            { value: "pending", label: "Pending" },
            { value: "not_configured", label: "Not configured" },
          ],
        },
        {
          name: "iframe_status",
          label: "Iframe Status",
          type: "select",
          defaultValue: "not_configured",
          options: [
            { value: "active", label: "Active" },
            { value: "not_configured", label: "Not configured" },
          ],
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          defaultValue: "active",
          options: [
            { value: "active", label: "Active" },
            { value: "pending", label: "Pending" },
            { value: "suspended", label: "Suspended" },
          ],
        },
      ]}
    />
  ),
});
