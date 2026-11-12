// frontend/src/app/(dashboard)/perangkat/page.tsx

"use client";
import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api-client";
import { useSession } from "@/hooks/useSession";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { waktuRelatif } from "@/lib/format";
import type { Perangkat, PenggunaTunanetra, Geofence } from "@/types";

// Peta hanya dimuat di browser, karena Leaflet membutuhkan objek window.
const PetaZona = dynamic(() => import("@/components/map/GeofenceMapPicker").then((m) => m.GeofenceMapPicker), {
  ssr: false,
  loading: () => <div className="h-full w-full rounded-map bg-surface-sunken" />,
});

const RADIUS_MIN = 50;
const PUSAT_AWAL = { lat: -6.9932, lng: 110.4203 };

type Tab = "perangkat" | "zona";

export default function PerangkatPage() {
  const { sesi } = useSession();
  const isAdmin = sesi?.role === "ADMINISTRATOR";

  const [tab, setTab] = useState<Tab>("perangkat");
  const [perangkat, setPerangkat] = useState<Perangkat[]>([]);
  const [pengguna, setPengguna] = useState<PenggunaTunanetra[]>([]);
  const [zona, setZona] = useState<Geofence[]>([]);
  const [sasaran, setSasaran] = useState("yayasan");
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");

  const [tambah, setTambah] = useState(false);
  const [serial, setSerial] = useState("");
  const [hapus, setHapus] = useState<Perangkat | null>(null);
  const [galatAksi, setGalatAksi] = useState("");
  const [sibuk, setSibuk] = useState(false);

  const [pusat, setPusat] = useState(PUSAT_AWAL);
  const [radius, setRadius] = useState(300);
  const [pesanZona, setPesanZona] = useState("");

  const zonaYayasan = zona.find((z) => z.id_perangkat === null) ?? null;
  const zonaKhusus = sasaran === "yayasan" ? null : (zona.find((z) => z.id_perangkat === sasaran) ?? null);

  const muat = useCallback(() => {
    Promise.all([
      api.get<Perangkat[]>("/perangkat"),
      api.get<PenggunaTunanetra[]>("/pengguna").catch(() => [] as PenggunaTunanetra[]),
      api.get<Geofence[]>("/geofence").catch(() => [] as Geofence[]),
    ])
      .then(([p, u, g]) => {
        setPerangkat(p);
        setPengguna(u);

        setZona(g);
        setSasaran("yayasan");
        const zonaDefault = g.find((z) => z.id_perangkat === null);
        if (zonaDefault) {
          setPusat({ lat: Number(zonaDefault.center_lat), lng: Number(zonaDefault.center_long) });
          setRadius(zonaDefault.radius_meter);
        }
      })
      .catch((e) => setGalat(e instanceof Error ? e.message : "Gagal memuat data"))
      .finally(() => setMemuat(false));
  }, []);

  useEffect(muat, [muat]);

  // Waktu pemasangan terakhir ikut dikirim agar server menolak bila akun lain sudah mengubahnya lebih dulu.
  async function pasangkan(p: Perangkat, idPengguna: string) {
    setGalatAksi("");
    try {
      await api.patch(`/perangkat/${p.id_perangkat}/pairing`, {
        dipakai_oleh: idPengguna || null,
        dipasang_pada_sebelumnya: p.dipasang_pada,
      });
      muat();
    } catch (err) {
      setGalatAksi(err instanceof Error ? err.message : "Gagal mengubah pemasangan");
    }
  }

  async function tambahPerangkat(e: React.FormEvent) {
    e.preventDefault();
    setGalatAksi("");
    setSibuk(true);
    try {
      await api.post("/perangkat", { id_perangkat: serial });
      setTambah(false);
      setSerial("");
      muat();
    } catch (err) {
      setGalatAksi(err instanceof Error ? err.message : "Gagal menambah perangkat");
    } finally {
      setSibuk(false);
    }
  }

  async function konfirmasiHapus() {
    if (!hapus) return;
    setGalatAksi("");
    setSibuk(true);
    try {
      await api.delete(`/perangkat/${hapus.id_perangkat}`);
      setHapus(null);
      muat();
    } catch (err) {
      setGalatAksi(err instanceof Error ? err.message : "Gagal menghapus perangkat");
    } finally {
      setSibuk(false);
    }
  }

  function pilihSasaran(nilai: string) {
    setSasaran(nilai);
    setPesanZona("");
    setGalatAksi("");
    const acuan = (nilai === "yayasan" ? null : zona.find((z) => z.id_perangkat === nilai)) ?? zonaYayasan;
    if (acuan) {
      setPusat({ lat: Number(acuan.center_lat), lng: Number(acuan.center_long) });
      setRadius(acuan.radius_meter);
    }
  }

  async function simpanZona() {
    setPesanZona("");
    setGalatAksi("");
    setSibuk(true);
    try {
      const alamat = sasaran === "yayasan" ? "/geofence/yayasan" : `/geofence/${encodeURIComponent(sasaran)}`;
      const hasil = await api.put<Geofence>(alamat, {
        nama_area: (sasaran === "yayasan" ? zonaYayasan : zonaKhusus)?.nama_area ?? null,
        center_lat: pusat.lat,
        center_long: pusat.lng,
        radius_meter: radius,
      });
      setZona((lama) => [...lama.filter((z) => z.id_geofence !== hasil.id_geofence), hasil]);
      setPesanZona(sasaran === "yayasan" ? "Zona yayasan tersimpan." : `Zona khusus ${sasaran} tersimpan.`);
    } catch (err) {
      setGalatAksi(err instanceof Error ? err.message : "Gagal menyimpan zona");
    } finally {
      setSibuk(false);
    }
  }

  async function hapusZonaKhusus() {
    setPesanZona("");
    setGalatAksi("");
    setSibuk(true);
    try {
      await api.delete(`/geofence/${encodeURIComponent(sasaran)}`);
      setZona((lama) => lama.filter((z) => z.id_perangkat !== sasaran));
      if (zonaYayasan) {
        setPusat({ lat: Number(zonaYayasan.center_lat), lng: Number(zonaYayasan.center_long) });
        setRadius(zonaYayasan.radius_meter);
      }
      setPesanZona("Zona khusus dihapus. Perangkat ini kembali memakai zona yayasan.");
    } catch (err) {
      setGalatAksi(err instanceof Error ? err.message : "Gagal menghapus zona khusus");
    } finally {
      setSibuk(false);
    }
  }

  const judul = <PageHeader title="Data perangkat" subtitle="Kelola tongkat PENUNTUN yang terdaftar" />;

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
          Gagal memuat data perangkat: {galat}
        </p>
      </>
    );
  }

  return (
    <>
      {judul}

      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 rounded-pill bg-field p-1" role="tablist" aria-label="Tampilan perangkat">
            {([["perangkat", "Perangkat"], ["zona", "Zona aman"]] as const).map(([nilai, label]) => (
              <button
                key={nilai}
                role="tab"
                aria-selected={tab === nilai}
                onClick={() => setTab(nilai)}
                className={`h-9 rounded-pill px-5 text-sm font-bold transition-colors ${
                  tab === nilai ? "bg-secondary text-white" : "text-text-secondary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "perangkat" && isAdmin && (
            <Button onClick={() => setTambah(true)}>
              <Plus size={16} strokeWidth={2.5} />
              Tambah perangkat
            </Button>
          )}
        </div>

        {galatAksi && (
          <p role="alert" className="flex gap-3 rounded-inner bg-danger-soft px-[18px] py-3.5 text-[15px] text-danger-text">
            <AlertCircle size={20} className="flex-none" />
            {galatAksi}
          </p>
        )}

        {tab === "perangkat" ? (
          <>
            <section className="overflow-hidden rounded-card border-2 border-border bg-surface">
              <div className="flex items-center justify-between gap-4 px-5 py-3.5">
                <h2 className="text-[17px] font-extrabold leading-6">Perangkat terdaftar</h2>
                <span className="text-sm text-text-secondary">{perangkat.length} perangkat</span>
              </div>

              {perangkat.length === 0 ? (
                <p className="px-5 pb-5 text-sm leading-5 text-text-secondary">
                  {isAdmin
                    ? "Belum ada tongkat terdaftar. Tambahkan serial number tongkat agar lokasi dan baterainya terpantau."
                    : "Belum ada tongkat terdaftar. Hubungi Administrator yayasan untuk mendaftarkan perangkat."}
                </p>
              ) : (
                <div className="md:max-h-[max(260px,calc(100vh-340px))] overflow-auto [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-10 [&_thead_th]:bg-secondary-soft">
                  <table className="tabel-kartu w-full">
                    <thead>
                      <tr className="bg-secondary-soft text-left text-[13px] font-bold uppercase tracking-[0.06em] text-[#3F5B82]">
                        <th scope="col" className="px-5 py-2.5">Perangkat</th>
                        <th scope="col" className="px-5 py-2.5">Pemakai saat ini</th>
                        <th scope="col" className="px-5 py-2.5">Status</th>
                        <th scope="col" className="px-5 py-2.5">Terakhir terlihat</th>
                        {isAdmin && <th scope="col" className="px-5 py-2.5 text-right">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {perangkat.map((p, i) => (
                        <tr key={p.id_perangkat} className="border-t border-[#EDF1F6]">
                          <td className="px-5 py-2.5">
                            <div className="flex items-center gap-3">
                              <span
                                className={`flex h-9 w-9 flex-none items-center justify-center rounded-pill text-xs font-extrabold ${
                                  i % 2 === 0 ? "bg-tile-amber text-[#5C3D00]" : "bg-tile-blue text-primary"
                                }`}
                              >
                                {p.id_perangkat.slice(-3)}
                              </span>
                              <b className="data text-[15px] font-bold">{p.id_perangkat}</b>
                            </div>
                          </td>

                          <td data-label="Pemakai saat ini" className="px-5 py-2.5">
                            <select
                              value={p.dipakai_oleh ?? ""}
                              onChange={(e) => pasangkan(p, e.target.value)}
                              aria-label={`Pemakai ${p.id_perangkat}`}
                              className="h-10 w-full max-w-[260px] rounded-field bg-field px-3 text-sm outline-none focus:bg-surface focus:shadow-[inset_0_0_0_2px_var(--color-ring)]"
                            >
                              <option value="">Tidak terpasang</option>
                              {pengguna.map((u) => (
                                <option key={u.id_tunanetra} value={u.id_tunanetra}>
                                  {u.nama_tunanetra}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td data-label="Status" className="px-5 py-2.5">
                            <StatusPill
                              status={p.status_online ? "online" : "offline"}
                              label={p.status_online ? "Online" : "Offline"}
                            />
                          </td>

                          <td data-label="Terakhir terlihat" className="px-5 py-2.5 text-sm">{waktuRelatif(p.last_active)}</td>

                          {isAdmin && (
                            <td data-label="Aksi" className="px-5 py-2.5">
                              <div className="flex justify-end">
                                <button
                                  onClick={() => setHapus(p)}
                                  aria-label={`Hapus ${p.id_perangkat}`}
                                  className="flex h-9 w-9 items-center justify-center rounded-pill text-text-secondary hover:bg-danger-soft hover:text-danger-text"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <p className="text-[13px] leading-5 text-text-secondary">
              Administrator dan Pengawas sama-sama bisa memasangkan dan melepas pengguna. Menambah atau menghapus
              perangkat hanya oleh Administrator.
            </p>
          </>
        ) : (
          <div className="flex flex-col gap-5 lg:h-[calc(100vh-240px)] lg:min-h-[520px] lg:flex-row">
            <div className="h-[420px] min-w-0 flex-1 overflow-hidden rounded-card border-2 border-border lg:h-auto">
              <PetaZona key={sasaran} center={pusat} radius={radius} onPick={(lat, lng) => setPusat({ lat, lng })} />
            </div>

            <aside className="flex w-full flex-none flex-col gap-4 overflow-y-auto rounded-card border-2 border-border bg-surface p-5 lg:w-[340px]">
              <h2 className="text-[17px] font-extrabold leading-6">
                {sasaran === "yayasan" ? "Zona yayasan (default)" : `Zona ${sasaran}`}
              </h2>

              <label className="flex flex-col gap-1.5 text-sm font-bold">
                Atur zona untuk
                <select
                  value={sasaran}
                  onChange={(e) => pilihSasaran(e.target.value)}
                  className="h-11 rounded-field bg-field px-3 text-sm font-normal outline-none focus:bg-surface focus:shadow-[inset_0_0_0_2px_var(--color-ring)]"
                >
                  <option value="yayasan">Zona yayasan (default)</option>
                  {perangkat.map((p) => (
                    <option key={p.id_perangkat} value={p.id_perangkat}>
                      {p.id_perangkat}
                      {p.pengguna?.nama_tunanetra ? ` · ${p.pengguna.nama_tunanetra}` : ""}
                      {zona.some((z) => z.id_perangkat === p.id_perangkat) ? " · zona khusus" : ""}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <span className="text-sm font-bold">Titik pusat</span>
                  <span className="text-[13px] text-text-secondary">Geser titik biru atau ketuk peta</span>
                </div>
                <div className="data flex h-11 items-center rounded-field bg-field px-4 text-[13px]">
                  {pusat.lat.toFixed(6)}, {pusat.lng.toFixed(6)}
                </div>
              </div>

              <Field
                label={`Radius (meter, minimal ${RADIUS_MIN})`}
                type="number"
                min={RADIUS_MIN}
                max={20000}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                disabled={!isAdmin}
              />

              {pesanZona && (
                <p role="status" className="rounded-inner bg-success-soft px-4 py-3 text-sm text-success-text">
                  {pesanZona}
                </p>
              )}

              {!isAdmin ? (
                <p className="mt-auto text-sm leading-5 text-text-secondary">
                  Hanya Administrator yang dapat mengubah zona aman.
                </p>
              ) : (
                <div className="mt-auto flex flex-col gap-2">
                  <Button onClick={simpanZona} disabled={sibuk || radius < RADIUS_MIN} className="w-full">
                    {sibuk
                      ? "Menyimpan…"
                      : sasaran === "yayasan"
                      ? zonaYayasan
                        ? "Simpan perubahan"
                        : "Simpan zona"
                      : zonaKhusus
                      ? "Simpan perubahan"
                      : "Simpan zona khusus"}
                  </Button>
                  {zonaKhusus && (
                    <button
                      onClick={hapusZonaKhusus}
                      disabled={sibuk}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-input bg-surface px-5 text-sm font-bold text-danger-text shadow-[inset_0_0_0_2px_var(--color-danger)] transition-colors hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                      Hapus zona khusus
                    </button>
                  )}
                </div>
              )}
            </aside>
          </div>
        )}
      </div>

      {tambah && (
        <Modal
          judul="Tambah perangkat"
          keterangan="Serial number tertera pada badan tongkat dan harus sama dengan yang dikirim perangkat."
          onTutup={() => {
            setTambah(false);
            setGalatAksi("");
          }}
        >
          <form onSubmit={tambahPerangkat} className="flex flex-col gap-4">
            <Field
              label="Serial number"
              required
              autoFocus
              placeholder="PNT-A01"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
            />
            <div className="mt-1 flex gap-3">
              <Button type="submit" disabled={sibuk} className="flex-1">
                {sibuk ? "Menyimpan…" : "Tambah"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setTambah(false)}>
                Batal
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {hapus && (
        <Modal judul="Hapus perangkat" onTutup={() => setHapus(null)}>
          <div className="flex flex-col gap-4">
            <p className="text-[15px] leading-6">
              Hapus <b className="data">{hapus.id_perangkat}</b> dari inventaris? Riwayat perjalanannya ikut terhapus,
              tetapi riwayat insiden tetap tersimpan.
            </p>
            <div className="flex gap-3">
              <Button variant="danger" onClick={konfirmasiHapus} disabled={sibuk} className="flex-1">
                {sibuk ? "Menghapus…" : "Hapus"}
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