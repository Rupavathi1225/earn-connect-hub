import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney, fmtPoints, fmtDate } from "@/lib/format";
import { RightSidebar } from "@/components/RightSidebar";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — GlobalPrime" }, { name: "description", content: "Your rewards dashboard." }] }),
  component: Dashboard,
});

type Profile = { name: string | null; email: string; cash_balance: number; points_balance: number; locked_balance: number; currency: "INR" | "USD"; referral_code: string; verified?: boolean };

function Dashboard() {
  const { user } = Route.useRouteContext();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [referralEarned, setReferralEarned] = useState(0);
  const [totalWithdraw, setTotalWithdraw] = useState(0);
  const [announcements, setAnnouncements] = useState<Array<{ id: string; title: string; body: string; created_at: string }>>([]);
  const [tab, setTab] = useState<"admin" | "news" | "verify">("admin");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: refs }, { data: w }, { data: ann }] = await Promise.all([
        supabase.from("profiles").select("name,email,cash_balance,points_balance,locked_balance,currency,referral_code,verified").eq("id", user.id).maybeSingle(),
        supabase.from("referrals").select("commission_points").eq("referrer_id", user.id),
        supabase.from("withdrawals").select("amount").eq("user_id", user.id).eq("status", "approved"),
        supabase.from("announcements").select("id,title,body,created_at").eq("active", true).order("created_at", { ascending: false }).limit(5),
      ]);
      if (p) setProfile(p as Profile);
      setReferralCount((refs ?? []).length);
      setReferralEarned((refs ?? []).reduce((a, r) => a + Number(r.commission_points || 0), 0));
      setTotalWithdraw((w ?? []).reduce((a, r) => a + Number(r.amount || 0), 0));
      setAnnouncements((ann ?? []) as any);
    })();
  }, [user.id]);

  if (!profile) return <div className="p-4 text-sm text-gray-500">Loading…</div>;
  const cur = profile.currency;
  const displayName = profile.name ?? profile.email.split("@")[0];
  const referralLink = `${typeof window !== "undefined" ? window.location.origin : ""}/auth?ref=${profile.referral_code}`;

  const quickTiles = [
    { to: "/surveys", label: "Daily Surveys", icon: "📋" },
    { to: "/referrals", label: "Refer a Friends", icon: "👥" },
    { to: "/withdraw", label: "Withdraw Cash", icon: "🏦" },
    { to: "/withdraw", label: "Convert Points", icon: "💱" },
  ] as const;

  const balCards = [
    { label: "Cash Balance", val: fmtMoney(Number(profile.cash_balance), cur), bg: "bg-[#1a8a7d]" },
    { label: "Points Balance", val: fmtPoints(profile.points_balance), bg: "bg-[#2563eb]" },
    { label: "Locked Balance", val: fmtPoints(Number(profile.locked_balance)), bg: "bg-[#1a1c3a]" },
    { label: "Referral Earning", val: fmtPoints(referralEarned), bg: "bg-[#1a1c3a]" },
  ];

  return (
    <div className="flex gap-4">
      <div className="flex-1 min-w-0 space-y-4">
        {/* Welcome header */}
        <div className="bg-gradient-to-r from-[#1a8a7d] to-[#0f6b60] text-white rounded-lg p-5 flex flex-col md:flex-row items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl shrink-0">👤</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm opacity-90">Welcome,</div>
            <div className="text-2xl font-extrabold truncate">{displayName}</div>
          </div>
          <div className="flex w-full md:w-auto gap-2">
            <input readOnly value={referralLink} className="flex-1 md:w-80 bg-white text-gray-700 text-xs px-3 py-2 rounded truncate" />
            <button
              onClick={() => { navigator.clipboard.writeText(referralLink); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              className="bg-[#1a1c3a] hover:bg-[#0f1128] text-white text-xs font-semibold px-4 py-2 rounded"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Small stat pills */}
        <div className="flex justify-center gap-3">
          <Link to="/tickets" className="bg-[#1a8a7d] text-white text-xs font-semibold px-4 py-2 rounded flex items-center gap-2">✉️ 0</Link>
          <Link to="/withdraw" className="bg-[#1a1c3a] text-white text-xs font-semibold px-4 py-2 rounded flex items-center gap-2">💳</Link>
          <Link to="/promocode" className="bg-[#1a8a7d] text-white text-xs font-semibold px-4 py-2 rounded flex items-center gap-2">🎁 {fmtPoints(profile.points_balance)}</Link>
        </div>

        {/* Quick tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickTiles.map((t) => (
            <Link key={t.label} to={t.to} className="bg-white rounded-lg py-6 text-center shadow-sm hover:shadow-md transition">
              <div className="text-3xl">{t.icon}</div>
              <div className="mt-2 font-bold text-sm text-[#1a1c3a]">{t.label}</div>
            </Link>
          ))}
        </div>

        {/* Balance cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {balCards.map((c) => (
            <div key={c.label} className={`${c.bg} text-white rounded-lg p-4`}>
              <div className="text-xs opacity-85">{c.label}</div>
              <div className="text-2xl font-extrabold mt-2">{c.val}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-[#1a8a7d] text-white rounded-lg p-4">
            <div className="text-xs opacity-85">Refral Added</div>
            <div className="text-2xl font-extrabold mt-2">{referralCount}</div>
          </div>
          <div className="bg-[#2563eb] text-white rounded-lg p-4">
            <div className="text-xs opacity-85">Total Withdraw</div>
            <div className="text-2xl font-extrabold mt-2">{fmtMoney(totalWithdraw, cur)}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg">
          <div className="flex border-b">
            {[
              { k: "admin", label: "💬 Message from Admin" },
              { k: "news", label: "📢 Announcement" },
              { k: "verify", label: "📋 Verify Account" },
            ].map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k as any)}
                className={`flex-1 py-3 text-sm font-semibold ${tab === t.k ? "text-[#1a8a7d] border-b-2 border-[#1a8a7d]" : "text-gray-500"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="p-5 text-sm text-gray-700">
            {tab === "admin" && (
              <>
                <div className="font-bold text-[#e8734a] mb-2">Dear User,</div>
                <p>Thanks for being a part of GlobalPrime Community. Kindly pay attention to mentioned points as they are important.</p>
                <ol className="list-decimal ml-5 mt-3 space-y-1 text-xs">
                  <li>Do not use fake information during taking.</li>
                  <li>Do not make multiple profiles. It will get you banned permanently.</li>
                  <li>Do not use VPN or proxy when using GlobalPrime. Doing so will get you banned permanently.</li>
                </ol>
              </>
            )}
            {tab === "news" && (
              <ul className="space-y-3">
                {announcements.length === 0 && <li className="text-xs text-gray-400">No announcements.</li>}
                {announcements.map((a) => (
                  <li key={a.id} className="border-l-4 border-[#e8734a] pl-3">
                    <div className="font-semibold">{a.title}</div>
                    <div className="text-xs text-gray-600">{a.body}</div>
                    <div className="text-[10px] text-gray-400">{fmtDate(a.created_at)}</div>
                  </li>
                ))}
              </ul>
            )}
            {tab === "verify" && (
              <>
                <div className="font-bold text-[#e8734a] mb-2">Dear User,</div>
                {profile.verified ? (
                  <p className="text-green-700">✓ Your account is verified.</p>
                ) : (
                  <>
                    <p>We have detected that your account is not verified yet. Account verification is necessary to use GlobalPrime as it helps us in providing our users quality surveys by filtering our cheaters/fake users.</p>
                    <p className="mt-2">Verifying your account is easy and it will take only few minutes. After verification you will be awarded with 10 bonus points.</p>
                    <Link to="/tickets" className="text-[#2563eb] underline mt-3 inline-block">Click here to verify your account.</Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Offerwalls preview */}
        <OfferwallsPreview />

        {/* Latest News banner */}
        <div className="bg-[#1a8a7d] text-white rounded-t-lg py-3 text-center text-lg font-bold">Latest News</div>
        <div className="bg-white rounded-b-lg p-5 -mt-4 pt-6">
          <h3 className="text-lg font-bold mb-3">Hello dear users, before you starting the survey follow these instructions:-</h3>
          <ol className="list-decimal ml-5 space-y-1 text-sm text-gray-700">
            <li>Please answer the open-ended question text correctly.</li>
            <li>Take the time given for the survey; do not rush through it.</li>
            <li>Read the question carefully before answering.</li>
            <li>Do not make multiple account. It will get you banned permanently.</li>
            <li>Do not use VPN or proxy when using Global prime.</li>
          </ol>
        </div>
      </div>

      <div className="hidden lg:block">
        <RightSidebar />
      </div>
    </div>
  );
}

function OfferwallsPreview() {
  const [items, setItems] = useState<Array<{ id: string; display_name: string; url_template: string }>>([]);
  useEffect(() => {
    supabase.from("offerwalls").select("id,display_name,url_template").eq("active", true).limit(16).then(({ data }) => setItems((data ?? []) as any));
  }, []);
  return (
    <div className="bg-[#1a1c3a] text-white rounded-lg p-4">
      <div className="font-bold text-lg mb-1">Offerwalls</div>
      <p className="text-xs text-white/70 mb-4">We only work with Trusted and Genuine Market Researchers. We Don't work with fake or obscure offerwalls.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((o) => (
          <a key={o.id} href={o.url_template} target="_blank" rel="noreferrer" className="bg-white text-[#1a1c3a] rounded-lg py-6 text-center font-bold text-sm hover:shadow-md transition">
            {o.display_name}
          </a>
        ))}
        {items.length === 0 && <div className="col-span-full text-xs text-white/50 text-center py-4">No offerwalls configured.</div>}
      </div>
    </div>
  );
}
