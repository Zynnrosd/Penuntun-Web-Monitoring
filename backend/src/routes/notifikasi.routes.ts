// backend/src/routes/notifikasi.routes.ts

import { Router } from "express";
import { requireAuth, requireAktif, requireRole, db } from "../lib/auth";
import { balasGalat, balasGalatRpc } from "../lib/galat";

const router = Router();
router.use(requireAuth, requireAktif);

const KOLOM =
  "id_notifikasi, id_yayasan, id_perangkat, kode_insiden, nama_snapshot, tipe_event, status, ditangani_oleh, ditangani_pada, deskripsi, latitude_sos, longitude_sos, lokasi_sos, occurred_at, notifikasi_delivery(id_delivery, status, attempt_no, sent_at)";

const MAKS_PULIHKAN = 100;

// ?arsip=1 → insiden yang sudah dibersihkan; tanpa itu → daftar aktif.
router.get("/", async (req, res) => {
  const arsip = req.query.arsip === "1";
  const kueri = db(req).from("notifikasi").select(KOLOM);

  const { data, error } = await (arsip
    ? kueri.not("diarsipkan_pada", "is", null)
    : kueri.is("diarsipkan_pada", null)
  )
    .order("occurred_at", { ascending: false })
    .limit(100);

  if (error) return balasGalat(res, "NOTIFIKASI daftar", error);
  res.json(data);
});

// Body: { ids: number[] }. Fungsi database hanya mengarsipkan yang berstatus SELESAI.
router.patch("/bersihkan", async (req, res) => {
  const ids: unknown = req.body?.ids;

  if (
    !Array.isArray(ids) ||
    ids.length === 0 ||
    ids.length > MAKS_PULIHKAN ||
    !ids.every((id) => Number.isInteger(id) && id > 0)
  ) {
    return res.status(400).json({ message: "Pilih minimal satu insiden yang valid" });
  }

  const { data, error } = await db(req).rpc("bersihkan_insiden_terpilih", { p_ids: ids });
  if (error) return balasGalatRpc(res, "NOTIFIKASI bersihkan", error);
  res.json({ jumlah: data });
});

// Pulihkan beberapa insiden sekaligus. Body: { ids: number[] }
router.patch("/pulihkan", requireRole("ADMINISTRATOR"), async (req, res) => {
  const ids: unknown = req.body?.ids;

  if (
    !Array.isArray(ids) ||
    ids.length === 0 ||
    ids.length > MAKS_PULIHKAN ||
    !ids.every((id) => Number.isInteger(id) && id > 0)
  ) {
    return res.status(400).json({ message: "Pilih minimal satu insiden yang valid" });
  }

  const { data, error } = await db(req).rpc("pulihkan_insiden_banyak", { p_ids: ids });
  if (error) return balasGalatRpc(res, "NOTIFIKASI pulihkan banyak", error);
  res.json({ jumlah: data });
});

router.patch("/:id/pulihkan", requireRole("ADMINISTRATOR"), async (req, res) => {
  const { error } = await db(req).rpc("pulihkan_insiden", { p_id: Number(req.params.id) });
  if (error) return balasGalatRpc(res, "NOTIFIKASI pulihkan", error);
  res.json({ message: "Insiden dipulihkan" });
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