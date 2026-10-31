// backend/src/index.ts

import { env } from "./config/env";

import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes";
import perangkatRoutes from "./routes/perangkat.routes";
import penggunaRoutes from "./routes/pengguna.routes";
import notifikasiRoutes from "./routes/notifikasi.routes";
import pengaturanRoutes from "./routes/pengaturan.routes";
import geofenceRoutes from "./routes/geofence.routes";

import { startDeviceStatusMonitor } from "./services/device-status.service";
import { mulaiMqttListener } from "./mqtt/listener";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "healthy", waktu: new Date().toISOString() });
});

app.use("/auth", authRoutes);
app.use("/perangkat", perangkatRoutes);
app.use("/pengguna", penggunaRoutes);
app.use("/notifikasi", notifikasiRoutes);
app.use("/pengaturan", pengaturanRoutes);
app.use("/geofence", geofenceRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Endpoint tidak ditemukan" });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[API] Kesalahan tidak tertangani:", err);
  res.status(500).json({ message: "Terjadi kesalahan pada server" });
});

app.listen(Number(env.PORT), () => {
  console.log(`[API] PENUNTUN backend berjalan di http://localhost:${env.PORT}`);

  try {
    startDeviceStatusMonitor();
    console.log("[DEVICE] Pemantau status perangkat aktif.");
  } catch (error) {
    console.error("[DEVICE] Gagal menjalankan pemantau status perangkat:", error);
  }

  try {
    mulaiMqttListener();
    console.log("[MQTT] Listener MQTT dijalankan.");
  } catch (error) {
    console.error("[MQTT] Gagal menjalankan listener MQTT:", error);
  }
});