// frontend/src/app/(dashboard)/profil/page.tsx

"use client";
import { useEffect, useState } from "react";
import { AlertCircle, Check } from "lucide-react";
import { api } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Field, TombolTampilkan } from "@/components/ui/Field";
import type { Peran, StatusAkun } from "@/hooks/useSession";

type Profil = {
  nama_staf: string;
  email: string | null;
  no_wa: string | null;
  role: Peran;
  status: StatusAkun;
  yayasan: { nama_yayasan: string; kota_yayasan: string } | null;
};

function Kabar({ nada, pesan }: { nada: "galat" | "sukses"; pesan: string }) {
  return (
    <p
      role={nada === "galat" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-inner px-4 py-3 text-sm leading-5 ${
        nada === "galat" ? "bg-danger-soft text-danger-text" : "bg-success-soft text-success-text"
      }`}
    >
      {nada === "galat" ? (
        <AlertCircle size={18} className="mt-px flex-none" />
      ) : (
        <Check size={18} strokeWidth={2.6} className="mt-px flex-none" />
      )}
      {pesan}
    </p>
  );
}

export default function ProfilPage() {
  const [profil, setProfil] = useState<Profil | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [galatMuat, setGalatMuat] = useState("");

  const [nama, setNama] = useState("");
  const [noWa, setNoWa] = useState("");

  const [kabarNama, setKabarNama] = useState<{ nada: "galat" | "sukses"; pesan: string } | null>(null);
  const [kabarWa, setKabarWa] = useState<{ nada: "galat" | "sukses"; pesan: string } | null>(null);
  const [kabarSandi, setKabarSandi] = useState<{ nada: "galat" | "sukses"; pesan: string } | null>(null);

  const [simpanNamaJalan, setSimpanNamaJalan] = useState(false);
  const [simpanWaJalan, setSimpanWaJalan] = useState(false);
  const [simpanSandiJalan, setSimpanSandiJalan] = useState(false);

  const [sandi, setSandi] = useState("");
  const [lihatSandi, setLihatSandi] = useState(false);

  useEffect(() => {
    api
      .get<Profil>("/pengaturan/profil")
      .then((data) => {
        setProfil(data);
        setNama(data.nama_staf ?? "");
        setNoWa(data.no_wa ?? "");
      })
      .catch((e) => setGalatMuat(e instanceof Error ? e.message : "Gagal memuat profil"))
      .finally(() => setMemuat(false));
  }, []);

  async function kirimProfil(namaBaru: string, waBaru: string) {
    await api.patch("/pengaturan/profil", {
      nama_staf: namaBaru.trim(),
      no_wa: waBaru.trim() || null,
    });
    setProfil((p) => (p ? { ...p, nama_staf: namaBaru.trim(), no_wa: waBaru.trim() || null } : p));
  }

  async function simpanNama(e: React.FormEvent) {
    e.preventDefault();
    setKabarNama(null);

    if (!nama.trim()) {
      setKabarNama({ nada: "galat", pesan: "Nama lengkap wajib diisi" });
      return;
    }

    setSimpanNamaJalan(true);
    try {
      await kirimProfil(nama, noWa);
      setKabarNama({ nada: "sukses", pesan: "Nama tersimpan" });
    } catch (err) {
      setKabarNama({ nada: "galat", pesan: err instanceof Error ? err.message : "Gagal menyimpan nama" });
    } finally {
      setSimpanNamaJalan(false);
    }
  }

  async function simpanWa(e: React.FormEvent) {
    e.preventDefault();
    setKabarWa(null);
    setSimpanWaJalan(true);
    try {
      await kirimProfil(nama, noWa);
      setKabarWa({
        nada: "sukses",
        pesan: noWa.trim() ? "Nomor WhatsApp tersimpan" : "Nomor WhatsApp dikosongkan",
      });
    } catch (err) {
      setKabarWa({ nada: "galat", pesan: err instanceof Error ? err.message : "Gagal menyimpan nomor" });
    } finally {
      setSimpanWaJalan(false);
    }
  }

  async function gantiSandi(e: React.FormEvent) {
    e.preventDefault();
    setKabarSandi(null);

    if (sandi.length < 6) {
      setKabarSandi({ nada: "galat", pesan: "Kata sandi minimal 6 karakter" });
      return;
    }

    setSimpanSandiJalan(true);
    const { error } = await supabase.auth.updateUser({ password: sandi });
    setSimpanSandiJalan(false);

    if (error) {
      setKabarSandi({
        nada: "galat",
        pesan: /different from the old/i.test(error.message)
          ? "Kata sandi baru harus berbeda dari yang sekarang"
          : "Gagal mengganti kata sandi. Coba lagi beberapa saat lagi.",
      });
      return;
    }

    setSandi("");
    setLihatSandi(false);
    setKabarSandi({ nada: "sukses", pesan: "Kata sandi berhasil diganti" });
  }

  const judul = <PageHeader title="Profil akun" subtitle="Nama, nomor WhatsApp, dan kata sandi Anda" />;

  if (memuat) {
    return (
      <>
        {judul}
        <p className="text-[15px] text-text-secondary">Memuat profil…</p>
      </>
    );
  }

  if (!profil) {
    return (
      <>
        {judul}
        <p className="rounded-inner bg-danger-soft px-[18px] py-3.5 text-[15px] text-danger-text">
          Gagal memuat profil{galatMuat && `: ${galatMuat}`}
        </p>
      </>
    );
  }

  return (
    <>
      {judul}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-card border-2 border-border bg-surface p-6">
          <h2 className="text-[22px] font-extrabold leading-7">Data akun</h2>

          <form onSubmit={simpanNama} className="flex flex-col gap-4">
            <Field
              label="Nama lengkap"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              autoComplete="name"
              required
            />

            <div>
              <span className="mb-1.5 block text-sm font-bold">Email</span>
              <p className="flex h-[46px] items-center rounded-field bg-field px-4 text-[15px] text-text-secondary">
                {profil.email ?? "—"}
              </p>
              <p className="mt-1.5 text-sm text-text-secondary">Email tidak bisa diubah.</p>
            </div>

            {kabarNama && <Kabar {...kabarNama} />}

            <Button type="submit" disabled={simpanNamaJalan} className="self-start">
              {simpanNamaJalan ? "Menyimpan…" : "Simpan nama"}
            </Button>
          </form>

          <dl className="mt-auto grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-2 border-t border-border pt-4 text-sm leading-5">
            <dt className="text-text-secondary">Peran</dt>
            <dd className="text-right font-bold">
              {profil.role === "ADMINISTRATOR" ? "Administrator" : "Pengawas"}
            </dd>

            <dt className="text-text-secondary">Yayasan</dt>
            <dd className="text-right font-bold">
              {profil.yayasan ? `${profil.yayasan.nama_yayasan}, ${profil.yayasan.kota_yayasan}` : "—"}
            </dd>
          </dl>
        </section>

        <div className="flex flex-col gap-5">
          <section className="flex flex-1 flex-col gap-3.5 rounded-card border-2 border-border bg-surface p-6">
            <h2 className="text-[22px] font-extrabold leading-7">Nomor WhatsApp saya</h2>
            <p className="text-sm leading-5 text-text-secondary">
              Pesan SOS dikirim ke nomor ini. Kosongkan jika Anda tidak ingin menerima pesan.
            </p>

            <form onSubmit={simpanWa} className="flex flex-col gap-3.5">
              <div className="flex flex-wrap gap-2.5">
                <input
                  value={noWa}
                  onChange={(e) => setNoWa(e.target.value)}
                  placeholder="+62812XXXXXXX"
                  inputMode="tel"
                  autoComplete="tel"
                  aria-label="Nomor WhatsApp saya"
                  className="data h-[46px] min-w-[200px] flex-1 rounded-field bg-field px-4 text-[15px] outline-none focus:bg-surface focus:shadow-[inset_0_0_0_2px_var(--color-ring)]"
                />
                <Button type="submit" disabled={simpanWaJalan}>
                  {simpanWaJalan ? "Menyimpan…" : "Simpan"}
                </Button>
              </div>

              {kabarWa && <Kabar {...kabarWa} />}
            </form>
          </section>

          <section className="flex flex-1 flex-col gap-3.5 rounded-card border-2 border-border bg-surface p-6">
            <h2 className="text-[22px] font-extrabold leading-7">Ganti kata sandi</h2>

            <form onSubmit={gantiSandi} className="flex flex-col gap-3.5">
              <Field
                label="Kata sandi baru"
                type={lihatSandi ? "text" : "password"}
                value={sandi}
                onChange={(e) => setSandi(e.target.value)}
                autoComplete="new-password"
                hint="Minimal 6 karakter."
                trailing={<TombolTampilkan aktif={lihatSandi} onToggle={() => setLihatSandi((v) => !v)} />}
              />

              {kabarSandi && <Kabar {...kabarSandi} />}

              <Button type="submit" disabled={simpanSandiJalan} className="self-start">
                {simpanSandiJalan ? "Mengganti…" : "Ganti kata sandi"}
              </Button>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}