import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  SectionTitle,
  Field,
  Btn,
  Loading,
} from "@/components/superadmin/kit";
import { toast } from "sonner";
import { saveGeneratedPostback } from "@/lib/superadmin.functions";

export const Route = createFileRoute("/superadmin/generate-postback")({
  head: () => ({
    meta: [
      { title: "Generate Postback URL · Super Admin · Global Prime" },
      { name: "description", content: "Manually build and parameterize postback callback URLs." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GeneratePostback,
});

function GeneratePostback() {
  const savePostbackFn = useServerFn(saveGeneratedPostback);
  const [form, setForm] = useState({
    adminId: "",
    networkName: "",
    offerId: "",
    userVar: "aff_sub2",
    payoutVar: "payout",
    txnVar: "trans_id",
    statusVar: "status",
  });

  const [generatedUrl, setGeneratedUrl] = useState("");

  const { data: admins, isLoading } = useQuery({
    queryKey: ["sa", "admins-dropdown"],
    queryFn: async () => {
      const { data, error } = await supabase.from("admins").select("id,name,email").order("name");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: (variables: {
      network_name: string;
      secret: string;
      url: string;
      admin_id?: string;
    }) => savePostbackFn({ data: variables }),
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save postback configuration to database");
    },
  });

  async function handleGenerate() {
    if (!form.networkName) {
      toast.error("Network Name is required");
      return;
    }
    const origin = window.location.origin;
    const randomSecret = Math.random().toString(36).substring(2, 15);
    const secret = `gp_sec_${randomSecret}`;
    const providerPath = form.networkName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    
    // Correct URL format: /api/public/postback/$provider
    const url = `${origin}/api/public/postback/${providerPath}?network=${encodeURIComponent(form.networkName)}&offer_id=${form.offerId || "{offer_id}"}&user_id={${form.userVar}}&payout={${form.payoutVar}}&status={${form.statusVar}}&trans_id={${form.txnVar}}&secret=${secret}`;

    try {
      await saveMutation.mutateAsync({
        network_name: form.networkName,
        secret,
        url,
        admin_id: form.adminId || undefined,
      });
      setGeneratedUrl(url);
      toast.success("Postback URL generated and saved!");
    } catch (e) {
      // Error toast shown by mutation onError handler
    }
  }

  if (isLoading) return <Loading />;

  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <SectionTitle>Generate Postback URL</SectionTitle>
        <p className="mb-4 text-xs text-[var(--sa-muted)]">
          Manually create postback callback URLs for networks. The generated URL handles crediting, security checking, and deduplication automatically.
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Select Admin Account">
              <select
                value={form.adminId}
                onChange={(e) => setForm({ ...form, adminId: e.target.value })}
              >
                <option value="">-- Optional: Select Admin --</option>
                {admins?.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.email})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Network Name">
              <input
                type="text"
                placeholder="e.g. Rewards Giant Shein"
                value={form.networkName}
                onChange={(e) => setForm({ ...form, networkName: e.target.value })}
              />
            </Field>

            <Field label="Offer ID">
              <input
                type="text"
                placeholder="e.g. 8473"
                value={form.offerId}
                onChange={(e) => setForm({ ...form, offerId: e.target.value })}
              />
            </Field>

            <Field label="User Variable Placeholder">
              <input
                type="text"
                value={form.userVar}
                onChange={(e) => setForm({ ...form, userVar: e.target.value })}
              />
            </Field>

            <Field label="Payout Variable Placeholder">
              <input
                type="text"
                value={form.payoutVar}
                onChange={(e) => setForm({ ...form, payoutVar: e.target.value })}
              />
            </Field>

            <Field label="Transaction ID Variable Placeholder">
              <input
                type="text"
                value={form.txnVar}
                onChange={(e) => setForm({ ...form, txnVar: e.target.value })}
              />
            </Field>

            <Field label="Status Variable Placeholder">
              <input
                type="text"
                value={form.statusVar}
                onChange={(e) => setForm({ ...form, statusVar: e.target.value })}
              />
            </Field>
          </div>

          <div className="pt-2">
            <Btn tone="blue" onClick={handleGenerate}>
              🔗 Generate Postback URL
            </Btn>
          </div>
        </div>
      </Card>

      {generatedUrl && (
        <Card>
          <div className="space-y-3 text-xs">
            <span className="font-semibold text-[var(--sa-muted)] block mb-1 uppercase tracking-wider text-[10px]">
              Generated Postback URL
            </span>
            <div className="code-block relative rounded-md border border-[var(--sa-border)] bg-[var(--sa-input)] p-3 font-mono leading-relaxed break-all text-[var(--sa-text)]">
              {generatedUrl}
              <button
                className="copy-btn absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white rounded px-2 py-0.5 text-[10px]"
                onClick={() => {
                  navigator.clipboard.writeText(generatedUrl);
                  toast.success("Postback URL copied to clipboard!");
                }}
              >
                Copy
              </button>
            </div>

            <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3 text-[11px] text-emerald-400 space-y-1.5">
              <span className="font-bold">Setup Instructions:</span>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Copy the generated postback URL above.</li>
                <li>Paste it in the network's postback/callback configuration settings.</li>
                <li>Replace the placeholders inside curly braces (e.g. `{form.userVar}`) with the network's corresponding placeholder macro variables.</li>
                <li>Submit a test conversion request to verify the setup.</li>
              </ol>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
