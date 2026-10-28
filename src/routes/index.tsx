import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone, ShieldCheck, Route as RoadIcon, Trees } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { Button } from "@/components/ui/button";
import { Charts, StatCards } from "@/components/site/Stats";
import { phasesQuery, plotsQuery, ventureQuery } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sawargseema Ventures — Open Plots for Sale" },
      { name: "description", content: "Live plot availability, prices per square yard and an interactive layout of Sawargseema Ventures." },
      { property: "og:title", content: "Sawargseema Ventures — Open Plots for Sale" },
      { property: "og:description", content: "Live plot availability, prices and interactive layout." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: v } = useQuery(ventureQuery);
  const { data: plots = [] } = useQuery(plotsQuery);
  const { data: phases = [] } = useQuery(phasesQuery);

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <img src={hero} alt="Aerial view of the venture layout" width={1600} height={640} className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-hero-overlay" />
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-28 text-navy-foreground md:pt-40">
          <p className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            <MapPin className="h-3.5 w-3.5" /> {v?.location}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold md:text-6xl">{v?.name}</h1>
          <p className="mt-4 max-w-xl text-lg opacity-90">{v?.tagline}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to="/layout">Explore layout</Link></Button>
            <Button asChild size="lg" variant="secondary"><Link to="/plots">View plots & prices</Link></Button>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-10 max-w-7xl px-4">
        <StatCards plots={plots} totalArea={Number(v?.total_area_sqyd ?? 0)} />
      </section>

      <section className="mx-auto mt-16 grid max-w-7xl gap-6 px-4 md:grid-cols-3">
        {[
          { icon: RoadIcon, t: "Wide internal roads", d: "Planned 30 ft roads with clear plot boundaries." },
          { icon: Trees, t: "Green surroundings", d: "Avenue plantation and a central park area." },
          { icon: ShieldCheck, t: "Transparent records", d: "Live status for every plot to avoid double booking." },
        ].map((f) => (
          <div key={f.t} className="rounded-xl border bg-card p-6 shadow-card">
            <f.icon className="h-6 w-6 text-primary" />
            <p className="mt-3 font-display font-semibold">{f.t}</p>
            <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto mt-16 max-w-7xl px-4">
        <h2 className="mb-6 text-2xl font-bold text-navy">Venture at a glance</h2>
        <Charts plots={plots} phases={phases} full={false} />
      </section>

      <section className="mx-auto mt-16 max-w-7xl px-4">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-primary p-8 text-primary-foreground md:flex-row md:items-center">
          <div>
            <p className="font-display text-xl font-bold">Visit the site or talk to our team</p>
            <p className="mt-1 flex items-center gap-2 opacity-90"><Phone className="h-4 w-4" /> {v?.phone}</p>
          </div>
          <Button asChild variant="secondary"><Link to="/contact">Contact us</Link></Button>
        </div>
      </section>
    </>
  );
}
