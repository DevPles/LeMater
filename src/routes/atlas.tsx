import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { AtlasVitrine } from "@/components/AtlasVitrine";

export const Route = createFileRoute("/atlas")({
  head: () => ({
    meta: [
      { title: "Atlas Materno · Le Mater" },
      { name: "description", content: "Atlas Materno Le Mater com aulas avulsas de concepção, gestação, parto e puerpério." },
    ],
    links: [{ rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@300;400;500&display=swap" }],
  }),
  component: () => (
    <>
      <SiteNav />
      <AtlasVitrine variant="site" />
      <SiteFooter />
    </>
  ),
});
