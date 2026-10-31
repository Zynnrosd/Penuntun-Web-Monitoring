// frontend/src/app/(dashboard)/layout.tsx

"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ShieldOff } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { Sidebar } from "@/components/layout/Sidebar";

const HANYA_ADMINISTRATOR = ["/perangkat", "/pengguna", "/pengawas"];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { sesi, memuat } = useSession();
  const [sidebarTerbuka, setSidebarTerbuka] = useState(false);

  useEffect(() => {
    if (memuat) return;
    if (!sesi) {
      router.replace("/login");
      return;
    }
    if (sesi.status !== "AKTIF") router.replace("/status");
  }, [memuat, sesi, router]);

  if (memuat || !sesi || sesi.status !== "AKTIF") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-text-secondary">Memuat…</p>
      </div>
    );
  }

  const isAdmin = sesi.role === "ADMINISTRATOR";
  const tanpaIzin = !isAdmin && HANYA_ADMINISTRATOR.some((p) => pathname.startsWith(p));

  return (
    <div className="flex min-h-screen bg-background">
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
        <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-surface px-4 md:hidden">
          <button
            onClick={() => setSidebarTerbuka((v) => !v)}
            className="text-text-primary"
            aria-label={sidebarTerbuka ? "Tutup menu" : "Buka menu"}
          >
            {sidebarTerbuka ? <X size={22} /> : <Menu size={22} />}
          </button>
          <span className="font-extrabold text-secondary">Penuntun</span>
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 md:px-7">
          {tanpaIzin ? <AksesDitolak /> : children}
        </div>
      </div>
    </div>
  );
}

function AksesDitolak() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="max-w-md rounded-card border-2 border-border bg-surface p-8 text-center">
        <ShieldOff size={40} strokeWidth={2} className="mx-auto mb-4 text-offline" />
        <h2 className="text-[22px] font-extrabold leading-8">Halaman ini untuk Administrator</h2>
        <p className="mt-2 text-[15px] leading-6 text-text-secondary">
          Akun Pengawas dapat memantau lokasi, baterai, dan menangani notifikasi SOS, tetapi tidak mengelola data
          perangkat maupun pengguna.
        </p>
      </div>
    </div>
  );
}