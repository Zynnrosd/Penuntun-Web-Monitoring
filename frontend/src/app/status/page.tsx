// frontend/src/app/status/page.tsx

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, XCircle, Lock, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api-client";
import { useSession } from "@/hooks/useSession";
import { YayasanPicker, Yayasan } from "@/components/ui/YayasanPicker";
import { Button } from "@/components/ui/Button";

const PESAN = {
  MENUNGGU: {
    ikon: Clock,
    warna: "text-info",
    judul: "Menunggu persetujuan",
    isi: "Permintaan Anda sudah terkirim ke Administrator yayasan. Anda akan bisa masuk setelah permintaan disetujui.",
  },
  DITOLAK: {
    ikon: XCircle,
    warna: "text-danger",
    judul: "Permintaan belum disetujui",
    isi: "Administrator yayasan belum menyetujui permintaan Anda. Jika yayasan yang dipilih keliru, Anda dapat mengajukan ke yayasan lain.",
  },
  NONAKTIF: {
    ikon: Lock,
    warna: "text-offline",
    judul: "Akun dinonaktifkan",
    isi: "Akses akun ini dihentikan oleh Administrator yayasan. Hubungi Administrator jika Anda masih memerlukan akses.",
  },
} as const;

export default function StatusAkunPage() {
  const router = useRouter();
  const { sesi, memuat } = useSession();

  const [pindah, setPindah] = useState(false);
  const [yayasanBaru, setYayasanBaru] = useState<Yayasan | null>(null);
  const [galat, setGalat] = useState("");
  const [sukses, setSukses] = useState("");
  const [mengirim, setMengirim] = useState(false);

  useEffect(() => {
    if (memuat) return;
    if (!sesi) router.replace("/login");
    else if (sesi.status === "AKTIF") router.replace("/home");
  }, [memuat, sesi, router]);

  async function keluar() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function ajukan() {
    if (!yayasanBaru) {
      setGalat("Pilih yayasan dari hasil pencarian terlebih dahulu.");
      return;
    }

    setGalat("");
    setMengirim(true);
    try {
      const res = await api.post<{ message: string }>("/auth/ajukan-yayasan-lain", {
        id_yayasan: yayasanBaru.id_yayasan,
      });
      setSukses(res.message);
      setPindah(false);
    } catch (err) {
      setGalat(err instanceof Error ? err.message : "Gagal mengajukan ke yayasan lain.");
    } finally {
      setMengirim(false);
    }
  }

  if (memuat || !sesi || sesi.status === "AKTIF") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-text-secondary">Memuat…</p>
      </div>
    );
  }

  const { ikon: Ikon, warna, judul, isi } = PESAN[sesi.status];

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg animate-fade-up rounded-card border-2 border-border bg-surface p-8 sm:p-10">
        <Ikon size={44} strokeWidth={2} className={`mb-5 ${warna}`} />

        <h1 className="text-[30px] font-extrabold leading-9 tracking-[-0.035em]">{judul}</h1>
        <p className="mt-3 text-[15px] leading-6 text-text-secondary">{isi}</p>

        <dl className="mt-6 space-y-3 rounded-inner bg-surface-sunken p-5 text-[15px]">
          <div className="flex justify-between gap-4">
            <dt className="text-text-secondary">Nama</dt>
            <dd className="font-semibold">{sesi.nama_staf ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text-secondary">Email</dt>
            <dd className="font-semibold">{sesi.email ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text-secondary">Yayasan</dt>
            <dd className="text-right font-semibold">
              {sesi.yayasan ? `${sesi.yayasan.nama_yayasan}, ${sesi.yayasan.kota_yayasan}` : "—"}
            </dd>
          </div>
        </dl>

        {sukses && (
          <p
            role="status"
            className="mt-5 rounded-inner bg-success-soft px-[18px] py-3.5 text-[15px] leading-[22px] text-success-text"
          >
            {sukses}
          </p>
        )}

        {galat && (
          <p
            role="alert"
            className="mt-5 flex gap-3 rounded-inner bg-danger-soft px-[18px] py-3.5 text-[15px] leading-[22px] text-danger-text"
          >
            <AlertCircle size={20} className="flex-none" />
            {galat}
          </p>
        )}

        {sesi.status === "DITOLAK" && !sukses && (
          <div className="mt-6">
            {pindah ? (
              <div className="flex flex-col gap-4">
                <YayasanPicker dipilih={yayasanBaru} onPilih={setYayasanBaru} />
                <div className="flex gap-3">
                  <Button type="button" onClick={ajukan} disabled={mengirim} className="flex-1">
                    {mengirim ? "Mengirim…" : "Kirim permintaan"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setPindah(false)}>
                    Batal
                  </Button>
                </div>
              </div>
            ) : (
              <Button type="button" onClick={() => setPindah(true)} className="w-full">
                Ajukan ke yayasan lain
              </Button>
            )}
          </div>
        )}

        <Button variant="secondary" onClick={keluar} className="mt-4 w-full">
          Keluar
        </Button>
      </div>
    </main>
  );
}