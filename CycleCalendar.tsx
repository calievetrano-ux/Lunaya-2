import { motion } from "framer-motion";
import { CycleState, PHASE_INFO, detectPhase } from "@/lib/cycleEngine";

interface CycleCalendarProps {
  state: CycleState;
  onDaySelect: (day: number) => void;
}

function getDayPhase(day: number, state: CycleState) {
  const simState = { ...state, currentDay: day };
  return detectPhase(simState);
}

const PHASE_DOT_BG: Record<string, string> = {
  winter: "bg-phase-winter",
  spring: "bg-phase-spring",
  summer: "bg-phase-summer",
  autumn: "bg-phase-autumn",
};

const DAYS_FR = ["L", "M", "M", "J", "V", "S", "D"];

export function CycleCalendar({ state, onDaySelect }: CycleCalendarProps) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const offset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const periodDuration = state.periodDuration ?? 5;
  const ovulationDay = state.ovulationDay ?? Math.round(state.cycleLength * 0.45);

  // Map calendar day → cycle day
  const cycleStartDate = new Date(now);
  cycleStartDate.setDate(now.getDate() - state.currentDay + 1);

  const getCycleDay = (calDay: number) => {
    const d = new Date(year, month, calDay);
    const diff = Math.round((d.getTime() - cycleStartDate.getTime()) / 86400000) + 1;
    return ((diff - 1 + state.cycleLength * 4) % state.cycleLength) + 1;
  };

  const isPeriodDay = (cycleDay: number) => cycleDay >= 1 && cycleDay <= periodDuration;
  const isOvulationDay = (cycleDay: number) => cycleDay === ovulationDay;
  const isFertileDay = (cycleDay: number) =>
    cycleDay >= ovulationDay - 2 && cycleDay <= ovulationDay + 1 && cycleDay > periodDuration;

  return (
    <div className="flex flex-col gap-5 pb-28">
    {/* Legend */}
      {state.mode !== "menopause" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-2 px-1"
        >
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-phase-winter" />
            <span className="text-[10px] font-medium text-muted-foreground">Règles</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-phase-summer" />
            <span className="text-[10px] font-medium text-muted-foreground">Fenêtre fertile</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-[hsl(45_90%_52%)]" />
            <span className="text-[10px] font-medium text-muted-foreground">Ovulation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-primary/80" />
            <span className="text-[10px] font-medium text-muted-foreground">Aujourd'hui</span>
          </div>
        </motion.div>
      )}

      {/* Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-3xl p-5 shadow-card border border-border/40"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold capitalize">
            {new Date(year, month).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
          </h2>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS_FR.map((d, i) => (
            <div key={i} className="text-center text-[10px] font-semibold text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const calDay = idx + 1;
            const cycleDay = getCycleDay(calDay);
            const phase = getDayPhase(cycleDay, state);
            const isToday = calDay === now.getDate();
            const isSelected = cycleDay === state.currentDay;
            const entry = state.entries.find((e) => e.day === cycleDay);
            const hasBleeding = entry?.bleeding || isPeriodDay(cycleDay);
const isMeno = state.mode === "menopause";
const ovDay = isMeno ? false : isOvulationDay(cycleDay);
const fertile = isMeno ? false : isFertileDay(cycleDay);
const period = isMeno ? false : isPeriodDay(cycleDay);
            let bgClass = "";
            let textClass = "text-foreground";
            let dotColor = "";

            if (isToday) {
              bgClass = "gradient-hero shadow-soft";
              textClass = "text-primary-foreground";
            } else if (ovDay) {
              bgClass = "bg-[hsl(45_90%_52%)] shadow-sm";
              textClass = "text-[hsl(30_60%_15%)]";
            } else if (period) {
              bgClass = "bg-phase-winter/90 shadow-sm";
              textClass = "text-white";
            } else if (fertile) {
              bgClass = "bg-phase-summer/30 ring-1 ring-phase-summer/60";
            } else if (isSelected) {
              bgClass = "ring-2 ring-offset-1 ring-terracotta bg-terracotta/20";
            } else {
              bgClass = `${PHASE_DOT_BG[phase]}/10 hover:ring-1 hover:ring-muted-foreground/30`;
            }

            return (
              <motion.button
                key={calDay}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.008, duration: 0.2 }}
                whileTap={{ scale: 0.88 }}
                onClick={() => onDaySelect(cycleDay)}
                className="flex flex-col items-center py-0.5 focus:outline-none"
              >
                <div
                  className={`relative w-9 h-9 rounded-full flex flex-col items-center justify-center transition-all duration-200 ${bgClass}`}
                >
                  <span className={`text-[11px] font-semibold leading-none ${textClass}`}>{calDay}</span>

                  {/* Ovulation star */}
                  {ovDay && !isToday && (
                    <span className="text-[7px] leading-none mt-0.5">⭐</span>
                  )}

                  {/* Today pulse ring */}
                  {isToday && (
                    <span className="absolute -inset-1 rounded-full border-2 border-primary/60 animate-ping opacity-60" />
                  )}

                  {/* Bleeding dot for logged days only (not predicted) */}
                  {entry?.bleeding && !period && (
                    <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-phase-winter" />
                  )}
                </div>

                {/* Sub-label */}
                <span
                  className={`text-[8px] mt-0.5 font-bold ${
                    isToday
                      ? "text-primary"
                      : ovDay
                      ? "text-[hsl(45_70%_42%)]"
                      : period
                      ? "text-phase-winter"
                      : isSelected
                      ? "text-terracotta"
                      : "text-muted-foreground"
                  }`}
                >
                  {isToday ? "auj." : ovDay ? "OVU" : `J${cycleDay}`}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Selected day info */}
        <motion.div
          key={state.currentDay}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 pt-4 border-t border-border/40 flex items-center gap-3"
        >
          {isPeriodDay(state.currentDay) ? (
            <div className="w-3 h-3 rounded-full bg-phase-winter" />
          ) : isOvulationDay(state.currentDay) ? (
            <span className="text-base">⭐</span>
          ) : (
            <div className={`w-3 h-3 rounded-full ${PHASE_DOT_BG[state.phase]}`} />
          )}
          <div>
            <p className="text-xs font-semibold text-foreground">
              Jour {state.currentDay} ·{" "}
              {isPeriodDay(state.currentDay)
                ? `Règles (J${state.currentDay}/${periodDuration})`
                : isOvulationDay(state.currentDay)
                ? "Ovulation estimée 🌸"
                : isFertileDay(state.currentDay)
                ? `Fenêtre fertile · ${PHASE_INFO[state.phase].label}`
                : PHASE_INFO[state.phase].label}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {isPeriodDay(state.currentDay)
                ? "Repose-toi et nourris ton corps en fer"
                : isOvulationDay(state.currentDay)
                ? "Pic de fertilité et d'énergie"
                : PHASE_INFO[state.phase].season}
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Phase legend */}
      {state.mode !== "menopause" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-3"
        >
          {(["winter", "spring", "summer", "autumn"] as const).map((p, i) => {
            const pi = PHASE_INFO[p];
            return (
              <motion.div
                key={p}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.08 }}
                className={`rounded-2xl p-3 border border-border/40 shadow-card bg-card ${
                  state.phase === p ? "ring-2 ring-terracotta ring-offset-2" : ""
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-3 h-3 rounded-full ${PHASE_DOT_BG[p]}`} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{pi.label}</span>
                  {state.phase === p && <span className="text-[9px] bg-terracotta text-primary-foreground rounded px-1">Actif</span>}
                </div>
                <p className="font-display text-sm font-semibold leading-tight">{pi.season}</p>
                <p className="text-[10px] text-muted-foreground">{pi.dayRange}</p>
                <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">{pi.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      )}
{state.mode === "menopause" && (
        <HormoneStabilityChart />
      )}
      
      {/* Temp chart */}
      {state.entries.filter((e) => e.temperature).length > 2 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-3xl p-5 shadow-card border border-border/40"
        >
          <h3 className="font-display text-base font-semibold mb-4 text-foreground">Courbe de Température</h3>
          <div className="relative h-24">
            <TemperatureMiniChart entries={state.entries} currentDay={state.currentDay} />
          </div>
        </motion.div>
      )}
    </div>
  );
}

function TemperatureMiniChart({
  entries,
  currentDay,
}: {
  entries: import("@/lib/cycleEngine").DailyEntry[];
  currentDay: number;
}) {
  const withTemp = entries.filter((e) => e.temperature).sort((a, b) => a.day - b.day);
  if (withTemp.length < 2) return null;

  const temps = withTemp.map((e) => e.temperature!);
  const minT = Math.min(...temps) - 0.1;
  const maxT = Math.max(...temps) + 0.1;
  const range = maxT - minT;

  const w = 100;
  const h = 100;
  const points = withTemp.map((e, i) => {
    const x = (i / (withTemp.length - 1)) * w;
    const y = h - ((e.temperature! - minT) / range) * h;
    return `${x},${y}`;
  });

  const polyline = points.join(" ");
  const fillPath = `M${points[0]} L${points.join(" L")} L${w},${h} L0,${h} Z`;

  const currentEntry = withTemp.findIndex((e) => e.day === currentDay);
  const currentX = currentEntry >= 0 ? (currentEntry / (withTemp.length - 1)) * w : null;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="tempGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(18 52% 52%)" />
          <stop offset="100%" stopColor="hsl(350 38% 68%)" />
        </linearGradient>
        <linearGradient id="fillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(18 52% 52%)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(18 52% 52%)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill="url(#fillGrad)" />
      <polyline points={polyline} fill="none" stroke="url(#tempGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {withTemp.map((e, i) => {
        const x = (i / (withTemp.length - 1)) * w;
        const y = h - ((e.temperature! - minT) / range) * h;
        return <circle key={e.day} cx={x} cy={y} r="2" fill="hsl(18 52% 52%)" />;
      })}
      {currentX !== null && (
        <line x1={currentX} y1="0" x2={currentX} y2={h} stroke="hsl(var(--foreground))" strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />
      )}
    </svg>
  );
}
function HormoneStabilityChart() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-3xl p-5 shadow-card border border-border/40 mt-4"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-display text-sm font-bold text-slate-800">Équilibre Hormonal (30j)</h3>
        <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">Stable</span>
      </div>
      
      <div className="relative h-20 w-full flex items-center">
        {/* Ligne Estrogènes (Basse mais stable) */}
        <svg className="absolute w-full h-full">
          <path 
            d="M 0 60 Q 50 58, 100 62 Q 150 60, 200 63 Q 250 61, 300 60" 
            fill="none" 
            stroke="hsl(350 38% 68%)" 
            strokeWidth="3" 
            strokeLinecap="round"
            className="opacity-80"
          />
          {/* Ligne FSH (Haute mais stable) */}
          <path 
            d="M 0 20 Q 50 22, 100 18 Q 150 21, 200 19 Q 250 23, 300 20" 
            fill="none" 
            stroke="hsl(18 52% 52%)" 
            strokeWidth="3" 
            strokeLinecap="round"
            className="opacity-40"
          />
        </svg>
      </div>

      <div className="flex gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[hsl(350_38%_68%)]" />
          <span className="text-[10px] text-muted-foreground font-medium">Estrogènes</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[hsl(18_52%_52%)] opacity-50" />
          <span className="text-[10px] text-muted-foreground font-medium">FSH (Régulateur)</span>
        </div>
      </div>
      
      <p className="text-[10px] text-slate-400 mt-3 leading-relaxed italic">
        "Ta signature hormonale est en plateau. C'est le moment idéal pour ancrer de nouvelles habitudes de longévité."
      </p>
    </motion.div>
  );
}
