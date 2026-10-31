// backend/src/routes/pengaturan.routes.ts

import { Router } from "express";
import { requireAuth, requireAktif, getSession, db } from "../lib/auth";

const router = Router();
router.use(requireAuth, requireAktif);

router.get("/profil", async (req, res) => {
  const { id, role, status } = getSession(req);

  const { data, error } = await db(req)
    .from("administrators")
    .select("nama_staf, email, no_wa, yayasan:id_yayasan(nama_yayasan, kota_yayasan)")
    .eq("id_admin", id)
    .maybeSingle();

  if (error || !data) {
    console.error("[PENGATURAN] Gagal memuat profil:", error);
    return res.status(500).json({ message: "Gagal memuat profil" });
  }

  res.json({ ...data, role, status });
});

router.patch("/profil", async (req, res) => {
  const { nama_staf, no_wa } = req.body;
  if (!nama_staf?.trim()) return res.status(400).json({ message: "Nama wajib diisi" });

  const { error } = await db(req).rpc("ubah_profil_saya", {
    p_nama: nama_staf,
    p_no_wa: no_wa ?? null,
  });

  if (error) {
    if (error.code === "23514") {
      return res.status(400).json({
        message: "Format nomor WhatsApp tidak valid. Gunakan format +62xxxxxxxxx",
      });
    }
    console.error("[PENGATURAN] Gagal menyimpan profil:", error);
    return res.status(400).json({ message: "Gagal menyimpan profil" });
  }

  res.json({ message: "Profil tersimpan" });
});

export default router;