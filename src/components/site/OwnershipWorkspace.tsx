import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Upload, Bell, ShieldCheck, MessageSquare, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { plotsQuery } from "@/lib/data";
import { DOCUMENT_TYPES, REVIEW_STATUSES, ownershipQuery, reviewSchema, validateOwnershipFile, verificationProgress } from "@/lib/ownership";

const selectClass = "h-10 w-full rounded-md border bg-background px-3 text-sm";

export function OwnershipWorkspace({ userId }: { userId: string }) {
  const { isAdmin, isOfficer } = useAuth();
  const qc = useQueryClient();
  const { data, isPending, error } = useQuery(ownershipQuery(userId));
  const { data: plots = [] } = useQuery(plotsQuery);
  const { data: customers = [] } = useQuery({ queryKey: ["ownership-customers", userId], enabled: isAdmin, queryFn: async () => {
    const { data, error } = await supabase.from("profiles").select("id,full_name,mobile").order("full_name"); if (error) throw error; return data;
  }});
  const { data: officers = [] } = useQuery({ queryKey: ["ownership-officers", userId], enabled: isAdmin, queryFn: async () => {
    const { data, error } = await supabase.from("user_roles").select("user_id").eq("role", "officer"); if (error) throw error; return data;
  }});
  const [selected, setSelected] = useState("");
  const [plotId, setPlotId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [officerId, setOfficerId] = useState("");
  const [category, setCategory] = useState<keyof typeof DOCUMENT_TYPES>("ownership");
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [fileKey, setFileKey] = useState(0);
  const active = data?.cases.find(c => c.id === selected) ?? data?.cases[0];
  const documents = data?.documents.filter(d => d.case_id === active?.id) ?? [];
  const progress = verificationProgress(documents);
  const refresh = async () => { await qc.invalidateQueries({ queryKey: ["ownership"] }); await qc.invalidateQueries({ queryKey: ["ownership-officers"] }); };
  const act = async (operation: () => Promise<void>) => {
    setBusy(true); try { await operation(); await refresh(); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not save. Please try again."); } finally { setBusy(false); }
  };
  const createCase = () => act(async () => {
    if (!plotId || !customerId) throw new Error("Select a plot and customer");
    const { data: created, error } = await supabase.from("ownership_cases").insert({ plot_id: plotId, customer_id: customerId }).select().single();
    if (error) throw new Error(error.code === "23505" ? "This plot already has an ownership record" : error.message);
    setSelected(created.id); toast.success("Ownership record opened; documents are pending");
  });
  const upload = () => act(async () => {
    if (!active || !file) throw new Error("Choose a document");
    validateOwnershipFile(file);
    const id = crypto.randomUUID();
    const name = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-180);
    const path = `${active.id}/${id}/${name}`;
    const { error: uploadError } = await supabase.storage.from("ownership-documents").upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) throw new Error(uploadError.message);
    const { error } = await supabase.from("ownership_documents").insert({ id, case_id: active.id, category, file_name: name, storage_path: path, uploaded_by: userId });
    if (error) { await supabase.storage.from("ownership-documents").remove([path]); throw new Error(error.message); }
    setFile(null); setFileKey(k => k + 1); toast.success("Uploaded — Pending officer review");
  });
  const download = (path: string) => act(async () => {
    const { data: signed, error } = await supabase.storage.from("ownership-documents").createSignedUrl(path, 60, { download: true });
    if (error) throw new Error(error.message);
    const a = document.createElement("a"); a.href = signed.signedUrl; a.rel = "noopener noreferrer"; a.target = "_blank"; a.click();
  });
  if (isPending) return <p role="status" className="py-12 text-muted-foreground">Loading ownership records…</p>;
  if (error) return <div role="alert" className="py-8"><p>Ownership records could not be loaded.</p><Button variant="outline" onClick={refresh}>Try again</Button></div>;
  return <div className="space-y-8">
    {isAdmin && <section className="space-y-4 border-b pb-6">
      <h2 className="text-xl font-semibold">Open ownership record</h2>
      <div className="grid items-end gap-3 sm:grid-cols-3">
        <div><Label htmlFor="ownership-plot">Plot</Label><select id="ownership-plot" className={selectClass} value={plotId} onChange={e => setPlotId(e.target.value)}><option value="">Select plot</option>{plots.filter(p => !data?.cases.some(c => c.plot_id === p.id)).map(p => <option key={p.id} value={p.id}>Plot {p.plot_number}</option>)}</select></div>
        <div><Label htmlFor="ownership-customer">Customer</Label><select id="ownership-customer" className={selectClass} value={customerId} onChange={e => setCustomerId(e.target.value)}><option value="">Select customer</option>{customers.map(c => <option key={c.id} value={c.id}>{c.full_name || "Customer"} · {c.mobile}</option>)}</select></div>
        <Button disabled={busy} onClick={createCase}><Plus className="h-4 w-4" />Open record</Button>
      </div>
      <h3 className="pt-3 font-semibold">Authorized officers</h3>
      <div className="flex flex-wrap items-end gap-3"><div className="min-w-0 flex-1"><Label htmlFor="officer-account">Registered account</Label><select id="officer-account" className={selectClass} value={officerId} onChange={e => setOfficerId(e.target.value)}><option value="">Select officer account</option>{customers.map(c => <option key={c.id} value={c.id}>{c.full_name || "Customer"} · {c.mobile}</option>)}</select></div><Button variant="outline" disabled={busy || !officerId} onClick={() => act(async () => { const { error } = await supabase.rpc("set_ownership_officer", { _user: officerId, _enabled: true }); if (error) throw new Error(error.message); toast.success("Officer authorized. Sign in again to update their access."); })}>Authorize officer</Button></div>
      {officers.map(o => <div key={o.user_id} className="flex items-center justify-between gap-3 text-sm"><span>{customers.find(c => c.id === o.user_id)?.full_name || "Authorized officer"}</span><Button variant="ghost" size="sm" disabled={busy} onClick={() => act(async () => { const { error } = await supabase.rpc("set_ownership_officer", { _user: o.user_id, _enabled: false }); if (error) throw new Error(error.message); })}>Revoke access</Button></div>)}
    </section>}
    {(data?.notifications.length ?? 0) > 0 && <section className="space-y-3 border-b pb-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-xl font-semibold"><Bell className="h-5 w-5" />Updates <Badge variant="secondary">{data?.notifications.filter(n => !n.read_at).length} unread</Badge></h2><Button variant="ghost" size="sm" disabled={busy} onClick={() => act(async () => { const { error } = await supabase.rpc("mark_ownership_notices_read"); if (error) throw new Error(error.message); })}>Mark all read</Button></div>{data?.notifications.slice(0, 10).map(n => <div key={n.id} className={n.read_at ? "text-sm text-muted-foreground" : "text-sm font-medium"}><p className="break-words">{n.message}</p><time className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("en-IN")}</time></div>)}</section>}
    {!active ? <p className="py-10 text-muted-foreground">No ownership records assigned yet.</p> : <>
      <div className="max-w-md"><Label htmlFor="ownership-record">Ownership record</Label><select id="ownership-record" className={selectClass} value={active.id} onChange={e => setSelected(e.target.value)}>{data?.cases.map(c => <option key={c.id} value={c.id}>Plot {plots.find(p => p.id === c.plot_id)?.plot_number ?? "—"}</option>)}</select></div>
      <section className="space-y-3"><h2 className="flex items-center gap-2 text-xl font-semibold"><ShieldCheck className="h-5 w-5 text-primary" />Verification progress</h2><div className="flex justify-between gap-4 text-sm"><span>{progress.verified} of {progress.total} document categories verified</span><span>{progress.percent}%</span></div><Progress value={progress.percent} aria-label="Verification progress" />{progress.missing.length > 0 && <p className="text-sm text-destructive">Missing: {progress.missing.map(c => DOCUMENT_TYPES[c as keyof typeof DOCUMENT_TYPES]).join(", ")}</p>}</section>
      {isAdmin && <section className="space-y-3 border-y py-6"><h2 className="text-xl font-semibold">Upload document</h2><div className="grid items-end gap-3 sm:grid-cols-3"><div><Label htmlFor="document-type">Document type</Label><select id="document-type" className={selectClass} value={category} onChange={e => setCategory(e.target.value as keyof typeof DOCUMENT_TYPES)}>{Object.entries(DOCUMENT_TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div><div><Label htmlFor="ownership-file">PDF, PNG or JPG · up to 10 MB</Label><Input key={fileKey} id="ownership-file" type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e => setFile(e.target.files?.[0] ?? null)} /></div><Button disabled={busy || !file} onClick={upload}><Upload className="h-4 w-4" />Upload document</Button></div></section>}
      <section className="space-y-4"><h2 className="text-xl font-semibold">Documents</h2>{documents.length === 0 && <p className="text-muted-foreground">No documents uploaded yet.</p>}{documents.map(d => <article key={d.id} className="rounded-lg border bg-card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold">{DOCUMENT_TYPES[d.category as keyof typeof DOCUMENT_TYPES]}</p><p className="break-all text-sm text-muted-foreground">{d.file_name}</p></div><div className="flex items-center gap-2"><Badge variant={d.status === "Rejected" ? "destructive" : d.status === "Verified" ? "default" : "secondary"}>{d.status}</Badge><Button variant="outline" size="icon" aria-label={`Download ${d.file_name}`} title="Download document" disabled={busy} onClick={() => download(d.storage_path)}><Download className="h-4 w-4" /></Button></div></div>{d.review_note && <p className="mt-3 break-words text-sm">Officer note: {d.review_note}</p>}{isOfficer && <ReviewForm documentId={d.id} initialStatus={d.status} busy={busy} onSave={(status, note) => act(async () => { const parsed = reviewSchema.parse({ document: d.id, status, note }); const { error } = await supabase.rpc("review_ownership_document", { _document: parsed.document, _status: parsed.status, _note: parsed.note }); if (error) throw new Error(error.message); toast.success("Officer review saved"); })} />}
        {data?.reviews.some(r => r.document_id === d.id) && <details className="mt-4 text-sm"><summary className="cursor-pointer text-muted-foreground">Review history</summary>{data?.reviews.filter(r => r.document_id === d.id).map(r => <p key={r.id} className="mt-2 break-words">{r.status} · {new Date(r.created_at).toLocaleString("en-IN")}{r.note && ` — ${r.note}`}</p>)}</details>}
      </article>)}</section>
      <section className="space-y-4 border-t pt-6"><h2 className="flex items-center gap-2 text-xl font-semibold"><MessageSquare className="h-5 w-5" />Questions for admin</h2>{active.customer_id === userId && <div className="space-y-3"><Label htmlFor="ownership-question">Your question</Label><Textarea id="ownership-question" maxLength={1000} value={question} onChange={e => setQuestion(e.target.value)} /><Button disabled={busy || !question.trim()} onClick={() => act(async () => { const { error } = await supabase.from("ownership_questions").insert({ case_id: active.id, question: question.trim(), user_id: userId }); if (error) throw new Error(error.message); setQuestion(""); toast.success("Question sent to admin"); })}>Send question</Button></div>}{data?.questions.filter(q => q.case_id === active.id).map(q => <article key={q.id} className="rounded-lg border p-4"><p className="break-words text-sm">{q.question}</p>{q.reply && <p className="mt-3 break-words text-sm text-primary">Admin: {q.reply}</p>}{isAdmin && <ReplyForm busy={busy} onSave={reply => act(async () => { const { error } = await supabase.rpc("reply_ownership_question", { _question: q.id, _reply: reply }); if (error) throw new Error(error.message); toast.success("Reply sent"); })} />}</article>)}</section>
    </>}
  </div>;
}

function ReviewForm({ documentId, initialStatus, busy, onSave }: { documentId: string; initialStatus: string; busy: boolean; onSave: (status: string, note: string) => Promise<void> }) {
  const [status, setStatus] = useState(initialStatus);
  const [note, setNote] = useState("");
  return <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-3"><div><Label htmlFor={`status-${documentId}`}>Review status</Label><select id={`status-${documentId}`} className={selectClass} value={status} onChange={e => setStatus(e.target.value)}>{REVIEW_STATUSES.map(s => <option key={s}>{s}</option>)}</select></div><div><Label htmlFor={`note-${documentId}`}>Review note {status === "Rejected" ? "(required)" : "(optional)"}</Label><Textarea id={`note-${documentId}`} maxLength={2000} value={note} onChange={e => setNote(e.target.value)} /></div><Button className="self-end" disabled={busy || (status === "Rejected" && !note.trim())} onClick={() => onSave(status, note)}>Save officer review</Button></div>;
}
function ReplyForm({ busy, onSave }: { busy: boolean; onSave: (reply: string) => Promise<void> }) {
  const [reply, setReply] = useState("");
  return <div className="mt-3 space-y-2"><Textarea aria-label="Admin reply" maxLength={2000} value={reply} onChange={e => setReply(e.target.value)} /><Button size="sm" disabled={busy || !reply.trim()} onClick={() => onSave(reply.trim())}>Send reply</Button></div>;
}