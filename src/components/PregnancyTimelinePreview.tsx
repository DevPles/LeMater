import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PregnancyTimeline } from "@/components/PregnancyTimeline";
import { motion, AnimatePresence } from "framer-motion";
import { LiquidCard } from "@/components/LiquidCard";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import { videoForAulaCover } from "@/lib/atlas-cover-video";
import { listCursosVitrine, type CursoVitrine } from "@/lib/cursos.functions";
import {
  GESTATION_WEEKS,
  GESTATION_DAYS,
  addDays,
  parseDate,
  weeksBetween,
  trimesterOfWeek,
  formatBRDate,
  expectedWeightRange,
  BP_NORMAL,
} from "@/lib/pregnancy-norms";

type Props = {
  userId: string;
  dum: string | null | undefined;
  cadastroISO: string | null | undefined;
};

const NAVY = "#1a1557";
const GOLD = "#f0c040";

type Medicao = { parametro: string; valor: number; data_medicao: string };

/**
 * Sparkline com faixa de normalidade ao fundo e linha do paciente animada.
 * - `values`: série do paciente
 * - `normal`: { min, max } da faixa esperada (constante ao longo do eixo X)
 */
function SparklineCompare({
  values,
  color,
  normal,
}: {
  values: number[];
  color: string;
  normal?: { min: number; max: number } | null;
}) {
  const w = 220;
  const h = 48;

  if (values.length < 2) {
    return (
      <div className="h-12 flex items-center text-[10px] text-muted-foreground/70">
        Sem histórico suficiente
      </div>
    );
  }

  const allVals = [...values, ...(normal ? [normal.min, normal.max] : [])];
  const min = Math.min(...allVals);
  const max = Math.max(...allVals);
  const range = max - min || 1;
  const pad = 4;

  const y = (v: number) => h - pad - ((v - min) / range) * (h - pad * 2);
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => `${i * step},${y(v)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12 overflow-visible">
      {/* Faixa de normalidade */}
      {normal && (
        <motion.rect
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          x={0}
          y={y(normal.max)}
          width={w}
          height={Math.max(2, y(normal.min) - y(normal.max))}
          fill={color}
          fillOpacity={0.08}
          rx={2}
        />
      )}
      {/* Linhas pontilhadas dos limites */}
      {normal && (
        <>
          <line
            x1={0}
            x2={w}
            y1={y(normal.min)}
            y2={y(normal.min)}
            stroke={color}
            strokeOpacity={0.35}
            strokeWidth={0.8}
            strokeDasharray="3 3"
          />
          <line
            x1={0}
            x2={w}
            y1={y(normal.max)}
            y2={y(normal.max)}
            stroke={color}
            strokeOpacity={0.35}
            strokeWidth={0.8}
            strokeDasharray="3 3"
          />
        </>
      )}
      {/* Linha do paciente (anima desenhando) */}
      <motion.polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
      {/* Ponto final pulsando */}
      <motion.circle
        cx={(values.length - 1) * step}
        cy={y(values[values.length - 1])}
        r={3}
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.3, 1] }}
        transition={{ duration: 0.6, delay: 1 }}
      />
    </svg>
  );
}

export function PregnancyTimelinePreview({ userId, dum, cadastroISO }: Props) {
  const [open, setOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const [pesos, setPesos] = useState<Medicao[]>([]);
  const [sist, setSist] = useState<Medicao[]>([]);
  const [dias, setDias] = useState<Medicao[]>([]);

  const [cursos, setCursos] = useState<CursoVitrine[]>([]);
  useEffect(() => {
    let active = true;
    listCursosVitrine()
      .then((list) => {
        if (active) setCursos(list ?? []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const cursoRecente: CursoVitrine | null = useMemo(() => {
    return cursos.find((c) => c.publicado) ?? cursos[0] ?? null;
  }, [cursos]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("clinical_measurements")
        .select("parametro,valor,data_medicao")
        .eq("gestante_id", userId)
        .in("parametro", ["peso", "Peso", "pa_sistolica", "pa_diastolica"])
        .order("data_medicao", { ascending: true });
      if (!active || !data) return;
      const all = data as Medicao[];
      setPesos(all.filter((m) => m.parametro === "peso" || m.parametro === "Peso"));
      setSist(all.filter((m) => m.parametro === "pa_sistolica"));
      setDias(all.filter((m) => m.parametro === "pa_diastolica"));
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  const totalSlides = cursoRecente ? 4 : 3;
  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % totalSlides), 5500);
    return () => clearInterval(id);
  }, [totalSlides]);

  const dumDate = parseDate(dum);

  const cronograma = (() => {
    if (!dumDate) {
      return (
        <p className="text-xs text-muted-foreground">
          Cadastre sua DUM no perfil para visualizar.
        </p>
      );
    }
    const dpp = addDays(dumDate, GESTATION_DAYS);
    const hoje = new Date();
    const semanaAtualNum = Math.max(
      0,
      Math.min(GESTATION_WEEKS, weeksBetween(dumDate, hoje)),
    );
    const semanaAtual = Math.floor(semanaAtualNum);
    const trimestre = trimesterOfWeek(semanaAtual);
    const progresso = (semanaAtualNum / GESTATION_WEEKS) * 100;

    return (
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-5xl font-light leading-none text-[#1a1557]">
              {semanaAtual}
            </span>
            <span className="text-sm text-muted-foreground font-light">/ 40 sem</span>
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            <span className="inline-block text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#f0c040]/15 text-[#a87a10]">
              {trimestre}º trimestre
            </span>
            <p className="text-[10px] text-muted-foreground">DPP {formatBRDate(dpp)}</p>
          </div>
        </div>
        <div>
          <div className="relative h-1.5 rounded-full bg-[#1a1557]/10 overflow-visible">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progresso}%` }}
              transition={{ duration: 1.1, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: `linear-gradient(90deg, ${NAVY}, ${GOLD})` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md border-2"
              style={{ left: `calc(${progresso}% - 6px)`, borderColor: GOLD }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground/70 mt-1.5 uppercase tracking-wider">
            <span>DUM</span>
            <span>DPP</span>
          </div>
        </div>
      </div>
    );
  })();

  const pesoNormal = useMemo(() => {
    if (!dumDate || pesos.length === 0) return null;
    const first = pesos[0];
    const startWeek = Math.max(0, weeksBetween(dumDate, new Date(first.data_medicao)));
    const hoje = new Date();
    const currWeek = Math.max(startWeek, weeksBetween(dumDate, hoje));
    return expectedWeightRange(currWeek, startWeek, first.valor);
  }, [dumDate, pesos]);

  const pesoSlide = (() => {
    const last = pesos[pesos.length - 1];
    const first = pesos[0];
    const delta = last && first ? last.valor - first.valor : null;
    const dentroFaixa =
      last && pesoNormal
        ? last.valor >= pesoNormal.min && last.valor <= pesoNormal.max
        : null;

    return (
      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl font-light leading-none text-[#1a1557]">
              {last ? last.valor.toFixed(1) : "—"}
            </span>
            <span className="text-sm text-muted-foreground font-light">kg</span>
          </div>
          <div className="text-right">
            <span className="inline-block text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#f0c040]/15 text-[#a87a10]">
              Peso
            </span>
            {delta !== null && (
              <p className="text-[10px] text-muted-foreground mt-1">
                {delta >= 0 ? "+" : ""}
                {delta.toFixed(1)} kg na gestação
              </p>
            )}
          </div>
        </div>
        <SparklineCompare values={pesos.map((m) => m.valor)} color={NAVY} normal={pesoNormal} />
        <div className="flex items-center justify-between text-[10px] text-muted-foreground/80">
          <span>
            {pesos.length} {pesos.length === 1 ? "registro" : "registros"}
          </span>
          {dentroFaixa !== null && pesoNormal && (
            <span
              className={dentroFaixa ? "text-emerald-700/80" : "text-amber-700/80"}
            >
              esperado {pesoNormal.min.toFixed(1)}–{pesoNormal.max.toFixed(1)} kg
            </span>
          )}
        </div>
      </div>
    );
  })();

  const pressaoSlide = (() => {
    const lastS = sist[sist.length - 1];
    const lastD = dias[dias.length - 1];
    const sOk = lastS ? lastS.valor >= BP_NORMAL.sistolica.min && lastS.valor <= BP_NORMAL.sistolica.max : null;
    const dOk = lastD ? lastD.valor >= BP_NORMAL.diastolica.min && lastD.valor <= BP_NORMAL.diastolica.max : null;
    const ok = sOk === null || dOk === null ? null : sOk && dOk;

    return (
      <div className="space-y-1.5">
        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-4xl font-light leading-none text-[#1a1557]">
              {lastS ? Math.round(lastS.valor) : "—"}
            </span>
            <span className="font-display text-2xl font-light text-[#1a1557]/60">/</span>
            <span className="font-display text-4xl font-light leading-none text-[#1a1557]">
              {lastD ? Math.round(lastD.valor) : "—"}
            </span>
            <span className="text-xs text-muted-foreground font-light ml-1">mmHg</span>
          </div>
          <div className="text-right">
            <span className="inline-block text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#f0c040]/15 text-[#a87a10]">
              Pressão
            </span>
            <p className="text-[10px] text-muted-foreground mt-1">
              {sist.length} {sist.length === 1 ? "aferição" : "aferições"}
            </p>
          </div>
        </div>
        <div className="space-y-0">
          <SparklineCompare values={sist.map((m) => m.valor)} color="#ef4444" normal={BP_NORMAL.sistolica} />
          <SparklineCompare values={dias.map((m) => m.valor)} color="#3b82f6" normal={BP_NORMAL.diastolica} />
        </div>
        {ok !== null && (
          <p className={`text-[10px] ${ok ? "text-emerald-700/80" : "text-amber-700/80"}`}>
            {ok
              ? `dentro do esperado (${BP_NORMAL.sistolica.min}–${BP_NORMAL.sistolica.max} / ${BP_NORMAL.diastolica.min}–${BP_NORMAL.diastolica.max})`
              : `fora da faixa esperada (${BP_NORMAL.sistolica.min}–${BP_NORMAL.sistolica.max} / ${BP_NORMAL.diastolica.min}–${BP_NORMAL.diastolica.max})`}
          </p>
        )}
      </div>
    );
  })();

  const atlasSlide = cursoRecente ? (
    <div
      className="flex items-stretch gap-3"
      onClick={(e) => e.stopPropagation()}
    >
      <Link
        to="/atlas/$slug"
        params={{ slug: cursoRecente.slug }}
        className="flex items-stretch gap-3 w-full no-underline"
      >
        <div className="relative w-20 h-24 rounded-lg overflow-hidden bg-[#1a1557]/10 flex-shrink-0">
          {(() => {
            const videoSrc = videoForAulaCover({
              capa_video_url: cursoRecente.capa_video_url,
              titulo: cursoRecente.titulo,
              descricao: cursoRecente.descricao_curta,
            });
            return (
              <video
                src={videoSrc}
                poster={cursoRecente.capa_url ?? undefined}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                className="absolute inset-0 w-full h-full object-cover"
              />
            );
          })()}
        </div>
        <div className="flex flex-col justify-between min-w-0 flex-1">
          <div>
            <span className="inline-block text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#f0c040]/15 text-[#a87a10]">
              Novo no Atlas
            </span>
            <h4 className="font-display text-lg font-medium text-[#1a1557] leading-tight mt-1.5 line-clamp-2">
              {cursoRecente.titulo}
            </h4>
          </div>
          <p className="text-[10px] text-muted-foreground line-clamp-1">
            {cursoRecente.instrutor_nome ?? "Atlas Materno"} ·{" "}
            {cursoRecente.total_aulas} {cursoRecente.total_aulas === 1 ? "aula" : "aulas"}
          </p>
        </div>
      </Link>
    </div>
  ) : null;

  const slides = [
    { label: "Cronograma", body: cronograma },
    { label: "Peso", body: pesoSlide },
    { label: "Pressão", body: pressaoSlide },
    ...(atlasSlide ? [{ label: "Atlas", body: atlasSlide }] : []),
  ];

  const currentSlide = slides[slide] ?? slides[0];

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.985 }}
        className="block w-full text-left group relative"
      >
        <LiquidCard className="px-4 py-3.5" bgOpacity={0.28}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-baseline gap-2">
              <h3 className="font-display font-medium text-lg text-[#1a1557] leading-tight">
                Sua jornada
              </h3>
              <span className="text-[9px] uppercase tracking-[0.18em] text-[#1a1557]/50 font-semibold">
                {currentSlide.label}
              </span>
            </div>
            <span className="text-[#1a1557] text-xl leading-none transition-transform group-hover:translate-x-0.5">
              ›
            </span>
          </div>

          <div className="relative min-h-[120px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                {currentSlide.body}
              </motion.div>
            </AnimatePresence>
          </div>

          <div
            className="flex justify-center gap-1.5 mt-3"
            onClick={(e) => e.stopPropagation()}
          >
            {slides.map((s, i) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setSlide(i)}
                aria-label={`Ir para ${s.label}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === slide ? "w-6 bg-[#1a1557]" : "w-1.5 bg-[#1a1557]/25"
                }`}
              />
            ))}
          </div>
        </LiquidCard>
      </motion.button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Meu cronograma</DialogTitle>
          </DialogHeader>
          <PregnancyTimeline userId={userId} dum={dum} cadastroISO={cadastroISO} />
        </DialogContent>
      </Dialog>
    </>
  );
}
