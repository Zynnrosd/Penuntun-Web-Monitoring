// frontend/src/app/(dashboard)/home/page.tsx

"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Smartphone, Wifi, Siren, BatteryWarning, Info } from "lucide-react";
import { api } from "@/lib/api-client";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { useSession } from "@/hooks/useSession";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { DonutChart } from "@/components/dashboard/DonutChart";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { Badge } from "@/components/ui/Badge";
import { jamWIB } from "@/lib/format";
import type { Perangkat, Notifikasi, Geofence } from "@/types";

export default function BerandaPage() {
  const { sesi } = useSession();
  const [perangkat, setPerangkat] = useState<Perangkat[]>([]);
  const [notifikasi, setNotifikasi] = useState<Notifikasi[]>([]);
  const [adaZona, setAdaZona] = useState(true);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");

  const muat = useCallback(() => {
    Promise.all([
      api.get<Perangkat[]>("/perangkat"),
      api.get<Notifikasi[]>("/notifikasi"),
      api.get<Geofence[]>("/geofence").catch(() => [] as Geofence[]),
    ])
      .then(([p, n, g]) => {
        setPerangkat(p);
        setNotifikasi(n.slice(0, 3));
        setAdaZona(g.length > 0);
      })
      .catch((e) => setGalat(e instanceof Error ? e.message : "Gagal memuat data"))
      .finally(() => setMemuat(false));
  }, []);

  useEffect(muat, [muat]);
  useRealtimeTable("perangkat", muat);
  useRealtimeTable("notifikasi", muat);

  if (memuat) {
    return (
      <>
        <PageHeader title="Beranda" subtitle="Ringkasan kondisi pengguna dan perangkat hari ini" />
        <p className="text-[15px] text-text-secondary">Memuat data…</p>
      </>
    );
  }

  if (galat) {
    return (
      <>
        <PageHeader title="Beranda" subtitle="Ringkasan kondisi pengguna dan perangkat hari ini" />
        <p className="rounded-inner bg-danger-soft px-[18px] py-3.5 text-[15px] text-danger-text">
          Gagal memuat ringkasan: {galat}
        </p>
      </>
    );
  }

  const online = perangkat.filter((p) => p.status_online).length;
  const offline = perangkat.length - online;
  const sosAktif = notifikasi.filter((n) => n.tipe_event === "SOS" && n.status === "AKTIF").length;

  const persen = (p: Perangkat) => p.baterai_terakhir;
  const kritis = perangkat.filter((p) => persen(p) != null && persen(p)! < 20).length;
  const sedang = perangkat.filter((p) => persen(p) != null && persen(p)! >= 20 && persen(p)! < 60).length;
  const baik = perangkat.filter((p) => persen(p) != null && persen(p)! >= 60).length;

  return (
    <>
      <PageHeader title="Beranda" subtitle="Ringkasan kondisi pengguna dan perangkat hari ini" />

      <div className="flex flex-col gap-6">
        {!adaZona && perangkat.length > 0 && sesi?.role === "ADMINISTRATOR" && (
          <div
            role="note"
            className="flex flex-col items-start gap-3.5 rounded-inner bg-surface px-5 py-3.5 shadow-[inset_0_0_0_2px_var(--color-border)] sm:flex-row sm:items-center"
          >
            <Info size={22} strokeWidth={2} className="flex-none text-secondary" />
            <p className="flex-1 text-[15px] leading-[22px]">
              <b>Zona aman belum diatur.</b> Perangkat belum dipantau keluar zona sampai titik dan radius yayasan
              ditentukan.
            </p>
            <Link
              href="/perangkat"
              className="flex h-10 flex-none items-center rounded-pill bg-secondary px-5 text-sm font-bold text-white"
            >
              Atur zona aman
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Total perangkat"
            value={perangkat.length}
            tone="primary"
            icon={<Smartphone size={22} strokeWidth={2} />}
          />
          <StatCard label="Online" value={online} tone="success" icon={<Wifi size={22} strokeWidth={2} />} />
          <StatCard label="SOS aktif" value={sosAktif} tone="biru" icon={<Siren size={22} strokeWidth={2} />} />
          <StatCard
            label="Baterai kritis"
            value={kritis}
            tone="kuning"
            icon={<BatteryWarning size={22} strokeWidth={2} />}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <DonutChart
            judul="Baterai"
            segmen={[
              { label: "Baik (di atas 60%)", value: baik, color: "var(--color-success)" },
              { label: "Sedang (20–60%)", value: sedang, color: "var(--color-warning)", garis: "#B07400" },
              { label: "Kritis (di bawah 20%)", value: kritis, color: "var(--color-kritis)" },
            ]}
          />
          <DonutChart
            judul="Koneksi"
            bentukPenanda="bulat"
            segmen={[
              { label: "Online", value: online, color: "var(--color-success)" },
              { label: "Offline", value: offline, color: "var(--color-offline)" },
            ]}
          />
        </div>

        <section className="overflow-hidden rounded-card border-2 border-border bg-surface">
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <h2 className="text-[22px] font-extrabold leading-7">Notifikasi terbaru</h2>
            <span className="text-sm text-text-secondary">3 terakhir</span>
          </div>

          {notifikasi.length === 0 ? (
            <p className="px-6 pb-6 text-[15px] text-text-secondary">
              Belum ada kejadian. Notifikasi muncul di sini saat tombol SOS ditekan atau perangkat keluar zona aman.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary-soft text-left text-[13px] font-bold uppercase tracking-[0.06em] text-[#3F5B82]">
                    <th scope="col" className="px-6 py-3">Waktu</th>
                    <th scope="col" className="px-6 py-3">Pengguna</th>
                    <th scope="col" className="px-6 py-3">Perangkat</th>
                    <th scope="col" className="px-6 py-3">Tipe</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {notifikasi.map((n) => (
                    <tr key={n.id_notifikasi} className="h-12 border-t border-[#EDF1F6]">
                      <td className="data px-6 text-[13px]">{jamWIB(n.occurred_at)}</td>
                      <td className="px-6 text-[15px]">{n.nama_snapshot ?? "Tanpa pengguna"}</td>
                      <td className="data px-6 text-[13px]">{n.id_perangkat ?? "—"}</td>
                      <td className="px-6">
                        {n.tipe_event === "SOS" ? (
                          <Badge tone="danger">SOS</Badge>
                        ) : (
                          <Badge tone="primary">Zona aman</Badge>
                        )}
                      </td>
                      <td className="px-6">
                        {n.status === "AKTIF" && <StatusPill status="sos-aktif" label="Aktif" />}
                        {n.status === "DITANGANI" && <StatusPill status="ditangani" label="Ditangani" />}
                        {n.status === "SELESAI" && <StatusPill status="selesai" label="Selesai" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}