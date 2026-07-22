import { createFileRoute, redirect } from "@tanstack/react-router";
import { ChatFeed } from "@/components/ChatFeed";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/chat-feed")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", context.user.id).eq("role", "admin").maybeSingle();
    if (!data) throw redirect({ to: "/dashboard" });
  },
  component: () => (
    <div>
      <h1 className="text-lg font-bold text-[#1a1c3a] mb-3">💬 Real-Time Activity Feed</h1>
      <ChatFeed />
    </div>
  ),
});
