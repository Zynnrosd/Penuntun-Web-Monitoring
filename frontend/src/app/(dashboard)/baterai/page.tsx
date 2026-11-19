"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { koordinat } from "@/lib/format";
import type { Perangkat } from "@/types";

type PerangkatDaya = Perangkat & {
  tegangan_5v?: number | null;
  undervoltage?: boolean | null;
  daya_updated_at?: string | null;
  uptime_seconds?: number | null;
};

type KondisiDaya = "NORMAL" | "KRITIS" | "TIDAK_DIKETAHUI";

const BATAS_DATA_LAMA_MS = 60_000;
const BATAS_OFFLINE_MS = 90_000;

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

// ================================================
// STATUS KONEKSI PERANGKAT
// ================================================

function koneksiAktif(
  p: PerangkatDaya,
  sekarang: number
): boolean {
  if (!p.status_online || !p.last_active) {
    return false;
  }

  const waktu = Date.parse(p.last_active);

  return (
    Number.isFinite(waktu) &&
    sekarang >= waktu - 10_000 &&
    sekarang - waktu <= BATAS_OFFLINE_MS
  );
}

// ================================================
// KONDISI DAYA RASPBERRY PI
// ================================================

// Status berdasarkan undervoltage suplai 5V,
// bukan persentase baterai 18650.

function kondisiDaya(
  p: PerangkatDaya,
  sekarang: number
): KondisiDaya {
  if (!koneksiAktif(p, sekarang) || !p.daya_updated_at) {
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

// ================================================
// FORMAT DURASI MENYALA
// ================================================

function formatDurasi(totalDetik: number): string {
  const s = Math.max(0, Math.floor(totalDetik));

  const hari = Math.floor(s / 86400);
  const jam = Math.floor((s % 86400) / 3600);
  const menit = Math.floor((s % 3600) / 60);
  const detik = s % 60;

  const bagian: string[] = [];

  if (hari) {
    bagian.push(`${hari} hari`);
  }

  if (hari || jam) {
    bagian.push(`${jam.toString().padStart(2, "0")} jam`);
  }

  bagian.push(
    `${menit.toString().padStart(2, "0")} menit`
  );

  bagian.push(
    `${detik.toString().padStart(2, "0")} detik`
  );

  return bagian.join(" ");
}

// ================================================
// UPTIME RASPBERRY PI
// ================================================

// Durasi menyala dihitung dari laporan MQTT.
// Jika perangkat offline, durasi tidak ditambah.

function durasiMenyala(
  p: PerangkatDaya,
  sekarang: number
): {
  teks: string;
  terbaru: boolean;
} {
  if (
    p.uptime_seconds == null ||
    !Number.isFinite(Number(p.uptime_seconds)) ||
    !p.daya_updated_at
  ) {
    return {
      teks: "Belum tersedia",
      terbaru: false,
    };
  }

  const laporan = Date.parse(p.daya_updated_at);

  if (!Number.isFinite(laporan)) {
    return {
      teks: "Belum tersedia",
      terbaru: false,
    };
  }

  const aktif = koneksiAktif(p, sekarang);

  const segar =
    sekarang >= laporan - 10_000 &&
    sekarang - laporan <= BATAS_DATA_LAMA_MS;

  const tambahan =
    aktif && segar
      ? Math.max(0, (sekarang - laporan) / 1000)
      : 0;

  return {
    teks: formatDurasi(
      Number(p.uptime_seconds) + tambahan
    ),
    terbaru: aktif && segar,
  };
}

// ================================================
// HALAMAN STATUS DAYA
// ================================================

export default function BateraiPage() {
  const [perangkat, setPerangkat] = useState<PerangkatDaya[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [sekarang, setSekarang] = useState(0);

  // ==============================================
  // AMBIL DATA DARI BACKEND
  // ==============================================

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

  // ==============================================
  // REFRESH OTOMATIS
  // ==============================================

  useEffect(() => {
    setSekarang(Date.now());
    muat();

    // Hitungan waktu diperbarui setiap 1 detik.
    const jam = window.setInterval(() => {
      setSekarang(Date.now());
    }, 1000);

    // Ambil data backend setiap 15 detik.
    const polling = window.setInterval(muat, 15_000);

    return () => {
      window.clearInterval(jam);
      window.clearInterval(polling);
    };
  }, [muat]);

  useRealtimeTable("perangkat", muat);

  const judul = (
    <PageHeader
      title="Status Daya"
      subtitle="Pemantauan kondisi daya dan durasi menyala perangkat PENUNTUN"
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

  // ==============================================
  // RINGKASAN STATUS
  // ==============================================

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

        {/* RINGKASAN KONDISI DAYA */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Normal"
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

        <p className="text-sm leading-6 text-text-secondary">
          
        </p>

        {/* TABEL DAYA PER PERANGKAT */}

        <section className="overflow-hidden rounded-card border-2 border-border bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <h2 className="text-lg font-extrabold leading-7">
              Daya per perangkat
            </h2>

            <span className="text-sm text-text-secondary">
              Status kritis ditampilkan lebih dahulu
            </span>
          </div>

          {perangkat.length === 0 ? (
            <p className="px-5 pb-6 text-[15px] text-text-secondary">
              Belum ada perangkat terdaftar.
            </p>
          ) : (
            <>
              <div className="overflow-auto md:max-h-[max(260px,calc(100vh-400px))] [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-10 [&_thead_th]:bg-secondary-soft">

                <table className="tabel-kartu w-full min-w-[960px] table-fixed">

                  <colgroup>
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "22%" }} />
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "28%" }} />
                  </colgroup>

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
                        Lama menyala
                      </th>

                    </tr>
                  </thead>

                  <tbody>
                    {terurut.map((p, i) => {
                      const kondisi = kondisiDaya(p, sekarang);
                      const gaya = GAYA[kondisi];

                      const titik = koordinat(
                        p.lat_terakhir,
                        p.long_terakhir
                      );

                      const aktif = koneksiAktif(
                        p,
                        sekarang
                      );

                      const lama = durasiMenyala(
                        p,
                        sekarang
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

                              <span className="data text-[15px] font-bold">
                                {p.id_perangkat}
                              </span>
                            </div>
                          </td>

                          {/* LOKASI TERAKHIR */}

                          <td
                            data-label="Lokasi terakhir"
                            className="px-6 py-3"
                          >
                            <div className="data text-[15px]">
                              {titik ?? "Belum ada lokasi"}
                            </div>
                          </td>

                          {/* STATUS DAYA */}

                          <td
                            data-label="Status daya"
                            className="px-6 py-3"
                          >
                            <span
                              className={`inline-flex rounded-pill px-3 py-1 text-[13px] font-bold ${gaya.kelas}`}
                            >
                              {gaya.label}
                            </span>
                          </td>

                          {/* KONEKSI */}

                          <td
                            data-label="Koneksi"
                            className="px-6 py-3"
                          >
                            <StatusPill
                              status={
                                aktif ? "online" : "offline"
                              }
                              label={
                                aktif ? "Online" : "Offline"
                              }
                            />
                          </td>

                          {/* LAMA MENYALA */}

                          <td
                            data-label="Lama menyala"
                            className="px-6 py-3"
                          >
                            <div className="whitespace-nowrap text-[14px] font-normal tabular-nums">
                              {lama.teks}
                            </div>

                            {!lama.terbaru &&
                              p.uptime_seconds != null && (
                                <div className="mt-1 text-[12px] font-normal text-text-secondary">
                                  Data terakhir tercatat
                                </div>
                              )}
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