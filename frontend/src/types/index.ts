export type Perangkat = {
  id_perangkat: string;
  id_yayasan: string;
  dipakai_oleh: string | null;
  lat_terakhir: number | null;
  long_terakhir: number | null;
  lokasi_terakhir: string | null;
  baterai_terakhir: number | null;
  status_online: boolean;
  status_sos: boolean;
  last_active: string | null;
};

export type PenggunaTunanetra = {
  id_tunanetra: string;
  id_yayasan: string;
  nama_tunanetra: string;
  alamat: string | null;
};

export type NotifikasiDelivery = {
  status: "SENT" | "FAILED";
  sent_at: string;
};

export type Notifikasi = {
  id_notifikasi: number;
  id_perangkat: string;
  kode_insiden: string;
  nama_snapshot: string | null;
  tipe_event: "SOS" | "GEOFENCE";
  status: "AKTIF" | "SELESAI";
  prioritas: "RENDAH" | "SEDANG" | "TINGGI";
  deskripsi: string | null;
  latitude_sos: number | null;
  longitude_sos: number | null;
  lokasi_sos: string | null;
  occurred_at: string;
  notifikasi_delivery?: NotifikasiDelivery[];
};

export type Geofence = {
  id_geofence: number;
  id_perangkat: string;
  nama_area: string;
  center_lat: number;
  center_long: number;
  radius_meter: number;
  is_active: boolean;
};