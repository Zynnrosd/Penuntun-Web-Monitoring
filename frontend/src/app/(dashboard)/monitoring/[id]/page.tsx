// frontend/src/app/(dashboard)/monitoring/[id]/page.tsx

"use client";
import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ChevronDown, Route, WifiOff } from "lucide-react";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/PageHeader";
import { useRealtimePutus, useRealtimeTable } from "@/hooks/useRealtimeTable";
import { inisialNama } from "@/hooks/useSession";
import { jamWIB, koordinat, waktuRelatif } from "@/lib/format";
import type { Perangkat, PenggunaTunanetra, Geofence } from "@/types";

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
  const [zona, setZona] = useState<Geofence[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");

  const [riwayat, setRiwayat] = useState<TitikRiwayat[] | null>(null);
  const [riwayatTerbuka, setRiwayatTerbuka] = useState(false);
  const [memuatRiwayat, setMemuatRiwayat] = useState(false);
  const [galatRiwayat, setGalatRiwayat] = useState("");

  const muat = useCallback(() => {
    Promise.all([
      api.get<Perangkat[]>("/perangkat"),
      api.get<PenggunaTunanetra[]>("/pengguna").catch(() => [] as PenggunaTunanetra[]),
      api.get<Geofence[]>("/geofence").catch(() => [] as Geofence[]),
    ])
      .then(([daftarPerangkat, daftarPengguna, daftarZona]) => {
        setPerangkat(daftarPerangkat.find((p) => p.id_perangkat === id) ?? null);
        setPengguna(daftarPengguna);
        setZona(daftarZona);
        setGalat("");
      })
      .catch((e) => setGalat(e instanceof Error ? e.message : "Gagal memuat data"))
      .finally(() => setMemuat(false));
  }, [id]);

  useEffect(muat, [muat]);
  useRealtimeTable("perangkat", muat);

  const koneksiPutus = useRealtimePutus();

  const muatRiwayat = useCallback(
    () =>
      api
        .get<TitikRiwayat[]>(`/perangkat/${encodeURIComponent(id)}/riwayat`)
        .then((data) => {
          setRiwayat(data);
          setGalatRiwayat("");
        })
        .catch((err) => setGalatRiwayat(err instanceof Error ? err.message : "Gagal memuat riwayat perjalanan")),
    [id]
  );

  useEffect(() => {
    muatRiwayat();
  }, [muatRiwayat]);

  async function toggleRiwayat() {
    if (riwayatTerbuka) {
      setRiwayatTerbuka(false);
      return;
    }

    setRiwayatTerbuka(true);
    setMemuatRiwayat(true);
    await muatRiwayat();
    setMemuatRiwayat(false);
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

  // Zona yayasan selalu tampil; lingkaran kedua muncul bila perangkat ini punya zona khusus.
  const lingkaranZona = [zona.find((z) => z.id_perangkat === null), zona.find((z) => z.id_perangkat === id)]
    .filter((z): z is Geofence => !!z)
    .map((z) => ({ lat: Number(z.center_lat), lng: Number(z.center_long), radius: z.radius_meter, khusus: z.id_perangkat !== null }));

  const titikHenti =
    riwayatTerbuka && riwayat
      ? riwayat.map((t, i) => ({ lat: t.latitude, lng: t.longitude, nomor: i + 1, jam: jamWIB(t.recorded_at) }))
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
                  titikHenti={titikHenti}
                  zona={lingkaranZona}
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

          <div className="flex flex-col gap-4 lg:h-[520px]">
            <section className="shrink-0 rounded-card border-2 border-border bg-surface px-5 py-[18px]">
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

            <section className="flex min-h-0 flex-col rounded-card border-2 border-border bg-surface px-5 py-[18px] lg:flex-1">
              <button
                onClick={toggleRiwayat}
                disabled={memuatRiwayat}
                aria-expanded={riwayatTerbuka}
                aria-controls="daftar-riwayat"
                className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-input bg-surface px-5 text-sm font-bold text-text-primary shadow-[inset_0_0_0_2px_var(--color-border)] transition-colors hover:bg-surface-sunken disabled:opacity-50"
              >
                <Route size={18} strokeWidth={2.2} />
                {memuatRiwayat ? "Memuat riwayat…" : riwayatTerbuka ? "Tutup riwayat perjalanan" : "Lihat riwayat perjalanan"}
                <ChevronDown
                  size={18}
                  strokeWidth={2.2}
                  className={`transition-transform ${riwayatTerbuka ? "rotate-180" : ""}`}
                />
              </button>

              {riwayat && !riwayatTerbuka && (
                <p className="mt-3 text-[13px] leading-5 text-text-secondary">
                  {riwayat.length === 0 ? (
                    "Belum ada titik henti hari ini."
                  ) : (
                    <>
                      <span className="angka font-bold text-text-primary">{riwayat.length}</span> titik henti hari
                      ini. Riwayat direset setiap pukul 00.00 WIB.
                    </>
                  )}
                </p>
              )}

              {riwayatTerbuka && !memuatRiwayat && (
                <div id="daftar-riwayat" className="mt-3 flex min-h-0 flex-1 flex-col">
                  {galatRiwayat ? (
                    <p role="alert" className="rounded-inner bg-danger-soft px-4 py-3 text-sm text-danger-text">
                      {galatRiwayat}
                    </p>
                  ) : riwayat && riwayat.length === 0 ? (
                    <p className="text-[13px] leading-5 text-text-secondary">
                      Titik dicatat saat tongkat diam sekitar 2 menit di satu tempat.
                    </p>
                  ) : riwayat ? (
                    <>
                      <p className="text-[13px] leading-5 text-text-secondary">
                        Bernomor sama dengan titik di peta.
                      </p>

                      <ol className="mt-3 flex max-h-[280px] min-h-0 flex-col overflow-y-auto border-t-2 border-border lg:max-h-none lg:flex-1">
                        {riwayat.map((t, i) => (
                          <li
                            key={t.id_tracking}
                            className="flex shrink-0 items-start gap-3 border-b-2 border-border py-2.5 text-[13px] leading-5"
                          >
                            <span className="angka flex h-6 w-6 flex-none items-center justify-center rounded-pill bg-live text-[11px] font-bold text-white">
                              {i + 1}
                            </span>
                            <span className="min-w-0">
                              <b className="block font-semibold">Berhenti pukul {jamWIB(t.recorded_at)}</b>
                              <span className="data block text-text-secondary">
                                {koordinat(t.latitude, t.longitude)}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ol>
                    </>
                  ) : null}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}