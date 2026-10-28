import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Phase, Plot } from "@/lib/data";

const tile: Record<string, string> = {
  available: "bg-available/90 hover:bg-available",
  reserved: "bg-reserved/90 hover:bg-reserved",
  sold: "bg-sold/90 hover:bg-sold",
};

/** Illustrative layout: each phase is a block of plots split by an internal road. */
export function PlotLayout({ plots, phases, onSelect }: { plots: Plot[]; phases: Phase[]; onSelect: (p: Plot) => void }) {
  const [phaseId, setPhaseId] = useState<string>("all");
  const shown = phaseId === "all" ? phases : phases.filter((p) => p.id === phaseId);
  const unassigned = plots.filter((p) => !p.phase_id || !phases.some((ph) => ph.id === p.phase_id));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button size="sm" variant={phaseId === "all" ? "default" : "outline"} onClick={() => setPhaseId("all")}>All phases</Button>
        {phases.map((ph) => (
          <Button key={ph.id} size="sm" variant={phaseId === ph.id ? "default" : "outline"} onClick={() => setPhaseId(ph.id)}>{ph.name}</Button>
        ))}
        <div className="ml-auto flex gap-3 text-xs">
          {(["available", "reserved", "sold"] as const).map((s) => (
            <span key={s} className="flex items-center gap-1 capitalize"><span className={cn("h-3 w-3 rounded-sm", tile[s])} />{s}</span>
          ))}
        </div>
      </div>

      <div className="relative rounded-2xl border-4 border-primary/30 bg-muted p-4 md:p-8">
        <Compass />
        <div className="space-y-6">
          {shown.map((ph) => (
            <Block key={ph.id} title={ph.name} plots={plots.filter((p) => p.phase_id === ph.id)} onSelect={onSelect} />
          ))}
          {phaseId === "all" && unassigned.length > 0 && <Block title="Unassigned" plots={unassigned} onSelect={onSelect} />}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">Illustrative layout — not an approved layout plan.</p>
      </div>
    </div>
  );
}

function Block({ title, plots, onSelect }: { title: string; plots: Plot[]; onSelect: (p: Plot) => void }) {
  const half = Math.ceil(plots.length / 2);
  const rows = [plots.slice(0, half), plots.slice(half)];
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-navy">{title}</p>
      {rows.map((row, i) => (
        <div key={i}>
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-8">
            {row.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                className={cn("aspect-[4/5] rounded-md text-sm font-bold text-primary-foreground shadow-sm transition hover:scale-105", tile[p.status])}
                title={`Plot ${p.plot_number} · ${p.status}`}
              >
                {p.plot_number}
              </button>
            ))}
          </div>
          {i === 0 && <div className="my-2 h-6 rounded bg-navy/80 text-center text-[10px] leading-6 tracking-widest text-navy-foreground">30 FT ROAD</div>}
        </div>
      ))}
    </div>
  );
}

function Compass() {
  return (
    <div className="absolute right-3 top-3 grid h-16 w-16 grid-cols-3 grid-rows-3 place-items-center rounded-full border bg-card text-[10px] font-bold text-navy shadow-card md:right-6 md:top-6">
      <span className="col-start-2">N</span>
      <span className="col-start-1 row-start-2">W</span>
      <span className="col-start-2 row-start-2 text-accent">✦</span>
      <span className="col-start-3 row-start-2">E</span>
      <span className="col-start-2 row-start-3">S</span>
    </div>
  );
}
