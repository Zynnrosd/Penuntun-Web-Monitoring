// backend/src/routes/auth.routes.ts

import { Router } from "express";
import { supabase, supabaseAnon } from "../lib/supabase";
import { requireAuth, getSession, db } from "../lib/auth";

const router = Router();

const BATAS_PENDAFTARAN = 5;
const JENDELA_MS = 15 * 60 * 1000;
const percobaanDaftar = new Map<string, { jumlah: number; mulai: number }>();

function melebihiBatas(ip: string): boolean {
  const sekarang = Date.now();
  const catatan = percobaanDaftar.get(ip);

  if (!catatan || sekarang - catatan.mulai > JENDELA_MS) {
    percobaanDaftar.set(ip, { jumlah: 1, mulai: sekarang });
    return false;
  }

  catatan.jumlah += 1;
  return catatan.jumlah > BATAS_PENDAFTARAN;
}

router.post("/register", async (req, res) => {
  if (melebihiBatas(req.ip ?? "tidak diketahui")) {
    return res.status(429).json({
      message: "Terlalu banyak percobaan pendaftaran. Coba lagi dalam 15 menit.",
    });
  }

  const { alur, nama, email, password, nama_yayasan, kota_yayasan, id_yayasan } = req.body;

  if (alur !== "yayasan" && alur !== "pengawas") {
    return res.status(400).json({ message: "Alur pendaftaran tidak valid" });
  }
  if (!nama?.trim()) return res.status(400).json({ message: "Nama lengkap wajib diisi" });
  if (!email?.trim()) return res.status(400).json({ message: "Email wajib diisi" });
  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ message: "Kata sandi minimal 6 karakter" });
  }

  const metadata: Record<string, string> = { alur, nama: nama.trim() };

  if (alur === "yayasan") {
    if (!nama_yayasan?.trim()) return res.status(400).json({ message: "Nama yayasan wajib diisi" });
    if (!kota_yayasan?.trim()) return res.status(400).json({ message: "Kota yayasan wajib diisi" });
    metadata.nama_yayasan = nama_yayasan.trim();
    metadata.kota_yayasan = kota_yayasan.trim();
  } else {
    if (typeof id_yayasan !== "string" || !id_yayasan) {
      return res.status(400).json({ message: "Yayasan belum dipilih" });
    }
    metadata.id_yayasan = id_yayasan;
  }

  const { data: dibuat, error } = await supabase.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (error || !dibuat.user) {
    const pesan = error?.message ?? "";

    if (pesan.includes("sudah terdaftar")) {
      return res.status(409).json({
        code: "YAYASAN_SUDAH_ADA",
        message: "Yayasan ini sudah terdaftar. Daftar sebagai Pengawas?",
      });
    }
    if (/already|registered|exists/i.test(pesan)) {
      return res.status(409).json({ message: "Email sudah terdaftar" });
    }
    if (pesan.includes("Yayasan tidak ditemukan")) {
      return res.status(400).json({ message: "Yayasan tidak ditemukan" });
    }

    console.error("[AUTH] Registrasi gagal:", error);
    return res.status(400).json({ message: "Registrasi gagal. Periksa kembali isian Anda." });
  }

  res.status(201).json({
    alur,
    message:
      alur === "yayasan"
        ? "Yayasan dan akun Administrator berhasil dibuat"
        : "Permintaan terkirim. Menunggu persetujuan Administrator yayasan.",
  });
});

router.get("/yayasan", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  if (q.trim().length < 3) return res.json([]);

  const { data, error } = await supabaseAnon.rpc("cari_yayasan", { q });

  if (error) {
    console.error("[AUTH] Pencarian yayasan gagal:", error);
    return res.status(500).json({ message: "Gagal mencari yayasan" });
  }

  res.json(data ?? []);
});

router.get("/saya", requireAuth, async (req, res) => {
  const { id, role, status, id_yayasan } = getSession(req);

  const { data: akun } = await db(req)
    .from("administrators")
    .select("nama_staf, email, no_wa, yayasan:id_yayasan(nama_yayasan, kota_yayasan)")
    .eq("id_admin", id)
    .maybeSingle();

  res.json({
    id_admin: id,
    role,
    status,
    id_yayasan,
    nama_staf: akun?.nama_staf ?? null,
    email: akun?.email ?? null,
    no_wa: akun?.no_wa ?? null,
    yayasan: akun?.yayasan ?? null,
  });
});

router.post("/ajukan-yayasan-lain", requireAuth, async (req, res) => {
  const { id_yayasan } = req.body;
  if (typeof id_yayasan !== "string" || !id_yayasan) {
    return res.status(400).json({ message: "Yayasan belum dipilih" });
  }

  const { error } = await db(req).rpc("ajukan_ke_yayasan_lain", { p_id_yayasan: id_yayasan });

  if (error) {
    if (error.code === "P0002") return res.status(404).json({ message: "Yayasan tidak ditemukan" });
    if (error.code === "42501") {
      return res.status(403).json({
        message: "Hanya akun Pengawas berstatus Ditolak yang dapat mengajukan ulang",
      });
    }
    console.error("[AUTH] Pengajuan ke yayasan lain gagal:", error);
    return res.status(400).json({ message: "Gagal mengajukan ke yayasan lain" });
  }

  res.json({ message: "Permintaan terkirim. Menunggu persetujuan Administrator yayasan." });
});

export default router;