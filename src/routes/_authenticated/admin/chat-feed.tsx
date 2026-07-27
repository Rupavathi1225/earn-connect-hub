import { createFileRoute, redirect } from "@tanstack/react-router";
import { ChatFeed } from "@/components/ChatFeed";
import { supabase } from "@/integrations/supabase/client";
import { guardAdminPanel } from "@/lib/admin-guard";

export const Route = createFileRoute("/_authenticated/admin/chat-feed")({
  beforeLoad: async ({ context }) => {
    await guardAdminPanel(context.user.id);
  },
  component: () => (
    <div>
      <h1 className="text-lg font-bold text-[#1a1c3a] mb-3">💬 Real-Time Activity Feed</h1>
      <ChatFeed />
    </div>
  ),
});
