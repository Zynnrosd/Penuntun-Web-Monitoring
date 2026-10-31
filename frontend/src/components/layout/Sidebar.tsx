// frontend/src/components/layout/Sidebar.tsx

"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, MapPin, BatteryMedium, Siren, Smartphone, Users, ShieldCheck, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/cn";

const MENU_UMUM = [
  { href: "/home", label: "Beranda", icon: Home },
  { href: "/monitoring", label: "Pantau lokasi", icon: MapPin },
  { href: "/baterai", label: "Status baterai", icon: BatteryMedium },
  { href: "/notifikasi", label: "Notifikasi SOS", icon: Siren },
];

const MENU_MANAJEMEN = [
  { href: "/perangkat", label: "Data perangkat", icon: Smartphone },
  { href: "/pengguna", label: "Data pengguna", icon: Users },
  { href: "/pengawas", label: "Akun Pengawas", icon: ShieldCheck },
];

export function Sidebar({
  isAdmin,
  jumlahMenunggu = 0,
  onNavigate,
}: {
  isAdmin: boolean;
  jumlahMenunggu?: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function keluar() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  function kelas(href: string) {
    const aktif = pathname === href || pathname.startsWith(`${href}/`);
    return cn(
      "flex h-11 items-center gap-3 rounded-nav px-3 text-sm font-semibold transition-colors",
      aktif ? "bg-white text-primary font-bold" : "text-nav hover:bg-white/10"
    );
  }

  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col bg-secondary px-4 pb-5 text-on-dark">
      <Link
        href="/home"
        onClick={onNavigate}
        className="-mx-4 mb-4 flex h-[88px] flex-none items-center gap-3 border-b border-white/[0.18] px-7 text-[22px] font-extrabold tracking-[-0.03em] text-white"
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true" className="flex-none">
          <circle cx="16" cy="16" r="14" stroke="#F5F7FA" strokeOpacity=".35" strokeWidth="1.5" />
          <circle cx="16" cy="16" r="8.5" stroke="#F5F7FA" strokeOpacity=".6" strokeWidth="1.5" />
          <circle cx="16" cy="16" r="3" fill="#5FD0D9" />
        </svg>
        Penuntun
      </Link>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto" aria-label="Navigasi utama">
        {MENU_UMUM.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} onClick={onNavigate} className={kelas(href)}>
            <Icon size={20} strokeWidth={2} />
            {label}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="mt-[22px] px-3 pb-1 text-[13px] font-bold uppercase tracking-[0.12em] text-nav/70">
              Manajemen
            </div>
            {MENU_MANAJEMEN.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={onNavigate} className={kelas(href)}>
                <Icon size={20} strokeWidth={2} />
                {label}
                {href === "/pengawas" && jumlahMenunggu > 0 && (
                  <span className="ml-auto flex h-[22px] min-w-[22px] items-center justify-center rounded-pill bg-danger px-1.5 text-[13px] font-semibold text-white">
                    {jumlahMenunggu}
                  </span>
                )}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="mt-auto border-t border-white/[0.18] pt-3">
        <button
          onClick={keluar}
          className="flex h-11 w-full items-center gap-3 rounded-nav px-3 text-left text-sm font-semibold text-nav transition-colors hover:bg-white/10"
        >
          <LogOut size={20} strokeWidth={2} />
          Keluar
        </button>
      </div>
    </aside>
  );
}