"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type SessionInfo = { nama_staf: string; role: "administrator" | "pengawas" } | null;

export function useSession() {
  const [session, setSession] = useState<SessionInfo>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: admin } = await supabase
        .from("administrators")
        .select("nama_staf, role")
        .eq("id_admin", data.session.user.id)
        .single();
      if (admin) setSession({ nama_staf: admin.nama_staf ?? "Admin", role: admin.role });
    });
  }, []);

  return session;
}