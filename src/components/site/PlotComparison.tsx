import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cap, inr, num, type Plot, type Phase } from "@/lib/data";
import { hasCoordinates, missingPlotDetails } from "@/lib/plot-information";

export function PlotComparison({ plots, phases, open, onClose }: { plots: Plot[]; phases: Phase[]; open: boolean; onClose: () => void }) {
  const rows: [string, (p: Plot) => string][] = [
    ["Status", p => cap(p.status)], ["Area (sq.yd)", p => num(Number(p.size_sqyd))],
    ["Dimensions", p => p.dimensions || "Missing"], ["Location", p => p.location_note || "Missing"],
    ["Coordinates", p => hasCoordinates(p) ? `${p.latitude}, ${p.longitude}` : "Missing"],
    ["Price / sq.yd", p => Number(p.price_per_sqyd) > 0 ? inr(Number(p.price_per_sqyd)) : "Not provided"],
    ["Total price", p => p.total_price !== null && Number(p.price_per_sqyd) > 0 ? inr(Number(p.total_price)) : "Not provided"],
    ["Phase", p => phases.find(ph => ph.id === p.phase_id)?.name ?? "Unassigned"], ["Facing", p => cap(p.facing)],
    ["Information", p => p.information_verified ? "Admin-verified" : "Unverified"],
    ["Missing details", p => missingPlotDetails(p).join(", ") || "None"],
  ];
  return <Dialog open={open} onOpenChange={o => !o && onClose()}><DialogContent className="max-h-[90vh] max-w-4xl overflow-auto"><DialogHeader><DialogTitle>Compare plots</DialogTitle></DialogHeader><Table><TableHeader><TableRow><TableHead>Detail</TableHead>{plots.map(p => <TableHead key={p.id} className="min-w-40">Plot {p.plot_number}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.map(([label, value]) => <TableRow key={label}><TableCell className="font-semibold">{label}</TableCell>{plots.map(p => <TableCell key={p.id} className="whitespace-normal">{value(p)}</TableCell>)}</TableRow>)}</TableBody></Table></DialogContent></Dialog>;
}