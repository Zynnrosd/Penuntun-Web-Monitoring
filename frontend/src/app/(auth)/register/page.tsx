// frontend/src/app/(auth)/register/page.tsx

"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Info } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { AuthShell } from "@/components/auth/AuthShell";
import { Field, TombolTampilkan } from "@/components/ui/Field";
import { YayasanPicker, Yayasan } from "@/components/ui/YayasanPicker";
import { Button } from "@/components/ui/Button";

type Alur = "yayasan" | "pengawas";

export default function RegisterPage() {
  const router = useRouter();
  const [alur, setAlur] = useState<Alur>("yayasan");

  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");
  const [lihatSandi, setLihatSandi] = useState(false);
  const [namaYayasan, setNamaYayasan] = useState("");
  const [kotaYayasan, setKotaYayasan] = useState("");
  const [yayasanDipilih, setYayasanDipilih] = useState<Yayasan | null>(null);

  const [galat, setGalat] = useState("");
  const [yayasanSudahAda, setYayasanSudahAda] = useState(false);
  const [sukses, setSukses] = useState("");
  const [mengirim, setMengirim] = useState(false);

  function gantiAlur(baru: Alur) {
    setAlur(baru);
    setGalat("");
    setYayasanSudahAda(false);
  }

  async function daftar(e: React.FormEvent) {
    e.preventDefault();
    setGalat("");
    setYayasanSudahAda(false);

    if (alur === "pengawas" && !yayasanDipilih) {
      setGalat("Pilih yayasan dari hasil pencarian terlebih dahulu.");
      return;
    }

    setMengirim(true);
    try {
      // Pendaftaran lewat backend, karena backend yang membuat akun dan menerapkan batas percobaan.
      const res = await api.post<{ message: string }>("/auth/register", {
        alur,
        nama,
        email,
        password: sandi,
        ...(alur === "yayasan"
          ? { nama_yayasan: namaYayasan, kota_yayasan: kotaYayasan }
          : { id_yayasan: yayasanDipilih?.id_yayasan }),
      });

      setSukses(res.message);
      setTimeout(() => router.replace("/login"), 2000);
    } catch (err) {
      if (err instanceof ApiError && err.code === "YAYASAN_SUDAH_ADA") {
        setYayasanSudahAda(true);
      } else {
        setGalat(err instanceof Error ? err.message : "Pendaftaran gagal.");
      }
    } finally {
      setMengirim(false);
    }
  }

  if (sukses) {
    return (
      <AuthShell headline="Pantau semua pengguna dari satu dashboard." photoSrc="/auth-register.png">
        <div className="flex flex-col gap-5">
          <h1 className="text-[32px] font-extrabold leading-[38px] tracking-[-0.04em]">Berhasil</h1>
          <p className="text-[15px] leading-6 text-text-secondary">{sukses}</p>
          <p className="text-sm text-text-secondary">Mengalihkan ke halaman Masuk…</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell headline="Pantau semua pengguna dari satu dashboard." photoSrc="/auth-register.png">
      <form onSubmit={daftar} className="flex flex-col gap-2.5" aria-label={`Daftar sebagai ${alur}`}>
        <div className="flex gap-1 rounded-pill bg-field p-1" role="tablist" aria-label="Daftar sebagai">
          {(["yayasan", "pengawas"] as const).map((a) => (
            <button
              key={a}
              type="button"
              role="tab"
              aria-selected={alur === a}
              onClick={() => gantiAlur(a)}
              className={`h-[42px] flex-1 rounded-pill text-[15px] font-bold transition-colors ${
                alur === a ? "bg-secondary text-white" : "text-text-secondary"
              }`}
            >
              {a === "yayasan" ? "Administrator" : "Pengawas"}
            </button>
          ))}
        </div>

        <div className="mt-2">
          <h1 className="text-[32px] font-extrabold leading-[38px] tracking-[-0.04em]">Buat akun</h1>
          <p className="mt-1 text-[15px] text-text-secondary">
            {alur === "yayasan" ? "Isi data yayasan Anda untuk mulai." : "Isi data Anda dan pilih yayasan."}
          </p>
        </div>

        {galat && (
          <div
            role="alert"
            className="flex gap-3 rounded-inner bg-danger-soft px-[18px] py-3.5 text-[15px] leading-[22px] text-danger-text"
          >
            <AlertCircle size={20} className="flex-none" />
            {galat}
          </div>
        )}

        {yayasanSudahAda && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-inner bg-warning-soft px-[18px] py-3.5 text-[15px] leading-[22px] text-warning-text"
          >
            <div className="flex gap-3">
              <Info size={20} className="flex-none" />
              <span>
                <b>{namaYayasan}</b> di {kotaYayasan} sudah terdaftar. Yang pertama mendaftar menjadi Administrator
                yayasan. Daftar sebagai Pengawas, lalu minta persetujuannya.
              </span>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="h-11 self-start"
              onClick={() => {
                setYayasanSudahAda(false);
                setAlur("pengawas");
              }}
            >
              Daftar sebagai Pengawas
            </Button>
          </div>
        )}

        {alur === "yayasan" && (
          <div className="grid grid-cols-[2fr_1fr] gap-3">
            <Field
              label="Nama yayasan"
              required
              value={namaYayasan}
              onChange={(e) => setNamaYayasan(e.target.value)}
              placeholder="Yayasan Komunitas Sahabat Mata"
            />
            <Field
              label="Kota"
              required
              value={kotaYayasan}
              onChange={(e) => setKotaYayasan(e.target.value)}
              placeholder="Semarang"
            />
          </div>
        )}

        <Field
          label="Nama lengkap"
          required
          autoComplete="name"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
        />

        <Field
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Field
          label="Kata sandi"
          type={lihatSandi ? "text" : "password"}
          required
          minLength={6}
          autoComplete="new-password"
          value={sandi}
          onChange={(e) => setSandi(e.target.value)}
          hint="Minimal 6 karakter."
          trailing={<TombolTampilkan aktif={lihatSandi} onToggle={() => setLihatSandi((v) => !v)} />}
        />

        {alur === "pengawas" && (
          <YayasanPicker dipilih={yayasanDipilih} onPilih={setYayasanDipilih} />
        )}

        <Button type="submit" disabled={mengirim} className="mt-2 h-[52px] w-full">
          {mengirim ? "Memproses…" : alur === "yayasan" ? "Buat akun" : "Kirim permintaan"}
        </Button>

        <p className="text-center text-sm text-text-secondary">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-bold text-secondary">
            Masuk
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}