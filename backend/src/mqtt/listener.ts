// backend/src/mqtt/listener.ts
// PENUNTUN: heartbeat, GPS telemetry, AI detection, tombol SOS.

import mqtt, { MqttClient } from "mqtt";

import { supabase } from "../lib/supabase";
import { hitungJarakMeter, isDiLuarZonaAman } from "../services/geofencing.service";
import { awalHariIniWIB } from "../lib/waktu";
import { buatNotifikasiDarurat } from "../services/notifikasi.service";
import { env } from "../config/env";

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

interface SosPayload {
  id_perangkat: string;
  // Lokasi bisa kosong bila GPS belum mendapat fix saat tombol ditekan.
  latitude?: number | null;
  longitude?: number | null;
  // Waktu tombol ditekan. Penting bila perangkat sempat offline (C200 Tabel 2.4).
  timestamp?: string;
}

interface HeartbeatPayload {
  id_perangkat: string;
  status: "online";
  timestamp?: string;
}

interface PowerPayload {
  id_perangkat: string;
  tegangan_5v: number;
  undervoltage: boolean;
  timestamp?: string;
}

const TOPIC_TELEMETRY = "penuntun/telemetry/#";
const TOPIC_DETECTION = "penuntun/detection/#";
const TOPIC_STATUS = "penuntun/status/#";
// USULAN, belum disepakati dengan tim perangkat.
const TOPIC_SOS = "penuntun/sos/#";
const TOPIC_POWER = "penuntun/power/#";

// Titik henti: tongkat diam minimal 2 menit dalam radius 20 m
// (GPS NEO-6M bisa bergeser beberapa meter walau diam).
const RADIUS_DIAM_METER = 20;
const DURASI_DIAM_MS = 2 * 60 * 1000;
const JEDA_GPS_MAKS_MS = 60 * 1000;

type PosisiDiam = {
  lat: number;
  lon: number;
  sejak: number;
  terakhirDiterima: number;
  tercatat: boolean;
};
const posisiDiam = new Map<string, PosisiDiam>();

// Hindari notifikasi geofence setiap 10 detik saat GPS berada
// di luar zona aman. Berlaku per perangkat selama backend hidup.
const GEOFENCE_COOLDOWN_MS = 5 * 60 * 1000;
const geofenceAlertTerakhir = new Map<string, number>();

// Validasi payload: data dari tongkat tidak langsung dipercaya, setiap kolom diperiksa tipenya.
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

function isValidSos(data: unknown): data is SosPayload {
  if (!isObject(data) || !validId(data.id_perangkat)) return false;

  const koordinatValid = (nilai: unknown, batas: number) =>
    nilai == null || (typeof nilai === "number" && Number.isFinite(nilai) && Math.abs(nilai) <= batas);

  return (
    koordinatValid(data.latitude, 90) &&
    koordinatValid(data.longitude, 180) &&
    (data.timestamp === undefined || typeof data.timestamp === "string")
  );
}

function isValidPower(data: unknown): data is PowerPayload {
  return (
    isObject(data) &&
    validId(data.id_perangkat) &&
    typeof data.tegangan_5v === "number" &&
    Number.isFinite(data.tegangan_5v) &&
    data.tegangan_5v >= 0 &&
    data.tegangan_5v <= 7 &&
    typeof data.undervoltage === "boolean" &&
    (data.timestamp === undefined || typeof data.timestamp === "string")
  );
}

// Jangan proses payload jika ID pada topic berbeda dengan ID payload.
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

async function simpanTitikHenti(
  id_perangkat: string,
  id_yayasan: string,
  diam: PosisiDiam,
  baterai?: number,
): Promise<boolean> {
  const awalHari = awalHariIniWIB();

  // Cegah titik ganda di tempat yang sama setelah backend restart.
  const { data: terakhir, error: cekError } = await supabase
    .from("tracking_data")
    .select("latitude, longitude")
    .eq("id_perangkat", id_perangkat)
    .gte("recorded_at", awalHari)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cekError) {
    console.error(`[GPS] Gagal mengecek titik henti ${id_perangkat}:`, cekError.message);
    return false;
  }

  if (terakhir && hitungJarakMeter(terakhir.latitude, terakhir.longitude, diam.lat, diam.lon) <= RADIUS_DIAM_METER) {
    return true;
  }

  const { error: insertError } = await supabase.from("tracking_data").insert({
    id_perangkat,
    id_yayasan,
    latitude: diam.lat,
    longitude: diam.lon,
    recorded_at: new Date(Math.max(diam.sejak, Date.parse(awalHari))).toISOString(),
    ...(baterai !== undefined ? { baterai } : {}),
  });

  if (insertError) {
    console.error(`[GPS] Gagal menyimpan titik henti ${id_perangkat}:`, insertError.message);
    return false;
  }

  console.log(`[GPS] Titik henti ${id_perangkat} disimpan.`);

  // Reset harian: hapus titik sebelum 00.00 WIB.
  const { error: hapusError } = await supabase
    .from("tracking_data")
    .delete()
    .eq("id_perangkat", id_perangkat)
    .lt("recorded_at", awalHari);

  if (hapusError) {
    console.error(`[GPS] Gagal menghapus riwayat lama ${id_perangkat}:`, hapusError.message);
  }

  return true;
}

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
    .select("id_perangkat, id_yayasan")
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

  // Catat titik henti: pindah > 20 m atau GPS terputus = hitungan diam diulang.
  const sekarangMs = Date.now();
  const diam = posisiDiam.get(id_perangkat);

  const mulaiUlang =
    !diam ||
    sekarangMs - diam.terakhirDiterima > JEDA_GPS_MAKS_MS ||
    hitungJarakMeter(diam.lat, diam.lon, latitude, longitude) > RADIUS_DIAM_METER;

  if (mulaiUlang) {
    posisiDiam.set(id_perangkat, {
      lat: latitude,
      lon: longitude,
      sejak: sekarangMs,
      terakhirDiterima: sekarangMs,
      tercatat: false,
    });
  } else {
    diam.terakhirDiterima = sekarangMs;
  }

  if (diam && !mulaiUlang && !diam.tercatat && sekarangMs - diam.sejak >= DURASI_DIAM_MS) {
    // Ditandai sebelum await agar tidak tersimpan dua kali.
    diam.tercatat = true;
    const tersimpan = await simpanTitikHenti(
      id_perangkat,
      perangkat.id_yayasan,
      diam,
      typeof baterai === "number" ? baterai : undefined,
    );
    if (!tersimpan) diam.tercatat = false;
  }

  // Zona perangkat menang atas zona bawaan yayasan (id_perangkat null).
  const { data: zona, error: geofenceError } = await supabase
    .from("geofence")
    .select("id_perangkat, nama_area, center_lat, center_long, radius_meter")
    .eq("id_yayasan", perangkat.id_yayasan)
    .eq("is_active", true)
    .or(`id_perangkat.eq.${id_perangkat},id_perangkat.is.null`);

  if (geofenceError) {
    console.error("[GEOFENCE] Gagal mengambil zona aman:", geofenceError.message);
    return;
  }

  const geofence = zona?.find((z) => z.id_perangkat === id_perangkat) ?? zona?.[0];
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
      deskripsi: `Keluar dari zona aman${geofence.nama_area ? ` "${geofence.nama_area}"` : ""}`,
      latitude_sos: latitude,
      longitude_sos: longitude,
    });
  } catch (error) {
    geofenceAlertTerakhir.delete(id_perangkat);
    console.error("[GEOFENCE] Gagal membuat notifikasi:", error);
  }
}

const sosSedangDiproses = new Set<string>();

// Waktu dari perangkat hanya dipakai bila masuk akal: bisa dibaca dan tidak di masa depan.
// Toleransi 1 menit untuk selisih jam perangkat.
function waktuKejadianValid(timestamp?: string): string | undefined {
  if (!timestamp) return undefined;
  const ms = Date.parse(timestamp);
  if (!Number.isFinite(ms) || ms > Date.now() + 60_000) return undefined;
  return new Date(ms).toISOString();
}

async function prosesSos(data: SosPayload): Promise<void> {
  const { id_perangkat, latitude, longitude, timestamp } = data;

  // Satu SOS per perangkat diproses dalam satu waktu (pesan MQTT ganda).
  if (sosSedangDiproses.has(id_perangkat)) return;
  sosSedangDiproses.add(id_perangkat);

  try {
    console.log(`[SOS] Tombol SOS dari ${id_perangkat}`);

    // Selama insiden SOS perangkat ini belum selesai, tekanan berikutnya tidak membuat insiden baru.
    const { data: berjalan, error: galatCek } = await supabase
      .from("notifikasi")
      .select("id_notifikasi")
      .eq("id_perangkat", id_perangkat)
      .eq("tipe_event", "SOS")
      .in("status", ["AKTIF", "DITANGANI"])
      .limit(1)
      .maybeSingle();

    if (galatCek) {
      console.error(`[SOS] Gagal memeriksa insiden berjalan ${id_perangkat}:`, galatCek.message);
      return;
    }
    if (berjalan) {
      console.log(`[SOS] ${id_perangkat} sudah punya insiden SOS berjalan. Diabaikan.`);
      return;
    }

    // Lokasi dari payload; bila kosong pakai lokasi GPS terakhir di tabel perangkat.
    const { data: perangkat, error: galatPerangkat } = await supabase
      .from("perangkat")
      .select("lat_terakhir, long_terakhir")
      .eq("id_perangkat", id_perangkat)
      .maybeSingle();

    if (galatPerangkat) {
      console.error(`[SOS] Gagal membaca perangkat ${id_perangkat}:`, galatPerangkat.message);
      return;
    }
    if (!perangkat) {
      console.warn(`[SOS] Perangkat ${id_perangkat} tidak terdaftar di database.`);
      return;
    }

    await buatNotifikasiDarurat({
      id_perangkat,
      tipe_event: "SOS",
      deskripsi: "Tombol SOS ditekan",
      latitude_sos: latitude ?? perangkat.lat_terakhir,
      longitude_sos: longitude ?? perangkat.long_terakhir,
      waktu_kejadian: waktuKejadianValid(timestamp),
    });

    // Ditandai setelah insiden berhasil dibuat, supaya tidak ada status SOS tanpa insiden.
    const { error: galatStatus } = await supabase
      .from("perangkat")
      .update({ status_sos: true, status_online: true, last_active: new Date().toISOString() })
      .eq("id_perangkat", id_perangkat);

    if (galatStatus) {
      console.error(`[SOS] Gagal menandai status_sos ${id_perangkat}:`, galatStatus.message);
    }
  } catch (error) {
    console.error(`[SOS] Gagal membuat insiden ${id_perangkat}:`, error);
  } finally {
    sosSedangDiproses.delete(id_perangkat);
  }
}

async function prosesPower(data: PowerPayload): Promise<void> {
  const { id_perangkat, tegangan_5v, undervoltage } = data;

  // Tanggal dari server agar data yang terlambat tidak tampak sebagai data terbaru.
  const { data: perangkat, error } = await supabase
    .from("perangkat")
    .update({
      tegangan_5v,
      undervoltage,
      daya_updated_at: new Date().toISOString(),
    })
    .eq("id_perangkat", id_perangkat)
    .select("id_perangkat")
    .maybeSingle();

  if (error) {
    console.error(`[POWER] Gagal update ${id_perangkat}:`, error.message);
  } else if (!perangkat) {
    console.warn(`[POWER] Perangkat tidak ditemukan: ${id_perangkat}`);
  } else {
    console.log(`[POWER] ${id_perangkat} ${tegangan_5v.toFixed(3)} V | ${undervoltage ? "UNDERVOLTAGE" : "NORMAL"}`);
  }
}

// Deteksi rintangan oleh AI: hanya dicatat di log dan menandai tongkat online, tidak disimpan ke database.
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

    client.subscribe([TOPIC_STATUS, TOPIC_TELEMETRY, TOPIC_DETECTION, TOPIC_SOS, TOPIC_POWER], { qos: 0 }, (error) => {
      if (error) {
        console.error("[MQTT] Gagal subscribe:", error.message);
        return;
      }

      console.log("[MQTT] Subscribe berhasil:");
      console.log(`       ${TOPIC_STATUS}`);
      console.log(`       ${TOPIC_TELEMETRY}`);
      console.log(`       ${TOPIC_DETECTION}`);
      console.log(`       ${TOPIC_SOS}`);
      console.log(`       ${TOPIC_POWER}`);
      console.log("========================================\n");
    });
  });

  // Setiap pesan: pastikan JSON valid, periksa isinya, pastikan ID di topik sama dengan ID di payload, lalu proses.
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

      if (topic.startsWith("penuntun/power/")) {
        if (!isValidPower(data)) {
          console.error("[POWER] Payload tidak valid:", data);
          return;
        }
        if (!topicMatchesDevice(topic, data.id_perangkat)) {
          console.warn(`[POWER] ID topic dan payload berbeda: ${topic}`);
          return;
        }
        await prosesPower(data);
        return;
      }

      if (topic.startsWith("penuntun/sos/")) {
        if (!isValidSos(data)) {
          console.error("[SOS] Payload tidak valid:", data);
          return;
        }
        if (!topicMatchesDevice(topic, data.id_perangkat)) {
          console.warn(`[SOS] ID topic dan payload berbeda: ${topic}`);
          return;
        }
        await prosesSos(data);
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
