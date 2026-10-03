import { Router } from "express";
import { supabase } from "../lib/supabase";
import { requireAuth, requireRole, getSession } from "../lib/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const { id_yayasan } = getSession(req);
  const { data, error } = await supabase
    .from("geofence")
    .select("*, perangkat!inner(id_yayasan)")
    .eq("perangkat.id_yayasan", id_yayasan)
    .eq("is_active", true);
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

router.get("/:id_perangkat", async (req, res) => {
  const { id_yayasan } = getSession(req);

  const { data: perangkat } = await supabase
    .from("perangkat")
    .select("id_perangkat")
    .eq("id_perangkat", req.params.id_perangkat)
    .eq("id_yayasan", id_yayasan)
    .single();
  if (!perangkat) return res.status(404).json({ message: "Perangkat tidak ditemukan" });

  const { data, error } = await supabase
    .from("geofence")
    .select("*")
    .eq("id_perangkat", req.params.id_perangkat)
    .eq("is_active", true)
    .maybeSingle();
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

router.put("/:id_perangkat", requireRole("administrator"), async (req, res) => {
  const { id_yayasan } = getSession(req);
  const { nama_area, center_lat, center_long, radius_meter } = req.body;

  if (!nama_area?.trim()) return res.status(400).json({ message: "Nama area wajib diisi" });
  if (typeof center_lat !== "number" || typeof center_long !== "number") {
    return res.status(400).json({ message: "Titik pusat belum dipilih di peta" });
  }
  if (!radius_meter || radius_meter < 10) {
    return res.status(400).json({ message: "Radius minimal 10 meter" });
  }

  const { data: perangkat } = await supabase
    .from("perangkat")
    .select("id_perangkat")
    .eq("id_perangkat", req.params.id_perangkat)
    .eq("id_yayasan", id_yayasan)
    .single();
  if (!perangkat) return res.status(404).json({ message: "Perangkat tidak ditemukan" });

  const { data: existing } = await supabase
    .from("geofence")
    .select("id_geofence")
    .eq("id_perangkat", req.params.id_perangkat)
    .eq("is_active", true)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("geofence")
      .update({ nama_area, center_lat, center_long, radius_meter })
      .eq("id_geofence", existing.id_geofence)
      .select()
      .single();
    if (error) return res.status(400).json({ message: error.message });
    return res.json(data);
  }

  const { data, error } = await supabase
    .from("geofence")
    .insert({ id_perangkat: req.params.id_perangkat, nama_area, center_lat, center_long, radius_meter })
    .select()
    .single();
  if (error) return res.status(400).json({ message: error.message });
  res.status(201).json(data);
});

router.delete("/:id_perangkat", requireRole("administrator"), async (req, res) => {
  const { id_yayasan } = getSession(req);

  const { data: perangkat } = await supabase
    .from("perangkat")
    .select("id_perangkat")
    .eq("id_perangkat", req.params.id_perangkat)
    .eq("id_yayasan", id_yayasan)
    .single();
  if (!perangkat) return res.status(404).json({ message: "Perangkat tidak ditemukan" });

  const { error } = await supabase.from("geofence").delete().eq("id_perangkat", req.params.id_perangkat);
  if (error) return res.status(400).json({ message: error.message });
  res.status(204).send();
});

export default router;