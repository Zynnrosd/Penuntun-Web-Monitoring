// backend/src/index.ts

import "dotenv/config";

import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes";
import perangkatRoutes from "./routes/perangkat.routes";
import penggunaRoutes from "./routes/pengguna.routes";
import notifikasiRoutes from "./routes/notifikasi.routes";
import pengaturanRoutes from "./routes/pengaturan.routes";
import deviceRoutes from "./routes/device.routes";
import gpsRoutes from "./routes/gps.routes";
import geofenceRoutes from "./routes/geofence.routes";

import { startDeviceStatusMonitor } from "./services/device-status.service";
import { mulaiMqttListener } from "./mqtt/listener";


const app = express();


// =========================================================
// MIDDLEWARE
// =========================================================

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// =========================================================
// REQUEST LOGGER
// =========================================================

app.use((req, _res, next) => {
  console.log(
    `[PENUNTUN API] ${new Date().toISOString()} ${req.method} ${req.path}`
  );

  next();
});


// =========================================================
// ROOT
// =========================================================

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "PENUNTUN API aktif",
    service: "PENUNTUN Backend",
  });
});


// =========================================================
// HEALTH CHECK
// =========================================================

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});


// =========================================================
// ROUTES
// =========================================================

app.use("/auth", authRoutes);

app.use("/perangkat", perangkatRoutes);

app.use("/pengguna", penggunaRoutes);

app.use("/notifikasi", notifikasiRoutes);

app.use("/pengaturan", pengaturanRoutes);

app.use("/device", deviceRoutes);

app.use("/gps", gpsRoutes);

app.use("/geofence", geofenceRoutes);


// =========================================================
// 404 HANDLER
// =========================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint tidak ditemukan",
    method: req.method,
    path: req.path,
  });
});


// =========================================================
// GLOBAL ERROR HANDLER
// =========================================================

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(
      "[PENUNTUN API ERROR]",
      err
    );

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
    });
  }
);


// =========================================================
// SERVER
// =========================================================

const PORT =
  Number(process.env.PORT) || 4000;


app.listen(PORT, () => {
  console.log("");
  console.log("========================================");
  console.log("       PENUNTUN Backend API");
  console.log("========================================");
  console.log(`Server : http://localhost:${PORT}`);
  console.log(`Health : http://localhost:${PORT}/health`);
  console.log("========================================");
  console.log("");


  // =======================================================
  // DEVICE STATUS MONITOR
  // =======================================================

  try {
    startDeviceStatusMonitor();

    console.log(
      "[DEVICE] Device status monitor aktif."
    );
  } catch (error) {
    console.error(
      "[DEVICE] Gagal menjalankan device status monitor:",
      error
    );
  }


  // =======================================================
  // MQTT LISTENER
  // =======================================================

  try {
    mulaiMqttListener();

    console.log(
      "[MQTT] Listener MQTT dijalankan."
    );
  } catch (error) {
    console.error(
      "[MQTT] Gagal menjalankan listener MQTT:",
      error
    );
  }


  console.log("");
});