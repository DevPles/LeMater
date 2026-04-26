import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import { ConsultationNotesPanel } from "./ConsultationNotesPanel";

type Slot = {
  id: string;
  data_hora: string;
  duracao_min: number;
  modalidade: string;
  status: string;
  gestante_id: string | null;
  observacao: string | null;
  titulo: string | null;
  descricao: string | null;
  tipo_atendimento: string | null;
};

type Profile = {
  user_id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  data_nascimento: string | null;
  dum: string | null;
  cidade: string | null;
  bairro: string | null;
  unidade_saude: string | null;
  numero_gestacoes: number | null;
  numero_partos: number | null;
  numero_abortos: number | null;
  bebe_sexo: string | null;
  cpf: string | null;
  foto_url: string | null;
};

type Med = {
  id: string;
  parametro: string;
  valor: number;
  data_medicao: string;
  semana_gestacional: number | null;
  observacao: string | null;
};

type Exam = {
  id: string;
  tipo_exame: string;
  resultado: string;
  status: string;
  data_exame: string;
  observacao: string | null;
};

type ImgExam = {
  id: string;
  tipo_exame: string;
  status: string;
  data_exame: string;
  laudo_texto: string | null;
};

type Vacc = {
  id: string;
  vacina: string;
  data_aplicacao: string;
};

type Alert = {
  id: string;
  origem: string;
  severidade: string;
  titulo: string;
  mensagem: string;
  data: string;
};

function calcularSemanas(dum: string | null): number | null {
  if (!dum) return null;
  const start = new Date(dum).getTime();
  const diffDays = Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return null;
  return Math.floor(diffDays / 7);
}

function calcularIdade(nasc: string | null): number | null {
  if (!nasc) return null;
  const d = new Date(nasc);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function fmtData(s: string) {
  return new Date(s).toLocaleDateString("pt-BR");
}

export function GestanteDetalheModal({
  slot,
  onClose,
}: {
  slot: Slot;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [meds, setMeds] = useState<Med[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [imgExams, setImgExams] = useState<ImgExam[]>([]);
  const [vaccs, setVaccs] = useState<Vacc[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [meuUserId, setMeuUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setMeuUserId(data.session?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    let ativo = true;
    if (!slot.gestante_id) {
      setLoading(false);
      return;
    }
    const gid = slot.gestante_id;

    (async () => {
      setLoading(true);
      setErro(null);
      try {
        const [pRes, mRes, eRes, iRes, vRes, aRes] = await Promise.all([
          supabase
            .from("profiles")
            .select(
              "user_id, nome, email, telefone, data_nascimento, dum, cidade, bairro, unidade_saude, numero_gestacoes, numero_partos, numero_abortos, bebe_sexo, cpf, foto_url",
            )
            .eq("user_id", gid)
            .maybeSingle(),
          supabase
            .from("clinical_measurements")
            .select("id, parametro, valor, data_medicao, semana_gestacional, observacao")
            .eq("gestante_id", gid)
            .order("data_medicao", { ascending: false })
            .limit(20),
          supabase
            .from("exam_results")
            .select("id, tipo_exame, resultado, status, data_exame, observacao")
            .eq("gestante_id", gid)
            .order("data_exame", { ascending: false })
            .limit(20),
          supabase
            .from("image_exam_results")
            .select("id, tipo_exame, status, data_exame, laudo_texto")
            .eq("gestante_id", gid)
            .order("data_exame", { ascending: false })
            .limit(10),
          supabase
            .from("vaccinations")
            .select("id, vacina, data_aplicacao")
            .eq("gestante_id", gid)
            .order("data_aplicacao", { ascending: false })
            .limit(20),
          supabase.rpc("get_active_alerts", { _gestante_id: gid }),
        ]);

        if (!ativo) return;
        if (pRes.error) throw pRes.error;
        setProfile(pRes.data as Profile | null);
        setMeds((mRes.data ?? []) as Med[]);
        setExams((eRes.data ?? []) as Exam[]);
        setImgExams((iRes.data ?? []) as ImgExam[]);
        setVaccs((vRes.data ?? []) as Vacc[]);
        setAlerts((aRes.data ?? []) as Alert[]);
      } catch (e) {
        if (!ativo) return;
        setErro((e as Error).message ?? "Erro ao carregar dados");
      } finally {
        if (ativo) setLoading(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, [slot.gestante_id]);

  const semanas = calcularSemanas(profile?.dum ?? null);
  const idade = calcularIdade(profile?.data_nascimento ?? null);
  const dt = new Date(slot.data_hora);

  async function carregarFotoBase64(url: string | null): Promise<{ data: string; format: "JPEG" | "PNG" } | null> {
    if (!url) return null;
    try {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) return null;
      const blob = await res.blob();
      const fmt: "JPEG" | "PNG" = blob.type.includes("png") ? "PNG" : "JPEG";
      const data: string = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(blob);
      });
      return { data, format: fmt };
    } catch {
      return null;
    }
  }

  async function exportarPDF() {
    if (!profile) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 36;
    const contentW = pageW - margin * 2;
    let y = 0;

    // Paleta moderna
    const C = {
      ink: [17, 24, 39] as [number, number, number],
      sub: [107, 114, 128] as [number, number, number],
      muted: [156, 163, 175] as [number, number, number],
      line: [229, 231, 235] as [number, number, number],
      bg: [249, 250, 251] as [number, number, number],
      brand: [26, 21, 87] as [number, number, number],
      brand2: [79, 70, 229] as [number, number, number],
      coral: [244, 114, 114] as [number, number, number],
      amber: [217, 119, 6] as [number, number, number],
      amberBg: [254, 243, 199] as [number, number, number],
      rose: [190, 18, 60] as [number, number, number],
      roseBg: [254, 226, 226] as [number, number, number],
      green: [5, 150, 105] as [number, number, number],
      greenBg: [209, 250, 229] as [number, number, number],
      white: [255, 255, 255] as [number, number, number],
    };

    const setFill = (c: [number, number, number]) => doc.setFillColor(c[0], c[1], c[2]);
    const setText = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);
    const setDraw = (c: [number, number, number]) => doc.setDrawColor(c[0], c[1], c[2]);

    const ensureSpace = (h: number) => {
      if (y + h > pageH - 50) {
        addFooter();
        doc.addPage();
        y = margin;
      }
    };

    const addFooter = () => {
      const total = doc.getNumberOfPages();
      const pageNum = doc.getCurrentPageInfo().pageNumber;
      setText(C.muted);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(
        `Documento gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
        margin,
        pageH - 24,
      );
      doc.text(`Página ${pageNum} / ${total}`, pageW - margin, pageH - 24, { align: "right" });
      setDraw(C.line);
      doc.setLineWidth(0.5);
      doc.line(margin, pageH - 36, pageW - margin, pageH - 36);
    };

    const text = (
      t: string,
      x: number,
      yPos: number,
      opts?: { size?: number; bold?: boolean; color?: [number, number, number]; align?: "left" | "right" | "center"; maxW?: number },
    ) => {
      doc.setFontSize(opts?.size ?? 10);
      doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
      setText(opts?.color ?? C.ink);
      if (opts?.maxW) {
        const lines = doc.splitTextToSize(t, opts.maxW);
        doc.text(lines, x, yPos, { align: opts?.align });
        return (opts?.size ?? 10) * 1.2 * lines.length;
      }
      doc.text(t, x, yPos, { align: opts?.align });
      return (opts?.size ?? 10) * 1.2;
    };

    const writeWrapped = (
      t: string,
      x: number,
      maxW: number,
      opts?: { size?: number; bold?: boolean; color?: [number, number, number]; lineHeight?: number },
    ) => {
      const size = opts?.size ?? 10;
      const lh = opts?.lineHeight ?? size + 4;
      doc.setFontSize(size);
      doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
      setText(opts?.color ?? C.ink);
      const lines = doc.splitTextToSize(t, maxW);
      for (const ln of lines) {
        ensureSpace(lh);
        doc.text(ln, x, y);
        y += lh;
      }
    };

    const roundedRect = (x: number, yy: number, w: number, h: number, r: number, fill: [number, number, number] | null, stroke: [number, number, number] | null) => {
      if (fill) setFill(fill);
      if (stroke) {
        setDraw(stroke);
        doc.setLineWidth(0.6);
      }
      const style = fill && stroke ? "FD" : fill ? "F" : "S";
      doc.roundedRect(x, yy, w, h, r, r, style);
    };

    const sectionTitle = (t: string, count?: number) => {
      y += 14;
      ensureSpace(28);
      // Barra lateral decorativa
      setFill(C.coral);
      doc.rect(margin, y - 8, 3, 14, "F");
      text(t.toUpperCase(), margin + 10, y + 3, { size: 10, bold: true, color: C.brand });
      if (count !== undefined) {
        const w = doc.getTextWidth(String(count)) + 14;
        const xBadge = margin + 10 + doc.getTextWidth(t.toUpperCase()) + 8;
        roundedRect(xBadge, y - 6, w, 12, 6, C.bg, C.line);
        text(String(count), xBadge + w / 2, y + 2, { size: 8, bold: true, color: C.sub, align: "center" });
      }
      y += 12;
      setDraw(C.line);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageW - margin, y);
      y += 10;
    };

    const badge = (x: number, yy: number, label: string, kind: "ok" | "warn" | "danger" | "muted") => {
      const map = {
        ok: { bg: C.greenBg, fg: C.green },
        warn: { bg: C.amberBg, fg: C.amber },
        danger: { bg: C.roseBg, fg: C.rose },
        muted: { bg: C.bg, fg: C.sub },
      } as const;
      const m = map[kind];
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      const w = doc.getTextWidth(label.toUpperCase()) + 12;
      roundedRect(x, yy - 8, w, 12, 6, m.bg, null);
      setText(m.fg);
      doc.text(label.toUpperCase(), x + w / 2, yy, { align: "center" });
      return w;
    };

    // ===================== HEADER =====================
    const headerH = 110;
    setFill(C.brand);
    doc.rect(0, 0, pageW, headerH, "F");
    // Acento decorativo
    setFill(C.brand2);
    doc.rect(0, headerH - 6, pageW, 6, "F");
    setFill(C.coral);
    doc.rect(0, headerH - 3, pageW * 0.35, 3, "F");

    setText(C.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("PREPARAÇÃO PARA O ATENDIMENTO", margin, 32);
    doc.setFontSize(20);
    doc.text(slot.titulo ?? "Atendimento clínico", margin, 56);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setText([200, 200, 230]);
    const headerInfo = `${dt.toLocaleDateString("pt-BR")}  •  ${dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}  •  ${slot.duracao_min} min  •  ${slot.modalidade === "videochamada" ? "Videochamada" : "Presencial"}`;
    doc.text(headerInfo, margin, 76);

    if (slot.tipo_atendimento) {
      doc.setFontSize(9);
      setText([180, 180, 220]);
      doc.text(slot.tipo_atendimento, margin, 92);
    }

    y = headerH + 24;

    // ===================== CARD DA GESTANTE =====================
    const cardH = 110;
    ensureSpace(cardH);
    roundedRect(margin, y, contentW, cardH, 10, C.bg, C.line);

    // Foto
    const fotoBase = await carregarFotoBase64(profile.foto_url);
    const fotoSize = 78;
    const fotoX = margin + 16;
    const fotoY = y + (cardH - fotoSize) / 2;
    if (fotoBase) {
      try {
        // Círculo de borda
        setFill(C.white);
        doc.circle(fotoX + fotoSize / 2, fotoY + fotoSize / 2, fotoSize / 2 + 2, "F");
        doc.addImage(fotoBase.data, fotoBase.format, fotoX, fotoY, fotoSize, fotoSize, undefined, "FAST");
      } catch {
        setFill(C.brand2);
        doc.circle(fotoX + fotoSize / 2, fotoY + fotoSize / 2, fotoSize / 2, "F");
        text((profile.nome ?? "?").charAt(0).toUpperCase(), fotoX + fotoSize / 2, fotoY + fotoSize / 2 + 10, {
          size: 32,
          bold: true,
          color: C.white,
          align: "center",
        });
      }
    } else {
      setFill(C.brand2);
      doc.circle(fotoX + fotoSize / 2, fotoY + fotoSize / 2, fotoSize / 2, "F");
      text((profile.nome ?? "?").charAt(0).toUpperCase(), fotoX + fotoSize / 2, fotoY + fotoSize / 2 + 10, {
        size: 32,
        bold: true,
        color: C.white,
        align: "center",
      });
    }

    // Dados ao lado
    const dx = fotoX + fotoSize + 20;
    const dWidth = contentW - (dx - margin) - 16;
    let dy = y + 26;
    text(profile.nome ?? "Sem nome", dx, dy, { size: 16, bold: true, color: C.ink });
    dy += 18;
    const linha2: string[] = [];
    if (idade !== null) linha2.push(`${idade} anos`);
    if (profile.cidade) linha2.push(profile.cidade);
    if (profile.bairro) linha2.push(profile.bairro);
    text(linha2.join("  •  ") || "—", dx, dy, { size: 10, color: C.sub, maxW: dWidth });
    dy += 14;
    if (profile.unidade_saude) {
      text(`UBS  ${profile.unidade_saude}`, dx, dy, { size: 9, color: C.sub, maxW: dWidth });
      dy += 14;
    }
    // Mini dados
    dy += 4;
    const mini = [
      profile.telefone ? `Tel  ${profile.telefone}` : null,
      profile.cpf ? `CPF  ${profile.cpf}` : null,
    ].filter(Boolean) as string[];
    text(mini.join("    "), dx, dy, { size: 9, color: C.ink });
    dy += 12;
    if (profile.email) text(profile.email, dx, dy, { size: 9, color: C.brand2 });

    y += cardH + 6;

    // ===================== STATS GRID =====================
    y += 14;
    ensureSpace(70);
    const statsLabels: { label: string; value: string; accent: [number, number, number] }[] = [
      { label: "SEMANAS", value: semanas !== null ? String(semanas) : "—", accent: C.coral },
      { label: "GESTAÇÕES", value: String(profile.numero_gestacoes ?? 0), accent: C.brand2 },
      { label: "PARTOS", value: String(profile.numero_partos ?? 0), accent: C.green },
      { label: "ABORTOS", value: String(profile.numero_abortos ?? 0), accent: C.amber },
      { label: "DUM", value: profile.dum ? fmtData(profile.dum) : "—", accent: C.brand },
    ];
    const gap = 8;
    const cardW = (contentW - gap * (statsLabels.length - 1)) / statsLabels.length;
    statsLabels.forEach((s, i) => {
      const x = margin + i * (cardW + gap);
      roundedRect(x, y, cardW, 56, 8, C.white, C.line);
      // accent bar
      setFill(s.accent);
      doc.rect(x, y, cardW, 3, "F");
      text(s.label, x + cardW / 2, y + 18, { size: 7.5, bold: true, color: C.sub, align: "center" });
      const isLong = s.value.length > 8;
      text(s.value, x + cardW / 2, y + 40, { size: isLong ? 11 : 18, bold: true, color: C.ink, align: "center" });
    });
    y += 56;

    // ===================== ALERTAS =====================
    sectionTitle("Alertas ativos", alerts.length);
    if (alerts.length === 0) {
      writeWrapped("Nenhum alerta clínico ativo no momento.", margin, contentW, { size: 9, color: C.muted });
    } else {
      alerts.forEach((a) => {
        const isUrg = a.severidade === "urgente";
        const bg = isUrg ? C.roseBg : C.amberBg;
        const fg = isUrg ? C.rose : C.amber;
        // Calcular altura
        doc.setFontSize(9);
        const msgLines = doc.splitTextToSize(a.mensagem, contentW - 24);
        const boxH = 38 + msgLines.length * 11;
        ensureSpace(boxH + 6);
        roundedRect(margin, y, contentW, boxH, 8, bg, null);
        // Barra lateral
        setFill(fg);
        doc.rect(margin, y, 3, boxH, "F");
        text(a.titulo, margin + 12, y + 16, { size: 10.5, bold: true, color: fg });
        badge(margin + 12 + doc.getTextWidth(a.titulo) + 8, y + 14, a.severidade, isUrg ? "danger" : "warn");
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        setText(C.ink);
        doc.text(msgLines, margin + 12, y + 30);
        text(`${a.origem.toUpperCase()}  •  ${fmtData(a.data)}`, margin + 12, y + boxH - 8, {
          size: 7.5,
          bold: true,
          color: C.sub,
        });
        y += boxH + 6;
      });
    }

    // ===================== MEDIÇÕES =====================
    sectionTitle("Últimas medições", meds.length);
    if (meds.length === 0) {
      writeWrapped("Nenhuma medição registrada.", margin, contentW, { size: 9, color: C.muted });
    } else {
      // Cabeçalho da tabela
      ensureSpace(20);
      setFill(C.bg);
      doc.rect(margin, y, contentW, 18, "F");
      const colData = margin + 10;
      const colParam = margin + 90;
      const colVal = margin + contentW - 110;
      const colSem = margin + contentW - 30;
      text("DATA", colData, y + 12, { size: 7.5, bold: true, color: C.sub });
      text("PARÂMETRO", colParam, y + 12, { size: 7.5, bold: true, color: C.sub });
      text("VALOR", colVal, y + 12, { size: 7.5, bold: true, color: C.sub, align: "right" });
      text("SEM.", colSem, y + 12, { size: 7.5, bold: true, color: C.sub, align: "right" });
      y += 18;
      meds.forEach((m, i) => {
        ensureSpace(18);
        if (i % 2 === 1) {
          setFill([252, 252, 253]);
          doc.rect(margin, y, contentW, 18, "F");
        }
        text(fmtData(m.data_medicao), colData, y + 12, { size: 9, color: C.ink });
        text(m.parametro, colParam, y + 12, { size: 9, color: C.ink });
        text(String(m.valor), colVal, y + 12, { size: 9, bold: true, color: C.brand, align: "right" });
        text(m.semana_gestacional !== null ? String(m.semana_gestacional) : "—", colSem, y + 12, {
          size: 9,
          color: C.sub,
          align: "right",
        });
        setDraw(C.line);
        doc.setLineWidth(0.3);
        doc.line(margin, y + 18, pageW - margin, y + 18);
        y += 18;
      });
    }

    // ===================== EXAMES LAB =====================
    sectionTitle("Exames laboratoriais", exams.length);
    if (exams.length === 0) {
      writeWrapped("Nenhum exame laboratorial.", margin, contentW, { size: 9, color: C.muted });
    } else {
      exams.forEach((e) => {
        doc.setFontSize(9);
        const resLines = doc.splitTextToSize(e.resultado, contentW - 24);
        const h = 26 + resLines.length * 11 + 14;
        ensureSpace(h + 4);
        roundedRect(margin, y, contentW, h, 8, C.white, C.line);
        text(e.tipo_exame, margin + 12, y + 16, { size: 10, bold: true, color: C.ink });
        const kind = e.status === "alterado" ? "danger" : e.status === "normal" ? "ok" : "muted";
        badge(pageW - margin - 12 - 60, y + 14, e.status, kind);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        setText(C.sub);
        doc.text(resLines, margin + 12, y + 32);
        text(fmtData(e.data_exame), margin + 12, y + h - 6, { size: 7.5, bold: true, color: C.muted });
        y += h + 4;
      });
    }

    // ===================== EXAMES IMAGEM =====================
    sectionTitle("Exames de imagem", imgExams.length);
    if (imgExams.length === 0) {
      writeWrapped("Nenhum exame de imagem.", margin, contentW, { size: 9, color: C.muted });
    } else {
      imgExams.forEach((e) => {
        doc.setFontSize(9);
        const laudo = e.laudo_texto ?? "Sem laudo descritivo.";
        const lines = doc.splitTextToSize(laudo, contentW - 24);
        const h = 26 + lines.length * 11 + 14;
        ensureSpace(h + 4);
        roundedRect(margin, y, contentW, h, 8, C.white, C.line);
        text(e.tipo_exame, margin + 12, y + 16, { size: 10, bold: true, color: C.ink });
        const kind = e.status === "alterado" ? "danger" : e.status === "normal" ? "ok" : "muted";
        badge(pageW - margin - 12 - 60, y + 14, e.status, kind);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        setText(C.sub);
        doc.text(lines, margin + 12, y + 32);
        text(fmtData(e.data_exame), margin + 12, y + h - 6, { size: 7.5, bold: true, color: C.muted });
        y += h + 4;
      });
    }

    // ===================== VACINAS =====================
    sectionTitle("Vacinas aplicadas", vaccs.length);
    if (vaccs.length === 0) {
      writeWrapped("Nenhuma vacina registrada.", margin, contentW, { size: 9, color: C.muted });
    } else {
      const colW = (contentW - 8) / 2;
      vaccs.forEach((v, i) => {
        const col = i % 2;
        if (col === 0) ensureSpace(28);
        const x = margin + col * (colW + 8);
        roundedRect(x, y, colW, 24, 6, C.bg, C.line);
        text(v.vacina, x + 10, y + 15, { size: 9.5, bold: true, color: C.ink });
        text(fmtData(v.data_aplicacao), x + colW - 10, y + 15, { size: 8.5, color: C.sub, align: "right" });
        if (col === 1 || i === vaccs.length - 1) y += 28;
      });
    }

    // ===================== OBSERVAÇÃO =====================
    if (slot.observacao) {
      sectionTitle("Observação do horário");
      doc.setFontSize(9);
      const obsLines = doc.splitTextToSize(slot.observacao, contentW - 24);
      const h = obsLines.length * 12 + 16;
      ensureSpace(h);
      roundedRect(margin, y, contentW, h, 8, C.amberBg, null);
      setFill(C.amber);
      doc.rect(margin, y, 3, h, "F");
      doc.setFont("helvetica", "normal");
      setText(C.ink);
      doc.text(obsLines, margin + 12, y + 14);
      y += h;
    }

    // Footer da última página
    addFooter();

    const nomeArq = (profile.nome ?? "gestante").replace(/\s+/g, "_").toLowerCase();
    doc.save(`atendimento_${nomeArq}_${dt.toISOString().slice(0, 10)}.pdf`);
  }


  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-card w-full max-w-3xl max-h-[92vh] sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="bg-[#1a1557] text-white px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-white/60 font-bold">
              Preparação para o atendimento
            </p>
            <p className="text-base font-bold truncate">
              {slot.titulo ?? "Atendimento"}
            </p>
            <p className="text-xs text-white/80">
              {dt.toLocaleDateString("pt-BR")} às{" "}
              {dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}{" "}
              • {slot.duracao_min} min •{" "}
              {slot.modalidade === "videochamada" ? "Vídeo" : "Presencial"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={exportarPDF}
              disabled={!profile}
              className="bg-white text-[#1a1557] hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed rounded-full px-3 h-8 text-[11px] font-bold"
              aria-label="Exportar em PDF"
              title="Exportar em PDF"
            >
              PDF
            </button>
            <button
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 text-sm font-bold"
              aria-label="Fechar"
            >
              ×
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-5 space-y-5">
          {!slot.gestante_id ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Este horário ainda não tem gestante reservada.
            </p>
          ) : loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Carregando dados clínicos...</p>
          ) : erro ? (
            <p className="text-sm text-rose-700 text-center py-8 bg-rose-50 rounded-lg">{erro}</p>
          ) : !profile ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Não foi possível carregar o perfil da gestante.
            </p>
          ) : (
            <>
              {/* identificação */}
              <section className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {profile.foto_url ? (
                    <img src={profile.foto_url} alt={profile.nome ?? ""} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-muted-foreground">
                      {(profile.nome ?? "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold text-foreground truncate">
                    {profile.nome ?? "Sem nome"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {idade !== null ? `${idade} anos` : "Idade não informada"}
                    {profile.cidade ? ` • ${profile.cidade}` : ""}
                    {profile.bairro ? ` / ${profile.bairro}` : ""}
                  </p>
                  {profile.unidade_saude && (
                    <p className="text-xs text-muted-foreground">UBS: {profile.unidade_saude}</p>
                  )}
                </div>
              </section>

              {/* contato */}
              <section className="grid grid-cols-2 gap-2 text-xs">
                <Info label="Telefone" value={profile.telefone} />
                <Info label="E-mail" value={profile.email} />
                <Info label="CPF" value={profile.cpf} />
                <Info label="DUM" value={profile.dum ? fmtData(profile.dum) : null} />
              </section>

              {/* gestação */}
              <section className="bg-muted/40 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Sem. gest." value={semanas !== null ? `${semanas}` : "—"} />
                <Stat label="Gestações" value={String(profile.numero_gestacoes ?? 0)} />
                <Stat label="Partos" value={String(profile.numero_partos ?? 0)} />
                <Stat label="Abortos" value={String(profile.numero_abortos ?? 0)} />
              </section>

              {/* alertas ativos */}
              <Bloco titulo={`Alertas ativos (${alerts.length})`}>
                {alerts.length === 0 ? (
                  <Vazio>Nenhum alerta ativo.</Vazio>
                ) : (
                  <ul className="space-y-2">
                    {alerts.map((a) => (
                      <li
                        key={a.id}
                        className={`text-xs rounded-lg px-3 py-2 border ${
                          a.severidade === "urgente"
                            ? "bg-rose-50 border-rose-200 text-rose-900"
                            : "bg-amber-50 border-amber-200 text-amber-900"
                        }`}
                      >
                        <p className="font-bold">{a.titulo}</p>
                        <p>{a.mensagem}</p>
                        <p className="text-[10px] uppercase tracking-wide opacity-70 mt-1">
                          {a.origem} • {fmtData(a.data)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </Bloco>

              {/* últimas medições */}
              <Bloco titulo={`Últimas medições (${meds.length})`}>
                {meds.length === 0 ? (
                  <Vazio>Nenhuma medição registrada.</Vazio>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        <tr>
                          <th className="text-left py-1">Data</th>
                          <th className="text-left py-1">Parâmetro</th>
                          <th className="text-right py-1">Valor</th>
                          <th className="text-right py-1">Sem.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {meds.map((m) => (
                          <tr key={m.id}>
                            <td className="py-1.5">{fmtData(m.data_medicao)}</td>
                            <td className="py-1.5">{m.parametro}</td>
                            <td className="py-1.5 text-right font-semibold">{m.valor}</td>
                            <td className="py-1.5 text-right text-muted-foreground">
                              {m.semana_gestacional ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Bloco>

              {/* exames laboratoriais */}
              <Bloco titulo={`Exames laboratoriais (${exams.length})`}>
                {exams.length === 0 ? (
                  <Vazio>Nenhum exame laboratorial.</Vazio>
                ) : (
                  <ul className="space-y-1.5">
                    {exams.map((e) => (
                      <li
                        key={e.id}
                        className="text-xs flex items-start justify-between gap-2 border-b border-border pb-1.5"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">{e.tipo_exame}</p>
                          <p className="text-muted-foreground">{e.resultado}</p>
                          <p className="text-[10px] text-muted-foreground">{fmtData(e.data_exame)}</p>
                        </div>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                            e.status === "alterado"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {e.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Bloco>

              {/* exames de imagem */}
              <Bloco titulo={`Exames de imagem (${imgExams.length})`}>
                {imgExams.length === 0 ? (
                  <Vazio>Nenhum exame de imagem.</Vazio>
                ) : (
                  <ul className="space-y-1.5">
                    {imgExams.map((e) => (
                      <li
                        key={e.id}
                        className="text-xs flex items-start justify-between gap-2 border-b border-border pb-1.5"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">{e.tipo_exame}</p>
                          {e.laudo_texto && (
                            <p className="text-muted-foreground line-clamp-2">{e.laudo_texto}</p>
                          )}
                          <p className="text-[10px] text-muted-foreground">{fmtData(e.data_exame)}</p>
                        </div>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                            e.status === "alterado"
                              ? "bg-rose-100 text-rose-700"
                              : e.status === "normal"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {e.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Bloco>

              {/* vacinas */}
              <Bloco titulo={`Vacinas aplicadas (${vaccs.length})`}>
                {vaccs.length === 0 ? (
                  <Vazio>Nenhuma vacina registrada.</Vazio>
                ) : (
                  <ul className="text-xs grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {vaccs.map((v) => (
                      <li
                        key={v.id}
                        className="flex items-center justify-between border-b border-border py-1"
                      >
                        <span className="font-semibold text-foreground">{v.vacina}</span>
                        <span className="text-muted-foreground">{fmtData(v.data_aplicacao)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Bloco>

              {slot.observacao && (
                <Bloco titulo="Observação do horário">
                  <p className="text-xs text-foreground bg-muted/40 rounded-lg px-3 py-2">
                    {slot.observacao}
                  </p>
                </Bloco>
              )}

              {meuUserId && slot.gestante_id && (
                <ConsultationNotesPanel
                  appointmentId={slot.id}
                  gestanteId={slot.gestante_id}
                  professionalUserId={meuUserId}
                />
              )}
            </>
          )}
        </div>

        <div className="border-t border-border p-3 flex justify-end bg-muted/20">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-bold bg-[#1a1557] text-white hover:opacity-90"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold">{label}</p>
      <p className="text-xs text-foreground">{value || "—"}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold">{label}</p>
      <p className="text-base font-bold text-foreground">{value}</p>
    </div>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-wide text-foreground mb-2">{titulo}</p>
      {children}
    </section>
  );
}

function Vazio({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground italic">{children}</p>;
}
