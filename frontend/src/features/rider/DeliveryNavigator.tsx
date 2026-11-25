"use client";

import "leaflet/dist/leaflet.css";

import * as React from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";

import { googleMapsUrl } from "@/lib/rider";

type Pos = { lat: number; lng: number };
type Route = { points: [number, number][]; meters: number; seconds: number };

const riderIcon = L.divIcon({
  className: "",
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  html: `<div style="width:44px;height:44px;border-radius:9999px;background:#0a0a0a;border:2px solid #efc673;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.5)"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#f4d587" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="5.5" cy="17" r="2.5"/><circle cx="18.5" cy="17" r="2.5"/><path d="M8 17h7l-2-6h-3"/><path d="M13 11l1-3h3"/><path d="M5 11h4"/></svg></div>`,
});

const destIcon = L.divIcon({
  className: "",
  html: `<svg viewBox="0 0 24 32" width="32" height="42" aria-hidden="true"><path d="M12 0C5.4 0 0 5.2 0 11.6 0 20 12 32 12 32s12-12 12-20.4C24 5.2 18.6 0 12 0z" fill="#d9a346" stroke="#fff" stroke-width="1.5"/><circle cx="12" cy="11.5" r="4.5" fill="#0a0a0a"/></svg>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
});

function haversine(a: Pos, b: Pos) {
  const R = 6_371_000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const formatDistance = (m: number) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`);
const formatEta = (s: number) => {
  const min = Math.max(1, Math.round(s / 60));
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`;
};

/** Re-frames the map whenever `signal` changes (first location fix, new route, Recenter). */
function Fit({ points, signal }: { points: [number, number][]; signal: number }) {
  const map = useMap();
  React.useEffect(() => {
    map.invalidateSize();
    if (points.length === 0) return;
    if (points.length === 1) map.setView(points[0] as [number, number], 16);
    else map.fitBounds(L.latLngBounds(points), { padding: [48, 48] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signal]);
  return null;
}

export default function DeliveryNavigator({ dest }: { dest: Pos }) {
  const [pos, setPos] = React.useState<Pos | null>(null);
  const [geoError, setGeoError] = React.useState("");
  const [route, setRoute] = React.useState<Route | null>(null);
  const [fit, setFit] = React.useState(0);

  const firstFix = React.useRef(true);
  const gotRoute = React.useRef(false);
  const lastRequest = React.useRef<{ at: number; pos: Pos } | null>(null);
  const alive = React.useRef(true);

  React.useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // Follow the rider's position.
  React.useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError("This device can't share its location.");
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (p) => {
        setGeoError("");
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
        if (firstFix.current) {
          firstFix.current = false;
          setFit((n) => n + 1);
        }
      },
      (err) =>
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "Location access is off. Allow it in your browser to see your position and the route."
            : "Can't find your location right now.",
        ),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Fetch the driving route, at most every 15 s and only after moving 100 m or more.
  React.useEffect(() => {
    if (!pos) return;
    const now = Date.now();
    const last = lastRequest.current;
    if (last && (now - last.at < 15_000 || haversine(last.pos, pos) < 100)) return;
    lastRequest.current = { at: now, pos };

    (async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${pos.lng},${pos.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = (await res.json()) as {
          routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[];
        };
        const r = data.routes?.[0];
        if (!r || !alive.current) return;
        setRoute({
          points: r.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]),
          meters: r.distance,
          seconds: r.duration,
        });
        if (!gotRoute.current) {
          gotRoute.current = true;
          setFit((n) => n + 1);
        }
      } catch {
        /* keep the straight-line fallback */
      }
    })();
  }, [pos, dest.lat, dest.lng]);

  const destination: [number, number] = [dest.lat, dest.lng];
  const line: [number, number][] | null = route
    ? route.points
    : pos
      ? [[pos.lat, pos.lng], destination]
      : null;
  const framing: [number, number][] = pos ? [[pos.lat, pos.lng], destination] : [destination];

  const summary = route
    ? `${formatDistance(route.meters)} · about ${formatEta(route.seconds)}`
    : pos
      ? `${formatDistance(haversine(pos, dest))} away in a straight line`
      : "Waiting for your location…";

  return (
    <div>
      <MapContainer
        center={destination}
        zoom={15}
        scrollWheelZoom={false}
        className="isolate h-72 w-full rounded-2xl border border-white/15 md:h-80"
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />
        <Fit points={framing} signal={fit} />
        {line && (
          <>
            <Polyline positions={line} pathOptions={{ color: "#0a0a0a", weight: 9, opacity: 0.55 }} />
            <Polyline
              positions={line}
              pathOptions={{ color: "#f4d587", weight: 5, opacity: 1, dashArray: route ? undefined : "8 8" }}
            />
          </>
        )}
        <Marker position={destination} icon={destIcon} />
        {pos && <Marker position={[pos.lat, pos.lng]} icon={riderIcon} />}
      </MapContainer>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-white/50">To the customer</p>
          <p className="text-sm font-semibold text-white" aria-live="polite">
            {summary}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFit((n) => n + 1)}
            className="rounded-full border border-white/20 px-3.5 py-1.5 text-xs font-semibold text-white/85 hover:border-white/40"
          >
            Recenter
          </button>
          <a
            href={googleMapsUrl(dest.lat, dest.lng)}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-full border border-[#c8933a] px-3.5 py-1.5 text-xs font-semibold text-[#f4d587] hover:bg-[#c8933a]/15"
          >
            Open in Google Maps
          </a>
        </div>
      </div>
      {geoError && <p className="mt-2 text-xs text-amber-300">{geoError}</p>}
    </div>
  );
}