import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface AuthState {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  error: string | null;
}

/** Estado de autenticação: sessão, perfil do artista e papel de administrador. */
export function useAuth(): AuthState {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<AuthState["session"]>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadUserData(userId: string) {
      const [profileRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      if (!active) return;
      const queryError = profileRes.error ?? rolesRes.error;
      if (queryError) {
        setError(queryError.message);
        return;
      }
      if (rolesRes.data === null) {
        setError("O serviço não devolveu os papéis associados à conta.");
        return;
      }
      setProfile(profileRes.data);
      setIsAdmin(rolesRes.data.some((role) => role.role === "admin"));
    }

    async function initialize() {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!active) return;
      if (sessionError) {
        setError(sessionError.message);
        setLoading(false);
        return;
      }
      setSession(data.session);
      if (data.session) await loadUserData(data.session.user.id);
      setLoading(false);
    }

    void initialize();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED")
        return;
      if (!active) return;
      setError(null);
      setSession(s);
      if (s) await loadUserData(s.user.id);
      else {
        setProfile(null);
        setIsAdmin(false);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { loading, session, profile, isAdmin, error };
}
