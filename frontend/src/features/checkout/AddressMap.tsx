"use client";

import "leaflet/dist/leaflet.css";

import * as React from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

import type { AddressHint, Pin } from "@/lib/orders";
import { GOLD_GRADIENT } from "@/lib/theme";
import { cn } from "@/lib/utils";

const DEFAULT_CENTER: [number, number] = [14.5547, 121.0244]; // Metro Manila
const NOMINATIM = "https://nominatim.openstreetmap.org";

// Inline SVG pin so we don't depend on Leaflet's bundled marker images.
const pinIcon = L.divIcon({
  className: "",
  html: `<svg viewBox="0 0 24 32" width="32" height="42" aria-hidden="true"><path d="M12 0C5.4 0 0 5.2 0 11.6 0 20 12 32 12 32s12-12 12-20.4C24 5.2 18.6 0 12 0z" fill="#d9a346" stroke="#fff" stroke-width="1.5"/><circle cx="12" cy="11.5" r="4.5" fill="#0a0a0a"/></svg>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
});

type NominatimAddress = Record<string, string | undefined>;
type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: NominatimAddress;
};

function toHint(a: NominatimAddress = {}): AddressHint {
  const barangay = (a.suburb ?? a.neighbourhood ?? a.village ?? a.quarter ?? "").replace(
    /^(brgy\.?|barangay)\s*/i,
    "",
  );
  return {
    street: [a.house_number, a.road].filter(Boolean).join(" "),
    barangay,
    city: a.city ?? a.town ?? a.municipality ?? a.city_district ?? "",
    province: a.state ?? a.county ?? a.region ?? "",
    postalCode: a.postcode && /^\d{4}$/.test(a.postcode) ? a.postcode : "",
  };
}

async function reverse(p: Pin): Promise<AddressHint | null> {
  try {
    const res = await fetch(
      `${NOMINATIM}/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${p.lat}&lon=${p.lng}`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { address?: NominatimAddress };
    return toHint(data.address);
  } catch {
    return null;
  }
}

function ClickToPin({ onPick }: { onPick: (p: Pin) => void }) {
  useMapEvents({
    click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
}

function FlyTo({ target }: { target: Pin | null }) {
  const map = useMap();
  React.useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 17), { duration: 0.8 });
    }
  }, [target, map]);
  return null;
}

type Props = {
  value: Pin | null;
  onChange: (p: Pin) => void;
  /** Called with address parts for the pinned spot; the form only fills empty fields. */
  onHint: (h: AddressHint) => void;
  error?: string;
};

export default function AddressMap({ value, onChange, onHint, error }: Props) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<NominatimResult[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [locating, setLocating] = React.useState(false);
  const [notice, setNotice] = React.useState("");
  const [flyTarget, setFlyTarget] = React.useState<Pin | null>(null);

  const pick = React.useCallback(
    async (p: Pin, fly = false) => {
      setNotice("");
      onChange(p);
      if (fly) setFlyTarget(p);
      const hint = await reverse(p);
      if (hint) onHint(hint);
    },
    [onChange, onHint],
  );

  async function search() {
    const q = query.trim();
    if (q.length < 3 || searching) return;
    setSearching(true);
    setNotice("");
    try {
      const res = await fetch(
        `${NOMINATIM}/search?format=jsonv2&addressdetails=1&countrycodes=ph&limit=5&q=${encodeURIComponent(q)}`,
        { headers: { Accept: "application/json" } },
      );
      const data = (await res.json()) as NominatimResult[];
      setResults(data);
      if (data.length === 0) setNotice("No matches. Try a nearby landmark or tap the map.");
    } catch {
      setNotice("Search is unavailable right now. You can still tap the map to pin.");
    } finally {
      setSearching(false);
    }
  }

  function choose(r: NominatimResult) {
    const p = { lat: Number(r.lat), lng: Number(r.lon) };
    setResults([]);
    setFlyTarget(p);
    onChange(p);
    setNotice("");
    onHint(toHint(r.address));
  }

  function locate() {
    if (!navigator.geolocation) {
      setNotice("Your browser doesn't support location. Tap the map to pin instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        void pick({ lat: pos.coords.latitude, lng: pos.coords.longitude }, true);
      },
      () => {
        setLocating(false);
        setNotice("Couldn't get your location. Tap the map to pin instead.");
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  return (
    <div data-invalid={error ? "true" : undefined}>
      {/* Not a <form>: this component lives inside the checkout form. */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void search();
            }
          }}
          placeholder="Search an address or landmark"
          aria-label="Search for an address"
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/20 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/40 focus-visible:border-[#efc673] focus-visible:ring-2 focus-visible:ring-[#efc673]/60"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void search()}
            disabled={searching}
            className="min-h-11 flex-1 rounded-xl px-5 text-sm font-semibold text-black disabled:opacity-70 sm:flex-none"
            style={{ backgroundImage: GOLD_GRADIENT }}
          >
            {searching ? "Searching..." : "Search"}
          </button>
          <button
            type="button"
            onClick={locate}
            disabled={locating}
            className="min-h-11 flex-1 rounded-xl border border-[#c8933a] px-4 text-sm font-semibold text-[#f4d587] transition-colors hover:bg-[#c8933a]/15 disabled:opacity-70 sm:flex-none"
          >
            {locating ? "Locating..." : "Use my location"}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <ul className="mt-2 overflow-hidden rounded-xl border border-white/15 bg-black/60 backdrop-blur-xl">
          {results.map((r) => (
            <li key={r.place_id}>
              <button
                type="button"
                onClick={() => choose(r)}
                className="block w-full px-4 py-2.5 text-left text-sm text-white/90 transition-colors hover:bg-white/10"
              >
                {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}

      <MapContainer
        center={value ? [value.lat, value.lng] : DEFAULT_CENTER}
        zoom={value ? 17 : 12}
        scrollWheelZoom={false}
        className={cn(
          "isolate mt-3 h-72 w-full rounded-xl border",
          error ? "border-red-400" : "border-white/20",
        )}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />
        <ClickToPin onPick={(p) => void pick(p)} />
        <FlyTo target={flyTarget} />
        {value && (
          <Marker
            position={[value.lat, value.lng]}
            icon={pinIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const ll = (e.target as L.Marker).getLatLng();
                void pick({ lat: ll.lat, lng: ll.lng });
              },
            }}
          />
        )}
      </MapContainer>

      <p className="mt-2 text-xs text-white/60" aria-live="polite">
        {value
          ? `Pinned: ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}. Drag the pin to adjust.`
          : "Search, tap the map, or use your location to drop a pin on your exact doorstep."}
      </p>
      {notice && <p className="mt-1 text-xs text-amber-300">{notice}</p>}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}