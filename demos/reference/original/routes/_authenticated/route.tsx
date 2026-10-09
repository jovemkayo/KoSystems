import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    const { data: profile } = await supabase
      .from("profiles")
      .select("access_status")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profile?.access_status !== "active") {
      throw redirect({
        to: "/acesso-pendente",
        search: { status: profile?.access_status ?? "pending" },
      });
    }

    return { user: data.user };
  },
  component: () => <Outlet />,
});
