"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AuthVisualPanel } from "@/components/auth/AuthVisualPanel";
import { Logo } from "@/components/ui/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lihatPassword, setLihatPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Email atau kata sandi salah");
      return;
    }
    router.push("/home");
  }

  return (
    <div className="grid min-h-screen grid-cols-1 gap-6 bg-background p-4 md:grid-cols-2 md:p-6">
      <div className="order-2 md:order-1">
        <AuthVisualPanel
          photoSrc="/auth-login.png"
          eyebrow="Kenapa PENUNTUN"
          headline="Pantau dengan tenang."
          subheadline="Lokasi, baterai, dan kondisi darurat terpantau real-time dari satu dashboard."
          ctaHref="/register"
          ctaLabel="Daftar"
        />
        </div>

      <div className="order-1 flex items-center justify-center md:order-2">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-7">
            <Logo variant="blue" />
          </div>

          <h1 className="text-2xl font-bold text-text-primary">Masuk</h1>
          <p className="mb-6 text-sm text-text-secondary">Lanjutkan ke dashboard Anda</p>

          {error && <div className="mb-4 rounded-input bg-danger-soft px-3 py-2 text-sm text-danger">{error}</div>}

          <form onSubmit={handleLogin}>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Email</label>
            <div className="relative mb-4">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@gmail.com"
                className="w-full rounded-input border border-border py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <label className="mb-1 block text-sm font-medium text-text-secondary">Kata Sandi</label>
            <div className="relative mb-2">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type={lihatPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-input border border-border py-2.5 pl-9 pr-10 text-sm outline-none focus:border-primary"
              />
              <button type="button" onClick={() => setLihatPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">
                {lihatPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-input bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? "Memeriksa..." : "Masuk"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-text-secondary">
            Belum punya akun?{" "}
            <a href="/register" className="font-medium text-primary hover:underline">Daftar</a>
          </p>
        </div>
      </div>
    </div>
  );
}