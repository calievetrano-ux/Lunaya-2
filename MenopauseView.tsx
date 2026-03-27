import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, Shield, BookOpen, Send, Loader2, ChevronDown,
} from "lucide-react";
import { CycleState, DailyEntry } from "@/lib/cycleEngine";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { ExportPDFButton } from "@/components/ExportPDFButton";
import { HealthAlertWidget } from "@/components/HealthAlertWidget";

interface MenopauseViewProps {
  state: CycleState;
  lmpDate: string;
  onSaisie: () => void;
  firstName?: string;
  activeSymptoms?: string[];
}

type CardType = "EAT" | "MOVE" | "DO";

// ── Storage keys ───────────────────────────────────────────────────────
const NOTES_KEY = "lunaya_menopause_notes";
const AI_HISTORY_KEY = "lunaya_ai_history";
const DISCHARGE_LOG_KEY = "lunaya_discharge_log";

// ── Wellness metrics ──────────────────────────────────────────────────
interface WellnessMetric {
  key: keyof WellnessSnapshot;
  label: string;
  emoji: string;
  color: string;
  inverted?: boolean;
  max: number;
}

interface WellnessSnapshot {
  energy: number;
  mood: number;
  sleep: number;
  hotFlash: number;
  stress: number;
  libido: number;
  weight: number;
  skin: number;
}

const WELLNESS_METRICS: WellnessMetric[] = [
  { key: "energy",   label: "Énergie",       emoji: "⚡", color: "hsl(var(--phase-summer))",  max: 5 },
  { key: "mood",     label: "Humeur",         emoji: "🌸", color: "hsl(var(--phase-spring))",  max: 5 },
  { key: "sleep",    label: "Sommeil",        emoji: "🌙", color: "hsl(210 60% 60%)",          max: 5 },
  { key: "hotFlash", label: "Bouffées",       emoji: "🌡️", color: "hsl(var(--phase-winter))",  max: 5, inverted: true },
  { key: "stress",   label: "Stress",         emoji: "🧠", color: "hsl(var(--phase-autumn))",  max: 5, inverted: true },
  { key: "libido",   label: "Libido",         emoji: "💗", color: "hsl(350 50% 65%)",          max: 5 },
  { key: "weight",   label: "Poids stable",   emoji: "⚖️", color: "hsl(var(--sage))",           max: 5, inverted: true },
  { key: "skin",     label: "Peau / Cheveux", emoji: "✨", color: "hsl(38 70% 60%)",           max: 5, inverted: true },
];

// ── Expanded symptom list ──────────────────────────────────────────────
interface SymptomDef {
  id: string;
  label: string;
  emoji: string;
  category: "positif" | "vasomoteur" | "sommeil" | "humeur" | "physique" | "metabolisme";
  positive?: boolean;
}

const MENOPAUSE_SYMPTOMS: SymptomDef[] = [
  // Positif / Bien-être
  { id: "bonne_energie",      label: "Bonne énergie",        emoji: "✨", category: "positif", positive: true },
  { id: "bonne_humeur",       label: "Bonne humeur",         emoji: "😊", category: "positif", positive: true },
  { id: "motivee",            label: "Motivée",              emoji: "🚀", category: "positif", positive: true },
  { id: "calme",              label: "Calme",                emoji: "🌿", category: "positif", positive: true },
  { id: "bon_sommeil",        label: "Bon sommeil",          emoji: "😴", category: "positif", positive: true },
  { id: "aucun_symptome",     label: "Aucun symptôme",       emoji: "🌟", category: "positif", positive: true },
  // Vasomoteur
  { id: "bouffees_chaleur",   label: "Bouffées de chaleur",  emoji: "🌡️", category: "vasomoteur" },
  { id: "sueurs_nocturnes",   label: "Sueurs nocturnes",     emoji: "💦", category: "vasomoteur" },
  { id: "palpitations",       label: "Palpitations",         emoji: "💓", category: "vasomoteur" },
  // Sommeil
  { id: "insomnie",           label: "Insomnie",             emoji: "😳", category: "sommeil" },
  { id: "reveils_precoces",   label: "Réveils précoces",     emoji: "⏰", category: "sommeil" },
  { id: "pb_sommeil",         label: "Mauvais sommeil",      emoji: "😶", category: "sommeil" },
  // Humeur & Mental
  { id: "sautes_humeur",      label: "Sautes d'humeur",      emoji: "🌀", category: "humeur" },
  { id: "mauvaise_humeur",    label: "Mauvaise humeur",      emoji: "😒", category: "humeur" },
  { id: "anxiete",            label: "Anxiété",              emoji: "😰", category: "humeur" },
  { id: "stress",             label: "Stress",               emoji: "🧠", category: "humeur" },
  { id: "depression",         label: "Dépression",           emoji: "😔", category: "humeur" },
  { id: "irritable",          label: "Irritabilité",         emoji: "😤", category: "humeur" },
  { id: "brain_fog",          label: "Brain fog",            emoji: "🌫️", category: "humeur" },
  // Physique
  { id: "epuisee",            label: "Fatigue",              emoji: "🪫", category: "physique" },
  { id: "douleurs_articulaires", label: "Douleurs articulaires", emoji: "🦴", category: "physique" },
  { id: "douleurs_musculaires",  label: "Douleurs musculaires",  emoji: "💪", category: "physique" },
  { id: "migraine",           label: "Maux de tête",         emoji: "🤕", category: "physique" },
  { id: "secheresse",         label: "Sécheresse vaginale",  emoji: "🌵", category: "physique" },
  { id: "pertes_vaginales",   label: "Pertes vaginales",     emoji: "💧", category: "physique" },
  { id: "secheresse_peau",    label: "Peau sèche",           emoji: "🧴", category: "physique" },
  { id: "chute_cheveux",      label: "Chute de cheveux",     emoji: "💇", category: "physique" },
  { id: "libido_basse",       label: "Libido basse",         emoji: "💔", category: "physique" },
  // Métabolisme & Digestion
  { id: "prise_poids",        label: "Prise de poids",       emoji: "⚖️", category: "metabolisme" },
  { id: "ballonnements",      label: "Ballonnements",        emoji: "🎈", category: "metabolisme" },
  { id: "faim_elevee",        label: "Appétit élevé",        emoji: "🍽️", category: "metabolisme" },
  { id: "faim_basse",         label: "Appétit faible",       emoji: "🚫", category: "metabolisme" },
  { id: "digestion",          label: "Troubles digestifs",   emoji: "🫃", category: "metabolisme" },
];

// Vaginal discharge options
const DISCHARGE_OPTIONS = [
  { id: "discharge_none",   label: "Aucune perte",      emoji: "⚪" },
  { id: "discharge_light",  label: "Légères pertes",    emoji: "💧" },
  { id: "discharge_normal", label: "Pertes normales",   emoji: "🔵" },
  { id: "discharge_heavy",  label: "Pertes abondantes", emoji: "💦" },
];

const SYMPTOM_CATEGORY_LABELS: Record<string, string> = {
  positif:     "✨ Positif / Bien-être",
  vasomoteur:  "🌡️ Vasomoteur",
  sommeil:     "🌙 Sommeil",
  humeur:      "🌀 Humeur & Mental",
  physique:    "🦴 Physique",
  metabolisme: "⚖️ Métabolisme & Digestion",
};

// ── Symptom-triggered tips ────────────────────────────────────────────
interface SymptomTip {
  symptomId: string;
  icon: string;
  category: CardType;
  title: string;
  message: string;
}

const MENOPAUSE_SYMPTOM_TIPS: SymptomTip[] = [
  { symptomId: "bouffees_chaleur",    icon: "🌬️", category: "DO",  title: "Bouffées de chaleur",    message: "Cohérence cardiaque 5 min maintenant (inspire 5 sec, expire 5 sec). Vêtements en coton, fenêtre entrouverte. Évite café, alcool et épices après 14h." },
  { symptomId: "sueurs_nocturnes",    icon: "🌙", category: "DO",  title: "Sueurs nocturnes",       message: "Chambre à 17–19 °C. Draps en coton ou bambou. Évite l'alcool et les repas chauds après 18h. La cohérence cardiaque avant le coucher réduit les épisodes nocturnes." },
  { symptomId: "palpitations",        icon: "💓", category: "DO",  title: "Palpitations",           message: "Respiration lente (inspire 5 sec, expire 5 sec). Limite la caféine. Si les palpitations persistent, consulte un médecin." },
  { symptomId: "insomnie",            icon: "😴", category: "DO",  title: "Insomnie hormonale",     message: "Pas d'écrans après 21h. Tisane de valériane. Respiration 4-7-8. Magnésium glycinate 400 mg au coucher." },
  { symptomId: "pb_sommeil",          icon: "🛌", category: "DO",  title: "Troubles du sommeil",    message: "Maintiens des horaires réguliers. Chambre fraîche et sombre. Le magnésium aide à maintenir le sommeil profond." },
  { symptomId: "reveils_precoces",    icon: "⏰", category: "DO",  title: "Réveils précoces",       message: "Les réveils entre 3–5h indiquent souvent un pic de cortisol. Magnésium glycinate aide à maintenir le sommeil profond." },
  { symptomId: "anxiete",             icon: "🌿", category: "DO",  title: "Anxiété",                message: "Cohérence cardiaque 3×/jour. Yoga ou marche 20 min. Magnésium bisglycinate (300–400 mg/j) a un effet anxiolytique reconnu." },
  { symptomId: "sautes_humeur",       icon: "⚡", category: "DO",  title: "Sautes d'humeur",        message: "Exposition au soleil 20 min le matin, aliments riches en tryptophane (banane, œufs, noix), exercice régulier." },
  { symptomId: "depression",          icon: "💛", category: "DO",  title: "Humeur basse",           message: "Activité physique quotidienne et socialisation aident. Consulte un professionnel si cela persiste." },
  { symptomId: "brain_fog",           icon: "🧠", category: "DO",  title: "Brouillard mental",      message: "Une seule tâche prioritaire. Marche 20 min dehors. Les oméga-3 (DHA) soutiennent la cognition en ménopause." },
  { symptomId: "epuisee",             icon: "🪫", category: "MOVE",title: "Fatigue",                message: "Marche douce 15–20 min max. Sieste courte de 20 min. Vérifie tes niveaux de fer et de vitamine D." },
  { symptomId: "douleurs_articulaires",icon: "🦴",category: "MOVE",title: "Douleurs articulaires",  message: "Remplace l'impact par natation ou yoga. Curcuma (500 mg) + Oméga-3 anti-inflammatoires." },
  { symptomId: "migraine",            icon: "🤕", category: "EAT", title: "Maux de tête",           message: "Magnésium prioritaire (graines de courge, noix du Brésil). Hydratation ++ et évite les nitrites." },
  { symptomId: "secheresse",          icon: "💧", category: "EAT", title: "Sécheresse vaginale",    message: "Oméga-3 et Vitamine E soutiennent la lubrification des muqueuses. Hydratation ++ : 2L/j minimum." },
  { symptomId: "prise_poids",         icon: "⚖️", category: "EAT", title: "Prise de poids",         message: "Protéines (1,2–1,6 g/kg), glucides à IG bas et renforcement musculaire 2×/sem." },
  { symptomId: "ballonnements",       icon: "🌿", category: "EAT", title: "Ballonnements",          message: "Mange lentement, réduis fibres fermentescibles. Probiotiques et tisane de fenouil peuvent aider." },
  { symptomId: "faim_elevee",         icon: "🍽️", category: "EAT", title: "Appétit élevé",          message: "Privilégie les protéines à chaque repas pour augmenter la satiété. Mange de grandes salades avant le plat principal." },
  { symptomId: "faim_basse",          icon: "🚫", category: "EAT", title: "Appétit faible",         message: "Même sans faim, des petits repas riches en protéines et nutriments aident à maintenir la masse musculaire." },
];

// ── Health pillars ────────────────────────────────────────────────────
const HEALTH_PILLARS = [
  { icon: "🦴", label: "Santé osseuse",          iconBg: "bg-terracotta-light", stat: "Os : −2 % densité/an en début de ménopause",  tips: ["Calcium 1200 mg/j (sardines, amandes, brocoli)", "Vitamine D 1000–2000 UI/j", "Renforcement musculaire 2–3×/sem"] },
  { icon: "❤️", label: "Santé cardiovasculaire", iconBg: "bg-rose-mist",         stat: "Le risque CV augmente après la ménopause",    tips: ["Oméga-3 anti-inflammatoires (poissons gras, lin)", "Marche 30 min/j", "Réduire le sel et les graisses saturées"] },
  { icon: "⚡", label: "Métabolisme",             iconBg: "bg-sage-light",        stat: "Métabolisme basal −100–200 kcal/j",           tips: ["Protéines 1,2–1,6 g/kg pour maintenir la masse maigre", "Glucides complexes à IG bas (quinoa, avoine)", "3–4 repas pour stabiliser la glycémie"] },
  { icon: "🧬", label: "Équilibre hormonal",      iconBg: "bg-terracotta-light", stat: "Objectif : stabilité, pas de courbe cyclique", tips: ["Phytoestrogènes naturels : soja, graines de lin", "Évite les perturbateurs endocriniens (plastiques, BPA)", "Cohérence cardiaque 3×/j"] },
];

const MENOPAUSE_CARDS = [
  { type: "EAT" as CardType, icon: "🥦", title: "Mon Assiette",  advice: "Calcium, Vit D & Oméga-3", detail: "Sardines, brocoli, amandes, lait végétal enrichi. Limite caféine et alcool.", learnMore: { headline: "Nourrir l'équilibre hormonal", body: "Avec la chute des œstrogènes, le risque d'ostéoporose augmente. Le calcium (1200 mg/j) et la vitamine D (1000–2000 UI) sont essentiels. Les oméga-3 réduisent l'inflammation.", tip: "Évite café, alcool et épices fortes après 14h — ils déclenchent souvent les bouffées nocturnes." } },
  { type: "MOVE" as CardType, icon: "🏋️‍♀️", title: "Mon Mouvement", advice: "Renforcement & posture", detail: "Exercices de résistance 2–3×/sem. Yoga pour la souplesse et l'équilibre osseux.", learnMore: { headline: "Pourquoi le renforcement musculaire ?", body: "La densité osseuse diminue de 2–3 % par an. Porter des charges est le stimulus le plus efficace pour maintenir la masse osseuse.", tip: "Commence par 2 séances de 30 min/sem : squats, pompes sur genoux, fentes." } },
  { type: "DO" as CardType, icon: "🧘‍♀️", title: "Mon Équilibre", advice: "Gestion du stress & confort", detail: "Méditation, cohérence cardiaque (5 min × 3/j), rituels de refroidissement.", learnMore: { headline: "Apprivoiser les symptômes", body: "Le stress active le système sympathique, ce qui déclenche les bouffées. La cohérence cardiaque régule le système nerveux autonome.", tip: "Tiens un journal de tes déclencheurs pendant 2 semaines." } },
];

// ── Helpers ───────────────────────────────────────────────────────────
function extractWellness(entry: DailyEntry | undefined): WellnessSnapshot {
  return {
    energy:   (entry as any)?.energy   ?? entry?.moodScore ?? 0,
    mood:     entry?.moodScore          ?? 0,
    sleep:    entry?.sleepQuality       ?? 0,
    hotFlash: entry?.hotFlashIntensity  ?? 0,
    stress:   (entry as any)?.stress   ?? 0,
    libido:   (entry as any)?.libido   ?? 0,
    weight:   (entry as any)?.weightChange ?? 0,
    skin:     (entry as any)?.skin     ?? 0,
  };
}

function buildWeeklyData(entries: DailyEntry[]) {
  const sorted = [...entries].sort((a, b) => a.day - b.day).slice(-28);
  const weeks: { label: string; energy: number; mood: number; sleep: number; hotFlash: number }[] = [];
  for (let i = 0; i < sorted.length; i += 7) {
    const chunk = sorted.slice(i, i + 7);
    const avg = (key: string) =>
      Math.round((chunk.reduce((s, e) => s + (((e as any)[key]) ?? 0), 0) / Math.max(chunk.length, 1)) * 10) / 10;
    weeks.push({ label: `S${weeks.length + 1}`, energy: avg("energy") || avg("moodScore"), mood: avg("moodScore"), sleep: avg("sleepQuality"), hotFlash: avg("hotFlashIntensity") });
  }
  return weeks;
}

interface NoteEntry { date: string; text: string; }

function loadNotes(): NoteEntry[] {
  try { return JSON.parse(localStorage.getItem(NOTES_KEY) ?? "[]"); }
  catch { return []; }
}
function saveNotes(notes: NoteEntry[]) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

interface AiMessage { role: "user" | "assistant"; content: string; }
function loadAiHistory(): AiMessage[] {
  try { return JSON.parse(localStorage.getItem(AI_HISTORY_KEY) ?? "[]").slice(-20); }
  catch { return []; }
}
function saveAiHistory(msgs: AiMessage[]) {
  localStorage.setItem(AI_HISTORY_KEY, JSON.stringify(msgs.slice(-20)));
}
function loadDischargeLog(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(DISCHARGE_LOG_KEY) ?? "{}"); }
  catch { return {}; }
}

// ── Sub-components ────────────────────────────────────────────────────
function WellnessTile({ metric, value }: { metric: WellnessMetric; value: number }) {
  const filled = value > 0;
  const pct = (value / metric.max) * 100;
  return (
    <div className="bg-card rounded-2xl p-3 shadow-card border border-border/40 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{metric.emoji}</span>
          <p className="text-[11px] font-semibold text-foreground">{metric.label}</p>
        </div>
        <p className="text-[11px] font-bold text-muted-foreground">
          {filled ? `${value}/${metric.max}` : "—"}
        </p>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: metric.color }}
          initial={{ width: 0 }}
          animate={{ width: filled ? `${pct}%` : "0%" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function SymptomTag({ def, active, onToggle }: { def: SymptomDef; active: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all active:scale-95 ${
        active
          ? def.positive
            ? "bg-[hsl(var(--phase-spring))] text-white border-[hsl(var(--phase-spring))]"
            : "bg-primary text-primary-foreground border-primary"
          : def.positive
            ? "bg-card text-[hsl(95_35%_38%)] border-[hsl(var(--phase-spring))]/40 hover:border-[hsl(var(--phase-spring))]"
            : "bg-card text-foreground border-border/60 hover:border-primary/50"
      }`}
    >
      <span>{def.emoji}</span>
      {def.label}
    </button>
  );
}

// ── Learn More Modal ──────────────────────────────────────────────────
function MenopauseLearnMoreModal({ icon, card, headline, body, tip, onClose }: {
  icon: string; card: CardType; headline: string; body: string; tip: string; onClose: () => void;
}) {
  const colors: Record<CardType, string> = { EAT: "from-[hsl(95_22%_88%)] to-[hsl(95_22%_96%)]", MOVE: "from-[hsl(20_55%_88%)] to-[hsl(20_55%_96%)]", DO: "from-[hsl(340_30%_88%)] to-[hsl(340_30%_96%)]" };
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm flex items-end"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", bounce: 0.12, duration: 0.45 }}
          className="w-full max-w-[480px] mx-auto bg-card rounded-t-3xl overflow-y-auto max-h-[80vh] pb-10"
        >
          <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-muted" /></div>
          <div className={`bg-gradient-to-b ${colors[card]} px-5 py-5`}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{icon}</span>
              <div><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{card}</p><h3 className="font-display text-xl font-semibold">{headline}</h3></div>
            </div>
          </div>
          <div className="px-5 pt-4">
            <p className="text-sm text-foreground leading-relaxed mb-5">{body}</p>
            <div className="bg-primary/8 border border-primary/20 rounded-2xl px-4 py-3 mb-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">💡 Astuce</p>
              <p className="text-xs text-foreground leading-relaxed">{tip}</p>
            </div>
            <button onClick={onClose} className="w-full gradient-hero text-primary-foreground font-semibold py-3.5 rounded-2xl text-sm shadow-soft active:scale-95 transition-all">Fermer</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Days Without Period Counter ───────────────────────────────────────
function NoPeriodCounter({ lmpDate }: { lmpDate: string }) {
  const today = new Date();
  const lmp = new Date(lmpDate);
  const days = Math.max(0, Math.floor((today.getTime() - lmp.getTime()) / 86400000));
  const months = Math.floor(days / 30);
  const progressPct = Math.min((days / 365) * 100, 100);

  let status: { label: string; color: string; bg: string; border: string; explanation: string };
  if (days < 90) {
    status = { label: "Cycle irrégulier", color: "text-[hsl(38_65%_42%)]", bg: "bg-[hsl(38_75%_96%)]", border: "border-[hsl(38_75%_55%)]", explanation: "Des cycles irréguliers peuvent être un signe de périménopause. Continue à noter tes symptômes." };
  } else if (days < 365) {
    status = { label: "Possible périménopause", color: "text-[hsl(18_65%_42%)]", bg: "bg-[hsl(18_60%_96%)]", border: "border-[hsl(18_60%_55%)]", explanation: "Plus de 3 mois sans règles peut indiquer une périménopause. Un bilan hormonal (FSH, œstradiol) peut confirmer cette transition." };
  } else {
    status = { label: "Ménopause confirmée", color: "text-[hsl(340_45%_40%)]", bg: "bg-[hsl(340_35%_96%)]", border: "border-[hsl(340_45%_55%)]", explanation: "12 mois complets sans règles confirment la ménopause. C'est une nouvelle étape de vie, pas une maladie." };
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl p-5 border ${status.bg} ${status.border} shadow-card`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-white/70 flex items-center justify-center text-xl flex-shrink-0">🗓️</div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Aménorrhée</p>
          <h3 className="font-display text-base font-semibold text-foreground">Jours sans règles</h3>
        </div>
      </div>
      <div className="flex items-end gap-2 mb-3">
        <span className={`font-display text-4xl font-bold ${status.color}`}>{days}</span>
        <span className="text-sm text-muted-foreground mb-1">jours ({months} mois)</span>
      </div>
      <div className="h-2 bg-white/60 rounded-full overflow-hidden mb-3">
        <motion.div className="h-full rounded-full" style={{ background: `hsl(var(--primary))` }}
          initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-muted-foreground">Aujourd'hui</span>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${status.bg} ${status.border} ${status.color}`}>{status.label}</span>
        <span className="text-[10px] text-muted-foreground">12 mois</span>
      </div>
      <p className="text-xs text-foreground leading-relaxed">{status.explanation}</p>
    </motion.div>
  );
}

// ── Daily Journal ─────────────────────────────────────────────────────
function DailyJournal() {
  const [notes, setNotes] = useState<NoteEntry[]>(loadNotes);
  const [input, setInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const todayNote = notes.find((n) => n.date === today);

  const handleSave = () => {
    if (!input.trim()) return;
    const updated = notes.filter((n) => n.date !== today).concat({ date: today, text: input.trim() });
    setNotes(updated);
    saveNotes(updated);
    setInput("");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-3xl p-5 shadow-card border border-border/40"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-primary" />
          <h3 className="font-display text-base font-semibold">Notes du Jour</h3>
        </div>
        {notes.length > 0 && (
          <button onClick={() => setShowHistory(!showHistory)}
            className="text-[11px] font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full active:scale-95 flex items-center gap-1"
          >
            Historique <ChevronDown size={12} className={showHistory ? "rotate-180 transition-transform" : "transition-transform"} />
          </button>
        )}
      </div>

      {todayNote && !input && (
        <div className="mb-3 bg-rose-mist rounded-2xl px-4 py-3 border border-secondary/40">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Note du jour</p>
          <p className="text-sm text-foreground leading-relaxed">{todayNote.text}</p>
          <button onClick={() => setInput(todayNote.text)} className="text-[11px] text-primary font-semibold mt-2 active:scale-95">Modifier ✏️</button>
        </div>
      )}

      <div className="relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={todayNote ? "Modifier ta note..." : "Comment tu te sens aujourd'hui ? (bouffées, sommeil, énergie...)"}
          rows={3}
          className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none transition-all"
        />
        <button onClick={handleSave} disabled={!input.trim()}
          className="absolute bottom-3 right-3 w-8 h-8 rounded-xl gradient-hero text-primary-foreground flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all"
        >
          <Send size={13} />
        </button>
      </div>

      <AnimatePresence>
        {showHistory && notes.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-4 border-t border-border/40 pt-4 flex flex-col gap-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Historique des notes</p>
              {[...notes].reverse().slice(0, 10).map((note) => (
                <div key={note.date} className="bg-muted/40 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] font-bold text-muted-foreground mb-0.5">
                    {new Date(note.date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                  <p className="text-xs text-foreground leading-relaxed">{note.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── AI Assistant (streaming) ──────────────────────────────────────────
function AiAssistant({ activeSymptoms }: { activeSymptoms: string[] }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<AiMessage[]>(loadAiHistory);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [history, open]);

  const QUICK_QUESTIONS = [
    "Pourquoi est-ce que j'ai des bouffées de chaleur ?",
    "Que manger pour réduire la fatigue ?",
    "Est-ce que les sueurs nocturnes sont normales ?",
    "Comment améliorer mon sommeil en ménopause ?",
    "Pourquoi mon humeur change-t-elle autant ?",
  ];

  const sendQuestion = async (question: string) => {
    if (!question.trim() || loading) return;
    setError("");
    const userMsg: AiMessage = { role: "user", content: question };
    const newHistory = [...history, userMsg];
    setHistory(newHistory);
    saveAiHistory(newHistory);
    setInput("");
    setLoading(true);

    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

      const res = await fetch(`${SUPABASE_URL}/functions/v1/menopause-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "apikey": SUPABASE_KEY,
        },
        body: JSON.stringify({ question, symptoms: activeSymptoms }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setError("Trop de requêtes. Réessaie dans un moment.");
        } else if (res.status === 402) {
          setError("Crédit IA insuffisant.");
        } else {
          setError(data.error ?? "Erreur du service. Réessaie.");
        }
        setLoading(false);
        return;
      }

      const assistantMsg: AiMessage = { role: "assistant", content: data.answer };
      const updated = [...newHistory, assistantMsg];
      setHistory(updated);
      saveAiHistory(updated);
    } catch (e) {
      setError("Impossible de contacter l'assistant. Vérifie ta connexion.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuestion(input);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-3xl shadow-card border border-border/40 overflow-hidden"
    >
      {/* Header / Toggle */}
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left active:bg-muted/30 transition-colors"
      >
        <div className="w-10 h-10 rounded-2xl gradient-hero flex items-center justify-center text-xl flex-shrink-0">🌙</div>
        <div className="flex-1">
          <h3 className="font-display text-base font-semibold">Demander à LUNAYA</h3>
          <p className="text-[11px] text-muted-foreground">Pose tes questions sur la ménopause</p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} className="text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border/40"
          >
            <div className="p-4">
              {/* Quick questions */}
              {history.length === 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Questions fréquentes</p>
                  <div className="flex flex-col gap-1.5">
                    {QUICK_QUESTIONS.map((q) => (
                      <button key={q} onClick={() => sendQuestion(q)}
                        className="text-left text-xs text-foreground bg-muted/50 hover:bg-muted rounded-xl px-3 py-2.5 border border-border/40 active:scale-[0.98] transition-all"
                      >
                        💬 {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversation */}
              {history.length > 0 && (
                <div className="flex flex-col gap-3 mb-4 max-h-72 overflow-y-auto pr-1">
                  {history.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "assistant" && (
                        <div className="w-6 h-6 rounded-lg gradient-hero flex items-center justify-center text-xs mr-2 mt-0.5 flex-shrink-0">🌙</div>
                      )}
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="w-6 h-6 rounded-lg gradient-hero flex items-center justify-center text-xs mr-2 mt-0.5 flex-shrink-0">🌙</div>
                      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-2">
                        <Loader2 size={12} className="animate-spin text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">En train de répondre…</span>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              )}

              {/* Error */}
              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="mb-3 bg-destructive/10 border border-destructive/30 rounded-xl px-3 py-2 text-xs text-destructive"
                >
                  ⚠️ {error}
                </motion.div>
              )}

              {/* Input */}
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pose ta question…"
                  disabled={loading}
                  className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 transition-all"
                />
                <button onClick={() => sendQuestion(input)} disabled={!input.trim() || loading}
                  className="w-10 h-10 rounded-xl gradient-hero text-primary-foreground flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all flex-shrink-0"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>

              {history.length > 0 && (
                <div className="flex items-center justify-between mt-2">
                  <button onClick={() => { setHistory([]); saveAiHistory([]); setError(""); }}
                    className="text-[10px] text-muted-foreground active:scale-95"
                  >
                    Effacer la conversation
                  </button>
                  {history.filter(m => m.role === "user").length > 0 && (
                    <button onClick={() => setOpen(false)} className="text-[10px] text-primary active:scale-95">Réduire</button>
                  )}
                </div>
              )}

              <p className="text-[9px] text-muted-foreground mt-3 text-center opacity-70">
                L'assistant LUNAYA est éducatif. Consulte toujours un médecin pour un suivi médical personnalisé.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Discharge Tracker ─────────────────────────────────────────────────
function DischargeTracker() {
  const [log, setLog] = useState<Record<string, string>>(loadDischargeLog);
  const today = new Date().toISOString().split("T")[0];
  const todayValue = log[today] ?? "";

  const select = (id: string) => {
    const updated = { ...log, [today]: id === todayValue ? "" : id };
    setLog(updated);
    localStorage.setItem(DISCHARGE_LOG_KEY, JSON.stringify(updated));
  };

  // Last 7 days summary
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  }).reverse();

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-3xl p-5 shadow-card border border-border/40"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">💧</span>
        <h3 className="font-display text-base font-semibold">Pertes vaginales</h3>
        <span className="text-[10px] bg-muted text-muted-foreground px-2 py-1 rounded-full ml-auto">Aujourd'hui</span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
        En ménopause, les pertes peuvent changer en texture et quantité. Suivre leur évolution aide à repérer d'éventuels changements hormonaux.
      </p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {DISCHARGE_OPTIONS.map((opt) => (
          <button key={opt.id} onClick={() => select(opt.id)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
              todayValue === opt.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border text-foreground hover:border-primary/40"
            }`}
          >
            <span className="text-base">{opt.emoji}</span>
            {opt.label}
          </button>
        ))}
      </div>
      {todayValue && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-[10px] text-muted-foreground mb-3 flex items-center gap-1"
        >
          <span className="text-primary">✓</span>
          Noté : {DISCHARGE_OPTIONS.find(o => o.id === todayValue)?.label}
        </motion.p>
      )}
      {/* 7-day calendar strip */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">7 derniers jours</p>
        <div className="flex gap-1">
          {last7.map((date) => {
            const val = log[date];
            const opt = DISCHARGE_OPTIONS.find(o => o.id === val);
            const isToday = date === today;
            return (
              <div key={date} className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg ${isToday ? "bg-primary/10 border border-primary/30" : "bg-muted/40"}`}>
                <span className="text-[10px]">{opt ? opt.emoji : "·"}</span>
                <span className="text-[8px] text-muted-foreground">{new Date(date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 2)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ── Nutrition / Dietitian Contact ─────────────────────────────────────
function NutritionContact() {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!message.trim()) return;
    const subject = encodeURIComponent("Demande de conseil nutritionnel - Ménopause");
    const body = encodeURIComponent(`Bonjour,\n\n${message}\n\nEmail de contact : ${email}`);
    window.open(`mailto:contact@nutritionniste.fr?subject=${subject}&body=${body}`);
    setSent(true);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-[hsl(95_22%_93%)] to-[hsl(95_22%_97%)] rounded-3xl p-5 shadow-card border border-[hsl(var(--sage))]/40"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-2xl bg-[hsl(var(--sage-light))] flex items-center justify-center text-xl flex-shrink-0">🥗</div>
        <div>
          <h3 className="font-display text-base font-semibold text-foreground">Conseils Nutrition</h3>
          <p className="text-[11px] text-muted-foreground">Besoin d'un suivi personnalisé ?</p>
        </div>
      </div>
      <p className="text-xs text-foreground leading-relaxed mb-4">
        La nutrition joue un rôle clé en ménopause : calcium, vitamine D, protéines, oméga-3. Un diététicien-nutritionniste peut t'aider à personnaliser ton alimentation selon tes symptômes.
      </p>
      <div className="flex flex-col gap-2 mb-4">
        {["🦴 Maintenir la densité osseuse", "⚖️ Gérer la prise de poids", "🌡️ Réduire les bouffées de chaleur", "💤 Améliorer le sommeil par l'alimentation"].map((tip) => (
          <div key={tip} className="flex items-center gap-2">
            <span className="text-primary text-xs">✓</span>
            <p className="text-xs text-foreground">{tip}</p>
          </div>
        ))}
      </div>
      <AnimatePresence>
        {!showForm && !sent && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowForm(true)}
            className="w-full gradient-hero text-primary-foreground font-semibold py-3 rounded-2xl text-sm shadow-soft active:scale-95 transition-all"
          >
            📩 Contacter un diététicien
          </motion.button>
        )}
        {showForm && !sent && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-2.5">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Ton email (optionnel)"
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <textarea value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder="Décris tes besoins (symptômes, objectifs, questions...)" rows={3}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-border text-xs text-muted-foreground active:scale-95">Annuler</button>
              <button onClick={handleSend} disabled={!message.trim()}
                className="flex-1 gradient-hero text-primary-foreground font-semibold py-2.5 rounded-xl text-xs shadow-soft active:scale-95 transition-all disabled:opacity-40"
              >Envoyer 📩</button>
            </div>
          </motion.div>
        )}
        {sent && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-sm font-semibold text-foreground">Message préparé !</p>
            <p className="text-xs text-muted-foreground mt-1">Ton client email s'est ouvert. Envoie le message à ton diététicien.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Menopause Education ───────────────────────────────────────────────
const EDUCATION_TOPICS = [
  { q: "Qu'est-ce que la ménopause ?", icon: "🌿", a: "La ménopause est la fin naturelle des cycles menstruels, confirmée après 12 mois consécutifs sans règles. Elle survient en moyenne vers 51 ans. Ce n'est pas une maladie — c'est une transition hormonale normale. La périménopause peut commencer des années avant, avec des cycles irréguliers et des symptômes variables." },
  { q: "Que se passe-t-il avec les hormones ?", icon: "🧬", a: "Les ovaires réduisent progressivement leur production d'œstrogènes et de progestérone. Ces hormones régulent de nombreuses fonctions : humeur, sommeil, densité osseuse, santé cardiovasculaire. La FSH augmente, signalant au corps que les ovaires répondent moins." },
  { q: "Pourquoi ai-je des bouffées de chaleur ?", icon: "🌡️", a: "Les œstrogènes régulent le 'thermostat' de ton corps dans l'hypothalamus. Quand ils baissent, ce thermostat devient hypersensible. Le moindre stress déclenche une réponse exagérée : dilatation des vaisseaux, sudation, chaleur intense. C'est inconfortable mais normal." },
  { q: "Pourquoi mon humeur change-t-elle ?", icon: "🌀", a: "Les œstrogènes stimulent la sérotonine (hormone du bonheur). Quand ils baissent, ces neurotransmetteurs fluctuent aussi. Le manque de sommeil lié aux sueurs nocturnes amplifie encore ces changements. Ce n'est pas 'dans ta tête' — c'est neurochimique." },
  { q: "Pourquoi mon sommeil se détériore-t-il ?", icon: "🌙", a: "La progestérone a un effet sédatif naturel — quand elle baisse, le sommeil devient plus léger. Les sueurs nocturnes réveillent souvent entre 2h et 5h. La mélatonine diminue aussi avec l'âge. Une bonne hygiène du sommeil est essentielle." },
];

function MenopauseEducation() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-3xl p-5 shadow-card border border-border/40"
    >
      <div className="flex items-center gap-2 mb-4">
        <BookOpen size={16} className="text-primary" />
        <h3 className="font-display text-base font-semibold">Comprendre la Ménopause</h3>
      </div>
      <div className="flex flex-col gap-2">
        {EDUCATION_TOPICS.map((topic, i) => (
          <div key={i} className="bg-background rounded-2xl border border-border/50 overflow-hidden">
            <button onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-muted/30 transition-colors"
            >
              <span className="text-base flex-shrink-0">{topic.icon}</span>
              <p className="flex-1 text-xs font-semibold text-foreground">{topic.q}</p>
              <motion.div animate={{ rotate: openIdx === i ? 90 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />
              </motion.div>
            </button>
            <AnimatePresence>
              {openIdx === i && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                  <div className="px-4 pb-4 pt-1 border-t border-border/30">
                    <p className="text-xs text-foreground leading-relaxed">{topic.a}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────
export function MenopauseView({ state, lmpDate, onSaisie, firstName = "Utilisatrice", activeSymptoms = [] }: MenopauseViewProps) {
  const [learnMore, setLearnMore] = useState<{ card: CardType; headline: string; body: string; tip: string; icon: string } | null>(null);
  const [openPillar, setOpenPillar] = useState<number | null>(null);

  const today = new Date();
  const dateStr = today.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const weekNum = Math.ceil(today.getDate() / 7);

  const latestEntry = [...state.entries].sort((a, b) => b.day - a.day)[0];
  const wellness = extractWellness(latestEntry);
  const entrySymptoms: string[] = latestEntry?.symptoms ?? [];

  const triggeredTips = useMemo(
    () => MENOPAUSE_SYMPTOM_TIPS.filter((t) => entrySymptoms.includes(t.symptomId)),
    [entrySymptoms]
  );

  const weeklyData = useMemo(() => buildWeeklyData(state.entries), [state.entries]);
  const hasWeeklyData = weeklyData.length >= 2;

  return (
    <div className="flex flex-col gap-5 pb-28">

      {/* ── Hero ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-3xl overflow-hidden p-6 bg-gradient-to-br from-[hsl(340_30%_55%)] to-[hsl(18_52%_58%)] text-primary-foreground"
      >
        <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full opacity-15 bg-primary-foreground" />
        <div className="relative z-10">
          <p className="text-xs font-medium uppercase tracking-widest opacity-80 mb-1">{dateStr}</p>
          <div className="flex items-end gap-3 mb-3">
            <motion.span animate={{ rotate: [0, 8, -8, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} className="text-4xl">
              🛡️
            </motion.span>
            <div>
              <h2 className="font-display text-3xl font-semibold leading-tight">Ma Vitalité</h2>
              <p className="text-sm opacity-85 font-medium">Équilibre Hormonal · Bien-être</p>
            </div>
          </div>
          <p className="text-sm opacity-90 leading-relaxed mb-5">
            Ton suivi au quotidien : symptômes, énergie, humeur, sommeil. Pas de phases cycliques — juste <strong>ton bien-être</strong>.
          </p>
          <button onClick={onSaisie}
            className="inline-flex items-center gap-2 bg-primary-foreground/20 hover:bg-primary-foreground/30 backdrop-blur-sm border border-primary-foreground/30 rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95"
          >
            <span>＋</span> Saisir mes données
          </button>
        </div>
      </motion.div>

      {/* ── Days Without Period Counter ───────────────── */}
      <NoPeriodCounter lmpDate={lmpDate} />

      {/* ── Quick Stats (Wellness, no cycle phases) ───── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { label: "Énergie", emoji: "⚡", value: wellness.energy > 0 ? `${wellness.energy}/5` : "—" },
          { label: "Humeur",  emoji: "🌸", value: wellness.mood > 0   ? `${wellness.mood}/5`   : "—" },
          { label: "Sommeil", emoji: "🌙", value: wellness.sleep > 0  ? `${wellness.sleep}/5`  : "—" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-2xl p-3 text-center shadow-card border border-border/40">
            <p className="text-lg mb-0.5">{s.emoji}</p>
            <p className="font-display font-semibold text-base text-foreground leading-tight">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* ── Wellness Snapshot ─────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
        className="bg-card rounded-3xl p-5 shadow-card border border-border/40"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-semibold">Équilibre Hormonal</h3>
          {latestEntry ? (
            <span className="text-[10px] bg-muted text-muted-foreground px-2 py-1 rounded-full">Sem. {weekNum}</span>
          ) : (
            <button onClick={onSaisie} className="text-[11px] font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full active:scale-95">+ Saisir</button>
          )}
        </div>
        {latestEntry ? (
          <div className="grid grid-cols-2 gap-2.5">
            {WELLNESS_METRICS.map((m) => <WellnessTile key={m.key} metric={m} value={wellness[m.key]} />)}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-4xl mb-2">📊</p>
            <p className="text-sm text-muted-foreground">Aucune donnée cette semaine</p>
            <p className="text-xs text-muted-foreground mt-1">Appuie sur "+ Saisir" pour commencer</p>
          </div>
        )}
      </motion.div>

      {/* ── Symptom Summary (read-only, entry via modal) ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
        className="bg-card rounded-3xl p-5 shadow-card border border-border/40"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-base font-semibold">Mes Symptômes du Jour</h3>
          <button onClick={onSaisie}
            className="text-[11px] font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full active:scale-95 transition-all"
          >
            {entrySymptoms.length > 0 ? "✏️ Modifier" : "+ Saisir"}
          </button>
        </div>

        {entrySymptoms.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {entrySymptoms.map((id) => {
                const def = MENOPAUSE_SYMPTOMS.find((s) => s.id === id);
                if (!def) return null;
                return (
                  <span key={id} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold border ${
                    def.positive
                      ? "bg-[hsl(95_22%_90%)] text-[hsl(95_35%_38%)] border-[hsl(var(--phase-spring))]/40"
                      : "bg-muted text-foreground border-border/60"
                  }`}>
                    <span>{def.emoji}</span>{def.label}
                  </span>
                );
              })}
            </div>

            {/* Triggered advice */}
            {triggeredTips.length > 0 && (
              <div className="pt-3 border-t border-border/40 flex flex-col gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                  <span>⚡</span> Conseils personnalisés ({triggeredTips.length})
                </p>
                {triggeredTips.slice(0, 3).map((tip) => (
                  <div key={tip.symptomId}
                    className={`flex items-start gap-3 rounded-xl p-3 border-l-4 ${
                      tip.category === "EAT" ? "bg-sage-light border-l-[hsl(var(--sage))]"
                      : tip.category === "MOVE" ? "bg-terracotta-light border-l-[hsl(var(--terracotta))]"
                      : "bg-rose-mist border-l-[hsl(var(--secondary))]"
                    }`}
                  >
                    <span className="text-xl flex-shrink-0">{tip.icon}</span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">{tip.category} · {tip.title}</p>
                      <p className="text-xs text-foreground leading-relaxed">{tip.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <p className="text-3xl mb-2">🌿</p>
            <p className="text-sm text-muted-foreground">Aucun symptôme saisi aujourd'hui</p>
            <p className="text-xs text-muted-foreground mt-1">Appuie sur "+ Saisir" pour noter comment tu te sens</p>
          </div>
        )}
      </motion.div>

      {/* ── Daily Journal ─────────────────────────────── */}
      <DailyJournal />

      {/* ── Ask LUNAYA Assistant ──────────────────────── */}
      <AiAssistant activeSymptoms={entrySymptoms} />

      {/* ── Vaginal Discharge Tracker ─────────────────── */}
      <DischargeTracker />

      {/* ── Weekly Evolution Chart ────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
        className="bg-card rounded-3xl p-5 shadow-card border border-border/40"
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-display text-base font-semibold">Évolution Hebdomadaire</h3>
          <span className="text-[10px] bg-muted text-muted-foreground px-2 py-1 rounded-full">4 semaines</span>
        </div>
        <p className="text-[11px] text-muted-foreground mb-4">Énergie, humeur, sommeil et bouffées sur la durée</p>
        {hasWeeklyData ? (
          <>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={weeklyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 11 }} />
                <Line type="monotone" dataKey="energy"   stroke="hsl(var(--phase-summer))" strokeWidth={2} dot={{ r: 3, strokeWidth: 0 }} name="Énergie" />
                <Line type="monotone" dataKey="mood"     stroke="hsl(var(--phase-spring))" strokeWidth={2} dot={{ r: 3, strokeWidth: 0 }} name="Humeur" />
                <Line type="monotone" dataKey="sleep"    stroke="hsl(210 60% 60%)"          strokeWidth={2} dot={{ r: 3, strokeWidth: 0 }} name="Sommeil" />
                <Line type="monotone" dataKey="hotFlash" stroke="hsl(var(--phase-winter))" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3, strokeWidth: 0 }} name="Bouffées" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
              {[{ color: "hsl(var(--phase-summer))", label: "Énergie" }, { color: "hsl(var(--phase-spring))", label: "Humeur" }, { color: "hsl(210 60% 60%)", label: "Sommeil" }, { color: "hsl(var(--phase-winter))", label: "Bouffées", dashed: true }].map((item) => (
                <div key={item.label} className="flex items-center gap-1">
                  <div className="h-0.5 w-4 rounded-full" style={(item as any).dashed ? { borderTop: `2px dashed ${item.color}`, background: "transparent" } : { background: item.color }} />
                  <span className="text-[10px] text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">📈</p>
            <p className="text-sm text-muted-foreground">Données insuffisantes</p>
            <p className="text-xs text-muted-foreground mt-1">Saisis tes données chaque jour pour voir l'évolution</p>
          </div>
        )}
      </motion.div>

      {/* ── EAT · MOVE · DO Protocols ─────────────────── */}
      <div>
        <motion.h3 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="font-display text-lg font-semibold text-foreground mb-3 px-1"
        >
          Protocoles Quotidiens
        </motion.h3>
        <div className="flex flex-col gap-3">
          {MENOPAUSE_CARDS.map((card, i) => {
            const bgs: Record<CardType, string> = { EAT: "bg-sage-light border-sage", MOVE: "bg-terracotta-light border-terracotta", DO: "bg-rose-mist border-secondary" };
            const textColors: Record<CardType, string> = { EAT: "text-accent-foreground", MOVE: "text-terracotta-deep", DO: "text-foreground" };
            const borderOnly = bgs[card.type].split(" ")[1];
            return (
              <motion.div key={card.type} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 + i * 0.08 }}
                className={`rounded-2xl border shadow-card overflow-hidden ${borderOnly}`}
              >
                <div className={`${bgs[card.type]} px-4 pt-3 pb-2 border-b ${borderOnly}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{card.icon}</span>
                    <div>
                      <p className={`text-[10px] font-bold tracking-widest uppercase ${textColors[card.type]}`}>{card.type}</p>
                      <p className="font-display text-sm font-semibold text-foreground leading-tight">{card.title}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-card px-4 py-3">
                  <p className="font-semibold text-sm text-foreground mb-1">{card.advice}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">{card.detail}</p>
                  <button onClick={() => setLearnMore({ card: card.type, ...card.learnMore, icon: card.icon })}
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:opacity-75 transition-opacity active:scale-95"
                  >
                    En savoir plus <ChevronRight size={12} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Health Pillars ────────────────────────────── */}
      <div>
        <motion.h3 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="font-display text-lg font-semibold text-foreground mb-3 px-1"
        >
          Santé de Long Terme
        </motion.h3>
        <div className="flex flex-col gap-2.5">
          {HEALTH_PILLARS.map((pillar, i) => (
            <motion.div key={pillar.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.62 + i * 0.06 }}
              className="bg-card rounded-2xl shadow-card border border-border/40 overflow-hidden"
            >
              <button onClick={() => setOpenPillar(openPillar === i ? null : i)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-muted/40 transition-colors"
              >
                <div className={`w-9 h-9 rounded-xl ${pillar.iconBg} flex items-center justify-center flex-shrink-0 text-lg`}>{pillar.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">{pillar.label}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{pillar.stat}</p>
                </div>
                <motion.div animate={{ rotate: openPillar === i ? 90 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </motion.div>
              </button>
              <AnimatePresence>
                {openPillar === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <div className="px-4 pb-4 flex flex-col gap-1.5 border-t border-border/40 pt-3">
                      {pillar.tips.map((tip, j) => (
                        <div key={j} className="flex items-start gap-2">
                          <span className="text-primary mt-0.5 flex-shrink-0">✓</span>
                          <p className="text-xs text-foreground leading-relaxed">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Understanding Menopause ───────────────────── */}
      <MenopauseEducation />

      {/* ── Nutrition / Dietitian ─────────────────────── */}
      <NutritionContact />

      {/* ── Alertes Santé Ménopause ───────────────────── */}
      <HealthAlertWidget mode="menopause" activeSymptoms={activeSymptoms} />

      {/* ── Export PDF Médecin ────────────────────────── */}
      <div className="bg-card rounded-3xl p-4 shadow-card border border-border/40">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          📄 Bilan Pépite · Partager avec ton médecin
        </p>
        <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">
          Génère un récapitulatif de tes courbes hormonales et symptômes pour ta prochaine consultation gynécologique.
        </p>
        <ExportPDFButton
          mode="menopause"
          symptoms={activeSymptoms}
          currentDay={state.currentDay}
          phase="Ménopause"
          firstName={firstName}
        />
      </div>

      {/* Learn More Modal */}
      {learnMore && (
        <MenopauseLearnMoreModal
          icon={learnMore.icon}
          card={learnMore.card}
          headline={learnMore.headline}
          body={learnMore.body}
          tip={learnMore.tip}
          onClose={() => setLearnMore(null)}
        />
      )}
    </div>
  );
}
