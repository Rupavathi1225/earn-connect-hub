import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/superadmin/CrudPage";
import { Badge } from "@/components/superadmin/kit";

export const Route = createFileRoute("/superadmin/surveys")({
  head: () => ({
    meta: [
      { title: "Manage Surveys · Super Admin · Global Prime" },
      { name: "description", content: "Add, edit, enable or disable survey providers network-wide." },
      { property: "og:title", content: "Manage Surveys · Super Admin" },
      { property: "og:description", content: "Survey providers, reward points, offer IDs and country targeting." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SurveysPage,
});

function SurveysPage() {
  return (
    <CrudPage
      table="surveys"
      title="Survey Management"
      subtitle="providers"
      columns={[
        { key: "network_name", header: "Network" },
        { key: "points", header: "Points" },
        { key: "offer_id", header: "Offer ID", render: (r) => r.offer_id || "-" },
        {
          key: "countries",
          header: "Countries",
          render: (r) => (r.countries && r.countries.length > 0 ? r.countries.join(", ") : "All"),
        },
        { key: "active", header: "Status", render: (r) => <Badge>{r.active ? "active" : "disabled"}</Badge> },
      ]}
      fields={[
        { name: "network_name", label: "Network Name", required: true },
        { name: "network_url", label: "Network URL", required: true, full: true, placeholder: "https://survey.provider.com?uid={user_id}" },
        { name: "points", label: "Points", type: "number", defaultValue: 100, required: true },
        { name: "user_variable", label: "User Variable", defaultValue: "aff_sub", required: true, placeholder: "aff_sub / aff_sub2" },
        { name: "banner_url", label: "Banner URL", full: true },
        { name: "offer_id", label: "Offer ID" },
        { name: "description", label: "Description", type: "textarea", full: true },
        { name: "countries", label: "Country Codes (comma separated)", full: true, placeholder: "US, CA, GB" },
        { name: "active", label: "Active", type: "checkbox", defaultValue: true },
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
        return payload;
      }}
    />
  );
}
