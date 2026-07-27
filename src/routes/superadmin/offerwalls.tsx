import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/superadmin/CrudPage";
import { Badge } from "@/components/superadmin/kit";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/superadmin/offerwalls")({
  head: () => ({
    meta: [
      { title: "Manage Offerwalls · Super Admin · GlobalPrime" },
      { name: "description", content: "Add, edit, enable or disable offerwall providers network-wide." },
      { property: "og:title", content: "Manage Offerwalls · Super Admin" },
      { property: "og:description", content: "Offerwall providers, API keys, priorities and revenue share." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <CrudPage
      table="offerwalls"
      title="Offerwall Management"
      subtitle="providers"
      columns={[
        { key: "display_name", header: "Provider" },
        { key: "provider", header: "Key" },
        { key: "category", header: "Category" },
        { key: "priority", header: "Priority" },
        { key: "revenue_share", header: "Rev Share %" },
        { key: "revenue", header: "Revenue", render: (r) => `$${Number(r.revenue ?? 0).toFixed(2)}` },
        { key: "active", header: "Status", render: (r) => <Badge>{r.active ? "active" : "disabled"}</Badge> },
        { key: "last_postback_at", header: "Last Postback", render: (r) => fmtDate(r.last_postback_at) },
      ]}
      fields={[
        { name: "provider", label: "Provider Key", required: true, placeholder: "cpx_research" },
        { name: "display_name", label: "Display Name", required: true },
        { name: "category", label: "Category", placeholder: "offerwall / survey" },
        { name: "url_template", label: "URL Template", full: true, placeholder: "https://wall.provider.com?uid={user_id}" },
        { name: "iframe_url", label: "Iframe URL", full: true },
        { name: "api_url", label: "API URL", full: true },
        { name: "api_key", label: "API Key" },
        { name: "secret_key", label: "Secret Key" },
        { name: "logo_url", label: "Logo URL", full: true },
        { name: "priority", label: "Priority", type: "number", defaultValue: 0 },
        { name: "revenue_share", label: "Revenue Share %", type: "number", defaultValue: 0 },
        { name: "description", label: "Description", type: "textarea", full: true },
        { name: "active", label: "Active", type: "checkbox", defaultValue: true },
      ]}
    />
  ),
});
