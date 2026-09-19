"use client";

import { useEffect, useRef, useState } from "react";

// Coordinates for the Inaya shelter (Route du Merdassou, 47110 Villeneuve-sur-Lot),
// resolved from the address link shared by the team.
const SHELTER_COORDS = { lat: 44.4052015, lng: 0.6353476 };
const SHELTER_MAPS_URL = "https://maps.app.goo.gl/hBHyYvFiT4aAD3qR9";

// Grey/magenta styling to match the site's palette (theme/tokens.ts: background #e8e7e8,
// accent #df17cb). Roads pick up a subtle magenta stroke instead of the default blue/yellow.
const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#e8e7e8" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6b696c" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f4f4" }, { weight: 2 }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#d5d3d4" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.neighborhood", stylers: [{ visibility: "off" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#efeeee" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#e6e2e5" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#e6d9e3" }] },
  { featureType: "poi.park", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e6cbe2" }] },
  { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#f6dff2" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#df17cb" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#d7d5d6" }] },
];

const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44">
  <path d="M17 0C7.6 0 0 7.6 0 17c0 12.7 17 27 17 27s17-14.3 17-27C34 7.6 26.4 0 17 0z" fill="#df17cb" stroke="#ffffff" stroke-width="2"/>
  <circle cx="17" cy="17" r="7" fill="#ffffff"/>
</svg>`;

let mapsLoader: Promise<void> | null = null;

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (mapsLoader) return mapsLoader;
  if (window.google?.maps?.importLibrary) return Promise.resolve();

  mapsLoader = new Promise((resolve, reject) => {
    // With loading=async, `onload` can fire before google.maps.importLibrary exists —
    // the callback param is Google's "API ready" signal.
    const callbackName = "__initShelterMap";
    (window as unknown as Record<string, () => void>)[callbackName] = () => resolve();
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&v=weekly&callback=${callbackName}`;
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return mapsLoader;
}

export function ShelterMap({
  title,
  unavailableLabel,
  openInMapsLabel,
}: {
  title: string;
  unavailableLabel: string;
  openInMapsLabel: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey || !containerRef.current) {
      setStatus("error");
      return;
    }

    let cancelled = false;

    loadGoogleMaps(apiKey)
      .then(async () => {
        if (cancelled || !containerRef.current) return;
        const { Map } = (await google.maps.importLibrary("maps")) as google.maps.MapsLibrary;
        const { Marker } = (await google.maps.importLibrary("marker")) as google.maps.MarkerLibrary;

        const map = new Map(containerRef.current, {
          center: SHELTER_COORDS,
          zoom: 14,
          styles: MAP_STYLES,
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: true,
        });

        new Marker({
          map,
          position: SHELTER_COORDS,
          title,
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(PIN_SVG)}`,
            scaledSize: new google.maps.Size(34, 44),
            anchor: new google.maps.Point(17, 44),
          },
        });

        if (!cancelled) setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey, title]);

  if (status === "error") {
    return (
      <a
        href={SHELTER_MAPS_URL}
        target="_blank"
        rel="noreferrer"
        className="aspect-video rounded-2xl bg-[repeating-linear-gradient(135deg,#dedcdd_0_12px,#d5d3d4_12px_24px)] grid place-items-center hover:opacity-90"
      >
        <span className="font-mono text-[11.5px] opacity-50">
          {apiKey ? unavailableLabel : openInMapsLabel}
        </span>
      </a>
    );
  }

  return (
    <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#e8e7e8]">
      <div ref={containerRef} className="absolute inset-0" />
      {status === "loading" && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <span className="font-mono text-[11.5px] opacity-50">{title}</span>
        </div>
      )}
    </div>
  );
}
