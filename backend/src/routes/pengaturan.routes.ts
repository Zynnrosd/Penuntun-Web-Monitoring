//backend/src/routes/pengaturan.routes.ts

import { Router } from "express";
import { supabase } from "../lib/supabase";
import { requireAuth, requireRole, getSession } from "../lib/auth";

const router = Router();
router.use(requireAuth);

// Profil akun sendiri — semua role boleh lihat & ubah nama tampilan mereka
router.get("/profil", async (req, res) => {
  const { id } = getSession(req);
  const { data, error } = await supabase
    .from("administrators")
    .select("nama_staf, email, no_wa, role, yayasan:id_yayasan(nama_yayasan)")
    .eq("id_admin", id)
    .single();
  if (error || !data) return res.status(400).json({ message: error?.message ?? "Profil tidak ditemukan" });
  res.json(data);
});

router.patch("/profil", async (req, res) => {
  const { id } = getSession(req);
  const { nama_staf } = req.body;
  if (!nama_staf?.trim()) return res.status(400).json({ message: "Nama wajib diisi" });

  const { data, error } = await supabase
    .from("administrators")
    .update({ nama_staf: nama_staf.trim() })
    .eq("id_admin", id)
    .select()
    .single();
  if (error) return res.status(400).json({ message: error.message });
  res.json(data);
});

// Routing WhatsApp untuk SOS — Administrator only
router.get("/whatsapp", requireRole("administrator"), async (req, res) => {
  const { id } = getSession(req);
  const { data, error } = await supabase.from("administrators").select("no_wa").eq("id_admin", id).single();
  if (error || !data) return res.status(400).json({ message: error?.message ?? "Gagal memuat" });
  res.json(data);
});

router.patch("/whatsapp", requireRole("administrator"), async (req, res) => {
  const { id } = getSession(req);
  const { no_wa } = req.body;
  if (!/^\+62[0-9]{9,13}$/.test(no_wa)) {
    return res.status(400).json({ message: "Nomor harus diawali +62 dan berisi 9–13 digit" });
  }
  const { data, error } = await supabase.from("administrators").update({ no_wa }).eq("id_admin", id).select().single();
  if (error) return res.status(400).json({ message: error.message });
  res.json(data);
});

export default router;