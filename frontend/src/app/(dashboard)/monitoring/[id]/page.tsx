"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  BatteryMedium,
  Clock3,
  MapPin,
  Wifi,
  WifiOff,
} from "lucide-react";

import { api } from "@/lib/api-client";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import type { Perangkat, PenggunaTunanetra } from "@/types";

// Peta Leaflet hanya dijalankan di browser.
const MapView = dynamic(
  () => import("@/components/map/MapView").then((m) => m.MapView),
  { ssr: false }
);

type TrackPoint = {
  id_tracking: number;
  latitude: number;
  longitude: number;
  baterai: number | null;
  recorded_at: string;
};

export default function MonitoringDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [perangkat, setPerangkat] = useState<Perangkat | null>(null);
  const [pengguna, setPengguna] = useState<PenggunaTunanetra[]>([]);
  const [riwayat, setRiwayat] = useState<TrackPoint[] | null>(null);
  const [loadingRiwayat, setLoadingRiwayat] = useState(false);
  const [riwayatError, setRiwayatError] = useState("");
  const [error, setError] = useState("");

  // =======================================================
  // AMBIL DATA PERANGKAT DARI BACKEND
  // =======================================================

  const muatPerangkat = useCallback(async () => {
    try {
      const [list, userList] = await Promise.all([
        api.get<Perangkat[]>("/perangkat"),
        api.get<PenggunaTunanetra[]>("/pengguna").catch(() => []),
      ]);

      const found = list.find((p) => p.id_perangkat === id);

      if (!found) {
        setPerangkat(null);
        setError("Perangkat tidak ditemukan");
        return;
      }

      setPerangkat(found);
      setPengguna(userList);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat perangkat"
      );
    }
  }, [id]);

  useEffect(() => {
    void muatPerangkat();
  }, [muatPerangkat]);

  // Saat tabel `perangkat` berubah di Supabase, data lokasi
  // akan diambil kembali melalui backend.
  useRealtimeTable("perangkat", muatPerangkat);

  // =======================================================
  // RIWAYAT PERJALANAN
  // =======================================================

  async function muatRiwayat() {
    setLoadingRiwayat(true);
    setRiwayatError("");

    try {
      const data = await api.get<TrackPoint[]>(
        `/perangkat/${encodeURIComponent(id)}/riwayat`
      );
      setRiwayat(data);
    } catch (err) {
      setRiwayatError(
        err instanceof Error ? err.message : "Gagal memuat riwayat"
      );
    } finally {
      setLoadingRiwayat(false);
    }
  }

  if (error) {
    return <p className="text-danger">{error}</p>;
  }

  if (!perangkat) {
    return <p className="text-text-secondary">Memuat data...</p>;
  }

  // =======================================================
  // DATA YANG DITAMPILKAN
  // =======================================================

  const nama =
    pengguna.find((u) => u.id_tunanetra === perangkat.dipakai_oleh)
      ?.nama_tunanetra ?? "Belum dipasangkan";

  const lokasiAda =
    perangkat.lat_terakhir != null &&
    perangkat.long_terakhir != null &&
    Number.isFinite(Number(perangkat.lat_terakhir)) &&
    Number.isFinite(Number(perangkat.long_terakhir));

  // Prioritaskan angka GPS terbaru dibanding teks lokasi lama.
  const lokasiText = lokasiAda
    ? `${Number(perangkat.lat_terakhir).toFixed(6)}, ${Number(
        perangkat.long_terakhir
      ).toFixed(6)}`
    : perangkat.lokasi_terakhir ?? "Lokasi belum tersedia";

  const markers = lokasiAda
    ? [
        {
          id_perangkat: perangkat.id_perangkat,
          nama,
          lat: Number(perangkat.lat_terakhir),
          lng: Number(perangkat.long_terakhir),
          online: perangkat.status_online,
          sos: perangkat.status_sos,
        },
      ]
    : [];

  // Endpoint riwayat sebelumnya memberikan data terbaru lebih dulu.
  // Leaflet membutuhkan urutan titik lama -> baru untuk jalurnya.
  const path = riwayat
    ? [...riwayat].reverse().map((point) => ({
        lat: Number(point.latitude),
        lng: Number(point.longitude),
      }))
    : undefined;

  return (
    <div>
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 text-sm text-primary hover:underline"
      >
        ← Kembali ke Monitoring Lokasi
      </button>

      {/* JUDUL DAN STATUS */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            {nama}
          </h1>
          <div className="font-mono text-sm text-text-secondary">
            {perangkat.id_perangkat}
          </div>
        </div>

        <div
          className={`flex items-center gap-2 rounded-pill px-4 py-2 text-sm font-semibold ${
            perangkat.status_online
              ? "bg-success-soft text-success"
              : "bg-offline/10 text-offline"
          }`}
        >
          {perangkat.status_online ? (
            <Wifi size={17} />
          ) : (
            <WifiOff size={17} />
          )}
          Raspberry Pi {perangkat.status_online ? "Online" : "Offline"}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        {/* PANEL KIRI */}
        <div className="space-y-4">
          {/* INFORMASI PERANGKAT */}
          <div className="rounded-card bg-surface p-6 shadow-card">
            <h2 className="mb-5 text-lg font-semibold text-text-primary">
              Informasi Perangkat
            </h2>

            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-text-secondary">
                Status Raspberry
              </span>
              <span
                className={`flex items-center gap-1 text-sm font-semibold ${
                  perangkat.status_online
                    ? "text-success"
                    : "text-offline"
                }`}
              >
                {perangkat.status_online ? (
                  <Wifi size={15} />
                ) : (
                  <WifiOff size={15} />
                )}
                {perangkat.status_online ? "Online" : "Offline"}
              </span>
            </div>

            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-text-secondary">Baterai</span>
              <span className="flex items-center gap-1 font-medium text-text-primary">
                <BatteryMedium size={16} />
                {perangkat.baterai_terakhir == null
                  ? "-"
                  : `${perangkat.baterai_terakhir}%`}
              </span>
            </div>

            <div>
              <div className="mb-1 flex items-center gap-1 text-sm text-text-secondary">
                <MapPin size={15} />
                Lokasi Terakhir
              </div>
              <p className="break-words font-medium text-text-primary">
                {lokasiText}
              </p>
              <p className="mt-2 text-xs text-text-secondary">
                Sumber lokasi: GPS NEO-6M pada Raspberry Pi.
              </p>
            </div>
          </div>

          {/* RIWAYAT PERJALANAN */}
          <div className="rounded-card bg-surface p-5 shadow-card">
            <div className="mb-3 flex items-center gap-2">
              <Clock3 size={17} className="text-primary" />
              <h2 className="font-semibold text-text-primary">
                Riwayat Perjalanan
              </h2>
            </div>

            <button
              type="button"
              onClick={() => void muatRiwayat()}
              disabled={loadingRiwayat}
              className="w-full rounded-input border border-primary px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary-soft disabled:opacity-50"
            >
              {loadingRiwayat
                ? "Memuat riwayat..."
                : riwayat
                ? "Muat ulang riwayat"
                : "Lihat riwayat perjalanan"}
            </button>

            {riwayatError && (
              <p className="mt-3 text-sm text-danger">{riwayatError}</p>
            )}

            {riwayat && (
              <p className="mt-2 text-center text-xs text-text-secondary">
                {riwayat.length} titik lokasi
              </p>
            )}
          </div>
        </div>

        {/* PETA LEAFLET */}
        <div className="min-h-[480px] overflow-hidden rounded-card bg-surface shadow-card lg:h-[calc(100vh-14rem)]">
          <MapView markers={markers} path={path} />
        </div>
      </div>
    </div>
  );
}
