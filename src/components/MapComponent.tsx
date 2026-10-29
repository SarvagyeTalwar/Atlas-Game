// src/components/MapComponent.tsx
"use client";

import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface PlaceMarker {
  id: string;
  name: string;
  type: string;
  countryName?: string;
  coordinates: [number, number];
  playedBy: "child" | "ai";
}

interface MapProps {
  markers: PlaceMarker[];
  activeLocation: [number, number] | null;
  journeyActive: boolean;
  journeyStepIndex: number;
}

export default function MapComponent({
  markers,
  activeLocation,
  journeyActive,
  journeyStepIndex,
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 10,
      zoomControl: false,
    });

    // Place zoom control in bottom-right for clean top area
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // 100% Free, Keyless OpenStreetMap Tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // The map can mount inside the hidden mobile tab. Recalculate once that
    // panel becomes visible so Leaflet doesn't keep the initial zero-size view.
    const resizeObserver = new ResizeObserver(() => {
      if (mapContainerRef.current?.clientWidth && mapContainerRef.current.clientHeight) {
        map.invalidateSize({ pan: false });
      }
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Build safe popup content using DOM nodes (no raw HTML interpolation)
  const buildPopupElement = useCallback(
    (m: PlaceMarker): HTMLDivElement => {
      const container = document.createElement("div");
      container.style.cssText = "text-align:center; padding:6px; min-width:150px; font-family:system-ui,sans-serif;";

      const nameEl = document.createElement("div");
      nameEl.textContent = m.name;
      nameEl.style.cssText = "font-weight:800; font-size:15px; color:#1c1917; margin-bottom:2px;";
      container.appendChild(nameEl);

      const typeEl = document.createElement("div");
      typeEl.textContent = m.type + (m.countryName && m.countryName !== m.name ? ` · ${m.countryName}` : "");
      typeEl.style.cssText = "font-size:11px; color:#78716c; font-weight:600;";
      container.appendChild(typeEl);

      const playedEl = document.createElement("div");
      playedEl.textContent = `Played by ${m.playedBy === "child" ? "You" : "Atlas Guide"}`;
      playedEl.style.cssText = `font-size:10px; font-weight:700; margin-top:4px; color:${m.playedBy === "child" ? "#0f766e" : "#4338ca"};`;
      container.appendChild(playedEl);

      // Wikipedia Link
      const wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(m.name.replace(/\s+/g, "_"))}`;
      const divider = document.createElement("div");
      divider.style.cssText = "border-top:1px solid #e7e5e4; margin-top:8px; padding-top:6px;";

      const wikiLink = document.createElement("a");
      wikiLink.href = wikiUrl;
      wikiLink.target = "_blank";
      wikiLink.rel = "noopener noreferrer";
      wikiLink.textContent = "📖 Learn on Wikipedia ↗";
      wikiLink.style.cssText = "display:inline-block; padding:3px 10px; background:#f0f9ff; border:1px solid #bae6fd; border-radius:999px; font-size:11px; font-weight:700; color:#0369a1; text-decoration:none; transition:background 0.15s;";
      wikiLink.onmouseenter = () => { wikiLink.style.background = "#e0f2fe"; };
      wikiLink.onmouseleave = () => { wikiLink.style.background = "#f0f9ff"; };

      divider.appendChild(wikiLink);
      container.appendChild(divider);

      return container;
    },
    []
  );

  // Update Markers & Flight Path
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    // Flight Path Polyline
    const pathCoords: [number, number][] = markers.map((m) => m.coordinates);

    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (pathCoords.length > 1) {
      polylineRef.current = L.polyline(pathCoords, {
        color: journeyActive ? "#d97706" : "#6366f1",
        weight: journeyActive ? 3.5 : 2,
        opacity: journeyActive ? 0.9 : 0.5,
        dashArray: journeyActive ? undefined : "5, 8",
      }).addTo(map);
    }

    // Add individual markers with opacity fading for older ones
    const totalMarkers = markers.length;
    markers.forEach((m, idx) => {
      const isLatest = idx >= totalMarkers - 2; // Last two (kid + ai) are bright
      const isCurrentJourneyStop = journeyActive && idx === journeyStepIndex;
      const isChild = m.playedBy === "child";

      // Compute opacity: latest markers = full, older = faded
      const opacity = isLatest || isCurrentJourneyStop ? 1.0 : 0.55;

      // Determine marker visual style
      let bgColor: string;
      let ringStyle: string;
      let scale: string;

      if (isCurrentJourneyStop) {
        bgColor = "#d97706";
        ringStyle = "box-shadow: 0 0 0 4px #fde68a, 0 2px 8px rgba(0,0,0,0.15);";
        scale = "transform: scale(1.35);";
      } else if (isLatest) {
        bgColor = isChild ? "#0f766e" : "#4338ca";
        ringStyle = "box-shadow: 0 0 0 3px white, 0 2px 6px rgba(0,0,0,0.2);";
        scale = "";
      } else {
        bgColor = isChild ? "#5eead4" : "#a5b4fc";
        ringStyle = "box-shadow: 0 1px 3px rgba(0,0,0,0.12);";
        scale = "";
      }

      const markerLabel = isChild ? "N" : "A"; // N = Navigator, A = Atlas

      const iconHtml = `
        <div style="display:flex; flex-direction:column; align-items:center; opacity:${opacity}; transition:opacity 0.3s;">
          <div style="width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:12px; font-weight:800; background:${bgColor}; ${ringStyle} ${scale} transition:transform 0.3s; font-family:system-ui,sans-serif;">
            ${markerLabel}
          </div>
          ${isLatest || isCurrentJourneyStop ? `
            <div style="margin-top:4px; background:rgba(28,25,23,0.82); color:white; padding:1px 7px; border-radius:4px; font-size:10px; font-weight:600; white-space:nowrap; font-family:system-ui,sans-serif; backdrop-filter:blur(4px);">
              ${m.name.length > 18 ? m.name.substring(0, 16) + "…" : m.name}
            </div>
          ` : ""}
        </div>
      `;

      const customIcon = L.divIcon({
        className: "",
        html: iconHtml,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const marker = L.marker(m.coordinates, { icon: customIcon });
      marker.bindPopup(buildPopupElement(m), {
        maxWidth: 220,
        className: "atlas-popup",
      });
      layer.addLayer(marker);
    });
  }, [markers, journeyActive, journeyStepIndex, buildPopupElement]);

  // Smooth Camera FlyTo when active location changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activeLocation) return;

    map.flyTo(activeLocation, 5, {
      duration: journeyActive ? 1.0 : 1.8,
      easeLinearity: 0.25,
    });
  }, [activeLocation, journeyActive]);

  return (
    <div className="relative h-full w-full min-h-[350px] overflow-hidden rounded-2xl border-2 border-stone-200 bg-stone-100 shadow-inner">
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
}
