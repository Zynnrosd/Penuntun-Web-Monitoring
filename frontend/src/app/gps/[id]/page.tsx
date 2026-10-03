// frontend/src/app/gps/[id]/page.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

type StatusGPS =
  | "siap"
  | "aktif"
  | "error";

export default function GPSPage() {
  const { id } = useParams<{ id: string }>();

  const watchId = useRef<number | null>(null);
  const lastSend = useRef(0);

  const [token, setToken] = useState("");
  const [status, setStatus] =
    useState<StatusGPS>("siap");

  const [latitude, setLatitude] =
    useState<number | null>(null);

  const [longitude, setLongitude] =
    useState<number | null>(null);

  const [accuracy, setAccuracy] =
    useState<number | null>(null);

  const [terakhirKirim, setTerakhirKirim] =
    useState<string | null>(null);

  const [error, setError] = useState("");

  useEffect(() => {
    const key = `penuntun-gps-token-${id}`;

    const params =
      new URLSearchParams(
        window.location.search
      );

    const tokenDariUrl =
      params.get("token");

    if (tokenDariUrl) {
      localStorage.setItem(
        key,
        tokenDariUrl
      );

      setToken(tokenDariUrl);

      window.history.replaceState(
        {},
        "",
        `/gps/${id}`
      );

      return;
    }

    const tokenTersimpan =
      localStorage.getItem(key);

    if (tokenTersimpan) {
      setToken(tokenTersimpan);
    }
  }, [id]);

  async function kirimLokasi(
    lat: number,
    lng: number,
    acc: number
  ) {
    try {
      const response = await fetch(
        "/api/gps/location",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id_perangkat: id,
            gps_token: token,
            latitude: lat,
            longitude: lng,
            accuracy: acc,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ??
            "Gagal mengirim lokasi"
        );
      }

      setTerakhirKirim(
        new Date().toLocaleTimeString(
          "id-ID"
        )
      );

      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengirim lokasi"
      );
    }
  }

  function mulaiGPS() {
    if (!token) {
      setError(
        "Token GPS belum tersedia."
      );
      return;
    }

    if (!navigator.geolocation) {
      setError(
        "Browser tidak mendukung GPS."
      );
      return;
    }

    if (watchId.current !== null) {
      return;
    }

    setStatus("aktif");
    setError("");

    watchId.current =
      navigator.geolocation.watchPosition(
        (position) => {
          const lat =
            position.coords.latitude;

          const lng =
            position.coords.longitude;

          const acc =
            position.coords.accuracy;

          setLatitude(lat);
          setLongitude(lng);
          setAccuracy(acc);

          const sekarang = Date.now();

          if (
            sekarang -
              lastSend.current <
            5000
          ) {
            return;
          }

          lastSend.current =
            sekarang;

          kirimLokasi(
            lat,
            lng,
            acc
          );
        },

        (gpsError) => {
          setStatus("error");

          setError(
            `GPS error: ${gpsError.message}`
          );
        },

        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 3000,
        }
      );
  }

  function berhentiGPS() {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(
        watchId.current
      );

      watchId.current = null;
    }

    setStatus("siap");
  }

  useEffect(() => {
    return () => {
      if (
        watchId.current !== null
      ) {
        navigator.geolocation.clearWatch(
          watchId.current
        );
      }
    };
  }, []);

  return (
    <main className="min-h-screen bg-background p-5">
      <div className="mx-auto max-w-md rounded-card bg-surface p-6 shadow-card">
        <h1 className="text-2xl font-semibold text-text-primary">
          PENUNTUN GPS
        </h1>

        <p className="mt-1 font-mono text-text-secondary">
          {id}
        </p>

        <div className="mt-6 rounded-card bg-surface-sunken p-4">
          <p className="text-sm text-text-secondary">
            Status GPS
          </p>

          <p className="mt-1 text-lg font-semibold text-text-primary">
            {status === "aktif"
              ? "GPS Aktif"
              : status === "error"
              ? "GPS Bermasalah"
              : "GPS Belum Aktif"}
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-input bg-danger-soft p-3 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <p className="text-sm text-text-secondary">
              Latitude
            </p>

            <p className="font-mono text-text-primary">
              {latitude ??
                "Belum tersedia"}
            </p>
          </div>

          <div>
            <p className="text-sm text-text-secondary">
              Longitude
            </p>

            <p className="font-mono text-text-primary">
              {longitude ??
                "Belum tersedia"}
            </p>
          </div>

          <div>
            <p className="text-sm text-text-secondary">
              Akurasi
            </p>

            <p className="text-text-primary">
              {accuracy === null
                ? "Belum tersedia"
                : `±${Math.round(
                    accuracy
                  )} meter`}
            </p>
          </div>

          <div>
            <p className="text-sm text-text-secondary">
              Terakhir dikirim
            </p>

            <p className="text-text-primary">
              {terakhirKirim ??
                "Belum pernah"}
            </p>
          </div>
        </div>

        {status !== "aktif" ? (
          <button
            onClick={mulaiGPS}
            className="mt-6 w-full rounded-input bg-primary px-5 py-3 text-base font-semibold text-white"
          >
            Aktifkan GPS
          </button>
        ) : (
          <button
            onClick={berhentiGPS}
            className="mt-6 w-full rounded-input bg-danger px-5 py-3 text-base font-semibold text-white"
          >
            Berhenti Berbagi Lokasi
          </button>
        )}
      </div>
    </main>
  );
}