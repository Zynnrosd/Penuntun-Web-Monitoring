// frontend/src/app/(dashboard)/layout.tsx

"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ShieldOff, WifiOff } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { useRealtimePutus } from "@/hooks/useRealtimeTable";
import { Sidebar } from "@/components/layout/Sidebar";
import { KonfirmasiKeluar } from "@/components/ui/KonfirmasiKeluar";
import { api } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";

// /perangkat tidak termasuk: Pengawas memasangkan tongkat di sana. Tambah, hapus, dan zona aman dibatasi di dalam halamannya.
const HANYA_ADMINISTRATOR = ["/pengguna", "/pengawas"];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { sesi, memuat } = useSession();
  const [sidebarTerbuka, setSidebarTerbuka] = useState(false);
  const [jumlahMenunggu, setJumlahMenunggu] = useState(0);
  const [konfirmasiKeluar, setKonfirmasiKeluar] = useState(false);
  const keluarSendiri = useRef(false);

  // Sesi yang berakhir sendiri (token tidak bisa diperbarui) diberi tahu lewat halaman khusus.
  // Keluar lewat tombol Keluar tidak termasuk, karena sudah ditandai di keluar().
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && !keluarSendiri.current) router.replace("/sesi-berakhir");
    });
    return () => data.subscription.unsubscribe();
  }, [router]);

  async function keluar() {
    keluarSendiri.current = true;
    await supabase.auth.signOut();
    router.replace("/login");
  }

  useEffect(() => {
    if (memuat) return;
    if (!sesi) {
      router.replace("/login");
      return;
    }
    if (sesi.status !== "AKTIF") router.replace("/status");
  }, [memuat, sesi, router]);

  useEffect(() => {
    if (sesi?.role !== "ADMINISTRATOR" || sesi.status !== "AKTIF") return;

    api
      .get<{ status: string }[]>("/pengawas")
      .then((daftar) => setJumlahMenunggu(daftar.filter((a) => a.status === "MENUNGGU").length))
      .catch(() => setJumlahMenunggu(0));
  }, [sesi?.role, sesi?.status, pathname]);

  if (memuat || !sesi || sesi.status !== "AKTIF") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-text-secondary">Memuat…</p>
      </div>
    );
  }

  const isAdmin = sesi.role === "ADMINISTRATOR";
  // Pengawas yang membuka halaman khusus Administrator lewat alamat mendapat pesan akses ditolak.
  // Ini hanya tampilan; backend tetap menolak permintaannya.
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
        <Sidebar
          isAdmin={isAdmin}
          jumlahMenunggu={jumlahMenunggu}
          onNavigate={() => setSidebarTerbuka(false)}
          onKeluar={() => {
            setSidebarTerbuka(false);
            setKonfirmasiKeluar(true);
          }}
        />
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
          <BannerKoneksi />
          {tanpaIzin ? <AksesDitolak /> : children}
        </div>
      </div>

      {konfirmasiKeluar && <KonfirmasiKeluar onBatal={() => setKonfirmasiKeluar(false)} onKeluar={keluar} />}
    </div>
  );
}

function BannerKoneksi() {
  const putus = useRealtimePutus();
  if (!putus) return null;

  return (
    <div
      role="status"
      className="mb-4 flex items-start gap-3 rounded-inner bg-warning-soft px-[18px] py-3.5 text-[15px] leading-[22px] text-warning-text"
    >
      <WifiOff size={20} className="mt-px flex-none" />
      <p>
        <b>Koneksi live terputus.</b> Data di halaman ini bisa saja bukan yang terbaru. Mencoba tersambung kembali…
      </p>
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
          Akun Pengawas dapat memantau lokasi, baterai, menangani notifikasi SOS, dan memasangkan tongkat, tetapi
          tidak mengelola data pengguna maupun akun Pengawas.
        </p>
      </div>
    </div>
  );
}