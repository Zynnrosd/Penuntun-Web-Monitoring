"use client";
import { useCallback, useEffect, useState } from "react";
import { Users, Wifi, BatteryWarning, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api-client";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { StatCard } from "@/components/dashboard/StatCard";
import { DonutChart } from "@/components/dashboard/DonutChart";
import { PageHeader } from "@/components/layout/PageHeader";
import type { Perangkat, Notifikasi } from "@/types";

export default function HomePage() {
  const [perangkat, setPerangkat] = useState<Perangkat[]>([]);
  const [notifikasi, setNotifikasi] = useState<Notifikasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const muat = useCallback(() => {
    Promise.all([api.get<Perangkat[]>("/perangkat"), api.get<Notifikasi[]>("/notifikasi")])
      .then(([p, n]) => {
        setPerangkat(p);
        setNotifikasi(n.slice(0, 5));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(muat, [muat]);
  useRealtimeTable("perangkat", muat);
  useRealtimeTable("notifikasi", muat);

  if (loading) return <p className="text-text-secondary">Memuat data...</p>;
  if (error) return <p className="text-danger">Gagal memuat: {error}</p>;

  const online = perangkat.filter((p) => p.status_online).length;
  const offline = perangkat.length - online;
  const bateraiKritis = perangkat.filter((p) => (p.baterai_terakhir ?? 100) < 20).length;
  const bateraiSedang = perangkat.filter((p) => (p.baterai_terakhir ?? 100) >= 20 && (p.baterai_terakhir ?? 100) < 60).length;
  const bateraiBaik = perangkat.filter((p) => (p.baterai_terakhir ?? 100) >= 60).length;
  const sosAktif = perangkat.filter((p) => p.status_sos).length;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Ringkasan monitoring sistem PENUNTUN" />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">  
        <StatCard label="Total Perangkat" value={perangkat.length} tone="primary" icon={<Users size={20} />} />
        <StatCard label="Perangkat Online" value={online} tone="success" icon={<Wifi size={20} />} />
        <StatCard label="Baterai Kritis" value={bateraiKritis} tone="warning" icon={<BatteryWarning size={20} />} suffix="< 20%" />
        <StatCard label="SOS Aktif" value={sosAktif} tone="danger" icon={<AlertTriangle size={20} />} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-card bg-surface p-6 shadow-card">
          <h2 className="mb-2 text-lg font-semibold text-text-primary">Status Baterai</h2>
          <DonutChart
            segments={[
              { label: "Baik (>60%)", value: bateraiBaik || 1, color: "#2F8F5B" },
              { label: "Sedang (20–60%)", value: bateraiSedang || 0, color: "#C97A2B" },
              { label: "Kritis (<20%)", value: bateraiKritis || 0, color: "#C6362F" },
            ]}
          />
        </div>
        <div className="rounded-card bg-surface p-6 shadow-card">
          <h2 className="mb-2 text-lg font-semibold text-text-primary">Status Koneksi</h2>
          <DonutChart
            segments={[
              { label: "Online", value: online || 1, color: "#2F8F5B" },
              { label: "Offline", value: offline || 0, color: "#8A94A6" },
            ]}
          />
        </div>
      </div>

      <div className="mt-6 rounded-card bg-surface p-6 shadow-card">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Notifikasi Terbaru</h2>
        <div className="space-y-2">
          {notifikasi.length === 0 && <p className="text-sm text-text-secondary">Belum ada notifikasi.</p>}
          {notifikasi.map((n) => (
            <div
              key={n.id_notifikasi}
              className={`flex items-center justify-between rounded-input px-4 py-3 ${
                n.status === "AKTIF" ? "bg-danger-soft" : "bg-success-soft"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="rounded-input bg-danger px-2 py-0.5 text-xs font-semibold text-white">{n.tipe_event}</span>
                <span className="rounded-input bg-primary px-2 py-0.5 text-xs font-semibold text-white">{n.kode_insiden}</span>
                <span className="text-sm text-text-secondary">{new Date(n.occurred_at).toLocaleString("id-ID")}</span>
              </div>
              <span className={`text-sm font-semibold ${n.status === "AKTIF" ? "text-danger" : "text-success"}`}>
                {n.status === "AKTIF" ? "Aktif" : "Selesai"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}