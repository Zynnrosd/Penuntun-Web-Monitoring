"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";
import { api } from "@/lib/api-client";
import { AuthVisualPanel } from "@/components/auth/AuthVisualPanel";
import { YayasanCombobox } from "@/components/ui/YayasanCombobox";
import { Logo } from "@/components/ui/Logo";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const awal = searchParams.get("tipe") === "perseorangan" ? "perseorangan" : "yayasan";

  const [tipeAkun, setTipeAkun] = useState<"yayasan" | "perseorangan">(awal);
  const [form, setForm] = useState({ email: "", password: "", nama_staf: "", nama_yayasan: "", no_wa: "" });
  const [idYayasanDipilih, setIdYayasanDipilih] = useState<string | null>(null);
  const [lihatPassword, setLihatPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post<{ message: string }>("/auth/register", {
        ...form,
        tipe_akun: tipeAkun,
        id_yayasan: idYayasanDipilih,
      });
      setInfo(res.message);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registrasi gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid h-screen grid-cols-1 gap-6 overflow-hidden bg-background p-4 md:grid-cols-2 md:p-6">
      <div className="flex min-h-0 items-center justify-center overflow-y-auto">
        <div className="w-full max-w-sm py-4">
          <div className="mb-5">
            <Logo variant="blue" />
          </div>

          <h1 className="text-xl font-bold text-text-primary">Buat Akun</h1>
          <p className="mb-4 text-sm text-text-secondary">Pilih jenis akun Anda</p>

          <div className="mb-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTipeAkun("yayasan")}
              className={`rounded-input border px-3 py-2 text-sm font-medium transition-colors ${
                tipeAkun === "yayasan" ? "border-primary bg-primary-soft text-primary" : "border-border text-text-secondary"
              }`}
            >
              Yayasan
            </button>
            <button
              type="button"
              onClick={() => setTipeAkun("perseorangan")}
              className={`rounded-input border px-3 py-2 text-sm font-medium transition-colors ${
                tipeAkun === "perseorangan" ? "border-primary bg-primary-soft text-primary" : "border-border text-text-secondary"
              }`}
            >
              Perseorangan
            </button>
          </div>

          {error && <div className="mb-3 rounded-input bg-danger-soft px-3 py-2 text-sm text-danger">{error}</div>}
          {info && <div className="mb-3 rounded-input bg-success-soft px-3 py-2 text-sm text-success">{info}</div>}

          <form onSubmit={handleRegister}>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Nama Lengkap</label>
            <div className="relative mb-2.5">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                required
                value={form.nama_staf}
                onChange={(e) => update("nama_staf", e.target.value)}
                placeholder="Masukkan nama anda"
                className="w-full rounded-input border border-border py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>

            {tipeAkun === "yayasan" && (
              <div className="mb-2.5">
                <label className="mb-1 block text-xs font-medium text-text-secondary">Nama Yayasan</label>
                <YayasanCombobox
                  value={form.nama_yayasan}
                  onSelectExisting={(id, nama) => {
                    setIdYayasanDipilih(id);
                    update("nama_yayasan", nama);
                  }}
                  onSelectNew={(nama) => {
                    setIdYayasanDipilih(null);
                    update("nama_yayasan", nama);
                  }}
                />
              </div>
            )}

            <label className="mb-1 block text-xs font-medium text-text-secondary">Email</label>
            <div className="relative mb-2.5">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="nama@gmail.com"
                className="w-full rounded-input border border-border py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <label className="mb-1 block text-xs font-medium text-text-secondary">Kata Sandi</label>
            <div className="relative mb-2.5">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type={lihatPassword ? "text" : "password"}
                required
                minLength={6}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full rounded-input border border-border py-2 pl-9 pr-10 text-sm outline-none focus:border-primary"
              />
              <button type="button" onClick={() => setLihatPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">
                {lihatPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <label className="mb-1 block text-xs font-medium text-text-secondary">Nomor WhatsApp</label>
            <div className="relative mb-4">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                value={form.no_wa}
                onChange={(e) => update("no_wa", e.target.value)}
                placeholder="+6281234567890"
                className="w-full rounded-input border border-border py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>

                        <button
              type="submit"
              disabled={loading}
              suppressHydrationWarning
              className="w-full rounded-input bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? "Mendaftarkan..." : "Buat Akun"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-text-secondary">
            Sudah punya akun?{" "}
            <a href="/login" className="font-medium text-primary hover:underline">Masuk</a>
          </p>
        </div>
      </div>
        <AuthVisualPanel
          photoSrc="/auth-register.png"
          photoPosition="center 15%"
          eyebrow="Bergabung Sekarang"
          headline="Satu akun, lebih aman."
          subheadline="Baik untuk yayasan maupun keluarga, data Anda terisolasi penuh dan terenkripsi."
          ctaHref="/login"
          ctaLabel="Masuk"
        />
     </div>
  );
}