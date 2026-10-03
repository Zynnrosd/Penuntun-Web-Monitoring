import { Router } from "express";
import { supabase } from "../lib/supabase";
import { requireAuth, getSession } from "../lib/auth";
import { buatNotifikasiDarurat } from "../services/notifikasi.service";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const { id_yayasan } = getSession(req);
  const { data, error } = await supabase
    .from("notifikasi")
    .select("*, perangkat!inner(id_yayasan), notifikasi_delivery(status, sent_at)")
    .eq("perangkat.id_yayasan", id_yayasan)
    .order("occurred_at", { ascending: false });
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

router.post("/", async (req, res) => {
  try {
    const notif = await buatNotifikasiDarurat(req.body);
    res.status(201).json(notif);
  } catch (err) {
    res.status(400).json({ message: err instanceof Error ? err.message : "Gagal membuat notifikasi" });
  }
});

router.patch("/:id/selesai", async (req, res) => {
  const { id_yayasan } = getSession(req);

  const { data: milik } = await supabase
    .from("notifikasi")
    .select("id_notifikasi, perangkat!inner(id_yayasan)")
    .eq("id_notifikasi", req.params.id)
    .eq("perangkat.id_yayasan", id_yayasan)
    .single();
  if (!milik) return res.status(404).json({ message: "Notifikasi tidak ditemukan" });

  const { data, error } = await supabase
    .from("notifikasi")
    .update({ status: "SELESAI" })
    .eq("id_notifikasi", req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ message: error.message });
  res.json(data);
});

export default router;