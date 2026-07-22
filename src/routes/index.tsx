import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GlobalPrime — Earn Cash by Completing Surveys & Offers" },
      { name: "description", content: "Join GlobalPrime to earn cash rewards by completing surveys, offer walls, and referring friends. Fast payouts via UPI, PayPal, and more." },
      { property: "og:title", content: "GlobalPrime — Earn Cash Rewards" },
      { property: "og:description", content: "Complete surveys, offers, and refer friends to earn real money." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1c3a] to-[#2a2d5a] text-white">
      <header className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div>
          <div className="text-2xl font-extrabold tracking-wider">GLOBALPRIME</div>
          <div className="text-[10px] italic text-[#f59e0b]">Earn. Complete. Withdraw.</div>
        </div>
        <div className="flex gap-2">
          <Link to="/auth" className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 rounded">Sign In</Link>
          <Link to="/auth" search={{ mode: "signup" }} className="px-4 py-2 text-sm bg-[#e8734a] hover:bg-[#d66339] rounded font-semibold">
            Get Started
          </Link>
        </div>
      </header>
      <section className="max-w-4xl mx-auto text-center px-6 py-20">
        <h1 className="text-5xl font-bold leading-tight">Earn real cash by completing surveys and offers</h1>
        <p className="mt-4 text-lg text-white/70">
          Complete daily surveys, unlock offer walls, refer friends. Withdraw via UPI, Paytm, PayPal, Payoneer, or Bank Transfer.
        </p>
        <div className="mt-8 flex gap-3 justify-center">
          <Link to="/auth" search={{ mode: "signup" }} className="px-6 py-3 bg-[#e8734a] hover:bg-[#d66339] rounded font-bold">
            Sign Up & Get Bonus Points
          </Link>
          <Link to="/auth" className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded font-semibold">Sign In</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-16">
          {[
            { t: "8+ Offer Walls", d: "CPX, BitLabs, Pollfish, more" },
            { t: "Daily Surveys", d: "Fresh surveys every day" },
            { t: "Referral Rewards", d: "Earn from friends' activity" },
            { t: "Fast Withdrawals", d: "UPI, PayPal, Bank, & more" },
          ].map((f) => (
            <div key={f.t} className="bg-white/5 rounded-lg p-4 text-left">
              <div className="font-semibold text-[#f59e0b]">{f.t}</div>
              <div className="text-xs text-white/60 mt-1">{f.d}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
