"use client";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from "react-leaflet";
import L from "leaflet";

const markerIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#1B3A5C;border:3px solid white;box-shadow:0 0 0 2px #1B3A5C55"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function KlikHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function GeofenceMapPicker({
  center,
  radius,
  onPick,
}: {
  center: { lat: number; lng: number } | null;
  radius: number;
  onPick: (lat: number, lng: number) => void;
}) {
  const posisiAwal: [number, number] = center ? [center.lat, center.lng] : [-6.9932, 110.4203];

  return (
    <MapContainer center={posisiAwal} zoom={15} className="h-full w-full rounded-map" style={{ minHeight: 280 }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      <KlikHandler onPick={onPick} />
      {center && (
        <>
          <Marker position={[center.lat, center.lng]} icon={markerIcon} />
          <Circle
            center={[center.lat, center.lng]}
            radius={radius}
            pathOptions={{ color: "#1B3A5C", fillColor: "#1B3A5C", fillOpacity: 0.12 }}
          />
        </>
      )}
    </MapContainer>
  );
}