"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, Wifi, WifiOff, BatteryMedium } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api-client";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import type { Perangkat, PenggunaTunanetra } from "@/types";

const MapView = dynamic(() => import("@/components/map/MapView").then((m) => m.MapView), { ssr: false });

export default function MonitoringPage() {
  const [perangkat, setPerangkat] = useState<Perangkat[]>([]);
  const [pengguna, setPengguna] = useState<PenggunaTunanetra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"semua" | "online" | "offline">("semua");
  const [cari, setCari] = useState("");

  const muat = useCallback(() => {
    Promise.all([api.get<Perangkat[]>("/perangkat"), api.get<PenggunaTunanetra[]>("/pengguna").catch(() => [])])
      .then(([p, u]) => {
        setPerangkat(p);
        setPengguna(u);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(muat, [muat]);
  useRealtimeTable("perangkat", muat);

  if (loading) return <p className="text-text-secondary">Memuat data...</p>;
  if (error) return <p className="text-danger">Gagal memuat: {error}</p>;

  function namaPengguna(id: string | null) {
    return pengguna.find((u) => u.id_tunanetra === id)?.nama_tunanetra ?? "Belum dipasangkan";
  }

  const list = perangkat
    .filter((p) => filter === "semua" || (filter === "online" ? p.status_online : !p.status_online))
    .filter(
      (p) =>
        namaPengguna(p.dipakai_oleh).toLowerCase().includes(cari.toLowerCase()) ||
        p.id_perangkat.toLowerCase().includes(cari.toLowerCase())
    );

  const markers = perangkat
    .filter((p) => p.lat_terakhir != null && p.long_terakhir != null)
    .map((p) => ({
      id_perangkat: p.id_perangkat,
      nama: namaPengguna(p.dipakai_oleh),
      lat: p.lat_terakhir as number,
      lng: p.long_terakhir as number,
      online: p.status_online,
      sos: p.status_sos,
    }));

  return (
    <div>
      <PageHeader title="Monitoring Lokasi" subtitle="Pantau posisi pengguna secara real-time" />

      <div className="flex flex-col gap-4 lg:h-[calc(100vh-11rem)] lg:flex-row">
        <aside className="max-h-80 w-full flex-shrink-0 overflow-y-auto rounded-card bg-surface p-4 shadow-card lg:h-full lg:max-h-none lg:w-80">
         <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Daftar Perangkat</h2>
            <Badge tone="primary">{perangkat.length} Perangkat</Badge>
          </div>

          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Cari pengguna atau ID..."
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              className="w-full rounded-pill border border-border py-2 pl-9 pr-3 text-sm"
            />
          </div>

          <div className="mb-4 flex gap-2">
            {(["semua", "online", "offline"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-pill px-4 py-1.5 text-sm font-medium capitalize ${
                  filter === f ? "bg-primary text-white" : "border border-border-strong text-text-secondary"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {list.length === 0 ? (
            <p className="py-6 text-center text-sm text-text-secondary">Tidak ada perangkat.</p>
          ) : (
            <div className="space-y-3">
              {list.map((p) => (
                <Link
                  key={p.id_perangkat}
                  href={`/monitoring/${p.id_perangkat}`}
                  className={`block rounded-card p-4 transition-colors hover:opacity-90 ${
                    p.status_sos ? "bg-danger-soft" : p.status_online ? "bg-success-soft" : "bg-offline/10"
                  }`}
                >
                  <div className="text-lg font-semibold text-text-primary">{namaPengguna(p.dipakai_oleh)}</div>
                  <div className="font-mono text-sm text-text-secondary">{p.id_perangkat}</div>
                  <div className="text-sm text-text-secondary">{p.lokasi_terakhir ?? "Lokasi belum tersedia"}</div>
                  <div className="mt-2 flex items-center gap-4 text-sm">
                    <span className={`flex items-center gap-1 font-medium ${p.status_online ? "text-success" : "text-offline"}`}>
                      {p.status_online ? <Wifi size={14} /> : <WifiOff size={14} />}
                      {p.status_online ? "Online" : "Offline"}
                    </span>
                    <span className="flex items-center gap-1 text-text-secondary">
                      <BatteryMedium size={14} /> {p.baterai_terakhir ?? "-"}%
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </aside>

        <div className="relative h-80 flex-1 lg:h-full">
          <MapView markers={markers} />
        </div>
      </div>
    </div>
  );
}