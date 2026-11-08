import { Router } from "express";
import {
  requireAuth,
  requireAktif,
  requireRole,
  getSession,
  db,
} from "../lib/auth";
import { balasGalat, balasGalatRpc } from "../lib/galat";
import { awalHariIniWIB } from "../lib/waktu";

const router = Router();

router.use(requireAuth, requireAktif);

// =========================================================
// KOLOM DATA PERANGKAT
// =========================================================

const KOLOM =
  "id_perangkat, id_yayasan, dipakai_oleh, dipasang_oleh, dipasang_pada, " +
  "lat_terakhir, long_terakhir, lokasi_terakhir, baterai_terakhir, " +
  "tegangan_5v, undervoltage, daya_updated_at, " +
  "status_online, status_sos, last_active, " +
  "pengguna:pengguna_tunanetra!perangkat_pemakai_fk(nama_tunanetra)";

// =========================================================
// GET - DAFTAR PERANGKAT
// =========================================================

router.get("/", async (req, res) => {
  const { data, error } = await db(req)
    .from("perangkat")
    .select(KOLOM)
    .order("id_perangkat");

  if (error) {
    return balasGalat(res, "PERANGKAT daftar", error);
  }

  res.json(data);
});

// =========================================================
// GET - RIWAYAT PERJALANAN (TITIK HENTI HARI INI)
// =========================================================

router.get("/:id/riwayat", async (req, res) => {
  const { data, error } = await db(req)
    .from("tracking_data")
    .select(
      "id_tracking, latitude, longitude, baterai, recorded_at"
    )
    .eq("id_perangkat", req.params.id)
    .gte("recorded_at", awalHariIniWIB())
    .order("recorded_at", { ascending: true })
    .limit(200);

  if (error) {
    return balasGalat(res, "PERANGKAT riwayat", error);
  }

  res.json(data);
});

// =========================================================
// POST - TAMBAH PERANGKAT
// =========================================================

router.post(
  "/",
  requireRole("ADMINISTRATOR"),
  async (req, res) => {
    const { id_perangkat } = req.body;

    if (
      typeof id_perangkat !== "string" ||
      !id_perangkat.trim()
    ) {
      return res.status(400).json({
        message: "Serial number perangkat wajib diisi",
      });
    }

    const { id_yayasan } = getSession(req);

    const { data, error } = await db(req)
      .from("perangkat")
      .insert({
        id_perangkat: id_perangkat.trim(),
        id_yayasan,
      })
      .select(KOLOM)
      .single();

    if (error?.code === "23505") {
      return res.status(409).json({
        message: "Serial number ini sudah terdaftar",
      });
    }

    if (error) {
      return balasGalat(res, "PERANGKAT tambah", error);
    }

    res.status(201).json(data);
  }
);

// =========================================================
// PATCH - PAIRING PERANGKAT
// =========================================================

router.patch("/:id/pairing", async (req, res) => {
  const {
    dipakai_oleh,
    dipasang_pada_sebelumnya,
  } = req.body;

  if (
    dipakai_oleh != null &&
    typeof dipakai_oleh !== "string"
  ) {
    return res.status(400).json({
      message: "Pengguna tidak valid",
    });
  }

  const { data, error } = await db(req).rpc(
    "pasangkan_perangkat",
    {
      p_id_perangkat: req.params.id,
      p_id_tunanetra: dipakai_oleh ?? null,
      p_dipasang_pada_sebelumnya:
        dipasang_pada_sebelumnya ?? null,
    }
  );

  if (error) {
    return balasGalatRpc(
      res,
      "PERANGKAT pairing",
      error
    );
  }

  res.json(data);
});

// =========================================================
// DELETE - HAPUS PERANGKAT
// =========================================================

router.delete(
  "/:id",
  requireRole("ADMINISTRATOR"),
  async (req, res) => {
    const { error, count } = await db(req)
      .from("perangkat")
      .delete({ count: "exact" })
      .eq("id_perangkat", req.params.id);

    if (error) {
      return balasGalat(
        res,
        "PERANGKAT hapus",
        error
      );
    }

    if (!count) {
      return res.status(404).json({
        message: "Perangkat tidak ditemukan",
      });
    }

    res.status(204).send();
  }
);

export default router;