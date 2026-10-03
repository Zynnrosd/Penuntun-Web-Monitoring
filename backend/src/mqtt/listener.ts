// backend/src/mqtt/listener.ts

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
  baterai: number;
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

const TOPIC_TELEMETRY =
  "penuntun/telemetry/#";

const TOPIC_DETECTION =
  "penuntun/detection/#";

const TOPIC_STATUS =
  "penuntun/status/#";


// =========================================================
// VALIDASI TELEMETRY
// =========================================================

function isValidTelemetry(
  data: Partial<TelemetryPayload>
): data is TelemetryPayload {
  return (
    typeof data.id_perangkat === "string" &&
    data.id_perangkat.length > 0 &&

    typeof data.latitude === "number" &&
    Number.isFinite(data.latitude) &&

    typeof data.longitude === "number" &&
    Number.isFinite(data.longitude) &&

    typeof data.baterai === "number" &&
    Number.isFinite(data.baterai)
  );
}


// =========================================================
// VALIDASI DETECTION
// =========================================================

function isValidDetection(
  data: Partial<DetectionPayload>
): data is DetectionPayload {
  return (
    typeof data.id_perangkat === "string" &&
    data.id_perangkat.length > 0 &&

    typeof data.class_name === "string" &&
    data.class_name.length > 0 &&

    typeof data.confidence === "number" &&
    Number.isFinite(data.confidence)
  );
}


// =========================================================
// VALIDASI HEARTBEAT
// =========================================================

function isValidHeartbeat(
  data: Partial<HeartbeatPayload>
): data is HeartbeatPayload {
  return (
    typeof data.id_perangkat === "string" &&
    data.id_perangkat.length > 0 &&

    data.status === "online"
  );
}


// =========================================================
// PROSES HEARTBEAT
// =========================================================

async function prosesHeartbeat(
  data: HeartbeatPayload
) {
  const {
    id_perangkat,
  } = data;


  const now =
    new Date().toISOString();


  const {
    data: perangkat,
    error,
  } = await supabase
    .from("perangkat")
    .update({
      status_online: true,
      last_active: now,
    })
    .eq(
      "id_perangkat",
      id_perangkat
    )
    .select(
      "id_perangkat"
    )
    .maybeSingle();


  if (error) {
    console.error(
      `[HEARTBEAT] Gagal update ${id_perangkat}:`,
      error.message
    );

    return;
  }


  if (!perangkat) {
    console.warn(
      `[HEARTBEAT] Perangkat ${id_perangkat} tidak ditemukan di database.`
    );

    return;
  }


  console.log(
    `[HEARTBEAT] ${id_perangkat} → ONLINE`
  );
}


// =========================================================
// PROSES TELEMETRY
// =========================================================

async function prosesTelemetry(
  data: TelemetryPayload
) {
  const {
    id_perangkat,
    latitude,
    longitude,
    baterai,
  } = data;


  console.log("");
  console.log("========================================");
  console.log("[MQTT TELEMETRY]");
  console.log("========================================");
  console.log(`Perangkat : ${id_perangkat}`);
  console.log(`Latitude  : ${latitude}`);
  console.log(`Longitude : ${longitude}`);
  console.log(`Baterai   : ${baterai}%`);
  console.log("========================================");


  // =====================================================
  // UPDATE PERANGKAT
  //
  // Telemetry juga dianggap sebagai tanda bahwa
  // perangkat masih hidup.
  // =====================================================

  const {
    error: perangkatError,
  } = await supabase
    .from("perangkat")
    .update({
      lat_terakhir: latitude,
      long_terakhir: longitude,
      baterai_terakhir: baterai,

      status_online: true,
      last_active:
        new Date().toISOString(),
    })
    .eq(
      "id_perangkat",
      id_perangkat
    );


  if (perangkatError) {
    console.error(
      "[MQTT] Gagal update perangkat:",
      perangkatError.message
    );
  }


  // =====================================================
  // SIMPAN TRACKING
  // =====================================================

  const {
    error: trackingError,
  } = await supabase
    .from("tracking_data")
    .insert({
      id_perangkat,
      latitude,
      longitude,
      baterai,
    });


  if (trackingError) {
    console.error(
      "[MQTT] Gagal menyimpan tracking_data:",
      trackingError.message
    );
  }


  // =====================================================
  // AMBIL GEOFENCE
  // =====================================================

  const {
    data: geofence,
    error: geofenceError,
  } = await supabase
    .from("geofence")
    .select("*")
    .eq(
      "id_perangkat",
      id_perangkat
    )
    .eq(
      "is_active",
      true
    )
    .maybeSingle();


  if (geofenceError) {
    console.error(
      "[MQTT] Gagal mengambil geofence:",
      geofenceError.message
    );

    return;
  }


  // =====================================================
  // CEK GEOFENCE
  // =====================================================

  if (
    geofence &&
    isDiLuarZonaAman(
      latitude,
      longitude,
      geofence
    )
  ) {
    console.log(
      `[GEOFENCE] ${id_perangkat} keluar dari zona aman.`
    );


    await buatNotifikasiDarurat({
      id_perangkat,

      tipe_event:
        "GEOFENCE",

      deskripsi:
        `Keluar dari zona aman "${geofence.nama_area}"`,

      latitude_sos:
        latitude,

      longitude_sos:
        longitude,
    });
  }
}


// =========================================================
// PROSES AI DETECTION
// =========================================================

async function prosesDetection(
  data: DetectionPayload
) {
  const {
    id_perangkat,
    class_name,
    confidence,
    inference_ms,
    ai_fps,
    timestamp,
  } = data;


  const confidencePercent =
    confidence * 100;


  console.log("");
  console.log("========================================");
  console.log("[MQTT AI DETECTION]");
  console.log("========================================");
  console.log(`Perangkat  : ${id_perangkat}`);
  console.log(`Class      : ${class_name}`);

  console.log(
    `Confidence : ${confidencePercent.toFixed(1)}%`
  );


  if (
    typeof inference_ms === "number"
  ) {
    console.log(
      `Inference  : ${inference_ms.toFixed(1)} ms`
    );
  }


  if (
    typeof ai_fps === "number"
  ) {
    console.log(
      `AI FPS     : ${ai_fps.toFixed(2)}`
    );
  }


  if (timestamp) {
    console.log(
      `Timestamp  : ${timestamp}`
    );
  }


  console.log("========================================");


  // Detection juga membuktikan perangkat hidup.
  // Ini menjadi backup jika heartbeat sempat terlambat.

  const {
    error,
  } = await supabase
    .from("perangkat")
    .update({
      status_online: true,
      last_active:
        new Date().toISOString(),
    })
    .eq(
      "id_perangkat",
      id_perangkat
    );


  if (error) {
    console.error(
      "[MQTT DETECTION] Gagal update perangkat:",
      error.message
    );
  }
}


// =========================================================
// MQTT LISTENER
// =========================================================

export function mulaiMqttListener():
  MqttClient | undefined {

  // =====================================================
  // CEK CONFIG
  // =====================================================

  if (!env.MQTT_BROKER_URL) {
    console.log(
      "[MQTT] MQTT_BROKER_URL belum diset."
    );

    console.log(
      "[MQTT] Listener tidak dijalankan."
    );

    return;
  }


  const username =
    process.env.MQTT_USERNAME;

  const password =
    process.env.MQTT_PASSWORD;


  console.log("");
  console.log("========================================");
  console.log("       PENUNTUN MQTT CLIENT");
  console.log("========================================");

  console.log(
    `[MQTT] Broker: ${env.MQTT_BROKER_URL}`
  );


  // =====================================================
  // CONNECT
  // =====================================================

  const client = mqtt.connect(
    env.MQTT_BROKER_URL,
    {
      username,
      password,

      reconnectPeriod:
        3000,

      connectTimeout:
        10000,

      clean:
        true,

      clientId:
        `penuntun-backend-${Date.now()}`,
    }
  );


  // =====================================================
  // CONNECTED
  // =====================================================

  client.on(
    "connect",
    () => {
      console.log(
        "[MQTT] Terhubung ke broker."
      );


      client.subscribe(
        [
          TOPIC_STATUS,
          TOPIC_TELEMETRY,
          TOPIC_DETECTION,
        ],
        {
          qos: 0,
        },
        (error) => {

          if (error) {
            console.error(
              "[MQTT] Gagal subscribe:",
              error
            );

            return;
          }


          console.log(
            "[MQTT] Subscribe berhasil:"
          );

          console.log(
            `       ${TOPIC_STATUS}`
          );

          console.log(
            `       ${TOPIC_TELEMETRY}`
          );

          console.log(
            `       ${TOPIC_DETECTION}`
          );

          console.log(
            "========================================"
          );

          console.log("");
        }
      );
    }
  );


  // =====================================================
  // MESSAGE
  // =====================================================

  client.on(
    "message",
    async (
      topic,
      payload
    ) => {

      try {

        const payloadText =
          payload.toString();


        let data: unknown;


        // =================================================
        // JSON PARSE
        // =================================================

        try {

          data =
            JSON.parse(
              payloadText
            );

        } catch {

          console.error(
            `[MQTT] Payload bukan JSON valid dari ${topic}`
          );

          console.error(
            payloadText
          );

          return;
        }


        if (
          typeof data !== "object" ||
          data === null
        ) {
          console.error(
            `[MQTT] Payload tidak valid dari ${topic}`
          );

          return;
        }


        // =================================================
        // HEARTBEAT
        // =================================================

        if (
          topic.startsWith(
            "penuntun/status/"
          )
        ) {

          const heartbeat =
            data as Partial<HeartbeatPayload>;


          if (
            !isValidHeartbeat(
              heartbeat
            )
          ) {
            console.error(
              "[HEARTBEAT] Payload tidak valid:",
              heartbeat
            );

            return;
          }


          await prosesHeartbeat(
            heartbeat
          );


          return;
        }


        // =================================================
        // TELEMETRY
        // =================================================

        if (
          topic.startsWith(
            "penuntun/telemetry/"
          )
        ) {

          const telemetry =
            data as Partial<TelemetryPayload>;


          if (
            !isValidTelemetry(
              telemetry
            )
          ) {
            console.error(
              "[MQTT TELEMETRY] Payload tidak lengkap:",
              telemetry
            );

            return;
          }


          await prosesTelemetry(
            telemetry
          );


          return;
        }


        // =================================================
        // AI DETECTION
        // =================================================

        if (
          topic.startsWith(
            "penuntun/detection/"
          )
        ) {

          const detection =
            data as Partial<DetectionPayload>;


          if (
            !isValidDetection(
              detection
            )
          ) {
            console.error(
              "[MQTT DETECTION] Payload tidak lengkap:",
              detection
            );

            return;
          }


          await prosesDetection(
            detection
          );


          return;
        }


        // =================================================
        // UNKNOWN TOPIC
        // =================================================

        console.warn(
          `[MQTT] Topic tidak dikenal: ${topic}`
        );


      } catch (error) {

        console.error(
          "[MQTT] Gagal memproses message:",
          error
        );
      }
    }
  );


  // =====================================================
  // ERROR
  // =====================================================

  client.on(
    "error",
    (error) => {
      console.error(
        "[MQTT] Connection error:",
        error.message
      );
    }
  );


  // =====================================================
  // RECONNECT
  // =====================================================

  client.on(
    "reconnect",
    () => {
      console.log(
        "[MQTT] Mencoba reconnect..."
      );
    }
  );


  // =====================================================
  // OFFLINE BROKER
  // =====================================================

  client.on(
    "offline",
    () => {
      console.log(
        "[MQTT] Broker offline / tidak dapat dijangkau."
      );
    }
  );


  // =====================================================
  // CONNECTION CLOSED
  // =====================================================

  client.on(
    "close",
    () => {
      console.log(
        "[MQTT] Koneksi broker terputus."
      );
    }
  );


  return client;
}