import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/superadmin/CrudPage";
import { Badge } from "@/components/superadmin/kit";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/superadmin/domains")({
  head: () => ({
    meta: [
      { title: "Domains · Super Admin · PrimePath Services" },
      { name: "description", content: "Manage every website and domain connected to the PrimePath Services network." },
      { property: "og:title", content: "Domains · Super Admin" },
      { property: "og:description", content: "Manage websites, SSL status, currency and themes." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <CrudPage
      table="domains"
      title="Domain Management"
      subtitle="multi-tenant websites"
      columns={[
        { key: "domain", header: "Domain" },
        { key: "ssl_status", header: "SSL", render: (r) => <Badge>{r.ssl_status ?? "pending"}</Badge> },
        { key: "currency", header: "Currency" },
        { key: "language", header: "Language" },
        { key: "theme", header: "Theme" },
        { key: "status", header: "Status", render: (r) => <Badge>{r.status ?? "active"}</Badge> },
        { key: "created_at", header: "Created", render: (r) => fmtDate(r.created_at) },
      ]}
      fields={[
        { name: "domain", label: "Domain", required: true, placeholder: "earn.example.com" },
        {
          name: "status",
          label: "Status",
          type: "select",
          defaultValue: "active",
          options: [
            { value: "active", label: "Active" },
            { value: "disabled", label: "Disabled" },
          ],
        },
        {
          name: "ssl_status",
          label: "SSL Status",
          type: "select",
          defaultValue: "pending",
          options: [
            { value: "active", label: "Active" },
            { value: "pending", label: "Pending" },
            { value: "failed", label: "Failed" },
          ],
        },
        {
          name: "currency",
          label: "Currency",
          type: "select",
          defaultValue: "USD",
          options: [
            { value: "USD", label: "USD" },
            { value: "INR", label: "INR" },
          ],
        },
        { name: "language", label: "Language", defaultValue: "en" },
        { name: "theme", label: "Theme", defaultValue: "default" },
        { name: "notes", label: "Notes", type: "textarea", full: true },
      ]}
    />
  ),
});
