import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RightSidebar } from "@/components/RightSidebar";

export const Route = createFileRoute("/_authenticated/surveys")({
  head: () => ({ meta: [{ title: "Daily Surveys — GlobalPrime" }, { name: "description", content: "Complete daily surveys and earn points." }] }),
  component: SurveysPage,
});

type Survey = { id: string; network_name: string; network_url: string; points: number; description: string | null; banner_url: string | null; user_variable: string; offer_id: string | null };

const gradients = [
  "from-emerald-100 to-emerald-200",
  "from-violet-100 to-violet-200",
  "from-rose-100 to-rose-200",
  "from-amber-100 to-amber-200",
  "from-sky-100 to-sky-200",
  "from-lime-100 to-lime-200",
];

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
    <div className="flex gap-4">
      <div className="flex-1 min-w-0 space-y-4">
        <div className="bg-[#1a8a7d] text-white rounded-lg py-3 text-center text-lg font-bold">Daily Surveys</div>
        {surveys.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center text-gray-400 text-sm">No surveys available right now. Check back soon!</div>
        ) : (
          <div className="space-y-4">
            {surveys.map((s, i) => (
              <button
                key={s.id}
                onClick={() => openSurvey(s)}
                className={`w-full bg-gradient-to-br ${gradients[i % gradients.length]} rounded-lg p-8 flex flex-col items-center gap-3 hover:shadow-md transition`}
              >
                {s.banner_url ? (
                  <img src={s.banner_url} alt={s.network_name} className="w-32 h-32 object-contain rounded bg-white/40 p-2" />
                ) : (
                  <div className="w-32 h-32 rounded bg-white/50 flex items-center justify-center text-[#e8734a] font-bold text-center px-2">
                    {s.network_name}
                  </div>
                )}
                <div className="font-extrabold text-xl text-[#1a1c3a]">{s.network_name}</div>
                <div className="text-sm text-gray-600">{s.description ?? "Complete Survey"}</div>
                <div className="bg-[#e8734a] text-white text-sm font-bold px-6 py-2 rounded">{s.points} points</div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="hidden lg:block">
        <RightSidebar />
      </div>
    </div>
  );
}
