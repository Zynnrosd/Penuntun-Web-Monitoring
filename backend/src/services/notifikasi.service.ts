import { supabase } from "../lib/supabase";
import { kirimNotifikasiWhatsApp } from "./whatsapp.service";

export async function buatNotifikasiDarurat(params: {
  id_perangkat: string;
  tipe_event: "SOS" | "GEOFENCE";
  deskripsi: string;
  latitude_sos?: number | null;
  longitude_sos?: number | null;
}) {
  const kode_insiden = `${params.tipe_event}-${Date.now()}`;

  const { data: notif, error } = await supabase
    .from("notifikasi")
    .insert({
      id_perangkat: params.id_perangkat,
      kode_insiden,
      tipe_event: params.tipe_event,
      deskripsi: params.deskripsi,
      latitude_sos: params.latitude_sos ?? null,
      longitude_sos: params.longitude_sos ?? null,
      status: "AKTIF",
    })
    .select()
    .single();

  if (error || !notif) throw new Error(error?.message ?? "Gagal membuat notifikasi");

  const { data: perangkat } = await supabase.from("perangkat").select("id_yayasan").eq("id_perangkat", params.id_perangkat).single();
  const { data: admin } = await supabase.from("administrators").select("no_wa").eq("id_yayasan", perangkat?.id_yayasan).limit(1).single();

  const statusKirim = admin?.no_wa ? await kirimNotifikasiWhatsApp(admin.no_wa, params.deskripsi) : "FAILED";
  await supabase.from("notifikasi_delivery").insert({ id_notifikasi: notif.id_notifikasi, status: statusKirim });

  return notif;
}