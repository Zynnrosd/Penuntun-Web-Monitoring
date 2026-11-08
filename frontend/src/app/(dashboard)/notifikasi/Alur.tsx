// frontend/src/app/(dashboard)/notifikasi/Alur.tsx
// Timeline langkah insiden: tombol ditekan, pengiriman WhatsApp, lalu penanganan.

import { Check, Clock } from "lucide-react";
import { jamWIB } from "@/lib/format";
import type { Notifikasi } from "@/types";
import type { ringkasKirim } from "./status";

type Nada = "danger" | "success" | "warning" | "tunggu";

const RONA_TITIK: Record<Nada, string> = {
  danger: "bg-danger text-white",
  success: "bg-success text-white",
  warning: "bg-warning text-heading",
  tunggu: "bg-surface text-transparent shadow-[inset_0_0_0_2px_var(--color-border-strong)]",
};

export function Alur({
  insiden,
  kirim,
  sayaYangPegang,
}: {
  insiden: Notifikasi;
  kirim: ReturnType<typeof ringkasKirim>;
  sayaYangPegang: boolean;
}) {
  const langkah: { judul: string; detail: string; nada: Nada }[] = [
    {
      judul: insiden.tipe_event === "SOS" ? "Tombol SOS ditekan" : "Tongkat keluar dari zona aman",
      detail: `${jamWIB(insiden.occurred_at)} · ${insiden.id_perangkat ?? "perangkat tidak tercatat"}`,
      nada: insiden.tipe_event === "SOS" ? "danger" : "warning",
    },
  ];

  if (kirim.total === 0) {
    langkah.push({
      judul: "WhatsApp tidak dijadwalkan",
      detail: "Tidak ada penerima aktif saat insiden terjadi",
      nada: "tunggu",
    });
  } else {
    if (kirim.terkirim > 0) {
      langkah.push({
        judul: "WhatsApp terkirim",
        detail: `${kirim.terkirim} dari ${kirim.total} nomor penerima`,
        nada: "success",
      });
    }
    if (kirim.menunggu > 0) {
      langkah.push({
        judul: "Menunggu dikirim",
        detail: `${kirim.menunggu} nomor masih dalam antrean`,
        nada: "tunggu",
      });
    }
    if (kirim.gagal.length > 0) {
      langkah.push({
        judul: "Sebagian pengiriman gagal",
        detail: `${kirim.gagal.length} nomor tidak menerima pesan`,
        nada: "danger",
      });
    }
  }

  if (insiden.status === "AKTIF") {
    langkah.push({
      judul: "Menunggu ditangani",
      detail: "Belum ada yang mengambil insiden ini",
      nada: "tunggu",
    });
  } else {
    const waktu = insiden.ditangani_pada ? `${jamWIB(insiden.ditangani_pada)} · ` : "";
    const oleh = sayaYangPegang ? "oleh Anda" : "oleh pengurus lain";
    langkah.push({
      judul: insiden.status === "DITANGANI" ? "Sedang ditangani" : "Ditandai selesai",
      detail: `${waktu}${oleh}`,
      nada: insiden.status === "DITANGANI" ? "warning" : "success",
    });
  }

  return (
    <ul className="flex flex-col">
      {langkah.map((l, i) => (
        <li key={l.judul} className="relative flex gap-3 pb-4 last:pb-0">
          {i < langkah.length - 1 && (
            <span aria-hidden className="absolute left-[11px] top-[26px] bottom-0.5 w-0.5 bg-border-strong" />
          )}
          <span
            className={`relative flex h-6 w-6 flex-none items-center justify-center rounded-pill ${RONA_TITIK[l.nada]}`}
          >
            {l.nada === "tunggu" ? (
              <Clock size={13} strokeWidth={2.4} className="text-border-strong" />
            ) : (
              <Check size={13} strokeWidth={3} />
            )}
          </span>
          <span className="min-w-0">
            <b className="block text-sm font-bold leading-5">{l.judul}</b>
            <span className="block text-[13px] leading-[18px] text-text-secondary">{l.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}