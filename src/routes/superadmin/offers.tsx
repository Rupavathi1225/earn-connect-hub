import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/superadmin/CrudPage";
import { Badge } from "@/components/superadmin/kit";

export const Route = createFileRoute("/superadmin/offers")({
  head: () => ({
    meta: [
      { title: "Manage Offers · Super Admin · Global Prime" },
      { name: "description", content: "Create, edit and publish offers that appear in the user Daily Surveys section." },
      { property: "og:title", content: "Manage Offers · Super Admin" },
      { property: "og:description", content: "Offer IDs, payouts, tracking URLs, targeting and publishing controls." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OffersPage,
});

function OffersPage() {
  return (
    <CrudPage
      table="offers"
      title="Offers Management"
      subtitle="published to Daily Surveys"
      columns={[
        { key: "offer_id", header: "Offer ID" },
        { key: "title", header: "Title" },
        { key: "payout", header: "Payout", render: (r) => `${r.currency ?? "USD"} ${r.payout ?? 0}` },
        { key: "points", header: "Points" },
        { key: "category", header: "Category", render: (r) => r.category || "-" },
        {
          key: "countries",
          header: "Countries",
          render: (r) => (r.countries && r.countries.length > 0 ? r.countries.join(", ") : "All"),
        },
        {
          key: "active",
          header: "Status",
          render: (r) => <Badge>{r.active ? (r.is_public ? "live" : "active · hidden") : "inactive"}</Badge>,
        },
      ]}
      fields={[
        { name: "offer_id", label: "Offer ID (unique)", required: true, placeholder: `OFFER_${Date.now()}` },
        { name: "title", label: "Title", required: true, placeholder: "Offer title" },
        { name: "url", label: "URL", required: true, full: true, placeholder: "https://..." },
        { name: "tracking_url", label: "Tracking URL", full: true, placeholder: "https://tracking.example.com/..." },
        { name: "payout", label: "Payout", type: "number", defaultValue: 0 },
        {
          name: "currency",
          label: "Currency",
          type: "select",
          defaultValue: "USD",
          options: [
            { value: "USD", label: "USD" },
            { value: "INR", label: "INR" },
            { value: "EUR", label: "EUR" },
            { value: "GBP", label: "GBP" },
          ],
        },
        {
          name: "payout_model",
          label: "Payout Model",
          type: "select",
          defaultValue: "CPA",
          options: [
            { value: "CPA", label: "CPA" },
            { value: "CPI", label: "CPI" },
            { value: "CPL", label: "CPL" },
            { value: "CPS", label: "CPS" },
            { value: "RevShare", label: "RevShare" },
          ],
        },
        { name: "points", label: "Reward Points", type: "number", defaultValue: 0, required: true },
        { name: "user_variable", label: "User Variable", defaultValue: "aff_sub", placeholder: "aff_sub / aff_sub2" },
        { name: "countries", label: "Countries (comma separated)", placeholder: "US, UK, CA" },
        { name: "platform", label: "Platform", placeholder: "web, ios, android" },
        { name: "device", label: "Device", placeholder: "mobile, desktop" },
        { name: "category", label: "Category", defaultValue: "GENERAL" },
        { name: "expiry_date", label: "Expiry Date", type: "date" },
        { name: "percent", label: "Percent", type: "number", defaultValue: 0 },
        { name: "image_url", label: "Image URL", full: true, placeholder: "https://..." },
        { name: "traffic_sources", label: "Traffic Sources", full: true, placeholder: "Social, Email" },
        { name: "description", label: "Description", type: "textarea", full: true },
        { name: "active", label: "Active", type: "checkbox", defaultValue: true },
        { name: "is_public", label: "Public", type: "checkbox", defaultValue: true },
      ]}
      beforeSave={(values) => {
        const payload = { ...values };
        if (typeof payload.countries === "string") {
          payload.countries = payload.countries
            ? payload.countries.split(",").map((s: string) => s.trim()).filter(Boolean)
            : [];
        } else if (!payload.countries) {
          payload.countries = [];
        }
        payload.payout = Number(payload.payout ?? 0);
        payload.percent = Number(payload.percent ?? 0);
        payload.points = Number(payload.points ?? 0);
        payload.user_variable = payload.user_variable || "aff_sub";
        payload.active = Boolean(payload.active);
        payload.is_public = Boolean(payload.is_public);
        return payload;
      }}
    />
  );
}
