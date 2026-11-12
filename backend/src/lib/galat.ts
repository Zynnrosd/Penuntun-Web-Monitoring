// backend/src/lib/galat.ts

import { Response } from "express";
import type { PostgrestError } from "@supabase/supabase-js";

const STATUS_KODE: Record<string, { status: number; pesan: string }> = {
  "42501": { status: 403, pesan: "Tidak punya akses" },
  P0002: { status: 404, pesan: "Data tidak ditemukan" },
  "23505": { status: 409, pesan: "Data sudah dipakai" },
  "23503": { status: 409, pesan: "Data masih dipakai di tempat lain" },
  "23514": { status: 400, pesan: "Isian tidak sesuai aturan" },
  "40001": { status: 409, pesan: "Data sudah diubah akun lain. Muat ulang halaman." },
};

// Untuk query biasa: pesan internal database tidak pernah dikirim ke pengguna.
export function balasGalat(res: Response, konteks: string, error: PostgrestError | null) {
  console.error(`[${konteks}]`, error);
  const dikenal = error?.code ? STATUS_KODE[error.code] : undefined;
  res
    .status(dikenal?.status ?? 500)
    .json({ message: dikenal?.pesan ?? "Terjadi kesalahan pada server" });
}

// Untuk fungsi database (RPC): pesannya ditulis sendiri di SQL, misalnya "Sudah ditangani oleh ...", jadi boleh diteruskan.
export function balasGalatRpc(res: Response, konteks: string, error: PostgrestError | null) {
  console.error(`[${konteks}]`, error);
  const dikenal = error?.code ? STATUS_KODE[error.code] : undefined;
  if (!dikenal) return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  res.status(dikenal.status).json({ message: error?.message || dikenal.pesan });
}