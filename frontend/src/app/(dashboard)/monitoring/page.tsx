// frontend/src/app/(dashboard)/monitoring/page.tsx

"use client";
import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { BatteryMedium, Clock, MapPin, Navigation, Search, WifiOff } from "lucide-react";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/PageHeader";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { inisialNama } from "@/hooks/useSession";
import { koordinat, waktuRelatif } from "@/lib/format";
import type { Perangkat, Geofence } from "@/types";

const MapView = dynamic(() => import("@/components/map/MapView").then((m) => m.MapView), { ssr: false });

type Saringan = "SEMUA" | "ONLINE" | "OFFLINE";

const LABEL_SARINGAN: Record<Saringan, string> = {
  SEMUA: "Semua",
  ONLINE: "Online",
  OFFLINE: "Offline",
};

function keadaan(p: Perangkat) {
  if (p.status_sos) return "SOS" as const;
  return p.status_online ? ("ONLINE" as const) : ("OFFLINE" as const);
}

function Lencana({ p }: { p: Perangkat }) {
  const k = keadaan(p);

  if (k === "SOS") {
    return (
      <span className="flex flex-none items-center rounded-pill bg-danger px-3 py-0.5 text-[13px] font-bold text-white">
        SOS
      </span>
    );
  }

  return (
    <span
      className={`flex flex-none items-center gap-1.5 rounded-pill px-3 py-0.5 text-[13px] font-bold ${
        k === "ONLINE" ? "bg-success-soft text-success-text" : "bg-secondary-soft text-[#1F3556]"
      }`}
    >
      <i className={`h-2 w-2 rounded-pill ${k === "ONLINE" ? "bg-live" : "bg-offline"}`} />
      {k === "ONLINE" ? "Online" : "Offline"}
    </span>
  );
}

export default function MonitoringPage() {
  const [perangkat, setPerangkat] = useState<Perangkat[]>([]);
  const [zona, setZona] = useState<Geofence[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");

  const [saringan, setSaringan] = useState<Saringan>("SEMUA");
  const [cari, setCari] = useState("");
  const [idPilih, setIdPilih] = useState<string | null>(null);

  const muat = useCallback(() => {
    Promise.all([
      api.get<Perangkat[]>("/perangkat"),
      api.get<Geofence[]>("/geofence").catch(() => [] as Geofence[]),
    ])
      .then(([data, zonaAman]) => {
        setPerangkat(data);
        setZona(zonaAman);
        setGalat("");
      })
      .catch((e) => setGalat(e instanceof Error ? e.message : "Gagal memuat data"))
      .finally(() => setMemuat(false));
  }, []);

  useEffect(muat, [muat]);
  useRealtimeTable("perangkat", muat);

  const jumlah = {
    online: perangkat.filter((p) => p.status_online && !p.status_sos).length,
    offline: perangkat.filter((p) => !p.status_online && !p.status_sos).length,
    sos: perangkat.filter((p) => p.status_sos).length,
  };

  const ringkasan = (
    <div className="flex flex-wrap gap-2.5">
      {[
        { warna: "bg-live", teks: `${jumlah.online} online` },
        { warna: "bg-offline", teks: `${jumlah.offline} offline` },
        { warna: "bg-danger", teks: `${jumlah.sos} SOS` },
      ].map((s) => (
        <span
          key={s.teks}
          className="flex h-[34px] items-center gap-2 rounded-pill bg-surface px-3.5 text-[13px] font-semibold text-text-secondary"
        >
          <i className={`h-2 w-2 rounded-pill ${s.warna}`} />
          {s.teks}
        </span>
      ))}
    </div>
  );

  const judul = (
    <PageHeader
      title="Monitoring Lokasi"
      subtitle="Pantau posisi pengguna secara real-time"
      aksi={perangkat.length > 0 ? ringkasan : undefined}
    />
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
        <p className="rounded-inner bg-danger-soft px-[18px] py-3.5 text-[15px] text-danger-text">
          Gagal memuat perangkat: {galat}
        </p>
      </>
    );
  }

  const kunci = cari.trim().toLowerCase();
  const terlihat = perangkat.filter((p) => {
    const k = keadaan(p);
    if (saringan === "ONLINE" && k === "OFFLINE") return false;
    if (saringan === "OFFLINE" && k !== "OFFLINE") return false;
    if (!kunci) return true;
    return (
      p.id_perangkat.toLowerCase().includes(kunci) ||
      (p.pengguna?.nama_tunanetra ?? "").toLowerCase().includes(kunci)
    );
  });

  const berlokasi = perangkat.filter((p) => p.lat_terakhir != null && p.long_terakhir != null);
  const pilih = perangkat.find((p) => p.id_perangkat === idPilih) ?? null;
  const adaYangOffline = jumlah.offline > 0;

  // Zona yayasan selalu tampil; lingkaran kedua muncul bila perangkat terpilih punya zona khusus.
  const zonaYayasan = zona.find((z) => z.id_perangkat === null);
  const zonaKhusus = idPilih ? zona.find((z) => z.id_perangkat === idPilih) : undefined;
  const lingkaranZona = [zonaYayasan, zonaKhusus]
    .filter((z): z is Geofence => !!z)
    .map((z) => ({ lat: Number(z.center_lat), lng: Number(z.center_long), radius: z.radius_meter, khusus: z.id_perangkat !== null }));

  return (
    <>
      {judul}

      <div className="grid items-stretch gap-5 lg:h-[calc(100vh-140px)] lg:min-h-[480px] lg:grid-cols-[352px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
        <aside
          className="flex min-h-0 flex-col gap-3.5 rounded-card border-2 border-border bg-surface p-5"
          aria-label="Daftar perangkat"
        >
          <h2 className="text-[18px] font-extrabold leading-7">Daftar perangkat</h2>

          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="Cari pengguna atau ID"
              aria-label="Cari pengguna atau ID perangkat"
              className="h-11 w-full rounded-field bg-field pl-11 pr-4 text-sm outline-none focus:shadow-[inset_0_0_0_2px_var(--color-ring)]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(Object.keys(LABEL_SARINGAN) as Saringan[]).map((s) => {
              const n = s === "SEMUA" ? perangkat.length : s === "ONLINE" ? jumlah.online + jumlah.sos : jumlah.offline;
              return (
                <button
                  key={s}
                  onClick={() => setSaringan(s)}
                  aria-pressed={saringan === s}
                  className={`flex h-9 items-center gap-1.5 rounded-pill px-4 text-[13px] transition-colors ${
                    saringan === s
                      ? "bg-secondary font-bold text-white"
                      : "bg-surface font-semibold text-text-secondary shadow-[inset_0_0_0_1.5px_var(--color-border)] hover:bg-surface-sunken"
                  }`}
                >
                  {LABEL_SARINGAN[s]}
                  <span className="angka text-[13px] opacity-75">{n}</span>
                </button>
              );
            })}
          </div>

          {perangkat.length === 0 ? (
            <p className="text-sm leading-5 text-text-secondary">
              Belum ada perangkat terdaftar. Tambahkan tongkat lebih dulu di halaman Data perangkat.
            </p>
          ) : terlihat.length === 0 ? (
            <p className="text-sm leading-5 text-text-secondary">
              {kunci
                ? `Tidak ada perangkat yang cocok dengan “${cari.trim()}”.`
                : saringan === "ONLINE"
                  ? "Tidak ada perangkat yang sedang online."
                  : "Semua perangkat sedang online."}
            </p>
          ) : (
            <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-1 py-0.5">
              {terlihat.map((p, i) => {
                const dipilih = p.id_perangkat === idPilih;
                return (
                  <button
                    key={p.id_perangkat}
                    onClick={() => setIdPilih(dipilih ? null : p.id_perangkat)}
                    aria-current={dipilih}
                    className={`flex flex-col gap-3 rounded-card p-4 text-left transition-colors ${
                      dipilih
                        ? "bg-surface shadow-[inset_0_0_0_2.5px_var(--color-ring)]"
                        : "bg-surface-sunken hover:bg-primary-soft"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`flex h-10 w-10 flex-none items-center justify-center rounded-pill text-[13px] font-extrabold ${
                          i % 2 === 0 ? "bg-tile-amber text-[#5C3D00]" : "bg-tile-blue text-primary"
                        }`}
                      >
                        {inisialNama(p.pengguna?.nama_tunanetra)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <b className="block truncate font-bold leading-5">
                          {p.pengguna?.nama_tunanetra ?? "Belum dipasangkan"}
                        </b>
                        <span className="data block text-[13px] leading-4 text-text-secondary">
                          {p.id_perangkat}
                        </span>
                      </span>
                      <Lencana p={p} />
                    </span>

                    <span className="flex flex-col gap-1 text-[13px] leading-5">
                      <span className="flex items-center gap-2">
                        <Clock size={15} strokeWidth={2} className="flex-none text-text-secondary" />
                        {p.status_online ? "Terhubung sekarang" : `Terakhir terlihat ${waktuRelatif(p.last_active)}`}
                      </span>
                      <span className="flex items-center gap-2 text-text-secondary">
                        <MapPin size={15} strokeWidth={2} className="flex-none" />
                        <span className="truncate">{p.lokasi_terakhir ?? "Lokasi belum diketahui"}</span>
                      </span>
                      <span className="flex items-center gap-2 text-text-secondary">
                        <BatteryMedium size={15} strokeWidth={2} className="flex-none" />
                        {p.baterai_terakhir == null ? "Baterai belum ada data" : `Baterai ${p.baterai_terakhir}%`}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <section
          className="relative h-[420px] overflow-hidden rounded-card border-2 border-border bg-surface-sunken lg:h-auto"
          aria-label="Peta lokasi perangkat"
        >
          {berlokasi.length === 0 ? (
            <div className="flex h-full items-center justify-center p-8">
              <p className="max-w-sm text-center text-[15px] leading-6 text-text-secondary">
                Belum ada koordinat yang masuk. Peta akan terisi begitu tongkat mengirim posisi pertamanya.
              </p>
            </div>
          ) : (
            <>
              <MapView
                markers={berlokasi.map((p) => ({
                  id_perangkat: p.id_perangkat,
                  nama: p.pengguna?.nama_tunanetra ?? p.id_perangkat,
                  lat: p.lat_terakhir as number,
                  lng: p.long_terakhir as number,
                  online: p.status_online,
                  sos: p.status_sos,
                }))}
                zona={lingkaranZona}
              />

              {adaYangOffline && (
                <div className="pointer-events-none absolute left-[60px] right-4 top-4 z-[500] flex items-center gap-2.5 rounded-inner border-2 border-border bg-surface px-3.5 py-2.5 text-sm leading-5 shadow-card">
                  <WifiOff size={18} strokeWidth={2} className="flex-none text-offline" />
                  <span>
                    <b className="font-semibold">
                      {jumlah.offline === perangkat.length
                        ? "Semua perangkat offline."
                        : `${jumlah.offline} perangkat offline.`}
                    </b>{" "}
                    Titiknya adalah lokasi terakhir yang diterima, bukan posisi saat ini.
                  </span>
                </div>
              )}

              <div className="pointer-events-none absolute bottom-4 left-4 z-[500] flex gap-4 rounded-inner border-2 border-border bg-surface px-3 py-2 text-[13px] leading-4 text-text-secondary">
                {[
                  { warna: "bg-live", teks: "Online" },
                  { warna: "bg-offline", teks: "Offline" },
                  { warna: "bg-danger", teks: "SOS" },
                ].map((l) => (
                  <span key={l.teks} className="flex items-center gap-1.5">
                    <i className={`h-2.5 w-2.5 rounded-pill ${l.warna}`} />
                    {l.teks}
                  </span>
                ))}
              </div>

              {pilih && (
                <div className="animate-fade-up absolute bottom-7 right-4 z-[500] flex w-[320px] max-w-[calc(100%-2rem)] flex-col gap-3 rounded-card bg-surface p-4 shadow-float">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-[17px] font-extrabold leading-6">
                        {pilih.pengguna?.nama_tunanetra ?? "Belum dipasangkan"}
                      </h3>
                      <span className="data text-[13px] text-text-secondary">{pilih.id_perangkat}</span>
                    </div>
                    <Lencana p={pilih} />
                  </div>

                  <dl className="grid grid-cols-[104px_minmax(0,1fr)] gap-x-2 gap-y-1.5 text-[13px] leading-5">
                    <dt className="text-text-secondary">Terakhir terlihat</dt>
                    <dd className="font-medium">
                      {pilih.status_online ? "Terhubung sekarang" : waktuRelatif(pilih.last_active)}
                    </dd>

                    <dt className="text-text-secondary">Lokasi</dt>
                    <dd className="font-medium">{pilih.lokasi_terakhir ?? "Belum diketahui"}</dd>

                    <dt className="text-text-secondary">Koordinat</dt>
                    <dd className="data font-medium">
                      {koordinat(pilih.lat_terakhir, pilih.long_terakhir) ?? "—"}
                    </dd>

                    <dt className="text-text-secondary">Baterai</dt>
                    <dd className="font-medium">
                      {pilih.baterai_terakhir == null ? "Belum ada data" : `${pilih.baterai_terakhir}%`}
                    </dd>
                  </dl>

                  <Link
                    href={`/monitoring/${pilih.id_perangkat}`}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-input bg-secondary px-5 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
                  >
                    <Navigation size={17} strokeWidth={2.2} />
                    Buka monitoring
                  </Link>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}