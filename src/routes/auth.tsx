import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  ref: z.string().optional(),
});

// Cloudflare Turnstile test sitekey — always passes. Replace with real key in production.
const TURNSTILE_SITEKEY = "1x00000000000000000000AA";

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign In / Sign Up — GlobalPrime" },
      { name: "description", content: "Sign in or create your GlobalPrime account to start earning cash rewards." },
      { name: "robots", content: "noindex" },
    ],
    scripts: [
      { src: "https://challenges.cloudflare.com/turnstile/v0/api.js", async: true, defer: true },
    ],
  }),
  component: Auth,
});

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: { sitekey: string; callback: (t: string) => void; "error-callback"?: () => void; "expired-callback"?: () => void }) => string;
      reset: (id?: string) => void;
    };
  }
}

function Auth() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState<"INR" | "USD">("USD");
  const [referral, setReferral] = useState(search.ref ?? "");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  // Render Turnstile widget when in signup mode
  useEffect(() => {
    if (mode !== "signup") return;
    let cancelled = false;
    const tryRender = () => {
      if (cancelled) return;
      if (window.turnstile && turnstileRef.current && !widgetIdRef.current) {
        widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
          sitekey: TURNSTILE_SITEKEY,
          callback: (t) => setTurnstileToken(t),
          "error-callback": () => setTurnstileToken(null),
          "expired-callback": () => setTurnstileToken(null),
        });
      } else if (!widgetIdRef.current) {
        setTimeout(tryRender, 200);
      }
    };
    tryRender();
    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.reset(widgetIdRef.current); } catch { /* ignore */ }
      }
      widgetIdRef.current = null;
      setTurnstileToken(null);
    };
  }, [mode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "signup") {
      if (!acceptTerms) { setError("You must accept the Terms & Conditions"); return; }
      if (!turnstileToken) { setError("Please complete the Cloudflare verification"); return; }
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { name, phone, country, currency, referral_code: referral || undefined },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/dashboard", replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1c3a] to-[#2a2d5a] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
        <div className="text-center mb-4">
          <div className="text-xl font-extrabold text-[#1a1c3a] tracking-wider">GLOBALPRIME</div>
          <div className="text-[10px] italic text-[#f59e0b]">Earn. Complete. Withdraw.</div>
        </div>
        <div className="flex mb-4 rounded-lg overflow-hidden border">
          <button onClick={() => setMode("signin")} className={`flex-1 py-2 text-sm font-semibold ${mode === "signin" ? "bg-[#1a8a7d] text-white" : "bg-gray-50 text-gray-700"}`}>Sign In</button>
          <button onClick={() => setMode("signup")} className={`flex-1 py-2 text-sm font-semibold ${mode === "signup" ? "bg-[#1a8a7d] text-white" : "bg-gray-50 text-gray-700"}`}>Sign Up</button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <>
              <input required placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
              <input placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
              <input placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
              <select value={currency} onChange={(e) => setCurrency(e.target.value as "INR" | "USD")} className="w-full border rounded-md px-3 py-2 text-sm">
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
              </select>
              <input placeholder="Referral Code (optional)" value={referral} onChange={(e) => setReferral(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
            </>
          )}
          <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
          <input required type="password" placeholder="Password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />

          {mode === "signup" && (
            <>
              <label className="flex items-start gap-2 text-xs text-gray-700">
                <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-0.5" />
                <span>
                  I agree to the{" "}
                  <a href="/terms" target="_blank" rel="noreferrer" className="text-[#1a8a7d] underline">Terms &amp; Conditions</a>{" "}
                  and{" "}
                  <a href="/privacy" target="_blank" rel="noreferrer" className="text-[#1a8a7d] underline">Privacy Policy</a>.
                </span>
              </label>
              <div ref={turnstileRef} className="flex justify-center" />
            </>
          )}

          {error && <div className="text-red-600 text-xs">{error}</div>}
          <button disabled={loading} className="w-full bg-[#e8734a] hover:bg-[#d66339] disabled:opacity-60 text-white font-bold py-2.5 rounded-md text-sm">
            {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>
        <div className="text-center mt-4 text-xs">
          <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">← Back</Link>
        </div>
      </div>
    </div>
  );
}
