import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WallLogo } from "@/components/WallLogo";
import { openWall, wallNotReady } from "@/lib/openWall";

export const Route = createFileRoute("/_authenticated/offerwalls")({
  head: () => ({ meta: [{ title: "Offer Walls — Global Prime" }, { name: "description", content: "Complete offers from top providers." }] }),
  component: OfferwallsPage,
});

type OW = { id: string; provider: string; display_name: string; url_template: string; logo_url: string | null; description: string | null };

function OfferwallsPage() {
  const { user } = Route.useRouteContext();
  const [items, setItems] = useState<OW[]>([]);

  useEffect(() => {
    supabase.from("offerwalls").select("id,provider,display_name,url_template,logo_url,description").eq("active", true).then(({ data }) => setItems((data ?? []) as OW[]));
  }, []);

  const ready = items.filter((o) => !wallNotReady(o));



  return (
    <div>
      <h1 className="text-lg font-bold text-[#1a1c3a] mb-3">🎯 Offer Walls</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.filter((o) => !notReady(o)).map((o) => (
          <div key={o.id} className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition">
            <div className="flex justify-center"><WallLogo name={o.display_name} logoUrl={o.logo_url} urlTemplate={o.url_template} provider={o.provider} className="w-16 h-16" /></div>
            <div className="mt-2 font-bold text-sm">{o.display_name}</div>
            {o.description && <div className="text-xs text-gray-500 line-clamp-2 mt-1">{o.description}</div>}
            <button onClick={() => open(o)} className="mt-3 w-full bg-[#5a3dba] hover:bg-[#4a2fa8] text-white text-xs font-semibold py-2 rounded">
              Open Wall
            </button>
          </div>
        ))}
      </div>
      {items.length > 0 && items.filter((o) => !notReady(o)).length === 0 && (
        <div className="bg-white rounded-lg p-6 text-center text-sm text-gray-500">No offer walls available right now. Please check back soon.</div>
      )}
    </div>
  );
}
