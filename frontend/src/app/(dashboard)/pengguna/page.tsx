// frontend/src/app/(dashboard)/pengguna/page.tsx

"use client";
import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { inisialNama } from "@/hooks/useSession";
import type { PenggunaTunanetra, Perangkat } from "@/types";

export default function PenggunaPage() {
  const [pengguna, setPengguna] = useState<PenggunaTunanetra[]>([]);
  const [perangkat, setPerangkat] = useState<Perangkat[]>([]);
  const [cari, setCari] = useState("");
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");

  const [form, setForm] = useState<{ id: string | null; nama: string; alamat: string } | null>(null);
  const [hapus, setHapus] = useState<PenggunaTunanetra | null>(null);
  const [galatForm, setGalatForm] = useState("");
  const [menyimpan, setMenyimpan] = useState(false);

  const muat = useCallback(() => {
    Promise.all([api.get<PenggunaTunanetra[]>("/pengguna"), api.get<Perangkat[]>("/perangkat")])
      .then(([u, p]) => {
        setPengguna(u);
        setPerangkat(p);
      })
      .catch((e) => setGalat(e instanceof Error ? e.message : "Gagal memuat data"))
      .finally(() => setMemuat(false));
  }, []);

  useEffect(muat, [muat]);

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;

    setGalatForm("");
    setMenyimpan(true);
    try {
      const isi = { nama_tunanetra: form.nama, alamat: form.alamat.trim() || null };
      if (form.id) await api.patch(`/pengguna/${form.id}`, isi);
      else await api.post("/pengguna", isi);
      setForm(null);
      muat();
    } catch (err) {
      setGalatForm(err instanceof Error ? err.message : "Gagal menyimpan pengguna");
    } finally {
      setMenyimpan(false);
    }
  }

  async function konfirmasiHapus() {
    if (!hapus) return;

    setGalatForm("");
    setMenyimpan(true);
    try {
      await api.delete(`/pengguna/${hapus.id_tunanetra}`);
      setHapus(null);
      muat();
    } catch (err) {
      setGalatForm(err instanceof Error ? err.message : "Gagal menghapus pengguna");
    } finally {
      setMenyimpan(false);
    }
  }

  const judul = <PageHeader title="Data pengguna" subtitle="Pengguna tongkat yang dinaungi yayasan" />;

  if (memuat) {
    return (
      <>
        {judul}
        <p className="text-[15px] text-text-secondary">Memuat data…</p>
      </>
    );
  }

  if (galat) {
    return (
      <>
        {judul}
        <p className="rounded-inner bg-danger-soft px-[18px] py-3.5 text-[15px] text-danger-text">
          Gagal memuat data pengguna: {galat}
        </p>
      </>
    );
  }

  const kunci = cari.trim().toLowerCase();
  const terlihat = kunci
    ? pengguna.filter((u) => u.nama_tunanetra.toLowerCase().includes(kunci))
    : pengguna;

  const perangkatPengguna = (id: string) => perangkat.find((p) => p.dipakai_oleh === id)?.id_perangkat ?? null;

  return (
    <>
      {judul}

      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="Cari nama pengguna"
              aria-label="Cari nama pengguna"
              className="h-11 w-full rounded-pill bg-surface pl-10 pr-4 text-sm outline-none shadow-[inset_0_0_0_1.5px_var(--color-border)] focus:shadow-[inset_0_0_0_2px_var(--color-ring)]"
            />
          </div>

          <Button onClick={() => setForm({ id: null, nama: "", alamat: "" })}>
            <Plus size={16} strokeWidth={2.5} />
            Tambah pengguna
          </Button>
        </div>

        <section className="overflow-hidden rounded-card border-2 border-border bg-surface">
          <div className="flex items-center justify-between gap-4 px-5 py-3.5">
            <h2 className="text-[17px] font-extrabold leading-6">Pengguna terdaftar</h2>
            <span className="text-sm text-text-secondary">
              {pengguna.length} pengguna{kunci && ` · ${terlihat.length} cocok`}
            </span>
          </div>

          {pengguna.length === 0 ? (
            <p className="px-5 pb-5 text-sm leading-5 text-text-secondary">
              Belum ada pengguna. Tambahkan pengguna lebih dulu agar tongkat bisa dipasangkan ke orangnya.
            </p>
          ) : terlihat.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-text-secondary">
              Tidak ada nama yang cocok dengan &ldquo;{cari.trim()}&rdquo;.
            </p>
          ) : (
            <div className="md:max-h-[max(260px,calc(100vh-340px))] overflow-auto [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-10 [&_thead_th]:bg-secondary-soft">
              <table className="tabel-kartu w-full">
                <thead>
                  <tr className="bg-secondary-soft text-left text-[13px] font-bold uppercase tracking-[0.06em] text-[#3F5B82]">
                    <th scope="col" className="px-5 py-2.5">Pengguna</th>
                    <th scope="col" className="px-5 py-2.5">Perangkat</th>
                    <th scope="col" className="px-5 py-2.5">Alamat</th>
                    <th scope="col" className="px-5 py-2.5">Terdaftar</th>
                    <th scope="col" className="px-5 py-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {terlihat.map((u, i) => (
                    <tr key={u.id_tunanetra} className="border-t border-[#EDF1F6]">
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-9 w-9 flex-none items-center justify-center rounded-pill text-xs font-extrabold ${
                              i % 2 === 0 ? "bg-tile-amber text-[#5C3D00]" : "bg-tile-blue text-primary"
                            }`}
                          >
                            {inisialNama(u.nama_tunanetra)}
                          </span>
                          <div className="min-w-0">
                            <b className="block truncate text-[15px] font-bold">{u.nama_tunanetra}</b>
                            <span className="text-[13px] text-text-secondary">Pengguna tongkat</span>
                          </div>
                        </div>
                      </td>

                      <td data-label="Perangkat" className="data px-5 py-2.5 text-[13px]">
                        {perangkatPengguna(u.id_tunanetra) ?? (
                          <span className="font-sans text-text-secondary">Belum dipasangkan</span>
                        )}
                      </td>

                      <td data-label="Alamat" className="px-5 py-2.5 text-sm">
                        {u.alamat ?? <span className="text-text-secondary">—</span>}
                      </td>

                      <td data-label="Terdaftar" className="px-5 py-2.5 text-sm">
                        {new Date(u.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td data-label="Aksi" className="px-5 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() =>
                              setForm({ id: u.id_tunanetra, nama: u.nama_tunanetra, alamat: u.alamat ?? "" })
                            }
                            aria-label={`Ubah ${u.nama_tunanetra}`}
                            className="flex h-9 w-9 items-center justify-center rounded-pill text-text-secondary hover:bg-surface-sunken hover:text-primary"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setHapus(u)}
                            aria-label={`Hapus ${u.nama_tunanetra}`}
                            className="flex h-9 w-9 items-center justify-center rounded-pill text-text-secondary hover:bg-danger-soft hover:text-danger-text"
                          >
                            <Trash2 size={16} />
                          </button>
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
          Pesan SOS dikirim ke nomor WhatsApp akun Administrator dan Pengawas. Nomor diatur di Profil akun
          masing-masing.
        </p>
      </div>

      {form && (
        <Modal
          judul={form.id ? "Ubah pengguna" : "Tambah pengguna"}
          keterangan="Data ini dipakai sebagai identitas pemakai tongkat."
          onTutup={() => {
            setForm(null);
            setGalatForm("");
          }}
        >
          <form onSubmit={simpan} className="flex flex-col gap-4">
            {galatForm && (
              <p role="alert" className="flex gap-3 rounded-inner bg-danger-soft px-4 py-3 text-sm text-danger-text">
                <AlertCircle size={18} className="flex-none" />
                {galatForm}
              </p>
            )}

            <Field
              label="Nama lengkap"
              required
              autoFocus
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
            />
            <Field
              label="Alamat"
              hint="Opsional. Dipakai sebagai rujukan saat menangani insiden."
              value={form.alamat}
              onChange={(e) => setForm({ ...form, alamat: e.target.value })}
            />

            <div className="mt-1 flex gap-3">
              <Button type="submit" disabled={menyimpan} className="flex-1">
                {menyimpan ? "Menyimpan…" : "Simpan"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setForm(null)}>
                Batal
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {hapus && (
        <Modal
          judul="Hapus pengguna"
          onTutup={() => {
            setHapus(null);
            setGalatForm("");
          }}
        >
          <div className="flex flex-col gap-4">
            <p className="text-[15px] leading-6">
              Hapus <b>{hapus.nama_tunanetra}</b> dari data yayasan? Riwayat insiden yang pernah terjadi tetap
              tersimpan.
            </p>

            {galatForm && (
              <p role="alert" className="flex gap-3 rounded-inner bg-danger-soft px-4 py-3 text-sm text-danger-text">
                <AlertCircle size={18} className="flex-none" />
                {galatForm}
              </p>
            )}

            <div className="flex gap-3">
              <Button variant="danger" onClick={konfirmasiHapus} disabled={menyimpan} className="flex-1">
                {menyimpan ? "Menghapus…" : "Hapus"}
              </Button>
              <Button variant="ghost" onClick={() => setHapus(null)}>
                Batal
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}