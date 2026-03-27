import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface PeriodLogEntry {
  startDate: string;   // ISO
  endDate: string;     // ISO
  intensity: "light" | "medium" | "heavy";
}

interface PeriodLogModalProps {
  onSave: (entry: PeriodLogEntry) => void;
  onClose: () => void;
}

const INTENSITIES = [
  { id: "light" as const, label: "Léger", emoji: "🩷", desc: "Flux faible, 1-2 serviettes/j" },
  { id: "medium" as const, label: "Moyen", emoji: "🩸", desc: "Flux normal, 3-4 serviettes/j" },
  { id: "heavy" as const, label: "Abondant", emoji: "💧", desc: "Flux fort, > 5 serviettes/j" },
];

export function PeriodLogModal({ onSave, onClose }: PeriodLogModalProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [intensity, setIntensity] = useState<"light" | "medium" | "heavy">("medium");
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const durationDays =
    startDate && endDate
      ? Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1
      : null;

  const canSave = startDate && endDate && endDate >= startDate;

  const handleSave = () => {
    if (!startDate || !endDate) return;
    onSave({
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      intensity,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-end"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
          className="w-full max-w-[480px] mx-auto bg-card rounded-t-3xl overflow-y-auto max-h-[92vh] pb-10"
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-muted" />
          </div>

          <div className="px-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-xl font-semibold">🩸 Log mes règles</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Recalcule tout ton cycle à partir de J1 réel
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
              >
                <X size={15} />
              </button>
            </div>

            {/* ── Start Date ─────────────────────────── */}
            <section className="mb-5">
              <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                📅 Début des règles (J1)
              </label>
              <Popover open={startOpen} onOpenChange={setStartOpen}>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all",
                      startDate
                        ? "bg-background border-primary text-foreground"
                        : "bg-background border-border text-muted-foreground"
                    )}
                  >
                    <CalendarIcon size={16} className="text-primary flex-shrink-0" />
                    <span className="font-medium text-sm">
                      {startDate
                        ? format(startDate, "EEEE d MMMM yyyy", { locale: fr })
                        : "Sélectionne une date"}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[60]" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(d) => { setStartDate(d); setStartOpen(false); }}
                    disabled={(d) => d > new Date()}
                    initialFocus
                    locale={fr}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </section>

            {/* ── End Date ───────────────────────────── */}
            <section className="mb-5">
              <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                📅 Fin des règles
              </label>
              <Popover open={endOpen} onOpenChange={setEndOpen}>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all",
                      endDate
                        ? "bg-background border-primary text-foreground"
                        : "bg-background border-border text-muted-foreground"
                    )}
                  >
                    <CalendarIcon size={16} className="text-primary flex-shrink-0" />
                    <span className="font-medium text-sm">
                      {endDate
                        ? format(endDate, "EEEE d MMMM yyyy", { locale: fr })
                        : "Sélectionne une date"}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[60]" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(d) => { setEndDate(d); setEndOpen(false); }}
                    disabled={(d) => d > new Date() || (startDate ? d < startDate : false)}
                    initialFocus
                    locale={fr}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>

              {durationDays && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-primary font-semibold mt-2 flex items-center gap-1.5"
                >
                  <span>⏱</span>
                  Durée détectée : {durationDays} jour{durationDays > 1 ? "s" : ""}
                  {durationDays >= 7 && " · Flux long — mémorisé pour ton profil"}
                </motion.p>
              )}
            </section>

            {/* ── Intensity ──────────────────────────── */}
            <section className="mb-7">
              <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Intensité du flux
              </label>
              <div className="grid grid-cols-3 gap-2">
                {INTENSITIES.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setIntensity(item.id)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all duration-200",
                      intensity === item.id
                        ? "bg-phase-winter/20 border-phase-winter shadow-soft"
                        : "bg-background border-border hover:border-phase-winter/40"
                    )}
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <p className={cn(
                      "text-xs font-bold",
                      intensity === item.id ? "text-phase-winter" : "text-foreground"
                    )}>
                      {item.label}
                    </p>
                    <p className="text-[9px] text-muted-foreground leading-tight">{item.desc}</p>
                  </button>
                ))}
              </div>
            </section>

            {/* ── Info banner ────────────────────────── */}
            <div className="bg-sage-light border border-sage rounded-2xl px-4 py-3 flex gap-3 mb-5">
              <span className="text-lg flex-shrink-0">✨</span>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Lunaya va recalculer automatiquement <strong>ton ovulation estimée</strong>, la <strong>fenêtre fertile</strong> et les <strong>prédictions futures</strong> à partir de cette date.
              </p>
            </div>

            {/* ── Save ───────────────────────────────── */}
            <button
              onClick={handleSave}
              disabled={!canSave}
              className={cn(
                "w-full font-semibold py-4 rounded-2xl text-base shadow-soft active:scale-95 transition-all duration-200",
                canSave
                  ? "gradient-hero text-primary-foreground"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              Enregistrer & recalculer le cycle ✓
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
