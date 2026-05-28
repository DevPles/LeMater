import { createFileRoute } from "@tanstack/react-router";
import { AtlasVitrine } from "@/components/AtlasVitrine";

export const Route = createFileRoute("/app_/videos")({
  head: () => ({
    meta: [
      { title: "Atlas Materno · App" },
      { name: "description", content: "Atlas Materno dentro do aplicativo." },
    ],
    links: [
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@300;400;500&display=swap" },
    ],
  }),
  component: () => <AtlasVitrine variant="app" />,
});
