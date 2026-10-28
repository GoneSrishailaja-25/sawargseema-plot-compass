import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoginRequired, PageHeader } from "@/components/site/SiteChrome";
import { Charts, StatCards } from "@/components/site/Stats";
import { statusBadge } from "@/components/site/PlotDetail";
import { OwnershipWorkspace } from "@/components/site/OwnershipWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cap, FACINGS, inr, phasesQuery, plotsQuery, STATUSES, ventureQuery, type Plot, type PlotFacing, type PlotStatus } from "@/lib/data";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — Sawargseema Ventures" },
      { name: "description", content: "Manage plots, phases, enquiries and venture details." },
      { property: "og:title", content: "Admin Panel — Sawargseema Ventures" },
      { property: "og:description", content: "Venture administration." },
    ],
  }),
  component: Admin,
});

const sel = "h-9 w-full rounded-md border bg-background px-2 text-sm";

function downloadCsv(name: string, rows: object[]) {
  if (!rows.length) return void toast.info("Nothing to export");
  const keys = Object.keys(rows[0] ?? {});
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [keys.join(","), ...rows.map((r) => keys.map((k) => esc((r as Record<string, unknown>)[k])).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = name;
  a.click();
}

function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const { data: plots = [] } = useQuery(plotsQuery);
  const { data: phases = [] } = useQuery(phasesQuery);
  const { data: v } = useQuery(ventureQuery);

  if (loading) return null;
  if (!user) return <div className="py-12"><LoginRequired what="the admin panel" /></div>;
  if (!isAdmin) return <p className="py-20 text-center text-muted-foreground">You don't have admin access.</p>;

  return (
    <>
      <PageHeader title="Admin Panel" sub="All changes save instantly and update the website." />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Tabs defaultValue="dashboard">
          <TabsList className="flex h-auto flex-wrap">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="plots">Plots</TabsTrigger>
            <TabsTrigger value="phases">Phases</TabsTrigger>
            <TabsTrigger value="enquiries">Enquiries</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="venture">Venture details</TabsTrigger>
            <TabsTrigger value="ownership">Ownership</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="mt-6 space-y-6">
            <StatCards plots={plots} totalArea={Number(v?.total_area_sqyd ?? 0)} />
            <Charts plots={plots} phases={phases} />
          </TabsContent>
          <TabsContent value="plots" className="mt-6"><PlotsAdmin /></TabsContent>
          <TabsContent value="phases" className="mt-6"><PhasesAdmin /></TabsContent>
          <TabsContent value="enquiries" className="mt-6"><EnquiriesAdmin /></TabsContent>
          <TabsContent value="customers" className="mt-6"><CustomersAdmin /></TabsContent>
          <TabsContent value="venture" className="mt-6"><VentureAdmin /></TabsContent>
          <TabsContent value="ownership" className="mt-6"><OwnershipWorkspace userId={user.id} /></TabsContent>
        </Tabs>
      </div>
    </>
  );
}

type PlotForm = {
  id?: string; plot_number: string; phase_id: string; size_sqyd: string; price_per_sqyd: string;
  facing: PlotFacing; status: PlotStatus; dimensions: string; location_note: string; amenities: string;
};
const emptyPlot: PlotForm = { plot_number: "", phase_id: "", size_sqyd: "", price_per_sqyd: "", facing: "east", status: "available", dimensions: "", location_note: "", amenities: "" };

function PlotsAdmin() {
  const qc = useQueryClient();
  const { data: plots = [] } = useQuery(plotsQuery);
  const { data: phases = [] } = useQuery(phasesQuery);
  const [edit, setEdit] = useState<PlotForm | null>(null);
  const phaseName = (id: string | null) => phases.find((p) => p.id === id)?.name ?? "—";
  const refresh = () => qc.invalidateQueries({ queryKey: ["plots"] });

  const save = async () => {
    if (!edit) return;
    const n = Number(edit.plot_number), sz = Number(edit.size_sqyd), pr = Number(edit.price_per_sqyd);
    if (!Number.isInteger(n) || n <= 0) return void toast.error("Plot number must be a positive whole number");
    if (!(sz > 0)) return void toast.error("Size must be greater than 0");
    if (!(pr >= 0) || edit.price_per_sqyd === "") return void toast.error("Enter a valid price");
    const row = {
      plot_number: n, phase_id: edit.phase_id || null, size_sqyd: sz, price_per_sqyd: pr,
      facing: edit.facing, status: edit.status, dimensions: edit.dimensions, location_note: edit.location_note, amenities: edit.amenities,
    };
    const { error } = edit.id ? await supabase.from("plots").update(row).eq("id", edit.id) : await supabase.from("plots").insert(row);
    if (error) return void toast.error(error.message.includes("duplicate") ? "Plot number already exists" : error.message);
    toast.success("Plot saved");
    setEdit(null);
    refresh();
  };

  const quickStatus = async (p: Plot, status: PlotStatus) => {
    const { error } = await supabase.from("plots").update({ status }).eq("id", p.id);
    if (error) return void toast.error(error.message);
    refresh();
  };

  const del = async (p: Plot) => {
    if (!confirm(`Delete Plot ${p.plot_number}?`)) return;
    const { error } = await supabase.from("plots").delete().eq("id", p.id);
    if (error) return void toast.error(error.message);
    refresh();
  };

  const exportPlots = () =>
    downloadCsv("plots.csv", plots.map((p) => ({
      plot_number: p.plot_number, phase: phaseName(p.phase_id), size_sqyd: p.size_sqyd, price_per_sqyd: p.price_per_sqyd,
      total_price: p.total_price, facing: p.facing, status: p.status, dimensions: p.dimensions, sold_at: p.sold_at ?? "",
    })));

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <Button onClick={() => setEdit({ ...emptyPlot, plot_number: String((plots.at(-1)?.plot_number ?? 0) + 1), phase_id: phases[0]?.id ?? "" })}><Plus className="h-4 w-4" /> Add plot</Button>
        <Button variant="outline" onClick={exportPlots}><Download className="h-4 w-4" /> Export CSV</Button>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plot</TableHead><TableHead>Phase</TableHead><TableHead>Size</TableHead><TableHead>₹/sq.yd</TableHead>
              <TableHead>Total</TableHead><TableHead>Facing</TableHead><TableHead>Status</TableHead><TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {plots.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-semibold">{p.plot_number}</TableCell>
                <TableCell>{phaseName(p.phase_id)}</TableCell>
                <TableCell>{Number(p.size_sqyd)}</TableCell>
                <TableCell>{inr(Number(p.price_per_sqyd))}</TableCell>
                <TableCell>{inr(Number(p.total_price))}</TableCell>
                <TableCell>{cap(p.facing)}</TableCell>
                <TableCell>
                  <select className="h-8 rounded-md border bg-background px-1 text-xs" value={p.status} onChange={(e) => quickStatus(p, e.target.value as PlotStatus)}>
                    {STATUSES.map((s) => <option key={s} value={s}>{cap(s)}</option>)}
                  </select>
                </TableCell>
                <TableCell className="whitespace-nowrap text-right">
                  <Button size="icon" variant="ghost" onClick={() => setEdit({
                    id: p.id, plot_number: String(p.plot_number), phase_id: p.phase_id ?? "", size_sqyd: String(p.size_sqyd),
                    price_per_sqyd: String(p.price_per_sqyd), facing: p.facing, status: p.status, dimensions: p.dimensions,
                    location_note: p.location_note, amenities: p.amenities,
                  })}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => del(p)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{edit?.id ? "Edit plot" : "Add plot"}</DialogTitle></DialogHeader>
          {edit && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Plot number</Label><Input type="number" value={edit.plot_number} onChange={(e) => setEdit({ ...edit, plot_number: e.target.value })} /></div>
              <div><Label>Phase</Label>
                <select className={sel} value={edit.phase_id} onChange={(e) => setEdit({ ...edit, phase_id: e.target.value })}>
                  <option value="">None</option>
                  {phases.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div><Label>Size (sq.yd)</Label><Input type="number" value={edit.size_sqyd} onChange={(e) => setEdit({ ...edit, size_sqyd: e.target.value })} /></div>
              <div><Label>Price per sq.yd (₹)</Label><Input type="number" value={edit.price_per_sqyd} onChange={(e) => setEdit({ ...edit, price_per_sqyd: e.target.value })} /></div>
              <div><Label>Facing</Label>
                <select className={sel} value={edit.facing} onChange={(e) => setEdit({ ...edit, facing: e.target.value as PlotFacing })}>
                  {FACINGS.map((f) => <option key={f} value={f}>{cap(f)}</option>)}
                </select>
              </div>
              <div><Label>Status</Label>
                <select className={sel} value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value as PlotStatus })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{cap(s)}</option>)}
                </select>
              </div>
              <div className="col-span-2"><Label>Dimensions</Label><Input value={edit.dimensions} onChange={(e) => setEdit({ ...edit, dimensions: e.target.value })} /></div>
              <div className="col-span-2"><Label>Location</Label><Input value={edit.location_note} onChange={(e) => setEdit({ ...edit, location_note: e.target.value })} /></div>
              <div className="col-span-2"><Label>Amenities & nearby</Label><Textarea value={edit.amenities} onChange={(e) => setEdit({ ...edit, amenities: e.target.value })} /></div>
              <p className="col-span-2 text-sm">Total: <b>{inr((Number(edit.size_sqyd) || 0) * (Number(edit.price_per_sqyd) || 0))}</b></p>
              <Button className="col-span-2" onClick={save}>Save plot</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PhasesAdmin() {
  const qc = useQueryClient();
  const { data: phases = [] } = useQuery(phasesQuery);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const refresh = () => { qc.invalidateQueries({ queryKey: ["phases"] }); qc.invalidateQueries({ queryKey: ["plots"] }); };

  const add = async () => {
    if (!name.trim()) return void toast.error("Phase name is required");
    const { error } = await supabase.from("phases").insert({ name: name.trim(), description: desc, sort_order: phases.length + 1 });
    if (error) return void toast.error(error.message);
    setName(""); setDesc(""); refresh();
  };
  const rename = async (id: string, field: "name" | "description", value: string) => {
    const { error } = await supabase.from("phases").update(field === "name" ? { name: value } : { description: value }).eq("id", id);
    if (error) return void toast.error(error.message);
    refresh();
  };
  const del = async (id: string) => {
    if (!confirm("Delete this phase? Its plots will become unassigned.")) return;
    const { error } = await supabase.from("phases").delete().eq("id", id);
    if (error) return void toast.error(error.message);
    refresh();
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex flex-wrap gap-2 rounded-xl border bg-card p-4">
        <Input placeholder="Phase name, e.g. Phase 4" value={name} onChange={(e) => setName(e.target.value)} className="w-48" />
        <Input placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} className="flex-1" />
        <Button onClick={add}><Plus className="h-4 w-4" /> Add</Button>
      </div>
      {phases.map((p) => (
        <div key={p.id} className="flex gap-2 rounded-xl border bg-card p-3">
          <Input defaultValue={p.name} onBlur={(e) => e.target.value !== p.name && rename(p.id, "name", e.target.value)} className="w-40" />
          <Input defaultValue={p.description} onBlur={(e) => e.target.value !== p.description && rename(p.id, "description", e.target.value)} className="flex-1" />
          <Button size="icon" variant="ghost" onClick={() => del(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ))}
    </div>
  );
}

function EnquiriesAdmin() {
  const qc = useQueryClient();
  const { data: plots = [] } = useQuery(plotsQuery);
  const { data = [] } = useQuery({
    queryKey: ["enquiries"],
    queryFn: async () => {
      const { data, error } = await supabase.from("enquiries").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const plotNo = (id: string | null) => plots.find((p) => p.id === id)?.plot_number ?? "—";
  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("enquiries").update({ status }).eq("id", id);
    if (error) return void toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["enquiries"] });
  };

  return (
    <div>
      <Button variant="outline" className="mb-4" onClick={() => downloadCsv("enquiries.csv", data.map((e) => ({
        date: e.created_at, type: e.kind, name: e.name, mobile: e.mobile, plot: plotNo(e.plot_id), message: e.message, status: e.status,
      })))}><Download className="h-4 w-4" /> Export CSV</Button>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Name</TableHead><TableHead>Mobile</TableHead><TableHead>Plot</TableHead><TableHead>Message</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No enquiries yet</TableCell></TableRow>}
            {data.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="whitespace-nowrap">{new Date(e.created_at).toLocaleDateString("en-IN")}</TableCell>
                <TableCell><Badge variant={e.kind === "booking" ? "default" : "secondary"}>{cap(e.kind)}</Badge></TableCell>
                <TableCell>{e.name}</TableCell>
                <TableCell>{e.mobile}</TableCell>
                <TableCell>{plotNo(e.plot_id)}</TableCell>
                <TableCell className="max-w-xs truncate">{e.message}</TableCell>
                <TableCell>
                  <select className="h-8 rounded-md border bg-background px-1 text-xs" value={e.status} onChange={(ev) => setStatus(e.id, ev.target.value)}>
                    {["new", "contacted", "closed"].map((s) => <option key={s} value={s}>{cap(s)}</option>)}
                  </select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function CustomersAdmin() {
  const { data = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  return (
    <div>
      <Button variant="outline" className="mb-4" onClick={() => downloadCsv("customers.csv", data)}><Download className="h-4 w-4" /> Export CSV</Button>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Mobile</TableHead><TableHead>Email</TableHead><TableHead>Address</TableHead><TableHead>Registered</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.full_name}</TableCell><TableCell>{c.mobile}</TableCell><TableCell>{c.email ?? "—"}</TableCell>
                <TableCell className="max-w-xs truncate">{c.address}</TableCell>
                <TableCell>{new Date(c.created_at).toLocaleDateString("en-IN")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

const VENTURE_FIELDS = [
  ["name", "Venture name"], ["tagline", "Tagline"], ["location", "Location"], ["address", "Office address"],
  ["phone", "Phone"], ["email", "Email"], ["whatsapp", "WhatsApp number (with country code)"],
  ["map_embed_url", "Google Maps embed URL"], ["total_area_sqyd", "Total venture area (sq.yd)"],
] as const;

function VentureAdmin() {
  const qc = useQueryClient();
  const { data: v } = useQuery(ventureQuery);
  const [f, setF] = useState<Record<string, string>>({});
  useEffect(() => {
    if (v) setF(Object.fromEntries(Object.entries(v).map(([k, val]) => [k, String(val ?? "")])));
  }, [v]);

  const save = async () => {
    const g = (k: string) => f[k] ?? "";
    if (!g("name").trim()) return void toast.error("Venture name is required");
    const { error } = await supabase.from("venture").update({
      name: g("name").trim(), tagline: g("tagline"), about: g("about"), location: g("location"), address: g("address"), phone: g("phone"),
      email: g("email"), whatsapp: g("whatsapp"), map_embed_url: g("map_embed_url"), total_area_sqyd: Number(g("total_area_sqyd")) || 0,
      updated_at: new Date().toISOString(),
    }).eq("id", 1);
    if (error) return void toast.error(error.message);
    toast.success("Venture details updated");
    qc.invalidateQueries({ queryKey: ["venture"] });
  };

  return (
    <div className="grid max-w-3xl gap-4 rounded-xl border bg-card p-6 sm:grid-cols-2">
      {VENTURE_FIELDS.map(([k, label]) => (
        <div key={k} className={k === "address" || k === "map_embed_url" ? "sm:col-span-2" : ""}>
          <Label>{label}</Label>
          <Input value={f[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
        </div>
      ))}
      <div className="sm:col-span-2"><Label>About</Label><Textarea rows={5} value={f["about"] ?? ""} onChange={(e) => setF({ ...f, about: e.target.value })} /></div>
      <Button className="sm:col-span-2" onClick={save}>Save details</Button>
    </div>
  );
}
