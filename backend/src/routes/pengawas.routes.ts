// backend/src/routes/pengawas.routes.ts

import { Router } from "express";
import { requireAuth, requireAktif, requireRole, db } from "../lib/auth";
import { balasGalat, balasGalatRpc } from "../lib/galat";

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

export default router;