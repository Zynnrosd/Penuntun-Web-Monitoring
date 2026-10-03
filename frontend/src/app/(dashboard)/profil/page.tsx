"use client";
import { useEffect, useState } from "react";
import { ShieldCheck, Building2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { api } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";

type ProfilResponse = {
  nama_staf: string;
  email: string;
  no_wa: string | null;
  role: "administrator" | "pengawas";
  yayasan: { nama_yayasan: string } | null;
};

export default function ProfilPage() {
  const [data, setData] = useState<ProfilResponse | null>(null);
  const [nama, setNama] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sukses, setSukses] = useState("");

  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasiPassword, setKonfirmasiPassword] = useState("");
  const [lihatPassword, setLihatPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [errorPassword, setErrorPassword] = useState("");
  const [suksesPassword, setSuksesPassword] = useState("");

  useEffect(() => {
    api
      .get<ProfilResponse>("/pengaturan/profil")
      .then((res) => {
        setData(res);
        setNama(res.nama_staf);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function simpanNama(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSukses("");
    setSaving(true);
    try {
      await api.patch("/pengaturan/profil", { nama_staf: nama });
      setSukses("Profil berhasil diperbarui");
      setData((d) => (d ? { ...d, nama_staf: nama } : d));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function gantiPassword(e: React.FormEvent) {
    e.preventDefault();
    setErrorPassword("");
    setSuksesPassword("");

    if (passwordBaru.length < 6) {
      setErrorPassword("Kata sandi minimal 6 karakter");
      return;
    }
    if (passwordBaru !== konfirmasiPassword) {
      setErrorPassword("Konfirmasi kata sandi tidak cocok");
      return;
    }

    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: passwordBaru });
    setSavingPassword(false);

    if (error) {
      setErrorPassword(error.message);
      return;
    }
    setSuksesPassword("Kata sandi berhasil diubah");
    setPasswordBaru("");
    setKonfirmasiPassword("");
  }

  if (loading) return <p className="text-text-secondary">Memuat data...</p>;
  if (!data) return <p className="text-danger">Gagal memuat profil.</p>;

  const inisial = data.nama_staf.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div>
      <PageHeader title="Profil Akun" subtitle="Informasi akun dan peran Anda di sistem" />

      <div className="mb-6 flex flex-col items-start gap-5 rounded-card bg-secondary p-7 text-white sm:flex-row sm:items-center">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold">
          {inisial}
        </div>
        <div className="flex-1">
          <div className="text-xl font-semibold">{data.nama_staf}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/70">
            <span className="inline-flex items-center gap-1 rounded-pill bg-white/15 px-2.5 py-1 text-xs font-medium">
              <ShieldCheck size={12} /> {data.role === "administrator" ? "Administrator" : "Pengawas"}
            </span>
            <span>{data.yayasan?.nama_yayasan ?? "Tanpa yayasan"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Form nama */}
          <div className="rounded-card bg-surface p-6 shadow-card">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">Ubah Nama Tampilan</h2>

            {error && <div className="mb-4 rounded-input bg-danger-soft px-3 py-2 text-sm text-danger">{error}</div>}
            {sukses && <div className="mb-4 rounded-input bg-success-soft px-3 py-2 text-sm text-success">{sukses}</div>}

            <form onSubmit={simpanNama} className="max-w-md">
              <label className="mb-1 block text-sm font-medium text-text-secondary">Nama Lengkap</label>
              <input
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="mb-4 w-full rounded-input border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={saving}
                className="rounded-input bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan perubahan"}
              </button>
            </form>
          </div>

          {/* Form ganti password */}
          <div className="rounded-card bg-surface p-6 shadow-card">
            <h2 className="mb-1 text-lg font-semibold text-text-primary">Ganti Kata Sandi</h2>
            <p className="mb-4 text-sm text-text-secondary">Minimal 6 karakter.</p>

            {errorPassword && <div className="mb-4 rounded-input bg-danger-soft px-3 py-2 text-sm text-danger">{errorPassword}</div>}
            {suksesPassword && <div className="mb-4 rounded-input bg-success-soft px-3 py-2 text-sm text-success">{suksesPassword}</div>}

            <form onSubmit={gantiPassword} className="max-w-md">
              <label className="mb-1 block text-sm font-medium text-text-secondary">Kata Sandi Baru</label>
              <div className="relative mb-4">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type={lihatPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={passwordBaru}
                  onChange={(e) => setPasswordBaru(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full rounded-input border border-border py-2 pl-9 pr-10 text-sm outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setLihatPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
                >
                  {lihatPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <label className="mb-1 block text-sm font-medium text-text-secondary">Konfirmasi Kata Sandi Baru</label>
              <input
                type={lihatPassword ? "text" : "password"}
                required
                minLength={6}
                value={konfirmasiPassword}
                onChange={(e) => setKonfirmasiPassword(e.target.value)}
                placeholder="Ulangi kata sandi baru"
                className="mb-4 w-full rounded-input border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              />

              <button
                type="submit"
                disabled={savingPassword}
                className="rounded-input bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
              >
                {savingPassword ? "Menyimpan..." : "Ganti Kata Sandi"}
              </button>
            </form>
          </div>
        </div>

        <div className="rounded-card bg-surface p-6 shadow-card">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-secondary">Detail Akun</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-input bg-primary-soft text-primary">
                <Mail size={18} />
              </div>
              <div>
                <div className="text-xs text-text-secondary">Email</div>
                <div className="break-all font-medium text-text-primary">{data.email}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-input bg-success-soft text-success">
                <Building2 size={18} />
              </div>
              <div>
                <div className="text-xs text-text-secondary">Yayasan</div>
                <div className="font-medium text-text-primary">{data.yayasan?.nama_yayasan ?? "-"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}