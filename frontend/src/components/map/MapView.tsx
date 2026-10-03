"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";

import L from "leaflet";


// =========================================================
// PIN ICON
// =========================================================

function pinIcon(color: string) {
  return new L.DivIcon({
    className: "",

    html: `
      <svg
        width="30"
        height="40"
        viewBox="0 0 32 42"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="
            M16 0
            C7.163 0 0 7.163 0 16
            c0 11 16 26 16 26
            s16-15 16-26
            C32 7.163 24.837 0 16 0z
          "
          fill="${color}"
          stroke="white"
          stroke-width="2"
        />

        <circle
          cx="16"
          cy="16"
          r="6"
          fill="white"
        />
      </svg>
    `,

    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -40],
  });
}


// =========================================================
// ICON COLORS
// =========================================================

const iconOnline = pinIcon("#2F8F5B");

const iconOffline = pinIcon("#8A94A6");

const iconSOS = pinIcon("#C6362F");


// =========================================================
// TYPES
// =========================================================

export type MarkerData = {
  id_perangkat: string;
  nama: string;

  lat: number;
  lng: number;

  online: boolean;

  sos?: boolean;
};


type PathPoint = {
  lat: number;
  lng: number;
};


// =========================================================
// MAP CONTROLLER
//
// Fungsi:
// - memperbaiki map yang tampil kotak-kotak
// - invalidate ukuran Leaflet
// - auto zoom ke perangkat
// - auto fit riwayat perjalanan
// =========================================================

function MapController({
  markers,
  path,
}: {
  markers: MarkerData[];
  path?: PathPoint[];
}) {
  const map = useMap();


  useEffect(() => {
    const timer = window.setTimeout(() => {
      // Paksa Leaflet menghitung ulang
      // ukuran container.
      map.invalidateSize();


      const points: L.LatLngExpression[] = [];


      // Marker perangkat
      markers.forEach((marker) => {
        points.push([
          marker.lat,
          marker.lng,
        ]);
      });


      // Path perjalanan
      path?.forEach((point) => {
        points.push([
          point.lat,
          point.lng,
        ]);
      });


      // Tidak ada data lokasi
      if (points.length === 0) {
        return;
      }


      // Hanya satu titik
      if (points.length === 1) {
        map.setView(
          points[0],
          16,
          {
            animate: true,
          }
        );

        return;
      }


      // Banyak titik
      const bounds = L.latLngBounds(
        points
      );


      map.fitBounds(
        bounds,
        {
          padding: [40, 40],
          maxZoom: 17,
          animate: true,
        }
      );

    }, 250);


    return () => {
      window.clearTimeout(timer);
    };

  }, [
    map,
    markers,
    path,
  ]);


  return null;
}


// =========================================================
// MAP VIEW
// =========================================================

export function MapView({
  markers,
  path,
}: {
  markers: MarkerData[];
  path?: PathPoint[];
}) {

  // Default Semarang
  const defaultCenter: [
    number,
    number
  ] = [
    -6.9932,
    110.4203,
  ];


  const center: [
    number,
    number
  ] =
    markers.length > 0
      ? [
          markers[0].lat,
          markers[0].lng,
        ]

      : path && path.length > 0
      ? [
          path[0].lat,
          path[0].lng,
        ]

      : defaultCenter;


  return (
    <MapContainer
      center={center}
      zoom={15}
      scrollWheelZoom={true}
      className="h-full w-full"
      style={{
        width: "100%",
        height: "100%",
        minHeight: "300px",
      }}
    >

      {/* ===============================================
          MAP CONTROLLER
      =============================================== */}

      <MapController
        markers={markers}
        path={path}
      />


      {/* ===============================================
          OPENSTREETMAP
      =============================================== */}

      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />


      {/* ===============================================
          RIWAYAT PERJALANAN
      =============================================== */}

      {path && path.length > 1 && (
        <Polyline
          positions={
            path.map(
              (point) => [
                point.lat,
                point.lng,
              ]
            )
          }

          pathOptions={{
            color: "#0E7C86",
            weight: 4,
            opacity: 0.85,
          }}
        />
      )}


      {/* ===============================================
          MARKER PERANGKAT
      =============================================== */}

      {markers.map((marker) => {

        const icon =
          marker.sos
            ? iconSOS
            : marker.online
            ? iconOnline
            : iconOffline;


        return (
          <Marker
            key={marker.id_perangkat}

            position={[
              marker.lat,
              marker.lng,
            ]}

            icon={icon}
          >

            <Popup>

              <div
                style={{
                  minWidth: "160px",
                }}
              >

                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: "4px",
                  }}
                >
                  {marker.nama}
                </div>


                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: "12px",
                  }}
                >
                  {marker.id_perangkat}
                </div>


                <div
                  style={{
                    marginTop: "8px",
                  }}
                >
                  Status:{" "}

                  <strong
                    style={{
                      color:
                        marker.online
                          ? "#2F8F5B"
                          : "#8A94A6",
                    }}
                  >
                    {marker.online
                      ? "Online"
                      : "Offline"}
                  </strong>
                </div>


                {marker.sos && (
                  <div
                    style={{
                      marginTop: "6px",
                      color: "#C6362F",
                      fontWeight: 700,
                    }}
                  >
                    SOS AKTIF
                  </div>
                )}


                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "11px",
                    opacity: 0.7,
                  }}
                >
                  {marker.lat.toFixed(6)}
                  {", "}
                  {marker.lng.toFixed(6)}
                </div>

              </div>

            </Popup>

          </Marker>
        );
      })}

    </MapContainer>
  );
}