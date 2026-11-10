// frontend/src/components/layout/Sidebar.tsx

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, BatteryMedium, Siren, Smartphone, Users, ShieldCheck, LogOut } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";

const MENU_UMUM = [
  { href: "/home", label: "Beranda", icon: Home },
  { href: "/monitoring", label: "Pantau lokasi", icon: MapPin },
  { href: "/baterai", label: "Status baterai", icon: BatteryMedium },
  { href: "/notifikasi", label: "Notifikasi SOS", icon: Siren },
];

const DATA_PERANGKAT = { href: "/perangkat", label: "Data perangkat", icon: Smartphone };

const MENU_MANAJEMEN = [
  DATA_PERANGKAT,
  { href: "/pengguna", label: "Data pengguna", icon: Users },
  { href: "/pengawas", label: "Akun Pengawas", icon: ShieldCheck },
];

export function Sidebar({
  isAdmin,
  jumlahMenunggu = 0,
  onNavigate,
  onKeluar,
}: {
  isAdmin: boolean;
  jumlahMenunggu?: number;
  onNavigate?: () => void;
  onKeluar: () => void;
}) {
  const pathname = usePathname();

  // Pengawas memasangkan tongkat lewat halaman Data perangkat, jadi menunya ikut tampil tanpa kelompok Manajemen.
  const menuUtama = isAdmin ? MENU_UMUM : [...MENU_UMUM, DATA_PERANGKAT];

  function kelas(href: string) {
    const aktif = pathname === href || pathname.startsWith(`${href}/`);
    return cn(
      "flex h-10 items-center gap-3 rounded-nav px-3 text-sm font-semibold transition-colors",
      aktif ? "bg-white text-primary font-bold" : "text-nav hover:bg-white/10"
    );
  }

  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col bg-secondary px-4 pb-5 text-on-dark">
      <Link
        href="/home"
        onClick={onNavigate}
        className="-mx-4 mb-4 flex h-[72px] flex-none items-center border-b border-white/[0.18] px-6"
      >
        <Logo variant="putih" tinggi={30} />
      </Link>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto" aria-label="Navigasi utama">
        {menuUtama.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} onClick={onNavigate} className={kelas(href)}>
            <Icon size={18} strokeWidth={2} />
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
                <Icon size={18} strokeWidth={2} />
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
          onClick={onKeluar}
          className="flex h-10 w-full items-center gap-3 rounded-nav px-3 text-left text-sm font-semibold text-nav transition-colors hover:bg-white/10"
        >
          <LogOut size={18} strokeWidth={2} />
          Keluar
        </button>
      </div>
    </aside>
  );
}