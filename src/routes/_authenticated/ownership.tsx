import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/site/SiteChrome";
import { OwnershipWorkspace } from "@/components/site/OwnershipWorkspace";

export const Route = createFileRoute("/_authenticated/ownership")({
  head: () => ({ meta: [
    { title: "Ownership Verification — Sawargseema Ventures" },
    { name: "description", content: "Secure ownership documents, officer reviews and customer updates for your plots." },
    { property: "og:title", content: "Ownership Verification — Sawargseema Ventures" },
    { property: "og:description", content: "Track ownership documentation and contact the venture office." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: OwnershipPage,
});
function OwnershipPage() {
  const { ownershipUserId } = Route.useRouteContext();
  return <><PageHeader title="Ownership Verification" /><div className="mx-auto max-w-7xl px-4 py-8"><OwnershipWorkspace userId={ownershipUserId} /></div></>;
}