import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CycleState, PHASE_INFO, CyclePhase } from "@/lib/cycleEngine";
import { LearnMoreModal } from "@/components/LearnMoreModal";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";

interface CycleWheelProps {
  state: CycleState;
  lmpDate: string;
  onLogPeriod: () => void;
}

type CardType = "EAT" | "MOVE" | "DO";

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function dayToAngle(day: number, cycleLength: number): number {
  return (day / cycleLength) * 360 - 90;
}

function arcPath(
  cx: number, cy: number,
  outerR: number, innerR: number,
  startDeg: number, endDeg: number
): string {
  const o1 = polar(cx, cy, outerR, startDeg);
  const o2 = polar(cx, cy, outerR, endDeg);
  const i1 = polar(cx, cy, innerR, endDeg);
  const i2 = polar(cx, cy, innerR, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${o1.x} ${o1.y} A ${outerR} ${outerR} 0 ${large} 1 ${o2.x} ${o2.y} L ${i1.x} ${i1.y} A ${innerR} ${innerR} 0 ${large} 0 ${i2.x} ${i2.y} Z`;
}

interface PhaseSegment {
  phase: CyclePhase;
  startDay: number;
  endDay: number;
  gradId: string;
  glow?: boolean;
}

function getPhaseSegments(cycleLength: number, periodDuration: number, mucusLevel?: number): PhaseSegment[] {
  const ov = Math.round(cycleLength * 0.45);
  const summerStart = Math.max(ov - 2, periodDuration + 1);
  const summerEnd = Math.min(ov + 2, cycleLength - 2);
  const glowing = (mucusLevel ?? 0) >= 4;

  return [
    { phase: "winter", startDay: 1, endDay: periodDuration, gradId: "gradWinter" },
    { phase: "spring", startDay: periodDuration + 1, endDay: summerStart - 1, gradId: "gradSpring" },
    { phase: "summer", startDay: summerStart, endDay: summerEnd, gradId: "gradSummer", glow: glowing },
    { phase: "autumn", startDay: summerEnd + 1, endDay: cycleLength, gradId: "gradAutumn" },
  ];
}

function getNextEvent(state: CycleState, lmpDate: string) {
  const { currentDay, cycleLength, periodDuration = 5 } = state;
  const ov = Math.round(cycleLength * 0.45);
  const lmp = new Date(lmpDate);
  const nextPeriodDate = addDays(lmp, cycleLength);
  const daysUntilPeriod = cycleLength - currentDay + 1;
  const daysUntilOv = ov - currentDay;

  if (currentDay <= periodDuration) {
    const daysLeft = periodDuration - currentDay + 1;
    return { label: `Règles · encore ${daysLeft}j`, date: "", emoji: "🩸", color: "hsl(var(--phase-winter))" };
  }
  if (currentDay < ov - 1) {
    return {
      label: `Ovulation dans ${daysUntilOv} jour${daysUntilOv > 1 ? "s" : ""}`,
      date: format(addDays(new Date(), daysUntilOv), "d MMMM", { locale: fr }),
      emoji: "🌸",
      color: "hsl(var(--phase-summer))",
    };
  }
  if (currentDay <= ov + 2) {
    return { label: "✨ Pic d'ovulation", date: "Fenêtre fertile maintenant", emoji: "⭐", color: "hsl(var(--phase-summer))" };
  }
  return {
    label: `Règles dans ${daysUntilPeriod} jour${daysUntilPeriod > 1 ? "s" : ""}`,
    date: format(nextPeriodDate, "d MMMM yyyy", { locale: fr }),
    emoji: "🩸",
    color: "hsl(var(--phase-winter))",
  };
}

// ── Week Timeline Component ──────────────────────────────────────────
function WeekTimeline({ state, lmpDate, isPill }: { state: CycleState; lmpDate: string; isPill: boolean }) {
  const today = new Date();
  const ov = Math.round(state.cycleLength * 0.45);
  const periodDuration = state.periodDuration ?? 5;

  // Build 7-day window: 3 days back, today, 3 days forward
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i - 3);
    const diffFromLmp = Math.floor((date.getTime() - new Date(lmpDate).getTime()) / 86400000);
    const cycleDay = ((diffFromLmp % state.cycleLength) + state.cycleLength) % state.cycleLength + 1;
    const isOv = cycleDay >= ov - 1 && cycleDay <= ov + 1;
    const isPeriod = cycleDay <= periodDuration;
    const isToday = i === 3;
    return { date, cycleDay, isOv, isPeriod, isToday };
  });

  const phaseColors: Record<CyclePhase, string> = {
    winter: "hsl(var(--phase-winter))",
    spring: "hsl(var(--phase-spring))",
    summer: "hsl(var(--phase-summer))",
    autumn: "hsl(var(--phase-autumn))",
  };

  return (
    <div className="bg-card rounded-2xl p-4 shadow-card border border-border/40">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
        Cette semaine
      </p>
      <div className="flex justify-between gap-1">
        {days.map((d, i) => {
          // Determine phase color
          const seg = d.cycleDay <= periodDuration ? "winter"
            : d.cycleDay <= Math.round(state.cycleLength * 0.45) - 2 ? "spring"
            : d.cycleDay <= Math.round(state.cycleLength * 0.45) + 2 ? "summer"
            : "autumn";
          const dotColor = phaseColors[seg as CyclePhase];
          const dayLabel = format(d.date, "EEE", { locale: fr });
          const dayNum = d.date.getDate();

        return (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <span className="text-[10px] text-muted-foreground capitalize">{dayLabel}</span>
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center relative transition-all ${
                  d.isToday ? "shadow-soft" : ""
                }`}
                style={{
                  background: d.isToday ? dotColor : `${dotColor}28`,
                  border: d.isToday ? `2px solid ${dotColor}` : `1px solid ${dotColor}44`,
                  outline: d.isToday ? `2px solid ${dotColor}` : "none",
                  outlineOffset: "1px",
                }}
              >
                <span
                  className="text-[11px] font-bold"
                  style={{ color: d.isToday ? "white" : "hsl(var(--foreground))" }}
                >
                  {/* LOGIQUE SMART : On change l'icône selon le mode */}
                  {isPill 
                    ? (d.cycleDay === 1 ? "💊" : d.isToday ? "🌙" : dayNum)
                    : (d.isPeriod ? "💧" : d.isOv ? "⭐" : dayNum)
                  }
                </span>
              </div>
              <span className="text-[9px] text-muted-foreground">J{d.cycleDay}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CycleWheel({ state, lmpDate, onLogPeriod }: CycleWheelProps) {
  const [learnMore, setLearnMore] = useState<{ phase: CyclePhase; card: CardType } | null>(null);
  const [hoveredPhase, setHoveredPhase] = useState<CyclePhase | null>(null);

  const { currentDay, cycleLength, phase, entries, periodDuration = 5 } = state;
  const isPill = state.birthControl === 'pill';
  const todayEntry = entries.find((e) => e.day === currentDay);
  const mucus = todayEntry?.mucus;

  const cx = 190, cy = 190;
  const outerR = 160, innerR = 100;

  const segments = getPhaseSegments(cycleLength, periodDuration, mucus);
  const nextEvent = getNextEvent(state, lmpDate);
  const phaseInfo = PHASE_INFO[phase];
  const ovDay = Math.round(cycleLength * 0.45);

  const cursorAngle = dayToAngle(currentDay, cycleLength);
  const cursorPos = polar(cx, cy, (outerR + innerR) / 2, cursorAngle);

  // Ovulation star position
  const ovAngle = dayToAngle(ovDay, cycleLength);
  const ovPos = polar(cx, cy, (outerR + innerR) / 2 + 6, ovAngle);

  // Period droplet (day 1)
  const p1Angle = dayToAngle(1, cycleLength);
  const p1Pos = polar(cx, cy, outerR + 14, p1Angle);

  // Pastel gradient colors - Enhanced saturation
  const PHASE_GRADIENTS = {
    winter: { c1: "hsl(345 70% 65%)", c2: "hsl(340 55% 78%)" },
    spring: { c1: "hsl(95 55% 50%)", c2: "hsl(100 42% 70%)" },
    summer: { c1: "hsl(38 85% 58%)", c2: "hsl(32 70% 75%)" },
    autumn: { c1: "hsl(18 68% 50%)", c2: "hsl(22 55% 68%)" },
  };

  return (
    <div className="flex flex-col gap-4 pb-28">

      {/* ── Log Period Button ────────────────────────── */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.97 }}
        onClick={onLogPeriod}
        className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl border-2 border-dashed border-phase-winter/60 bg-phase-winter/8 hover:bg-phase-winter/15 transition-all active:scale-98"
      >
        <span className="text-xl">🩸</span>
        <span className="font-semibold text-sm text-phase-winter">Log mes règles</span>
        <span className="text-[10px] bg-phase-winter/20 text-phase-winter font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
          Recalcule le cycle
        </span>
      </motion.button>

      {/* ── LMP Date indicator ───────────────────────── */}
      {lmpDate && (
        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] text-muted-foreground">
            📅 Dernier J1 :{" "}
            <span className="font-semibold text-foreground">
              {format(new Date(lmpDate), "d MMMM yyyy", { locale: fr })}
            </span>
          </p>
          <p className="text-[11px] text-muted-foreground">
            Prochain cycle :{" "}
            <span className="font-semibold text-foreground">
              {format(addDays(new Date(lmpDate), cycleLength), "d MMMM", { locale: fr })}
            </span>
          </p>
        </div>
      )}

    {/* ── Week Timeline ────────────────────────────── */}
<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
  <WeekTimeline 
    state={state} 
    lmpDate={lmpDate} 
    isPill={isPill} 
  />
</motion.div>

      {/* ── Wheel Card ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="bg-card rounded-3xl p-5 shadow-card border border-border/40 flex flex-col items-center"
      >
        <div className="self-start mb-3">
          <h2 className="font-display text-xl font-semibold text-foreground">Mon Cycle</h2>
          <p className="text-xs text-muted-foreground">Touche une phase pour explorer</p>
        </div>

        {/* SVG Wheel */}
        <div style={{ width: 380, height: 380 }}>
          <svg width={380} height={380} viewBox="0 0 380 380">
            <defs>
              {(["winter", "spring", "summer", "autumn"] as CyclePhase[]).map((p) => {
                const g = PHASE_GRADIENTS[p];
                return (
                  <radialGradient key={p} id={`grad${p.charAt(0).toUpperCase() + p.slice(1)}`} cx="50%" cy="50%" r="60%">
                    <stop offset="0%" stopColor={g.c1} />
                    <stop offset="100%" stopColor={g.c2} />
                  </radialGradient>
                );
              })}
              <filter id="glowSummer">
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="softShadow">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
              </filter>
              <filter id="glowCursor">
                <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Background ring */}
            <circle cx={cx} cy={cy} r={outerR + 2} fill="hsl(var(--muted))" opacity="0.3" />
            <circle cx={cx} cy={cy} r={outerR} fill="hsl(var(--muted))" opacity="0.6" />

            {/* Phase segments */}
            {segments.map((seg) => {
              const startAngle = dayToAngle(seg.startDay, cycleLength);
              const endAngle = dayToAngle(seg.endDay + 1, cycleLength);
              const isActive = seg.phase === phase;
              const isHovered = hoveredPhase === seg.phase;

              return (
                <g key={seg.phase}>
                  <path
                    d={arcPath(cx, cy, outerR, innerR, startAngle, endAngle)}
                    fill={`url(#${seg.gradId})`}
                    opacity={isActive ? 1 : isHovered ? 0.85 : 0.65}
                    filter={seg.glow ? "url(#glowSummer)" : undefined}
                    style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                    onClick={() => setLearnMore({ phase: seg.phase, card: "EAT" })}
                    onMouseEnter={() => setHoveredPhase(seg.phase)}
                    onMouseLeave={() => setHoveredPhase(null)}
                  />
                  {/* Active ring */}
                  {isActive && (
                    <path
                      d={arcPath(cx, cy, outerR + 5, outerR + 1, startAngle, endAngle)}
                      fill={PHASE_GRADIENTS[seg.phase].c1}
                      opacity={0.4}
                      style={{ pointerEvents: "none" }}
                    />
                  )}
                  {/* Emoji label */}
                  {(() => {
                    const midDay = (seg.startDay + seg.endDay) / 2;
                    const midA = dayToAngle(midDay, cycleLength);
                    const { x, y } = polar(cx, cy, (outerR + innerR) / 2, midA);
                    return (
                      <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="14" style={{ pointerEvents: "none", userSelect: "none" }}>
                        {PHASE_INFO[seg.phase].emoji}
                      </text>
                    );
                  })()}
                </g>
              );
            })}

            {/* Fine tick marks */}
            {Array.from({ length: cycleLength }).map((_, i) => {
              const day = i + 1;
              const angle = dayToAngle(day, cycleLength);
              const outer = polar(cx, cy, outerR, angle);
              const inner = polar(cx, cy, outerR - 5, angle);
              const isMajor = day % 7 === 1 || day === 1;
              return (
                <line key={day} x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y}
                  stroke="hsl(var(--background))" strokeWidth={isMajor ? 1.5 : 0.6}
                  opacity={isMajor ? 0.9 : 0.5} />
              );
            })}

            {/* Inner circle (center) */}
            <circle cx={cx} cy={cy} r={innerR - 1} fill="hsl(var(--card))" filter="url(#softShadow)" />

         {/* ── Ovulation star marker : On la cache pour la pilule ── */}
{!isPill && (
  <text 
    x={ovPos.x} y={ovPos.y} 
    textAnchor="middle" dominantBaseline="middle" 
    fontSize="12" style={{ userSelect: "none" }}
  >
    ⭐
  </text>
)}

{/* ── Marqueur J1 : On remplace la goutte par une pilule ── */}
<text 
  x={p1Pos.x} y={p1Pos.y} 
  textAnchor="middle" dominantBaseline="middle" 
  fontSize="11" style={{ userSelect: "none" }}
>
  {isPill ? "💊" : "💧"}
</text>

            {/* Animated cursor arm */}
            <motion.g
              animate={{ rotate: cursorAngle + 90 }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
              transition={{ type: "spring", stiffness: 80, damping: 18 }}
            >
              <line x1={cx} y1={cy - innerR + 2} x2={cx} y2={cy - outerR + 4}
                stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
            </motion.g>

            {/* Moon cursor dot */}
            <motion.g
              animate={{ x: cursorPos.x - cx, y: cursorPos.y - cy }}
              style={{ x: 0, y: 0 }}
              transition={{ type: "spring", stiffness: 80, damping: 18 }}
            >
              <circle cx={cx} cy={cy} r={16} fill="hsl(var(--foreground))" opacity="0.95" filter="url(#glowCursor)" />
              <circle cx={cx} cy={cy} r={13} fill="hsl(var(--card))" />
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="20"
                style={{ userSelect: "none" }}>🌙</text>
            </motion.g>

            {/* Center text */}
            <text x={cx} y={cy - 28} textAnchor="middle" dominantBaseline="middle" fontSize="12"
              fill="hsl(var(--muted-foreground))" fontFamily="DM Sans, sans-serif" fontWeight="600">Jour</text>
            <text x={cx} y={cy + 8} textAnchor="middle" dominantBaseline="middle" fontSize="48"
              fontWeight="700" fill="hsl(var(--foreground))" fontFamily="Playfair Display, serif">{currentDay}</text>
            <text x={cx} y={cy + 32} textAnchor="middle" dominantBaseline="middle" fontSize="12"
              fill="hsl(var(--muted-foreground))" fontFamily="DM Sans, sans-serif" fontWeight="600">sur {cycleLength}</text>
          </svg>
        </div>

        {/* Phase legend */}
        <div className="flex flex-wrap gap-3 mt-1 justify-center">
          {segments.map((seg) => (
            <button
              key={seg.phase}
              onClick={() => setLearnMore({ phase: seg.phase, card: "EAT" })}
              className="flex items-center gap-1.5 text-[11px] font-medium transition-opacity"
              style={{ color: seg.phase === phase ? PHASE_GRADIENTS[seg.phase].c1 : "hsl(var(--muted-foreground))", opacity: seg.phase === phase ? 1 : 0.7 }}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: PHASE_GRADIENTS[seg.phase].c1 }} />
              {PHASE_INFO[seg.phase].label}
              {seg.phase === phase && <span className="text-[9px] font-bold">· Actif</span>}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Next Event ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-3xl p-4 shadow-card border border-border/40 flex items-center gap-4"
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-soft"
          style={{ background: `${nextEvent.color}25`, border: `2px solid ${nextEvent.color}50` }}
        >
          <span className="text-xl">{nextEvent.emoji}</span>
        </div>
        <div>
          <p className="font-display text-sm font-semibold text-foreground">{nextEvent.label}</p>
          {nextEvent.date && <p className="text-xs text-muted-foreground mt-0.5">{nextEvent.date}</p>}
        </div>
      </motion.div>

      {/* ── Phase info + click-to-learn cards ───────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.27 }}
        className="bg-card rounded-3xl p-5 shadow-card border border-border/40"
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl animate-float inline-block">{phaseInfo.emoji}</span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Phase actuelle</p>
            <h3 className="font-display text-lg font-semibold text-foreground">{phaseInfo.label} · {phaseInfo.season}</h3>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{phaseInfo.description}</p>
        <div className="grid grid-cols-3 gap-2">
          {(["EAT", "MOVE", "DO"] as CardType[]).map((card, i) => {
            const icons = { EAT: "🍽️", MOVE: "🏃‍♀️", DO: "📓" };
            const labels = { EAT: "Nutrition", MOVE: "Sport", DO: "Mindset" };
            const bgs = { EAT: "bg-sage-light border-sage", MOVE: "bg-terracotta-light border-terracotta", DO: "bg-rose-mist border-secondary" };
            return (
              <motion.button
                key={card}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.33 + i * 0.07 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => setLearnMore({ phase, card })}
                className={`rounded-2xl border p-3 flex flex-col items-center gap-1.5 text-center transition-all hover:shadow-soft ${bgs[card]}`}
              >
                <span className="text-xl">{icons[card]}</span>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{card}</p>
                <p className="text-[11px] font-semibold text-foreground leading-tight">{labels[card]}</p>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Mucus glow alert */}
      <AnimatePresence>
        {(mucus ?? 0) >= 4 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-card rounded-2xl p-4 border border-phase-summer/50 flex items-start gap-3 shadow-soft"
          >
            <span className="text-xl flex-shrink-0">💧</span>
            <div>
              <p className="text-sm font-semibold text-foreground">Pic de glaire détecté ⭐</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Glaire fertile (niveau {mucus}/5) — ovulation imminente. L'étoile ⭐ brille sur ton cadran.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {learnMore && (
        <LearnMoreModal phase={learnMore.phase} cardType={learnMore.card} onClose={() => setLearnMore(null)} />
      )}
    </div>
  );
}
