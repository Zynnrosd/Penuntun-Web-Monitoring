import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();


// =========================================================
// UPDATE GPS DARI BROWSER / HP
// POST /gps/:id/update
// =========================================================

router.post(
  "/:id/update",
  async (req, res) => {
    try {
      const idPerangkat =
        req.params.id;

      const {
        latitude,
        longitude,
        accuracy,
        recorded_at,
      } = req.body;


      // ===================================================
      // VALIDASI
      // ===================================================

      if (
        typeof latitude !== "number" ||
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90
      ) {
        return res.status(400).json({
          message:
            "Latitude tidak valid.",
        });
      }


      if (
        typeof longitude !== "number" ||
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180
      ) {
        return res.status(400).json({
          message:
            "Longitude tidak valid.",
        });
      }


      // ===================================================
      // CEK PERANGKAT
      // ===================================================

      const {
        data: perangkat,
        error: cekError,
      } = await supabase
        .from("perangkat")
        .select(
          "id_perangkat"
        )
        .eq(
          "id_perangkat",
          idPerangkat
        )
        .maybeSingle();


      if (cekError) {
        console.error(
          "[GPS] Gagal cek perangkat:",
          cekError
        );

        return res.status(500).json({
          message:
            "Gagal memeriksa perangkat.",
        });
      }


      if (!perangkat) {
        return res.status(404).json({
          message:
            "Perangkat tidak ditemukan.",
        });
      }


      // ===================================================
      // UPDATE POSISI TERAKHIR
      // ===================================================

      const {
        error: updateError,
      } = await supabase
        .from("perangkat")
        .update({
          lat_terakhir:
            latitude,

          long_terakhir:
            longitude,
        })
        .eq(
          "id_perangkat",
          idPerangkat
        );


      if (updateError) {
        console.error(
          "[GPS] Gagal update perangkat:",
          updateError
        );

        return res.status(500).json({
          message:
            "Gagal memperbarui lokasi perangkat.",
        });
      }


      // ===================================================
      // SIMPAN RIWAYAT
      // ===================================================

      const trackingPayload: {
        id_perangkat: string;
        latitude: number;
        longitude: number;
        baterai: null;
        recorded_at?: string;
      } = {
        id_perangkat:
          idPerangkat,

        latitude,

        longitude,

        baterai:
          null,
      };


      if (
        typeof recorded_at === "string" &&
        recorded_at.length > 0
      ) {
        trackingPayload.recorded_at =
          recorded_at;
      }


      const {
        error: trackingError,
      } = await supabase
        .from("tracking_data")
        .insert(
          trackingPayload
        );


      if (trackingError) {
        console.error(
          "[GPS] Gagal menyimpan tracking:",
          trackingError
        );

        return res.status(500).json({
          message:
            "Lokasi diperbarui tetapi riwayat gagal disimpan.",
        });
      }


      // ===================================================
      // LOG
      // ===================================================

      console.log("");
      console.log(
        "========================================"
      );

      console.log(
        "[GPS BROWSER]"
      );

      console.log(
        "========================================"
      );

      console.log(
        `Perangkat : ${idPerangkat}`
      );

      console.log(
        `Latitude  : ${latitude}`
      );

      console.log(
        `Longitude : ${longitude}`
      );


      if (
        typeof accuracy === "number"
      ) {
        console.log(
          `Akurasi   : ±${accuracy.toFixed(1)} m`
        );
      }


      console.log(
        "========================================"
      );


      // ===================================================
      // RESPONSE
      // ===================================================

      return res.json({
        success: true,

        message:
          "Lokasi berhasil diperbarui.",

        data: {
          id_perangkat:
            idPerangkat,

          latitude,

          longitude,

          accuracy:
            typeof accuracy === "number"
              ? accuracy
              : null,
        },
      });

    } catch (error) {
      console.error(
        "[GPS] Error:",
        error
      );


      return res.status(500).json({
        message:
          "Terjadi kesalahan saat memproses GPS.",
      });
    }
  }
);


export default router;