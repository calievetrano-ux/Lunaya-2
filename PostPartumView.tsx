// src/components/PostPartumView.tsx
// LUNAYA – Vue complète Post-Partum

import { useState } from "react";
import { motion } from "framer-motion";
import { CycleState } from "@/lib/cycleEngine";
import { UserProfile } from "@/hooks/useUserProfile";
import { HormonalChart } from "@/components/HormonalChart";
import { PPRecoveryTimeline } from "@/components/PPRecoveryTimeline";
import { HealthAlertWidget } from "@/components/HealthAlertWidget";
import { ExportPDFButton } from "@/components/ExportPDFButton";
import { LunayaAssistant } from "@/components/LunayaAssistant";
import {
  PP_MEAL_DATA,
  PP_SYMPTOM_REACTIONS,
  getPPWeek,
  getPPPhase,
} from "@/lib/postPartumEngine";

interface PostPartumViewProps {
  state: CycleState;
  profile: UserProfile;
  onProfileUpdate: (partial: Partial<UserProfile>) => void;
  onSaisie: () => void;
}

const PP_SYMPTOMS = [
  { id: "lochies", label: "Lochies", emoji: "🩸" },
  { id: "tranchees", label: "Tranchées", emoji: "🌀" },
  { id: "baby_blues", label: "Baby Blues", emoji: "☁️" },
  { id: "chute_cheveux", label: "Chute de cheveux", emoji: "💇‍♀️" },
  { id: "brain_fog", label: "Mom Brain", emoji: "🧠" },
  { id: "montee_lait", label: "Montée de lait", emoji: "🥛" },
  { id: "fatigue_intense", label: "Fatigue intense", emoji: "😴" },
  { id: "douleurs_pelviennes", label: "Douleurs pelviennes", emoji: "🧘" },
  { id: "sueurs_nocturnes", label: "Sueurs nocturnes", emoji: "🌡️" },
];

export function PostPartumView({ state, profile, onProfileUpdate, onSaisie }: PostPartumViewProps) {
  const [activeSymptoms, setActiveSymptoms] = useState<string[]>([]);
  const isBreastfeeding = profile.isBreastfeeding ?? false;
  const ppWeek = getPPWeek(profile.birthDate);
  const ppPhase = getPPPhase(ppWeek);

  const toggleSymptom = (id: string) => {
    setActiveSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  // Réactions aux symptômes actifs
  const activeReactions = PP_SYMPTOM_REACTIONS.filter((r) =>
    r.symptomIds.some((s) => activeSymptoms.includes(s))
  );

  return (
    <div className="pb-32 space-y-5">
      {/* Header PP */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-5 shadow-card border border-border/40"
        style={{ background: "linear-gradient(135deg, hsl(350 60% 97%), hsl(38 70% 97%))" }}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              Mode Post-Partum · {ppPhase.emoji} {ppPhase.range}
            </p>
            <h2 className="font-display text-xl font-bold text-foreground leading-tight">
              Semaine {ppWeek}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{ppPhase.focus}</p>
          </div>
          <span className="text-4xl">👶</span>
        </div>

        {/* Switch Allaitement */}
        <div className="flex items-center justify-between bg-white/60 rounded-2xl px-4 py-3 border border-border/30">
          <div className="flex items-center gap-2">
            <span className="text-lg">🥛</span>
            <div>
              <p className="text-xs font-semibold">J'allaite</p>
              <p className="text-[10px] text-muted-foreground">+500 kcal/j · +1L d'eau</p>
            </div>
          </div>
          <button
            onClick={() => onProfileUpdate({ isBreastfeeding: !isBreastfeeding })}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
              isBreastfeeding ? "bg-primary" : "bg-muted-foreground/30"
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${
                isBreastfeeding ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>

        {isBreastfeeding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-2.5 flex gap-2"
          >
            <span className="text-sm">💧</span>
            <p className="text-[11px] text-blue-700 leading-relaxed">
              Allaitement actif : <strong>+500 kcal/jour</strong> et{" "}
              <strong>+1L d'eau minimum</strong>. Évite les gros poissons (thon, espadon). Privilégie sardines et maquereaux pour le DHA.
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Courbe Hormonale PP */}
      <HormonalChart state={state} />

      {/* Timeline de récupération */}
      <PPRecoveryTimeline birthDate={profile.birthDate} isBreastfeeding={isBreastfeeding} />

      {/* Sélecteur de symptômes */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-3xl p-4 shadow-card border border-border/40"
      >
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Comment tu te sens aujourd'hui ?
        </p>
        <div className="flex flex-wrap gap-2">
          {PP_SYMPTOMS.map((s) => (
            <button
              key={s.id}
              onClick={() => toggleSymptom(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                activeSymptoms.includes(s.id)
                  ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                  : "bg-muted/40 text-foreground border-border/40 hover:bg-muted/60"
              }`}
            >
              <span>{s.emoji}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Réactions aux symptômes sélectionnés */}
        {activeReactions.length > 0 && (
          <div className="mt-4 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Conseils personnalisés
            </p>
            {activeReactions.map((r) => (
              <motion.div
                key={r.symptomIds[0]}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border/40 bg-muted/30 p-3.5 flex gap-3"
              >
                <span className="text-xl flex-shrink-0">{r.icon}</span>
                <div>
                  <p className="text-xs font-bold text-foreground mb-1">{r.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{r.message}</p>
                  {r.source && (
                    <p className="text-[9px] text-muted-foreground/60 mt-1.5">📚 {r.source}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Repas Reconstruction */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-3xl p-4 shadow-card border border-border/40"
      >
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          🍽️ Repas Reconstruction du jour
        </p>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(PP_MEAL_DATA).map(([key, meal]) => (
            <div key={key} className="rounded-2xl overflow-hidden border border-border/30">
              <div className="relative h-24">
                <img
                  src={meal.img}
                  alt={meal.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {isBreastfeeding && (
                  <span className="absolute top-1.5 right-1.5 bg-blue-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                    +kcal
                  </span>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-[11px] font-bold text-foreground leading-tight">{meal.title}</p>
                <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                  {meal.desc}
                </p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {meal.nutrients.map((n) => (
                    <span key={n} className="text-[8px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full font-medium">
                      {n}
                    </span>
                  ))}
                </div>
                {isBreastfeeding && (
                  <p className="text-[9px] text-blue-600 mt-1 font-medium">{meal.breastfeedingBoost}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Alertes Santé */}
      <HealthAlertWidget mode="postpartum" activeSymptoms={activeSymptoms} />

      {/* Assistant IA contextualisé PP */}
      <LunayaAssistant
        context="postpartum"
        symptoms={activeSymptoms}
        isBreastfeeding={isBreastfeeding}
        ppWeek={ppWeek}
      />

      {/* Export PDF */}
      <div className="bg-card rounded-3xl p-4 shadow-card border border-border/40">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          📄 Bilan Pépite · Partager avec ton médecin
        </p>
        <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">
          Génère un récapitulatif de ta courbe hormonale et de tes symptômes à partager lors de ta consultation post-natale.
        </p>
        <ExportPDFButton
          mode="postpartum"
          symptoms={activeSymptoms}
          currentDay={state.currentDay}
          phase={`${ppPhase.range} — ${ppPhase.focus}`}
          firstName={profile.firstName}
          isBreastfeeding={isBreastfeeding}
          birthDate={profile.birthDate}
        />
      </div>

      {/* Bouton saisie */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onSaisie}
        className="w-full gradient-hero text-primary-foreground font-semibold py-4 rounded-2xl shadow-soft text-sm"
      >
        + Saisir mon état du jour
      </motion.button>
    </div>
  );
}
