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

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/geofence", geofenceRoutes);

app.use((req, _res, next) => {
  console.log(
    `[PENUNTUN API] ${new Date().toISOString()} ${req.method} ${req.path}`
  );

  next();
});

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "PENUNTUN API aktif",
    service: "PENUNTUN Backend",
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

app.use("/auth", authRoutes);
app.use("/perangkat", perangkatRoutes);
app.use("/pengguna", penggunaRoutes);
app.use("/notifikasi", notifikasiRoutes);
app.use("/pengaturan", pengaturanRoutes);

app.use("/device", deviceRoutes);
app.use("/gps", gpsRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint tidak ditemukan",
    method: req.method,
    path: req.path,
  });
});

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("[PENUNTUN API ERROR]", err);

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
    });
  }
);

const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, () => {
  console.log("");
  console.log("========================================");
  console.log("       PENUNTUN Backend API");
  console.log("========================================");
  console.log(`Server : http://localhost:${PORT}`);
  console.log(`Health : http://localhost:${PORT}/health`);
  console.log("========================================");
  console.log("");

  startDeviceStatusMonitor();
});