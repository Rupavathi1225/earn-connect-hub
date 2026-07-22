import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtPoints } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/surveys")({
  head: () => ({ meta: [{ title: "Daily Surveys — GlobalPrime" }, { name: "description", content: "Complete daily surveys and earn points." }] }),
  component: SurveysPage,
});

type Survey = { id: string; network_name: string; network_url: string; points: number; description: string | null; banner_url: string | null; user_variable: string; offer_id: string | null };

function SurveysPage() {
  const { user } = Route.useRouteContext();
  const [surveys, setSurveys] = useState<Survey[]>([]);

  useEffect(() => {
    supabase.from("surveys").select("id,network_name,network_url,points,description,banner_url,user_variable,offer_id").eq("active", true).then(({ data }) => {
      setSurveys((data ?? []) as Survey[]);
    });
  }, []);

  function openSurvey(s: Survey) {
    const sep = s.network_url.includes("?") ? "&" : "?";
    const url = `${s.network_url}${sep}${s.user_variable}=${user.id}${s.offer_id ? `&offer_id=${s.offer_id}` : ""}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div>
      <h1 className="text-lg font-bold text-[#1a1c3a] mb-3">📋 Daily Surveys</h1>
      {surveys.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center text-gray-400 text-sm">
          No surveys available right now. Check back soon!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {surveys.map((s) => (
            <div key={s.id} className="bg-white rounded-lg overflow-hidden shadow-sm">
              {s.banner_url && <img src={s.banner_url} alt={s.network_name} className="w-full h-32 object-cover" />}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm">{s.network_name}</h3>
                  <span className="text-xs font-bold text-[#e8734a]">+{fmtPoints(s.points)} pts</span>
                </div>
                {s.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.description}</p>}
                <button onClick={() => openSurvey(s)} className="mt-3 w-full bg-[#1a8a7d] hover:bg-[#157567] text-white text-xs font-semibold py-2 rounded">
                  Start Survey
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
