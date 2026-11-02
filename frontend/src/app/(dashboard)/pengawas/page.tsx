// frontend/src/app/(dashboard)/pengawas/page.tsx

"use client";
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Check } from "lucide-react";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { inisialNama } from "@/hooks/useSession";
import { jamWIB, waktuRelatif } from "@/lib/format";
import type { StatusAkun } from "@/hooks/useSession";

type AkunPengawas = {
  id_admin: string;
  nama_staf: string;
  email: string;
  status: StatusAkun;
  created_at: string;
};

const RONA_STATUS: Record<StatusAkun, string> = {
  AKTIF: "bg-success-soft text-success-text",
  MENUNGGU: "bg-warning-soft text-warning-text",
  DITOLAK: "bg-danger-soft text-danger-text",
  NONAKTIF: "bg-secondary-soft text-[#1F3556]",
};

const TITIK_STATUS: Record<StatusAkun, string> = {
  AKTIF: "bg-success",
  MENUNGGU: "bg-warning",
  DITOLAK: "bg-danger",
  NONAKTIF: "bg-offline",
};

const TEKS_STATUS: Record<StatusAkun, string> = {
  AKTIF: "Aktif",
  MENUNGGU: "Menunggu",
  DITOLAK: "Ditolak",
  NONAKTIF: "Nonaktif",
};

function Status({ status }: { status: StatusAkun }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-0.5 text-[13px] font-bold ${RONA_STATUS[status]}`}
    >
      <i className={`h-2 w-2 rounded-pill ${TITIK_STATUS[status]}`} />
      {TEKS_STATUS[status]}
    </span>
  );
}

function Orang({ nama, warnaKe }: { nama: string; warnaKe: number }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-10 w-10 flex-none items-center justify-center rounded-pill text-[13px] font-extrabold ${
          warnaKe % 2 === 0 ? "bg-tile-amber text-[#5C3D00]" : "bg-tile-blue text-primary"
        }`}
      >
        {inisialNama(nama)}
      </span>
      <b className="truncate font-bold leading-5">{nama}</b>
    </div>
  );
}

export default function PengawasPage() {
  const [akun, setAkun] = useState<AkunPengawas[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");

  const [galatAksi, setGalatAksi] = useState("");
  const [kabar, setKabar] = useState("");
  const [sedangDiproses, setSedangDiproses] = useState<string | null>(null);

  const muat = useCallback(() => {
    api
      .get<AkunPengawas[]>("/pengawas")
      .then((data) => {
        setAkun(data);
        setGalat("");
      })
      .catch((e) => setGalat(e instanceof Error ? e.message : "Gagal memuat data"))
      .finally(() => setMemuat(false));
  }, []);

  useEffect(muat, [muat]);

  async function jalankan(id: string, aksi: () => Promise<{ message: string }>) {
    setGalatAksi("");
    setKabar("");
    setSedangDiproses(id);
    try {
      const hasil = await aksi();
      setKabar(hasil.message);
      muat();
    } catch (err) {
      setGalatAksi(err instanceof Error ? err.message : "Tindakan gagal dijalankan");
    } finally {
      setSedangDiproses(null);
    }
  }

  const judul = <PageHeader title="Akun Pengawas" subtitle="Setujui permintaan dan atur akses Pengawas" />;

  if (memuat) {
    return (
      <>
        {judul}
        <p className="text-[15px] text-text-secondary">Memuat akun…</p>
      </>
    );
  }

  if (galat) {
    return (
      <>
        {judul}
        <p className="rounded-inner bg-danger-soft px-[18px] py-3.5 text-[15px] text-danger-text">
          Gagal memuat akun Pengawas: {galat}
        </p>
      </>
    );
  }

  const menunggu = akun.filter((a) => a.status === "MENUNGGU");
  const terdaftar = akun.filter((a) => a.status !== "MENUNGGU");

  return (
    <>
      {judul}

      <div className="flex flex-col gap-5">
        {galatAksi && (
          <p role="alert" className="flex gap-2.5 rounded-inner bg-danger-soft px-4 py-3 text-sm text-danger-text">
            <AlertCircle size={18} className="mt-px flex-none" />
            {galatAksi}
          </p>
        )}

        {kabar && !galatAksi && (
          <p role="status" className="flex gap-2.5 rounded-inner bg-success-soft px-4 py-3 text-sm text-success-text">
            <Check size={18} strokeWidth={2.6} className="mt-px flex-none" />
            {kabar}
          </p>
        )}

        <section className="overflow-hidden rounded-card border-2 border-border bg-surface">
          <div className="flex flex-wrap items-center gap-2.5 px-5 py-4">
            <h2 className="text-[22px] font-extrabold leading-7">Menunggu persetujuan</h2>
            {menunggu.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-warning-soft px-3 py-0.5 text-[13px] font-bold text-warning-text">
                <i className="h-2 w-2 rounded-pill bg-warning" />
                {menunggu.length} permintaan
              </span>
            )}
          </div>

          {menunggu.length === 0 ? (
            <p className="px-5 pb-5 text-sm leading-5 text-text-secondary">
              Tidak ada permintaan baru. Permintaan muncul di sini saat ada yang mendaftar sebagai Pengawas dan
              memilih yayasan Anda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary-soft text-left text-[13px] font-bold uppercase tracking-[0.06em] text-[#3F5B82]">
                    <th scope="col" className="px-5 py-3">Calon Pengawas</th>
                    <th scope="col" className="px-5 py-3">Email</th>
                    <th scope="col" className="px-5 py-3">Mengajukan</th>
                    <th scope="col" className="px-5 py-3 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {menunggu.map((a, i) => (
                    <tr key={a.id_admin} className="border-t border-[#EDF1F6]">
                      <td className="px-5 py-3">
                        <Orang nama={a.nama_staf} warnaKe={i} />
                      </td>
                      <td className="px-5 py-3 text-sm">{a.email}</td>
                      <td className="px-5 py-3 text-sm">
                        {waktuRelatif(a.created_at)}, {jamWIB(a.created_at)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            disabled={sedangDiproses === a.id_admin}
                            onClick={() =>
                              jalankan(a.id_admin, () =>
                                api.patch<{ message: string }>(`/pengawas/${a.id_admin}/tolak`, {})
                              )
                            }
                            className="min-h-9 px-3.5 text-sm"
                          >
                            Tolak
                          </Button>
                          <Button
                            disabled={sedangDiproses === a.id_admin}
                            onClick={() =>
                              jalankan(a.id_admin, () =>
                                api.patch<{ message: string }>(`/pengawas/${a.id_admin}/setujui`, {})
                              )
                            }
                            className="min-h-9 px-3.5 text-sm"
                          >
                            <Check size={17} strokeWidth={2.4} />
                            Setujui
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-card border-2 border-border bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <h2 className="text-[22px] font-extrabold leading-7">Akun Pengawas</h2>
            <span className="text-sm text-text-secondary">{terdaftar.length} akun</span>
          </div>

          {terdaftar.length === 0 ? (
            <p className="px-5 pb-5 text-sm leading-5 text-text-secondary">
              Belum ada akun Pengawas di yayasan ini. Pengawas mendaftar sendiri lewat halaman Buat akun, lalu
              permintaannya muncul di bagian atas untuk Anda setujui.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary-soft text-left text-[13px] font-bold uppercase tracking-[0.06em] text-[#3F5B82]">
                    <th scope="col" className="px-5 py-3">Pengawas</th>
                    <th scope="col" className="px-5 py-3">Email</th>
                    <th scope="col" className="px-5 py-3">Status</th>
                    <th scope="col" className="px-5 py-3 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {terdaftar.map((a, i) => (
                    <tr key={a.id_admin} className="border-t border-[#EDF1F6]">
                      <td className="px-5 py-3">
                        <Orang nama={a.nama_staf} warnaKe={i} />
                      </td>
                      <td className="px-5 py-3 text-sm">{a.email}</td>
                      <td className="px-5 py-3">
                        <Status status={a.status} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end">
                          {a.status === "AKTIF" ? (
                            <Button
                              variant="secondary"
                              disabled={sedangDiproses === a.id_admin}
                              onClick={() =>
                                jalankan(a.id_admin, () =>
                                  api.patch<{ message: string }>(`/pengawas/${a.id_admin}/status`, {
                                    status: "NONAKTIF",
                                  })
                                )
                              }
                              className="min-h-9 px-3.5 text-sm"
                            >
                              Nonaktifkan
                            </Button>
                          ) : (
                            <Button
                              disabled={sedangDiproses === a.id_admin}
                              onClick={() =>
                                jalankan(a.id_admin, () =>
                                  api.patch<{ message: string }>(`/pengawas/${a.id_admin}/status`, {
                                    status: "AKTIF",
                                  })
                                )
                              }
                              className="min-h-9 px-3.5 text-sm"
                            >
                              <Check size={17} strokeWidth={2.4} />
                              Aktifkan
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="text-[13px] leading-5 text-text-secondary">
          Akun Pengawas tidak dapat dihapus, hanya dinonaktifkan. Akun nonaktif tetap tercatat sebagai riwayat
          penanganan insiden, tetapi tidak bisa masuk ke dashboard dan tidak menerima pesan SOS.
        </p>
      </div>
    </>
  );
}