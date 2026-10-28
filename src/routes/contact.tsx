import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/site/SiteChrome";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { ventureQuery } from "@/lib/data";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Sawargseema Ventures" },
      { name: "description", content: "Office address, phone, WhatsApp and an enquiry form for plot bookings." },
      { property: "og:title", content: "Contact Sawargseema Ventures" },
      { property: "og:description", content: "Send an enquiry about any plot." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const { data: v } = useQuery(ventureQuery);
  return (
    <>
      <PageHeader title="Contact Us" sub="Send us an enquiry and our representative will reach out." />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-2">
        <div className="space-y-4">
          <p className="font-display text-xl font-bold text-navy">{v?.name}</p>
          <p className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-primary" />{v?.address}</p>
          <p className="flex gap-3"><Phone className="h-5 w-5 text-primary" /><a href={`tel:${v?.phone}`}>{v?.phone}</a></p>
          <p className="flex gap-3"><Mail className="h-5 w-5 text-primary" /><a href={`mailto:${v?.email}`}>{v?.email}</a></p>
          {v?.whatsapp && (
            <Button asChild variant="secondary">
              <a href={`https://wa.me/${v.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> Chat on WhatsApp</a>
            </Button>
          )}
          {v?.map_embed_url && (
            <iframe title="Map" src={v.map_embed_url} className="h-72 w-full rounded-xl border" loading="lazy" />
          )}
        </div>
        <EnquiryForm />
      </div>
    </>
  );
}
