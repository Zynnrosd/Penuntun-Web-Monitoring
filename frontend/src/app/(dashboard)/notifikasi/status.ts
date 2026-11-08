// frontend/src/app/(dashboard)/notifikasi/status.ts
// Label, warna status insiden, dan ringkasan pengiriman WhatsApp yang dipakai bersama oleh halaman notifikasi.

import type { Notifikasi, NotifikasiDelivery } from "@/types";

export const RONA_STATUS: Record<Notifikasi["status"], string> = {
  AKTIF: "bg-danger text-white",
  DITANGANI: "bg-warning-soft text-warning-text",
  SELESAI: "bg-success-soft text-success-text",
};

export const RONA_INISIAL: Record<Notifikasi["status"], string> = {
  AKTIF: "bg-danger-soft text-danger-text",
  DITANGANI: "bg-warning-soft text-warning-text",
  SELESAI: "bg-success-soft text-success-text",
};

export const TEKS_STATUS: Record<Notifikasi["status"], string> = {
  AKTIF: "Belum ditangani",
  DITANGANI: "Sedang ditangani",
  SELESAI: "Selesai",
};

export function ringkasKirim(daftar: NotifikasiDelivery[] = []) {
  return {
    total: daftar.length,
    terkirim: daftar.filter((d) => d.status === "SENT").length,
    menunggu: daftar.filter((d) => d.status === "PENDING").length,
    gagal: daftar.filter((d) => d.status === "FAILED"),
  };
}