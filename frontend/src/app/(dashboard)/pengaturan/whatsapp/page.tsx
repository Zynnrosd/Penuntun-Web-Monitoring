"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { api } from "@/lib/api-client";
import type { Notifikasi } from "@/types";

export default function PengaturanWhatsAppPage() {
  const [nomor, setNomor] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sukses, setSukses] = useState("");
  const [riwayat, setRiwayat] = useState<Notifikasi[]>([]);

  useEffect(() => {
    api
      .get<{ no_wa: string | null }>("/pengaturan/whatsapp")
      .then((res) => setNomor(res.no_wa ?? ""))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    api
      .get<Notifikasi[]>("/notifikasi")
      .then((res) => setRiwayat(res.filter((n) => n.notifikasi_delivery && n.notifikasi_delivery.length > 0).slice(0, 5)))
      .catch(() => {});
  }, []);

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSukses("");
    setSaving(true);
    try {
      await api.patch("/pengaturan/whatsapp", { no_wa: nomor });
      setSukses("Nomor WhatsApp berhasil disimpan");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-text-secondary">Memuat data...</p>;

  return (
    <div>
      <PageHeader title="Konfigurasi Notifikasi" subtitle="Atur nomor WhatsApp tujuan notifikasi darurat" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-card bg-surface p-6 shadow-card lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Nomor Tujuan</h2>

          {error && <div className="mb-4 rounded-input bg-danger-soft px-3 py-2 text-sm text-danger">{error}</div>}
          {sukses && <div className="mb-4 rounded-input bg-success-soft px-3 py-2 text-sm text-success">{sukses}</div>}

          <form onSubmit={simpan} className="max-w-md">
            <label className="mb-1 block text-sm font-medium text-text-secondary">Nomor WhatsApp</label>
            <input
              type="text"
              required
              value={nomor}
              onChange={(e) => setNomor(e.target.value)}
              placeholder="+6281234567890"
              className="mb-2 w-full rounded-input border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <p className="mb-6 text-xs text-text-secondary">Format: diawali +62, diikuti 9–13 digit angka.</p>

            <button
              type="submit"
              disabled={saving}
              className="rounded-input bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan perubahan"}
            </button>
          </form>
        </div>

        <div className="rounded-card bg-surface p-6 shadow-card">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-secondary">Riwayat Pengiriman</h3>

          {riwayat.length === 0 ? (
            <p className="text-sm text-text-secondary">Belum ada notifikasi yang pernah dikirim.</p>
          ) : (
            <div className="space-y-3">
              {riwayat.map((n) => {
                const delivery = n.notifikasi_delivery?.[0];
                const terkirim = delivery?.status === "SENT";
                return (
                  <div key={n.id_notifikasi} className="flex items-start gap-3">
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                        terkirim ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
                      }`}
                    >
                      {terkirim ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                    </div>
                    <div className="text-sm">
                      <div className="font-medium text-text-primary">{n.kode_insiden}</div>
                      <div className="flex items-center gap-1 text-xs text-text-secondary">
                        <Clock size={11} />
                        {delivery?.sent_at ? new Date(delivery.sent_at).toLocaleString("id-ID") : "-"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}