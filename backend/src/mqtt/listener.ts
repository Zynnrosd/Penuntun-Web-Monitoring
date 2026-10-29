// backend/src/mqtt/listener.ts
// PENUNTUN: heartbeat, GPS telemetry, AI detection.

import mqtt, { MqttClient } from "mqtt";

import { supabase } from "../lib/supabase";
import { isDiLuarZonaAman } from "../services/geofencing.service";
import { buatNotifikasiDarurat } from "../services/notifikasi.service";
import { env } from "../config/env";

// =========================================================
// TYPES
// =========================================================

interface TelemetryPayload {
  id_perangkat: string;
  latitude: number;
  longitude: number;
  // GPS NEO-6M tidak mengukur persentase baterai.
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

// =========================================================
// MQTT TOPICS
// =========================================================

const TOPIC_TELEMETRY = "penuntun/telemetry/#";
const TOPIC_DETECTION = "penuntun/detection/#";
const TOPIC_STATUS = "penuntun/status/#";

// Titik riwayat disimpan paling cepat sekali setiap 5 menit per perangkat.
// Lokasi terakhir di tabel perangkat tetap diperbarui setiap pesan GPS (~10 detik).
const TRACKING_INTERVAL_MS = 5 * 60 * 1000;

// Hindari dua pesan GPS bersamaan menciptakan dua baris riwayat.
const trackingSedangDiproses = new Set<string>();

// Hindari notifikasi geofence setiap 10 detik saat GPS berada
// di luar zona aman. Berlaku per perangkat selama backend hidup.
const GEOFENCE_COOLDOWN_MS = 5 * 60 * 1000;
const geofenceAlertTerakhir = new Map<string, number>();

// =========================================================
// VALIDASI PAYLOAD
// =========================================================

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
    (
      data.baterai == null ||
      (
        typeof data.baterai === "number" &&
        Number.isFinite(data.baterai) &&
        data.baterai >= 0 &&
        data.baterai <= 100
      )
    ) &&
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
      (typeof data.inference_ms === "number" &&
        Number.isFinite(data.inference_ms))) &&
    (data.ai_fps === undefined ||
      (typeof data.ai_fps === "number" && Number.isFinite(data.ai_fps))) &&
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

// Jangan proses payload jika ID pada topic berbeda dengan ID payload.
function topicMatchesDevice(topic: string, idPerangkat: string): boolean {
  const idTopic = topic.split("/")[2];
  return Boolean(idTopic) && idTopic === idPerangkat;
}

// =========================================================
// PROSES HEARTBEAT
// =========================================================

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

// =========================================================
// PROSES TELEMETRY GPS
// =========================================================

async function prosesTelemetry(data: TelemetryPayload): Promise<void> {
  const { id_perangkat, latitude, longitude, baterai } = data;
  const adaBaterai = typeof baterai === "number";

  console.log("\n========================================");
  console.log("[MQTT TELEMETRY]");
  console.log(`Perangkat : ${id_perangkat}`);
  console.log(`Latitude  : ${latitude}`);
  console.log(`Longitude : ${longitude}`);
  console.log(`Baterai   : ${adaBaterai ? `${baterai}%` : "Belum tersedia"}`);
  console.log("========================================");

  // Perbarui lokasi dan status. Jangan timpa baterai lama
  // ketika GPS tidak mengirim persentase baterai.
  const updatePerangkat = {
    lat_terakhir: latitude,
    long_terakhir: longitude,
    status_online: true,
    last_active: new Date().toISOString(),
    ...(typeof baterai === "number" ? { baterai_terakhir: baterai } : {}),
  };

  const { data: perangkat, error: perangkatError } = await supabase
    .from("perangkat")
    .update(updatePerangkat)
    .eq("id_perangkat", id_perangkat)
    .select("id_perangkat")
    .maybeSingle();

  if (perangkatError) {
    console.error("[MQTT] Gagal update perangkat:", perangkatError.message);
    return;
  }

  if (!perangkat) {
    console.warn(`[MQTT] Perangkat ${id_perangkat} belum terdaftar di database.`);
    return;
  }

  console.log(`[MQTT] Lokasi ${id_perangkat} berhasil diperbarui.`);

  // =====================================================
  // SIMPAN RIWAYAT PERJALANAN MAKSIMAL 1X PER 5 MENIT
  // =====================================================
  // Cek recorded_at terakhir di Supabase agar interval
  // tetap benar bahkan setelah backend di-restart.
  // GPS terbaru selalu di-update ke tabel "perangkat" di atas.

  if (!trackingSedangDiproses.has(id_perangkat)) {
    trackingSedangDiproses.add(id_perangkat);

    try {
      const { data: trackingTerakhir, error: cekTrackingError } =
        await supabase
          .from("tracking_data")
          .select("recorded_at")
          .eq("id_perangkat", id_perangkat)
          .order("recorded_at", { ascending: false })
          .limit(1)
          .maybeSingle();

      if (cekTrackingError) {
        console.error(
          `[GPS] Gagal mengecek riwayat ${id_perangkat}:`,
          cekTrackingError.message
        );
      } else {
        const sekarang = Date.now();
        const waktuTerakhir = trackingTerakhir
          ? Date.parse(trackingTerakhir.recorded_at)
          : null;

        if (waktuTerakhir !== null && !Number.isFinite(waktuTerakhir)) {
          console.error(
            `[GPS] recorded_at terakhir tidak valid untuk ${id_perangkat}. ` +
            "Penyimpanan dilewati agar tidak membuat data ganda."
          );
        } else if (
          waktuTerakhir === null ||
          sekarang - waktuTerakhir >= TRACKING_INTERVAL_MS
        ) {
          // GPS NEO-6M tidak menyertakan baterai. Jika tidak
          // ada nilainya, jangan mengirim angka baterai palsu.
          const dataTracking = {
            id_perangkat,
            latitude,
            longitude,
            ...(typeof baterai === "number" ? { baterai } : {}),
          };

          const { error: trackingError } = await supabase
            .from("tracking_data")
            .insert(dataTracking);

          if (trackingError) {
            console.error(
              `[GPS] Gagal menyimpan riwayat ${id_perangkat}:`,
              trackingError.message
            );
          } else {
            console.log(
              `[GPS] Riwayat perjalanan ${id_perangkat} disimpan (interval 5 menit).`
            );
          }
        }
      }
    } catch (error) {
      console.error(
        `[GPS] Error memproses riwayat ${id_perangkat}:`,
        error
      );
    } finally {
      trackingSedangDiproses.delete(id_perangkat);
    }
  }

  // Periksa zona aman aktif (fitur lama tetap dipertahankan).
  const { data: geofence, error: geofenceError } = await supabase
    .from("geofence")
    .select("*")
    .eq("id_perangkat", id_perangkat)
    .eq("is_active", true)
    .maybeSingle();

  if (geofenceError) {
    console.error("[GEOFENCE] Gagal mengambil zona aman:", geofenceError.message);
    return;
  }

  if (!geofence) return;

  if (!isDiLuarZonaAman(latitude, longitude, geofence)) {
    return;
  }

  const sekarang = Date.now();
  const terakhir = geofenceAlertTerakhir.get(id_perangkat) ?? 0;

  if (sekarang - terakhir < GEOFENCE_COOLDOWN_MS) {
    return;
  }

  // Tandai sebelum operasi async untuk menghindari notifikasi ganda.
  geofenceAlertTerakhir.set(id_perangkat, sekarang);

  try {
    console.log(`[GEOFENCE] ${id_perangkat} berada di luar zona aman.`);

    await buatNotifikasiDarurat({
      id_perangkat,
      tipe_event: "GEOFENCE",
      deskripsi: `Keluar dari zona aman "${geofence.nama_area}"`,
      latitude_sos: latitude,
      longitude_sos: longitude,
    });
  } catch (error) {
    geofenceAlertTerakhir.delete(id_perangkat);
    console.error("[GEOFENCE] Gagal membuat notifikasi:", error);
  }
}

// =========================================================
// PROSES AI DETECTION
// =========================================================

async function prosesDetection(data: DetectionPayload): Promise<void> {
  const { id_perangkat, class_name, confidence, inference_ms, ai_fps, timestamp } = data;

  console.log("\n========================================");
  console.log("[MQTT AI DETECTION]");
  console.log(`Perangkat  : ${id_perangkat}`);
  console.log(`Class      : ${class_name}`);
  console.log(`Confidence : ${(confidence * 100).toFixed(1)}%`);

  if (typeof inference_ms === "number") {
    console.log(`Inference  : ${inference_ms.toFixed(1)} ms`);
  }
  if (typeof ai_fps === "number") {
    console.log(`AI FPS     : ${ai_fps.toFixed(2)}`);
  }
  if (timestamp) {
    console.log(`Timestamp  : ${timestamp}`);
  }
  console.log("========================================");

  const { error } = await supabase
    .from("perangkat")
    .update({
      status_online: true,
      last_active: new Date().toISOString(),
    })
    .eq("id_perangkat", id_perangkat);

  if (error) {
    console.error("[MQTT DETECTION] Gagal update perangkat:", error.message);
  }
}

// =========================================================
// MQTT LISTENER
// =========================================================

export function mulaiMqttListener(): MqttClient | undefined {
  if (!env.MQTT_BROKER_URL) {
    console.log("[MQTT] MQTT_BROKER_URL belum diset. Listener tidak dijalankan.");
    return;
  }

  const username = process.env.MQTT_USERNAME;
  const password = process.env.MQTT_PASSWORD;

  console.log("\n========================================");
  console.log("       PENUNTUN MQTT CLIENT");
  console.log("========================================");
  console.log(`[MQTT] Broker: ${env.MQTT_BROKER_URL}`);

  const client = mqtt.connect(env.MQTT_BROKER_URL, {
    username,
    password,
    reconnectPeriod: 3000,
    connectTimeout: 10000,
    clean: true,
    clientId: `penuntun-backend-${Date.now()}`,
  });

  client.on("connect", () => {
    console.log("[MQTT] Terhubung ke broker.");

    client.subscribe(
      [TOPIC_STATUS, TOPIC_TELEMETRY, TOPIC_DETECTION],
      { qos: 0 },
      (error) => {
        if (error) {
          console.error("[MQTT] Gagal subscribe:", error.message);
          return;
        }

        console.log("[MQTT] Subscribe berhasil:");
        console.log(`       ${TOPIC_STATUS}`);
        console.log(`       ${TOPIC_TELEMETRY}`);
        console.log(`       ${TOPIC_DETECTION}`);
        console.log("========================================\n");
      }
    );
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
          console.error("[MQTT TELEMETRY] Payload tidak valid:", data);
          return;
        }
        if (!topicMatchesDevice(topic, data.id_perangkat)) {
          console.warn(`[MQTT TELEMETRY] ID topic dan payload berbeda: ${topic}`);
          return;
        }
        await prosesTelemetry(data);
        return;
      }

      if (topic.startsWith("penuntun/detection/")) {
        if (!isValidDetection(data)) {
          console.error("[MQTT DETECTION] Payload tidak valid:", data);
          return;
        }
        if (!topicMatchesDevice(topic, data.id_perangkat)) {
          console.warn(`[MQTT DETECTION] ID topic dan payload berbeda: ${topic}`);
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

  client.on("error", (error) => {
    console.error("[MQTT] Connection error:", error.message);
  });

  client.on("reconnect", () => {
    console.log("[MQTT] Mencoba reconnect...");
  });

  client.on("offline", () => {
    console.log("[MQTT] Broker offline / tidak dapat dijangkau.");
  });

  client.on("close", () => {
    console.log("[MQTT] Koneksi broker terputus.");
  });

  return client;
}
