// backend/src/routes/notifikasi.routes.ts

import { Router } from "express";
import { requireAuth, requireAktif, db } from "../lib/auth";
import { balasGalat, balasGalatRpc } from "../lib/galat";

const router = Router();
router.use(requireAuth, requireAktif);

const KOLOM =
  "id_notifikasi, id_yayasan, id_perangkat, kode_insiden, nama_snapshot, tipe_event, status, ditangani_oleh, ditangani_pada, deskripsi, latitude_sos, longitude_sos, lokasi_sos, occurred_at, notifikasi_delivery(id_delivery, status, attempt_no, sent_at)";

router.get("/", async (req, res) => {
  const { data, error } = await db(req)
    .from("notifikasi")
    .select(KOLOM)
    .order("occurred_at", { ascending: false })
    .limit(100);

  if (error) return balasGalat(res, "NOTIFIKASI daftar", error);
  res.json(data);
});

router.patch("/:id/tangani", async (req, res) => {
  const { data, error } = await db(req).rpc("tangani_insiden", { p_id: Number(req.params.id) });
  if (error) return balasGalatRpc(res, "NOTIFIKASI tangani", error);
  res.json(data);
});

router.patch("/:id/ambil-alih", async (req, res) => {
  const { data, error } = await db(req).rpc("ambil_alih_insiden", { p_id: Number(req.params.id) });
  if (error) return balasGalatRpc(res, "NOTIFIKASI ambil alih", error);
  res.json(data);
});

router.patch("/:id/selesai", async (req, res) => {
  const { data, error } = await db(req).rpc("selesaikan_insiden", { p_id: Number(req.params.id) });
  if (error) return balasGalatRpc(res, "NOTIFIKASI selesai", error);
  res.json(data);
});

router.post("/delivery/:id/kirim-ulang", async (req, res) => {
  const { data, error } = await db(req).rpc("kirim_ulang_delivery", { p_id: Number(req.params.id) });
  if (error) return balasGalatRpc(res, "NOTIFIKASI kirim ulang", error);
  res.json({ id_delivery: data, message: "Pengiriman ulang dijadwalkan" });
});

export default router;