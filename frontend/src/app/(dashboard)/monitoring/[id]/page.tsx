// frontend/src/app/(dashboard)/monitoring/[id]/page.tsx

"use client";
import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Route, WifiOff } from "lucide-react";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/PageHeader";
import { useRealtimePutus, useRealtimeTable } from "@/hooks/useRealtimeTable";
import { inisialNama } from "@/hooks/useSession";
import { jamWIB, koordinat, waktuRelatif } from "@/lib/format";
import type { Perangkat, PenggunaTunanetra } from "@/types";

const MapView = dynamic(() => import("@/components/map/MapView").then((m) => m.MapView), { ssr: false });

type TitikRiwayat = {
  id_tracking: number;
  latitude: number;
  longitude: number;
  baterai: number | null;
  recorded_at: string;
};

export default function MonitoringDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [perangkat, setPerangkat] = useState<Perangkat | null>(null);
  const [pengguna, setPengguna] = useState<PenggunaTunanetra[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");

  const [riwayat, setRiwayat] = useState<TitikRiwayat[] | null>(null);
  const [memuatRiwayat, setMemuatRiwayat] = useState(false);
  const [galatRiwayat, setGalatRiwayat] = useState("");

  const muat = useCallback(() => {
    Promise.all([
      api.get<Perangkat[]>("/perangkat"),
      api.get<PenggunaTunanetra[]>("/pengguna").catch(() => [] as PenggunaTunanetra[]),
    ])
      .then(([daftarPerangkat, daftarPengguna]) => {
        setPerangkat(daftarPerangkat.find((p) => p.id_perangkat === id) ?? null);
        setPengguna(daftarPengguna);
        setGalat("");
      })
      .catch((e) => setGalat(e instanceof Error ? e.message : "Gagal memuat data"))
      .finally(() => setMemuat(false));
  }, [id]);

  useEffect(muat, [muat]);
  useRealtimeTable("perangkat", muat);

  const koneksiPutus = useRealtimePutus();

  async function muatRiwayat() {
    setGalatRiwayat("");
    setMemuatRiwayat(true);
    try {
      setRiwayat(await api.get<TitikRiwayat[]>(`/perangkat/${encodeURIComponent(id)}/riwayat`));
    } catch (err) {
      setGalatRiwayat(err instanceof Error ? err.message : "Gagal memuat riwayat perjalanan");
    } finally {
      setMemuatRiwayat(false);
    }
  }

  const judul = <PageHeader title="Monitoring Perangkat" subtitle="Posisi dan status satu perangkat" />;

  const kembali = (
    <Link
      href="/monitoring"
      className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
    >
      <ArrowLeft size={18} strokeWidth={2.2} />
      Kembali ke Pantau lokasi
    </Link>
  );

  if (memuat) {
    return (
      <>
        {judul}
        <p className="text-[15px] text-text-secondary">Memuat perangkat…</p>
      </>
    );
  }

  if (galat) {
    return (
      <>
        {judul}
        <div className="flex flex-col gap-4">
          {kembali}
          <p className="rounded-inner bg-danger-soft px-[18px] py-3.5 text-[15px] text-danger-text">
            Gagal memuat perangkat: {galat}
          </p>
        </div>
      </>
    );
  }

  if (!perangkat) {
    return (
      <>
        {judul}
        <div className="flex flex-col gap-4">
          {kembali}
          <div className="rounded-card border-2 border-border bg-surface p-8 text-center">
            <h2 className="text-[22px] font-extrabold leading-8">Perangkat tidak ditemukan</h2>
            <p className="mt-2 text-[15px] leading-6 text-text-secondary">
              Kode <span className="data">{id}</span> tidak ada di daftar perangkat yayasan ini, atau sudah dihapus.
            </p>
          </div>
        </div>
      </>
    );
  }

  const nama = pengguna.find((u) => u.id_tunanetra === perangkat.dipakai_oleh);
  const namaTampil = perangkat.pengguna?.nama_tunanetra ?? nama?.nama_tunanetra ?? "Belum dipasangkan";
  const titik = koordinat(perangkat.lat_terakhir, perangkat.long_terakhir);
  const adaPosisi = perangkat.lat_terakhir != null && perangkat.long_terakhir != null;

  const jalur = riwayat
    ? [...riwayat].reverse().map((t) => ({ lat: t.latitude, lng: t.longitude }))
    : undefined;

  return (
    <>
      {judul}

      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {kembali}

          {perangkat.status_sos ? (
            <span className="animate-pulse-sos flex items-center rounded-pill bg-danger px-3.5 py-1 text-[13px] font-bold text-white">
              SOS aktif
            </span>

          ) : perangkat.status_online && !koneksiPutus ? (
            <span className="flex items-center gap-2 rounded-pill bg-success-soft px-3.5 py-1 text-[13px] font-bold text-success-text">
              <i className="h-2 w-2 rounded-pill bg-live" />
              Live · data masuk sekarang
            </span>
          ) : (
            <span className="flex items-center gap-2 rounded-pill bg-secondary-soft px-3.5 py-1 text-[13px] font-bold text-[#1F3556]">
              <i className="h-2 w-2 rounded-pill bg-offline" />
              {perangkat.status_online
                ? `Koneksi live terputus · data terakhir ${waktuRelatif(perangkat.last_active)}`
                : `Offline · terakhir terlihat ${waktuRelatif(perangkat.last_active)}`}
            </span>
          )}
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section
            className="relative h-[420px] overflow-hidden rounded-card border-2 border-border bg-surface-sunken lg:h-[520px]"
            aria-label="Peta posisi perangkat"
          >
            {adaPosisi ? (
              <>
                <MapView
                  markers={[
                    {
                      id_perangkat: perangkat.id_perangkat,
                      nama: namaTampil,
                      lat: perangkat.lat_terakhir as number,
                      lng: perangkat.long_terakhir as number,
                      online: perangkat.status_online,
                      sos: perangkat.status_sos,
                    },
                  ]}
                  path={jalur}
                />

                {!perangkat.status_online && (
                  <div className="pointer-events-none absolute left-[60px] right-4 top-4 z-[500] flex items-center gap-2.5 rounded-inner border-2 border-border bg-surface px-3.5 py-2.5 text-sm leading-5 shadow-card">
                    <WifiOff size={18} strokeWidth={2} className="flex-none text-offline" />
                    <span>
                      <b className="font-semibold">Perangkat offline.</b> Peta menampilkan posisi terakhir yang
                      diterima, bukan posisi saat ini.
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center p-8">
                <p className="max-w-sm text-center text-[15px] leading-6 text-text-secondary">
                  Tongkat ini belum pernah mengirim koordinat, jadi belum ada posisi yang bisa ditampilkan di peta.
                </p>
              </div>
            )}
          </section>

          <div className="flex flex-col gap-4">
            <section className="rounded-card border-2 border-border bg-surface px-5 py-[18px]">
              <div className="mb-3.5 flex items-center gap-3">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-pill bg-tile-blue text-[13px] font-extrabold text-primary">
                  {inisialNama(namaTampil)}
                </span>
                <div className="min-w-0">
                  <b className="block truncate font-bold leading-5">{namaTampil}</b>
                  <span className="data block text-[13px] leading-4 text-text-secondary">
                    {perangkat.id_perangkat}
                  </span>
                </div>
              </div>

              <dl className="grid grid-cols-[96px_minmax(0,1fr)] gap-x-2 gap-y-1.5 text-[13px] leading-5">
                <dt className="text-text-secondary">Baterai</dt>
                <dd className="font-medium">
                  {perangkat.baterai_terakhir == null ? (
                    "Belum ada data"
                  ) : (
                    <>
                      <span className="angka">{perangkat.baterai_terakhir}%</span>{" "}
                      <span className="font-normal text-text-secondary">
                        {perangkat.status_online ? "terbaru" : "data terakhir"}
                      </span>
                    </>
                  )}
                </dd>

                <dt className="text-text-secondary">Lokasi</dt>
                <dd className="font-medium">{perangkat.lokasi_terakhir ?? "Belum diketahui"}</dd>

                <dt className="text-text-secondary">Koordinat</dt>
                <dd className="data font-medium">{titik ?? "—"}</dd>

                <dt className="text-text-secondary">Alamat</dt>
                <dd className="font-medium">{nama?.alamat ?? "Belum diisi"}</dd>
              </dl>
            </section>

            <section className="rounded-card border-2 border-border bg-surface px-5 py-[18px]">
              <button
                onClick={muatRiwayat}
                disabled={memuatRiwayat}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-input bg-surface px-5 text-sm font-bold text-text-primary shadow-[inset_0_0_0_2px_var(--color-border)] transition-colors hover:bg-surface-sunken disabled:opacity-50"
              >
                <Route size={18} strokeWidth={2.2} />
                {memuatRiwayat ? "Memuat riwayat…" : riwayat ? "Muat ulang riwayat" : "Lihat riwayat perjalanan"}
              </button>

              {galatRiwayat && (
                <p role="alert" className="mt-3 rounded-inner bg-danger-soft px-4 py-3 text-sm text-danger-text">
                  {galatRiwayat}
                </p>
              )}

              {riwayat && riwayat.length === 0 && (
                <p className="mt-3 text-[13px] leading-5 text-text-secondary">
                  Belum ada titik perjalanan yang tersimpan untuk perangkat ini.
                </p>
              )}

              {riwayat && riwayat.length > 0 && (
                <p className="mt-3 text-[13px] leading-5 text-text-secondary">
                  <span className="angka">{riwayat.length}</span> titik tergambar di peta, dari{" "}
                  {jamWIB(riwayat[riwayat.length - 1].recorded_at)} sampai {jamWIB(riwayat[0].recorded_at)}.
                  {riwayat.length === 200 && " Hanya 200 titik terbaru yang ditampilkan."}
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}