import { useMemo } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { LandPlot, CheckCircle2, Clock, BadgeIndianRupee, Ruler } from "lucide-react";
import { computeStats, FACINGS, cap, num, type Phase, type Plot } from "@/lib/data";

const C = {
  available: "var(--available)",
  reserved: "var(--reserved)",
  sold: "var(--sold)",
};

export function StatCards({ plots, totalArea }: { plots: Plot[]; totalArea: number }) {
  const s = computeStats(plots);
  const items = [
    { label: "Total plots", value: s.total, icon: LandPlot, tone: "text-accent" },
    { label: "Available", value: s.available, icon: CheckCircle2, tone: "text-available" },
    { label: "Reserved", value: s.reserved, icon: Clock, tone: "text-reserved" },
    { label: "Sold", value: s.sold, icon: BadgeIndianRupee, tone: "text-sold" },
    { label: "Venture area (sq.yd)", value: num(totalArea), icon: Ruler, tone: "text-primary" },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {items.map((i) => (
        <div key={i.label} className="rounded-xl border bg-card p-4 shadow-card">
          <i.icon className={`h-5 w-5 ${i.tone}`} />
          <p className="mt-3 font-display text-2xl font-bold">{i.value}</p>
          <p className="text-xs text-muted-foreground">{i.label}</p>
        </div>
      ))}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-card">
      <p className="mb-3 text-sm font-semibold">{title}</p>
      <div className="h-64">{children}</div>
    </div>
  );
}

export function Charts({ plots, phases, full = true }: { plots: Plot[]; phases: Phase[]; full?: boolean }) {
  const d = useMemo(() => {
    const s = computeStats(plots);
    const status = [
      { name: "Available", value: s.available, fill: C.available },
      { name: "Reserved", value: s.reserved, fill: C.reserved },
      { name: "Sold", value: s.sold, fill: C.sold },
    ];
    const byPhase = phases.map((ph) => {
      const ps = plots.filter((p) => p.phase_id === ph.id);
      return {
        name: ph.name,
        Available: ps.filter((p) => p.status === "available").length,
        Reserved: ps.filter((p) => p.status === "reserved").length,
        Sold: ps.filter((p) => p.status === "sold").length,
      };
    });
    const byFacing = FACINGS.map((f) => ({
      name: cap(f),
      Available: plots.filter((p) => p.facing === f && p.status === "available").length,
      Total: plots.filter((p) => p.facing === f).length,
    }));
    const sizes = [...new Set(plots.map((p) => Number(p.size_sqyd)))].sort((a, b) => a - b);
    const bySize = sizes.map((sz) => {
      const prices = plots.filter((p) => Number(p.size_sqyd) === sz).map((p) => Number(p.total_price) / 100000);
      return { name: `${sz}`, Min: +Math.min(...prices).toFixed(1), Max: +Math.max(...prices).toFixed(1) };
    });
    const months: { name: string; Sales: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const count = plots.filter((p) => {
        if (!p.sold_at) return false;
        const sd = new Date(p.sold_at);
        return sd.getFullYear() === dt.getFullYear() && sd.getMonth() === dt.getMonth();
      }).length;
      months.push({ name: dt.toLocaleString("en-IN", { month: "short" }), Sales: count });
    }
    return { status, byPhase, byFacing, bySize, months };
  }, [plots, phases]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ChartCard title="Plot availability">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={d.status} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
              {d.status.map((e) => <Cell key={e.name} fill={e.fill} />)}
            </Pie>
            <Tooltip /><Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Plots by phase">
        <ResponsiveContainer>
          <BarChart data={d.byPhase}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} />
            <Tooltip /><Legend />
            <Bar dataKey="Available" stackId="a" fill={C.available} />
            <Bar dataKey="Reserved" stackId="a" fill={C.reserved} />
            <Bar dataKey="Sold" stackId="a" fill={C.sold} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      {full && (
        <>
          <ChartCard title="Availability by facing direction">
            <ResponsiveContainer>
              <BarChart data={d.byFacing}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} />
                <Tooltip /><Legend />
                <Bar dataKey="Total" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Available" fill={C.available} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Price range by plot size (₹ lakh, size in sq.yd)">
            <ResponsiveContainer>
              <BarChart data={d.bySize}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} />
                <Tooltip /><Legend />
                <Bar dataKey="Min" fill="var(--chart-5)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Max" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <div className="md:col-span-2">
            <ChartCard title="Monthly sales (last 12 months)">
              <ResponsiveContainer>
                <LineChart data={d.months}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="Sales" stroke="var(--chart-1)" strokeWidth={3} dot />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
