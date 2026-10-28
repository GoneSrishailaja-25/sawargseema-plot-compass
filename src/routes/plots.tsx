import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
  const [open, setOpen] = useState<Plot | null>(null);

  const list = useMemo(() => {
    const r = plots.filter(
      (p) =>
        (!q || String(p.plot_number).includes(q.trim())) &&
        (!phase || p.phase_id === phase) &&
        (!facing || p.facing === facing) &&
        (!status || p.status === status) &&
        (!maxPrice || Number(p.total_price) <= Number(maxPrice) * 100000),
    );
    const by: Record<string, (a: Plot, b: Plot) => number> = {
      number: (a, b) => a.plot_number - b.plot_number,
      "price-asc": (a, b) => Number(a.total_price) - Number(b.total_price),
      "price-desc": (a, b) => Number(b.total_price) - Number(a.total_price),
      "size-asc": (a, b) => Number(a.size_sqyd) - Number(b.size_sqyd),
      "size-desc": (a, b) => Number(b.size_sqyd) - Number(a.size_sqyd),
    };
    return [...r].sort(by[sort]);
  }, [plots, q, phase, facing, status, maxPrice, sort]);

  const phaseName = (id: string | null) => phases.find((p) => p.id === id)?.name ?? "—";

  return (
    <>
      <PageHeader title="Our Plots" sub="Sample plots for demonstration. Click any plot for full details." />
      <div className="mx-auto max-w-7xl px-4 py-8">
        {loading ? null : !user ? (
          <LoginRequired what="plots and prices" />
        ) : (
          <>
            <div className="mb-6 flex flex-wrap gap-2">
              <Input placeholder="Plot no." value={q} onChange={(e) => setQ(e.target.value)} className="w-28" />
              <select className={sel} value={phase} onChange={(e) => setPhase(e.target.value)}>
                <option value="">All phases</option>
                {phases.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select className={sel} value={facing} onChange={(e) => setFacing(e.target.value)}>
                <option value="">Any facing</option>
                {FACINGS.map((f) => <option key={f} value={f}>{cap(f)}</option>)}
              </select>
              <select className={sel} value={status} onChange={(e) => setStatus(e.target.value)}>
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
              <span className="ml-auto self-center text-sm text-muted-foreground">{list.length} plots</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {list.map((p) => (
                <button key={p.id} onClick={() => setOpen(p)} className="rounded-xl border bg-card p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:border-primary">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-lg font-bold">Plot {p.plot_number}</p>
                    <Badge className={statusBadge[p.status]}>{cap(p.status)}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{phaseName(p.phase_id)} · {cap(p.facing)} facing</p>
                  <p className="mt-3 text-sm">{Number(p.size_sqyd)} sq.yd · {p.dimensions}</p>
                  <p className="text-xs text-muted-foreground">{inr(Number(p.price_per_sqyd))} / sq.yd</p>
                  <p className="mt-2 font-display text-xl font-bold text-primary">{inr(Number(p.total_price))}</p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <PlotDetailDialog plot={open} onClose={() => setOpen(null)} />
    </>
  );
}
