import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listMateriaisVitrine, type VitrineMaterial } from "@/lib/materiais.functions";
import { LiquidCard } from "@/components/LiquidCard";

export const Route = createFileRoute("/_authenticated/app/videos")({
  component: VideosPage,
});

function VideosPage() {
  const listFn = useServerFn(listMateriaisVitrine);
  const [items, setItems] = useState<VitrineMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listFn()
      .then((r) => setItems((r as VitrineMaterial[]).filter((m) => m.tipo.startsWith("video"))))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="max-w-md mx-auto px-4 pt-6 space-y-4">
      <header>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Aulas e reels</p>
        <h1 className="font-display text-2xl font-bold text-foreground">Vídeos</h1>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Nenhum vídeo disponível ainda.</p>
      ) : (
        <div className="space-y-3">
          {items.map((m) => (
            <LiquidCard key={m.id} className="overflow-hidden" bgOpacity={0.6}>
              {m.capa_url && (
                <img src={m.capa_url} alt="" className="w-full h-40 object-cover" />
              )}
              <div className="p-4">
                <span className="text-[10px] uppercase tracking-wider text-primary font-bold">
                  {m.categoria}
                </span>
                <h3 className="font-display text-base font-bold text-foreground mt-1">{m.titulo}</h3>
                {m.descricao && (
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{m.descricao}</p>
                )}
                {m.preco_label && (
                  <p className="text-xs text-primary font-bold mt-2">{m.preco_label}</p>
                )}
              </div>
            </LiquidCard>
          ))}
        </div>
      )}
    </main>
  );
}
