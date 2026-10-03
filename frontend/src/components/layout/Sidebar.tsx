"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Settings, LogOut, Home, MapPin, BatteryMedium, Siren } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/cn";

const MENU_UMUM = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/monitoring", label: "Monitoring Lokasi", icon: MapPin },
  { href: "/baterai", label: "Status Baterai", icon: BatteryMedium },
  { href: "/notifikasi", label: "Notifikasi SOS", icon: Siren },
];

const MENU_MANAJEMEN = [
  { href: "/perangkat", label: "Kelola Data Perangkat" },
  { href: "/pengguna", label: "Kelola Data Pengguna" },
  { href: "/pengaturan/whatsapp", label: "Konfigurasi Notifikasi" },
];

export function Sidebar({ isAdmin, onNavigate }: { isAdmin: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const manajemenAktif = MENU_MANAJEMEN.some((m) => pathname.startsWith(m.href));
  const [terbuka, setTerbuka] = useState(manajemenAktif);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col bg-secondary text-on-dark">
      <div className="flex h-20 flex-shrink-0 items-center px-5">
        <div className="flex items-center gap-2.5">
          <Image src="/logo-white.png" alt="PENUNTUN" width={32} height={32} priority className="flex-shrink-0 translate-y-[1px]" />
          <span className="text-lg font-bold text-white">PENUNTUN</span>
        </div>
      </div>

      <div className="h-px bg-white/10" />

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {MENU_UMUM.map((item) => {
          const Icon = item.icon;
          const aktif = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-input px-3 py-2.5 text-sm transition-colors",
                aktif ? "bg-primary-soft font-medium text-primary" : "text-on-dark/80 hover:bg-white/5"
              )}
            >
              <Icon size={17} className={aktif ? "text-primary" : "text-on-dark/60"} />
              {item.label}
            </Link>
          );
        })}

        {isAdmin && (
          <div className="mt-2">
            <button
              onClick={() => setTerbuka((v) => !v)}
              className={cn(
                "flex w-full items-center justify-between rounded-input px-3 py-2.5 text-sm transition-colors",
                manajemenAktif ? "bg-primary-soft font-medium text-primary" : "text-on-dark/80 hover:bg-white/5"
              )}
            >
              <span className="flex items-center gap-3">
                <Settings size={17} className={manajemenAktif ? "text-primary" : "text-on-dark/60"} />
                Manajemen
              </span>
              <ChevronDown size={15} className={cn("transition-transform", terbuka && "rotate-180")} />
            </button>

            {terbuka && (
              <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-4">
                {MENU_MANAJEMEN.map((item) => {
                  const aktif = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "block rounded-input px-3 py-2 text-sm transition-colors",
                        aktif ? "bg-primary-soft font-medium text-primary" : "text-on-dark/70 hover:bg-white/5"
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="h-px bg-white/10" />

      <button
        onClick={handleLogout}
        className="mx-3 my-3 flex items-center gap-3 rounded-input px-3 py-2.5 text-left text-sm text-on-dark/70 transition-colors hover:bg-white/5"
      >
        <LogOut size={17} />
        Keluar
      </button>
    </aside>
  );
}