import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { logWarn, logError } from "@/lib/logger";

export type AppRole = "admin" | "operator" | "user";
export type AccessStatus = "pending" | "active" | "blocked";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [accessStatus, setAccessStatus] = useState<AccessStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        logWarn("Failed to get auth session", {
          action: "auth.get_session",
          error,
        });
      }

      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setAccessStatus(null);
      return;
    }
    Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
      supabase.from("profiles").select("access_status").eq("id", user.id).maybeSingle(),
    ]).then(([roleResult, profileResult]) => {
      if (roleResult.error) {
        logError("Failed to load user role", {
          action: "auth.load_user_role",
          userId: user.id,
          error: roleResult.error,
        });
      }

      if (profileResult.error) {
        logError("Failed to load user access status", {
          action: "auth.load_user_access_status",
          userId: user.id,
          error: profileResult.error,
        });
      }

      setRole((roleResult.data?.role as AppRole) ?? "user");
      setAccessStatus((profileResult.data?.access_status as AccessStatus) ?? "pending");
    });
  }, [user]);

  return {
    session,
    user,
    role,
    accessStatus,
    loading,
    isAdmin: role === "admin" && accessStatus === "active",
    isOperator: role === "operator" && accessStatus === "active",
    canManageData: (role === "admin" || role === "operator") && accessStatus === "active",
    hasAccess: accessStatus === "active",
  };
}
