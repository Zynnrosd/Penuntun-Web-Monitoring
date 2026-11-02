// frontend/src/app/(dashboard)/notifikasi/page.tsx

"use client";
import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AlertTriangle, Check, Clock, MapPin, RotateCcw, Send, UserCheck } from "lucide-react";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/Button";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { useSession, inisialNama } from "@/hooks/useSession";
import { jamWIB, koordinat, waktuRelatif } from "@/lib/format";
import type { Notifikasi, NotifikasiDelivery } from "@/types";

const MapView = dynamic(() => import("@/components/map/MapView").then((m) => m.MapView), { ssr: false });

type Saringan = "SEMUA" | "AKTIF" | "DITANGANI" | "SELESAI";

const LABEL_SARINGAN: Record<Saringan, string> = {
  SEMUA: "Semua",
  AKTIF: "Aktif",
  DITANGANI: "Ditangani",
  SELESAI: "Selesai",
};

const RONA_STATUS: Record<Notifikasi["status"], string> = {
  AKTIF: "bg-danger text-white",
  DITANGANI: "bg-warning-soft text-warning-text",
  SELESAI: "bg-success-soft text-success-text",
};

const RONA_INISIAL: Record<Notifikasi["status"], string> = {
  AKTIF: "bg-danger-soft text-danger-text",
  DITANGANI: "bg-warning-soft text-warning-text",
  SELESAI: "bg-success-soft text-success-text",
};

const TEKS_STATUS: Record<Notifikasi["status"], string> = {
  AKTIF: "Belum ditangani",
  DITANGANI: "Sedang ditangani",
  SELESAI: "Selesai",
};

function ringkasKirim(daftar: NotifikasiDelivery[] = []) {
  return {
    total: daftar.length,
    terkirim: daftar.filter((d) => d.status === "SENT").length,
    menunggu: daftar.filter((d) => d.status === "PENDING").length,
    gagal: daftar.filter((d) => d.status === "FAILED"),
  };
}

export default function NotifikasiPage() {
  const { sesi } = useSession();

  const [daftar, setDaftar] = useState<Notifikasi[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");

  const [saringan, setSaringan] = useState<Saringan>("SEMUA");
  const [idPilih, setIdPilih] = useState<number | null>(null);
  const [galatAksi, setGalatAksi] = useState("");
  const [memproses, setMemproses] = useState(false);

  const muat = useCallback(() => {
    api
      .get<Notifikasi[]>("/notifikasi")
      .then(setDaftar)
      .catch((e) => setGalat(e instanceof Error ? e.message : "Gagal memuat data"))
      .finally(() => setMemuat(false));
  }, []);

  useEffect(muat, [muat]);
  useRealtimeTable("notifikasi", muat);

  async function jalankan(aksi: () => Promise<unknown>, pesanGagal: string) {
    setGalatAksi("");
    setMemproses(true);
    try {
      await aksi();
      muat();
    } catch (err) {
      setGalatAksi(err instanceof Error ? err.message : pesanGagal);
    } finally {
      setMemproses(false);
    }
  }

  const judul = <PageHeader title="Notifikasi SOS" subtitle="Riwayat SOS dan status pengiriman WhatsApp" />;

  if (memuat) {
    return (
      <>
        {judul}
        <p className="text-[15px] text-text-secondary">Memuat insiden…</p>
      </>
    );
  }

  if (galat) {
    return (
      <>
        {judul}
        <p className="rounded-inner bg-danger-soft px-[18px] py-3.5 text-[15px] text-danger-text">
          Gagal memuat notifikasi: {galat}
        </p>
      </>
    );
  }

  const jumlah: Record<Saringan, number> = {
    SEMUA: daftar.length,
    AKTIF: daftar.filter((n) => n.status === "AKTIF").length,
    DITANGANI: daftar.filter((n) => n.status === "DITANGANI").length,
    SELESAI: daftar.filter((n) => n.status === "SELESAI").length,
  };

  const gagalKirim = daftar.filter((n) => ringkasKirim(n.notifikasi_delivery).gagal.length > 0).length;

  const terlihat = saringan === "SEMUA" ? daftar : daftar.filter((n) => n.status === saringan);
  const pilih = daftar.find((n) => n.id_notifikasi === idPilih) ?? null;

  return (
    <>
      {judul}

      <div className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="SOS aktif"
            value={jumlah.AKTIF}
            tone="danger"
            icon={<AlertTriangle size={22} strokeWidth={2.2} />}
          />
          <StatCard
            label="Sedang ditangani"
            value={jumlah.DITANGANI}
            tone="success"
            icon={<UserCheck size={22} strokeWidth={2.2} />}
          />
          <StatCard
            label="Pengiriman WhatsApp gagal"
            value={gagalKirim}
            tone="soft"
            icon={<Send size={22} strokeWidth={2.2} />}
          />
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[372px_minmax(0,1fr)]">
          <aside className="rounded-card border-2 border-border bg-surface p-5" aria-label="Daftar insiden">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(LABEL_SARINGAN) as Saringan[]).map((s) => (
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
                  <span className="angka text-[13px] opacity-75">{jumlah[s]}</span>
                </button>
              ))}
            </div>

            {daftar.length === 0 ? (
              <p className="mt-5 text-sm leading-5 text-text-secondary">
                Belum ada insiden. Notifikasi muncul di sini saat tongkat menekan tombol SOS atau keluar dari zona
                aman.
              </p>
            ) : terlihat.length === 0 ? (
              <p className="mt-5 text-sm leading-5 text-text-secondary">
                {saringan === "AKTIF"
                  ? "Tidak ada SOS yang menunggu. Semua insiden sudah diambil."
                  : saringan === "DITANGANI"
                    ? "Tidak ada insiden yang sedang ditangani."
                    : "Belum ada insiden yang ditandai selesai."}
              </p>
            ) : (
              <div className="mt-4 flex max-h-[520px] flex-col gap-2.5 overflow-y-auto">
                {terlihat.map((n) => {
                  const dipilih = n.id_notifikasi === idPilih;
                  return (
                    <button
                      key={n.id_notifikasi}
                      onClick={() => {
                        setIdPilih(n.id_notifikasi);
                        setGalatAksi("");
                      }}
                      aria-current={dipilih}
                      className={`flex items-center gap-3 rounded-inner p-4 text-left transition-colors ${
                        dipilih
                          ? "bg-surface shadow-[inset_0_0_0_2.5px_var(--color-ring)]"
                          : "bg-surface-sunken hover:bg-primary-soft"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 flex-none items-center justify-center rounded-pill text-[13px] font-bold ${
                          RONA_INISIAL[n.status]
                        } ${n.status === "AKTIF" ? "animate-pulse-sos" : ""}`}
                      >
                        {inisialNama(n.nama_snapshot)}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <b className="truncate font-bold leading-5">{n.nama_snapshot ?? "Nama tidak tercatat"}</b>
                          <span className="data flex-none text-[13px] text-text-secondary">
                            {jamWIB(n.occurred_at)}
                          </span>
                        </span>
                        <span className="mt-0.5 flex items-center justify-between gap-2">
                          <span className="truncate text-[13px] leading-[18px] text-text-secondary">
                            <span className="data">{n.id_perangkat ?? "—"}</span> · {waktuRelatif(n.occurred_at)}
                          </span>
                          <span
                            className={`flex-none rounded-pill px-3 py-0.5 text-[13px] font-bold ${
                              RONA_STATUS[n.status]
                            }`}
                          >
                            {n.status === "AKTIF" ? "SOS aktif" : TEKS_STATUS[n.status]}
                          </span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          {pilih ? (
            <DetailInsiden
              insiden={pilih}
              idSaya={sesi?.id_admin ?? null}
              memproses={memproses}
              galat={galatAksi}
              onTangani={() =>
                jalankan(() => api.patch(`/notifikasi/${pilih.id_notifikasi}/tangani`, {}), "Gagal mengambil insiden")
              }
              onAmbilAlih={() =>
                jalankan(
                  () => api.patch(`/notifikasi/${pilih.id_notifikasi}/ambil-alih`, {}),
                  "Gagal mengambil alih insiden"
                )
              }
              onSelesai={() =>
                jalankan(() => api.patch(`/notifikasi/${pilih.id_notifikasi}/selesai`, {}), "Gagal menandai selesai")
              }
              onKirimUlang={(idDelivery) =>
                jalankan(
                  () => api.post(`/notifikasi/delivery/${idDelivery}/kirim-ulang`, {}),
                  "Gagal menjadwalkan pengiriman ulang"
                )
              }
            />
          ) : (
            <section className="flex min-h-[420px] items-center justify-center rounded-card border-2 border-border bg-surface p-8">
              <p className="max-w-sm text-center text-[15px] leading-6 text-text-secondary">
                Pilih satu insiden di sebelah kiri untuk melihat lokasi saat tombol ditekan, riwayat pengiriman
                WhatsApp, dan tindakan yang tersedia.
              </p>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

function DetailInsiden({
  insiden,
  idSaya,
  memproses,
  galat,
  onTangani,
  onAmbilAlih,
  onSelesai,
  onKirimUlang,
}: {
  insiden: Notifikasi;
  idSaya: string | null;
  memproses: boolean;
  galat: string;
  onTangani: () => void;
  onAmbilAlih: () => void;
  onSelesai: () => void;
  onKirimUlang: (idDelivery: number) => void;
}) {
  const kirim = ringkasKirim(insiden.notifikasi_delivery);
  const sayaYangPegang = idSaya != null && insiden.ditangani_oleh === idSaya;
  const nama = insiden.nama_snapshot ?? "pengguna tidak tercatat";
  const titik = koordinat(insiden.latitude_sos, insiden.longitude_sos);

  return (
    <section
      className="animate-fade-up flex flex-col overflow-hidden rounded-card border-2 border-border bg-surface"
      aria-label={`Detail insiden ${insiden.kode_insiden}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-[18px]">
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold leading-7">
            {insiden.tipe_event === "SOS" ? "SOS dari" : "Keluar zona aman —"} {nama}
          </h2>
          <span className="data text-[13px] text-text-secondary">{insiden.kode_insiden}</span>
        </div>
        <div className="text-right">
          <span className={`inline-flex rounded-pill px-3 py-1 text-[13px] font-bold ${RONA_STATUS[insiden.status]}`}>
            {insiden.status === "AKTIF" ? "SOS aktif" : TEKS_STATUS[insiden.status]}
          </span>
          <div className="mt-1 text-[13px] text-text-secondary">
            {waktuRelatif(insiden.occurred_at)}, {jamWIB(insiden.occurred_at)}
          </div>
        </div>
      </div>

      <div className="grid gap-5 px-5 py-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h3 className="text-[13px] font-bold leading-5 text-text-secondary">Lokasi saat insiden terjadi</h3>

          {insiden.latitude_sos != null && insiden.longitude_sos != null ? (
            <div className="h-[220px] overflow-hidden rounded-map border border-border">
              <MapView
                markers={[
                  {
                    id_perangkat: insiden.id_perangkat ?? insiden.kode_insiden,
                    nama,
                    lat: insiden.latitude_sos,
                    lng: insiden.longitude_sos,
                    online: insiden.status !== "SELESAI",
                    sos: insiden.tipe_event === "SOS",
                  },
                ]}
              />
            </div>
          ) : (
            <p className="rounded-inner bg-surface-sunken px-4 py-5 text-sm leading-5 text-text-secondary">
              Tongkat tidak mengirim koordinat saat insiden ini terjadi, jadi lokasinya tidak dapat ditampilkan.
            </p>
          )}

          <div className="flex items-start gap-2 text-sm">
            <MapPin size={15} strokeWidth={2} className="mt-0.5 flex-none text-text-secondary" />
            <span>
              <b className="font-semibold">{insiden.lokasi_sos ?? "Alamat belum diketahui"}</b>
              {titik && <span className="data mt-0.5 block text-[13px] text-text-secondary">{titik}</span>}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h3 className="mb-2.5 text-[13px] font-bold leading-5 text-text-secondary">Pengiriman</h3>
            <Alur insiden={insiden} kirim={kirim} sayaYangPegang={sayaYangPegang} />
          </div>

          {kirim.gagal.length > 0 && (
            <div className="rounded-inner bg-danger-soft p-4">
              <p className="text-sm leading-5 text-danger-text">
                {kirim.gagal.length} nomor tidak menerima pesan. Kirim ulang akan memasukkannya kembali ke antrean.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {kirim.gagal.map((d) => (
                  <button
                    key={d.id_delivery}
                    onClick={() => onKirimUlang(d.id_delivery)}
                    disabled={memproses}
                    className="flex h-9 items-center gap-1.5 rounded-pill bg-surface px-4 text-[13px] font-bold text-danger-text disabled:opacity-50"
                  >
                    <RotateCcw size={14} strokeWidth={2.4} />
                    Kirim ulang (coba ke-{d.attempt_no})
                  </button>
                ))}
              </div>
            </div>
          )}

          <dl className="grid grid-cols-[112px_minmax(0,1fr)] gap-x-2 gap-y-1.5 text-[13px] leading-5">
            <dt className="text-text-secondary">Perangkat</dt>
            <dd className="data font-medium">{insiden.id_perangkat ?? "—"}</dd>

            <dt className="text-text-secondary">Jenis insiden</dt>
            <dd className="font-medium">{insiden.tipe_event === "SOS" ? "Tombol SOS" : "Keluar zona aman"}</dd>

            <dt className="text-text-secondary">Ditangani oleh</dt>
            <dd className="font-medium">
              {insiden.ditangani_oleh == null ? "Belum ada" : sayaYangPegang ? "Anda" : "Pengurus lain"}
            </dd>

            {insiden.deskripsi && (
              <>
                <dt className="text-text-secondary">Catatan</dt>
                <dd className="font-medium">{insiden.deskripsi}</dd>
              </>
            )}
          </dl>
        </div>
      </div>

      {galat && (
        <p role="alert" className="mx-5 mb-4 rounded-inner bg-danger-soft px-4 py-3 text-sm text-danger-text">
          {galat}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border px-5 py-3.5">
        {insiden.id_perangkat && (
          <Link
            href={`/monitoring/${insiden.id_perangkat}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-input bg-surface px-5 text-sm font-bold text-text-primary shadow-[inset_0_0_0_2px_var(--color-border)] hover:bg-surface-sunken"
          >
            <MapPin size={15} strokeWidth={2.2} />
            Pantau perangkat
          </Link>
        )}

        {insiden.status === "AKTIF" && (
          <Button onClick={onTangani} disabled={memproses}>
            <UserCheck size={16} strokeWidth={2.4} />
            {memproses ? "Memproses…" : "Tangani insiden"}
          </Button>
        )}

        {insiden.status === "DITANGANI" && !sayaYangPegang && (
          <Button variant="secondary" onClick={onAmbilAlih} disabled={memproses}>
            <UserCheck size={16} strokeWidth={2.4} />
            Ambil alih
          </Button>
        )}

        {insiden.status === "DITANGANI" && (
          <Button onClick={onSelesai} disabled={memproses}>
            <Check size={16} strokeWidth={2.4} />
            {memproses ? "Memproses…" : "Tandai selesai"}
          </Button>
        )}

        {insiden.status === "SELESAI" && (
          <span className="flex items-center gap-2 text-sm font-semibold text-success-text">
            <Check size={16} strokeWidth={2.4} />
            Insiden sudah ditutup
          </span>
        )}
      </div>
    </section>
  );
}

type Nada = "danger" | "success" | "warning" | "tunggu";

const RONA_TITIK: Record<Nada, string> = {
  danger: "bg-danger text-white",
  success: "bg-success text-white",
  warning: "bg-warning text-heading",
  tunggu: "bg-surface text-transparent shadow-[inset_0_0_0_2px_var(--color-border-strong)]",
};

function Alur({
  insiden,
  kirim,
  sayaYangPegang,
}: {
  insiden: Notifikasi;
  kirim: ReturnType<typeof ringkasKirim>;
  sayaYangPegang: boolean;
}) {
  const langkah: { judul: string; detail: string; nada: Nada }[] = [
    {
      judul: insiden.tipe_event === "SOS" ? "Tombol SOS ditekan" : "Tongkat keluar dari zona aman",
      detail: `${jamWIB(insiden.occurred_at)} · ${insiden.id_perangkat ?? "perangkat tidak tercatat"}`,
      nada: insiden.tipe_event === "SOS" ? "danger" : "warning",
    },
  ];

  if (kirim.total === 0) {
    langkah.push({
      judul: "WhatsApp tidak dijadwalkan",
      detail: "Tidak ada penerima aktif saat insiden terjadi",
      nada: "tunggu",
    });
  } else {
    if (kirim.terkirim > 0) {
      langkah.push({
        judul: "WhatsApp terkirim",
        detail: `${kirim.terkirim} dari ${kirim.total} nomor penerima`,
        nada: "success",
      });
    }
    if (kirim.menunggu > 0) {
      langkah.push({
        judul: "Menunggu dikirim",
        detail: `${kirim.menunggu} nomor masih dalam antrean`,
        nada: "tunggu",
      });
    }
    if (kirim.gagal.length > 0) {
      langkah.push({
        judul: "Sebagian pengiriman gagal",
        detail: `${kirim.gagal.length} nomor tidak menerima pesan`,
        nada: "danger",
      });
    }
  }

  if (insiden.status === "AKTIF") {
    langkah.push({
      judul: "Menunggu ditangani",
      detail: "Belum ada yang mengambil insiden ini",
      nada: "tunggu",
    });
  } else {
    const waktu = insiden.ditangani_pada ? `${jamWIB(insiden.ditangani_pada)} · ` : "";
    const oleh = sayaYangPegang ? "oleh Anda" : "oleh pengurus lain";
    langkah.push({
      judul: insiden.status === "DITANGANI" ? "Sedang ditangani" : "Ditandai selesai",
      detail: `${waktu}${oleh}`,
      nada: insiden.status === "DITANGANI" ? "warning" : "success",
    });
  }

  return (
    <ul className="flex flex-col">
      {langkah.map((l, i) => (
        <li key={l.judul} className="relative flex gap-3 pb-4 last:pb-0">
          {i < langkah.length - 1 && (
            <span aria-hidden className="absolute left-[11px] top-[26px] bottom-0.5 w-0.5 bg-border-strong" />
          )}
          <span
            className={`relative flex h-6 w-6 flex-none items-center justify-center rounded-pill ${RONA_TITIK[l.nada]}`}
          >
            {l.nada === "tunggu" ? <Clock size={13} strokeWidth={2.4} className="text-border-strong" /> : <Check size={13} strokeWidth={3} />}
          </span>
          <span className="min-w-0">
            <b className="block text-sm font-bold leading-5">{l.judul}</b>
            <span className="block text-[13px] leading-[18px] text-text-secondary">{l.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}