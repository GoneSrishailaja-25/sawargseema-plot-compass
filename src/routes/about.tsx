import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/site/SiteChrome";
import { num, phasesQuery, ventureQuery } from "@/lib/data";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Sawargseema Ventures" },
      { name: "description", content: "About the venture, its phases, location and total area." },
      { property: "og:title", content: "About Sawargseema Ventures" },
      { property: "og:description", content: "Venture details, phases and location." },
    ],
  }),
  component: About,
});

function About() {
  const { data: v } = useQuery(ventureQuery);
  const { data: phases = [] } = useQuery(phasesQuery);
  return (
    <>
      <PageHeader title={`About ${v?.name ?? ""}`} sub={v?.tagline ?? ""} />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-3">
        <div className="md:col-span-2">
          <p className="whitespace-pre-line leading-relaxed">{v?.about}</p>
          <h2 className="mt-10 text-xl font-bold text-navy">Phases</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {phases.map((p) => (
              <div key={p.id} className="rounded-xl border bg-card p-4 shadow-card">
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-muted-foreground">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
        <aside className="h-fit space-y-3 rounded-xl border bg-secondary p-6 text-sm">
          <p><span className="text-muted-foreground">Location:</span> {v?.location}</p>
          <p><span className="text-muted-foreground">Total area:</span> {num(Number(v?.total_area_sqyd ?? 0))} sq.yd</p>
          <p><span className="text-muted-foreground">Office:</span> {v?.address}</p>
          <p><span className="text-muted-foreground">Phone:</span> {v?.phone}</p>
        </aside>
      </div>
    </>
  );
}
