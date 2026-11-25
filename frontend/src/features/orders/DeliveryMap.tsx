"use client";

import "leaflet/dist/leaflet.css";

import * as React from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";

/** TEMPORARY placeholder rider data until real tracking exists. */
export const PLACEHOLDER_RIDER = { name: "Juan Dela Cruz", etaMinutes: 15 };

/** TEMPORARY: a street-like path from a fake rider position to the recipient. */
function placeholderRoute(lat: number, lng: number): [number, number][] {
  return [
    [lat + 0.009, lng - 0.011], // rider
    [lat + 0.009, lng - 0.004],
    [lat + 0.002, lng - 0.004],
    [lat, lng], // recipient
  ];
}

const riderIcon = L.divIcon({
  className: "",
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  html: `<div style="width:44px;height:44px;border-radius:9999px;background:#0a0a0a;border:2px solid #efc673;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.5)"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#f4d587" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="5.5" cy="17" r="2.5"/><circle cx="18.5" cy="17" r="2.5"/><path d="M8 17h7l-2-6h-3"/><path d="M13 11l1-3h3"/><path d="M5 11h4"/></svg></div>`,
});

const destinationIcon = L.divIcon({
  className: "",
  html: `<svg viewBox="0 0 24 32" width="32" height="42" aria-hidden="true"><path d="M12 0C5.4 0 0 5.2 0 11.6 0 20 12 32 12 32s12-12 12-20.4C24 5.2 18.6 0 12 0z" fill="#d9a346" stroke="#fff" stroke-width="1.5"/><circle cx="12" cy="11.5" r="4.5" fill="#0a0a0a"/></svg>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
});

/** The map mounts while its panel is still expanding, so re-measure afterwards. */
function Resize() {
  const map = useMap();
  React.useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 350);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export default function DeliveryMap({ lat, lng }: { lat: number; lng: number }) {
  const route = React.useMemo(() => placeholderRoute(lat, lng), [lat, lng]);
  const bounds = React.useMemo(() => L.latLngBounds(route), [route]);

  return (
    <div>
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: [48, 48] }}
        scrollWheelZoom={false}
        className="isolate h-64 w-full rounded-xl border border-white/20"
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />
        <Resize />
        {/* Dark casing under the highlighted gold path */}
        <Polyline positions={route} pathOptions={{ color: "#0a0a0a", weight: 9, opacity: 0.55 }} />
        <Polyline positions={route} pathOptions={{ color: "#f4d587", weight: 5, opacity: 1 }} />
        <Marker position={route[route.length - 1]} icon={destinationIcon} />
        <Marker position={route[0]} icon={riderIcon} />
      </MapContainer>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-white/55">Your rider</p>
          <p className="font-semibold">{PLACEHOLDER_RIDER.name}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-widest text-white/55">Estimated arrival</p>
          <p className="font-semibold text-[#f4d587]">~{PLACEHOLDER_RIDER.etaMinutes} min</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-white/50">
        Sample route preview. Live rider tracking is coming soon.
      </p>
    </div>
  );
}