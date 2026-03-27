import { useState, useMemo, useCallback } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  Legend as RechartsLegend,
} from "recharts";
import { CycleState, PHASE_INFO } from "@/lib/cycleEngine";
import { motion, AnimatePresence } from "framer-motion";

interface HormonalChartProps {
  state: CycleState;
}

// ── Realistic physiological curves ──────────────────────────────────

function generateNaturalData(cycleLength: number) {
  const data: {
    day: number;
    estradiol: number;
    progesterone: number;
    lh: number;
    tempOffset: number; // in 0.01°C above 36.5
  }[] = [];

  const ovDay = Math.round(cycleLength * 0.46); // ~J13

  for (let day = 1; day <= cycleLength; day++) {
    // ── Estradiol (pg/mL) ──────────────────────────────
    // Baseline ~30 pg/mL → rises from J6 → sharp peak ~300 pg/mL at ovulation → dips → 2nd small plateau ~120 pg/mL mid-luteal
    const estrPrimary = 280 * Math.exp(-Math.pow((day - ovDay) / 3.2, 2));
    const estrSecondary = 80 * Math.exp(-Math.pow((day - cycleLength * 0.72) / 4.5, 2));
    const estrBaseline = day < ovDay ? 30 + (day / ovDay) * 40 : 30;
    const estradiol = Math.max(18, Math.round(estrBaseline + estrPrimary + estrSecondary));

    // ── Progesterone (ng/mL) ───────────────────────────
    // Nearly 0 in follicular → rises sharply after ovulation → plateau ~14–18 ng/mL mid-luteal → drops before period
    const progCenter = cycleLength * 0.71;
    const progWidth = cycleLength * 0.12;
    const progPeak = 16;
    const progesterone =
      day < ovDay + 1
        ? Math.max(0.5, 1.2 - (ovDay - day) * 0.04)
        : Math.round(
            (progPeak * Math.exp(-Math.pow((day - progCenter) / progWidth, 2)) + 0.5) * 10
          ) / 10;

    // ── LH (mUI/mL) ────────────────────────────────────
    // Sharp surge 1–2 days before ovulation, peak ~80–100 mUI/mL, otherwise ~5–8
    const lhPeak = ovDay - 1;
    const lh = Math.max(5, Math.round(8 + 92 * Math.exp(-Math.pow((day - lhPeak) / 1.2, 2))));

    // ── Basal Body Temperature offset (×10 °C above 36.5) ─
    // Pre-ovulation: ~36.5–36.7, post-ovulation shift +0.3–0.5°C → plateau at ~37.0–37.1
    const tempShift = day > ovDay + 1 ? 4 + 2 * (1 - Math.exp(-(day - ovDay - 1) / 3)) : 0;
    const tempNoise = (Math.sin(day * 1.7) * 0.4); // small variation
    const tempOffset = Math.round((tempShift + tempNoise) * 10) / 10;

    data.push({ day, estradiol, progesterone, lh, tempOffset });
  }
  return data;
}

// Menopause: flat low lines + elevated FSH
function generateMenopauseData() {
  return Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    estradiol: 12 + Math.sin(i * 0.8) * 2.5, // ~10–15 pg/mL, minimal variation
    progesterone: 0.3 + Math.sin(i * 1.1) * 0.1, // ~0.2–0.4 ng/mL
    fsh: 42 + Math.sin(i * 0.6) * 4, // >30 mUI/mL, elevated
  }));
}

// Mode Pilule : Plateau stable (Protection active)
function generatePillData(cycleLength: number) {
  return Array.from({ length: cycleLength }, (_, i) => {
    const day = i + 1;
    let multiplier = 1;

    // Simulation de la chute pendant la pause (J22-J28) ou montée initiale (J1-J7)
    if (day <= 5) multiplier = 0.2 + (day * 0.1); 
    else if (day > 24) multiplier = 1 - ((day - 24) * 0.2);
    else multiplier = 1;

    return {
      day,
      // Valeurs de plateau "actives" plus hautes
      estradiol: Math.max(20, (80 + Math.sin(day * 0.2) * 5) * multiplier), 
      progesterone: Math.max(0.5, (6 + Math.sin(day * 0.3) * 1) * multiplier),
      lh: 5, // Reste bas car bloqué
      tempOffset: 2, // Stable
    };
  });
}

// ✅ Mode Post-partum : Pic grossesse → Falaise verticale 3j → Plateau repos ovarien (12 semaines)
function generatePostPartumData() {
  const DAYS = 84; // 12 semaines
  return Array.from({ length: DAYS }, (_, i) => {
    const day = i + 1;
    let estradiol, progesterone, prolactin;

    if (day === 1) {
      estradiol = 300; progesterone = 20; prolactin = 40;
    } else if (day <= 3) {
      const t = (day - 1) / 2;
      estradiol = 300 * Math.exp(-t * 3.5);
      progesterone = 20 * Math.exp(-t * 3.5);
      prolactin = 40 + day * 30;
    } else {
      estradiol = 12 + Math.sin(day * 0.15) * 2;
      progesterone = 0.4 + Math.sin(day * 0.2) * 0.1;
      prolactin = Math.max(20, 150 * Math.exp(-(day - 3) / 40));
    }

    return {
      day,
      estradiol: Math.max(Math.round(estradiol * 10) / 10, 12),
      progesterone: Math.max(Math.round(progesterone * 10) / 10, 0.3),
      prolactin: Math.round(prolactin),
      lh: 5,
      tempOffset: 2,
    };
  });
}

// Popups interactifs pour le mode Post-Partum
function getPPPopupForDay(day: number): HormonalPopup | null {
  if (day === 1) return {
    title: "🤰 Fin de Grossesse · Pic Hormonal Maximum",
    body: "En fin de grossesse, tes œstrogènes sont au sommet (~300 pg/mL, représentation normalisée). C'est le point de départ de la falaise hormonale.",
    emoji: "⛰️", color: "hsl(38 75% 65%)",
  };
  if (day <= 3) return {
    title: "⚡ La Falaise Hormonale · J1–J3",
    body: "Chute de 95% des œstrogènes et progestérone en 72h seulement. C'est la chute hormonale la plus brutale connue. Elle cause le baby blues, les tranchées et la montée de lait.",
    emoji: "📉", color: "hsl(var(--phase-winter))",
  };
  if (day <= 21) return {
    title: "🛏️ S1–S3 · Repos & Cicatrisation",
    body: "Repos ovarien total. Les hormones au minimum permettent la cicatrisation utérine. Priorité : Fer, Vitamine C, repos horizontal et bouillon d'os.",
    emoji: "🤍", color: "hsl(350 60% 80%)",
  };
  if (day <= 56) return {
    title: "⚗️ S4–S8 · Reminéralisation",
    body: "Le plateau hormonal bas se maintient (surtout si allaitement : la prolactine inhibe les œstrogènes). Focus Fer, Iode et Oméga-3 DHA.",
    emoji: "🌿", color: "hsl(38 70% 75%)",
  };
  return {
    title: "🌱 S9–S12 · Stabilisation Hormonale",
    body: "Les œstrogènes commencent à remonter légèrement. L'humeur se stabilise. Moment idéal pour introduire le mouvement doux et la rééducation périnéale.",
    emoji: "✨", color: "hsl(140 45% 72%)",
  };
}

// ── Info-bubbles per key hormonal moment ────────────────────────────
interface HormonalPopup {
  title: string;
  body: string;
  emoji: string;
  color: string;
}

function getPopupForDay(day: number, cycleLength: number, isPill?: boolean): HormonalPopup | null {
  // --- CAS PILULE ---
  if (isPill) {
    if (day > 21) {
      return {
        title: "🩸 Phase de retrait (Pause)",
        body: "L'arrêt des hormones de synthèse provoque une chute du taux sanguin. Ce ne sont pas des règles naturelles, mais un saignement de retrait dû à la pause de ta plaquette.",
        emoji: "💊",
        color: "hsl(var(--phase-winter))",
      };
    }
    return {
      title: "🛡️ Plateau de protection",
      body: "Tes hormones sont maintenues à un niveau constant pour bloquer l'ovulation. Cette stabilité évite les montagnes russes émotionnelles et physiques du cycle naturel.",
      emoji: "✨",
      color: "hsl(38 75% 65%)",
    };
  }

  // --- CAS CYCLE NATUREL (Ton code d'avant) ---
  const ovDay = Math.round(cycleLength * 0.46);

  if (day >= ovDay - 1 && day <= ovDay + 1) {
    return {
      title: `⭐ Pic d'œstrogènes · ~280 pg/mL`,
      body: "Tes œstrogènes sont au maximum. Ton corps est en mode « Performance maximale ». C'est le moment idéal pour le sport intense, les conversations importantes et la créativité.",
      emoji: "☀️",
      color: "hsl(var(--phase-summer))",
    };
  }
  if (day >= Math.round(cycleLength * 0.62) && day <= Math.round(cycleLength * 0.78)) {
    return {
      title: `🌿 Plateau progestérone · ~14–18 ng/mL`,
      body: "Ta progestérone est en plateau. Ta température basale a monté. Focus sur la satiété et le magnésium.",
      emoji: "🍂",
      color: "hsl(var(--phase-autumn))",
    };
  }
  if (day <= Math.round(cycleLength * 0.18)) {
    return {
      title: "❄️ Hormones au repos",
      body: "Phase de régénération. Ton corps se nettoie et se prépare. Priorise le repos.",
      emoji: "❄️",
      color: "hsl(var(--phase-winter))",
    };
  }
  if (day > Math.round(cycleLength * 0.18) && day < ovDay - 1) {
    return {
      title: "🌱 Montée des œstrogènes",
      body: "Les œstrogènes montent progressivement. Ta mémoire et ton endurance s'améliorent chaque jour.",
      emoji: "🌱",
      color: "hsl(var(--phase-spring))",
    };
  }
  return null;
}

// ── Custom Tooltip ───────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, cycleLength, isMenopause }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2.5 shadow-float text-xs min-w-[140px]">
      <p className="font-semibold text-foreground mb-2">
        {isMenopause ? `Jour ${label} (stabilité)` : `Jour ${label}`}
      </p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-3 mb-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
            <span className="text-muted-foreground">{p.name}</span>
          </div>
          <span className="font-bold text-foreground">{typeof p.value === "number" ? p.value.toFixed(p.name.includes("Prog") ? 1 : 0) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Popup card for hormonal events ──────────────────────────────────
function HormonalPopupCard({ popup, onClose }: { popup: HormonalPopup; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 4, scale: 0.98 }}
        transition={{ duration: 0.25 }}
        className="mt-3 rounded-2xl border border-border/60 bg-card px-4 py-3 flex gap-3"
        style={{ borderLeftWidth: 3, borderLeftColor: popup.color }}
      >
        <span className="text-xl flex-shrink-0">{popup.emoji}</span>
        <div className="flex-1">
          <p className="text-xs font-bold text-foreground mb-0.5">{popup.title}</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{popup.body}</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm flex-shrink-0">✕</button>
      </motion.div>
    </AnimatePresence>
  );
}

export function HormonalChart({ state }: HormonalChartProps) {
  const [activePopup, setActivePopup] = useState<HormonalPopup | null>(null);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const isMenopause = state.mode === "menopause";
  const isPostPartum = state.mode === "postpartum"; 
  const isPill = state.mode === "pill" || state.mode === "hormonal";

  // 1. D'ABORD : On prépare les sources de données
  const naturalData = useMemo(() => generateNaturalData(state.cycleLength), [state.cycleLength]);
  const menopauseData = useMemo(() => generateMenopauseData(), []);
  const pillData = useMemo(() => generatePillData(state.cycleLength), [state.cycleLength]);
  const ppData = useMemo(() => generatePostPartumData(), []);

  // 2. ENSUITE : On choisit la source active
  const displayData = isMenopause 
    ? menopauseData 
    : isPostPartum 
    ? ppData 
    : (isPill ? pillData : naturalData);

  const handleChartClick = useCallback(
    (e: any) => {
      if (isMenopause || !e?.activePayload) return;
      const day = e.activeLabel as number;
      if (isPostPartum) {
        const popup = getPPPopupForDay(day);
        if (popup) setActivePopup(popup);
        return;
      }
      const popup = getPopupForDay(day, state.cycleLength, isPill);
      if (popup) setActivePopup(popup);
    },
    [isMenopause, isPill, isPostPartum, state.cycleLength]
  );

  // ── Post-partum version ───────────────────────────────────────────
  if (isPostPartum) {
    return (
      <div className="bg-card rounded-3xl p-4 shadow-card border border-border/40">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
              Graphique Hormonal · Post-Partum · 12 Semaines
            </p>
            <h3 className="font-display text-base font-semibold text-foreground leading-tight">
              La Falaise Hormonale & Récupération 🤍
            </h3>
          </div>
          <span className="text-2xl">👶</span>
        </div>

        <p className="text-[10px] text-muted-foreground mb-2">
          Touche la courbe pour comprendre chaque étape de ta récupération
        </p>

        <div className="h-48 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={ppData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }} onClick={handleChartClick} style={{ cursor: "pointer" }}>
              <defs>
                <linearGradient id="gradEstPP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(38 75% 65%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(38 75% 65%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradProgPP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--phase-autumn))" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(var(--phase-autumn))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradProlactin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(210 70% 62%)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(210 70% 62%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                interval={6}
                tickFormatter={(v) => `J${v}`}
              />
              <YAxis
                yAxisId="hormones"
                orientation="left"
                domain={[0, 320]}
                tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <Tooltip content={<CustomTooltipPP />} />

              {/* Zones de récupération */}
              <ReferenceLine yAxisId="hormones" x={21} stroke="hsl(350 60% 70%)" strokeWidth={1} strokeDasharray="3 3"
                label={{ value: "S3", position: "top", fontSize: 8, fill: "hsl(350 60% 70%)", fontWeight: 700 }} />
              <ReferenceLine yAxisId="hormones" x={56} stroke="hsl(38 60% 65%)" strokeWidth={1} strokeDasharray="3 3"
                label={{ value: "S8", position: "top", fontSize: 8, fill: "hsl(38 60% 65%)", fontWeight: 700 }} />

              <Area yAxisId="hormones" type="monotone" dataKey="progesterone"
                stroke="hsl(var(--phase-autumn))" strokeWidth={2} fill="url(#gradProgPP)" dot={false} name="Progestérone (ng/mL)" />
              <Area yAxisId="hormones" type="monotone" dataKey="prolactin"
                stroke="hsl(210 70% 62%)" strokeWidth={1.5} fill="url(#gradProlactin)" dot={false} name="Prolactine (ng/mL)" strokeDasharray="4 2" />
              <Area yAxisId="hormones" type="monotone" dataKey="estradiol"
                stroke="hsl(38 75% 60%)" strokeWidth={3} fill="url(#gradEstPP)" dot={false} name="Estradiol (pg/mL)" />

              <ReferenceLine yAxisId="hormones" x={state.currentDay > 84 ? 84 : state.currentDay}
                stroke="hsl(var(--foreground))" strokeWidth={2} strokeDasharray="4 3"
                label={{ value: `J${state.currentDay} ◀`, position: "insideTopRight", fontSize: 9, fill: "hsl(var(--foreground))", fontWeight: 700 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3">
          {[
            { color: "hsl(38 75% 60%)", label: "Estradiol (pg/mL)", dashed: false },
            { color: "hsl(var(--phase-autumn))", label: "Progestérone (ng/mL)", dashed: false },
            { color: "hsl(210 70% 62%)", label: "Prolactine (ng/mL)", dashed: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className="h-0.5 w-4 rounded-full"
                style={item.dashed ? { borderTop: `2px dashed ${item.color}`, background: "transparent" } : { background: item.color }} />
              <span className="text-[10px] text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>

        <AnimatePresence>
          {activePopup && <HormonalPopupCard popup={activePopup} onClose={() => setActivePopup(null)} />}
        </AnimatePresence>

        {!activePopup && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            onClick={() => { const p = getPPPopupForDay(state.currentDay); if (p) setActivePopup(p); }}
            className="mt-3 w-full text-[11px] text-primary font-semibold text-center py-2 rounded-xl bg-primary/8 hover:bg-primary/15 transition-colors active:scale-97"
          >
            Comprendre ma récupération aujourd'hui &rsaquo;
          </motion.button>
        )}

        <div className="mt-3 bg-muted/60 rounded-2xl px-4 py-3 flex gap-2.5">
          <span className="text-base flex-shrink-0">🤍</span>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            La chute hormonale du post-partum est la plus brutale que le corps humain connaisse. <strong className="text-foreground">Ce que tu ressens est biologique, pas personnel.</strong> LUNAYA t'accompagne semaine par semaine.
          </p>
        </div>
      </div>
    );
  }

  // ── Menopause version ────────────────────────────────────────────
  if (isMenopause) {
    return (
      <div className="bg-card rounded-3xl p-4 shadow-card border border-border/40">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
              Graphique Hormonal · Mode Ménopause
            </p>
            <h3 className="font-display text-base font-semibold text-foreground leading-tight">
              Stabilité Hormonale
            </h3>
          </div>
          <span className="text-2xl">🛡️</span>
        </div>

        {/* Menopause chart */}
        <div className="h-40 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={menopauseData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gradEstMeno" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(38 75% 65%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(38 75% 65%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradFsh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(210 70% 60%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(210 70% 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="day"
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                interval={4}
                label={{ value: "jours", position: "insideBottomRight", offset: -4, fontSize: 8, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                yAxisId="estMeno"
                orientation="left"
                domain={[0, 25]}
                tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}`}
                width={28}
              />
              <YAxis
                yAxisId="fsh"
                orientation="right"
                domain={[0, 80]}
                tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <Tooltip
                content={<CustomTooltip cycleLength={30} isMenopause />}
              />

              <Area
                yAxisId="estMeno"
                type="monotone"
                dataKey="estradiol"
                stroke="hsl(38 75% 65%)"
                strokeWidth={2.5}
                fill="url(#gradEstMeno)"
                dot={false}
                name="Estradiol (pg/mL)"
              />
              <Line
                yAxisId="estMeno"
                type="monotone"
                dataKey="progesterone"
                stroke="hsl(var(--phase-autumn))"
                strokeWidth={2}
                dot={false}
                name="Progestérone (ng/mL)"
              />
              <Area
                yAxisId="fsh"
                type="monotone"
                dataKey="fsh"
                stroke="hsl(210 70% 60%)"
                strokeWidth={2}
                fill="url(#gradFsh)"
                dot={false}
                name="FSH (mUI/mL)"
                strokeDasharray="4 2"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
          {[
            { color: "hsl(38 75% 65%)", label: "Estradiol (pg/mL)", dashed: false },
            { color: "hsl(var(--phase-autumn))", label: "Progestérone (ng/mL)", dashed: false },
            { color: "hsl(210 70% 60%)", label: "FSH (mUI/mL)", dashed: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div
                className="h-0.5 w-5 rounded-full"
                style={
                  item.dashed
                    ? { borderTop: `2px dashed ${item.color}`, background: "transparent" }
                    : { background: item.color }
                }
              />
              <span className="text-[10px] text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Reassurance note */}
        <div className="mt-3 bg-muted/60 rounded-2xl px-4 py-3 flex gap-2.5">
          <span className="text-base flex-shrink-0">💡</span>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            En ménopause, l'absence de pic hormonal est normale. La FSH élevée ({'>'}30 mUI/mL) confirme la transition. <strong className="text-foreground">LUNAYA t'aide à stabiliser ton confort quotidien malgré ces taux bas</strong> — calcium, vitamine D et renforcement musculaire restent tes meilleurs alliés.
          </p>
        </div>
      </div>
    );
  }

  // ── Natural / Hormonal cycle version ────────────────────────────
  const ovDay = Math.round(state.cycleLength * 0.46);
const msg = isPostPartum
    ? { text: "Récupération post-partum — La falaise hormonale.", emoji: "🤍" }
    : isPill 
    ? { text: "Protection active — Climat hormonal stable.", emoji: "🛡️" }
    : {
        winter: { text: "Tes hormones sont au repos. Régénération en cours.", emoji: "❄️" },
        spring: { text: "Tes œstrogènes montent — créativité et endurance au max !", emoji: "🌱" },
        summer: { text: "Pic d'œstrogènes ~300 pg/mL. Ton superpower est activé ✨", emoji: "☀️" },
        autumn: { text: "Progestérone en plateau. Température +0,4°C. Ancre-toi.", emoji: "🍂" },
      }[state.phase] || { text: "Suivi de ton équilibre hormonal", emoji: "✨" };
  
  return (
    <div className="bg-card rounded-3xl p-4 shadow-card border border-border/40">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
            Courbes Hormonales · Interactif
          </p>
          <h3 className="font-display text-base font-semibold text-foreground leading-tight">
            {msg.text}
          </h3>
        </div>
        <span className="text-2xl">{msg.emoji}</span>
      </div>

      <p className="text-[10px] text-muted-foreground mb-2">
        Touche la courbe pour voir les valeurs et comprendre chaque moment clé
      </p>

      {/* Chart */}
      <div className="h-44 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
         <ComposedChart
  data={displayData} // <--- CHANGE CECI (Remplace naturalData par displayData)
  margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
  onClick={handleChartClick}
  style={{ cursor: "pointer" }}
          >
            <defs>
              <linearGradient id="gradEstr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(38 75% 65%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(38 75% 65%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradProg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--phase-autumn))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--phase-autumn))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradLHNat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(210 70% 62%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(210 70% 62%)" stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* Dual Y axes: left for hormones, right for temperature */}
            <XAxis
              dataKey="day"
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              interval={Math.floor(state.cycleLength / 6)}
            />
            {/* Left axis: estradiol (pg/mL) */}
            <YAxis
              yAxisId="estrogen"
              orientation="left"
              domain={[0, 320]}
              tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v === 0 ? "" : `${v}`}
              width={30}
            />
            {/* Right axis: temperature offset */}
            <YAxis
              yAxisId="temp"
              orientation="right"
              domain={[-2, 10]}
              tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(36.5 + v / 10).toFixed(1)}°`}
              width={34}
            />

            <Tooltip
              content={
                <CustomTooltipNatural cycleLength={state.cycleLength} />
              }
            />

            {/* Progesterone (ng/mL × 10 for same scale, right axis note: we scale internally) */}
            <Area
              yAxisId="estrogen"
              type="monotone"
              dataKey="progesterone"
              stroke="hsl(var(--phase-autumn))"
              strokeWidth={2.5}
              fill="url(#gradProg)"
              dot={false}
              name="Progestérone"
              // progesterone values are ng/mL × 10 internally for display on same axis
            />

            {/* LH surge (sharp peak) */}
            <Area
              yAxisId="estrogen"
              type="monotone"
              dataKey="lh"
              stroke="hsl(210 70% 62%)"
              strokeWidth={1.5}
              fill="url(#gradLHNat)"
              dot={false}
              name="LH"
              strokeDasharray="3 2"
            />

            {/* Estradiol (primary, gold/terracotta) */}
            <Area
              yAxisId="estrogen"
              type="monotone"
              dataKey="estradiol"
              stroke="hsl(38 75% 60%)"
              strokeWidth={3}
              fill="url(#gradEstr)"
              dot={false}
              name="Estradiol"
            />

            {/* Temperature overlay (thin line, right axis) */}
            <Line
              yAxisId="temp"
              type="monotone"
              dataKey="tempOffset"
              stroke="hsl(var(--phase-winter))"
              strokeWidth={1.5}
              dot={false}
              name="Température"
              strokeDasharray="2 2"
              opacity={0.8}
            />

          {/* Ovulation reference — On ne l'affiche PAS sous pilule */}
            {!isPill && !isMenopause && (
              <ReferenceLine
                yAxisId="estrogen"
                x={ovDay}
                stroke="hsl(var(--phase-summer))"
                strokeWidth={1}
                strokeDasharray="4 3"
                label={{ value: "Ov.", position: "top", fontSize: 8, fill: "hsl(var(--phase-summer))", fontWeight: 700 }}
              />
            )}
           
            {/* "Tu es ici" cursor */}
            <ReferenceLine
              yAxisId="estrogen"
              x={state.currentDay}
              stroke="hsl(var(--foreground))"
              strokeWidth={2}
              strokeDasharray="4 3"
              label={{
                value: `J${state.currentDay} ◀`,
                position: "insideTopRight",
                fontSize: 9,
                fill: "hsl(var(--foreground))",
                fontWeight: 700,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3">
        {[
          { color: "hsl(38 75% 60%)", label: "Estradiol (pg/mL)", dashed: false },
          { color: "hsl(var(--phase-autumn))", label: "Progestérone (ng/mL)", dashed: false },
          { color: "hsl(210 70% 62%)", label: "LH (mUI/mL)", dashed: true },
          { color: "hsl(var(--phase-winter))", label: "Température", dashed: true },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              className="h-0.5 w-4 rounded-full"
              style={
                item.dashed
                  ? { borderTop: `2px dashed ${item.color}`, background: "transparent" }
                  : { background: item.color }
              }
            />
            <span className="text-[10px] text-muted-foreground">{item.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="h-3 w-px border-l-2 border-dashed border-foreground/60" />
          <span className="text-[10px] text-muted-foreground font-semibold">Tu es ici</span>
        </div>
      </div>

    {/* Current day info popup */}
      <AnimatePresence>
        {activePopup && (
          <HormonalPopupCard popup={activePopup} onClose={() => setActivePopup(null)} />
        )}
      </AnimatePresence>

      {/* Bouton dynamique : affiche les conseils cycle OU pilule */}
      {!activePopup && !isMenopause && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={() => {
            const popup = getPopupForDay(state.currentDay, state.cycleLength, isPill);
            if (popup) setActivePopup(popup);
          }}
          className="mt-3 w-full text-[11px] text-primary font-semibold text-center py-2 rounded-xl bg-primary/8 hover:bg-primary/15 transition-colors active:scale-97"
        >
          Comprendre mes hormones aujourd'hui &rsaquo;
        </motion.button>
      )}
    </div>
  );
} // <--- CETTE ACCOLADE FERME LE COMPOSANT HormonalChart

// ── Custom tooltip for Post-Partum ──────────────────────────────────────
function CustomTooltipPP({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2.5 shadow-float text-xs min-w-[160px]">
      <p className="font-semibold text-foreground mb-1.5">Jour {label} {label <= 3 ? "🌊 Falaise" : label <= 21 ? "🛏️ S1-S3" : label <= 56 ? "⚗️ S4-S8" : "🌱 S9-S12"}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-3 mb-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
            <span className="text-muted-foreground">{p.name}</span>
          </div>
          <span className="font-bold text-foreground">{typeof p.value === "number" ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Custom tooltip for natural cycle with correct units ────────────────
function CustomTooltipNatural({ active, payload, label, cycleLength }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2.5 shadow-float text-xs min-w-[160px]">
      <p className="font-semibold text-foreground mb-1.5">Jour {label}</p>
      {payload.map((p: any) => {
        let unit = "";
        let displayVal = p.value;
        if (p.name === "Estradiol") unit = " pg/mL";
        else if (p.name === "Progestérone") { unit = " ng/mL"; displayVal = (p.value / 10).toFixed(1); }
        else if (p.name === "LH") unit = " mUI/mL";
        else if (p.name === "Température") { unit = "°C"; displayVal = (36.5 + p.value / 10).toFixed(2); }
        return (
          <div key={p.name} className="flex items-center justify-between gap-3 mb-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
              <span className="text-muted-foreground">{p.name}</span>
            </div>
            <span className="font-bold text-foreground">{displayVal}{unit}</span>
          </div>
        );
      })}
    </div>
  );
}
