"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from "react-leaflet";
import L from "leaflet";

const markerIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:24px;height:24px;border-radius:50%;background:#1B3A5C;border:4px solid white;box-shadow:0 0 0 2px #1B3A5C55;cursor:grab"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function KlikHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    return () => {
      (map as L.Map & { _animatingZoom?: boolean })._animatingZoom = false;
    };
  }, [map]);

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
  const posisiAwal: [number, number] = [-6.9932, 110.4203];

  // Peta dibuka pas dengan lingkaran zona, supaya zona terlihat utuh di layar lebar maupun sempit.
  const tampilanAwal = center
    ? { bounds: L.latLng(center.lat, center.lng).toBounds(radius * 2.4) }
    : { center: posisiAwal, zoom: 15 };

  return (
    <MapContainer {...tampilanAwal} className="h-full w-full rounded-map" style={{ minHeight: 280 }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      <KlikHandler onPick={onPick} />
      {center && (
        <>
          <Marker
            position={[center.lat, center.lng]}
            icon={markerIcon}
            draggable
            eventHandlers={{
              dragend(e: L.LeafletEvent) {
                const { lat, lng } = (e.target as L.Marker).getLatLng();
                onPick(lat, lng);
              },
            }}
          />
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