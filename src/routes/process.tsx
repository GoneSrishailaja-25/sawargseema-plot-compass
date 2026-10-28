import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/site/SiteChrome";
import { ventureQuery } from "@/lib/data";

export const Route = createFileRoute("/process")({
  head: () => ({
    meta: [
      { title: "Registration & Booking Process — Sawargseema Ventures" },
      { name: "description", content: "Step-by-step guide from account creation to property registration, with required documents." },
      { property: "og:title", content: "How to Book a Plot — Sawargseema Ventures" },
      { property: "og:description", content: "Seven steps from enquiry to registration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Process,
});

const STEPS = [
  ["Create an account", "Register with your name, mobile number and address."],
  ["Browse plots", "Check available plots, sizes, facing and prices."],
  ["Select a plot", "Use the layout or listing to pick your preferred plot."],
  ["Submit a request", "Send a booking enquiry or reservation request from the plot details."],
  ["Contact our representative", "We call you to verify details and share payment information."],
  ["Document verification", "Complete document checks and applicable legal procedures."],
  ["Property registration", "Register the property at the appropriate Sub-Registrar office."],
];

const DOCS = ["Aadhaar card", "PAN card", "Passport-size photographs", "Address proof", "Payment proof / bank details", "Two witnesses with ID proof (at registration)"];

function Process() {
  const { data: v } = useQuery(ventureQuery);
  return (
    <>
      <PageHeader title="Registration Process" sub="How booking and registration works, step by step." />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:grid-cols-3">
        <ol className="space-y-4 md:col-span-2">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="flex gap-4 rounded-xl border bg-card p-5 shadow-card">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary font-display font-bold text-primary-foreground">{i + 1}</span>
              <div><p className="font-semibold">{t}</p><p className="text-sm text-muted-foreground">{d}</p></div>
            </li>
          ))}
        </ol>
        <aside className="space-y-6">
          <div className="rounded-xl border bg-secondary p-6">
            <p className="font-semibold">Required documents</p>
            <ul className="mt-3 space-y-2 text-sm">
              {DOCS.map((d) => <li key={d} className="flex gap-2"><FileText className="h-4 w-4 text-accent" />{d}</li>)}
            </ul>
          </div>
          <div className="rounded-xl border bg-card p-6 text-sm">
            <p className="font-semibold">Need help?</p>
            <p className="mt-2">{v?.phone}</p>
            <p>{v?.email}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Legal approval and registration status of any plot must be independently verified with the venture office and the relevant authorities. This website does not certify legal status.
          </p>
        </aside>
      </div>
    </>
  );
}
