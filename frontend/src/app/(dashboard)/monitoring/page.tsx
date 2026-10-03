"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Search,
  Wifi,
  WifiOff,
  BatteryMedium,
  MapPin,
  Navigation,
} from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";

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
// MONITORING PAGE
// =========================================================

export default function MonitoringPage() {
  const [perangkat, setPerangkat] =
    useState<Perangkat[]>([]);

  const [pengguna, setPengguna] =
    useState<PenggunaTunanetra[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [filter, setFilter] =
    useState<
      "semua" |
      "online" |
      "offline"
    >("semua");

  const [cari, setCari] =
    useState("");


  // =======================================================
  // LOAD DATA
  // =======================================================

  const muat = useCallback(() => {
    Promise.all([
      api.get<Perangkat[]>(
        "/perangkat"
      ),

      api
        .get<PenggunaTunanetra[]>(
          "/pengguna"
        )
        .catch(() => []),
    ])
      .then(([p, u]) => {
        setPerangkat(p);
        setPengguna(u);

        setError("");
      })
      .catch((e) => {
        setError(
          e instanceof Error
            ? e.message
            : "Gagal memuat data"
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);


  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {
    muat();
  }, [muat]);


  // =======================================================
  // SUPABASE REALTIME
  // =======================================================

  useRealtimeTable(
    "perangkat",
    muat
  );


  // =======================================================
  // HELPERS
  // =======================================================

  function namaPengguna(
    id: string | null
  ) {
    return (
      pengguna.find(
        (u) =>
          u.id_tunanetra === id
      )?.nama_tunanetra
      ??
      "Belum dipasangkan"
    );
  }


  function punyaLokasi(
    p: Perangkat
  ) {
    return (
      p.lat_terakhir != null &&
      p.long_terakhir != null
    );
  }


  // =======================================================
  // FILTER
  // =======================================================

  const list = perangkat
    .filter((p) => {
      if (filter === "semua") {
        return true;
      }

      if (filter === "online") {
        return p.status_online;
      }

      return !p.status_online;
    })
    .filter((p) => {
      const keyword =
        cari.toLowerCase();

      return (
        namaPengguna(
          p.dipakai_oleh
        )
          .toLowerCase()
          .includes(keyword)
        ||
        p.id_perangkat
          .toLowerCase()
          .includes(keyword)
      );
    });


  // =======================================================
  // MAP MARKERS
  // =======================================================

  const markers = perangkat
    .filter(
      (p) =>
        p.lat_terakhir != null &&
        p.long_terakhir != null
    )
    .map((p) => ({
      id_perangkat:
        p.id_perangkat,

      nama:
        namaPengguna(
          p.dipakai_oleh
        ),

      lat:
        p.lat_terakhir as number,

      lng:
        p.long_terakhir as number,

      online:
        p.status_online,

      sos:
        p.status_sos,
    }));


  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {
    return (
      <p className="text-text-secondary">
        Memuat data...
      </p>
    );
  }


  // =======================================================
  // ERROR
  // =======================================================

  if (error) {
    return (
      <p className="text-danger">
        Gagal memuat: {error}
      </p>
    );
  }


  // =======================================================
  // UI
  // =======================================================

  return (
    <div>

      {/* ===================================================
          HEADER
      =================================================== */}

      <PageHeader
        title="Monitoring Lokasi"
        subtitle="Pantau posisi pengguna secara real-time"
      />


      {/* ===================================================
          CONTENT
      =================================================== */}

      <div
        className="
          flex
          flex-col
          gap-4
          lg:h-[calc(100vh-11rem)]
          lg:flex-row
        "
      >

        {/* =================================================
            DEVICE LIST
        ================================================= */}

        <aside
          className="
            max-h-96
            w-full
            flex-shrink-0
            overflow-y-auto
            rounded-card
            bg-surface
            p-4
            shadow-card
            lg:h-full
            lg:max-h-none
            lg:w-80
          "
        >

          {/* ===============================================
              TITLE
          =============================================== */}

          <div
            className="
              mb-3
              flex
              items-center
              justify-between
            "
          >

            <h2
              className="
                text-lg
                font-semibold
                text-text-primary
              "
            >
              Daftar Perangkat
            </h2>


            <Badge tone="primary">
              {perangkat.length} Perangkat
            </Badge>

          </div>


          {/* ===============================================
              SEARCH
          =============================================== */}

          <div
            className="
              relative
              mb-3
            "
          >

            <Search
              size={16}
              className="
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-text-secondary
              "
            />


            <input
              type="text"

              placeholder="Cari pengguna atau ID..."

              value={cari}

              onChange={(e) =>
                setCari(
                  e.target.value
                )
              }

              className="
                w-full
                rounded-pill
                border
                border-border
                py-2
                pl-9
                pr-3
                text-sm
              "
            />

          </div>


          {/* ===============================================
              FILTER
          =============================================== */}

          <div
            className="
              mb-4
              flex
              gap-2
            "
          >

            {(
              [
                "semua",
                "online",
                "offline",
              ] as const
            ).map((f) => (

              <button
                key={f}

                onClick={() =>
                  setFilter(f)
                }

                className={`
                  rounded-pill
                  px-4
                  py-1.5
                  text-sm
                  font-medium
                  capitalize

                  ${
                    filter === f
                      ? "bg-primary text-white"
                      : "border border-border-strong text-text-secondary"
                  }
                `}
              >
                {f}
              </button>

            ))}

          </div>


          {/* ===============================================
              DEVICE CARDS
          =============================================== */}

          {list.length === 0 ? (

            <p
              className="
                py-6
                text-center
                text-sm
                text-text-secondary
              "
            >
              Tidak ada perangkat.
            </p>

          ) : (

            <div className="space-y-3">

              {list.map((p) => {

                const lokasiAda =
                  punyaLokasi(p);


                return (

                  <div
                    key={p.id_perangkat}

                    className={`
                      rounded-card
                      p-4
                      transition-colors

                      ${
                        p.status_sos
                          ? "bg-danger-soft"
                          : p.status_online
                          ? "bg-success-soft"
                          : "bg-offline/10"
                      }
                    `}
                  >

                    {/* =====================================
                        NAMA
                    ===================================== */}

                    <div
                      className="
                        text-lg
                        font-semibold
                        text-text-primary
                      "
                    >
                      {namaPengguna(
                        p.dipakai_oleh
                      )}
                    </div>


                    {/* =====================================
                        DEVICE ID
                    ===================================== */}

                    <div
                      className="
                        font-mono
                        text-sm
                        text-text-secondary
                      "
                    >
                      {p.id_perangkat}
                    </div>


                    {/* =====================================
                        LOCATION
                    ===================================== */}

                    <div
                      className="
                        mt-2
                        flex
                        items-start
                        gap-2
                        text-sm
                        text-text-secondary
                      "
                    >

                      <MapPin
                        size={14}
                        className="
                          mt-0.5
                          flex-shrink-0
                        "
                      />


                      <span>

                        {p.lokasi_terakhir
                          ??
                          (
                            lokasiAda
                              ? `${p.lat_terakhir?.toFixed?.(6) ?? p.lat_terakhir}, ${p.long_terakhir?.toFixed?.(6) ?? p.long_terakhir}`
                              : "Lokasi belum tersedia"
                          )
                        }

                      </span>

                    </div>


                    {/* =====================================
                        STATUS
                    ===================================== */}

                    <div
                      className="
                        mt-3
                        flex
                        flex-wrap
                        items-center
                        gap-x-4
                        gap-y-2
                        text-sm
                      "
                    >

                      {/* DEVICE ONLINE */}

                      <span
                        className={`
                          flex
                          items-center
                          gap-1
                          font-medium

                          ${
                            p.status_online
                              ? "text-success"
                              : "text-offline"
                          }
                        `}
                      >

                        {p.status_online ? (
                          <Wifi size={14} />
                        ) : (
                          <WifiOff size={14} />
                        )}


                        {p.status_online
                          ? "Online"
                          : "Offline"}

                      </span>


                      {/* LOCATION STATUS */}

                      <span
                        className={`
                          flex
                          items-center
                          gap-1
                          font-medium

                          ${
                            lokasiAda
                              ? "text-primary"
                              : "text-text-secondary"
                          }
                        `}
                      >

                        <Navigation
                          size={14}
                        />


                        {lokasiAda
                          ? "Lokasi tersedia"
                          : "GPS belum aktif"}

                      </span>

                    </div>


                    {/* =====================================
                        BATTERY
                    ===================================== */}

                    <div
                      className="
                        mt-2
                        flex
                        items-center
                        gap-1
                        text-sm
                        text-text-secondary
                      "
                    >

                      <BatteryMedium
                        size={14}
                      />


                      <span>
                        Baterai:{" "}
                        {p.baterai_terakhir
                          ?? "-"}%
                      </span>

                    </div>


                    {/* =====================================
                        OPEN DETAIL
                    ===================================== */}

                    <Link
                      href={
                        `/monitoring/${p.id_perangkat}`
                      }

                      className="
                        mt-4
                        flex
                        w-full
                        items-center
                        justify-center
                        gap-2
                        rounded-input
                        bg-primary
                        px-4
                        py-2
                        text-sm
                        font-medium
                        text-white
                        hover:bg-primary-hover
                      "
                    >

                      <Navigation
                        size={15}
                      />

                      Buka Monitoring

                    </Link>

                  </div>

                );
              })}

            </div>

          )}

        </aside>


        {/* =================================================
            MAP
        ================================================= */}

        <div
          className="
            relative
            h-96
            flex-1
            overflow-hidden
            rounded-card
            shadow-card
            lg:h-full
          "
        >

          <MapView
            markers={markers}
          />

        </div>

      </div>

    </div>
  );
}