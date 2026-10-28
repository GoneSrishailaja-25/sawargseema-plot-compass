import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { MOBILE_RE, mobileToEmail } from "@/lib/data";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Login or Register — Sawargseema Ventures" },
      { name: "description", content: "Sign in with your mobile number to view plots and send booking requests." },
      { property: "og:title", content: "Login — Sawargseema Ventures" },
      { property: "og:description", content: "Customer login and registration." },
    ],
  }),
  component: AuthPage,
});

const mobile = z.string().regex(MOBILE_RE, "Enter a valid 10-digit Indian mobile number");
const password = z.string().min(8, "Password must be at least 8 characters").max(72);
const registerSchema = z.object({
  full_name: z.string().trim().min(2, "Full name is required").max(100),
  mobile,
  address: z.string().trim().min(5, "Address is required").max(300),
  contact_email: z.union([z.literal(""), z.string().trim().email("Invalid email").max(255)]),
  password,
});

function AuthPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [login, setLogin] = useState({ mobile: "", password: "" });
  const [reg, setReg] = useState({ full_name: "", mobile: "", address: "", contact_email: "", password: "" });
  const digits = (s: string) => s.replace(/\D/g, "").slice(0, 10);

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = z.object({ mobile, password: z.string().min(1, "Password required") }).safeParse(login);
    if (!r.success) return toast.error(r.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: mobileToEmail(r.data.mobile), password: r.data.password });
    setBusy(false);
    if (error) return toast.error("Invalid mobile number or password");
    toast.success("Welcome back!");
    navigate({ to: "/plots" });
  };

  const doRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = registerSchema.safeParse(reg);
    if (!r.success) return toast.error(r.error.issues[0].message);
    setBusy(true);
    const { password: pw, ...meta } = r.data;
    const { data, error } = await supabase.auth.signUp({
      email: mobileToEmail(meta.mobile),
      password: pw,
      options: { data: meta, emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) return toast.error(error.message.includes("registered") ? "This mobile number is already registered" : error.message);
    if (!data.session) return toast.info("Account created. Please log in.");
    toast.success("Account created!");
    navigate({ to: "/plots" });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Tabs defaultValue="login" className="rounded-2xl border bg-card p-6 shadow-card">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <form onSubmit={doLogin} className="mt-4 space-y-4">
            <div><Label>Mobile number</Label><Input inputMode="numeric" value={login.mobile} onChange={(e) => setLogin({ ...login, mobile: digits(e.target.value) })} /></div>
            <div><Label>Password</Label><Input type="password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} /></div>
            <Button className="w-full" disabled={busy}>Login</Button>
          </form>
        </TabsContent>
        <TabsContent value="register">
          <form onSubmit={doRegister} className="mt-4 space-y-3">
            <div><Label>Full name *</Label><Input value={reg.full_name} onChange={(e) => setReg({ ...reg, full_name: e.target.value })} /></div>
            <div><Label>Mobile number *</Label><Input inputMode="numeric" value={reg.mobile} onChange={(e) => setReg({ ...reg, mobile: digits(e.target.value) })} /></div>
            <div><Label>Address *</Label><Textarea value={reg.address} onChange={(e) => setReg({ ...reg, address: e.target.value })} /></div>
            <div><Label>Email (optional)</Label><Input type="email" value={reg.contact_email} onChange={(e) => setReg({ ...reg, contact_email: e.target.value })} /></div>
            <div><Label>Password *</Label><Input type="password" value={reg.password} onChange={(e) => setReg({ ...reg, password: e.target.value })} /></div>
            <Button className="w-full" disabled={busy}>Create account</Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
