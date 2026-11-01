// backend/src/mqtt/listener.ts

import mqtt, { MqttClient } from "mqtt";

import { supabase } from "../lib/supabase";
import { isDiLuarZonaAman } from "../services/geofencing.service";
import { buatNotifikasiDarurat } from "../services/notifikasi.service";
import { env } from "../config/env";

interface TelemetryPayload {
  id_perangkat: string;
  latitude: number;
  longitude: number;
  baterai?: number | null;
  timestamp?: string;
}

interface DetectionPayload {
  id_perangkat: string;
  class_name: string;
  confidence: number;
  inference_ms?: number;
  ai_fps?: number;
  timestamp?: string;
}

interface HeartbeatPayload {
  id_perangkat: string;
  status: "online";
  timestamp?: string;
}

const TOPIC_TELEMETRY = "penuntun/telemetry/#";
const TOPIC_DETECTION = "penuntun/detection/#";
const TOPIC_STATUS = "penuntun/status/#";

const TRACKING_INTERVAL_MS = 5 * 60 * 1000;
const trackingSedangDiproses = new Set<string>();

const GEOFENCE_COOLDOWN_MS = 5 * 60 * 1000;
const geofenceAlertTerakhir = new Map<string, number>();

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidTelemetry(data: unknown): data is TelemetryPayload {
  if (!isObject(data)) return false;

  return (
    validId(data.id_perangkat) &&
    typeof data.latitude === "number" &&
    Number.isFinite(data.latitude) &&
    data.latitude >= -90 &&
    data.latitude <= 90 &&
    typeof data.longitude === "number" &&
    Number.isFinite(data.longitude) &&
    data.longitude >= -180 &&
    data.longitude <= 180 &&
    (data.baterai == null ||
      (typeof data.baterai === "number" &&
        Number.isFinite(data.baterai) &&
        data.baterai >= 0 &&
        data.baterai <= 100)) &&
    (data.timestamp === undefined || typeof data.timestamp === "string")
  );
}

function isValidDetection(data: unknown): data is DetectionPayload {
  if (!isObject(data)) return false;

  return (
    validId(data.id_perangkat) &&
    typeof data.class_name === "string" &&
    data.class_name.trim().length > 0 &&
    typeof data.confidence === "number" &&
    Number.isFinite(data.confidence) &&
    data.confidence >= 0 &&
    data.confidence <= 1 &&
    (data.inference_ms === undefined ||
      (typeof data.inference_ms === "number" && Number.isFinite(data.inference_ms))) &&
    (data.ai_fps === undefined || (typeof data.ai_fps === "number" && Number.isFinite(data.ai_fps))) &&
    (data.timestamp === undefined || typeof data.timestamp === "string")
  );
}

function isValidHeartbeat(data: unknown): data is HeartbeatPayload {
  return (
    isObject(data) &&
    validId(data.id_perangkat) &&
    data.status === "online" &&
    (data.timestamp === undefined || typeof data.timestamp === "string")
  );
}

function topicMatchesDevice(topic: string, idPerangkat: string): boolean {
  const idTopic = topic.split("/")[2];
  return Boolean(idTopic) && idTopic === idPerangkat;
}

async function prosesHeartbeat(data: HeartbeatPayload): Promise<void> {
  const { id_perangkat } = data;

  const { data: perangkat, error } = await supabase
    .from("perangkat")
    .update({
      status_online: true,
      last_active: new Date().toISOString(),
    })
    .eq("id_perangkat", id_perangkat)
    .select("id_perangkat")
    .maybeSingle();

  if (error) {
    console.error(`[HEARTBEAT] Gagal update ${id_perangkat}:`, error.message);
    return;
  }

  if (!perangkat) {
    console.warn(`[HEARTBEAT] Perangkat ${id_perangkat} tidak ditemukan di database.`);
    return;
  }

  console.log(`[HEARTBEAT] ${id_perangkat} → ONLINE`);
}

async function prosesTelemetry(data: TelemetryPayload): Promise<void> {
  const { id_perangkat, latitude, longitude, baterai } = data;
  const adaBaterai = typeof baterai === "number";

  console.log(
    `[TELEMETRY] ${id_perangkat} ${latitude}, ${longitude} · baterai ${adaBaterai ? `${baterai}%` : "belum tersedia"}`
  );

  // GPS NEO-6M tidak mengukur baterai. Jangan timpa nilai lama dengan null.
  const updatePerangkat = {
    lat_terakhir: latitude,
    long_terakhir: longitude,
    status_online: true,
    last_active: new Date().toISOString(),
    ...(adaBaterai ? { baterai_terakhir: baterai } : {}),
  };

  const { data: perangkat, error: perangkatError } = await supabase
    .from("perangkat")
    .update(updatePerangkat)
    .eq("id_perangkat", id_perangkat)
    .select("id_perangkat, id_yayasan")
    .maybeSingle();

  if (perangkatError) {
    console.error("[TELEMETRY] Gagal update perangkat:", perangkatError.message);
    return;
  }

  if (!perangkat) {
    console.warn(`[TELEMETRY] Perangkat ${id_perangkat} belum terdaftar di database.`);
    return;
  }

  await simpanRiwayat(perangkat.id_yayasan, data);
  await periksaZonaAman(perangkat.id_yayasan, data);
}

// Lokasi terakhir diperbarui tiap pesan, tetapi titik riwayat paling cepat
// sekali per 5 menit. Ambang dibaca dari database agar tetap benar setelah restart.
async function simpanRiwayat(idYayasan: string, data: TelemetryPayload): Promise<void> {
  const { id_perangkat, latitude, longitude, baterai } = data;

  if (trackingSedangDiproses.has(id_perangkat)) return;
  trackingSedangDiproses.add(id_perangkat);

  try {
    const { data: terakhir, error } = await supabase
      .from("tracking_data")
      .select("recorded_at")
      .eq("id_perangkat", id_perangkat)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(`[RIWAYAT] Gagal mengecek riwayat ${id_perangkat}:`, error.message);
      return;
    }

    const waktuTerakhir = terakhir ? Date.parse(terakhir.recorded_at) : null;

    if (waktuTerakhir !== null && !Number.isFinite(waktuTerakhir)) {
      console.error(`[RIWAYAT] recorded_at ${id_perangkat} tidak valid. Penyimpanan dilewati.`);
      return;
    }
    if (waktuTerakhir !== null && Date.now() - waktuTerakhir < TRACKING_INTERVAL_MS) return;

    const { error: galatSimpan } = await supabase.from("tracking_data").insert({
      id_perangkat,
      id_yayasan: idYayasan,
      latitude,
      longitude,
      ...(typeof baterai === "number" ? { baterai } : {}),
    });

    if (galatSimpan) {
      console.error(`[RIWAYAT] Gagal menyimpan ${id_perangkat}:`, galatSimpan.message);
      return;
    }

    console.log(`[RIWAYAT] Titik perjalanan ${id_perangkat} disimpan.`);
  } catch (error) {
    console.error(`[RIWAYAT] Error memproses ${id_perangkat}:`, error);
  } finally {
    trackingSedangDiproses.delete(id_perangkat);
  }
}

async function periksaZonaAman(idYayasan: string, data: TelemetryPayload): Promise<void> {
  const { id_perangkat, latitude, longitude } = data;

  // Zona khusus perangkat menang atas zona bawaan yayasan (id_perangkat null).
  const { data: zona, error } = await supabase
    .from("geofence")
    .select("id_perangkat, nama_area, center_lat, center_long, radius_meter")
    .eq("id_yayasan", idYayasan)
    .eq("is_active", true)
    .or(`id_perangkat.eq.${id_perangkat},id_perangkat.is.null`);

  if (error) {
    console.error("[GEOFENCE] Gagal mengambil zona aman:", error.message);
    return;
  }

  const geofence = zona?.find((z) => z.id_perangkat === id_perangkat) ?? zona?.[0];
  if (!geofence) return;
  if (!isDiLuarZonaAman(latitude, longitude, geofence)) return;

  const sekarang = Date.now();
  if (sekarang - (geofenceAlertTerakhir.get(id_perangkat) ?? 0) < GEOFENCE_COOLDOWN_MS) return;

  // Ditandai sebelum operasi async agar pesan beruntun tidak membuat notifikasi ganda.
  geofenceAlertTerakhir.set(id_perangkat, sekarang);

  try {
    console.log(`[GEOFENCE] ${id_perangkat} berada di luar zona aman.`);

    await buatNotifikasiDarurat({
      id_perangkat,
      tipe_event: "GEOFENCE",
      deskripsi: `Keluar dari zona aman${geofence.nama_area ? ` "${geofence.nama_area}"` : ""}`,
      latitude_sos: latitude,
      longitude_sos: longitude,
    });
  } catch (galat) {
    geofenceAlertTerakhir.delete(id_perangkat);
    console.error("[GEOFENCE] Gagal membuat notifikasi:", galat);
  }
}

async function prosesDetection(data: DetectionPayload): Promise<void> {
  const { id_perangkat, class_name, confidence, inference_ms, ai_fps } = data;

  console.log(
    `[DETEKSI] ${id_perangkat} ${class_name} ${(confidence * 100).toFixed(1)}%` +
      (typeof inference_ms === "number" ? ` · ${inference_ms.toFixed(1)} ms` : "") +
      (typeof ai_fps === "number" ? ` · ${ai_fps.toFixed(2)} fps` : "")
  );

  // Deteksi juga membuktikan perangkat hidup, cadangan bila heartbeat terlambat.
  const { error } = await supabase
    .from("perangkat")
    .update({
      status_online: true,
      last_active: new Date().toISOString(),
    })
    .eq("id_perangkat", id_perangkat);

  if (error) {
    console.error("[DETEKSI] Gagal update perangkat:", error.message);
  }
}

export function mulaiMqttListener(): MqttClient | undefined {
  if (!env.MQTT_BROKER_URL) {
    console.log("[MQTT] MQTT_BROKER_URL belum diset. Listener tidak dijalankan.");
    return;
  }

  console.log(`[MQTT] Menyambung ke broker: ${env.MQTT_BROKER_URL}`);

  const client = mqtt.connect(env.MQTT_BROKER_URL, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    reconnectPeriod: 3000,
    connectTimeout: 10000,
    clean: true,
    clientId: `penuntun-backend-${Date.now()}`,
  });

  client.on("connect", () => {
    console.log("[MQTT] Terhubung ke broker.");

    client.subscribe([TOPIC_STATUS, TOPIC_TELEMETRY, TOPIC_DETECTION], { qos: 0 }, (error) => {
      if (error) {
        console.error("[MQTT] Gagal subscribe:", error.message);
        return;
      }
      console.log(`[MQTT] Subscribe: ${TOPIC_STATUS}, ${TOPIC_TELEMETRY}, ${TOPIC_DETECTION}`);
    });
  });

  client.on("message", async (topic, payload) => {
    try {
      let data: unknown;

      try {
        data = JSON.parse(payload.toString());
      } catch {
        console.error(`[MQTT] Payload bukan JSON valid dari ${topic}`);
        return;
      }

      if (!isObject(data)) {
        console.error(`[MQTT] Payload harus berupa objek JSON: ${topic}`);
        return;
      }

      if (topic.startsWith("penuntun/status/")) {
        if (!isValidHeartbeat(data)) {
          console.error("[HEARTBEAT] Payload tidak valid:", data);
          return;
        }
        if (!topicMatchesDevice(topic, data.id_perangkat)) {
          console.warn(`[HEARTBEAT] ID topic dan payload berbeda: ${topic}`);
          return;
        }
        await prosesHeartbeat(data);
        return;
      }

      if (topic.startsWith("penuntun/telemetry/")) {
        if (!isValidTelemetry(data)) {
          console.error("[TELEMETRY] Payload tidak valid:", data);
          return;
        }
        if (!topicMatchesDevice(topic, data.id_perangkat)) {
          console.warn(`[TELEMETRY] ID topic dan payload berbeda: ${topic}`);
          return;
        }
        await prosesTelemetry(data);
        return;
      }

      if (topic.startsWith("penuntun/detection/")) {
        if (!isValidDetection(data)) {
          console.error("[DETEKSI] Payload tidak valid:", data);
          return;
        }
        if (!topicMatchesDevice(topic, data.id_perangkat)) {
          console.warn(`[DETEKSI] ID topic dan payload berbeda: ${topic}`);
          return;
        }
        await prosesDetection(data);
        return;
      }

      console.warn(`[MQTT] Topic tidak dikenal: ${topic}`);
    } catch (error) {
      console.error("[MQTT] Gagal memproses message:", error);
    }
  });

  client.on("error", (error) => console.error("[MQTT] Connection error:", error.message));
  client.on("reconnect", () => console.log("[MQTT] Mencoba reconnect..."));
  client.on("offline", () => console.log("[MQTT] Broker offline / tidak dapat dijangkau."));
  client.on("close", () => console.log("[MQTT] Koneksi broker terputus."));

  return client;
}