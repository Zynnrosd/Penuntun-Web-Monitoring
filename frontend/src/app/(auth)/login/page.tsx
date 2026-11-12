// frontend/src/app/(auth)/login/page.tsx

"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AuthShell } from "@/components/auth/AuthShell";
import { Field, TombolTampilkan } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");
  const [lihatSandi, setLihatSandi] = useState(false);
  const [galat, setGalat] = useState("");
  const [mengirim, setMengirim] = useState(false);

  async function masuk(e: React.FormEvent) {
    e.preventDefault();
    setGalat("");
    setMengirim(true);

    // Login langsung ke Supabase Auth. Pesan galat dibuat umum agar tidak membocorkan email mana yang terdaftar.
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: sandi });
    setMengirim(false);

    if (error) {
      setGalat("Email atau kata sandi salah.");
      return;
    }

    router.replace("/home");
  }

  return (
    <AuthShell headline="Selamat datang kembali." photoSrc="/auth-login.png">
      <form onSubmit={masuk} className="flex flex-col gap-5" aria-label="Masuk">
        <div>
          <h1 className="text-[32px] font-extrabold leading-[38px] tracking-[-0.04em]">Masuk</h1>
          <p className="mt-1 text-[15px] text-text-secondary">Masuk ke akun yayasan Anda.</p>
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
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@yayasan.or.id"
        />

        <div>
          <Field
            label="Kata sandi"
            type={lihatSandi ? "text" : "password"}
            autoComplete="current-password"
            required
            value={sandi}
            onChange={(e) => setSandi(e.target.value)}
            trailing={<TombolTampilkan aktif={lihatSandi} onToggle={() => setLihatSandi((v) => !v)} />}
          />
          <p className="mt-2 text-right text-sm">
            <Link href="/lupa-sandi" className="font-bold text-secondary">
              Lupa kata sandi?
            </Link>
          </p>
        </div>

        <Button type="submit" disabled={mengirim} className="h-[52px] w-full">
          {mengirim ? "Memproses…" : "Masuk"}
        </Button>

        <p className="text-center text-sm text-text-secondary">
          Belum punya akun?{" "}
          <Link href="/register" className="font-bold text-secondary">
            Buat akun
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}