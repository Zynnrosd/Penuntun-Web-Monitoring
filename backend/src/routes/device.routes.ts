// backend/src/routes/device.routes.ts

import { Request, Response, Router } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase";

const router = Router();

async function authenticateDevice(
  req: Request,
  res: Response
): Promise<string | null> {
  const deviceId = req.header("x-device-id");
  const deviceToken = req.header("x-device-token");

  if (!deviceId || !deviceToken) {
    res.status(401).json({
      message: "Identitas perangkat tidak lengkap",
    });

    return null;
  }

  const { data: perangkat, error } = await supabase
    .from("perangkat")
    .select("id_perangkat, device_token")
    .eq("id_perangkat", deviceId)
    .single();

  if (error || !perangkat) {
    res.status(401).json({
      message: "Perangkat tidak dikenali",
    });

    return null;
  }

  if (perangkat.device_token !== deviceToken) {
    res.status(401).json({
      message: "Token perangkat tidak valid",
    });

    return null;
  }

  return perangkat.id_perangkat;
}


router.post("/heartbeat", async (req, res) => {
  const deviceId = await authenticateDevice(req, res);

  if (!deviceId) {
    return;
  }

  const updateData: {
    status_online: boolean;
    last_active: string;
    baterai_terakhir?: number;
  } = {
    status_online: true,
    last_active: new Date().toISOString(),
  };

  if (
    typeof req.body?.battery === "number" &&
    req.body.battery >= 0 &&
    req.body.battery <= 100
  ) {
    updateData.baterai_terakhir = Math.round(
      req.body.battery
    );
  }

  const { data, error } = await supabase
    .from("perangkat")
    .update(updateData)
    .eq("id_perangkat", deviceId)
    .select(
      "id_perangkat, status_online, baterai_terakhir, last_active"
    )
    .single();

  if (error) {
    return res.status(500).json({
      message: error.message,
    });
  }

  return res.status(200).json({
    success: true,
    message: "Heartbeat diterima",
    perangkat: data,
  });
});


const locationSchema = z.object({
  latitude: z
    .number()
    .min(-90)
    .max(90),

  longitude: z
    .number()
    .min(-180)
    .max(180),

  accuracy: z
    .number()
    .nonnegative()
    .nullable()
    .optional(),
});


router.post("/location", async (req, res) => {
  const deviceId = await authenticateDevice(req, res);

  if (!deviceId) {
    return;
  }

  const parsed = locationSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Data lokasi tidak valid",
      errors: parsed.error.flatten(),
    });
  }

  const {
    latitude,
    longitude,
    accuracy,
  } = parsed.data;

  const waktuSekarang = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("perangkat")
    .update({
      lat_terakhir: latitude,
      long_terakhir: longitude,
      gps_accuracy: accuracy ?? null,
      location_updated_at: waktuSekarang,
    })
    .eq("id_perangkat", deviceId);

  if (updateError) {
    return res.status(500).json({
      message: updateError.message,
    });
  }

  const { data: lokasi, error: historyError } =
    await supabase
      .from("lokasi_perangkat")
      .insert({
        id_perangkat: deviceId,
        latitude,
        longitude,
        accuracy: accuracy ?? null,
        source: "PHONE",
        recorded_at: waktuSekarang,
      })
      .select()
      .single();

  if (historyError) {
    return res.status(500).json({
      message: historyError.message,
    });
  }

  console.log(
    `[GPS] ${deviceId} | ${latitude}, ${longitude} | accuracy=${accuracy ?? "-"}m`
  );

  return res.status(200).json({
    success: true,
    message: "Lokasi berhasil diperbarui",
    lokasi,
  });
});

export default router;