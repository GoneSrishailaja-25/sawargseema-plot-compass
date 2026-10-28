import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Plot = Database["public"]["Tables"]["plots"]["Row"];
export type Phase = Database["public"]["Tables"]["phases"]["Row"];
export type Venture = Database["public"]["Tables"]["venture"]["Row"];
export type Enquiry = Database["public"]["Tables"]["enquiries"]["Row"];
export type PlotStatus = Database["public"]["Enums"]["plot_status"];
export type PlotFacing = Database["public"]["Enums"]["plot_facing"];

export const STATUSES: PlotStatus[] = ["available", "reserved", "sold"];
export const FACINGS: PlotFacing[] = ["north", "south", "east", "west"];

export const MOBILE_RE = /^[6-9]\d{9}$/;
/** Strip spaces/dashes and a leading +91 / 91 / 0 so only the 10-digit number remains. */
export const normalizeMobile = (raw: string) => {
  let d = raw.replace(/\D/g, "");
  if (d.length > 10 && d.startsWith("91")) d = d.slice(2);
  else if (d.length > 10 && d.startsWith("0")) d = d.slice(1);
  return d.slice(0, 10);
};
export const mobileToEmail = (mobile: string) => `${mobile}@sawargseema.app`;

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
export const num = (n: number) => new Intl.NumberFormat("en-IN").format(n);

export const ventureQuery = queryOptions({
  queryKey: ["venture"],
  queryFn: async () => {
    const { data, error } = await supabase.from("venture").select("*").eq("id", 1).maybeSingle();
    if (error) throw error;
    return data;
  },
});

export const phasesQuery = queryOptions({
  queryKey: ["phases"],
  queryFn: async () => {
    const { data, error } = await supabase.from("phases").select("*").order("sort_order");
    if (error) throw error;
    return data;
  },
});

export const plotsQuery = queryOptions({
  queryKey: ["plots"],
  queryFn: async () => {
    const { data, error } = await supabase.from("plots").select("*").order("plot_number");
    if (error) throw error;
    return data;
  },
});

export function computeStats(plots: Plot[]) {
  const s = { total: plots.length, available: 0, reserved: 0, sold: 0, plotArea: 0 };
  for (const p of plots) {
    s[p.status]++;
    s.plotArea += Number(p.size_sqyd);
  }
  return s;
}
