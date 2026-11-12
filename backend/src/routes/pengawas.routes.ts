// backend/src/routes/pengawas.routes.ts

import { Router } from "express";
import { requireAuth, requireAktif, requireRole, db, getSession } from "../lib/auth";
import { balasGalat, balasGalatRpc } from "../lib/galat";
import { supabase } from "../lib/supabase";

const router = Router();
router.use(requireAuth, requireAktif, requireRole("ADMINISTRATOR"));

const KOLOM = "id_admin, nama_staf, email, status, created_at";

const STATUS_BOLEH: string[] = ["AKTIF", "NONAKTIF"];

router.get("/", async (req, res) => {
  const { data, error } = await db(req)
    .from("administrators")
    .select(KOLOM)
    .eq("role", "PENGAWAS")
    .order("created_at", { ascending: false });

  if (error) return balasGalat(res, "PENGAWAS daftar", error);
  res.json(data);
});

// Menyetujui atau menolak pendaftar. Pemeriksaan yayasan dan status ada di fungsi database.
router.patch("/:id/setujui", async (req, res) => {
  const { error } = await db(req).rpc("setujui_pengawas", { p_id: req.params.id });
  if (error) return balasGalatRpc(res, "PENGAWAS setujui", error);
  res.json({ message: "Permintaan disetujui" });
});

router.patch("/:id/tolak", async (req, res) => {
  const { error } = await db(req).rpc("tolak_pengawas", { p_id: req.params.id });
  if (error) return balasGalatRpc(res, "PENGAWAS tolak", error);
  res.json({ message: "Permintaan ditolak" });
});

router.patch("/:id/status", async (req, res) => {
  const { status } = (req.body ?? {}) as Record<string, unknown>;

  if (typeof status !== "string" || !STATUS_BOLEH.includes(status)) {
    return res.status(400).json({ message: "Status hanya boleh AKTIF atau NONAKTIF" });
  }

  const { error } = await db(req).rpc("ubah_status_pengawas", {
    p_id: req.params.id,
    p_status: status,
  });

  if (error) return balasGalatRpc(res, "PENGAWAS ubah status", error);
  res.json({ message: status === "AKTIF" ? "Akun diaktifkan" : "Akun dinonaktifkan" });
});

// Hanya akun Ditolak yang boleh dihapus karena belum pernah menangani insiden.
router.delete("/:id", async (req, res) => {
  const { id_yayasan } = getSession(req);

  // Klien server melewati RLS, jadi yayasan, peran, dan status wajib ikut jadi syarat hapus.
  const { data: terhapus, error } = await supabase
    .from("administrators")
    .delete()
    .eq("id_admin", req.params.id)
    .eq("id_yayasan", id_yayasan)
    .eq("role", "PENGAWAS")
    .eq("status", "DITOLAK")
    .select("id_admin");

  if (error) return balasGalat(res, "PENGAWAS hapus", error);
  if (!terhapus?.length) {
    return res.status(409).json({ message: "Hanya akun Pengawas berstatus Ditolak yang dapat dihapus" });
  }

  const { error: galatLogin } = await supabase.auth.admin.deleteUser(req.params.id);
  if (galatLogin) console.error("[PENGAWAS hapus] Data login gagal dihapus:", galatLogin);

  res.json({ message: "Akun Pengawas dihapus" });
});

export default router;