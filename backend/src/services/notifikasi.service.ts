// backend/src/services/notifikasi.service.ts

import { supabase } from "../lib/supabase";
import { kirimNotifikasiWhatsApp } from "./whatsapp.service";

type Kejadian = {
  id_perangkat: string;
  tipe_event: "SOS" | "GEOFENCE";
  deskripsi: string;
  latitude_sos?: number | null;
  longitude_sos?: number | null;
};

export async function buatNotifikasiDarurat(params: Kejadian) {
  const { data: perangkat, error: galatPerangkat } = await supabase
    .from("perangkat")
    .select("id_yayasan, dipakai_oleh, pengguna:pengguna_tunanetra!perangkat_pemakai_fk(nama_tunanetra)")
    .eq("id_perangkat", params.id_perangkat)
    .maybeSingle();

  if (galatPerangkat) throw new Error(`Gagal membaca perangkat: ${galatPerangkat.message}`);
  if (!perangkat) throw new Error(`Perangkat ${params.id_perangkat} tidak terdaftar`);

  const pengguna = perangkat.pengguna as unknown as { nama_tunanetra: string } | null;

  const { data: notif, error } = await supabase
    .from("notifikasi")
    .insert({
      id_yayasan: perangkat.id_yayasan,
      id_perangkat: params.id_perangkat,
      nama_snapshot: pengguna?.nama_tunanetra ?? null,
      tipe_event: params.tipe_event,
      deskripsi: params.deskripsi,
      latitude_sos: params.latitude_sos ?? null,
      longitude_sos: params.longitude_sos ?? null,
    })
    .select("id_notifikasi, id_yayasan, kode_insiden, tipe_event, status, occurred_at")
    .single();

  if (error || !notif) throw new Error(`Gagal membuat notifikasi: ${error?.message ?? "tidak diketahui"}`);

  await antreanWhatsApp(notif.id_notifikasi, notif.id_yayasan, params.deskripsi);

  return notif;
}

async function antreanWhatsApp(idNotifikasi: number, idYayasan: string, pesan: string) {
  const { data: penerima, error } = await supabase
    .from("administrators")
    .select("id_admin, no_wa")
    .eq("id_yayasan", idYayasan)
    .eq("status", "AKTIF")
    .not("no_wa", "is", null);

  if (error) {
    console.error("[NOTIFIKASI] Gagal membaca penerima WhatsApp:", error.message);
    return;
  }
  if (!penerima?.length) {
    console.warn(`[NOTIFIKASI] Yayasan ${idYayasan} belum punya nomor WhatsApp tujuan.`);
    return;
  }

  for (const admin of penerima) {
    const status = await kirimNotifikasiWhatsApp(admin.no_wa as string, pesan);

    const { error: galatCatat } = await supabase.from("notifikasi_delivery").insert({
      id_yayasan: idYayasan,
      id_notifikasi: idNotifikasi,
      id_admin: admin.id_admin,
      status,
      attempt_no: 1,
      sent_at: status === "SENT" ? new Date().toISOString() : null,
    });

    if (galatCatat) {
      console.error("[NOTIFIKASI] Gagal mencatat pengiriman:", galatCatat.message);
    }
  }
}