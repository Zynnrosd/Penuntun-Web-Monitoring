// backend/src/services/whatsapp.service.ts

import { env } from "../config/env";
import { supabase } from "../lib/supabase";

const FONNTE_URL = "https://api.fonnte.com/send";
const JEDA_PENGIRIM_MS = 15_000;

type Insiden = {
  tipe_event: "SOS" | "GEOFENCE";
  id_perangkat: string | null;
  deskripsi: string | null;
  latitude_sos?: number | null;
  longitude_sos?: number | null;
};

// Fonnte membalas HTTP 200 meskipun pengiriman ditolak, jadi hasilnya dibaca dari `status` di badan respons.
export async function kirimNotifikasiWhatsApp(nomorTujuan: string, pesan: string): Promise<"SENT" | "FAILED"> {
  if (!env.WHATSAPP_GATEWAY_API_KEY) {
    console.error("[WHATSAPP] WHATSAPP_GATEWAY_API_KEY belum diisi, pesan tidak dikirim.");
    return "FAILED";
  }

  try {
    const res = await fetch(FONNTE_URL, {
      method: "POST",
      headers: {
        Authorization: env.WHATSAPP_GATEWAY_API_KEY,
        "Content-Type": "application/json",
      },
      // Nomor tersimpan sebagai +62..., Fonnte meminta tanpa tanda plus.
      body: JSON.stringify({ target: nomorTujuan.replace(/^\+/, ""), message: pesan }),
      signal: AbortSignal.timeout(10_000),
    });

    const hasil = (await res.json().catch(() => null)) as { status?: boolean; reason?: string } | null;

    if (res.ok && hasil?.status === true) return "SENT";

    console.error(`[WHATSAPP] Pengiriman ditolak: ${hasil?.reason ?? `HTTP ${res.status}`}`);
    return "FAILED";
  } catch (error) {
    console.error("[WHATSAPP] Gagal menghubungi gateway:", error instanceof Error ? error.message : error);
    return "FAILED";
  }
}

// Pesan harus bisa dipakai tanpa membuka dashboard: siapa, perangkat mana, dan di mana.
export function susunPesanInsiden(insiden: Insiden, kodeInsiden: string, namaPengguna?: string | null) {
  const judul = insiden.tipe_event === "SOS" ? "SOS" : "KELUAR ZONA AMAN";
  const baris = [
    `[PENUNTUN] ${judul}`,
    `Pengguna: ${namaPengguna ?? "tidak tercatat"}`,
    `Perangkat: ${insiden.id_perangkat ?? "tidak tercatat"}`,
    `Kode insiden: ${kodeInsiden}`,
  ];

  if (insiden.deskripsi) baris.push(insiden.deskripsi);

  if (insiden.latitude_sos != null && insiden.longitude_sos != null) {
    const { latitude_sos: lat, longitude_sos: lng } = insiden;
    baris.push(`Lokasi: https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`);
  }

  return baris.join("\n");
}

// Tombol "kirim ulang" di dashboard hanya membuat baris PENDING di notifikasi_delivery.
// Pengirim ini yang benar-benar mengirimnya, lalu mengubah statusnya menjadi SENT atau FAILED.
type BarisPending = {
  id_delivery: number;
  notifikasi: (Insiden & { kode_insiden: string; nama_snapshot: string | null }) | null;
  admin: { no_wa: string | null } | null;
};

// Mencegah dua putaran pengiriman berjalan bersamaan.
let sedangMengirim = false;
let timer: NodeJS.Timeout | null = null;

async function kirimYangMenunggu() {
  if (sedangMengirim) return;
  sedangMengirim = true;

  try {
    const { data, error } = await supabase
      .from("notifikasi_delivery")
      .select(
        "id_delivery, notifikasi:notifikasi(tipe_event, id_perangkat, deskripsi, latitude_sos, longitude_sos, kode_insiden, nama_snapshot), admin:administrators(no_wa)"
      )
      .eq("status", "PENDING")
      .order("id_delivery", { ascending: true })
      .limit(10);

    if (error) {
      console.error("[WHATSAPP] Gagal membaca antrean:", error.message);
      return;
    }

    for (const baris of (data ?? []) as unknown as BarisPending[]) {
      const nomor = baris.admin?.no_wa;
      const insiden = baris.notifikasi;

      let status: "SENT" | "FAILED" = "FAILED";
      if (nomor && insiden) {
        status = await kirimNotifikasiWhatsApp(
          nomor,
          susunPesanInsiden(insiden, insiden.kode_insiden, insiden.nama_snapshot)
        );
      }

      const { error: galatUbah } = await supabase
        .from("notifikasi_delivery")
        .update({ status, sent_at: status === "SENT" ? new Date().toISOString() : null })
        .eq("id_delivery", baris.id_delivery);

      if (galatUbah) console.error("[WHATSAPP] Gagal memperbarui status pengiriman:", galatUbah.message);
    }
  } finally {
    sedangMengirim = false;
  }
}

export function mulaiPengirimWhatsApp() {
  if (timer) return;
  kirimYangMenunggu();
  timer = setInterval(kirimYangMenunggu, JEDA_PENGIRIM_MS);
}