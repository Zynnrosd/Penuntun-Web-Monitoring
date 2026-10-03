"use client";
import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AlertTriangle, MapPin, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { api } from "@/lib/api-client";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import type { Notifikasi } from "@/types";

const MapView = dynamic(() => import("@/components/map/MapView").then((m) => m.MapView), { ssr: false });

export default function NotifikasiPage() {
  const [list, setList] = useState<Notifikasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pilih, setPilih] = useState<Notifikasi | null>(null);
  const [cari, setCari] = useState("");

  const muat = useCallback(() => {
    api
      .get<Notifikasi[]>("/notifikasi")
      .then(setList)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(muat, [muat]);
  useRealtimeTable("notifikasi", muat);

  async function tandaiSelesai(id: number) {
    try {
      await api.patch(`/notifikasi/${id}/selesai`, {});
      muat();
      setPilih((prev) => (prev && prev.id_notifikasi === id ? { ...prev, status: "SELESAI" } : prev));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menandai selesai");
    }
  }

  if (loading) return <p className="text-text-secondary">Memuat data...</p>;
  if (error) return <p className="text-danger">Gagal memuat: {error}</p>;

  const filtered = list.filter((n) => (n.nama_snapshot ?? "").toLowerCase().includes(cari.toLowerCase()));
  const aktif = list.filter((n) => n.status === "AKTIF").length;
  const selesai = list.filter((n) => n.status === "SELESAI").length;

  function statusKirim(n: Notifikasi): "terkirim" | "gagal" | null {
    const delivery = n.notifikasi_delivery?.[0];
    if (!delivery) return null;
    return delivery.status === "SENT" ? "terkirim" : "gagal";
  }

  return (
    <div>
      <PageHeader title="Notifikasi SOS" subtitle="Peringatan darurat yang perlu perhatian segera" />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Kejadian Hari Ini" value={list.length} tone="primary" suffix="Perangkat" />
        <StatCard label="Sudah Ditangani" value={selesai} tone="success" suffix="Perangkat" />
        <StatCard label="SOS Aktif" value={aktif} tone="danger" suffix="Perangkat" />
      </div>
               
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className={`rounded-card bg-surface p-5 shadow-card transition-all ${pilih ? "lg:w-[420px] lg:flex-shrink-0" : "flex-1"}`}>

          <h2 className="mb-3 text-lg font-semibold text-text-primary">Daftar Notifikasi SOS</h2>
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Cari Berdasarkan Nama"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              className="w-full rounded-pill border border-border py-2 pl-9 pr-3 text-sm"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-secondary">Tidak ada insiden. Semua aman.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((n) => {
                const kirim = statusKirim(n);
                return (
                  <div key={n.id_notifikasi} className={`rounded-card p-4 ${n.status === "AKTIF" ? "bg-danger-soft" : "bg-success-soft"}`}>
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white ${
                          n.status === "AKTIF" ? "bg-danger" : "bg-success"
                        }`}
                      >
                        <AlertTriangle size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="text-lg font-semibold text-text-primary">{n.nama_snapshot ?? "Tidak diketahui"}</div>
                        <div className="font-mono text-sm text-text-secondary">{n.id_perangkat}</div>
                        {n.lokasi_sos && (
                          <div className="mt-1 flex items-center gap-1 text-sm text-text-secondary">
                            <MapPin size={14} /> {n.lokasi_sos}
                          </div>
                        )}
                        <div className="mt-1 flex items-center gap-2 text-sm text-text-secondary">
                          {new Date(n.occurred_at).toLocaleString("id-ID")} • {n.kode_insiden}
                          {kirim && (
                            <span className={kirim === "terkirim" ? "text-success" : "text-danger"}>
                              · WA {kirim === "terkirim" ? "terkirim" : "gagal"}
                            </span>
                          )}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => setPilih(n)}
                            className="flex items-center gap-1 rounded-input bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
                          >
                            <MapPin size={14} /> Lihat Lokasi
                          </button>
                          {n.status === "AKTIF" ? (
                            <button
                              onClick={() => tandaiSelesai(n.id_notifikasi)}
                              className="rounded-input bg-success px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
                            >
                              ✓ Tandai Selesai
                            </button>
                          ) : (
                            <button disabled className="rounded-input border border-border-strong px-3 py-1.5 text-sm text-text-secondary">
                              Selesai
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {pilih && pilih.latitude_sos != null && pilih.longitude_sos != null && (
          <div className="flex-1 rounded-card bg-surface p-5 shadow-card">
            <h2 className="mb-3 text-center text-lg font-semibold text-text-primary">Lokasi: {pilih.nama_snapshot}</h2>
            <div className="h-64 overflow-hidden rounded-map">
              <MapView
                markers={[
                  {
                    id_perangkat: pilih.id_perangkat,
                    nama: pilih.nama_snapshot ?? "Pengguna",
                    lat: pilih.latitude_sos,
                    lng: pilih.longitude_sos,
                    online: true,
                    sos: pilih.tipe_event === "SOS",
                  },
                ]}
              />
            </div>

            <h3 className="mb-3 mt-5 text-lg font-semibold text-text-primary">Detail Insiden</h3>
            <dl className="space-y-3 text-sm">
              {[
                ["ID Insiden", pilih.kode_insiden],
                ["Pengguna", pilih.nama_snapshot ?? "-"],
                ["Kode Perangkat", pilih.id_perangkat],
                ["Tipe Kejadian", pilih.tipe_event],
                ["Deskripsi", pilih.deskripsi ?? "-"],
                ["Tingkat Urgensi", pilih.prioritas === "TINGGI" ? "Tinggi" : pilih.prioritas === "SEDANG" ? "Sedang" : "Rendah"],
                ["Koordinat", `${pilih.latitude_sos}, ${pilih.longitude_sos}`],
                ["Waktu Kejadian", new Date(pilih.occurred_at).toLocaleString("id-ID")],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-border pb-2">
                  <dt className="text-text-secondary">{label}</dt>
                  <dd className="font-medium text-text-primary">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}