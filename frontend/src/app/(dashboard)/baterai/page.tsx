// frontend/src/app/(dashboard)/baterai/page.tsx

"use client";
import { useCallback, useEffect, useState } from "react";
import { Clock, Info } from "lucide-react";
import { api } from "@/lib/api-client";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { waktuRelatif, koordinat, tingkatBaterai } from "@/lib/format";
import type { Perangkat } from "@/types";

const WARNA_BAR = {
  baik: { isi: "var(--color-success)", garis: undefined },
  sedang: { isi: "var(--color-warning)", garis: "#B07400" },
  kritis: { isi: "var(--color-kritis)", garis: undefined },
  kosong: { isi: "var(--color-offline)", garis: undefined },
} as const;

export default function BateraiPage() {
  const [perangkat, setPerangkat] = useState<Perangkat[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");

  const muat = useCallback(() => {
    api
      .get<Perangkat[]>("/perangkat")
      .then(setPerangkat)
      .catch((e) => setGalat(e instanceof Error ? e.message : "Gagal memuat data"))
      .finally(() => setMemuat(false));
  }, []);

  useEffect(muat, [muat]);
  useRealtimeTable("perangkat", muat);

  const judul = <PageHeader title="Status baterai" subtitle="Status daya seluruh perangkat yang terhubung" />;

  if (memuat) {
    return (
      <>
        {judul}
        <p className="text-[15px] text-text-secondary">Memuat data…</p>
      </>
    );
  }

  if (galat) {
    return (
      <>
        {judul}
        <p className="rounded-inner bg-danger-soft px-[18px] py-3.5 text-[15px] text-danger-text">
          Gagal memuat status baterai: {galat}
        </p>
      </>
    );
  }

  const terurut = [...perangkat].sort(
    (a, b) => (a.baterai_terakhir ?? 101) - (b.baterai_terakhir ?? 101)
  );

  const hitung = (t: "baik" | "sedang" | "kritis") =>
    perangkat.filter((p) => tingkatBaterai(p.baterai_terakhir) === t).length;

  const semuaOffline = perangkat.length > 0 && perangkat.every((p) => !p.status_online);

  return (
    <>
      {judul}

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Baik (di atas 60%)" value={hitung("baik")} tone="success" />
          <StatCard label="Sedang (20 sampai 60%)" value={hitung("sedang")} tone="warning" />
          <StatCard label="Kritis (di bawah 20%)" value={hitung("kritis")} tone="soft" />
        </div>

        {semuaOffline && (
          <div
            role="note"
            className="flex gap-3.5 rounded-inner bg-secondary-soft px-5 py-3.5 text-[15px] leading-[22px]"
          >
            <Info size={22} strokeWidth={2} className="flex-none text-secondary" />
            <span>
              <b>{perangkat.length === 1 ? "Perangkat" : "Semua perangkat"} offline.</b> Persentase di bawah adalah
              data terakhir yang diterima, bukan kondisi saat ini.
            </span>
          </div>
        )}

        <section className="overflow-hidden rounded-card border-2 border-border bg-surface">
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <h2 className="text-lg font-extrabold leading-7">Baterai per perangkat</h2>
            <span className="text-sm text-text-secondary">Diurutkan dari kapasitas terendah</span>
          </div>

          {perangkat.length === 0 ? (
            <p className="px-5 pb-6 text-[15px] text-text-secondary">
              Belum ada perangkat terdaftar. Tambahkan tongkat di halaman Data perangkat agar status dayanya terpantau.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-secondary-soft text-left text-[13px] font-bold uppercase tracking-[0.06em] text-[#3F5B82]">
                      <th scope="col" className="px-6 py-3">Perangkat</th>
                      <th scope="col" className="px-6 py-3">Lokasi terakhir</th>
                      <th scope="col" className="px-6 py-3">Kapasitas</th>
                      <th scope="col" className="px-6 py-3">Status</th>
                      <th scope="col" className="px-6 py-3">Terakhir terlihat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {terurut.map((p, i) => {
                      const tingkat = tingkatBaterai(p.baterai_terakhir);
                      const bar = WARNA_BAR[tingkat];
                      const titik = koordinat(p.lat_terakhir, p.long_terakhir);

                      return (
                        <tr key={p.id_perangkat} className="border-t border-[#EDF1F6]">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <span
                                className={`flex h-10 w-10 flex-none items-center justify-center rounded-pill text-[13px] font-extrabold ${
                                  i % 2 === 0 ? "bg-tile-amber text-[#5C3D00]" : "bg-tile-blue text-primary"
                                }`}
                              >
                                {p.id_perangkat.slice(-2)}
                              </span>
                              <div className="min-w-0">
                                <b className="data block truncate text-[15px] font-bold">{p.id_perangkat}</b>
                                <span className="text-[13px] text-text-secondary">
                                  {p.dipakai_oleh ? "Sedang dipakai" : "Belum dipasangkan"}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-3">
                            <div className="text-[15px]">{p.lokasi_terakhir ?? "Belum ada data lokasi"}</div>
                            {titik && <div className="data text-[13px] text-text-secondary">{titik}</div>}
                          </td>

                          <td className="px-6 py-3">
                            {p.baterai_terakhir == null ? (
                              <span className="text-[15px] text-text-secondary">Belum ada data</span>
                            ) : (
                              <>
                                <div className="flex items-center gap-3">
                                  <span className="h-3 w-40 overflow-hidden rounded-pill bg-surface-sunken shadow-[inset_0_0_0_1px_var(--color-border-strong)]">
                                    <span
                                      className="block h-full rounded-pill"
                                      style={{
                                        width: `${p.baterai_terakhir}%`,
                                        backgroundColor: bar.isi,
                                        boxShadow: bar.garis ? `inset 0 0 0 1px ${bar.garis}` : undefined,
                                      }}
                                    />
                                  </span>
                                  <span className="angka text-[15px] font-bold">{p.baterai_terakhir}%</span>
                                </div>
                                {!p.status_online && (
                                  <div className="mt-0.5 text-[13px] text-text-secondary">Data terakhir diterima</div>
                                )}
                              </>
                            )}
                          </td>

                          <td className="px-6 py-3">
                            <StatusPill
                              status={p.status_online ? "online" : "offline"}
                              label={p.status_online ? "Online" : "Offline"}
                            />
                          </td>

                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2 text-[15px]">
                              <Clock size={16} strokeWidth={2} className="flex-none text-text-secondary" />
                              {waktuRelatif(p.last_active)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-[#EDF1F6] px-5 py-2.5 text-sm text-text-secondary">
                Menampilkan {perangkat.length} dari {perangkat.length} perangkat
              </div>
            </>
          )}
        </section>

        <p className="text-[13px] leading-5 text-text-secondary">
          Perangkat offline tidak memperbarui persentase. Angka akan diperbarui setelah perangkat tersambung kembali.
        </p>
      </div>
    </>
  );
}