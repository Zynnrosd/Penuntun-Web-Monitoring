// frontend/src/app/(dashboard)/notifikasi/DetailInsiden.tsx
// Panel kanan halaman Notifikasi: lokasi insiden, status pengiriman WhatsApp, dan tombol tindakan.

"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Archive, ArchiveRestore, Check, MapPin, RotateCcw, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { jamWIB, koordinat, waktuRelatif } from "@/lib/format";
import type { Notifikasi } from "@/types";
import { Alur } from "./Alur";
import { RONA_STATUS, TEKS_STATUS, ringkasKirim } from "./status";

const MapView = dynamic(() => import("@/components/map/MapView").then((m) => m.MapView), { ssr: false });

export function DetailInsiden({
  insiden,
  idSaya,
  diarsipkan,
  bolehPulihkan,
  memproses,
  galat,
  onTangani,
  onAmbilAlih,
  onSelesai,
  onKirimUlang,
  onPulihkan,
}: {
  insiden: Notifikasi;
  idSaya: string | null;
  diarsipkan: boolean;
  bolehPulihkan: boolean;
  memproses: boolean;
  galat: string;
  onTangani: () => void;
  onAmbilAlih: () => void;
  onSelesai: () => void;
  onKirimUlang: (idDelivery: number) => void;
  onPulihkan: () => void;
}) {
  const kirim = ringkasKirim(insiden.notifikasi_delivery);
  const sayaYangPegang = idSaya != null && insiden.ditangani_oleh === idSaya;
  const nama = insiden.nama_snapshot ?? "pengguna tidak tercatat";
  const titik = koordinat(insiden.latitude_sos, insiden.longitude_sos);

  return (
    <section
      className="animate-fade-up flex min-h-0 flex-col overflow-hidden rounded-card border-2 border-border bg-surface"
      aria-label={`Detail insiden ${insiden.kode_insiden}`}
    >
      <div className="flex flex-none flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-[18px]">
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

      <div className="min-h-0 flex-1 overflow-y-auto">
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
      </div>

      <div className="flex flex-none flex-wrap items-center justify-end gap-3 border-t border-border px-5 py-3.5">
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

        {insiden.status === "SELESAI" && !diarsipkan && (
          <span className="flex items-center gap-2 text-sm font-semibold text-success-text">
            <Check size={16} strokeWidth={2.4} />
            Insiden sudah ditutup
          </span>
        )}

        {diarsipkan && (
          <>
            <span className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
              <Archive size={16} strokeWidth={2.2} />
              Ada di arsip
            </span>
            {bolehPulihkan && (
              <Button variant="secondary" onClick={onPulihkan} disabled={memproses}>
                <ArchiveRestore size={16} strokeWidth={2.2} />
                {memproses ? "Memproses…" : "Pulihkan"}
              </Button>
            )}
          </>
        )}
      </div>
    </section>
  );
}