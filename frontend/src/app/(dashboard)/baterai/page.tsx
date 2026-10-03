"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { api } from "@/lib/api-client";
import type { Perangkat } from "@/types";

export default function BateraiPage() {
  const [data, setData] = useState<Perangkat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Perangkat[]>("/perangkat")
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-text-secondary">Memuat data...</p>;
  if (error) return <p className="text-danger">Gagal memuat: {error}</p>;

  const kritis = data.filter((d) => (d.baterai_terakhir ?? 100) < 20).length;
  const sedang = data.filter((d) => (d.baterai_terakhir ?? 100) >= 20 && (d.baterai_terakhir ?? 100) < 60).length;
  const baik = data.filter((d) => (d.baterai_terakhir ?? 100) >= 60).length;

  return (
    <div>
      <PageHeader title="Status Baterai" subtitle="Status daya seluruh perangkat yang terhubung" />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Sedang Mengisi" value={0} tone="primary" />
        <StatCard label="Status Baik" value={baik} tone="success" />
        <StatCard label="Status Sedang" value={sedang} tone="warning" />
        <StatCard label="Status Kritis" value={kritis} tone="danger" />
      </div>

      <div className="overflow-hidden rounded-card bg-surface shadow-card">
        {data.length === 0 ? (
          <p className="p-8 text-center text-sm text-text-secondary">Belum ada perangkat terdaftar.</p>
        ) : (
        <div className="overflow-x-auto">  
          <table className="w-full text-sm">
            <thead className="bg-surface-sunken text-left text-text-secondary">
              <tr>
                <th className="px-4 py-3">Perangkat</th>
                <th className="px-4 py-3">Lokasi Terakhir</th>
                <th className="px-4 py-3">Kapasitas</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => {
                const baterai = d.baterai_terakhir ?? 0;
                return (
                  <tr key={d.id_perangkat} className={`border-t border-border ${baterai < 20 ? "bg-danger-soft/30" : ""}`}>
                    <td className="px-4 py-3 font-mono font-medium text-text-primary">{d.id_perangkat}</td>
                    <td className="px-4 py-3 text-text-secondary">{d.lokasi_terakhir ?? "-"}</td>
                    <td className="px-4 py-3">
                      <div className="h-2 w-32 overflow-hidden rounded-pill bg-surface-sunken">
                        <div
                          className={`h-full ${baterai < 20 ? "bg-danger" : baterai < 60 ? "bg-warning" : "bg-success"}`}
                          style={{ width: `${baterai}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-text-secondary">{baterai}%</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={d.status_online ? "online" : "offline"} label={d.status_online ? "Online" : "Offline"} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>  
        )}
      </div>
    </div>
  );
}