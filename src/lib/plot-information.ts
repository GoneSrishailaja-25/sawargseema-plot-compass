import type { Plot } from "@/lib/data";

export function hasCoordinates(p: Pick<Plot, "latitude" | "longitude">) {
  return p.latitude !== null && p.longitude !== null && Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && Math.abs(p.latitude) <= 90 && Math.abs(p.longitude) <= 180;
}

export function missingPlotDetails(p: Plot) {
  const missing: string[] = [];
  if (!(Number(p.size_sqyd) > 0)) missing.push("Area");
  if (!p.dimensions.trim()) missing.push("Dimensions");
  if (!p.location_note.trim()) missing.push("Location");
  if (!hasCoordinates(p)) missing.push("Coordinates");
  if (!(Number(p.price_per_sqyd) > 0) || p.total_price === null) missing.push("Price");
  return missing;
}

export type PlotFilters = { search: string; phase: string; facing: string; status: string; maxPrice: string; minArea: string; maxArea: string; quality: string };
export const emptyFilters: PlotFilters = { search: "", phase: "", facing: "", status: "", maxPrice: "", minArea: "", maxArea: "", quality: "" };
export function filterPlots(plots: Plot[], f: PlotFilters) {
  const query = f.search.trim().toLowerCase();
  return plots.filter(p => (!query || `${p.plot_number} ${p.location_note} ${p.dimensions} ${p.amenities}`.toLowerCase().includes(query)) &&
    (!f.phase || p.phase_id === f.phase) && (!f.facing || p.facing === f.facing) && (!f.status || p.status === f.status) &&
    (!f.maxPrice || (p.total_price !== null && Number(p.total_price) <= Number(f.maxPrice) * 100000)) &&
    (!f.minArea || Number(p.size_sqyd) >= Number(f.minArea)) && (!f.maxArea || Number(p.size_sqyd) <= Number(f.maxArea)) &&
    (!f.quality || (f.quality === "verified" ? p.information_verified : f.quality === "missing" ? missingPlotDetails(p).length > 0 : !p.information_verified)));
}