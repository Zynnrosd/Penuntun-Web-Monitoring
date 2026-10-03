"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Search, Trash2, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/api-client";
import type { Perangkat, PenggunaTunanetra, Geofence } from "@/types";

const GeofenceMapPicker = dynamic(
  () => import("@/components/map/GeofenceMapPicker").then((m) => m.GeofenceMapPicker),
  { ssr: false }
);

function inisial(nama: string) {
  return nama.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}

export default function PerangkatPage() {
  const [data, setData] = useState<Perangkat[]>([]);
  const [pengguna, setPengguna] = useState<PenggunaTunanetra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalTambah, setModalTambah] = useState(false);
  const [idBaru, setIdBaru] = useState("");
  const [formError, setFormError] = useState("");
  const [hapusTarget, setHapusTarget] = useState<Perangkat | null>(null);

  // state modal geofence
  const [geofenceTarget, setGeofenceTarget] = useState<Perangkat | null>(null);
  const [geofenceLoading, setGeofenceLoading] = useState(false);
  const [geofenceError, setGeofenceError] = useState("");
  const [namaArea, setNamaArea] = useState("");
  const [titikPusat, setTitikPusat] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(300);
  const [geofenceAda, setGeofenceAda] = useState(false);

  function muat() {
    setLoading(true);
    Promise.all([api.get<Perangkat[]>("/perangkat"), api.get<PenggunaTunanetra[]>("/pengguna")])
      .then(([p, u]) => {
        setData(p);
        setPengguna(u);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(muat, []);

  async function tambahPerangkat(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    try {
      await api.post("/perangkat", { id_perangkat: idBaru });
      setModalTambah(false);
      setIdBaru("");
      muat();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menambah perangkat");
    }
  }

  async function ubahPairing(idPerangkat: string, dipakaiOleh: string) {
    try {
      await api.patch(`/perangkat/${idPerangkat}/pairing`, { dipakai_oleh: dipakaiOleh || null });
      muat();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengubah pairing");
    }
  }

  async function konfirmasiHapus() {
    if (!hapusTarget) return;
    try {
      await api.delete(`/perangkat/${hapusTarget.id_perangkat}`);
      setHapusTarget(null);
      muat();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus");
      setHapusTarget(null);
    }
  }

  function bukaGeofence(p: Perangkat) {
    setGeofenceTarget(p);
    setGeofenceError("");
    setNamaArea("");
    setTitikPusat(null);
    setRadius(300);
    setGeofenceAda(false);
    setGeofenceLoading(true);

    api
      .get<Geofence | null>(`/geofence/${p.id_perangkat}`)
      .then((g) => {
        if (g) {
          setNamaArea(g.nama_area);
          setTitikPusat({ lat: g.center_lat, lng: g.center_long });
          setRadius(g.radius_meter);
          setGeofenceAda(true);
        } else if (p.lat_terakhir && p.long_terakhir) {
          setTitikPusat({ lat: p.lat_terakhir, lng: p.long_terakhir });
        }
      })
      .catch((e) => setGeofenceError(e.message))
      .finally(() => setGeofenceLoading(false));
  }

  async function simpanGeofence(e: React.FormEvent) {
    e.preventDefault();
    if (!geofenceTarget) return;
    setGeofenceError("");

    if (!titikPusat) {
      setGeofenceError("Klik di peta untuk menentukan titik pusat zona aman");
      return;
    }

    try {
      await api.put(`/geofence/${geofenceTarget.id_perangkat}`, {
        nama_area: namaArea,
        center_lat: titikPusat.lat,
        center_long: titikPusat.lng,
        radius_meter: radius,
      });
      setGeofenceTarget(null);
    } catch (err) {
      setGeofenceError(err instanceof Error ? err.message : "Gagal menyimpan zona aman");
    }
  }

  async function hapusGeofence() {
    if (!geofenceTarget) return;
    try {
      await api.delete(`/geofence/${geofenceTarget.id_perangkat}`);
      setGeofenceTarget(null);
    } catch (err) {
      setGeofenceError(err instanceof Error ? err.message : "Gagal menghapus zona aman");
    }
  }

  if (loading) return <p className="text-text-secondary">Memuat data...</p>;
  if (error) return <p className="text-danger">Gagal memuat: {error}</p>;

  function namaPengguna(id: string | null) {
    return pengguna.find((u) => u.id_tunanetra === id)?.nama_tunanetra ?? null;
  }

  return (
    <div>
      <PageHeader title="Manajemen Perangkat" subtitle="Kelola data perangkat, pairing, dan zona aman" />

      <div className="mb-6 grid grid-cols-2 gap-4">
        <StatCard label="Total Perangkat" value={data.length} tone="primary" suffix="Terhubung" />
        <StatCard label="Total Pengguna Terpasang" value={data.filter((d) => d.dipakai_oleh).length} tone="success" suffix="Pengguna" />
      </div>

      <div className="rounded-card bg-surface p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Manajemen Perangkat & Pengguna</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input placeholder="Cari Pengguna" className="rounded-pill border border-border py-2 pl-9 pr-3 text-sm" />
            </div>
            <button
              onClick={() => {
                setIdBaru("");
                setFormError("");
                setModalTambah(true);
              }}
              className="rounded-input bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
            >
              + Tambah Perangkat
            </button>
          </div>
        </div>

        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-secondary">Belum ada perangkat terdaftar.</p>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-text-secondary">
              <tr className="border-b border-border">
                <th className="py-3 pr-3">No.</th>
                <th className="py-3 pr-3">Pemakai Aktif</th>
                <th className="py-3 pr-3">ID Perangkat</th>
                <th className="py-3 pr-3">Status</th>
                <th className="py-3 pr-3">Aksi Langsung</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => {
                const nama = namaPengguna(d.dipakai_oleh);
                return (
                  <tr key={d.id_perangkat} className="border-b border-border">
                    <td className="py-3 pr-3 text-text-secondary">{i + 1}.</td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        {nama && (
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                            {inisial(nama)}
                          </span>
                        )}
                        <select
                          value={d.dipakai_oleh ?? ""}
                          onChange={(e) => ubahPairing(d.id_perangkat, e.target.value)}
                          className="rounded-input border border-border px-2 py-1 text-sm"
                        >
                          <option value="">— Tidak terpasang —</option>
                          {pengguna
                            .filter((u) => {
                              const sudahDipakaiDiLain = data.some(
                                (p) => p.dipakai_oleh === u.id_tunanetra && p.id_perangkat !== d.id_perangkat
                              );
                              return !sudahDipakaiDiLain;
                            })
                            .map((u) => (
                              <option key={u.id_tunanetra} value={u.id_tunanetra}>
                                {u.nama_tunanetra}
                              </option>
                            ))}
                        </select>
                      </div>
                    </td>
                    <td className="py-3 pr-3 font-mono text-text-primary">{d.id_perangkat}</td>
                    <td className="py-3 pr-3 text-text-secondary">{d.status_online ? "Online" : "Offline"}</td>
                    <td className="py-3 pr-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => bukaGeofence(d)}
                          title="Atur zona aman"
                          className="text-text-secondary hover:text-primary"
                        >
                          <ShieldCheck size={16} />
                        </button>
                        <button onClick={() => setHapusTarget(d)} className="text-text-secondary hover:text-danger">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {modalTambah && (
        <Modal title="Tambah Perangkat" onClose={() => setModalTambah(false)}>
          <form onSubmit={tambahPerangkat}>
            {formError && <div className="mb-3 rounded-input bg-danger-soft px-3 py-2 text-sm text-danger">{formError}</div>}
            <label className="mb-1 block text-sm font-medium text-text-secondary">Serial Number / ID Perangkat</label>
            <input
              required
              value={idBaru}
              onChange={(e) => setIdBaru(e.target.value)}
              placeholder="PNT-003"
              className="mb-6 w-full rounded-input border border-border px-3 py-2 text-sm font-mono"
            />
            <button type="submit" className="w-full rounded-input bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">
              Tambah
            </button>
          </form>
        </Modal>
      )}

      {hapusTarget && (
        <Modal title="Hapus Perangkat" onClose={() => setHapusTarget(null)}>
          <p className="mb-6 text-sm text-text-secondary">
            Yakin ingin menghapus perangkat <strong>{hapusTarget.id_perangkat}</strong>?
          </p>
          <div className="flex gap-2">
            <button onClick={() => setHapusTarget(null)} className="flex-1 rounded-input border border-border-strong px-4 py-2 text-sm hover:bg-surface-sunken">
              Batal
            </button>
            <button onClick={konfirmasiHapus} className="flex-1 rounded-input bg-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              Hapus
            </button>
          </div>
        </Modal>
      )}

      {geofenceTarget && (
        <Modal title={`Zona Aman — ${geofenceTarget.id_perangkat}`} onClose={() => setGeofenceTarget(null)}>
          {geofenceLoading ? (
            <p className="text-sm text-text-secondary">Memuat...</p>
          ) : (
            <form onSubmit={simpanGeofence}>
              {geofenceError && <div className="mb-3 rounded-input bg-danger-soft px-3 py-2 text-sm text-danger">{geofenceError}</div>}

              <p className="mb-3 text-xs text-text-secondary">Klik di peta untuk menentukan titik pusat zona aman.</p>
              <div className="mb-4 h-56 overflow-hidden rounded-map">
                <GeofenceMapPicker
                  center={titikPusat}
                  radius={radius}
                  onPick={(lat, lng) => setTitikPusat({ lat, lng })}
                />
              </div>

              <label className="mb-1 block text-sm font-medium text-text-secondary">Nama Area</label>
              <input
                required
                value={namaArea}
                onChange={(e) => setNamaArea(e.target.value)}
                placeholder="Rumah, Panti, Sekolah"
                className="mb-4 w-full rounded-input border border-border px-3 py-2 text-sm"
              />

              <label className="mb-1 block text-sm font-medium text-text-secondary">Radius (meter)</label>
              <input
                type="number"
                min={10}
                required
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="mb-6 w-full rounded-input border border-border px-3 py-2 text-sm"
              />

              <div className="flex gap-2">
                <button type="submit" className="flex-1 rounded-input bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">
                  Simpan Zona Aman
                </button>
                {geofenceAda && (
                  <button type="button" onClick={hapusGeofence} className="rounded-input border border-danger px-4 py-2 text-sm font-medium text-danger hover:bg-danger-soft">
                    Hapus
                  </button>
                )}
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}