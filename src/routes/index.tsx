import { WallLogo } from "@/components/WallLogo";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Global Prime — Earn Points, Complete Surveys, Withdraw Cash" },
      {
        name: "description",
        content:
          "Join Global Prime to complete daily surveys and offer walls, earn points, refer friends and withdraw real cash via UPI, Paytm, PayPal, Payoneer or bank transfer.",
      },
      { property: "og:title", content: "Global Prime — Earn Points, Complete Surveys, Withdraw Cash" },
      {
        property: "og:description",
        content:
          "Complete surveys and offers, earn points, invite friends and cash out with UPI, Paytm, PayPal, Payoneer or bank transfer.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const balances = [
  { icon: "💵", label: "Cash Balance", desc: "Your withdrawable earnings, updated instantly.", bg: "from-[#0f766e] via-[#1a8a7d] to-[#34d399]" },
  { icon: "⭐", label: "Points Balance", desc: "Points from every survey, offer and bonus.", bg: "from-[#1d4ed8] via-[#2563eb] to-[#38bdf8]" },
  { icon: "🔒", label: "Locked Balance", desc: "Pending funds released automatically after review.", bg: "from-[#1a1c3a] via-[#2d2f5c] to-[#4c4f8a]" },
  { icon: "🎁", label: "Referral Earnings", desc: "Lifetime commission from every friend you invite.", bg: "from-[#7c2d12] via-[#c2410c] to-[#f59e0b]" },
];

const surveys = ["ROM Survey IN", "PollReach", "MYPINIO", "Crunchyroll", "Amazon Music"];
const offerwalls: Array<{ name: string; provider: string }> = [
  { name: "CPX Research", provider: "cpx_research" },
  { name: "BitLabs", provider: "bitlabs" },
  { name: "Pollfish", provider: "pollfish" },
  { name: "AdscendMedia", provider: "adscend" },
  { name: "Lootably", provider: "lootably" },
  { name: "Monlix", provider: "monlix" },
  { name: "GemiAds", provider: "gemiads" },
  { name: "PrimeWall", provider: "primewall" },
];
const payouts = [
  { icon: "🇮🇳", name: "UPI" },
  { icon: "📱", name: "Paytm" },
  { icon: "🅿️", name: "PayPal" },
  { icon: "🌐", name: "Payoneer" },
  { icon: "🏦", name: "Bank Transfer" },
];

const features = [
  { icon: "📋", title: "Daily Surveys", body: "Fresh surveys every day from top networks. Finish one and points land in your balance right away." },
  { icon: "🎯", title: "Offer Walls", body: "Eight partner walls with thousands of offers, games and app installs to complete at your own pace." },
  { icon: "👥", title: "Referral System", body: "Share your personal referral link. Every friend who registers earns you lifetime commission." },
  { icon: "🏦", title: "Fast Withdrawals", body: "Cash out to UPI, Paytm, PayPal, Payoneer or your bank. Track every request in withdraw history." },
  { icon: "💱", title: "Points Conversion", body: "Simple and transparent: 100 points = 1 rupee or dollar. Convert whenever you want." },
  { icon: "🎫", title: "Support Tickets", body: "Raise a ticket any time and chat directly with our support team until it is resolved." },
  { icon: "📰", title: "News & Announcements", body: "Platform updates, new offers and contest results posted straight to your dashboard." },
  { icon: "💬", title: "Live Chat Feed", body: "See new members joining and members earning rewards in real time as it happens." },
];

const steps = [
  { n: "1", title: "Create your account", body: "Sign up free in under a minute and grab your welcome bonus points." },
  { n: "2", title: "Earn points", body: "Complete daily surveys, offer walls, promo codes and contests." },
  { n: "3", title: "Convert & withdraw", body: "Turn 100 points into 1 rupee or dollar and cash out to your method." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-[#f0f2f5] text-[#1a1c3a]">
      <header className="sticky top-0 z-30 bg-[#1a1c3a] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <div className="text-lg font-extrabold tracking-wider">GLOBAL PRIME</div>
            <div className="text-[10px] italic text-[#f59e0b]">Earn. Complete. Withdraw.</div>
          </div>
          <nav className="flex items-center gap-2">
            <Link to="/auth" className="rounded-md px-4 py-2 text-xs font-semibold text-white/80 hover:text-white">
              Sign In
            </Link>
            <Link to="/auth" className="rounded-md bg-[#e8734a] px-4 py-2 text-xs font-bold hover:bg-[#d66339]">
              Create Account
            </Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-br from-[#1a1c3a] via-[#2a2d5a] to-[#4c4f8a] text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-2 md:items-center">
          <div>
            <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-[#f59e0b]">
              100 points = 1 rupee / dollar
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">
              Get paid for surveys, offers and referrals.
            </h1>
            <p className="mt-4 max-w-lg text-sm text-white/70">
              Global Prime is a rewards platform where you complete daily surveys and partner offer walls, collect
              points, invite friends for commission and withdraw real cash to UPI, Paytm, PayPal, Payoneer or your bank.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/auth" className="rounded-lg bg-[#e8734a] px-6 py-3 text-sm font-bold hover:bg-[#d66339]">
                Start Earning Free
              </Link>
              <Link to="/auth" className="rounded-lg border border-white/25 px-6 py-3 text-sm font-semibold hover:bg-white/10">
                I already have an account
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-6 text-xs text-white/60">
              <div><b className="block text-lg text-white">5+</b>Survey networks</div>
              <div><b className="block text-lg text-white">8</b>Offer walls</div>
              <div><b className="block text-lg text-white">5</b>Payout methods</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {balances.map((b) => (
              <div key={b.label} className={`rounded-xl bg-gradient-to-br ${b.bg} p-4 shadow-lg`}>
                <div className="text-2xl">{b.icon}</div>
                <div className="mt-2 text-sm font-bold">{b.label}</div>
                <div className="mt-1 text-[11px] text-white/75">{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-bold">Everything inside your dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">The same tools you get the moment you sign in.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <article key={f.title} className="rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
              <div className="text-2xl">{f.icon}</div>
              <h3 className="mt-2 text-sm font-bold">{f.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold">📋 Daily Surveys</h2>
            <p className="mt-1 text-sm text-gray-500">Complete a survey, earn points instantly.</p>
            <ul className="mt-4 space-y-2">
              {surveys.map((s) => (
                <li key={s} className="flex items-center justify-between rounded-lg bg-[#f0f2f5] px-4 py-3 text-sm font-semibold">
                  <span>{s}</span>
                  <span className="text-xs font-bold text-[#1a8a7d]">Earn points</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-bold">🎯 Offer Walls</h2>
            <p className="mt-1 text-sm text-gray-500">Trusted providers, thousands of offers.</p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {offerwalls.map((o) => (
                <div key={o.provider} className="rounded-lg border border-gray-100 bg-[#f0f2f5] p-3 text-center">
                  <div className="mx-auto flex h-9 w-9 items-center justify-center">
                    <WallLogo name={o.name} provider={o.provider} className="h-9 w-9" />
                  </div>
                  <div className="mt-2 text-[11px] font-semibold">{o.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-bold">How it works</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8734a] font-bold text-white">{s.n}</div>
              <h3 className="mt-3 font-bold">{s.title}</h3>
              <p className="mt-1 text-xs text-gray-600">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#1a1c3a] py-14 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-bold">💰 Withdraw your way</h2>
          <p className="mt-1 text-sm text-white/60">
            Convert points at 100 points = 1 rupee or dollar, then request a payout. Every request is tracked in your
            withdraw history with Pending, Approved or Rejected status.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {payouts.map((p) => (
              <div key={p.name} className="rounded-xl bg-white/5 p-4 text-center">
                <div className="text-2xl">{p.icon}</div>
                <div className="mt-2 text-xs font-semibold">{p.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h3 className="font-bold">👥 Referral Program</h3>
            <p className="mt-1 text-xs text-gray-600">
              Share your referral link, watch your referral count grow and collect commission from every active friend.
            </p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h3 className="font-bold">🏆 Contests & Promo Codes</h3>
            <p className="mt-1 text-xs text-gray-600">
              Compete for prizes in timed contests and redeem promo codes for bonus points.
            </p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h3 className="font-bold">💬 Live Community Feed</h3>
            <p className="mt-1 text-xs text-gray-600">
              See who just joined, who completed a survey and who earned rewards — live on your dashboard.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-[#e8734a] to-[#f59e0b] py-14 text-center text-white">
        <h2 className="text-3xl font-extrabold">Ready to start earning?</h2>
        <p className="mt-2 text-sm text-white/85">Create your free Global Prime account and claim your welcome bonus.</p>
        <Link to="/auth" className="mt-6 inline-block rounded-lg bg-[#1a1c3a] px-8 py-3 text-sm font-bold hover:bg-[#12142c]">
          Create Free Account
        </Link>
      </section>

      <footer className="bg-[#12142c] py-8 text-white/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs sm:flex-row">
          <div>© {new Date().getFullYear()} Global Prime. All rights reserved.</div>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-white">Terms</Link>
            <Link to="/privacy" className="hover:text-white">Privacy</Link>
            <Link to="/auth" className="hover:text-white">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
