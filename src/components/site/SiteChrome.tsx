import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Menu, X, Trees, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ventureQuery } from "@/lib/data";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/plots", label: "Our Plots" },
  { to: "/layout", label: "Plot Layout" },
  { to: "/process", label: "Registration Process" },
  { to: "/contact", label: "Contact Us" },
] as const;

export function SiteHeader() {
  const { data: v } = useQuery(ventureQuery);
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-navy">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Trees className="h-5 w-5" />
          </span>
          <span className="truncate">{v?.name ?? "Sawargseema Ventures"}</span>
        </Link>
        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              activeProps={{ className: "text-primary" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-2">
          {isAdmin && (
            <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
              <Link to="/admin"><Shield className="h-4 w-4" /> Admin</Link>
            </Button>
          )}
          {user ? (
            <Button variant="outline" size="sm" onClick={logout}><LogOut className="h-4 w-4" /> Logout</Button>
          ) : (
            <Button asChild size="sm"><Link to="/auth">Login</Link></Button>
          )}
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {open && (
        <nav className="border-t px-4 py-2 lg:hidden">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="block py-2 text-sm font-medium">
              {n.label}
            </Link>
          ))}
          {isAdmin && <Link to="/admin" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-primary">Admin panel</Link>}
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  const { data: v } = useQuery(ventureQuery);
  return (
    <footer className="mt-20 bg-navy text-navy-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <p className="font-display text-lg font-bold">{v?.name}</p>
          <p className="mt-2 text-sm opacity-80">{v?.tagline}</p>
        </div>
        <div className="text-sm opacity-90">
          <p className="font-semibold">Office</p>
          <p className="mt-1">{v?.address}</p>
        </div>
        <div className="text-sm opacity-90">
          <p className="font-semibold">Contact</p>
          <p className="mt-1">{v?.phone}</p>
          <p>{v?.email}</p>
        </div>
      </div>
      <p className="border-t border-navy-foreground/10 py-4 text-center text-xs opacity-70">
        Sample data shown for demonstration. Verify approvals and documents with the venture office before purchase.
      </p>
    </footer>
  );
}

export function LoginRequired({ what }: { what: string }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-card p-8 text-center shadow-card">
      <h2 className="text-xl font-bold">Please log in to view {what}</h2>
      <p className="mt-2 text-sm text-muted-foreground">Create a free account with your mobile number to browse plot details and prices.</p>
      <Button asChild className="mt-6"><Link to="/auth">Login or Register</Link></Button>
    </div>
  );
}

export function PageHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="bg-secondary">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-3xl font-bold text-navy md:text-4xl">{title}</h1>
        {sub && <p className="mt-2 max-w-2xl text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}
