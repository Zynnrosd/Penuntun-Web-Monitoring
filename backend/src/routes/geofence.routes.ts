// backend/src/routes/geofence.routes.ts

import { Router, type Request, type Response } from "express";
import { requireAuth, requireAktif, requireRole, getSession, db } from "../lib/auth";
import { balasGalat } from "../lib/galat";

const router = Router();
router.use(requireAuth, requireAktif);

const RADIUS_MIN = 50;
const RADIUS_MAX = 20000;

const KOLOM = "id_geofence, id_yayasan, id_perangkat, nama_area, center_lat, center_long, radius_meter, is_active";

function periksaIsian(body: unknown) {
  const { nama_area, center_lat, center_long, radius_meter } = (body ?? {}) as Record<string, unknown>;

  if (typeof center_lat !== "number" || typeof center_long !== "number") {
    return "Titik pusat belum dipilih di peta";
  }
  if (center_lat < -90 || center_lat > 90 || center_long < -180 || center_long > 180) {
    return "Titik pusat di luar jangkauan koordinat";
  }
  if (typeof radius_meter !== "number" || !Number.isFinite(radius_meter)) {
    return "Radius wajib diisi";
  }
  if (radius_meter < RADIUS_MIN) return `Radius minimal ${RADIUS_MIN} meter`;
  if (radius_meter > RADIUS_MAX) return `Radius maksimal ${RADIUS_MAX / 1000} kilometer`;
  if (nama_area != null && typeof nama_area !== "string") return "Nama area tidak valid";

  return null;
}

function nilaiZona(body: Record<string, unknown>) {
  return {
    nama_area: typeof body.nama_area === "string" && body.nama_area.trim() ? body.nama_area.trim() : null,
    center_lat: body.center_lat as number,
    center_long: body.center_long as number,
    radius_meter: Math.round(body.radius_meter as number),
  };
}

router.get("/", async (req, res) => {
  const { data, error } = await db(req).from("geofence").select(KOLOM).eq("is_active", true).order("id_geofence");
  if (error) return balasGalat(res, "GEOFENCE daftar", error);
  res.json(data);
});

// Simpan zona: ubah baris yang sudah ada, atau buat baru bila belum ada.
// Sengaja tanpa upsert agar tidak bergantung pada bentuk unique index di database.
async function simpanZona(req: Request, res: Response, idPerangkat: string | null, konteks: string) {
  const salah = periksaIsian(req.body);
  if (salah) return res.status(400).json({ message: salah });

  const { id_yayasan } = getSession(req);
  const isian = { is_active: true, ...nilaiZona(req.body) };

  const cari = db(req).from("geofence").select("id_geofence");
  const { data: ada, error: galatCari } = await (
    idPerangkat === null ? cari.is("id_perangkat", null) : cari.eq("id_perangkat", idPerangkat)
  )
    .order("id_geofence")
    .limit(1)
    .maybeSingle();

  if (galatCari) return balasGalat(res, `${konteks} (cari)`, galatCari);

  const { data, error } = ada
    ? await db(req).from("geofence").update(isian).eq("id_geofence", ada.id_geofence).select(KOLOM).single()
    : await db(req)
        .from("geofence")
        .insert({ id_yayasan, id_perangkat: idPerangkat, ...isian })
        .select(KOLOM)
        .single();

  if (error) return balasGalat(res, konteks, error);
  res.json(data);
}

// Mengubah zona hanya untuk Administrator. RLS di database juga membatasi hal yang sama.
router.put("/yayasan", requireRole("ADMINISTRATOR"), (req, res) =>
  simpanZona(req, res, null, "GEOFENCE simpan zona yayasan")
);

router.put("/:id_perangkat", requireRole("ADMINISTRATOR"), (req, res) =>
  simpanZona(req, res, String(req.params.id_perangkat), "GEOFENCE simpan zona perangkat")
);

router.delete("/yayasan", requireRole("ADMINISTRATOR"), async (req, res) => {
  const { error, count } = await db(req)
    .from("geofence")
    .delete({ count: "exact" })
    .is("id_perangkat", null);

  if (error) return balasGalat(res, "GEOFENCE hapus zona yayasan", error);
  if (!count) return res.status(404).json({ message: "Zona yayasan belum diatur" });
  res.status(204).send();
});

router.delete("/:id_perangkat", requireRole("ADMINISTRATOR"), async (req, res) => {
  const { error, count } = await db(req)
    .from("geofence")
    .delete({ count: "exact" })
    .eq("id_perangkat", req.params.id_perangkat);

  if (error) return balasGalat(res, "GEOFENCE hapus zona perangkat", error);
  if (!count) return res.status(404).json({ message: "Perangkat ini belum punya zona sendiri" });
  res.status(204).send();
});

export default router;