import { z } from "zod";
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const DOCUMENT_TYPES = { ownership: "Ownership document", sale_deed: "Sale deed", approval: "Approval record" } as const;
export const REVIEW_STATUSES = ["Pending", "Verified", "Rejected"] as const;
export const reviewSchema = z.object({ document: z.string().uuid(), status: z.enum(REVIEW_STATUSES), note: z.string().trim().max(2000) }).refine(v => v.status !== "Rejected" || v.note.length > 0, { message: "Add a reason for rejection" });
export const adminReviewSchema = reviewSchema.refine(v => v.status !== "Verified" || v.note.length > 0, { message: "Add a reason for approval" });
export function verificationProgress(documents: { category: string; status: string }[]) {
  const categories = Object.keys(DOCUMENT_TYPES);
  const verified = categories.filter(category => documents.some(d => d.category === category && d.status === "Verified")).length;
  const missing = categories.filter(category => !documents.some(d => d.category === category));
  return { verified, total: categories.length, percent: Math.round(verified / categories.length * 100), missing };
}
export function validateOwnershipFile(file: { name: string; size: number; type: string }) {
  if (!/\.(pdf|png|jpe?g)$/i.test(file.name) || !["application/pdf", "image/png", "image/jpeg"].includes(file.type)) throw new Error("Choose a PDF, PNG or JPG document");
  if (file.size <= 0 || file.size > 10 * 1024 * 1024) throw new Error("Document must be between 1 byte and 10 MB");
}
export const ownershipQuery = (userId: string) => queryOptions({
  queryKey: ["ownership", userId], refetchInterval: 15000,
  queryFn: async () => {
    const results = await Promise.all([
      supabase.from("ownership_cases").select("*").order("created_at", { ascending: false }),
      supabase.from("ownership_documents").select("*").order("created_at", { ascending: false }),
      supabase.from("ownership_reviews").select("*").order("created_at", { ascending: false }),
      supabase.from("ownership_notifications").select("*").order("created_at", { ascending: false }),
      supabase.from("ownership_questions").select("*").order("created_at", { ascending: false }),
    ]);
    for (const result of results) if (result.error) throw result.error;
    return { cases: results[0].data ?? [], documents: results[1].data ?? [], reviews: results[2].data ?? [], notifications: results[3].data ?? [], questions: results[4].data ?? [] };
  },
});