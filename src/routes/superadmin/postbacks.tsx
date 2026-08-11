import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  SectionTitle,
  Badge,
  Loading,
  ErrorState,
} from "@/components/superadmin/kit";
import { toast } from "sonner";

export const Route = createFileRoute("/superadmin/postbacks")({
  head: () => ({
    meta: [
      { title: "Offerwall Postbacks · Super Admin · Global Prime" },
      { name: "description", content: "Integration details, callback URLs and iframe codes." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OfferwallPostbacks,
});

function OfferwallPostbacks() {
  const { data: offerwalls, isLoading, error } = useQuery({
    queryKey: ["sa", "offerwalls-postbacks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offerwalls")
        .select("*")
        .order("display_name");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} />;

  const list = offerwalls ?? [];
  const origin = window.location.origin;

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>Offerwall Postback URLs</SectionTitle>
        <p className="text-xs text-[var(--sa-muted)]">
          Configure these callback URLs and iframe embed codes within each offerwall provider's admin panel to receive conversion completions.
        </p>
      </Card>

      {list.length === 0 && (
        <Card>
          <p className="text-xs text-[var(--sa-muted)] text-center py-4">No offerwalls configured yet.</p>
        </Card>
      )}

      {list.map((o) => {
        const postbackUrl = `${origin}/api/postback/${o.provider}`;
        const iframeEmbed = `<iframe src="${o.iframe_url || o.url_template || ""}" width="100%" height="600" frameborder="0"></iframe>`;

        return (
          <Card key={o.id}>
            <div className="flex items-center justify-between border-b border-[var(--sa-border)] pb-2 mb-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--sa-text)]">{o.display_name}</h3>
                <span className="text-[10px] text-[var(--sa-muted)] font-mono">Provider Key: {o.provider}</span>
              </div>
              <Badge tone={o.active ? "green" : "red"}>
                {o.active ? "active" : "disabled"}
              </Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-[var(--sa-muted)] block mb-1 uppercase tracking-wider text-[10px]">
                  Postback Callback URL (paste in {o.display_name} dashboard)
                </span>
                <div className="code-block relative rounded-md border border-[var(--sa-border)] bg-[var(--sa-input)] p-3 font-mono leading-relaxed break-all text-[var(--sa-text)]">
                  {postbackUrl}
                  <button
                    className="copy-btn absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white rounded px-2 py-0.5 text-[10px]"
                    onClick={() => {
                      navigator.clipboard.writeText(postbackUrl);
                      toast.success("Postback URL copied to clipboard!");
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>

              {(o.iframe_url || o.url_template) && (
                <div>
                  <span className="font-semibold text-[var(--sa-muted)] block mb-1 uppercase tracking-wider text-[10px]">
                    Iframe HTML Embed Code
                  </span>
                  <div className="code-block relative rounded-md border border-[var(--sa-border)] bg-[var(--sa-input)] p-3 font-mono leading-relaxed break-all text-[var(--sa-text)]">
                    {iframeEmbed}
                    <button
                      className="copy-btn absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white rounded px-2 py-0.5 text-[10px]"
                      onClick={() => {
                        navigator.clipboard.writeText(iframeEmbed);
                        toast.success("Iframe HTML code copied!");
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
