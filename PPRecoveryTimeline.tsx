// src/components/PPRecoveryTimeline.tsx
// LUNAYA – Timeline de récupération post-partum (S1→S12)

import { motion } from "framer-motion";
import { getPPWeek, getPPPhase, PP_RECOVERY_TIMELINE } from "@/lib/postPartumEngine";
import { CheckCircle2, Circle } from "lucide-react";

interface PPRecoveryTimelineProps {
  birthDate?: string;
  isBreastfeeding?: boolean;
}

export function PPRecoveryTimeline({ birthDate, isBreastfeeding }: PPRecoveryTimelineProps) {
  const currentWeek = getPPWeek(birthDate);
  const currentPhase = getPPPhase(currentWeek);

  return (
    <div className="bg-card rounded-3xl p-4 shadow-card border border-border/40">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
            Timeline Récupération · Semaine {currentWeek}
          </p>
          <h3 className="font-display text-base font-semibold text-foreground leading-tight">
            {currentPhase.emoji} {currentPhase.focus}
          </h3>
        </div>
        <span className="text-2xl">🗓️</span>
      </div>

      {/* Allaitement boost si actif */}
      {isBreastfeeding && (
        <div className="mb-4 rounded-2xl bg-blue-50 border border-blue-200 px-4 py-3 flex gap-2.5">
          <span className="text-base flex-shrink-0">🥛</span>
          <div>
            <p className="text-[11px] font-bold text-blue-700">Mode Allaitement Actif</p>
            <p className="text-[10px] text-blue-600 mt-0.5">
              +500 kcal/jour · +1L d'eau · Priorité DHA & Iode pour toi et bébé
            </p>
          </div>
        </div>
      )}

      {/* Phases timeline */}
      <div className="space-y-3">
        {PP_RECOVERY_TIMELINE.map((phase, idx) => {
          const isActive = currentPhase.range === phase.range;
          const isPast =
            (idx === 0 && currentWeek > 3) ||
            (idx === 1 && currentWeek > 8);

          return (
            <motion.div
              key={phase.range}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`rounded-2xl border p-3.5 transition-all ${
                isActive
                  ? "border-2 shadow-sm"
                  : isPast
                  ? "opacity-60 border-border/30 bg-muted/30"
                  : "border-border/40 bg-muted/10"
              }`}
              style={isActive ? { borderColor: phase.color, background: `${phase.color}15` } : {}}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {isPast ? (
                    <CheckCircle2 size={18} className="text-green-500" />
                  ) : isActive ? (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ background: phase.color }}
                    >
                      ✦
                    </div>
                  ) : (
                    <Circle size={18} className="text-muted-foreground/40" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{phase.emoji}</span>
                    <p className="text-xs font-bold text-foreground">{phase.range}</p>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: `${phase.color}30`, color: phase.color }}
                    >
                      {isActive ? "EN COURS" : isPast ? "TERMINÉ" : "À VENIR"}
                    </span>
                  </div>

                  <p className="text-[11px] font-semibold text-foreground mb-2">
                    {phase.focus}
                  </p>

                  {isActive && (
                    <div className="space-y-1.5">
                      {phase.tips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <span className="text-[10px] mt-0.5 flex-shrink-0">→</span>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">{tip}</p>
                        </div>
                      ))}

                      {/* Minéraux prioritaires */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {phase.minerals.map((m) => (
                          <span
                            key={m}
                            className="text-[9px] font-semibold px-2 py-0.5 rounded-full border"
                            style={{ borderColor: phase.color, color: phase.color }}
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Note bienveillante */}
      <div className="mt-4 bg-muted/60 rounded-2xl px-4 py-3 flex gap-2.5">
        <span className="text-base flex-shrink-0">💛</span>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Chaque récupération est unique. Ces étapes sont des repères, pas des obligations.{" "}
          <strong className="text-foreground">Va à ton rythme.</strong>
        </p>
      </div>
    </div>
  );
}
