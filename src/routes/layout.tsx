import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LoginRequired, PageHeader } from "@/components/site/SiteChrome";
import { PlotLayout } from "@/components/site/PlotLayout";
import { PlotDetailDialog } from "@/components/site/PlotDetail";
import { useAuth } from "@/lib/auth";
import { phasesQuery, plotsQuery, type Plot } from "@/lib/data";

export const Route = createFileRoute("/layout")({
  head: () => ({
    meta: [
      { title: "Interactive Plot Layout — Sawargseema Ventures" },
      { name: "description", content: "Colour-coded layout of every plot: available, reserved and sold." },
      { property: "og:title", content: "Interactive Plot Layout — Sawargseema Ventures" },
      { property: "og:description", content: "Tap any plot to see size, price, phase and facing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LayoutPage,
});

function LayoutPage() {
  const { user, loading } = useAuth();
  const { data: plots = [] } = useQuery(plotsQuery);
  const { data: phases = [] } = useQuery(phasesQuery);
  const [open, setOpen] = useState<Plot | null>(null);
  return (
    <>
      <PageHeader title="Plot Layout" sub="Green = available, orange = reserved, red = sold. Tap a plot for details." />
      <div className="mx-auto max-w-7xl px-4 py-8">
        {loading ? null : user ? <PlotLayout plots={plots} phases={phases} onSelect={setOpen} /> : <LoginRequired what="the plot layout" />}
      </div>
      <PlotDetailDialog plot={open} onClose={() => setOpen(null)} />
    </>
  );
}
