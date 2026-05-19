import { useScreenContent } from "@/hooks/useScreenContent";
import { LiquidCard } from "@/components/LiquidCard";

type Topico = { titulo: string; texto: string };
type Content = { titulo: string; topicos: Topico[] };

export function AtlasFase(props: Content & { screenKey: string }) {
  const { content, loading } = useScreenContent<Content>(props.screenKey, {
    titulo: props.titulo,
    topicos: props.topicos,
  });

  if (loading) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  return (
    <div className="space-y-3">
      <h2 className="font-display text-xl font-bold text-foreground">{content.titulo}</h2>
      {content.topicos.map((t) => (
        <LiquidCard key={t.titulo} className="p-4" bgOpacity={0.6}>
          <h3 className="font-display text-base font-bold text-foreground">{t.titulo}</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t.texto}</p>
        </LiquidCard>
      ))}
    </div>
  );
}
