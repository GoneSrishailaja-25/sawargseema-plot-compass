import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Compass } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { hasCoordinates, missingPlotDetails } from "@/lib/plot-information";
import { cap, inr, num, phasesQuery, type Plot } from "@/lib/data";

export const statusBadge: Record<string, string> = {
  available: "bg-available text-primary-foreground",
  reserved: "bg-reserved text-primary-foreground",
  sold: "bg-sold text-primary-foreground",
};

export function PlotDetailDialog({ plot, onClose }: { plot: Plot | null; onClose: () => void }) {
  const { data: phases = [] } = useQuery(phasesQuery);
  const { user } = useAuth();
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
            {plot.status === "available" && user && (
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

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}
