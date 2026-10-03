import { Router } from "express";
import { supabase } from "../lib/supabase";
import { requireAuth, requireRole, getSession } from "../lib/auth";

const router = Router();
router.use(requireAuth, requireRole("administrator"));

router.get("/", async (req, res) => {
  const { id_yayasan } = getSession(req);
  const { data, error } = await supabase.from("pengguna_tunanetra").select("*").eq("id_yayasan", id_yayasan);
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

router.post("/", async (req, res) => {
  const { id_yayasan } = getSession(req);
  const { nama_tunanetra, alamat } = req.body;
  if (!nama_tunanetra?.trim()) return res.status(400).json({ message: "Nama wajib diisi" });

  const { data, error } = await supabase
    .from("pengguna_tunanetra")
    .insert({ nama_tunanetra: nama_tunanetra.trim(), alamat, id_yayasan })
    .select()
    .single();
  if (error) return res.status(400).json({ message: error.message });
  res.status(201).json(data);
});

router.patch("/:id", async (req, res) => {
  const { id_yayasan } = getSession(req);
  const { nama_tunanetra, alamat } = req.body;
  if (!nama_tunanetra?.trim()) return res.status(400).json({ message: "Nama wajib diisi" });

  const { data, error } = await supabase
    .from("pengguna_tunanetra")
    .update({ nama_tunanetra: nama_tunanetra.trim(), alamat })
    .eq("id_tunanetra", req.params.id)
    .eq("id_yayasan", id_yayasan)
    .select()
    .single();

  if (error) return res.status(400).json({ message: error.message });
  if (!data) return res.status(404).json({ message: "Pengguna tidak ditemukan" });
  res.json(data);
});

router.delete("/:id", async (req, res) => {
  const { id_yayasan } = getSession(req);

  const { data: target } = await supabase
    .from("pengguna_tunanetra")
    .select("id_tunanetra")
    .eq("id_tunanetra", req.params.id)
    .eq("id_yayasan", id_yayasan)
    .single();
  if (!target) return res.status(404).json({ message: "Pengguna tidak ditemukan" });

  const { data: masihTerpasang } = await supabase
    .from("perangkat")
    .select("id_perangkat")
    .eq("dipakai_oleh", req.params.id)
    .single();
  if (masihTerpasang) {
    return res.status(409).json({
      message: `Pengguna masih terhubung ke perangkat ${masihTerpasang.id_perangkat}. Lepas pemasangan dahulu.`,
    });
  }

  const { error } = await supabase
    .from("pengguna_tunanetra")
    .delete()
    .eq("id_tunanetra", req.params.id)
    .eq("id_yayasan", id_yayasan);
  if (error) return res.status(400).json({ message: error.message });
  res.status(204).send();
});

export default router;