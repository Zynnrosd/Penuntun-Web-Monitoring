"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { api } from "@/lib/api-client";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { waktuRelatif, koordinat } from "@/lib/format";
import type { Perangkat } from "@/types";

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

const GAYA: Record<
  KondisiDaya,
  { label: string; kelas: string }
> = {
  NORMAL: {
    label: "Normal",
    kelas: "bg-success-soft text-success-text",
  },
  KRITIS: {
    label: "Kritis",
    kelas: "bg-danger-soft text-danger-text",
  },
  TIDAK_DIKETAHUI: {
    label: "Tidak diketahui",
    kelas: "bg-surface-sunken text-text-secondary",
  },
};

function kondisiDaya(
  p: PerangkatDaya,
  sekarang: number
): KondisiDaya {
  if (!p.status_online || !p.daya_updated_at) {
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

export default function BateraiPage() {
  const [perangkat, setPerangkat] =
    useState<PerangkatDaya[]>([]);

  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [sekarang, setSekarang] = useState(0);

  const muat = useCallback(() => {
    api
      .get<PerangkatDaya[]>("/perangkat")
      .then((data) => {
        setPerangkat(data);
        setSekarang(Date.now());
        setGalat("");
      })
      .catch((e) => {
        setGalat(
          e instanceof Error
            ? e.message
            : "Gagal memuat status daya"
        );
      })
      .finally(() => setMemuat(false));
  }, []);

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

  const judul = (
    <PageHeader
      title="Status Daya"
      subtitle="Pemantauan kondisi daya perangkat PENUNTUN"
    />
  );

  if (memuat) {
    return (
      <>
        {judul}
        <p className="text-[15px] text-text-secondary">
          Memuat status daya…
        </p>
      </>
    );
  }

  if (galat) {
    return (
      <>
        {judul}
        <p className="rounded-inner bg-danger-soft px-[18px] py-3.5 text-[15px] text-danger-text">
          Gagal memuat status daya: {galat}
        </p>
      </>
    );
  }

  const hitung = (status: KondisiDaya) =>
    perangkat.filter(
      (p) => kondisiDaya(p, sekarang) === status
    ).length;

  const urutan: Record<KondisiDaya, number> = {
    KRITIS: 0,
    NORMAL: 1,
    TIDAK_DIKETAHUI: 2,
  };

  const terurut = [...perangkat].sort(
    (a, b) =>
      urutan[kondisiDaya(a, sekarang)] -
      urutan[kondisiDaya(b, sekarang)]
  );

  return (
    <>
      {judul}

      <div className="flex flex-col gap-6">

        {/* RINGKASAN STATUS DAYA */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Daya normal"
            value={hitung("NORMAL")}
            tone="success"
          />

          <StatCard
            label="Kritis"
            value={hitung("KRITIS")}
            tone="danger"
          />

          <StatCard
            label="Tidak diketahui"
            value={hitung("TIDAK_DIKETAHUI")}
            tone="soft"
          />
        </div>

        {/* TABEL STATUS DAYA */}

        <section className="overflow-hidden rounded-card border-2 border-border bg-surface">

          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <h2 className="text-lg font-extrabold leading-7">
              Daya per perangkat
            </h2>

            <span className="text-sm text-text-secondary">
              Kritis ditampilkan lebih dahulu
            </span>
          </div>

          {perangkat.length === 0 ? (
            <p className="px-5 pb-6 text-[15px] text-text-secondary">
              Belum ada perangkat terdaftar.
            </p>
          ) : (
            <>
              <div className="max-h-[max(260px,calc(100vh-400px))] overflow-auto [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-10 [&_thead_th]:bg-secondary-soft">
                <table className="w-full">
                  <thead>
                    <tr className="bg-secondary-soft text-left text-[13px] font-bold uppercase tracking-[0.06em] text-[#3F5B82]">

                      <th scope="col" className="px-6 py-3">
                        Perangkat
                      </th>

                      <th scope="col" className="px-6 py-3">
                        Lokasi terakhir
                      </th>

                      <th scope="col" className="px-6 py-3">
                        Status daya
                      </th>

                      <th scope="col" className="px-6 py-3">
                        Koneksi
                      </th>

                      <th scope="col" className="px-6 py-3">
                        Data daya terakhir
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {terurut.map((p, i) => {
                      const kondisi = kondisiDaya(
                        p,
                        sekarang
                      );

                      const gaya = GAYA[kondisi];

                      const titik = koordinat(
                        p.lat_terakhir,
                        p.long_terakhir
                      );

                      return (
                        <tr
                          key={p.id_perangkat}
                          className="border-t border-[#EDF1F6]"
                        >

                          {/* PERANGKAT */}

                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <span
                                className={`flex h-10 w-10 flex-none items-center justify-center rounded-pill text-[13px] font-extrabold ${
                                  i % 2 === 0
                                    ? "bg-tile-amber text-[#5C3D00]"
                                    : "bg-tile-blue text-primary"
                                }`}
                              >
                                {p.id_perangkat.slice(-2)}
                              </span>

                              <b className="data text-[15px] font-bold">
                                {p.id_perangkat}
                              </b>
                            </div>
                          </td>

                          {/* LOKASI TERAKHIR */}

                          <td className="px-6 py-3">
                            <div className="text-[15px]">
                              {p.lokasi_terakhir ??
                                "Belum ada lokasi"}
                            </div>

                            {titik && (
                              <div className="data text-[13px] text-text-secondary">
                                {titik}
                              </div>
                            )}
                          </td>

                          {/* STATUS DAYA */}

                          <td className="px-6 py-3">
                            <span
                              className={`inline-flex rounded-pill px-3 py-1 text-[13px] font-bold ${gaya.kelas}`}
                            >
                              {gaya.label}
                            </span>
                          </td>

                          {/* KONEKSI */}

                          <td className="px-6 py-3">
                            <StatusPill
                              status={
                                p.status_online
                                  ? "online"
                                  : "offline"
                              }
                              label={
                                p.status_online
                                  ? "Online"
                                  : "Offline"
                              }
                            />
                          </td>

                          {/* DATA DAYA TERAKHIR */}

                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2 text-[15px]">
                              <Clock
                                size={16}
                                strokeWidth={2}
                                className="flex-none text-text-secondary"
                              />

                              {p.daya_updated_at
                                ? waktuRelatif(
                                    p.daya_updated_at
                                  )
                                : "Belum ada data"}
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-[#EDF1F6] px-5 py-2.5 text-sm text-text-secondary">
                Menampilkan {perangkat.length} dari{" "}
                {perangkat.length} perangkat
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}