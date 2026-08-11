import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  SectionTitle,
  Field,
  Btn,
  Loading,
  ErrorState,
} from "@/components/superadmin/kit";

export const Route = createFileRoute("/superadmin/settings")({
  head: () => ({
    meta: [
      { title: "Global Settings · Super Admin · Global Prime" },
      { name: "description", content: "Manage system wide configuration and points values." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GlobalSettings,
});

function GlobalSettings() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    signup_bonus_points: 0,
    referral_commission_points: 0,
    lock_percentage: 0,
    lock_days: 0,
    points_per_inr: 100,
    points_per_usd: 100,
    admin_email: "",
  });

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ["sa", "settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("*").eq("id", 1).maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      setForm({
        signup_bonus_points: Number(settings.signup_bonus_points),
        referral_commission_points: Number(settings.referral_commission_points),
        lock_percentage: Number(settings.lock_percentage),
        lock_days: Number(settings.lock_days),
        points_per_inr: Number(settings.points_per_inr),
        points_per_usd: Number(settings.points_per_usd),
        admin_email: settings.admin_email || "",
      });
    }
  }, [settings]);

  const save = useMutation({
    mutationFn: async (values: typeof form) => {
      const { error } = await supabase.from("app_settings").update(values).eq("id", 1);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Settings saved successfully!");
      qc.invalidateQueries({ queryKey: ["sa", "settings"] });
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <SectionTitle>Global Settings</SectionTitle>
        <p className="mb-4 text-xs text-[var(--sa-muted)]">
          Configure network-wide reward rates, lock policies, and points-to-currency values.
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Signup Bonus (Points)">
              <input
                type="number"
                value={form.signup_bonus_points}
                onChange={(e) => setForm({ ...form, signup_bonus_points: Number(e.target.value) })}
              />
            </Field>
            <Field label="Referral Commission (Points)">
              <input
                type="number"
                value={form.referral_commission_points}
                onChange={(e) => setForm({ ...form, referral_commission_points: Number(e.target.value) })}
              />
            </Field>

            <Field label="Lock Percentage (%)">
              <input
                type="number"
                step="0.01"
                value={form.lock_percentage}
                onChange={(e) => setForm({ ...form, lock_percentage: Number(e.target.value) })}
              />
            </Field>
            <Field label="Lock Duration (Days)">
              <input
                type="number"
                value={form.lock_days}
                onChange={(e) => setForm({ ...form, lock_days: Number(e.target.value) })}
              />
            </Field>

            <Field label="Points per INR (₹)">
              <input
                type="number"
                value={form.points_per_inr}
                onChange={(e) => setForm({ ...form, points_per_inr: Number(e.target.value) })}
              />
            </Field>
            <Field label="Points per USD ($)">
              <input
                type="number"
                value={form.points_per_usd}
                onChange={(e) => setForm({ ...form, points_per_usd: Number(e.target.value) })}
              />
            </Field>

            <Field label="Admin Contact Email" className="md:col-span-2">
              <input
                type="email"
                value={form.admin_email}
                onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
              />
            </Field>
          </div>

          <div className="flex justify-end pt-2">
            <Btn tone="green" disabled={save.isPending} onClick={() => save.mutate(form)}>
              {save.isPending ? "Saving..." : "Save Settings"}
            </Btn>
          </div>
        </div>
      </Card>
    </div>
  );
}
