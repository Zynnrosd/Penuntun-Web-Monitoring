import mqtt from "mqtt";
import { supabase } from "../lib/supabase";
import { isDiLuarZonaAman } from "../services/geofencing.service";
import { buatNotifikasiDarurat } from "../services/notifikasi.service";
import { env } from "../config/env";

export function mulaiMqttListener() {
  if (!env.MQTT_BROKER_URL) {
    console.log("MQTT_BROKER_URL belum diset — listener MQTT tidak dijalankan.");
    return;
  }

  const client = mqtt.connect(env.MQTT_BROKER_URL);

  client.on("connect", () => {
    console.log("MQTT terhubung, subscribe topic telemetry...");
    client.subscribe("penuntun/telemetry/#");
  });

  client.on("message", async (_topic, payload) => {
    try {
      const data = JSON.parse(payload.toString());
      const { id_perangkat, latitude, longitude, baterai } = data;

      await supabase
        .from("perangkat")
        .update({
          lat_terakhir: latitude,
          long_terakhir: longitude,
          baterai_terakhir: baterai,
          status_online: true,
          last_active: new Date().toISOString(),
        })
        .eq("id_perangkat", id_perangkat);

      await supabase.from("tracking_data").insert({ id_perangkat, latitude, longitude, baterai });

      const { data: geofence } = await supabase
        .from("geofence")
        .select("*")
        .eq("id_perangkat", id_perangkat)
        .eq("is_active", true)
        .maybeSingle();

      if (geofence && isDiLuarZonaAman(latitude, longitude, geofence)) {
        await buatNotifikasiDarurat({
          id_perangkat,
          tipe_event: "GEOFENCE",
          deskripsi: `Keluar dari zona aman "${geofence.nama_area}"`,
          latitude_sos: latitude,
          longitude_sos: longitude,
        });
      }
    } catch (err) {
      console.error("Gagal memproses telemetri MQTT:", err);
    }
  });

  return client;
}