// frontend/src/components/map/MapView.tsx

"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";

function pinIcon(color: string) {
  return new L.DivIcon({
    className: "",
    html: `
      <svg width="30" height="40" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 11 16 26 16 26s16-15 16-26C32 7.163 24.837 0 16 0z"
          fill="${color}" stroke="white" stroke-width="2" />
        <circle cx="16" cy="16" r="6" fill="white" />
      </svg>
    `,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -40],
  });
}

// Salinan token globals.css (Leaflet tidak bisa membaca token Tailwind).
const WARNA = {
  online: "#07874B", // --color-success
  offline: "#5B77A6", // --color-offline
  sos: "#D4343F", // --color-danger
  rute: "#008290", // --color-live
};

const iconOnline = pinIcon(WARNA.online);
const iconOffline = pinIcon(WARNA.offline);
const iconSOS = pinIcon(WARNA.sos);

function iconTitikHenti(nomor: number) {
  return new L.DivIcon({
    className: "",
    html: `
      <div style="width:24px;height:24px;border-radius:9999px;background:${WARNA.rute};
        border:2px solid white;color:white;font:700 11px/20px var(--font-data);text-align:center;
        box-shadow:0 1px 3px rgba(0,0,0,.35)">${nomor}</div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

export type MarkerData = {
  id_perangkat: string;
  nama: string;
  lat: number;
  lng: number;
  online: boolean;
  sos?: boolean;
};

export type TitikHenti = { lat: number; lng: number; nomor: number; jam: string };

export type ZonaAman = { lat: number; lng: number; radius: number; khusus?: boolean };

// Menghitung ulang ukuran peta (mencegah tampilan kotak-kotak) lalu mengarahkan
// tampilan ke marker dan titik henti. Hanya berjalan saat koordinat benar-benar berubah,
// supaya zoom atau geseran pengguna tidak ditarik balik oleh render ulang halaman.
function MapController({ markers, titikHenti }: { markers: MarkerData[]; titikHenti?: TitikHenti[] }) {
  const map = useMap();

  const kunci = markers.map((m) => `${m.lat},${m.lng}`).join("|") + "#" + (titikHenti?.length ?? 0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize();

      const points: L.LatLngExpression[] = [];
      markers.forEach((marker) => points.push([marker.lat, marker.lng]));
      titikHenti?.forEach((titik) => points.push([titik.lat, titik.lng]));

      if (points.length === 0) return;

      if (points.length === 1) {
        map.setView(points[0], 16, { animate: true });
        return;
      }

      map.fitBounds(L.latLngBounds(points), {
        padding: [40, 40],
        maxZoom: 17,
        animate: true,
      });
    }, 250);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, kunci]);

  return null;
}

export function MapView({
  markers,
  titikHenti,
  zona,
}: {
  markers: MarkerData[];
  titikHenti?: TitikHenti[];
  zona?: ZonaAman[];
}) {
  // Cadangan bila belum ada data lokasi: Semarang.
  const defaultCenter: [number, number] = [-6.9932, 110.4203];

  const center: [number, number] =
    markers.length > 0
      ? [markers[0].lat, markers[0].lng]
      : titikHenti && titikHenti.length > 0
      ? [titikHenti[0].lat, titikHenti[0].lng]
      : defaultCenter;

  return (
    <MapContainer
      center={center}
      zoom={15}
      scrollWheelZoom={true}
      className="h-full w-full"
      style={{ width: "100%", height: "100%", minHeight: "300px" }}
    >
      <MapController markers={markers} titikHenti={titikHenti} />

      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {zona?.map((z, i) => (
        <Circle
          key={i}
          center={[z.lat, z.lng]}
          radius={z.radius}
          interactive={false}
          pathOptions={{
            color: "#1B3A5C",
            weight: 2,
            dashArray: z.khusus ? undefined : "6 6",
            fillColor: "#1B3A5C",
            fillOpacity: z.khusus ? 0.14 : 0.06,
          }}
        />
      ))}

      {titikHenti?.map((titik) => (
        <Marker key={titik.nomor} position={[titik.lat, titik.lng]} icon={iconTitikHenti(titik.nomor)}>
          <Popup>
            <div style={{ fontWeight: 700 }}>Titik henti {titik.nomor}</div>
            <div style={{ marginTop: "4px" }}>Mulai berhenti {titik.jam}</div>
          </Popup>
        </Marker>
      ))}

      {markers.map((marker) => {
        const icon = marker.sos ? iconSOS : marker.online ? iconOnline : iconOffline;

        return (
          <Marker key={marker.id_perangkat} position={[marker.lat, marker.lng]} icon={icon}>
            <Popup>
              <div style={{ minWidth: "160px" }}>
                <div style={{ fontWeight: 700, marginBottom: "4px" }}>{marker.nama}</div>

                <div style={{ fontFamily: "var(--font-data)", fontSize: "12px" }}>
                  {marker.id_perangkat}
                </div>

                <div style={{ marginTop: "8px" }}>
                  Status:{" "}
                  <strong style={{ color: marker.online ? WARNA.online : WARNA.offline }}>
                    {marker.online ? "Online" : "Offline"}
                  </strong>
                </div>

                {marker.sos && (
                  <div style={{ marginTop: "6px", color: WARNA.sos, fontWeight: 700 }}>
                    SOS AKTIF
                  </div>
                )}

                <div
                  style={{
                    marginTop: "8px",
                    fontFamily: "var(--font-data)",
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