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
import pengawasRoutes from "./routes/pengawas.routes";

import { startDeviceStatusMonitor } from "./services/device-status.service";
import { mulaiMqttListener } from "./mqtt/listener";
import { mulaiPengirimWhatsApp } from "./services/whatsapp.service";

const app = express();

// Di hosting, backend berada di balik proxy. Baris ini membuat req.ip berisi IP pengunjung asli,
// sehingga pembatas pendaftaran per IP bekerja dengan benar.
app.set("trust proxy", 1);

// FRONTEND_URL diisi alamat frontend (boleh lebih dari satu, dipisah koma). Bila kosong, misalnya saat
// pengembangan lokal, semua asal diizinkan.
const asalDiizinkan = env.FRONTEND_URL.split(",").map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: asalDiizinkan.length > 0 ? asalDiizinkan : true, credentials: true }));
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
app.use("/pengawas", pengawasRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Endpoint tidak ditemukan" });
});

// Galat tak terduga: rinciannya hanya dicatat di log server, pengguna menerima pesan umum.
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

    try {
    mulaiPengirimWhatsApp();
    console.log("[WHATSAPP] Pengirim ulang WhatsApp aktif.");
  } catch (error) {
    console.error("[WHATSAPP] Gagal menjalankan pengirim WhatsApp:", error);
  }
});