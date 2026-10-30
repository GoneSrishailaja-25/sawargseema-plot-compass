import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PlotMap } from "@/components/site/PlotMap";
import { PlotComparison } from "@/components/site/PlotComparison";
import { filterPlots, missingPlotDetails } from "@/lib/plot-information";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoginRequired, PageHeader } from "@/components/site/SiteChrome";
import { PlotDetailDialog, statusBadge } from "@/components/site/PlotDetail";
import { useAuth } from "@/lib/auth";
import { cap, FACINGS, inr, phasesQuery, plotsQuery, STATUSES, type Plot } from "@/lib/data";

export const Route = createFileRoute("/plots")({
  head: () => ({
    meta: [
      { title: "Our Plots & Prices — Sawargseema Ventures" },
      { name: "description", content: "Search, filter and sort plots by size, price, phase, direction and availability." },
      { property: "og:title", content: "Plots & Prices — Sawargseema Ventures" },
      { property: "og:description", content: "Find the right plot by size, price and facing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Plots,
});

const sel = "h-9 rounded-md border bg-background px-2 text-sm";

function Plots() {
  const { user, loading } = useAuth();
  const { data: plots = [] } = useQuery(plotsQuery);
  const { data: phases = [] } = useQuery(phasesQuery);
  const [q, setQ] = useState("");
  const [phase, setPhase] = useState("");
  const [facing, setFacing] = useState("");
  const [status, setStatus] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("number");
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");
  const [quality, setQuality] = useState("");
  const [view, setView] = useState("list");
  const [compared, setCompared] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [open, setOpen] = useState<Plot | null>(null);

  const list = useMemo(() => {
    const r = filterPlots(plots, { search: q, phase, facing, status, maxPrice, minArea, maxArea, quality });
    const by: Record<string, (a: Plot, b: Plot) => number> = {
      number: (a, b) => a.plot_number - b.plot_number,
      "price-asc": (a, b) => Number(a.total_price) - Number(b.total_price),
      "price-desc": (a, b) => Number(b.total_price) - Number(a.total_price),
      "size-asc": (a, b) => Number(a.size_sqyd) - Number(b.size_sqyd),
      "size-desc": (a, b) => Number(b.size_sqyd) - Number(a.size_sqyd),
    };
    return [...r].sort(by[sort]);
  }, [plots, q, phase, facing, status, maxPrice, minArea, maxArea, quality, sort]);

  const phaseName = (id: string | null) => phases.find((p) => p.id === id)?.name ?? "—";

  return (
    <>
      <PageHeader title="Our Plots" sub="Plot information and availability" />
      <div className="mx-auto max-w-7xl px-4 py-8">
        {loading ? null : !user ? (
          <LoginRequired what="plots and prices" />
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-2"><Button variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")}>Plots</Button><Button variant={view === "map" ? "default" : "outline"} onClick={() => setView("map")}>Map</Button><Button variant="outline" disabled={compared.length < 2} onClick={() => setCompareOpen(true)}>Compare ({compared.length})</Button>{compared.length > 0 && <Button variant="ghost" onClick={() => setCompared([])}>Clear comparison</Button>}</div>
            <div className="mb-6 flex flex-wrap gap-2">
              <Input aria-label="Search plots" placeholder="Plot no. or location" value={q} onChange={(e) => setQ(e.target.value)} className="w-56" />
              <select aria-label="Phase" className={sel} value={phase} onChange={(e) => setPhase(e.target.value)}>
                <option value="">All phases</option>
                {phases.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select aria-label="Facing" className={sel} value={facing} onChange={(e) => setFacing(e.target.value)}>
                <option value="">Any facing</option>
                {FACINGS.map((f) => <option key={f} value={f}>{cap(f)}</option>)}
              </select>
              <select aria-label="Status" className={sel} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Any status</option>
                {STATUSES.map((s) => <option key={s} value={s}>{cap(s)}</option>)}
              </select>
              <Input placeholder="Max price (₹ lakh)" type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-40" />
              <select className={sel} value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="number">Sort: Plot no.</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="size-asc">Size: small to large</option>
                <option value="size-desc">Size: large to small</option>
              </select>
              <Input aria-label="Minimum area" placeholder="Min sq.yd" type="number" min="0" value={minArea} onChange={e => setMinArea(e.target.value)} className="w-32" /><Input aria-label="Maximum area" placeholder="Max sq.yd" type="number" min="0" value={maxArea} onChange={e => setMaxArea(e.target.value)} className="w-32" /><select aria-label="Information quality" className={sel} value={quality} onChange={e => setQuality(e.target.value)}><option value="">All information</option><option value="verified">Admin-verified</option><option value="unverified">Unverified</option><option value="missing">Missing details</option></select><Button variant="ghost" onClick={() => { setQ(""); setPhase(""); setFacing(""); setStatus(""); setMaxPrice(""); setMinArea(""); setMaxArea(""); setQuality(""); }}>Reset filters</Button>
               <span className="ml-auto self-center text-sm text-muted-foreground">{list.length} plots</span>
            </div>
            {view === "map" && <div className="mb-6"><PlotMap plots={list} onSelect={setOpen} /></div>}
            {!list.length && <p className="py-8 text-muted-foreground">No plots match these filters.</p>}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {list.map((p) => (
                <article key={p.id} className="rounded-lg border bg-card p-4 shadow-card">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-lg font-bold">Plot {p.plot_number}</p>
                    <Badge className={statusBadge[p.status]}>{cap(p.status)}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{phaseName(p.phase_id)} · {cap(p.facing)} facing</p>
                  <p className="mt-3 text-sm">{Number(p.size_sqyd)} sq.yd · {p.dimensions}</p>
                  <p className="text-xs text-muted-foreground">{Number(p.price_per_sqyd) > 0 ? `${inr(Number(p.price_per_sqyd))} / sq.yd` : "Price not provided"}</p>
                  <p className="mt-2 font-display text-xl font-bold text-primary">{p.total_price !== null && Number(p.price_per_sqyd) > 0 ? inr(Number(p.total_price)) : "Price not provided"}</p>
                <p className="mt-2 text-xs text-muted-foreground">{p.information_verified ? "Admin-verified details" : "Unverified details"}</p>{missingPlotDetails(p).length > 0 && <p className="mt-1 text-xs text-destructive">Missing: {missingPlotDetails(p).join(", ")}</p>}<div className="mt-4 flex items-center justify-between gap-2"><Button size="sm" variant="outline" onClick={() => setOpen(p)}>Details</Button><label className="flex items-center gap-2 text-xs"><Checkbox aria-label={`Compare Plot ${p.plot_number}`} checked={compared.includes(p.id)} onCheckedChange={checked => setCompared(ids => checked ? [...ids, p.id] : ids.filter(id => id !== p.id))} />Compare</label></div></article>
              ))}
            </div>
          </>
        )}
      </div>
      <PlotComparison plots={plots.filter(p => compared.includes(p.id))} phases={phases} open={compareOpen} onClose={() => setCompareOpen(false)} />
      <PlotDetailDialog plot={open} onClose={() => setOpen(null)} />
    </>
  );
}
