// frontend/src/types/index.ts

export type Perangkat = {
  id_perangkat: string;
  id_yayasan: string;
  dipakai_oleh: string | null;
  dipasang_oleh: string | null;
  dipasang_pada: string | null;
  lat_terakhir: number | null;
  long_terakhir: number | null;
  lokasi_terakhir: string | null;
  baterai_terakhir: number | null;
  status_online: boolean;
  status_sos: boolean;
  last_active: string | null;
  pengguna?: { nama_tunanetra: string } | null;
};

export type PenggunaTunanetra = {
  id_tunanetra: string;
  id_yayasan: string;
  nama_tunanetra: string;
  alamat: string | null;
  created_at: string;
};

export type NotifikasiDelivery = {
  id_delivery: number;
  status: "PENDING" | "SENT" | "FAILED";
  attempt_no: number;
  sent_at: string | null;
};

export type Notifikasi = {
  id_notifikasi: number;
  id_yayasan: string;
  id_perangkat: string | null;
  kode_insiden: string;
  nama_snapshot: string | null;
  tipe_event: "SOS" | "GEOFENCE";
  status: "AKTIF" | "DITANGANI" | "SELESAI";
  ditangani_oleh: string | null;
  ditangani_pada: string | null;
  prioritas: string | null;
  deskripsi: string | null;
  latitude_sos: number | null;
  longitude_sos: number | null;
  lokasi_sos: string | null;
  occurred_at: string;
  notifikasi_delivery?: NotifikasiDelivery[];
  penangan?: { nama_staf: string } | null;
};

export type Geofence = {
  id_geofence: number;
  id_yayasan: string;
  id_perangkat: string | null;
  nama_area: string | null;
  center_lat: number;
  center_long: number;
  radius_meter: number;
  is_active: boolean;
};