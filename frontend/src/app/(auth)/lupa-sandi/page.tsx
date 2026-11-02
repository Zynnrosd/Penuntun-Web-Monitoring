// frontend/src/app/(auth)/lupa-sandi/page.tsx

"use client";
import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AuthShell } from "@/components/auth/AuthShell";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default function LupaSandiPage() {
  const [email, setEmail] = useState("");
  const [terkirim, setTerkirim] = useState(false);
  const [mengirim, setMengirim] = useState(false);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setMengirim(true);

    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/atur-sandi`,
    });

    setMengirim(false);
    setTerkirim(true);
  }

  return (
    <AuthShell headline="Selamat datang kembali." photoSrc="/auth-login.png">
      {terkirim ? (
        <div className="flex flex-col gap-5">
          <MailCheck size={44} strokeWidth={2} className="text-success" />
          <div>
            <h1 className="text-[32px] font-extrabold leading-[38px] tracking-[-0.04em]">Tautan terkirim</h1>
            <p className="mt-2 text-[15px] leading-6 text-text-secondary">
              Jika <b>{email.trim()}</b> terdaftar, tautan untuk membuat kata sandi baru sudah dikirim ke email itu.
              Tautannya berlaku satu jam.
            </p>
          </div>
          <p className="text-sm">
            <Link href="/login" className="font-bold text-secondary">
              Kembali ke Masuk
            </Link>
          </p>
        </div>
      ) : (
        <form onSubmit={kirim} className="flex flex-col gap-5" aria-label="Lupa kata sandi">
          <div>
            <h1 className="text-[32px] font-extrabold leading-[38px] tracking-[-0.04em]">Lupa kata sandi</h1>
            <p className="mt-1 text-[15px] leading-6 text-text-secondary">
              Masukkan email akun Anda. Kami kirim tautan untuk membuat kata sandi baru.
            </p>
          </div>

          <Field
            label="Email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@yayasan.or.id"
          />

          <Button type="submit" disabled={mengirim} className="h-[52px] w-full">
            {mengirim ? "Mengirim…" : "Kirim tautan"}
          </Button>

          <p className="text-center text-sm">
            <Link href="/login" className="font-bold text-secondary">
              Kembali ke Masuk
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}