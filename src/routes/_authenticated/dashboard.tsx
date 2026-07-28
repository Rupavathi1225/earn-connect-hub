import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney, fmtPoints, fmtDate } from "@/lib/format";
import { RightSidebar } from "@/components/RightSidebar";
import { convertPointsToCash, convertCashToPoints } from "@/lib/rewards.functions";
import { StatusBadge } from "@/components/StatusBadge";

const dashboardSearchSchema = z.object({
  tab: z.enum([
    "dashboard",
    "balance",
    "cash_hist",
    "pts_hist",
    "withdraw_hist",
    "edit_account",
    "convert_pts"
  ]).optional()
});

export const Route = createFileRoute("/_authenticated/dashboard")({
  validateSearch: dashboardSearchSchema,
  head: () => ({ meta: [{ title: "Dashboard — GlobalPrime" }, { name: "description", content: "Your rewards dashboard." }] }),
  component: Dashboard,
});

type Profile = {
  name: string | null;
  email: string;
  cash_balance: number;
  points_balance: number;
  locked_balance: number;
  currency: "INR" | "USD";
  referral_code: string;
  verified?: boolean;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
};

type LedgerItem = {
  id: string;
  created_at: string;
  description: string;
  points: number;
  cash_delta: number;
  type: string;
};

type WithdrawalItem = {
  id: string;
  created_at: string;
  method_code: string;
  amount: number;
  currency: string;
  status: string;
  payment_details: any;
};

function Dashboard() {
  const { user } = Route.useRouteContext();
  const { tab } = Route.useSearch();
  const currentTab = tab ?? "dashboard";

  const [profile, setProfile] = useState<Profile | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [referralEarned, setReferralEarned] = useState(0);
  const [totalWithdraw, setTotalWithdraw] = useState(0);
  const [announcements, setAnnouncements] = useState<Array<{ id: string; title: string; body: string; created_at: string }>>([]);
  const [promocodes, setPromocodes] = useState<Array<{ id: string; code: string; points: number; expires_at: string | null; created_at: string }>>([]);
  const [contests, setContests] = useState<Array<{ id: string; name: string; description: string | null; prize: string; start_at: string; end_at: string; created_at: string }>>([]);
  const [surveys, setSurveys] = useState<Array<{ id: string; network_name: string; network_url: string; points: number; description: string | null; banner_url: string | null; user_variable: string; offer_id: string | null; created_at: string }>>([]);
  
  // Local ledger data states
  const [ledger, setLedger] = useState<LedgerItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);

  // Sub-tabs on main dashboard
  const [subTab, setSubTab] = useState<"admin" | "news" | "surveys" | "promocodes" | "contests" | "verify">("admin");
  const [copied, setCopied] = useState(false);

  // Edit Account Form States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  // Convert Points Form States
  const [convertPointsInput, setConvertPointsInput] = useState("100");
  const [convertCashInput, setConvertCashInput] = useState("1.00");
  const [convertMessage, setConvertMessage] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);

  const [lastRead, setLastRead] = useState<Record<string, string>>(() => {
    if (typeof window !== "undefined") {
      return {
        news: localStorage.getItem("last_read_news") || "1970-01-01T00:00:00.000Z",
        surveys: localStorage.getItem("last_read_surveys") || "1970-01-01T00:00:00.000Z",
        promocodes: localStorage.getItem("last_read_promocodes") || "1970-01-01T00:00:00.000Z",
        contests: localStorage.getItem("last_read_contests") || "1970-01-01T00:00:00.000Z",
      };
    }
    return {
      news: "1970-01-01T00:00:00.000Z",
      surveys: "1970-01-01T00:00:00.000Z",
      promocodes: "1970-01-01T00:00:00.000Z",
      contests: "1970-01-01T00:00:00.000Z",
    };
  });

  async function loadData() {
    const [
      { data: p },
      { data: refs },
      { data: w },
      { data: ann },
      { data: promos },
      { data: conts },
      { data: survs },
      { data: ledg },
      { data: withs }
    ] = await Promise.all([
      supabase.from("profiles").select("name,email,cash_balance,points_balance,locked_balance,currency,referral_code,verified,phone,city,state,country").eq("id", user.id).maybeSingle(),
      supabase.from("referrals").select("commission_points").eq("referrer_id", user.id),
      supabase.from("withdrawals").select("amount").eq("user_id", user.id).eq("status", "approved"),
      supabase.from("announcements").select("id,title,body,created_at").eq("active", true).order("created_at", { ascending: false }).limit(5),
      supabase.from("promocodes").select("id,code,points,expires_at,created_at").eq("active", true).order("created_at", { ascending: false }).limit(5),
      supabase.from("contests").select("id,name,description,prize,start_at,end_at,created_at").eq("active", true).order("created_at", { ascending: false }).limit(5),
      supabase.from("surveys").select("id,network_name,network_url,points,description,banner_url,user_variable,offer_id,created_at").eq("active", true).order("created_at", { ascending: false }).limit(5),
      supabase.from("points_ledger").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("withdrawals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    if (p) {
      setProfile(p as Profile);
      // Initialize edit fields
      const names = (p.name || "").trim().split(/\s+/);
      setFirstName(names[0] || "");
      setLastName(names.slice(1).join(" ") || "");
      setPhone(p.phone || "");
      setCity(p.city || "");
      setState(p.state || "");
      setCountry(p.country || "");
    }
    setReferralCount((refs ?? []).length);
    setReferralEarned((refs ?? []).reduce((a, r) => a + Number(r.commission_points || 0), 0));
    setTotalWithdraw((w ?? []).reduce((a, r) => a + Number(r.amount || 0), 0));
    setAnnouncements((ann ?? []) as any);
    setPromocodes((promos ?? []) as any);
    setContests((conts ?? []) as any);
    setSurveys((survs ?? []) as any);
    setLedger((ledg ?? []) as LedgerItem[]);
    setWithdrawals((withs ?? []) as WithdrawalItem[]);
  }

  useEffect(() => {
    loadData();
  }, [user.id]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const nowStr = new Date().toISOString();
      if (subTab === "news") {
        localStorage.setItem("last_read_news", nowStr);
        setLastRead((prev) => ({ ...prev, news: nowStr }));
      } else if (subTab === "surveys") {
        localStorage.setItem("last_read_surveys", nowStr);
        setLastRead((prev) => ({ ...prev, surveys: nowStr }));
      } else if (subTab === "promocodes") {
        localStorage.setItem("last_read_promocodes", nowStr);
        setLastRead((prev) => ({ ...prev, promocodes: nowStr }));
      } else if (subTab === "contests") {
        localStorage.setItem("last_read_contests", nowStr);
        setLastRead((prev) => ({ ...prev, contests: nowStr }));
      }
    }
  }, [subTab]);

  if (!profile) return <div className="p-4 text-sm text-gray-500">Loading…</div>;
  const cur = profile.currency;
  const displayName = profile.name ?? profile.email.split("@")[0];
  const referralLink = `${typeof window !== "undefined" ? window.location.origin : ""}/auth?ref=${profile.referral_code}`;

  function openSurvey(s: typeof surveys[0]) {
    const sep = s.network_url.includes("?") ? "&" : "?";
    const url = `${s.network_url}${sep}${s.user_variable}=${user.id}${s.offer_id ? `&offer_id=${s.offer_id}` : ""}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  // Handle saving profile changes
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const { error } = await supabase.from("profiles").update({
        name: fullName || null,
        phone: phone || null,
        city: city || null,
        state: state || null,
        country: country || null
      }).eq("id", user.id);
      if (error) throw error;
      setProfileMessage("✅ Profile updated successfully!");
      loadData();
    } catch (err: any) {
      setProfileMessage(`❌ Error: ${err.message}`);
    } finally {
      setSavingProfile(false);
    }
  }

  // Handle convert points to cash
  async function handleConvertPoints(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    const pts = parseInt(convertPointsInput, 10);
    if (isNaN(pts) || pts <= 0) {
      setConvertMessage("❌ Please enter a positive number of points");
      return;
    }
    if (pts > profile.points_balance) {
      setConvertMessage("❌ Insufficient points balance");
      return;
    }
    setConverting(true);
    setConvertMessage(null);
    try {
      const res = await convertPointsToCash({ data: { points: pts } });
      setConvertMessage(`✅ Converted ${pts} points to cash successfully!`);
      setConvertPointsInput("0");
      loadData();
    } catch (err: any) {
      setConvertMessage(`❌ Error: ${err.message}`);
    } finally {
      setConverting(false);
    }
  }

  // Handle convert cash to points
  async function handleConvertCash(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    const cashVal = parseFloat(convertCashInput);
    if (isNaN(cashVal) || cashVal <= 0) {
      setConvertMessage("❌ Please enter a positive amount of cash");
      return;
    }
    if (cashVal > profile.cash_balance) {
      setConvertMessage("❌ Insufficient cash balance");
      return;
    }
    setConverting(true);
    setConvertMessage(null);
    try {
      const res = await convertCashToPoints({ data: { cash: cashVal } });
      setConvertMessage(`✅ Converted cash to points successfully!`);
      setConvertCashInput("0.00");
      loadData();
    } catch (err: any) {
      setConvertMessage(`❌ Error: ${err.message}`);
    } finally {
      setConverting(false);
    }
  }

  const quickTiles = [
    { to: "/surveys", label: "Daily Surveys", icon: "📋" },
    { to: "/referrals", label: "Refer a Friends", icon: "👥" },
    { to: "/withdraw", label: "Withdraw Cash", icon: "🏦" },
    { to: "/dashboard", search: { tab: "convert_pts" }, label: "Convert Points", icon: "💱" },
  ] as const;

  const balCards = [
    { label: "Cash Balance", val: fmtMoney(Number(profile.cash_balance), cur), bg: "bg-[#1a8a7d]" },
    { label: "Points Balance", val: fmtPoints(profile.points_balance), bg: "bg-[#2563eb]" },
    { label: "Locked Balance", val: fmtPoints(Number(profile.locked_balance)), bg: "bg-[#1a1c3a]" },
    { label: "Referral Earning", val: fmtPoints(referralEarned), bg: "bg-[#1a1c3a]" },
  ];

  const COUNTRIES = ["India","United States","United Kingdom","Canada","Australia","Germany","France","Spain","Italy","Netherlands","Brazil","Mexico","Argentina","United Arab Emirates","Saudi Arabia","Singapore","Malaysia","Indonesia","Philippines","Vietnam","Thailand","Japan","South Korea","China","Hong Kong","Taiwan","Pakistan","Bangladesh","Sri Lanka","Nepal","Turkey","South Africa","Nigeria","Kenya","Egypt","Russia","Ukraine","Poland","Sweden","Norway","Denmark","Finland","Ireland","Portugal","Greece","Switzerland","Belgium","Austria","New Zealand","Other"];

  // Welcome Banner (common header for dashboard and inner tabs)
  const renderWelcomeBanner = () => (
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
          className="bg-[#1a1c3a] hover:bg-[#0f1128] text-white text-xs font-semibold px-4 py-2 rounded transition"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex gap-4">
      <div className="flex-1 min-w-0 space-y-4">
        {renderWelcomeBanner()}

        {currentTab === "dashboard" && (
          <>
            {/* Small stat pills */}
            <div className="flex justify-center gap-3">
              <Link to="/tickets" className="bg-[#1a8a7d] text-white text-xs font-semibold px-4 py-2 rounded flex items-center gap-2">✉️ 0</Link>
              <Link to="/withdraw" className="bg-[#1a1c3a] text-white text-xs font-semibold px-4 py-2 rounded flex items-center gap-2">💳</Link>
              <Link to="/promocode" className="bg-[#1a8a7d] text-white text-xs font-semibold px-4 py-2 rounded flex items-center gap-2">🎁 {fmtPoints(profile.points_balance)}</Link>
            </div>

            {/* Quick tiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickTiles.map((t) => (
                <Link key={t.label} to={t.to} search={(t as any).search} className="bg-white rounded-lg py-6 text-center shadow-sm hover:shadow-md transition">
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

            {/* Main Tabs */}
            <div className="bg-white rounded-lg">
              <div className="flex border-b overflow-x-auto whitespace-nowrap scrollbar-none">
                {[
                  { k: "admin", label: "💬 Message from Admin", badge: 0 },
                  { k: "news", label: "📢 Announcement", badge: announcements.filter((a) => new Date(a.created_at) > new Date(lastRead.news)).length },
                  { k: "surveys", label: "📋 Daily Surveys", badge: surveys.filter((s) => !s.created_at || new Date(s.created_at) > new Date(lastRead.surveys)).length },
                  { k: "promocodes", label: "🎁 Promo Codes", badge: promocodes.filter((p) => !p.created_at || new Date(p.created_at) > new Date(lastRead.promocodes)).length },
                  { k: "contests", label: "🏆 Contests", badge: contests.filter((c) => !c.created_at || new Date(c.created_at) > new Date(lastRead.contests)).length },
                  { k: "verify", label: "📋 Verify Account", badge: profile.verified ? 0 : 1 },
                ].map((t) => (
                  <button
                    key={t.k}
                    onClick={() => setSubTab(t.k as any)}
                    className={`flex-1 py-3 px-4 text-sm font-semibold shrink-0 inline-flex items-center justify-center gap-1.5 ${subTab === t.k ? "text-[#1a8a7d] border-b-2 border-[#1a8a7d]" : "text-gray-500"}`}
                  >
                    <span>{t.label}</span>
                    {t.badge > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] inline-flex items-center justify-center animate-pulse shadow-sm">
                        {t.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="p-5 text-sm text-gray-700">
                {subTab === "admin" && (
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
                {subTab === "news" && (
                  <ul className="space-y-3">
                    {announcements.length === 0 && <li className="text-xs text-gray-400">No announcements.</li>}
                    {announcements.map((a) => (
                      <li key={a.id} className="border-l-4 border-[#e8734a] pl-3">
                        <div className="font-semibold text-gray-900">{a.title}</div>
                        <div className="text-xs text-gray-600 mt-0.5">{a.body}</div>
                        <div className="text-[10px] text-gray-400 mt-1">{fmtDate(a.created_at)}</div>
                      </li>
                    ))}
                  </ul>
                )}
                {subTab === "surveys" && (
                  <div className="space-y-3">
                    <div className="font-bold text-[#e8734a] mb-2">Available Daily Surveys</div>
                    {surveys.length === 0 && <p className="text-xs text-gray-400">No surveys available right now.</p>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {surveys.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => openSurvey(s)}
                          className="border border-gray-100 rounded-lg p-3 bg-gray-50 flex items-center justify-between text-left hover:border-[#1a8a7d]/30 transition w-full"
                        >
                          <div className="flex items-center gap-3">
                            {s.banner_url ? (
                              <img src={s.banner_url} alt={s.network_name} className="w-10 h-10 object-contain rounded bg-white p-1 border" />
                            ) : (
                              <div className="w-10 h-10 rounded bg-[#1a8a7d]/10 flex items-center justify-center text-[#1a8a7d] font-bold text-xs shrink-0">
                                {s.network_name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-gray-900 text-sm">{s.network_name}</div>
                              <div className="text-xs text-gray-500 line-clamp-1">{s.description ?? "Complete survey and earn points"}</div>
                            </div>
                          </div>
                          <div className="bg-[#e8734a] text-white text-xs font-bold px-3 py-1.5 rounded shrink-0">
                            +{s.points} P
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {subTab === "promocodes" && (
                  <div className="space-y-3">
                    <div className="font-bold text-[#e8734a] mb-2">Active Promo Codes</div>
                    {promocodes.length === 0 && <p className="text-xs text-gray-400">No active promo codes available right now.</p>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {promocodes.map((pc) => (
                        <div key={pc.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-[#1a8a7d] text-sm font-mono select-all bg-[#1a8a7d]/10 px-2 py-0.5 rounded inline-block">{pc.code}</div>
                            <div className="text-xs text-gray-500 mt-1.5">Value: {fmtPoints(Number(pc.points))}</div>
                            {pc.expires_at && <div className="text-[10px] text-gray-400 mt-0.5">Expires: {fmtDate(pc.expires_at)}</div>}
                          </div>
                          <Link to="/promocode" className="bg-[#e8734a] hover:bg-[#d05c36] text-white text-xs font-semibold px-3 py-1.5 rounded transition">
                            Redeem
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {subTab === "contests" && (
                  <div className="space-y-3">
                    <div className="font-bold text-[#e8734a] mb-2">Active Contests</div>
                    {contests.length === 0 && <p className="text-xs text-gray-400">No active contests available right now.</p>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {contests.map((c) => (
                        <div key={c.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50 space-y-1">
                          <div className="font-bold text-[#1a1c3a] text-sm">{c.name}</div>
                          {c.description && <div className="text-xs text-gray-600">{c.description}</div>}
                          <div className="text-xs text-gray-500 font-semibold mt-1">Prize: <span className="text-[#1a8a7d]">{c.prize}</span></div>
                          <div className="text-[10px] text-gray-400 mt-1">Ends: {fmtDate(c.end_at)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {subTab === "verify" && (
                  <>
                    <div className="font-bold text-[#e8734a] mb-2">Dear User,</div>
                    {profile.verified ? (
                      <p className="text-green-700 font-semibold flex items-center gap-1">✓ Your account is verified.</p>
                    ) : (
                      <>
                        <p>We have detected that your account is not verified yet. Account verification is necessary to use GlobalPrime as it helps us in providing our users quality surveys by filtering our cheaters/fake users.</p>
                        <p className="mt-2">Verifying your account is easy and it will take only few minutes. After verification you will be awarded with 10 bonus points.</p>
                        <Link to="/tickets" className="text-[#2563eb] underline font-bold mt-3 inline-block">Click here to verify your account.</Link>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Offerwalls preview */}
            <OfferwallsPreview />

            {/* Latest News instructions */}
            <div className="bg-[#1a8a7d] text-white rounded-t-lg py-3 text-center text-lg font-bold">Latest News</div>
            <div className="bg-white rounded-b-lg p-5 -mt-4 pt-6">
              <h3 className="text-lg font-bold mb-3 text-gray-800">Hello dear users, before you starting the survey follow these instructions:-</h3>
              <ol className="list-decimal ml-5 space-y-1.5 text-sm text-gray-700">
                <li>Please answer the open-ended question text correctly.</li>
                <li>Take the time given for the survey; do not rush through it.</li>
                <li>Read the question carefully before answering.</li>
                <li>Do not make multiple accounts. It will get you banned permanently.</li>
                <li>Do not use VPN or proxy when using Global prime.</li>
              </ol>
            </div>
          </>
        )}

        {currentTab === "balance" && (
          <div className="space-y-4">
            <div className="bg-[#1a8a7d] text-white rounded-t-lg py-3.5 px-5 text-center font-bold text-base">Account Balance</div>
            <div className="bg-white rounded-b-lg p-0 overflow-hidden shadow-sm border border-gray-100">
              <table className="w-full text-sm">
                <thead className="bg-[#1a1c3a] text-white">
                  <tr>
                    <th className="p-3 text-left font-semibold text-xs">Balance Type</th>
                    <th className="p-3 text-left font-semibold text-xs">Amount</th>
                    <th className="p-3 text-center font-semibold text-xs">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="p-4 font-medium text-gray-700">Cash Balance</td>
                    <td className="p-4 font-bold text-gray-900">{fmtMoney(Number(profile.cash_balance), cur)}</td>
                    <td className="p-4 text-center">
                      <Link to="/dashboard" search={{ tab: "cash_hist" }} className="bg-[#1a8a7d] hover:bg-[#146e63] text-white text-xs font-semibold px-4 py-1.5 rounded transition">
                        View History
                      </Link>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-gray-700">Points Balance</td>
                    <td className="p-4 font-bold text-gray-900">{fmtPoints(profile.points_balance)}</td>
                    <td className="p-4 text-center">
                      <Link to="/dashboard" search={{ tab: "pts_hist" }} className="bg-[#1a8a7d] hover:bg-[#146e63] text-white text-xs font-semibold px-4 py-1.5 rounded transition">
                        View History
                      </Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentTab === "cash_hist" && (
          <div className="space-y-4">
            <div className="bg-[#1a8a7d] text-white rounded-t-lg py-3.5 px-5 text-center font-bold text-base">Cash History</div>
            <div className="bg-white rounded-b-lg p-5 shadow-sm border border-gray-100 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-[#1a1c3a] text-white">
                    <tr>
                      <th className="p-2.5 text-left font-semibold">Sr. No.</th>
                      <th className="p-2.5 text-left font-semibold">Date & Time</th>
                      <th className="p-2.5 text-left font-semibold">Description</th>
                      <th className="p-2.5 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ledger.filter(item => item.cash_delta !== 0).map((item, idx) => (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="p-2.5 text-gray-600 font-medium">{idx + 1}</td>
                        <td className="p-2.5 text-gray-700">{fmtDate(item.created_at)}</td>
                        <td className="p-2.5 text-gray-700">{item.description}</td>
                        <td className={`p-2.5 text-right font-bold ${item.cash_delta >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {item.cash_delta >= 0 ? "+" : ""}{fmtMoney(item.cash_delta, cur)}
                        </td>
                      </tr>
                    ))}
                    {ledger.filter(item => item.cash_delta !== 0).length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-400 italic">No cash history found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {currentTab === "pts_hist" && (
          <div className="space-y-4">
            <div className="bg-[#1a8a7d] text-white rounded-t-lg py-3.5 px-5 text-center font-bold text-base">Points History</div>
            <div className="bg-white rounded-b-lg p-5 shadow-sm border border-gray-100 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-[#1a1c3a] text-white">
                    <tr>
                      <th className="p-2.5 text-left font-semibold">Sr. No.</th>
                      <th className="p-2.5 text-left font-semibold">Date & Time</th>
                      <th className="p-2.5 text-left font-semibold">Description</th>
                      <th className="p-2.5 text-right font-semibold">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ledger.filter(item => item.points !== 0).map((item, idx) => (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="p-2.5 text-gray-600 font-medium">{idx + 1}</td>
                        <td className="p-2.5 text-gray-700">{fmtDate(item.created_at)}</td>
                        <td className="p-2.5 text-gray-700">{item.description}</td>
                        <td className={`p-2.5 text-right font-bold ${item.points >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {item.points >= 0 ? "+" : ""}{fmtPoints(item.points)}
                        </td>
                      </tr>
                    ))}
                    {ledger.filter(item => item.points !== 0).length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-400 italic">No points history found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {currentTab === "withdraw_hist" && (
          <div className="space-y-4">
            <div className="bg-[#1a8a7d] text-white rounded-t-lg py-3.5 px-5 text-center font-bold text-base">Withdraw History</div>
            <div className="bg-white rounded-b-lg p-5 shadow-sm border border-gray-100 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-[#1a1c3a] text-white">
                    <tr>
                      <th className="p-2.5 text-left font-semibold">Sr. No.</th>
                      <th className="p-2.5 text-left font-semibold">Date & Time</th>
                      <th className="p-2.5 text-left font-semibold">Method</th>
                      <th className="p-2.5 text-right font-semibold">Cash Amount</th>
                      <th className="p-2.5 text-center font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {withdrawals.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="p-2.5 text-gray-600 font-medium">{idx + 1}</td>
                        <td className="p-2.5 text-gray-700">{fmtDate(item.created_at)}</td>
                        <td className="p-2.5 text-gray-700 uppercase font-semibold">{item.method_code}</td>
                        <td className="p-2.5 text-right font-bold text-gray-900">{fmtMoney(item.amount, item.currency as any)}</td>
                        <td className="p-2.5 text-center">
                          <StatusBadge s={item.status} />
                        </td>
                      </tr>
                    ))}
                    {withdrawals.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-400 italic">No withdrawal requests found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {currentTab === "edit_account" && (
          <div className="space-y-4">
            <div className="bg-[#1a8a7d] text-white rounded-t-lg py-3.5 px-5 text-center font-bold text-base">Edit Account</div>
            <div className="bg-white rounded-b-lg p-6 shadow-sm border border-gray-100">
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">First Name</label>
                    <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name</label>
                    <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Username / Email</label>
                    <input type="text" disabled value={profile.email} className="w-full border rounded-md px-3 py-2 text-sm bg-gray-100 text-gray-500 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Mobile Number</label>
                    <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">City</label>
                    <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">State</label>
                    <input type="text" value={state} onChange={(e) => setState(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Country</label>
                    <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                      <option value="">Select Country</option>
                      {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {profileMessage && <div className="text-xs font-bold">{profileMessage}</div>}

                <div className="pt-2">
                  <button type="submit" disabled={savingProfile} className="bg-[#1a8a7d] hover:bg-[#146e63] disabled:opacity-60 text-white font-bold py-2.5 px-6 rounded text-xs transition">
                    {savingProfile ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {currentTab === "convert_pts" && (
          <div className="space-y-4">
            <div className="bg-[#1a8a7d] text-white rounded-t-lg py-3.5 px-5 text-center font-bold text-base">Convert Points</div>
            <div className="bg-white rounded-b-lg p-6 shadow-sm border border-gray-100 space-y-6">
              <div className="bg-[#1a1c3a] text-white p-4 rounded-lg text-xs leading-relaxed">
                📢 Use the tools below to convert your current balances. Please review the conversion rate before executing as this process is irreversible.
              </div>

              {convertMessage && (
                <div className="text-xs font-semibold p-3 rounded bg-gray-50 border border-gray-100">
                  {convertMessage}
                </div>
              )}

              {/* Points to Cash Form */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-[#1a8a7d]">Convert Points to Cash</h4>
                <form onSubmit={handleConvertPoints} className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Conversion Rate: 100 Points = $1.00 Cash</label>
                    <input type="number" required min="1" value={convertPointsInput} onChange={(e) => setConvertPointsInput(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm bg-white" placeholder="Points amount" />
                  </div>
                  <button type="submit" disabled={converting} className="bg-[#1a1c3a] hover:bg-slate-900 disabled:opacity-50 text-white px-5 py-2.5 rounded text-xs font-bold transition whitespace-nowrap">
                    Convert to Cash
                  </button>
                </form>
              </div>

              <hr className="border-gray-100" />

              {/* Cash to Points Form */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-[#1a8a7d]">Convert Cash to Points</h4>
                <form onSubmit={handleConvertCash} className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Conversion Rate: $1.00 Cash = 100 Points</label>
                    <input type="number" required min="0.01" step="0.01" value={convertCashInput} onChange={(e) => setConvertCashInput(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm bg-white" placeholder="Cash amount" />
                  </div>
                  <button type="submit" disabled={converting} className="bg-[#1a1c3a] hover:bg-slate-900 disabled:opacity-50 text-white px-5 py-2.5 rounded text-xs font-bold transition whitespace-nowrap">
                    Convert to Points
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
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
