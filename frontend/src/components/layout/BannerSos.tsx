// frontend/src/components/layout/BannerSos.tsx
// Banner merah insiden aktif. Datanya dimuat sekali di layout dashboard lalu dibagikan lewat context, supaya banner bisa tampil di bawah judul setiap halaman (dipanggil dari PageHeader).

"use client";
import { createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { jamWIB } from "@/lib/format";
import type { Notifikasi } from "@/types";

export const InsidenAktifContext = createContext<Notifikasi[]>([]);

// Daftar dari server sudah urut terbaru, jadi insiden pertama yang ditampilkan.
export function BannerSos() {
  const daftar = useContext(InsidenAktifContext);
  const pathname = usePathname();

  // Di halaman Notifikasi SOS banner tidak perlu, insidennya sudah ada di daftar.
  const terbaru = daftar[0];
  if (!terbaru || pathname === "/notifikasi") return null;

  const nama = terbaru.nama_snapshot ?? "Pengguna";
  const perangkat = terbaru.id_perangkat ? `, perangkat ${terbaru.id_perangkat}` : "";
  const judul =
    terbaru.tipe_event === "SOS" ? `SOS dari ${nama}${perangkat}.` : `${nama} keluar dari zona aman${perangkat}.`;
  const lainnya = daftar.length - 1;

  return (
    <div
      role="alert"
      className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-inner bg-danger px-[18px] py-3 text-[15px] leading-[22px] text-white"
    >
      <AlertTriangle size={20} strokeWidth={2.2} className="flex-none" />
      <p className="min-w-0 flex-1">
        <b>{judul}</b> Pukul {jamWIB(terbaru.occurred_at)}.
        {lainnya > 0 && ` Ada ${lainnya} insiden aktif lainnya.`}
      </p>
      <Link
        href={`/notifikasi?id=${terbaru.id_notifikasi}`}
        className="rounded-pill bg-white px-4 py-1.5 text-sm font-bold text-danger-text transition-colors hover:bg-danger-soft"
      >
        Tangani sekarang
      </Link>
    </div>
  );
}