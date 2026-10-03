import { Router } from "express";
import { supabase } from "../lib/supabase";
import { requireAuth, requireRole, getSession } from "../lib/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const { id_yayasan } = getSession(req);
  const { data, error } = await supabase.from("perangkat").select("*").eq("id_yayasan", id_yayasan);
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

router.get("/:id/riwayat", async (req, res) => {
  const { id_yayasan } = getSession(req);

  const { data: perangkat } = await supabase
    .from("perangkat")
    .select("id_perangkat")
    .eq("id_perangkat", req.params.id)
    .eq("id_yayasan", id_yayasan)
    .single();
  if (!perangkat) return res.status(404).json({ message: "Perangkat tidak ditemukan" });

  const { data, error } = await supabase
    .from("tracking_data")
    .select("id_tracking, latitude, longitude, baterai, recorded_at")
    .eq("id_perangkat", req.params.id)
    .order("recorded_at", { ascending: false })
    .limit(200);

  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

router.post("/", requireRole("administrator"), async (req, res) => {
  const { id_yayasan } = getSession(req);
  const { id_perangkat } = req.body;
  if (!id_perangkat?.trim()) return res.status(400).json({ message: "ID Perangkat wajib diisi" });

  const { data: existing } = await supabase.from("perangkat").select("id_perangkat").eq("id_perangkat", id_perangkat).single();
  if (existing) return res.status(409).json({ message: "Serial number ini sudah terdaftar" });

  const { data, error } = await supabase.from("perangkat").insert({ id_perangkat, id_yayasan }).select().single();
  if (error) return res.status(400).json({ message: error.message });
  res.status(201).json(data);
});

router.patch("/:id/pairing", requireRole("administrator"), async (req, res) => {
  const { id_yayasan } = getSession(req);
  const { dipakai_oleh } = req.body;

  const { data: perangkatTarget } = await supabase
    .from("perangkat")
    .select("id_perangkat")
    .eq("id_perangkat", req.params.id)
    .eq("id_yayasan", id_yayasan)
    .single();
  if (!perangkatTarget) return res.status(404).json({ message: "Perangkat tidak ditemukan" });

  if (dipakai_oleh) {
    const { data: sudahDipakai } = await supabase
      .from("perangkat")
      .select("id_perangkat")
      .eq("dipakai_oleh", dipakai_oleh)
      .neq("id_perangkat", req.params.id)
      .single();
    if (sudahDipakai) {
      return res.status(409).json({
        message: `Pengguna ini sudah dipasangkan ke perangkat ${sudahDipakai.id_perangkat}. Lepas pemasangan itu dahulu.`,
      });
    }
  }

  const { data, error } = await supabase
    .from("perangkat")
    .update({ dipakai_oleh: dipakai_oleh || null })
    .eq("id_perangkat", req.params.id)
    .eq("id_yayasan", id_yayasan)
    .select()
    .single();
  if (error) return res.status(400).json({ message: error.message });
  res.json(data);
});

router.delete("/:id", requireRole("administrator"), async (req, res) => {
  const { id_yayasan } = getSession(req);
  const { error, count } = await supabase
    .from("perangkat")
    .delete({ count: "exact" })
    .eq("id_perangkat", req.params.id)
    .eq("id_yayasan", id_yayasan);
  if (error) return res.status(400).json({ message: error.message });
  if (!count) return res.status(404).json({ message: "Perangkat tidak ditemukan" });
  res.status(204).send();
});

export default router;