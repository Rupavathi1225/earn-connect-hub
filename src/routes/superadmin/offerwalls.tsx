import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CrudPage } from "@/components/superadmin/CrudPage";
import { Badge, Btn, Modal } from "@/components/superadmin/kit";
import { fmtDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/superadmin/offerwalls")({
  head: () => ({
    meta: [
      { title: "Manage Offerwalls · Super Admin · Global Prime" },
      { name: "description", content: "Add, edit, enable or disable offerwall providers network-wide." },
      { property: "og:title", content: "Manage Offerwalls · Super Admin" },
      { property: "og:description", content: "Offerwall providers, API keys, priorities and revenue share." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OfferwallsPage,
});

function OfferwallsPage() {
  const [selectedIframe, setSelectedIframe] = useState<any | null>(null);
  const [selectedPostback, setSelectedPostback] = useState<any | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="space-y-4">
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
        extraActions={(row) => (
          <>
            <Btn
              tone="purple"
              className="px-2 py-0.5 text-[10px]"
              onClick={() => setSelectedIframe(row)}
            >
              📄 Iframe
            </Btn>
            <Btn
              tone="blue"
              className="px-2 py-0.5 text-[10px]"
              onClick={() => setSelectedPostback(row)}
            >
              🔗 Postback
            </Btn>
          </>
        )}
      />

      {/* Selected Iframe Code Modal */}
      {selectedIframe && (
        <Modal
          title={`Iframe Code: ${selectedIframe.display_name}`}
          onClose={() => setSelectedIframe(null)}
        >
          <div className="space-y-4 text-xs">
            <p className="text-[var(--sa-muted)]">
              Embed this iframe inside your user offerwall pages. Be sure to dynamically replace the <code>{`{user_id}`}</code> macro variable with the authenticated user ID.
            </p>
            <div>
              <span className="font-semibold text-[var(--sa-muted)] block mb-1 uppercase tracking-wider text-[10px]">
                Iframe Embed Code
              </span>
              <div className="code-block relative rounded-md border border-[var(--sa-border)] bg-[var(--sa-input)] p-3 font-mono leading-relaxed break-all text-[var(--sa-text)]">
                {`<iframe src="${selectedIframe.iframe_url || selectedIframe.url_template || ""}" width="100%" height="600" frameborder="0"></iframe>`}
                <button
                  className="copy-btn absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white rounded px-2 py-0.5 text-[10px]"
                  onClick={() => {
                    const code = `<iframe src="${selectedIframe.iframe_url || selectedIframe.url_template || ""}" width="100%" height="600" frameborder="0"></iframe>`;
                    navigator.clipboard.writeText(code);
                    toast.success("Iframe code copied!");
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
            <div>
              <span className="font-semibold text-[var(--sa-muted)] block mb-1 uppercase tracking-wider text-[10px]">
                PHP Integration Snippet
              </span>
              <div className="code-block relative rounded-md border border-[var(--sa-border)] bg-[var(--sa-input)] p-3 font-mono leading-relaxed break-all text-[var(--sa-text)]">
                {`<?php
$user_id = $_SESSION['user_id'];
$url = "${selectedIframe.iframe_url || selectedIframe.url_template || ""}";
$url = str_replace('{user_id}', urlencode($user_id), $url);
?>
<iframe src="<?php echo htmlspecialchars($url); ?>" width="100%" height="600" frameborder="0"></iframe>`}
                <button
                  className="copy-btn absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white rounded px-2 py-0.5 text-[10px]"
                  onClick={() => {
                    const code = `<?php\n$user_id = $_SESSION['user_id'];\n$url = "${selectedIframe.iframe_url || selectedIframe.url_template || ""}";\n$url = str_replace('{user_id}', urlencode($user_id), $url);\n?>\n<iframe src="<?php echo htmlspecialchars($url); ?>" width="100%" height="600" frameborder="0"></iframe>`;
                    navigator.clipboard.writeText(code);
                    toast.success("PHP code copied!");
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Btn tone="dark" onClick={() => setSelectedIframe(null)}>
                Close
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Selected Postback Modal */}
      {selectedPostback && (
        <Modal
          title={`Postback Settings: ${selectedPostback.display_name}`}
          onClose={() => setSelectedPostback(null)}
        >
          <div className="space-y-4 text-xs">
            <p className="text-[var(--sa-muted)]">
              Use these values inside the {selectedPostback.display_name} dashboard callback settings.
            </p>
            <div>
              <span className="font-semibold text-[var(--sa-muted)] block mb-1 uppercase tracking-wider text-[10px]">
                Callback Postback URL
              </span>
              <div className="code-block relative rounded-md border border-[var(--sa-border)] bg-[var(--sa-input)] p-3 font-mono leading-relaxed break-all text-[var(--sa-text)]">
                {`${origin}/api/postback/${selectedPostback.provider}`}
                <button
                  className="copy-btn absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white rounded px-2 py-0.5 text-[10px]"
                  onClick={() => {
                    navigator.clipboard.writeText(`${origin}/api/postback/${selectedPostback.provider}`);
                    toast.success("Postback URL copied!");
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
            <div>
              <span className="font-semibold text-[var(--sa-muted)] block mb-1 uppercase tracking-wider text-[10px]">
                Secret Key
              </span>
              <div className="code-block relative rounded-md border border-[var(--sa-border)] bg-[var(--sa-input)] p-3 font-mono leading-relaxed break-all text-[var(--sa-text)]">
                {selectedPostback.secret_key || "No Secret Key set."}
                {selectedPostback.secret_key && (
                  <button
                    className="copy-btn absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white rounded px-2 py-0.5 text-[10px]"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedPostback.secret_key);
                      toast.success("Secret Key copied!");
                    }}
                  >
                    Copy
                  </button>
                )}
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Btn tone="dark" onClick={() => setSelectedPostback(null)}>
                Close
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
