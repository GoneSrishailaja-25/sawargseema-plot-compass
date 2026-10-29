import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import type { Plot } from "@/lib/data";
import { hasCoordinates } from "@/lib/plot-information";

let mapsPromise: Promise<void> | undefined;
function loadMaps() {
  if (!mapsPromise) mapsPromise = new Promise<void>((resolve, reject) => {
    if (window.google?.maps?.Map) { resolve(); return; }
    const key = import.meta.env['VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY'];
    if (!key) { reject(new Error("Google Maps is not connected.")); return; }
    window.initPlotMap = resolve;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&callback=initPlotMap&channel=${encodeURIComponent(import.meta.env['VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID'] ?? '')}&language=en&region=IN`;
    script.async = true;
    script.onerror = () => { mapsPromise = undefined; reject(new Error("Google Maps could not load. Please try again later.")); };
    document.head.appendChild(script);
  });
  return mapsPromise;
}
declare global { interface Window { initPlotMap?: () => void } }

export function PlotMap({ plots, onSelect }: { plots: Plot[]; onSelect: (p: Plot) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const mapped = plots.filter(hasCoordinates);
  useEffect(() => {
    if (!plots.some(hasCoordinates)) return;
    let cancelled = false;
    let markers: google.maps.Marker[] = [];
    void loadMaps().then(() => {
      if (cancelled || !container.current) return;
      const map = new google.maps.Map(container.current, { zoom: 17, mapTypeId: "satellite", clickableIcons: false, streetViewControl: false, fullscreenControl: true });
      const bounds = new google.maps.LatLngBounds();
      const colors = getComputedStyle(document.documentElement);
      markers = plots.filter(hasCoordinates).flatMap(p => {
        if (p.latitude === null || p.longitude === null) return [];
        const position = { lat: p.latitude, lng: p.longitude };
        bounds.extend(position);
        const marker = new google.maps.Marker({ map, position, title: `Plot ${p.plot_number} · ${p.status} · ${p.information_verified ? 'Admin-verified details' : 'Unverified details'}`, label: { text: String(p.plot_number), color: colors.getPropertyValue('--primary-foreground').trim() }, icon: { path: google.maps.SymbolPath.CIRCLE, scale: 19, fillColor: colors.getPropertyValue(`--${p.status}`).trim(), fillOpacity: 1, strokeColor: colors.getPropertyValue('--foreground').trim(), strokeWeight: 1 } });
        marker.addListener("click", () => onSelect(p));
        return [marker];
      });
      if (markers.length === 1) { map.setCenter(bounds.getCenter()); map.setZoom(18); } else map.fitBounds(bounds, 50);
    }).catch((e: Error) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; markers.forEach(m => { google.maps.event.clearInstanceListeners(m); m.setMap(null); }); };
  }, [plots, onSelect]);
  return <section className="space-y-3">
    <div className="flex flex-wrap justify-between gap-2 text-sm"><span>{mapped.length} mapped · {plots.length - mapped.length} without coordinates</span><span className="text-muted-foreground">Saved plot locations · boundaries not surveyed</span></div>
    <div className="relative h-[480px] overflow-hidden rounded-md border bg-muted">
      <div ref={container} className="h-full w-full" aria-label="Plot location map" />
      {(!mapped.length || error) && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center"><MapPin className="h-8 w-8 text-muted-foreground" /><p>{error || "No saved coordinates for these plots."}</p><p className="text-sm text-muted-foreground">{error ? "Plot details remain available below." : "Missing locations are not placed on the map."}</p></div>}
    </div>
    <div className="flex flex-wrap gap-4 text-xs">{["available", "reserved", "sold"].map(s => <span key={s} className="flex items-center gap-2 capitalize"><span className={s === "available" ? "h-3 w-3 rounded-full bg-available" : s === "reserved" ? "h-3 w-3 rounded-full bg-reserved" : "h-3 w-3 rounded-full bg-sold"} />{s}</span>)}</div>
  </section>;
}