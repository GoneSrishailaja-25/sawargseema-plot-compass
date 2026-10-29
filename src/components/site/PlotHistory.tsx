import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cap } from "@/lib/data";

export function PlotHistory({ userId }: { userId: string }) {
  const { data = [], isPending, error } = useQuery({ queryKey: ["plot-history", userId], queryFn: async () => {
    const result = await supabase.from("plot_history").select("*").order("changed_at", { ascending: false }).limit(200);
    if (result.error) throw result.error;
    return result.data;
  }, refetchInterval: 15000 });
  return <section><h2 className="mb-4 text-xl font-semibold">Plot change history</h2>{isPending ? <p>Loading history…</p> : error ? <p className="text-destructive">Could not load history.</p> : !data.length ? <p className="text-muted-foreground">No recorded changes yet. History starts with updates made after this feature was added.</p> : <div className="divide-y">{data.map(h => {
    const before = (h.before_data ?? {}) as Record<string, unknown>;
    const after = (h.after_data ?? {}) as Record<string, unknown>;
    const fields = Object.keys(h.action === "DELETE" ? before : after).filter(k => !["id", "created_at", "updated_at"].includes(k) && (h.action !== "UPDATE" || JSON.stringify(before[k]) !== JSON.stringify(after[k])));
    const show = (v: unknown) => v === null || v === undefined || v === "" ? "Not provided" : String(v);
    return <article key={h.id} className="space-y-2 py-4"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">Plot {h.plot_number} · {cap(h.action.toLowerCase())}</h3><time className="text-xs text-muted-foreground">{new Date(h.changed_at).toLocaleString("en-IN")}</time></div><p className="break-all text-xs text-muted-foreground">Changed by: {h.changed_by ?? "System"}</p><dl className="grid gap-2 text-sm sm:grid-cols-2">{fields.map(k => <div key={k} className="break-words"><dt className="text-muted-foreground">{cap(k.replaceAll("_", " "))}</dt><dd>{h.action === "UPDATE" ? `${show(before[k])} → ${show(after[k])}` : show(h.action === "DELETE" ? before[k] : after[k])}</dd></div>)}</dl></article>;
  })}</div>}</section>;
}