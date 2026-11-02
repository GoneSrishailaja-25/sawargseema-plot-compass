import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Compass } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { hasCoordinates, missingPlotDetails } from "@/lib/plot-information";
import { cap, inr, num, phasesQuery, STATUSES, type Plot, type PlotStatus } from "@/lib/data";

export const statusBadge: Record<string, string> = {
  available: "bg-available text-primary-foreground",
  reserved: "bg-reserved text-primary-foreground",
  sold: "bg-sold text-primary-foreground",
};

export function PlotDetailDialog({ plot, onClose }: { plot: Plot | null; onClose: () => void }) {
  const { data: phases = [] } = useQuery(phasesQuery);
  const { user, isAdmin } = useAuth();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const phase = phases.find((p) => p.id === plot?.phase_id);

  const book = async () => {
    if (!plot || !user) return;
    setBusy(true);
    const { data: prof } = await supabase.from("profiles").select("full_name, mobile").eq("id", user.id).maybeSingle();
    const { error } = await supabase.from("enquiries").insert({
      user_id: user.id,
      name: prof?.full_name || "Customer",
      mobile: prof?.mobile || "",
      plot_id: plot.id,
      kind: "booking",
      message: msg.slice(0, 1000),
    });
    setBusy(false);
    if (error) return void toast.error("Could not send request. Please check your profile mobile number.");
    toast.success("Reservation request sent. Our representative will contact you.");
    setMsg("");
    onClose();
  };

  return (
    <Dialog open={!!plot} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        {plot && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 font-display text-2xl">
                Plot {plot.plot_number}
                <Badge className={statusBadge[plot.status]}>{cap(plot.status)}</Badge>
              </DialogTitle>
            </DialogHeader>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <Row k="Phase" v={phase?.name ?? "—"} />
              <Row k="Facing" v={<span className="inline-flex items-center gap-1"><Compass className="h-4 w-4 text-accent" />{cap(plot.facing)}</span>} />
              <Row k="Size" v={`${num(Number(plot.size_sqyd))} sq.yd`} />
              <Row k="Dimensions" v={plot.dimensions || "Missing"} />
              <Row k="Price / sq.yd" v={Number(plot.price_per_sqyd) > 0 ? inr(Number(plot.price_per_sqyd)) : "Not provided"} />
              <Row k="Total price" v={<span className="font-bold text-primary">{plot.total_price !== null && Number(plot.price_per_sqyd) > 0 ? inr(Number(plot.total_price)) : "Not provided"}</span>} />
              <div className="col-span-2"><Row k="Location" v={plot.location_note || "Missing"} /></div>
              <div className="col-span-2"><Row k="Amenities & nearby" v={plot.amenities || "—"} /></div>
            <Row k="Coordinates" v={hasCoordinates(plot) ? `${plot.latitude}, ${plot.longitude}` : "Missing"} /><Row k="Information" v={plot.information_verified ? "Admin-verified" : "Unverified"} />
            </dl>
            {missingPlotDetails(plot).length > 0 && <p className="text-xs text-destructive">Missing: {missingPlotDetails(plot).join(", ")}</p>}
            <p className="text-xs text-muted-foreground">Prices exclude registration charges, stamp duty and applicable taxes. Plot information verification is separate from ownership document approval.</p>
            {isAdmin && <AdminEdit key={plot.id} plot={plot} onDone={onClose} />}
            {plot.status === "available" && user && !isAdmin && (
              <div className="space-y-2 border-t pt-4">
                <Textarea placeholder="Message (optional)" value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={1000} />
                <Button className="w-full" onClick={book} disabled={busy}>Request reservation</Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AdminEdit({ plot, onDone }: { plot: Plot; onDone: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ size: String(plot.size_sqyd), price: String(plot.price_per_sqyd), dimensions: plot.dimensions, status: plot.status });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    const size = Number(f.size), price = Number(f.price);
    if (!(size > 0) || !(price >= 0)) return void toast.error("Enter a valid size and price.");
    setBusy(true);
    const { error } = await supabase.from("plots").update({ size_sqyd: size, price_per_sqyd: price, dimensions: f.dimensions.trim(), status: f.status }).eq("id", plot.id);
    setBusy(false);
    if (error) return void toast.error("Could not save plot.");
    toast.success(`Plot ${plot.plot_number} saved.`);
    await qc.invalidateQueries({ queryKey: ["plots"] });
    onDone();
  };
  return (
    <div className="grid grid-cols-2 gap-3 border-t pt-4 text-sm">
      <p className="col-span-2 font-semibold">Admin: edit plot</p>
      <label className="space-y-1"><span className="text-xs text-muted-foreground">Size (sq.yd)</span><Input type="number" step="0.01" value={f.size} onChange={(e) => setF({ ...f, size: e.target.value })} /></label>
      <label className="space-y-1"><span className="text-xs text-muted-foreground">Price / sq.yd</span><Input type="number" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></label>
      <label className="space-y-1"><span className="text-xs text-muted-foreground">Dimensions</span><Input value={f.dimensions} onChange={(e) => setF({ ...f, dimensions: e.target.value })} /></label>
      <label className="space-y-1"><span className="text-xs text-muted-foreground">Status</span>
        <select className="h-9 w-full rounded-md border bg-background px-2" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as PlotStatus })}>
          {STATUSES.map((s) => <option key={s} value={s}>{cap(s)}</option>)}
        </select></label>
      <Button className="col-span-2" onClick={save} disabled={busy}>Save changes</Button>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}
