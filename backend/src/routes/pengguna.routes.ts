// backend/src/routes/pengguna.routes.ts

import { Router } from "express";
import { requireAuth, requireAktif, requireRole, getSession, db } from "../lib/auth";
import { balasGalat } from "../lib/galat";

const router = Router();
router.use(requireAuth, requireAktif);

const KOLOM = "id_tunanetra, id_yayasan, nama_tunanetra, alamat";

router.get("/", async (req, res) => {
  const { data, error } = await db(req).from("pengguna_tunanetra").select(KOLOM).order("nama_tunanetra");
  if (error) return balasGalat(res, "PENGGUNA daftar", error);
  res.json(data);
});

router.post("/", requireRole("ADMINISTRATOR"), async (req, res) => {
  const { nama_tunanetra, alamat } = req.body;
  if (typeof nama_tunanetra !== "string" || !nama_tunanetra.trim()) {
    return res.status(400).json({ message: "Nama pengguna wajib diisi" });
  }

  const { id_yayasan } = getSession(req);
  const { data, error } = await db(req)
    .from("pengguna_tunanetra")
    .insert({ nama_tunanetra: nama_tunanetra.trim(), alamat: alamat ?? null, id_yayasan })
    .select(KOLOM)
    .single();

  if (error) return balasGalat(res, "PENGGUNA tambah", error);
  res.status(201).json(data);
});

router.patch("/:id", requireRole("ADMINISTRATOR"), async (req, res) => {
  const { nama_tunanetra, alamat } = req.body;
  if (typeof nama_tunanetra !== "string" || !nama_tunanetra.trim()) {
    return res.status(400).json({ message: "Nama pengguna wajib diisi" });
  }

  const { data, error } = await db(req)
    .from("pengguna_tunanetra")
    .update({ nama_tunanetra: nama_tunanetra.trim(), alamat: alamat ?? null })
    .eq("id_tunanetra", req.params.id)
    .select(KOLOM)
    .maybeSingle();

  if (error) return balasGalat(res, "PENGGUNA ubah", error);
  if (!data) return res.status(404).json({ message: "Pengguna tidak ditemukan" });
  res.json(data);
});

router.delete("/:id", requireRole("ADMINISTRATOR"), async (req, res) => {
  const { error, count } = await db(req)
    .from("pengguna_tunanetra")
    .delete({ count: "exact" })
    .eq("id_tunanetra", req.params.id);

  if (error?.code === "23503") {
    return res.status(409).json({
      message: "Pengguna masih terpasang di sebuah perangkat. Lepas pemasangannya dahulu.",
    });
  }
  if (error) return balasGalat(res, "PENGGUNA hapus", error);
  if (!count) return res.status(404).json({ message: "Pengguna tidak ditemukan" });
  res.status(204).send();
});

export default router;