// backend/src/routes/gps.routes.ts

import { Router } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase";

const router = Router();

const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().nonnegative().nullable().optional(),
});

router.post("/location", async (req, res) => {
  const deviceId = req.header("x-device-id");
  const gpsToken = req.header("x-gps-token");

  if (!deviceId || !gpsToken) {
    return res.status(401).json({
      message: "Identitas GPS tidak lengkap",
    });
  }

  const { data: perangkat, error: perangkatError } =
    await supabase
      .from("perangkat")
      .select("id_perangkat, gps_token")
      .eq("id_perangkat", deviceId)
      .single();

  if (perangkatError || !perangkat) {
    return res.status(401).json({
      message: "Perangkat tidak ditemukan",
    });
  }

  if (perangkat.gps_token !== gpsToken) {
    return res.status(401).json({
      message: "Token GPS tidak valid",
    });
  }

  const parsed = locationSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Data lokasi tidak valid",
    });
  }

  const {
    latitude,
    longitude,
    accuracy,
  } = parsed.data;

  const waktu = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("perangkat")
    .update({
      lat_terakhir: latitude,
      long_terakhir: longitude,
      gps_accuracy: accuracy ?? null,
      location_updated_at: waktu,
    })
    .eq("id_perangkat", deviceId);

  if (updateError) {
    return res.status(500).json({
      message: updateError.message,
    });
  }

  const { error: historyError } = await supabase
    .from("lokasi_perangkat")
    .insert({
      id_perangkat: deviceId,
      latitude,
      longitude,
      accuracy: accuracy ?? null,
      source: "PHONE",
      recorded_at: waktu,
    });

  if (historyError) {
    return res.status(500).json({
      message: historyError.message,
    });
  }

  console.log(
    `[GPS PHONE] ${deviceId} | ${latitude}, ${longitude}`
  );

  return res.status(200).json({
    success: true,
    message: "Lokasi berhasil diperbarui",
    location_updated_at: waktu,
  });
});

export default router;