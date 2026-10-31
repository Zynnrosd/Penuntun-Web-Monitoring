// frontend/src/app/(auth)/atur-sandi/page.tsx

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AuthShell } from "@/components/auth/AuthShell";
import { Field, TombolTampilkan } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default function AturSandiPage() {
  const router = useRouter();
  const [siap, setSiap] = useState(false);
  const [tautanValid, setTautanValid] = useState(false);
  const [sandi, setSandi] = useState("");
  const [ulangi, setUlangi] = useState("");
  const [lihatSandi, setLihatSandi] = useState(false);
  const [galat, setGalat] = useState("");
  const [mengirim, setMengirim] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setTautanValid(Boolean(data.session));
      setSiap(true);
    });
  }, []);

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setGalat("");

    if (sandi.length < 6) {
      setGalat("Kata sandi minimal 6 karakter.");
      return;
    }
    if (sandi !== ulangi) {
      setGalat("Kedua kata sandi belum sama.");
      return;
    }

    setMengirim(true);
    const { error } = await supabase.auth.updateUser({ password: sandi });
    setMengirim(false);

    if (error) {
      setGalat("Gagal menyimpan kata sandi. Minta tautan baru lalu coba lagi.");
      return;
    }

    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <AuthShell headline="Selamat datang kembali." photoSrc="/auth-login.png">
      {!siap ? (
        <p className="text-sm text-text-secondary">Memuat…</p>
      ) : !tautanValid ? (
        <div className="flex flex-col gap-5">
          <AlertCircle size={44} strokeWidth={2} className="text-danger" />
          <div>
            <h1 className="text-[32px] font-extrabold leading-[38px] tracking-[-0.04em]">Tautan tidak berlaku</h1>
            <p className="mt-2 text-[15px] leading-6 text-text-secondary">
              Tautan ini sudah dipakai atau kedaluwarsa. Minta tautan baru dari halaman Lupa kata sandi.
            </p>
          </div>
          <Link href="/lupa-sandi">
            <Button type="button" className="h-[52px] w-full">
              Minta tautan baru
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={simpan} className="flex flex-col gap-5" aria-label="Atur ulang kata sandi">
          <div>
            <h1 className="text-[32px] font-extrabold leading-[38px] tracking-[-0.04em]">Atur kata sandi</h1>
            <p className="mt-1 text-[15px] leading-6 text-text-secondary">
              Buat kata sandi baru untuk akun Anda.
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

          <Field
            label="Kata sandi baru"
            type={lihatSandi ? "text" : "password"}
            required
            minLength={6}
            autoComplete="new-password"
            value={sandi}
            onChange={(e) => setSandi(e.target.value)}
            hint="Minimal 6 karakter."
            trailing={<TombolTampilkan aktif={lihatSandi} onToggle={() => setLihatSandi((v) => !v)} />}
          />

          <Field
            label="Ulangi kata sandi"
            type={lihatSandi ? "text" : "password"}
            required
            autoComplete="new-password"
            value={ulangi}
            onChange={(e) => setUlangi(e.target.value)}
          />

          <Button type="submit" disabled={mengirim} className="h-[52px] w-full">
            {mengirim ? "Menyimpan…" : "Simpan kata sandi"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}