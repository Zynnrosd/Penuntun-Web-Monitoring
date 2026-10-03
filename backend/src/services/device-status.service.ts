// backend/src/services/device-status.service.ts

import { supabase } from "../lib/supabase";


// =========================================================
// CONFIG
// =========================================================

// Jika tidak ada heartbeat / aktivitas selama 20 detik,
// perangkat dianggap OFFLINE.
const OFFLINE_TIMEOUT_MS =
  20_000;


// Backend mengecek setiap 1 detik.
const CHECK_INTERVAL_MS =
  1_000;


let interval:
  NodeJS.Timeout | null =
  null;


// =========================================================
// CEK PERANGKAT OFFLINE
// =========================================================

async function cekPerangkatOffline() {

  try {

    const batasWaktu =
      new Date(
        Date.now()
        - OFFLINE_TIMEOUT_MS
      ).toISOString();


    const {
      data,
      error,
    } = await supabase
      .from("perangkat")
      .update({
        status_online:
          false,
      })

      // Hanya perangkat yang sekarang online
      .eq(
        "status_online",
        true
      )

      // last_active lebih lama dari 20 detik
      .lt(
        "last_active",
        batasWaktu
      )

      .select(
        "id_perangkat"
      );


    if (error) {

      console.error(
        "[DEVICE MONITOR] Gagal mengecek perangkat:",
        error.message
      );

      return;
    }


    if (
      data &&
      data.length > 0
    ) {

      for (
        const perangkat
        of data
      ) {

        console.log(
          `[DEVICE MONITOR] ${perangkat.id_perangkat} → OFFLINE`
        );

      }
    }


  } catch (error) {

    console.error(
      "[DEVICE MONITOR] Error:",
      error instanceof Error
        ? error.message
        : error
    );

  }
}


// =========================================================
// START DEVICE MONITOR
// =========================================================

export function startDeviceStatusMonitor() {

  if (interval) {
    return;
  }


  console.log(
    "[DEVICE MONITOR] Aktif — timeout offline: 20 detik"
  );


  // Jalankan sekali saat backend start.
  cekPerangkatOffline();


  // Lalu cek terus setiap 1 detik.
  interval = setInterval(
    () => {
      cekPerangkatOffline();
    },
    CHECK_INTERVAL_MS
  );
}