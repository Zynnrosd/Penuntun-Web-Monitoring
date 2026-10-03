"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [siap, setSiap] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sidebarTerbuka, setSidebarTerbuka] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      const { data: admin } = await supabase
        .from("administrators")
        .select("role")
        .eq("id_admin", data.session.user.id)
        .single();
      setIsAdmin(admin?.role === "administrator");
      setSiap(true);
    });
  }, [router]);

  if (!siap) return null;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Overlay gelap saat sidebar dibuka di mobile */}
      {sidebarTerbuka && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setSidebarTerbuka(false)} />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-40 h-screen transition-transform duration-200 md:sticky md:top-0 md:translate-x-0 ${
          sidebarTerbuka ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar isAdmin={isAdmin} onNavigate={() => setSidebarTerbuka(false)} />
      </div>

      <div className="min-w-0 flex-1 overflow-y-auto">
        {/* Top bar khusus mobile — hamburger buat buka sidebar */}
        <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-surface px-4 md:hidden">
          <button onClick={() => setSidebarTerbuka((v) => !v)} className="text-text-primary" aria-label="Buka menu">
            {sidebarTerbuka ? <X size={22} /> : <Menu size={22} />}
          </button>
          <span className="text-sm font-bold text-secondary">PENUNTUN</span>
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-8 pt-4 sm:px-6 md:px-10">{children}</div>
      </div>
    </div>
  );
}