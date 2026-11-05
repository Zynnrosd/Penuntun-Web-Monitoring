
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Smartphone,
  Wifi,
  Siren,
  BatteryWarning,
  Info,
} from "lucide-react";

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

// =========================================================
// STATUS DAYA
// =========================================================

type PerangkatDaya = Perangkat & {
  tegangan_5v?: number | null;
  undervoltage?: boolean | null;
  daya_updated_at?: string | null;
};

type KondisiDaya =
  | "NORMAL"
  | "KRITIS"
  | "TIDAK_DIKETAHUI";

const BATAS_DATA_LAMA_MS = 60_000;

function kondisiDaya(
  p: PerangkatDaya,
  sekarang: number
): KondisiDaya {
  if (
    !p.status_online ||
    !p.daya_updated_at ||
    sekarang <= 0
  ) {
    return "TIDAK_DIKETAHUI";
  }

  const terakhir = Date.parse(p.daya_updated_at);

  if (
    !Number.isFinite(terakhir) ||
    sekarang - terakhir > BATAS_DATA_LAMA_MS ||
    terakhir > sekarang + 10_000
  ) {
    return "TIDAK_DIKETAHUI";
  }

  if (
    typeof p.undervoltage !== "boolean" ||
    p.tegangan_5v == null ||
    !Number.isFinite(Number(p.tegangan_5v))
  ) {
    return "TIDAK_DIKETAHUI";
  }

  return p.undervoltage ? "KRITIS" : "NORMAL";
}

// =========================================================
// BERANDA
// =========================================================

export default function BerandaPage() {
  const { sesi } = useSession();

  const [perangkat, setPerangkat] = useState<PerangkatDaya[]>([]);
  const [notifikasi, setNotifikasi] = useState<Notifikasi[]>([]);
  const [adaZona, setAdaZona] = useState(true);

  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [sekarang, setSekarang] = useState(0);

  // =====================================================
  // AMBIL DATA
  // =====================================================

  const muat = useCallback(() => {
    Promise.all([
      api.get<PerangkatDaya[]>("/perangkat"),
      api.get<Notifikasi[]>("/notifikasi"),
      api
        .get<Geofence[]>("/geofence")
        .catch(() => [] as Geofence[]),
    ])
      .then(([p, n, g]) => {
        setPerangkat(p);

        // Simpan seluruh notifikasi agar jumlah SOS akurat.
        // Tabel terbaru tetap hanya menampilkan tiga.
        setNotifikasi(n);

        setAdaZona(g.length > 0);
        setSekarang(Date.now());
        setGalat("");
      })
      .catch((e) => {
        setGalat(
          e instanceof Error
            ? e.message
            : "Gagal memuat data"
        );
      })
      .finally(() => setMemuat(false));
  }, []);

  // =====================================================
  // REALTIME + POLLING
  // =====================================================

  useEffect(() => {
    setSekarang(Date.now());
    muat();

    const timer = setInterval(() => {
      setSekarang(Date.now());
      muat();
    }, 15_000);

    return () => clearInterval(timer);
  }, [muat]);

  useRealtimeTable("perangkat", muat);
  useRealtimeTable("notifikasi", muat);

  // =====================================================
  // HEADER
  // =====================================================

  const judul = (
    <PageHeader
      title="Beranda"
      subtitle="Ringkasan kondisi pengguna dan perangkat hari ini"
    />
  );

  // =====================================================
  // LOADING
  // =====================================================

  if (memuat) {
    return (
      <>
        {judul}
        <p className="text-[15px] text-text-secondary">
          Memuat data…
        </p>
      </>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (galat) {
    return (
      <>
        {judul}
        <p className="rounded-inner bg-danger-soft px-[18px] py-3.5 text-[15px] text-danger-text">
          Gagal memuat ringkasan: {galat}
        </p>
      </>
    );
  }

  // =====================================================
  // STATISTIK PERANGKAT
  // =====================================================

  const totalPerangkat = perangkat.length;

  const online = perangkat.filter(
    (p) => p.status_online
  ).length;

  const offline = totalPerangkat - online;

  // =====================================================
  // STATISTIK SOS
  // =====================================================

  const sosAktif = notifikasi.filter(
    (n) =>
      n.tipe_event === "SOS" &&
      n.status === "AKTIF"
  ).length;

  // =====================================================
  // STATISTIK STATUS DAYA
  // =====================================================

  const hitungDaya = (status: KondisiDaya) =>
    perangkat.filter(
      (p) => kondisiDaya(p, sekarang) === status
    ).length;

  const dayaNormal = hitungDaya("NORMAL");
  const dayaKritis = hitungDaya("KRITIS");
  const dayaTidakDiketahui = hitungDaya(
    "TIDAK_DIKETAHUI"
  );

  // =====================================================
  // NOTIFIKASI TERBARU
  // =====================================================

  const notifikasiTerbaru = notifikasi.slice(0, 3);

  // =====================================================
  // TAMPILAN
  // =====================================================

  return (
    <>
      {judul}

      <div className="flex flex-col gap-6">

        {/* ============================================= */}
        {/* PERINGATAN ZONA AMAN */}
        {/* ============================================= */}

        {!adaZona &&
          totalPerangkat > 0 &&
          sesi?.role === "ADMINISTRATOR" && (
            <div
              role="note"
              className="flex flex-col items-start gap-3.5 rounded-inner bg-surface px-5 py-3.5 shadow-[inset_0_0_0_2px_var(--color-border)] sm:flex-row sm:items-center"
            >
              <Info
                size={22}
                strokeWidth={2}
                className="flex-none text-secondary"
              />

              <p className="flex-1 text-[15px] leading-[22px]">
                <b>Zona aman belum diatur.</b> Perangkat
                belum dipantau keluar zona sampai titik
                dan radius yayasan ditentukan.
              </p>

              <Link
                href="/perangkat"
                className="flex h-10 flex-none items-center rounded-pill bg-secondary px-5 text-sm font-bold text-white"
              >
                Atur zona aman
              </Link>
            </div>
          )}

        {/* ============================================= */}
        {/* KARTU RINGKASAN */}
        {/* ============================================= */}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

          <StatCard
            label="Total perangkat"
            value={totalPerangkat}
            tone="primary"
            icon={
              <Smartphone
                size={22}
                strokeWidth={2}
              />
            }
          />

          <StatCard
            label="Online"
            value={online}
            tone="success"
            icon={
              <Wifi
                size={22}
                strokeWidth={2}
              />
            }
          />

          <StatCard
            label="SOS aktif"
            value={sosAktif}
            tone="biru"
            icon={
              <Siren
                size={22}
                strokeWidth={2}
              />
            }
          />

          <StatCard
            label="Daya kritis"
            value={dayaKritis}
            tone="danger"
            icon={
              <BatteryWarning
                size={22}
                strokeWidth={2}
              />
            }
          />

        </div>

        {/* ============================================= */}
        {/* GRAFIK STATUS DAYA DAN KONEKSI */}
        {/* ============================================= */}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

          <DonutChart
            judul="Status Daya"
            segmen={[
              {
                label: "Normal",
                value: dayaNormal,
                color: "var(--color-success)",
              },
              {
                label: "Kritis",
                value: dayaKritis,
                color: "var(--color-kritis)",
              },
              {
                label: "Tidak diketahui",
                value: dayaTidakDiketahui,
                color: "var(--color-offline)",
              },
            ]}
          />

          <DonutChart
            judul="Koneksi"
            bentukPenanda="bulat"
            segmen={[
              {
                label: "Online",
                value: online,
                color: "var(--color-success)",
              },
              {
                label: "Offline",
                value: offline,
                color: "var(--color-offline)",
              },
            ]}
          />

        </div>

        {/* ============================================= */}
        {/* NOTIFIKASI TERBARU */}
        {/* ============================================= */}

        <section className="overflow-hidden rounded-card border-2 border-border bg-surface">

          <div className="flex items-center justify-between gap-4 px-6 py-4">

            <h2 className="text-[22px] font-extrabold leading-7">
              Notifikasi terbaru
            </h2>

            <span className="text-sm text-text-secondary">
              3 terakhir
            </span>

          </div>

          {notifikasiTerbaru.length === 0 ? (

            <p className="px-6 pb-6 text-[15px] text-text-secondary">
              Belum ada kejadian. Notifikasi muncul di sini
              saat tombol SOS ditekan atau perangkat keluar
              zona aman.
            </p>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>
                  <tr className="bg-secondary-soft text-left text-[13px] font-bold uppercase tracking-[0.06em] text-[#3F5B82]">

                    <th scope="col" className="px-6 py-3">
                      Waktu
                    </th>

                    <th scope="col" className="px-6 py-3">
                      Pengguna
                    </th>

                    <th scope="col" className="px-6 py-3">
                      Perangkat
                    </th>

                    <th scope="col" className="px-6 py-3">
                      Tipe
                    </th>

                    <th scope="col" className="px-6 py-3">
                      Status
                    </th>

                  </tr>
                </thead>

                <tbody>
                  {notifikasiTerbaru.map((n) => (

                    <tr
                      key={n.id_notifikasi}
                      className="h-12 border-t border-[#EDF1F6]"
                    >

                      <td className="data px-6 text-[13px]">
                        {jamWIB(n.occurred_at)}
                      </td>

                      <td className="px-6 text-[15px]">
                        {n.nama_snapshot ?? "Tanpa pengguna"}
                      </td>

                      <td className="data px-6 text-[13px]">
                        {n.id_perangkat ?? "—"}
                      </td>

                      <td className="px-6">
                        {n.tipe_event === "SOS" ? (
                          <Badge tone="danger">
                            SOS
                          </Badge>
                        ) : (
                          <Badge tone="primary">
                            Zona aman
                          </Badge>
                        )}
                      </td>

                      <td className="px-6">

                        {n.status === "AKTIF" && (
                          <StatusPill
                            status="sos-aktif"
                            label="Aktif"
                          />
                        )}

                        {n.status === "DITANGANI" && (
                          <StatusPill
                            status="ditangani"
                            label="Ditangani"
                          />
                        )}

                        {n.status === "SELESAI" && (
                          <StatusPill
                            status="selesai"
                            label="Selesai"
                          />
                        )}

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
