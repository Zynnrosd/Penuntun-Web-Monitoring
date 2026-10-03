"use client";

import dynamic from "next/dynamic";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  BatteryMedium,
  Clock3,
  MapPin,
  Navigation,
  NavigationOff,
  Wifi,
  WifiOff,
} from "lucide-react";

import { api } from "@/lib/api-client";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";

import type {
  Perangkat,
  PenggunaTunanetra,
} from "@/types";


const MapView = dynamic(
  () =>
    import("@/components/map/MapView").then(
      (m) => m.MapView
    ),
  {
    ssr: false,
  }
);


// =========================================================
// TYPES
// =========================================================

type TrackPoint = {
  id_tracking: number;

  latitude: number;
  longitude: number;

  baterai: number | null;

  recorded_at: string;
};


// =========================================================
// CONFIG GPS
// =========================================================

// Browser bisa menghasilkan update sangat cepat.
// Kita kirim ke backend maksimal sekitar 1x / 3 detik.
const GPS_SEND_INTERVAL_MS =
  3000;


// =========================================================
// PAGE
// =========================================================

export default function MonitoringDetailPage() {

  const {
    id,
  } = useParams<{
    id: string;
  }>();


  const router =
    useRouter();


  // =======================================================
  // DEVICE DATA
  // =======================================================

  const [
    perangkat,
    setPerangkat,
  ] = useState<Perangkat | null>(
    null
  );


  const [
    pengguna,
    setPengguna,
  ] = useState<
    PenggunaTunanetra[]
  >([]);


  const [
    riwayat,
    setRiwayat,
  ] = useState<
    TrackPoint[] | null
  >(null);


  const [
    loadingRiwayat,
    setLoadingRiwayat,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  // =======================================================
  // GPS STATE
  // =======================================================

  const [
    gpsAktif,
    setGpsAktif,
  ] = useState(false);


  const [
    gpsError,
    setGpsError,
  ] = useState("");


  const [
    gpsAccuracy,
    setGpsAccuracy,
  ] = useState<
    number | null
  >(null);


  const [
    gpsLastUpdate,
    setGpsLastUpdate,
  ] = useState<
    Date | null
  >(null);


  const [
    gpsMengirim,
    setGpsMengirim,
  ] = useState(false);


  const watchIdRef =
    useRef<number | null>(
      null
    );


  const lastSentRef =
    useRef(0);


  const sendingRef =
    useRef(false);


  // =======================================================
  // LOAD DEVICE
  // =======================================================

  const muatPerangkat =
    useCallback(
      async () => {

        try {

          const [
            list,
            userList,
          ] =
            await Promise.all([
              api.get<
                Perangkat[]
              >(
                "/perangkat"
              ),

              api
                .get<
                  PenggunaTunanetra[]
                >(
                  "/pengguna"
                )
                .catch(
                  () => []
                ),
            ]);


          const found =
            list.find(
              (p) =>
                p.id_perangkat ===
                id
            );


          if (!found) {

            setError(
              "Perangkat tidak ditemukan"
            );

            return;
          }


          setPerangkat(
            found
          );


          setPengguna(
            userList
          );


          setError("");

        } catch (err) {

          setError(
            err instanceof Error
              ? err.message
              : "Gagal memuat perangkat"
          );

        }

      },
      [
        id,
      ]
    );


  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(
    () => {
      muatPerangkat();
    },
    [
      muatPerangkat,
    ]
  );


  // =======================================================
  // REALTIME DEVICE
  // =======================================================

  useRealtimeTable(
    "perangkat",
    muatPerangkat
  );


  // =======================================================
  // CLEANUP GPS
  // =======================================================

  useEffect(
    () => {

      return () => {

        if (
          watchIdRef.current !==
          null
        ) {

          navigator.geolocation
            ?.clearWatch(
              watchIdRef.current
            );

        }

      };

    },
    []
  );


  // =======================================================
  // SEND GPS TO BACKEND
  // =======================================================

  const kirimLokasi =
    useCallback(
      async (
        position:
          GeolocationPosition
      ) => {

        const {
          latitude,
          longitude,
          accuracy,
        } =
          position.coords;


        // Update tampilan lokal langsung.
        setGpsAccuracy(
          accuracy
        );


        setGpsLastUpdate(
          new Date(
            position.timestamp
          )
        );


        setPerangkat(
          (current) => {

            if (!current) {
              return current;
            }


            return {
              ...current,

              lat_terakhir:
                latitude,

              long_terakhir:
                longitude,
            };

          }
        );


        // ===============================================
        // THROTTLE
        // ===============================================

        const now =
          Date.now();


        if (
          now -
            lastSentRef.current
          <
          GPS_SEND_INTERVAL_MS
        ) {
          return;
        }


        if (
          sendingRef.current
        ) {
          return;
        }


        lastSentRef.current =
          now;


        sendingRef.current =
          true;


        setGpsMengirim(
          true
        );


        try {

          /*
           * Endpoint backend yang akan kita buat:
           *
           * POST /gps/PNT-A02/update
           */

          await api.post(
            `/gps/${encodeURIComponent(
              id
            )}/update`,

            {
              latitude,
              longitude,

              accuracy,

              recorded_at:
                new Date(
                  position.timestamp
                ).toISOString(),
            }
          );


          setGpsError("");


        } catch (err) {

          setGpsError(
            err instanceof Error
              ? err.message
              : "Gagal mengirim lokasi ke server"
          );


        } finally {

          sendingRef.current =
            false;


          setGpsMengirim(
            false
          );

        }

      },
      [
        id,
      ]
    );


  // =======================================================
  // GEOLOCATION ERROR
  // =======================================================

  function handleGpsError(
    gpsPositionError:
      GeolocationPositionError
  ) {

    switch (
      gpsPositionError.code
    ) {

      case 1:

        setGpsError(
          "Izin lokasi ditolak. Izinkan akses lokasi pada browser HP."
        );

        break;


      case 2:

        setGpsError(
          "Lokasi HP belum dapat ditentukan."
        );

        break;


      case 3:

        setGpsError(
          "Permintaan GPS terlalu lama. Coba lagi."
        );

        break;


      default:

        setGpsError(
          gpsPositionError.message ||
          "Terjadi kesalahan GPS."
        );

    }

  }


  // =======================================================
  // START GPS
  // =======================================================

  function aktifkanGps() {

    setGpsError("");


    // Browser tidak menyediakan
    // Geolocation API.
    if (
      !navigator.geolocation
    ) {

      setGpsError(
        "Browser ini tidak mendukung GPS / Geolocation."
      );

      return;
    }


    /*
     * Geolocation browser umumnya membutuhkan HTTPS.
     *
     * localhost dianggap secure,
     * tetapi alamat LAN HTTP seperti
     * http://192.168.x.x bisa ditolak browser HP.
     */

    if (
      !window.isSecureContext
    ) {

      setGpsError(
        "GPS browser membutuhkan koneksi HTTPS. Website sedang dibuka melalui koneksi HTTP yang tidak aman."
      );

      return;
    }


    // Jangan buat watcher kedua.
    if (
      watchIdRef.current !==
      null
    ) {

      return;
    }


    const watchId =
      navigator.geolocation
        .watchPosition(

          // SUCCESS
          (position) => {

            setGpsAktif(
              true
            );


            kirimLokasi(
              position
            );

          },


          // ERROR
          (
            positionError
          ) => {

            handleGpsError(
              positionError
            );

          },


          // OPTIONS
          {
            enableHighAccuracy:
              true,

            maximumAge:
              0,

            timeout:
              15000,
          }
        );


    watchIdRef.current =
      watchId;


    setGpsAktif(
      true
    );

  }


  // =======================================================
  // STOP GPS
  // =======================================================

  function nonaktifkanGps() {

    if (
      watchIdRef.current !==
      null
    ) {

      navigator.geolocation
        .clearWatch(
          watchIdRef.current
        );


      watchIdRef.current =
        null;

    }


    setGpsAktif(
      false
    );


    setGpsMengirim(
      false
    );


    setGpsError("");

  }


  // =======================================================
  // TRACK HISTORY
  // =======================================================

  function muatRiwayat() {

    setLoadingRiwayat(
      true
    );


    api
      .get<
        TrackPoint[]
      >(
        `/perangkat/${id}/riwayat`
      )

      .then(
        setRiwayat
      )

      .catch(
        (err) => {

          setGpsError(
            err instanceof Error
              ? err.message
              : "Gagal memuat riwayat"
          );

        }
      )

      .finally(
        () => {
          setLoadingRiwayat(
            false
          );
        }
      );

  }


  // =======================================================
  // ERROR / LOADING
  // =======================================================

  if (error) {

    return (
      <p className="text-danger">
        {error}
      </p>
    );

  }


  if (!perangkat) {

    return (
      <p className="text-text-secondary">
        Memuat data...
      </p>
    );

  }


  // =======================================================
  // USER
  // =======================================================

  const nama =
    pengguna.find(
      (u) =>
        u.id_tunanetra ===
        perangkat.dipakai_oleh
    )
      ?.nama_tunanetra
    ??
    "Belum dipasangkan";


  // =======================================================
  // LOCATION
  // =======================================================

  const lokasiAda =
    perangkat.lat_terakhir !=
      null
    &&
    perangkat.long_terakhir !=
      null;


  const lokasiText =
    perangkat.lokasi_terakhir
    ??
    (
      lokasiAda
        ? `${Number(
            perangkat.lat_terakhir
          ).toFixed(
            6
          )}, ${Number(
            perangkat.long_terakhir
          ).toFixed(
            6
          )}`
        : "Lokasi belum tersedia"
    );


  // =======================================================
  // PATH
  // =======================================================

  const path =
    riwayat
      ? [
          ...riwayat,
        ]
          .reverse()
          .map(
            (point) => ({
              lat:
                point.latitude,

              lng:
                point.longitude,
            })
          )

      : undefined;


  // =======================================================
  // UI
  // =======================================================

  return (

    <div>

      {/* =================================================
          BACK
      ================================================= */}

      <button
        onClick={
          () =>
            router.back()
        }

        className="
          mb-4
          text-sm
          text-primary
          hover:underline
        "
      >
        ← Kembali ke Monitoring Lokasi
      </button>


      {/* =================================================
          TITLE
      ================================================= */}

      <div
        className="
          mb-6
          flex
          flex-col
          gap-2
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >

        <div>

          <h1
            className="
              text-xl
              font-semibold
              text-text-primary
            "
          >
            {nama}
          </h1>


          <div
            className="
              font-mono
              text-sm
              text-text-secondary
            "
          >
            {perangkat.id_perangkat}
          </div>

        </div>


        {/* DEVICE ONLINE STATUS */}

        <div
          className={`
            flex
            items-center
            gap-2
            rounded-pill
            px-4
            py-2
            text-sm
            font-semibold

            ${
              perangkat.status_online
                ? "bg-success-soft text-success"
                : "bg-offline/10 text-offline"
            }
          `}
        >

          {perangkat.status_online
            ? (
              <Wifi
                size={17}
              />
            )
            : (
              <WifiOff
                size={17}
              />
            )
          }


          Raspberry Pi{" "}
          {perangkat.status_online
            ? "Online"
            : "Offline"}

        </div>

      </div>


      {/* =================================================
          GRID
      ================================================= */}

      <div
        className="
          grid
          grid-cols-1
          gap-6
          lg:grid-cols-[380px_1fr]
        "
      >

        {/* =================================================
            LEFT PANEL
        ================================================= */}

        <div
          className="
            space-y-4
          "
        >

          {/* ===============================================
              DEVICE INFORMATION
          =============================================== */}

          <div
            className="
              rounded-card
              bg-surface
              p-6
              shadow-card
            "
          >

            <h2
              className="
                mb-5
                text-lg
                font-semibold
                text-text-primary
              "
            >
              Informasi Perangkat
            </h2>


            {/* STATUS */}

            <div
              className="
                mb-4
                flex
                items-center
                justify-between
              "
            >

              <span
                className="
                  text-sm
                  text-text-secondary
                "
              >
                Status Raspberry
              </span>


              <span
                className={`
                  flex
                  items-center
                  gap-1
                  text-sm
                  font-semibold

                  ${
                    perangkat.status_online
                      ? "text-success"
                      : "text-offline"
                  }
                `}
              >

                {perangkat.status_online
                  ? (
                    <Wifi
                      size={15}
                    />
                  )
                  : (
                    <WifiOff
                      size={15}
                    />
                  )
                }


                {perangkat.status_online
                  ? "Online"
                  : "Offline"}

              </span>

            </div>


            {/* BATTERY */}

            <div
              className="
                mb-4
                flex
                items-center
                justify-between
              "
            >

              <span
                className="
                  text-sm
                  text-text-secondary
                "
              >
                Baterai
              </span>


              <span
                className="
                  flex
                  items-center
                  gap-1
                  font-medium
                  text-text-primary
                "
              >

                <BatteryMedium
                  size={16}
                />

                {perangkat.baterai_terakhir
                  ?? "-"}%

              </span>

            </div>


            {/* LOCATION */}

            <div>

              <div
                className="
                  mb-1
                  flex
                  items-center
                  gap-1
                  text-sm
                  text-text-secondary
                "
              >

                <MapPin
                  size={15}
                />

                Lokasi Terakhir

              </div>


              <p
                className="
                  break-words
                  font-medium
                  text-text-primary
                "
              >
                {lokasiText}
              </p>

            </div>

          </div>


          {/* ===============================================
              GPS MONITORING
          =============================================== */}

          <div
            className="
              rounded-card
              bg-surface
              p-6
              shadow-card
            "
          >

            <div
              className="
                mb-4
                flex
                items-center
                justify-between
              "
            >

              <div>

                <h2
                  className="
                    text-lg
                    font-semibold
                    text-text-primary
                  "
                >
                  GPS HP
                </h2>


                <p
                  className="
                    mt-1
                    text-xs
                    text-text-secondary
                  "
                >
                  Monitoring lokasi bersifat opsional
                </p>

              </div>


              <span
                className={`
                  rounded-pill
                  px-3
                  py-1
                  text-xs
                  font-semibold

                  ${
                    gpsAktif
                      ? "bg-success-soft text-success"
                      : "bg-offline/10 text-offline"
                  }
                `}
              >
                {gpsAktif
                  ? "Aktif"
                  : "Tidak Aktif"}
              </span>

            </div>


            {/* DESCRIPTION */}

            <p
              className="
                mb-4
                text-sm
                leading-6
                text-text-secondary
              "
            >

              Aktifkan GPS pada HP yang dibawa bersama
              perangkat ini untuk mengirim lokasi secara
              real-time.

            </p>


            {/* GPS DETAILS */}

            {gpsAktif && (

              <div
                className="
                  mb-4
                  space-y-2
                  rounded-input
                  bg-success-soft
                  p-3
                  text-sm
                "
              >

                <div
                  className="
                    flex
                    justify-between
                    gap-3
                  "
                >

                  <span
                    className="
                      text-text-secondary
                    "
                  >
                    Akurasi
                  </span>


                  <strong
                    className="
                      text-text-primary
                    "
                  >
                    {gpsAccuracy != null
                      ? `± ${Math.round(
                          gpsAccuracy
                        )} m`
                      : "Menunggu GPS..."
                    }
                  </strong>

                </div>


                <div
                  className="
                    flex
                    justify-between
                    gap-3
                  "
                >

                  <span
                    className="
                      text-text-secondary
                    "
                  >
                    Update terakhir
                  </span>


                  <strong
                    className="
                      text-text-primary
                    "
                  >

                    {gpsLastUpdate
                      ? gpsLastUpdate
                          .toLocaleTimeString(
                            "id-ID"
                          )
                      : "-"
                    }

                  </strong>

                </div>


                <div
                  className="
                    flex
                    justify-between
                    gap-3
                  "
                >

                  <span
                    className="
                      text-text-secondary
                    "
                  >
                    Server
                  </span>


                  <strong
                    className="
                      text-text-primary
                    "
                  >
                    {gpsMengirim
                      ? "Mengirim..."
                      : "Tersambung"}
                  </strong>

                </div>

              </div>

            )}


            {/* GPS ERROR */}

            {gpsError && (

              <div
                className="
                  mb-4
                  rounded-input
                  bg-danger-soft
                  px-3
                  py-2
                  text-sm
                  text-danger
                "
              >
                {gpsError}
              </div>

            )}


            {/* GPS BUTTON */}

            {!gpsAktif ? (

              <button
                type="button"

                onClick={
                  aktifkanGps
                }

                className="
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-input
                  bg-primary
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  hover:bg-primary-hover
                "
              >

                <Navigation
                  size={17}
                />

                Aktifkan GPS HP

              </button>

            ) : (

              <button
                type="button"

                onClick={
                  nonaktifkanGps
                }

                className="
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-input
                  border
                  border-danger
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  text-danger
                  hover:bg-danger-soft
                "
              >

                <NavigationOff
                  size={17}
                />

                Nonaktifkan GPS

              </button>

            )}

          </div>


          {/* ===============================================
              HISTORY
          =============================================== */}

          <div
            className="
              rounded-card
              bg-surface
              p-5
              shadow-card
            "
          >

            <div
              className="
                mb-3
                flex
                items-center
                gap-2
              "
            >

              <Clock3
                size={17}
                className="
                  text-primary
                "
              />


              <h2
                className="
                  font-semibold
                  text-text-primary
                "
              >
                Riwayat Perjalanan
              </h2>

            </div>


            <button
              type="button"

              onClick={
                muatRiwayat
              }

              disabled={
                loadingRiwayat
              }

              className="
                w-full
                rounded-input
                border
                border-primary
                px-4
                py-2.5
                text-sm
                font-medium
                text-primary
                hover:bg-primary-soft
                disabled:opacity-50
              "
            >

              {loadingRiwayat
                ? "Memuat riwayat..."
                : riwayat
                ? "Muat ulang riwayat"
                : "Lihat riwayat perjalanan"
              }

            </button>


            {riwayat && (

              <p
                className="
                  mt-2
                  text-center
                  text-xs
                  text-text-secondary
                "
              >
                {riwayat.length} titik lokasi
              </p>

            )}

          </div>

        </div>


        {/* =================================================
            MAP
        ================================================= */}

        <div
          className="
            min-h-[480px]
            overflow-hidden
            rounded-card
            bg-surface
            shadow-card
            lg:h-[calc(100vh-14rem)]
          "
        >

          <MapView

            markers={
              lokasiAda
                ? [
                    {
                      id_perangkat:
                        perangkat.id_perangkat,

                      nama,

                      lat:
                        Number(
                          perangkat.lat_terakhir
                        ),

                      lng:
                        Number(
                          perangkat.long_terakhir
                        ),

                      online:
                        perangkat.status_online,

                      sos:
                        perangkat.status_sos,
                    },
                  ]

                : []
            }

            path={
              path
            }

          />

        </div>

      </div>

    </div>

  );
}