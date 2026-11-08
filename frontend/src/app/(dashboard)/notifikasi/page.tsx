// frontend/src/app/(dashboard)/notifikasi/page.tsx
// Halaman Notifikasi SOS: daftar insiden, mode pilih untuk membersihkan riwayat, arsip, dan dialog konfirmasi.

"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Archive, ArchiveRestore, ArrowLeft, Check, Inbox, Send } from "lucide-react";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { useSession, inisialNama } from "@/hooks/useSession";
import { jamWIB, waktuRelatif } from "@/lib/format";
import type { Notifikasi } from "@/types";
import { DetailInsiden } from "./DetailInsiden";
import { RONA_INISIAL, RONA_STATUS, TEKS_STATUS, ringkasKirim } from "./status";

type Saringan = "SEMUA" | "AKTIF" | "DITANGANI" | "SELESAI";

const LABEL_SARINGAN: Record<Saringan, string> = {
  SEMUA: "Semua",
  AKTIF: "Aktif",
  DITANGANI: "Ditangani",
  SELESAI: "Selesai",
};

export default function NotifikasiPage() {
  const { sesi } = useSession();
  const isAdmin = sesi?.role === "ADMINISTRATOR";

  const [daftar, setDaftar] = useState<Notifikasi[]>([]);
  const [arsip, setArsip] = useState<Notifikasi[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");

  const [saringan, setSaringan] = useState<Saringan>("SEMUA");
  const [lihatArsip, setLihatArsip] = useState(false);
  const [modePilih, setModePilih] = useState(false);
  const [pilihBersih, setPilihBersih] = useState<number[]>([]);
  const [terpilih, setTerpilih] = useState<number[]>([]);
  const [idPilih, setIdPilih] = useState<number | null>(null);
  const [galatAksi, setGalatAksi] = useState("");
  const [memproses, setMemproses] = useState(false);
  const [konfirmasiBersih, setKonfirmasiBersih] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);

  const muat = useCallback(() => {
    Promise.all([
      api.get<Notifikasi[]>("/notifikasi"),
      api.get<Notifikasi[]>("/notifikasi?arsip=1").catch(() => [] as Notifikasi[]),
    ])
      .then(([aktif, diarsipkan]) => {
        setDaftar(aktif);
        setArsip(diarsipkan);
      })
      .catch((e) => setGalat(e instanceof Error ? e.message : "Gagal memuat data"))
      .finally(() => setMemuat(false));
  }, []);

  useEffect(muat, [muat]);
  useRealtimeTable("notifikasi", muat);

  // Di desktop, tinggi grid diukur supaya halaman pas satu layar: isi sampai dasar layar,
  // lalu kurangi sebesar kelebihan scroll sampai tidak ada lagi yang bisa di-scroll.
  useEffect(() => {
    const MIN = 360;

    function cariPenggulir(el: HTMLElement): HTMLElement {
      let induk = el.parentElement;
      while (induk) {
        const overflowY = getComputedStyle(induk).overflowY;
        if ((overflowY === "auto" || overflowY === "scroll") && induk.scrollHeight > induk.clientHeight) {
          return induk;
        }
        induk = induk.parentElement;
      }
      return document.documentElement;
    }

    function atur() {
      const el = gridRef.current;
      if (!el) return;
      if (window.innerWidth < 1024) {
        el.style.height = "";
        return;
      }

      const awal = window.innerHeight - el.getBoundingClientRect().top;
      let tinggi = Math.max(MIN, awal);
      el.style.height = `${tinggi}px`;

      for (let i = 0; i < 8 && tinggi > MIN; i++) {
        const gulir = cariPenggulir(el);
        const lebih = gulir.scrollHeight - gulir.clientHeight;
        if (lebih <= 0) break;
        tinggi = Math.max(MIN, tinggi - lebih);
        el.style.height = `${tinggi}px`;
      }

      // Pengaman untuk pembulatan piksel, plus jarak bila grid menempel di dasar layar.
      const bawah = window.innerHeight - el.getBoundingClientRect().bottom;
      const kurang = Math.max(4, 16 - bawah);
      if (tinggi > MIN + kurang) el.style.height = `${tinggi - kurang}px`;
    }

    atur();
    requestAnimationFrame(atur);
    document.fonts?.ready.then(atur);
    const t1 = window.setTimeout(atur, 300);
    const t2 = window.setTimeout(atur, 1200);
    window.addEventListener("resize", atur);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("resize", atur);
    };
  }, [memuat, galat]);

  async function jalankan(aksi: () => Promise<unknown>, pesanGagal: string) {
    setGalatAksi("");
    setMemproses(true);
    try {
      await aksi();
      muat();
      return true;
    } catch (err) {
      setGalatAksi(err instanceof Error ? err.message : pesanGagal);
      return false;
    } finally {
      setMemproses(false);
    }
  }

  async function bersihkan(ids: number[]) {
    const berhasil = await jalankan(() => api.patch("/notifikasi/bersihkan", { ids }), "Gagal membersihkan riwayat");
    if (!berhasil) return;
    setKonfirmasiBersih(false);
    setModePilih(false);
    setPilihBersih([]);
    setIdPilih(null);
    setSaringan("SEMUA");
  }

  async function pulihkan(id: number) {
    await jalankan(() => api.patch(`/notifikasi/${id}/pulihkan`, {}), "Gagal memulihkan insiden");
    setIdPilih(null);
  }

  async function pulihkanTerpilih(ids: number[]) {
    await jalankan(() => api.patch("/notifikasi/pulihkan", { ids }), "Gagal memulihkan insiden");
    setTerpilih([]);
    setIdPilih(null);
  }

  function bukaArsip() {
    setLihatArsip(true);
    setModePilih(false);
    setTerpilih([]);
    setIdPilih(null);
    setGalatAksi("");
  }

  function tutupArsip() {
    setLihatArsip(false);
    setTerpilih([]);
    setIdPilih(null);
    setGalatAksi("");
  }

  function mulaiPilih() {
    setModePilih(true);
    setPilihBersih([]);
    setIdPilih(null);
    setGalatAksi("");
  }

  function batalPilih() {
    setModePilih(false);
    setPilihBersih([]);
    setGalatAksi("");
  }

  const judul = <PageHeader title="Notifikasi SOS" subtitle="Riwayat SOS dan status pengiriman WhatsApp" />;

  if (memuat) {
    return (
      <>
        {judul}
        <p className="text-[15px] text-text-secondary">Memuat insiden…</p>
      </>
    );
  }

  if (galat) {
    return (
      <>
        {judul}
        <p className="rounded-inner bg-danger-soft px-[18px] py-3.5 text-[15px] text-danger-text">
          Gagal memuat notifikasi: {galat}
        </p>
      </>
    );
  }

  const jumlah: Record<Saringan, number> = {
    SEMUA: daftar.length,
    AKTIF: daftar.filter((n) => n.status === "AKTIF").length,
    DITANGANI: daftar.filter((n) => n.status === "DITANGANI").length,
    SELESAI: daftar.filter((n) => n.status === "SELESAI").length,
  };

  const gagalKirim = daftar.filter((n) => ringkasKirim(n.notifikasi_delivery).gagal.length > 0).length;

  const selesai = daftar.filter((n) => n.status === "SELESAI");
  const idBersih = pilihBersih.filter((id) => selesai.some((n) => n.id_notifikasi === id));
  const semuaBersih = selesai.length > 0 && idBersih.length === selesai.length;

  const terlihat = lihatArsip
    ? arsip
    : modePilih
      ? selesai
      : saringan === "SEMUA"
        ? daftar
        : daftar.filter((n) => n.status === saringan);
  const pilih = daftar.find((n) => n.id_notifikasi === idPilih) ?? arsip.find((n) => n.id_notifikasi === idPilih) ?? null;
  const pilihDiarsipkan = pilih != null && arsip.some((n) => n.id_notifikasi === pilih.id_notifikasi);

  const idTerpilih = terpilih.filter((id) => arsip.some((n) => n.id_notifikasi === id));
  const semuaTerpilih = arsip.length > 0 && idTerpilih.length === arsip.length;

  function toggleSatu(id: number) {
    setTerpilih((lama) => (lama.includes(id) ? lama.filter((x) => x !== id) : [...lama, id]));
  }

  function toggleSemua() {
    setTerpilih(semuaTerpilih ? [] : arsip.map((n) => n.id_notifikasi));
  }

  function toggleBersihSatu(id: number) {
    setPilihBersih((lama) => (lama.includes(id) ? lama.filter((x) => x !== id) : [...lama, id]));
  }

  function toggleBersihSemua() {
    setPilihBersih(semuaBersih ? [] : selesai.map((n) => n.id_notifikasi));
  }

  const kosong = lihatArsip
    ? { judul: "Arsip kosong", teks: "Insiden yang dibersihkan dari riwayat akan muncul di sini." }
    : saringan === "SEMUA"
      ? arsip.length > 0
        ? { judul: "Riwayat sudah bersih", teks: `${arsip.length} insiden sebelumnya tersimpan di arsip.` }
        : {
            judul: "Belum ada insiden",
            teks: "Notifikasi muncul di sini saat tongkat menekan tombol SOS atau keluar dari zona aman.",
          }
      : saringan === "AKTIF"
        ? { judul: "Tidak ada SOS menunggu", teks: "Semua insiden sudah diambil." }
        : saringan === "DITANGANI"
          ? { judul: "Tidak ada yang ditangani", teks: "Belum ada insiden yang sedang ditangani." }
          : { judul: "Belum ada yang selesai", teks: "Belum ada insiden yang ditandai selesai." };

  const pakaiCentang = (lihatArsip && isAdmin) || modePilih;

  return (
    <>
      {judul}

      <div className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="SOS aktif"
            value={jumlah.AKTIF}
            tone="danger"
            icon={<AlertTriangle size={22} strokeWidth={2.2} />}
          />
          <StatCard
            label="Selesai"
            value={jumlah.SELESAI}
            tone="success"
            icon={<Check size={22} strokeWidth={2.2} />}
          />
          <StatCard
            label="Pengiriman WhatsApp gagal"
            value={gagalKirim}
            tone="soft"
            icon={<Send size={22} strokeWidth={2.2} />}
          />
        </div>

        <div
          ref={gridRef}
          className="grid gap-5 lg:min-h-[360px] lg:grid-cols-[372px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]"
        >
          <aside
            className="flex min-h-0 flex-col rounded-card border-2 border-border bg-surface p-5"
            aria-label="Daftar insiden"
          >
            {lihatArsip ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={tutupArsip}
                    className="inline-flex h-9 items-center gap-1.5 rounded-pill px-3 text-[13px] font-bold text-primary hover:bg-surface-sunken"
                  >
                    <ArrowLeft size={16} strokeWidth={2.4} />
                    Kembali
                  </button>
                  <span className="text-[15px] font-extrabold">
                    Arsip <span className="angka text-text-secondary">{arsip.length}</span>
                  </span>
                </div>

                {isAdmin && arsip.length > 0 && (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-inner bg-surface-sunken px-4 py-2">
                    <label className="flex cursor-pointer items-center gap-2.5 text-[13px] font-semibold">
                      <input
                        type="checkbox"
                        checked={semuaTerpilih}
                        onChange={toggleSemua}
                        className="h-5 w-5 flex-none cursor-pointer accent-secondary"
                      />
                      Pilih semua
                    </label>
                    <button
                      onClick={() => pulihkanTerpilih(idTerpilih)}
                      disabled={memproses || idTerpilih.length === 0}
                      className="inline-flex h-9 items-center gap-1.5 rounded-pill bg-secondary px-4 text-[13px] font-bold text-white transition-colors disabled:opacity-40"
                    >
                      <ArchiveRestore size={15} strokeWidth={2.2} />
                      {memproses ? "Memproses…" : idTerpilih.length > 0 ? `Pulihkan ${idTerpilih.length}` : "Pulihkan"}
                    </button>
                  </div>
                )}

                {galatAksi && !pilih && (
                  <p role="alert" className="mt-3 rounded-inner bg-danger-soft px-4 py-3 text-sm text-danger-text">
                    {galatAksi}
                  </p>
                )}
              </>
            ) : modePilih ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={batalPilih}
                    className="inline-flex h-9 items-center gap-1.5 rounded-pill px-3 text-[13px] font-bold text-primary hover:bg-surface-sunken"
                  >
                    <ArrowLeft size={16} strokeWidth={2.4} />
                    Batal
                  </button>
                  <span className="text-[15px] font-extrabold">Pilih insiden selesai</span>
                </div>

                {selesai.length > 0 && (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-inner bg-surface-sunken px-4 py-2">
                    <label className="flex cursor-pointer items-center gap-2.5 text-[13px] font-semibold">
                      <input
                        type="checkbox"
                        checked={semuaBersih}
                        onChange={toggleBersihSemua}
                        className="h-5 w-5 flex-none cursor-pointer accent-secondary"
                      />
                      Pilih semua
                    </label>
                    <button
                      onClick={() => setKonfirmasiBersih(true)}
                      disabled={memproses || idBersih.length === 0}
                      className="inline-flex h-9 items-center gap-1.5 rounded-pill bg-secondary px-4 text-[13px] font-bold text-white transition-colors disabled:opacity-40"
                    >
                      <Archive size={15} strokeWidth={2.2} />
                      {idBersih.length > 0 ? `Arsipkan ${idBersih.length}` : "Arsipkan"}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(Object.keys(LABEL_SARINGAN) as Saringan[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSaringan(s)}
                    aria-pressed={saringan === s}
                    className={`flex h-9 items-center gap-1.5 rounded-pill px-4 text-[13px] transition-colors ${
                      saringan === s
                        ? "bg-secondary font-bold text-white"
                        : "bg-surface font-semibold text-text-secondary shadow-[inset_0_0_0_1.5px_var(--color-border)] hover:bg-surface-sunken"
                    }`}
                  >
                    {LABEL_SARINGAN[s]}
                    <span className="angka text-[13px] opacity-75">{jumlah[s]}</span>
                  </button>
                ))}
              </div>
            )}

            {terlihat.length === 0 ? (
              <div className="mt-4 flex min-h-[200px] flex-1 flex-col items-center justify-center gap-3 rounded-inner bg-surface-sunken px-6 py-8 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-pill bg-surface text-text-secondary">
                  <Inbox size={22} strokeWidth={2} />
                </span>
                <div>
                  <b className="block text-[15px] font-bold leading-6">
                    {modePilih ? "Belum ada yang selesai" : kosong.judul}
                  </b>
                  <p className="mt-0.5 text-sm leading-5 text-text-secondary">
                    {modePilih ? "Hanya insiden yang sudah selesai yang bisa dibersihkan." : kosong.teks}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex max-h-[520px] min-h-0 flex-col gap-2.5 overflow-y-auto lg:max-h-none lg:flex-1">
                {terlihat.map((n) => {
                  const dipilih = n.id_notifikasi === idPilih;
                  const tercentang = lihatArsip
                    ? idTerpilih.includes(n.id_notifikasi)
                    : idBersih.includes(n.id_notifikasi);
                  return (
                    <div key={n.id_notifikasi} className="flex items-center gap-2.5">
                      {pakaiCentang && (
                        <input
                          type="checkbox"
                          checked={tercentang}
                          onChange={() => (lihatArsip ? toggleSatu(n.id_notifikasi) : toggleBersihSatu(n.id_notifikasi))}
                          aria-label={`Pilih insiden ${n.kode_insiden}`}
                          className="h-5 w-5 flex-none cursor-pointer accent-secondary"
                        />
                      )}

                      <button
                        onClick={() => {
                          setIdPilih(n.id_notifikasi);
                          setGalatAksi("");
                        }}
                        aria-current={dipilih}
                        className={`flex min-w-0 flex-1 items-center gap-3 rounded-inner p-4 text-left transition-colors ${
                          dipilih
                            ? "bg-surface shadow-[inset_0_0_0_2.5px_var(--color-ring)]"
                            : "bg-surface-sunken hover:bg-primary-soft"
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 flex-none items-center justify-center rounded-pill text-[13px] font-bold ${
                            RONA_INISIAL[n.status]
                          } ${n.status === "AKTIF" ? "animate-pulse-sos" : ""}`}
                        >
                          {inisialNama(n.nama_snapshot)}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <b className="truncate font-bold leading-5">{n.nama_snapshot ?? "Nama tidak tercatat"}</b>
                            <span className="data flex-none text-[13px] text-text-secondary">
                              {jamWIB(n.occurred_at)}
                            </span>
                          </span>
                          <span className="mt-0.5 flex items-center justify-between gap-2">
                            <span className="truncate text-[13px] leading-[18px] text-text-secondary">
                              <span className="data">{n.id_perangkat ?? "—"}</span> · {waktuRelatif(n.occurred_at)}
                            </span>
                            <span
                              className={`flex-none rounded-pill px-3 py-0.5 text-[13px] font-bold ${
                                RONA_STATUS[n.status]
                              }`}
                            >
                              {n.status === "AKTIF" ? "SOS aktif" : TEKS_STATUS[n.status]}
                            </span>
                          </span>
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {!lihatArsip && !modePilih && (jumlah.SELESAI > 0 || arsip.length > 0) && (
              <div className="mt-3 flex shrink-0 gap-2 border-t border-border pt-3">
                {jumlah.SELESAI > 0 && (
                  <button
                    onClick={mulaiPilih}
                    disabled={memproses}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-input bg-surface px-4 text-sm font-bold text-text-primary shadow-[inset_0_0_0_2px_var(--color-border)] transition-colors hover:bg-surface-sunken disabled:opacity-50"
                  >
                    <Archive size={16} strokeWidth={2.2} />
                    Bersihkan riwayat
                  </button>
                )}
                {arsip.length > 0 && (
                  <button
                    onClick={bukaArsip}
                    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-input bg-surface px-4 text-sm font-bold text-text-secondary shadow-[inset_0_0_0_2px_var(--color-border)] transition-colors hover:bg-surface-sunken ${
                      jumlah.SELESAI > 0 ? "" : "flex-1"
                    }`}
                  >
                    {jumlah.SELESAI > 0 ? "Arsip" : "Lihat arsip"}
                    <span className="angka">{arsip.length}</span>
                  </button>
                )}
              </div>
            )}
          </aside>

          {pilih ? (
            <DetailInsiden
              insiden={pilih}
              idSaya={sesi?.id_admin ?? null}
              diarsipkan={pilihDiarsipkan}
              bolehPulihkan={isAdmin}
              memproses={memproses}
              galat={galatAksi}
              onTangani={() =>
                jalankan(() => api.patch(`/notifikasi/${pilih.id_notifikasi}/tangani`, {}), "Gagal mengambil insiden")
              }
              onAmbilAlih={() =>
                jalankan(
                  () => api.patch(`/notifikasi/${pilih.id_notifikasi}/ambil-alih`, {}),
                  "Gagal mengambil alih insiden"
                )
              }
              onSelesai={() =>
                jalankan(() => api.patch(`/notifikasi/${pilih.id_notifikasi}/selesai`, {}), "Gagal menandai selesai")
              }
              onKirimUlang={(idDelivery) =>
                jalankan(
                  () => api.post(`/notifikasi/delivery/${idDelivery}/kirim-ulang`, {}),
                  "Gagal menjadwalkan pengiriman ulang"
                )
              }
              onPulihkan={() => pulihkan(pilih.id_notifikasi)}
            />
          ) : (
            <section className="flex min-h-[320px] items-center justify-center rounded-card border-2 border-border bg-surface p-8 lg:min-h-0">
              <p className="max-w-sm text-center text-[15px] leading-6 text-text-secondary">
                Pilih satu insiden di sebelah kiri untuk melihat lokasi saat tombol ditekan, riwayat pengiriman
                WhatsApp, dan tindakan yang tersedia.
              </p>
            </section>
          )}
        </div>
      </div>

      {konfirmasiBersih && (
        <Modal
          judul="Bersihkan riwayat"
          onTutup={() => {
            setKonfirmasiBersih(false);
            setGalatAksi("");
          }}
        >
          <div className="flex flex-col items-center gap-5 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-pill bg-primary-soft text-primary">
              <Archive size={26} strokeWidth={2} />
            </span>

            <div>
              <p className="text-lg font-extrabold leading-7">Arsipkan {idBersih.length} insiden?</p>
              <p className="mx-auto mt-1.5 max-w-xs text-sm leading-5 text-text-secondary">
                Insiden yang dipilih pindah dari daftar ke arsip. Datanya tidak dihapus, dan Administrator bisa
                memulihkannya kapan saja.
              </p>
            </div>

            {galatAksi && (
              <p role="alert" className="w-full rounded-inner bg-danger-soft px-4 py-3 text-left text-sm text-danger-text">
                {galatAksi}
              </p>
            )}

            <div className="flex w-full gap-3">
              <Button variant="ghost" onClick={() => setKonfirmasiBersih(false)}>
                Batal
              </Button>
              <Button onClick={() => bersihkan(idBersih)} disabled={memproses || idBersih.length === 0} className="flex-1">
                {memproses ? "Memproses…" : "Arsipkan"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}