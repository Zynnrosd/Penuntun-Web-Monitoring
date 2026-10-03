"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import type { Perangkat, PenggunaTunanetra } from "@/types";

const MapView = dynamic(() => import("@/components/map/MapView").then((m) => m.MapView), { ssr: false });

type TrackPoint = { id_tracking: number; latitude: number; longitude: number; baterai: number | null; recorded_at: string };

export default function MonitoringDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [perangkat, setPerangkat] = useState<Perangkat | null>(null);
  const [pengguna, setPengguna] = useState<PenggunaTunanetra[]>([]);
  const [riwayat, setRiwayat] = useState<TrackPoint[] | null>(null);
  const [loadingRiwayat, setLoadingRiwayat] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get<Perangkat[]>("/perangkat"), api.get<PenggunaTunanetra[]>("/pengguna").catch(() => [])])
      .then(([list, u]) => {
        const found = list.find((p) => p.id_perangkat === id);
        if (!found) {
          setError("Perangkat tidak ditemukan");
          return;
        }
        setPerangkat(found);
        setPengguna(u);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  function muatRiwayat() {
    setLoadingRiwayat(true);
    api
      .get<TrackPoint[]>(`/perangkat/${id}/riwayat`)
      .then(setRiwayat)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingRiwayat(false));
  }

  if (error) return <p className="text-danger">{error}</p>;
  if (!perangkat) return <p className="text-text-secondary">Memuat data...</p>;

  const nama = pengguna.find((u) => u.id_tunanetra === perangkat.dipakai_oleh)?.nama_tunanetra ?? "Belum dipasangkan";

  return (
    <div>
      <button onClick={() => router.back()} className="mb-4 text-sm text-primary hover:underline">
        ← Kembali ke Monitoring Lokasi
      </button>
      <h1 className="mb-4 text-xl font-semibold text-text-primary">
        {nama} — <span className="font-mono">{perangkat.id_perangkat}</span>
      </h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="rounded-card bg-surface p-6 shadow-card">
          <p className="text-sm text-text-secondary">Status</p>
          <p className="mb-3 font-medium text-text-primary">{perangkat.status_online ? "Online" : "Offline"}</p>

          <p className="text-sm text-text-secondary">Baterai</p>
          <p className="mb-3 font-medium text-text-primary">{perangkat.baterai_terakhir ?? "-"}%</p>

          <p className="text-sm text-text-secondary">Lokasi Terakhir</p>
          <p className="mb-4 font-medium text-text-primary">{perangkat.lokasi_terakhir ?? "-"}</p>

          <button
            onClick={muatRiwayat}
            disabled={loadingRiwayat}
            className="w-full rounded-input bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {loadingRiwayat ? "Memuat riwayat..." : riwayat ? "Muat ulang riwayat" : "Lihat riwayat perjalanan"}
          </button>
        </div>

        <div className="h-[420px] overflow-hidden rounded-card shadow-card">
          <MapView
            markers={
              perangkat.lat_terakhir != null && perangkat.long_terakhir != null
                ? [
                    {
                      id_perangkat: perangkat.id_perangkat,
                      nama,
                      lat: perangkat.lat_terakhir,
                      lng: perangkat.long_terakhir,
                      online: perangkat.status_online,
                    },
                  ]
                : []
            }
            path={riwayat?.map((r) => ({ lat: r.latitude, lng: r.longitude })).reverse()}
          />
        </div>
      </div>
    </div>
  );
}