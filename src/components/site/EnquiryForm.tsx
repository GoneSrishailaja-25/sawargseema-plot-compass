import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { MOBILE_RE, plotsQuery } from "@/lib/data";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  mobile: z.string().trim().regex(MOBILE_RE, "Enter a valid 10-digit mobile number"),
  message: z.string().trim().max(1000),
});

export function EnquiryForm() {
  const { user } = useAuth();
  const { data: plots = [] } = useQuery(plotsQuery);
  const [f, setF] = useState({ name: "", mobile: "", plot: "", message: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(f);
    if (!r.success) return void toast.error(r.error.issues[0]?.message ?? "Invalid input");
    setBusy(true);
    const { error } = await supabase.from("enquiries").insert({
      ...r.data,
      user_id: user?.id ?? null,
      plot_id: f.plot || null,
      kind: "contact",
    });
    setBusy(false);
    if (error) return void toast.error("Could not send enquiry. Please try again.");
    toast.success("Thank you! We'll get back to you shortly.");
    setF({ name: "", mobile: "", plot: "", message: "" });
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-card p-6 shadow-card">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label>Name *</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={100} /></div>
        <div><Label>Mobile *</Label><Input value={f.mobile} inputMode="numeric" onChange={(e) => setF({ ...f, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })} /></div>
      </div>
      <div>
        <Label>Preferred plot</Label>
        <select className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm" value={f.plot} onChange={(e) => setF({ ...f, plot: e.target.value })}>
          <option value="">Any / not decided</option>
          {plots.filter((p) => p.status === "available").map((p) => (
            <option key={p.id} value={p.id}>Plot {p.plot_number} ({Number(p.size_sqyd)} sq.yd)</option>
          ))}
        </select>
      </div>
      <div><Label>Message</Label><Textarea value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} maxLength={1000} /></div>
      <Button type="submit" disabled={busy} className="w-full">Send enquiry</Button>
    </form>
  );
}
