import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Loader2, Sparkles } from "lucide-react";
import { CycleState, CyclePhase, PHASE_INFO, COACH_CARDS, getDailyTip, getSymptomReactiveTip } from "@/lib/cycleEngine";
import { HormonalChart } from "@/components/HormonalChart";
import { LearnMoreModal } from "@/components/LearnMoreModal";
import { LunayaAssistant } from "@/components/LunayaAssistant";
import { EXPERT_DB } from "@/lib/expertDatabase";
import { VisualPhasePlate } from "@/components/VisualPhasePlate";

const BC_SPECIFIC_COACHING: Record<string, { title: string; focus: string; advice: string; nutrient: string; icon: string }> = {
  pill: {
    title: "Optimisation Pilule",
    focus: "Équilibre Micronutritionnel",
    advice: "La pilule bloque l'ovulation, mais elle consomme beaucoup de Vitamines B et de Magnésium pour être métabolisée par ton foie.",
    nutrient: "Focus : Vitamine B6 & B12 (œufs, levure de bière) pour stabiliser ton humeur.",
    icon: "💊"
  },
  iud_hormonal: {
    title: "Équilibre Stérilet",
    focus: "Santé de la Muqueuse",
    advice: "Ton stérilet diffuse des hormones localement. Ton cycle naturel peut persister en arrière-plan, reste à l'écoute de tes variations d'énergie.",
    nutrient: "Focus : Zinc & Vitamine C pour maintenir une barrière endométriale saine.",
    icon: "🛡️"
  },
  patch: {
    title: "Focus Patch",
    focus: "Diffusion Continue",
    advice: "L'absorption cutanée évite le premier passage hépatique, offrant une stabilité hormonale constante sans pics.",
    nutrient: "Focus : Hydratation de la peau & Oméga-3 pour soutenir l'élasticité cutanée.",
    icon: "🩹"
  }
};

const HORMONAL_LABELS: Record<string, { label: string; desc: string; emoji: string }> = {
  winter: { label: "Phase de Retrait", desc: "La chute hormonale artificielle déclenche des saignements de privation.", emoji: "🩸" },
  spring: { label: "Phase d'Éveil", desc: "Début de plaquette : ton corps reçoit ses premières doses protectrices.", emoji: "🌱" },
  summer: { label: "Plateau de Protection", desc: "Ovulation suspendue. Ton climat hormonal est stable et sécurisé.", emoji: "🛡️" },
  autumn: { label: "Phase de Maintien", desc: "Fin de cycle : ton corps est saturé d'hormones avant la pause.", emoji: "🧱" },
};

const DAILY_EXPERT_TIPS: Record<string, string[]> = {
  winter: [
    "J1 : Crampes : Le gingembre (250mg) est cliniquement prouvé aussi efficace que l'ibuprofène sans les effets gastriques (Source: JACM).",
    "J2 : Pertes de Fer : Associe Vitamine C (agrumes) et Fer (épinards/viande) pour multiplier l'absorption par 3.",
    "J3 : Flux : La Vitamine K (brocoli, œufs) régule la cascade de coagulation. Essentiel pour un flux sain.",
    "J4 : Reconstruction : Ton corps fabrique l'endomètre. Priorité aux acides aminés (bouillon d'os, collagène).",
    "J5 : Sommeil : Le Magnésium Bisglycinate réduit l'excitabilité utérine et favorise le sommeil profond en fin de flux."
  ],
  spring: [
    "J7 : Qualité ovocytaire : Le Sélénium (1 noix du Brésil) protège les follicules contre le stress oxydatif.",
    "J8 : Detox Œstrogènes : Les crucifères contiennent du DIM, qui aide le foie à métaboliser l'œstrogène en voie saine.",
    "J9 : Énergie ascendante : Les fibres solubles (lin, chia) stabilisent la glycémie face à la montée hormonale.",
    "J10 : Épaisseur endomètre : La Vitamine E soutient la vascularisation de la muqueuse utérine pour la nidation.",
    "J11 : Microbiote : Tes hormones influencent ton 'estrobolome'. Consomme des aliments fermentés pour l'équilibre hormonal."
  ],
  summer: [
    "J13 : Pic de LH : Le Zinc est le cofacteur indispensable au déclenchement de l'ovulation (Source: The Lancet).",
    "J14 : Protection folliculaire : Les antioxydants massifs (baies rouges) protègent l'ADN de l'ovule libéré.",
    "J15 : Métabolisme : Après l'ovulation, ton métabolisme de base augmente de 5%. Augmente tes protéines légères.",
    "J16 : Histamine : Le pic d'œstrogène peut augmenter l'histamine. La quercétine (oignon, pomme) calme l'inflammation."
  ],
  autumn: [
    "J19 : Équilibre GABA : La progestérone stimule le GABA. Le Magnésium aide à calmer l'anxiété prémenstruelle.",
    "J21 : Sérotonine : La chute d'œstrogène fait baisser la sérotonine. Les glucides complexes soutiennent ton moral.",
    "J22 : Anti-inflammation : Le Curcuma bloque les prostaglandines inflammatoires avant même l'arrivée des règles.",
    "J24 : Rétention d'eau : La Vitamine B6 régule l'activité hormonale et réduit le gonflement des tissus (Source: ANSES).",
    "J26 : Préparation utérine : L'infusion de framboisier tonifie le muscle utérin pour faciliter les contractions futures."
  ]
};

// ── PROGRAMME QUOTIDIEN MÉNOPAUZE (Rotation 7 jours) ─────────────
const MENOPAUSE_DAILY_PROGRAM = [
  { day: 1, type: "EAT", icon: "🦴", title: "Santé Osseuse", advice: "Priorité Calcium (1200mg).", detail: "Ajoute des sardines ou du chou kale. Les estrogènes bas ralentissent la fixation osseuse (Source: NAMS)." },
  { day: 2, type: "MOVE", icon: "🧘", title: "Système Nerveux", advice: "Cohérence cardiaque matinale.", detail: "5 min de respiration 5/5 stabilisent le thermostat interne pour la journée." },
  { day: 3, type: "EAT", icon: "🥑", title: "Cardio-Protection", advice: "Focus Oméga-3 (DHA/EPA).", detail: "Remplace le beurre par l'huile d'olive. Ton risque cardio augmente physiologiquement (Source: Mayo Clinic)." },
  { day: 4, type: "DO", icon: "☀️", title: "Lumière & Humeur", advice: "20 min d'exposition naturelle.", detail: "Aide à réguler l'axe rétino-hypothalamique pour stabiliser les émotions." },
  { day: 5, type: "EAT", icon: "🌱", title: "Phytoestrogènes", advice: "Une portion de soja ou lin.", detail: "Aide à mimer naturellement l'action des œstrogènes sur les récepteurs cellulaires." },
  { day: 6, type: "MOVE", icon: "💪", title: "Masse Musculaire", advice: "Renforcement doux (Poids du corps).", detail: "Crucial pour maintenir le métabolisme de base qui ralentit." },
  { day: 7, type: "DO", icon: "🛌", title: "Hygiène de Nuit", advice: "Chambre à 18°C & Glycine.", detail: "La baisse de progestérone rend le sommeil plus fragile. Prépare ton environnement." }
];

// ── ACTIONS IMMÉDIATES (Réactions aux symptômes) ───────────────────
const MENOPAUSE_SYMPTOM_TRIGGERS: Record<string, any> = {
  bouffees_chaleur: { type: "EAT", icon: "❄️", title: "Alerte Glycémique", message: "Évite les sucres rapides ce soir. Les pics d'insuline déclenchent des vagues de chaleur nocturnes." },
  sommeil_agite: { type: "DO", icon: "💊", title: "Aide au Sommeil", message: "Prends du Magnésium Bisglycinate 1h avant le coucher pour calmer le système nerveux." },
  brain_fog: { type: "EAT", icon: "🧠", title: "Neuro-Nutrition", message: "Augmente les antioxydants (baies, noix) pour protéger tes neurones du stress oxydatif." },
  anxiete: { type: "MOVE", icon: "🚶‍♀️", title: "Marche Digestive", message: "15 min de marche après le repas réduit le cortisol et stabilise l'humeur instantanément." }
};

const MENOPAUSE_EXPERT_DB: Record<string, { title: string; mechanism: string; actions: string[]; source: string }> = {
  bouffees_chaleur: {
    title: "Thermorégulation Hypothalamique",
    mechanism: "La chute des œstrogènes perturbe le centre de contrôle thermique du cerveau.",
    actions: [
      "Vitamines E : Réduit l'intensité des épisodes de 30% (Source: Menopause Journal).",
      "Respiration lente (6 cycles/min) : Calme le système nerveux sympathique.",
      "Lignanes (Graines de lin) : Phytoestrogènes naturels modulant la réponse thermique."
    ],
    source: "NAMS (North American Menopause Society)"
  },
  sommeil_agite: {
    title: "Architecture du Sommeil & Progestérone",
    mechanism: "La baisse de la progestérone réduit la phase de sommeil profond.",
    actions: [
      "Magnésium Bisglycinate : Co-facteur de la synthèse du GABA pour l'endormissement.",
      "Douche tiède 1h avant : Aide la température interne à chuter.",
      "Glycine : Acide aminé cliniquement prouvé pour stabiliser la température nocturne."
    ],
    source: "Journal of Clinical Sleep Medicine"
  }
};

interface TodayViewProps {
  state: CycleState;
  onSaisie: () => void;
}

import type { Variants } from "framer-motion";

// ── Fertility Card ────────────────────────────────────────────────────
interface FertilityInfo {
  level: "low" | "medium" | "high" | "very-high";
  label: string;
  explanation: string;
  dot: string;
  bg: string;
  badge: string;
}

const BC_CONFIG = {
  pill: {
    title: "Ma Pilule",
    status: "Protection à 91%",
    desc: "Ta vigilance est ta force. Un oubli impacte directement ta protection.",
    action: "Prise aujourd'hui ?",
    icon: "💊",
    theme: "bg-blue-50 border-blue-100 text-blue-800"
  },
  iud_hormonal: {
    title: "Mon Stérilet",
    status: "Protection à 99,8%",
    desc: "Sérénité totale. Ton stérilet agit localement et en continu.",
    action: "Statut : Actif & Sûr",
    icon: "🛡️",
    theme: "bg-emerald-50 border-emerald-100 text-emerald-800"
  },
  other: {
    title: "Contraception",
    status: "Hormones Actives",
    desc: "Ton corps reçoit une dose constante pour bloquer l'ovulation.",
    action: "Suivi en cours",
    icon: "💉",
    theme: "bg-purple-50 border-purple-100 text-purple-800"
  }
};

function getFertilityInfo(phase: CyclePhase, currentDay: number, cycleLength: number): FertilityInfo {
  const ovDay = Math.round(cycleLength * 0.46);
  const isOvulationDay = currentDay === ovDay;
  const isNearOvulation = currentDay >= ovDay - 1 && currentDay <= ovDay + 1;

  if (isOvulationDay) {
    return {
      level: "very-high",
      label: "Très haute — Jour de l'ovulation",
      explanation: "Aujourd'hui est ton pic de fertilité. Le follicule libère l'ovule. C'est la fenêtre la plus favorable à la conception, qui dure environ 12 à 24 heures.",
      dot: "bg-[hsl(0_70%_55%)]",
      bg: "bg-[hsl(0_70%_96%)]",
      badge: "border-[hsl(0_70%_55%)] text-[hsl(0_60%_45%)]",
    };
  }
  if (isNearOvulation || phase === "summer") {
    return {
      level: "high",
      label: "Haute — Phase ovulatoire",
      explanation: "Tu es dans ta phase ovulatoire. La fertilité est à son maximum. Les spermatozoïdes peuvent survivre jusqu'à 5 jours, rendant cette période très propice à la conception.",
      dot: "bg-[hsl(15_80%_55%)]",
      bg: "bg-[hsl(15_80%_96%)]",
      badge: "border-[hsl(15_80%_55%)] text-[hsl(15_70%_40%)]",
    };
  }
  if (phase === "spring") {
    return {
      level: "medium",
      label: "Croissante — Phase folliculaire",
      explanation: "Ta fertilité augmente progressivement. Les œstrogènes montent et préparent l'ovulation. La glaire cervicale commence à devenir plus claire et élastique — signe de fertilité croissante.",
      dot: "bg-[hsl(38_75%_55%)]",
      bg: "bg-[hsl(38_75%_96%)]",
      badge: "border-[hsl(38_75%_55%)] text-[hsl(38_65%_38%)]",
    };
  }
  if (phase === "autumn") {
    return {
      level: "low",
      label: "Faible — Phase lutéale",
      explanation: "L'ovulation est passée. La progestérone domine cette phase. Les chances de conception sont faibles en fin de phase lutéale, et l'endomètre se prépare soit à une grossesse soit aux règles.",
      dot: "bg-[hsl(var(--phase-spring))]",
      bg: "bg-[hsl(95_22%_95%)]",
      badge: "border-[hsl(var(--phase-spring))] text-[hsl(95_35%_35%)]",
    };
  }
  // winter
  return {
    level: "low",
    label: "Très faible — Phase menstruelle",
    explanation: "Les règles sont présentes ou viennent de se terminer. Les chances de grossesse sont très faibles durant cette phase, bien qu'une ovulation précoce reste possible dans certains cycles courts.",
    dot: "bg-[hsl(var(--phase-spring))]",
    bg: "bg-[hsl(95_22%_95%)]",
    badge: "border-[hsl(var(--phase-spring))] text-[hsl(95_35%_35%)]",
  };
}

function FertilityCard({ phase, currentDay, cycleLength }: { phase: CyclePhase; currentDay: number; cycleLength: number }) {
  const f = getFertilityInfo(phase, currentDay, cycleLength);
  const dots = ["low", "medium", "high", "very-high"] as const;
  const dotColors: Record<string, string> = {
    "low": "bg-[hsl(var(--phase-spring))]",
    "medium": "bg-[hsl(38_75%_55%)]",
    "high": "bg-[hsl(15_80%_55%)]",
    "very-high": "bg-[hsl(0_70%_55%)]",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.19 }}
      className={`rounded-3xl p-5 shadow-card border border-border/40 ${f.bg}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-base font-semibold text-foreground">Fertilité aujourd'hui</h3>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${f.badge}`}>
          {f.level === "very-high" ? "Pic d'ovulation" : f.level === "high" ? "Haute" : f.level === "medium" ? "Croissante" : "Faible"}
        </span>
      </div>

      {/* Level indicator dots */}
      <div className="flex items-center gap-1.5 mb-3">
        {dots.map((d) => {
          const levels = ["low", "medium", "high", "very-high"];
          const active = levels.indexOf(d) <= levels.indexOf(f.level);
          return (
            <div
              key={d}
              className={`h-2 flex-1 rounded-full transition-all ${active ? dotColors[d] : "bg-muted"}`}
            />
          );
        })}
      </div>

      <p className="text-xs font-semibold text-foreground mb-1">{f.label}</p>
      <p className="text-[11px] text-muted-foreground leading-relaxed">{f.explanation}</p>
    </motion.div>
  );
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  }),
};

const COACH_CARD_CONFIG: Record<string, { accentBg: string; accentBorder: string; accentText: string; title: string }> = {
  EAT: { accentBg: "bg-sage-light", accentBorder: "border-sage", accentText: "text-accent-foreground", title: "Mon Assiette du Jour" },
  MOVE: { accentBg: "bg-terracotta-light", accentBorder: "border-terracotta", accentText: "text-terracotta-deep", title: "Mon Mouvement du Jour" },
  DO: { accentBg: "bg-rose-mist", accentBorder: "border-secondary", accentText: "text-foreground", title: "Mon Focus du Jour" },
};

type CardType = "EAT" | "MOVE" | "DO";

// ── Full symptom reaction engine ──────────────────────────────────────
interface SymptomAction {
  symptomIds: string[];
  category: CardType;
  icon: string;
  title: string;
  message: string;
  minIntensity?: number; // only trigger if intensity >= this value
}

// Phase caloric context
const PHASE_CALORIC_INFO: Record<string, { delta: string; focus: string; emoji: string }> = {
  winter: {
    delta: "Besoins normaux",
    focus: "Reminéralisation : Fer & Magnésium prioritaires",
    emoji: "🩸",
  },
  spring: {
    delta: "Besoins normaux",
    focus: "Graisses saines & phytoestrogènes pour soutenir la montée d'œstrogènes",
    emoji: "🥑",
  },
  summer: {
    delta: "Besoins normaux",
    focus: "Hydratation × 1.5 — antioxydants pour protéger les follicules",
    emoji: "💧",
  },
  autumn: {
    delta: "+150 à +300 kcal",
    focus: "Ton métabolisme s'accélère. Glucides complexes + magnésium anti-SPM",
    emoji: "🔥",
  },
};

const SYMPTOM_REACTIONS: SymptomAction[] = [
  // ── EAT reactions ──────────────────────────────────────────────────
  { symptomIds: ["seins_sensibles"], category: "EAT", icon: "🍈", title: "Rétention d'eau détectée", message: "Réduis le sel et la caféine aujourd'hui. Augmente les aliments riches en potassium (banane, épinards, avocat) pour équilibrer la rétention hydrique mammaire." },
  { symptomIds: ["acne"], category: "EAT", icon: "✨", title: "Inflammation cutanée", message: "Tes œstrogènes chutent. Privilégie Zinc + Oméga-3 : noix, sardines, graines de lin. Évite le lait de vache qui amplifie l'IGF-1 pro-acné." },
  { symptomIds: ["sucre"], category: "EAT", icon: "🍫", title: "Ton corps cherche de la sérotonine", message: "Privilégie des glucides complexes (riz complet, avoine, patate douce) pour stabiliser la glycémie sans pic d'insuline. Une poignée de noix suffit à calmer la pulsion." },
  { symptomIds: ["sale"], category: "EAT", icon: "🍔", title: "Signal minéral", message: "Les pulsions salées indiquent souvent un déficit en magnésium ou en sodium. Essaie une eau minérale riche en Mg (Hépar, Rozana) plutôt que les chips." },
  { symptomIds: ["nausees"], category: "EAT", icon: "🤢", title: "Nausées hormonales", message: "Gingembre frais en tisane ou en capsule (1g/j). Petits repas fréquents plutôt que 3 grands. Évite les aliments gras et l'odeur forte de cuisson." },
  { symptomIds: ["ballonnements"], category: "EAT", icon: "🎈", title: "Digestion perturbée", message: "Évite le chou cru, les légumineuses non trempées et le gluten. Préfère les aliments cuits, le gingembre en tisane et les aliments fermentés (kéfir, kimchi)." },
  { symptomIds: ["transit_lent"], category: "EAT", icon: "🐌", title: "Motilité intestinale ralentie", message: "La progestérone ralentit le transit. Augmente les fibres solubles (psyllium, graines de chia), hydratation ++ et marche matinale pour stimuler le péristaltisme." },
  { symptomIds: ["migraine"], category: "EAT", icon: "🤕", title: "Migraine hormonale", message: "Magnésium en priorité (graines de courge, noix du Brésil). Hydratation ++ et évite les nitrites (charcuterie, fromages affinés). 500 mg de magnésium bisglycinate peut réduire les crises." },
  { symptomIds: ["secheresse"], category: "EAT", icon: "🌵", title: "Sécheresse des muqueuses", message: "Oméga-3 (huile de lin, sardines) et Vitamine E (amandes, huile d'olive) soutiennent la lubrification des muqueuses de l'intérieur. Hydratation ++ : 2L/j minimum." },
  { symptomIds: ["secheresse_peau", "peau_seche"], category: "EAT", icon: "🧴", title: "Sécheresse cutanée", message: "Hyaluronate naturel : bouillon d'os, avocat, concombre. Vitamine C (poivron, agrumes) pour la synthèse de collagène. Oméga-3 pour l'hydratation profonde de la peau." },
  { symptomIds: ["diarrhee"], category: "EAT", icon: "💨", title: "Transit accéléré", message: "Les prostaglandines accélèrent le transit en phase menstruelle. Riz blanc, banane, compote. Évite le café, les crudités et les aliments gras. Réhydrate-toi avec de l'eau de coco." },
  { symptomIds: ["perte_appetit"], category: "EAT", icon: "🚫", title: "Appétit en berne", message: "Petits repas nutritifs toutes les 3h plutôt que de forcer. Smoothie protéiné (banane + beurre d'amande + cacao) si l'assiette ne passe pas. Ton corps gère — fais-lui confiance." },
  { symptomIds: ["faim_exces"], category: "EAT", icon: "🍽️", title: "Faim hormonale", message: "Ton métabolisme accélère en phase lutéale (+150 à 300 kcal/j). Mange à ta faim avec des protéines + fibres pour tenir longtemps. Ce n'est pas de la gourmandise, c'est de la biologie." },
  { symptomIds: ["reflux"], category: "EAT", icon: "🔄", title: "Reflux gastrique", message: "La progestérone relâche le sphincter œsophagien. Évite de manger 2h avant le coucher, réduis les agrumes et les tomates. Surélevé la tête de lit de 15 cm." },
  { symptomIds: ["digestion_lente"], category: "EAT", icon: "⏳", title: "Digestion lente", message: "Mange lentement, mâche 20× chaque bouchée. Tisane de menthe ou fenouil après le repas. Évite de boire trop pendant le repas — plutôt entre les repas." },
  { symptomIds: ["retention_eau"], category: "EAT", icon: "💧", title: "Rétention d'eau", message: "Réduis le sel, augmente le potassium (banane, épinards, avocat). Infusion de pissenlit = diurétique doux naturel. L'eau paradoxalement aide à évacuer la rétention." },
  { symptomIds: ["cheveux_gras"], category: "EAT", icon: "💦", title: "Sébum en excès", message: "Le pic d'androgènes stimule les glandes sébacées. Zinc (graines de courge, huîtres) et Vitamine B6 (volaille, banane) pour réguler la production de sébum." },
  { symptomIds: ["chute_cheveux"], category: "EAT", icon: "💇", title: "Chute capillaire", message: "Fer + Biotine + Zinc sont tes alliés : lentilles, œufs, noix du Brésil. La chute post-ovulatoire est souvent liée à la baisse d'œstrogènes — c'est temporaire." },
  { symptomIds: ["ongles_cassants"], category: "EAT", icon: "💅", title: "Fragilité des ongles", message: "Biotine (œufs, amandes) + Silice (prêle en tisane, avoine). Les ongles reflètent ton statut nutritionnel des 3 derniers mois — patience et constance." },
  { symptomIds: ["teint_terne"], category: "EAT", icon: "😐", title: "Teint terne", message: "Antioxydants en force : myrtilles, grenade, épinards. Vitamine C (kiwi, poivron) pour l'éclat. Hydratation 2L/j — ta peau est le miroir de ton hydratation." },
  { symptomIds: ["prise_poids_res"], category: "EAT", icon: "⚖️", title: "Sensation de prise de poids", message: "En phase lutéale, 1 à 2 kg de rétention d'eau sont normaux. Ce n'est PAS de la graisse. Réduis le sel, augmente les fibres. Ça se normalisera avec les règles." },
  { symptomIds: ["chaleur_peau"], category: "EAT", icon: "🌡️", title: "Chaleur corporelle", message: "La progestérone augmente la température basale de 0.3-0.5°C. Aliments rafraîchissants : concombre, pastèque, menthe. Hydratation ++ et vêtements en fibres naturelles." },
  { symptomIds: ["pertes_abondantes"], category: "EAT", icon: "💧", title: "Pertes abondantes", message: "En phase ovulatoire, la glaire cervicale devient abondante et filante — c'est un signe de fertilité, pas un problème. Hydratation ++ et probiotiques (kéfir, yaourt) pour la flore." },

  // ── MOVE reactions ─────────────────────────────────────────────────
  { symptomIds: ["crampes"], category: "MOVE", icon: "🩸", title: "Yoga restauratif requis", message: "Remplace ta séance par du yoga restauratif : posture de l'enfant (5 min), papillon, étirements du psoas. Bouillotte chaude 20 min sur le bas-ventre = analgésique naturel." },
  { symptomIds: ["douleurs_articulaires"], category: "MOVE", icon: "🦴", title: "Contexte inflammatoire articulaire", message: "Remplace le sport d'impact (course, saut) par la natation ou le yoga restauratif. L'eau porte le poids et soulage les articulations. Curcuma + Oméga-3 en parallèle." },
  { symptomIds: ["jambes_lourdes"], category: "MOVE", icon: "🦵", title: "Circulation à activer", message: "Surélève les jambes 15 min (jambes au mur). Marche de 20 min pour activer le retour veineux. Évite la position debout ou assise prolongée sans mouvement." },
  { symptomIds: ["epuisee"], category: "MOVE", icon: "🪫", title: "Fatigue profonde", message: "Remplace l'entraînement intense par une marche de 20 min max. Le mouvement doux libère des endorphines sans épuiser. Pas de culpabilité — c'est de la périodisation intelligente." },
  { symptomIds: ["energie_low"], category: "MOVE", icon: "🪫", title: "Énergie basse", message: "Mouvement doux uniquement : marche 15-20 min ou étirements. Ton corps a besoin de récupérer. Demain sera peut-être plus fluide — fais confiance au rythme." },
  { symptomIds: ["douleurs_dos"], category: "MOVE", icon: "🫀", title: "Douleurs dorsales", message: "Étirements du chat-vache 5 min + posture de l'enfant. Évite les abdos classiques (crunchs). La chaleur locale (bouillotte) détend les contractures profondes." },
  { symptomIds: ["douleurs_musculaires"], category: "MOVE", icon: "💪", title: "Courbatures musculaires", message: "Auto-massage avec balle de tennis, stretching dynamique léger. La progestérone ralentit la récupération musculaire — diminue l'intensité de 20% cette semaine." },
  { symptomIds: ["tension_nuque"], category: "MOVE", icon: "🧶", title: "Tension cervicale", message: "Rotations douces du cou (10× chaque sens), étirements trapèzes. Vérifie ta posture d'écran. 5 min de respiration profonde relâchent les épaules réflexivement." },
  { symptomIds: ["douleurs_ovaires"], category: "MOVE", icon: "🔴", title: "Douleurs ovariennes", message: "C'est peut-être le Mittelschmerz (douleur d'ovulation). Chaleur locale, repos, mouvements doux. Si la douleur persiste > 48h ou s'aggrave, consulte." },
  { symptomIds: ["crampes_jambes"], category: "MOVE", icon: "🦿", title: "Crampes musculaires", message: "Étirements des mollets avant et après l'effort. Magnésium (banane, chocolat noir). Si nocturnes : étire tes mollets 30 sec avant le coucher." },
  { symptomIds: ["sommeil_agite"], category: "MOVE", icon: "🌪️", title: "Sommeil agité", message: "Yoga Nidra 15 min avant le coucher. Pas de sport intense après 18h — le cortisol post-entraînement perturbe l'endormissement. Étirements doux seulement." },
  { symptomIds: ["peau_piquante"], category: "MOVE", icon: "🌵", title: "Peau réactive", message: "Évite les vêtements synthétiques pendant le sport. Douche tiède immédiate après l'effort — la transpiration aggrave les démangeaisons. Coton ou bambou uniquement." },
  { symptomIds: ["hypersomnie"], category: "MOVE", icon: "🛌", title: "Hypersomnie", message: "Ton corps réclame du repos mais le mouvement aide à réguler. 15 min de marche en plein air au réveil = reset de l'horloge circadienne. Évite les siestes > 20 min." },

  // ── DO reactions ───────────────────────────────────────────────────
  { symptomIds: ["brain_fog"], category: "DO", icon: "🌫️", title: "Brouillard mental : œstrogènes en chute", message: "Simplifie ton agenda à une seule tâche importante. 20 min de marche au grand air pour réoxygéner le cerveau. Évite le multitâche — ton cortex préfrontal est en mode économie." },
  { symptomIds: ["irritable"], category: "DO", icon: "⚡", title: "Seuil de tolérance bas", message: "Priorise les tâches solo. Planifie une coupure de 10 min en plein air ce soir. Informe ton entourage : 'j'ai besoin de calme' est une phrase complète et légitime." },
  { symptomIds: ["anxiete"], category: "DO", icon: "😰", title: "Anxiété hormonale", message: "Cohérence cardiaque 5 min : inspire 5 sec, expire 5 sec. Répète 3×/jour. Cette technique régule le système nerveux autonome et réduit le cortisol en 10 jours." },
  { symptomIds: ["stress"], category: "DO", icon: "🧠", title: "Stress élevé détecté", message: "Le stress chronique en phase lutéale × l'irritabilité. Technique : liste 3 priorités absolues et ignore le reste. Prévois 20 min de déconnexion totale avant 20h." },
  { symptomIds: ["triste"], category: "DO", icon: "😔", title: "Mélancolie lutéale", message: "La chute de sérotonine est physiologique en fin de cycle. Exposition au soleil 20 min, aliments riches en tryptophane (banane, œufs, dinde). Journaling : note 3 choses concrètes positives." },
  { symptomIds: ["insomnie"], category: "DO", icon: "😳", title: "Insomnie hormonale", message: "Pas d'écrans après 21h. Tisane de valériane ou mélisse. Respiration 4-7-8 : inspire 4 sec, retiens 7, expire 8. La température de la chambre idéale est 17–19°C." },
  { symptomIds: ["reveils_precoces"], category: "DO", icon: "⏰", title: "Réveils précoces", message: "Les réveils entre 3–5h indiquent souvent un pic de cortisol. Évite l'alcool, le sucre et les écrans le soir. Magnésium glycinate (400 mg) au coucher aide à maintenir le sommeil profond." },
  { symptomIds: ["surcharge_mentale"], category: "DO", icon: "🧠", title: "Surcharge mentale", message: "Brain dump : écris TOUT ce qui te préoccupe sur une feuille (5 min). Puis identifie les 3 seules actions que tu contrôles. Le reste n'a pas de place dans ta journée." },
  { symptomIds: ["rumination"], category: "DO", icon: "🌀", title: "Pensées en boucle", message: "La rumination est amplifiée par la progestérone. Technique : nomme l'émotion à voix haute ('je ressens de l'inquiétude'). Ça active le cortex préfrontal et calme l'amygdale." },
  { symptomIds: ["manque_motivation"], category: "DO", icon: "😶", title: "Motivation en berne", message: "C'est hormonal, pas un défaut de caractère. Technique des 2 min : commence n'importe quelle tâche pendant 2 min seulement. Le cerveau s'active par l'action, pas par la motivation." },
  { symptomIds: ["sensibilite_emotionnelle"], category: "DO", icon: "🥺", title: "Hypersensibilité émotionnelle", message: "Tes récepteurs émotionnels sont amplifiés par la progestérone. C'est un super-pouvoir d'empathie, pas une faiblesse. Protège-toi des stimuli négatifs (news, réseaux) aujourd'hui." },
  { symptomIds: ["colere"], category: "DO", icon: "🔥", title: "Colère hormonale", message: "La colère en phase lutéale a souvent une vraie raison — elle est juste amplifiée. Note ce qui t'énerve : il y a probablement un besoin non exprimé derrière. Exprime-le calmement demain." },
  { symptomIds: ["pleurs"], category: "DO", icon: "😢", title: "Envie de pleurer", message: "Pleurer libère des endorphines et du cortisol — c'est un mécanisme de régulation, pas de faiblesse. Autorise-toi 10 min de larmes, puis bois un grand verre d'eau et marche 5 min." },
  { symptomIds: ["detachement"], category: "DO", icon: "🫥", title: "Détachement émotionnel", message: "Le sentiment de vide en fin de cycle est lié à la chute de sérotonine. Ce n'est PAS ta réalité permanente. Contact humain doux (appelle quelqu'un), soleil, mouvement léger." },
  { symptomIds: ["cauchemars"], category: "DO", icon: "😟", title: "Rêves intenses / cauchemars", message: "La progestérone intensifie l'activité onirique en phase lutéale. Écris tes rêves au réveil — ils contiennent souvent des messages symboliques utiles. Magnésium le soir peut aider." },
  { symptomIds: ["difficulte_endormissement"], category: "DO", icon: "🕙", title: "Difficulté d'endormissement", message: "Routine fixe : écrans OFF à 21h, tisane, 10 min de lecture. Respiration 4-7-8. Ton corps a besoin de signaux pour comprendre que la journée est finie." },
  { symptomIds: ["sueurs_nuit", "sueurs_nocturnes"], category: "DO", icon: "🌙", title: "Sueurs nocturnes", message: "Chambre à 17°C. Draps en coton ou bambou. Évite les repas chauds et l'alcool après 18h. Cohérence cardiaque au coucher réduit la fréquence des épisodes nocturnes." },
  { symptomIds: ["bouffees_chaleur"], category: "DO", icon: "🌡️", title: "Action immédiate — Bouffée de chaleur", message: "Cohérence cardiaque 5 min maintenant. Évite les épices, le café et l'alcool ce soir. Fenêtre entrouverte, vêtements en fibres naturelles (coton/lin)." },
  { symptomIds: ["libido_basse"], category: "DO", icon: "💔", title: "Libido en retrait", message: "La libido fluctue naturellement avec le cycle. En phase lutéale, la progestérone la freine. Zéro pression — la reconnexion au corps (bain chaud, auto-massage) aide plus que la volonté." },
  { symptomIds: ["secheresse_vaginale"], category: "DO", icon: "🌵", title: "Sécheresse intime", message: "Oméga-3 en interne + lubrifiant à base d'eau en externe. Évite les savons intimes agressifs. La flore vaginale se régule — probiotiques oraux (Lactobacillus) peuvent aider." },
  { symptomIds: ["douleurs_rapports"], category: "DO", icon: "⚡", title: "Douleurs lors des rapports", message: "La douleur n'est JAMAIS normale à tolérer. Lubrifiant, préliminaires prolongés, communication avec le/la partenaire. Si persistant, consulte un·e gynéco — des solutions existent." },
  { symptomIds: ["odeur_inhabituelle"], category: "DO", icon: "🌂", title: "Odeur inhabituelle", message: "Une légère variation est normale selon la phase du cycle. Si forte ou persistante avec démangeaisons, ça peut indiquer une infection — consulte dans les 48h. Pas de douche vaginale." },
  { symptomIds: ["demangeaisons"], category: "DO", icon: "🌶️", title: "Démangeaisons intimes", message: "Sous-vêtements coton, pas de protège-slips quotidiens. Évite les bains moussants. Si persistant > 3 jours avec pertes inhabituelles, consulte — c'est souvent une mycose facile à traiter." },

  // ── Positive symptom reactions (reinforcement) ─────────────────────
  { symptomIds: ["energie_max"], category: "MOVE", icon: "⚡", title: "Énergie au max !", message: "C'est TON jour ! Profites-en pour ta séance la plus intense de la semaine : HIIT, course, musculation. Tes œstrogènes boostent ta force et ta récupération musculaire." },
  { symptomIds: ["sport_facile"], category: "MOVE", icon: "🏃‍♀️", title: "Corps fluide & performant", message: "Ton corps est dans sa fenêtre de performance optimale. Pousse tes limites aujourd'hui : record personnel, nouveau cours, défi sportif. Tu récupèreras vite." },
  { symptomIds: ["confiance"], category: "DO", icon: "💪", title: "Confiance au sommet", message: "Ta confiance est portée par les œstrogènes. Profites-en pour les conversations difficiles, les négociations, les prises de décision. C'est le moment de demander cette augmentation." },
  { symptomIds: ["creative"], category: "DO", icon: "🎨", title: "Créativité en ébullition", message: "Ton cerveau droit est ultra-actif. Brainstorm, dessine, écris, innove. Les meilleures idées arrivent souvent dans cette fenêtre hormonale — note-les TOUTES." },
  { symptomIds: ["sociale"], category: "DO", icon: "🥂", title: "Magnétisme social", message: "Ton énergie sociale est contagieuse. Planifie les rencontres, networking, dates. Ta communication non-verbale est irrésistible — les études le prouvent en phase ovulatoire." },
  { symptomIds: ["magnetisme"], category: "DO", icon: "🌟", title: "Tu rayonnes !", message: "Le pic d'œstrogènes rend ta peau plus lumineuse, ta voix plus mélodieuse et ton énergie magnétique. Les études montrent que l'attractivité est mesurable en phase ovulatoire. Brille !" },
  { symptomIds: ["belle_peau", "peau_lumineuse"], category: "EAT", icon: "🌸", title: "Peau radieuse", message: "Tes œstrogènes nourrissent ta peau de l'intérieur. Continue avec des antioxydants (myrtilles, grenade) et Vitamine C (kiwi). Hydratation 2L/j pour maintenir cet éclat." },
  { symptomIds: ["beaux_cheveux"], category: "EAT", icon: "💇‍♀️", title: "Cheveux sublimes", message: "Les œstrogènes allongent la phase de croissance capillaire. Protéines + Biotine (œufs, amandes) pour maximiser cet effet. C'est le bon moment pour un traitement capillaire." },
  { symptomIds: ["beaux_ongles"], category: "EAT", icon: "💅", title: "Ongles forts", message: "Ton statut nutritionnel est excellent ! Kératine renforcée par les œstrogènes. Maintiens avec Biotine et Silice pour des ongles qui restent beaux tout le cycle." },
  { symptomIds: ["bonne_humeur_pos"], category: "DO", icon: "😄", title: "Super bonne humeur", message: "Profite de cette énergie pour semer des graines relationnelles : appelle un·e ami·e, envoie un message positif, fais un compliment. La bonne humeur est contagieuse." },
  { symptomIds: ["motivee_pos"], category: "DO", icon: "🚀", title: "Ultra motivée", message: "Canalise cette motivation sur tes objectifs importants. C'est le moment de lancer le projet reporté, d'attaquer la tâche difficile. Fais ta to-do list et coche tout !" },
  { symptomIds: ["zen_pos", "serenite"], category: "DO", icon: "🧘‍♀️", title: "Sérénité intérieure", message: "Cet état de paix est précieux. Ancre-le : méditation de gratitude 5 min, promenade contemplative. Note ce qui t'a amenée ici pour reproduire ces conditions." },
  { symptomIds: ["libido_haute", "libido_present"], category: "DO", icon: "🌹", title: "Libido éveillée", message: "Ton corps est en phase de fertilité et de désir. Connexion au corps : danse, yoga, auto-massage. Communication ouverte avec ton/ta partenaire si tu le souhaites." },
  { symptomIds: ["gratitude"], category: "DO", icon: "🙏", title: "Gratitude active", message: "La gratitude réduit le cortisol de 23% selon les études. Écris 3 gratitudes spécifiques ce soir. Ce rituel renforce littéralement les circuits neuronaux du bonheur." },
  { symptomIds: ["productivite"], category: "DO", icon: "🎯", title: "Productivité au top", message: "Flow state accessible ! Bloque 90 min sans interruption sur ta tâche principale. Pas de notifications. Ton cerveau est en mode haute performance — exploite-le." },
  { symptomIds: ["focus_laser"], category: "DO", icon: "🔍", title: "Concentration maximale", message: "Les œstrogènes optimisent la dopamine = focus naturel. Technique Pomodoro : 25 min de travail, 5 min de pause. Tu peux accomplir énormément aujourd'hui." },
  { symptomIds: ["corps_bien", "souplesse"], category: "MOVE", icon: "💃", title: "Corps en harmonie", message: "Ton corps te remercie ! C'est le moment idéal pour tester un nouveau sport, aller plus loin dans ta pratique. La proprioception est excellente en phase folliculaire." },
  { symptomIds: ["appetit_sain", "bonne_digestion"], category: "EAT", icon: "✅", title: "Digestion au top", message: "Profite de cette fenêtre digestive optimale pour introduire de nouveaux aliments sains. Les fibres passent bien, les probiotiques s'intègrent mieux. Varie ton assiette !" },
  { symptomIds: ["joie_vivre"], category: "DO", icon: "🌈", title: "Joie de vivre", message: "Cette joie est chimique ET réelle. Partage-la : propose une sortie, un projet collectif. Les souvenirs créés dans cet état émotionnel s'ancrent plus profondément en mémoire." },
  { symptomIds: ["profond"], category: "DO", icon: "😴", title: "Bon sommeil enregistré", message: "Excellent ! Le bon sommeil booste la récupération hormonale, la mémorisation et l'immunité. Maintiens cette routine : même heure de coucher, chambre fraîche, pas d'écrans." },
];

// Calie multi-symptom messages
interface CoachMessage { symptoms: string[]; message: string; }
const COACH_MESSAGES: CoachMessage[] = [
  { symptoms: ["epuisee", "crampes"], message: "C'est ton Hiver intérieur. Ton corps brûle beaucoup d'énergie pour le nettoyage utérin. Augmente ton apport en fer (lentilles, viande rouge) et autorise-toi une sieste de 20 min." },
  { symptoms: ["irritable", "ballonnements"], message: "Ta progestérone chute. Ce duo est classique en phase pré-menstruelle. Magnésium et réduction du sucre sont tes meilleurs alliés aujourd'hui." },
  { symptoms: ["migraine", "epuisee"], message: "Déshydratation + fatigue = signal d'alarme. Bois 500 ml d'eau avec une pincée de sel de mer, et repose-toi dans un endroit sombre 20 min." },
  { symptoms: ["triste", "epuisee"], message: "La mélancolie et la fatigue ensemble indiquent souvent une carence en sérotonine. Soleil, mouvement doux et aliments riches en tryptophane (banane, œufs, noix)." },
  { symptoms: ["insomnie", "irritable"], message: "Le manque de sommeil amplifie l'irritabilité hormonale × 3. Une seule priorité ce soir : dormir. Tout le reste peut attendre." },
  { symptoms: ["brain_fog", "epuisee"], message: "Brouillard + fatigue = pic de cortisol probable. Une seule tâche à la fois. Marche 20 min dehors pour réoxygéner le cortex préfrontal." },
  { symptoms: ["anxiete", "insomnie"], message: "Le duo anxiété-insomnie est déclenché par le cortisol nocturne. Cohérence cardiaque 5 min avant le coucher. Magnésium glycinate 400 mg le soir." },
  { symptoms: ["sucre", "irritable"], message: "Pulsions sucrées + irritabilité = déficit en sérotonine. Glucides complexes + chocolat noir 85% + 10 min de marche pour relancer la dopamine." },
  { symptoms: ["bouffees_chaleur", "insomnie"], message: "La combinaison bouffées-insomnie est le schéma ménopausique classique. Cohérence cardiaque soir, chambre fraîche, et limiter café après 14h change beaucoup." },
  { symptoms: ["rumination", "anxiete"], message: "Pensées en boucle + anxiété = système nerveux en surrégime. Nomme l'émotion à voix haute, puis cohérence cardiaque 5 min. Tu reprends le contrôle." },
  { symptoms: ["colere", "pleurs"], message: "Colère + larmes = tempête hormonale lutéale. C'est réel et physiologique. Laisse passer sans te juger — ce n'est pas toi, ce sont tes hormones qui descendent." },
  { symptoms: ["brain_fog", "manque_motivation"], message: "Le duo brouillard-démotivation = chute combinée de dopamine et d'œstrogènes. Une seule micro-tâche de 5 min pour démarrer. Le mouvement crée la motivation." },
  { symptoms: ["energie_max", "confiance"], message: "Tu es dans ta fenêtre de superpower ! Œstrogènes au pic = force, confiance, charisme. Fonce sur tes objectifs les plus ambitieux — tu as toutes les cartes en main." },
  { symptoms: ["belle_peau", "energie_max"], message: "Peau + énergie au top = phase ovulatoire confirmée ! Profites-en pour les interactions sociales importantes et les défis physiques. Tu es littéralement au sommet." },
  { symptoms: ["libido_haute", "energie_max"], message: "Libido + énergie = pic de testostérone et d'œstrogènes combinés. C'est ta fenêtre de vitalité maximale. Sport intense, projets créatifs, connexion intime." },
  { symptoms: ["triste", "manque_motivation"], message: "Tristesse + manque de motivation en phase lutéale = carence en sérotonine. Tryptophane (banane, dinde, œufs), soleil 20 min, mouvement léger. Ça va se lever." },
  { symptoms: ["stress", "surcharge_mentale"], message: "Stress + surcharge = cortisol en surrégime. Stop. Respire : 5 sec inspire, 5 sec expire, répète 6 fois. Puis une seule priorité pour aujourd'hui, rien de plus." },
  { symptoms: ["insomnie", "brain_fog"], message: "Sans sommeil réparateur, le cerveau ne consolide pas. Ce soir : écrans off à 21h, tisane, respiration 4-7-8. Demain sera plus clair après une vraie nuit." },
  { symptoms: ["crampes", "douleurs_dos"], message: "Crampes + dos = inflammation pelvienne intense. Bouillotte en simultané sur ventre ET bas du dos. Ibuprofène si autorisé. Yoga restauratif uniquement." },
  { symptoms: ["retention_eau", "ballonnements"], message: "Rétention + ballonnements = progestérone qui retient tout. Pissenlit en tisane (diurétique doux), réduis sel et gluten aujourd'hui. Ça se débloque à l'arrivée des règles." },
  { symptoms: ["zen_pos", "creative"], message: "Sérénité + créativité = état de flow optimal. C'est rare et précieux — bloque 2h sans interruption sur ton projet créatif. Le résultat sera exceptionnel." },
  { symptoms: ["motivee_pos", "focus_laser"], message: "Motivation + focus = combo gagnant. Technique Pomodoro : 4 sessions de 25 min. Tu peux accomplir en une journée ce qui prend normalement une semaine." },
];

function getActiveReactions(symptoms: string[], intensities: Record<string, number> = {}): SymptomAction[] {
  if (!symptoms.length) return [];
  return SYMPTOM_REACTIONS.filter((rule) => {
    const matches = rule.symptomIds.some((id) => symptoms.includes(id));
    if (!matches) return false;
    if (rule.minIntensity) {
      const maxIntensity = Math.max(...rule.symptomIds.map((id) => intensities[id] ?? 0));
      return maxIntensity >= rule.minIntensity;
    }
    return true;
  }).slice(0, 5); // max 5 actions
}

function getCoachMessage(symptoms: string[], phase: string): string | null {
  if (!symptoms.length) return null;
  for (const msg of COACH_MESSAGES) {
    if (msg.symptoms.filter((s) => symptoms.includes(s)).length >= 2) return msg.message;
  }
  if (phase === "winter" && symptoms.includes("crampes")) return "Ton corps travaille fort. Honore ce besoin de repos — c'est de l'intelligence biologique, pas de la faiblesse.";
  if (phase === "summer" && (symptoms.includes("magnetisme") || symptoms.includes("energie_max"))) return "C'est ton pic d'énergie ! Toutes les conditions sont réunies pour briller aujourd'hui. Tu rayonnes.";
  if (symptoms.includes("brain_fog")) return "Quand le brouillard arrive, c'est ton système nerveux qui réclame du repos et de l'oxygène. Une tâche à la fois. Une marche dehors. Rien de plus.";
  if (symptoms.includes("confiance") || symptoms.includes("motivee_pos")) return "Tu es en pleine puissance aujourd'hui. Utilise cette énergie sur ce qui compte vraiment — les opportunités saisies dans cet état portent leurs fruits.";
  if (symptoms.includes("triste") || symptoms.includes("detachement")) return "Ce que tu ressens est réel et légitime. Ce n'est pas toi — ce sont tes hormones qui descendent. Sois douce avec toi-même aujourd'hui.";
  return null;
}

const PILL_SCIENCE_DB: Record<string, { title: string; mechanism: string; actions: string[]; source: string }> = {
  fatigue: {
    title: "Carence en Vitamines B",
    mechanism: "La pilule accélère le métabolisme hépatique, ce qui épuise tes réserves de Vitamines B6, B12 et de Folates.",
    actions: [
      "Vitamines B : Priorité aux œufs, levure de bière ou un complexe B-Complex.",
      "Magnésium : La pilule favorise l'excrétion urinaire du magnésium, d'où la fatigue.",
      "Sommeil : Vise 8h, car ton foie travaille plus pour éliminer les hormones de synthèse."
    ],
    source: "European Journal of Clinical Nutrition"
  },
  libido_basse: {
    title: "Baisse de la Testostérone Libre",
    mechanism: "La pilule augmente la SHBG (une protéine), qui 'capture' ta testostérone naturelle, impactant le désir.",
    actions: [
      "Zinc : Soutient la synthèse des hormones stéroïdiennes résiduelles.",
      "Aliments Aphrodisiaques : Le cacao noir (85%) stimule la dopamine pour compenser.",
      "Connexion : Focus sur l'intimité émotionnelle pour stimuler l'ocytocine."
    ],
    source: "Journal of Sexual Medicine"
  },
  humeur_instable: {
    title: "Impact Neuro-Hormonal",
    mechanism: "La modification des niveaux de progestatifs peut influencer les récepteurs GABA de ton cerveau.",
    actions: [
      "Oméga-3 : Essentiels pour la fluidité des membranes neuronales sous pilule.",
      "Tyrosine : Précurseur de dopamine (amandes, bananes) pour contrer l'apathie.",
      "Lumière : 20 min de soleil pour réguler ta sérotonine naturelle."
    ],
    source: "Frontiers in Neuroscience"
  },
  retention_eau: {
    title: "Équilibre Sodium/Potassium",
    mechanism: "L'éthinylestradiol peut stimuler le système rénine-angiotensine, provoquant la rétention d'eau.",
    actions: [
      "Potassium : Banane, avocat et épinards pour chasser l'excès d'eau.",
      "Infusion de Pissenlit : Aide les reins à drainer les fluides stockés.",
      "Activité : La marche rapide active la pompe veineuse pour drainer les tissus."
    ],
    source: "Journal of Endocrinology"
  }
};

export function TodayView({ state, onSaisie }: TodayViewProps) {
  const [learnMore, setLearnMore] = useState<CardType | null>(null);
  const [logFeedback, setLogFeedback] = useState<{ eatFeedback?: string | null; moveFeedback?: string | null; doFeedback?: string | null }>({});
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<{
    morningMessage: string | null;
    sleepAdvice: string | null;
    moveSuggestion: string | null;
    predictedSymptoms: string[];
    adaptedCycleLength: number | null;
    dataPoints: number;
  } | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
const isContraception = state.mode === 'hormonal' || state.birthControl === 'pill' || state.birthControl === 'iud_hormonal' || state.birthControl === 'patch';
const bcInfo = BC_SPECIFIC_COACHING[state.birthControl as string];
const isPill = state.birthControl === 'pill';
  // ── Préparation des données du jour (Intelligence de l'app) ──
  const todayDateStr = new Date().toISOString().split("T")[0];
  const todayEntry = state.entries.find((e) => e.date === todayDateStr);
  const activeSymptoms: string[] = todayEntry?.symptoms ?? [];
  const todayIntensities: Record<string, number> = (todayEntry as any)?.symptomIntensities ?? {};
  const today = new Date();
  const dayStr = today.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const isOvulationBlocked = state.birthControl === 'pill';
 // ── LOGIQUE DE RECALCUL INTELLIGENTE ──
const isBleedingNow = activeSymptoms.some(s => 
  s.includes("regles") || s.includes("sang") || s.includes("spotting")
);

// ✅ Si on ne saigne plus (isBleedingNow est faux) ET que l'app nous mettait en "winter", 
// on passe automatiquement au Printemps (spring) pour refléter la réalité.
const effectivePhase = isBleedingNow 
  ? "winter" 
  : (state.phase === "winter" ? "spring" : state.phase);
  
const hasPriorityAnalysis = activeSymptoms.some(id => EXPERT_DB[id]);
const showExpertBanner = !hasPriorityAnalysis;
  const phaseTips = DAILY_EXPERT_TIPS[effectivePhase] || [];
  const dailyExpertTip = phaseTips.find(t => t.startsWith(`J${state.currentDay} :`)) 
  || phaseTips[0] 
  || "Écoute ton corps aujourd'hui.";
  const info = PHASE_INFO[effectivePhase];
  const cards = COACH_CARDS[effectivePhase];
  // Reactions and personalised tips are based on TODAY's symptoms only
  const reactions = getActiveReactions(activeSymptoms, todayIntensities);
  const coachMessage = getCoachMessage(activeSymptoms, state.phase);
  const overriddenCards = new Set(reactions.map((r) => r.category));
  const periodDuration = state.periodDuration ?? 5;
  const rawTip = getDailyTip(state.phase, state.currentDay, periodDuration);
  const personalizedTip = getSymptomReactiveTip(activeSymptoms, rawTip);

  const caloricInfo = PHASE_CALORIC_INFO[state.phase];

  const hasAnyLog = !!(todayEntry?.eatLog || todayEntry?.moveLog || todayEntry?.doLog);

  const fetchLogFeedback = useCallback(async () => {
    if (!todayEntry || !hasAnyLog) return;
    setFeedbackLoading(true);
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/log-feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "apikey": SUPABASE_KEY,
        },
        body: JSON.stringify({
          eatLog: todayEntry.eatLog,
          moveLog: todayEntry.moveLog,
          doLog: todayEntry.doLog,
          phase: state.phase,
          symptoms: activeSymptoms,
          sleepHours: todayEntry.sleepHours,
          weightKg: todayEntry.weightKg,
          temperature: todayEntry.temperature,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLogFeedback(data);
      }
    } catch {
      // silent fail
    } finally {
      setFeedbackLoading(false);
    }
  }, [todayEntry?.eatLog, todayEntry?.moveLog, todayEntry?.doLog, state.phase]);

  useEffect(() => {
    if (hasAnyLog) fetchLogFeedback();
    else setLogFeedback({});
  }, [hasAnyLog, fetchLogFeedback]);

  // ── Fetch AI daily insights ───────────────────────────────────────
  const fetchDailyInsights = useCallback(async () => {
    const deviceId = localStorage.getItem("lunaya_device_id");
    if (!deviceId) return;
    setInsightsLoading(true);
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/daily-insights`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "apikey": SUPABASE_KEY,
        },
        body: JSON.stringify({
          deviceId,
          phase: state.phase,
          currentDay: state.currentDay,
          cycleLength: state.cycleLength,
          sleepHours: todayEntry?.sleepHours,
          weightKg: todayEntry?.weightKg,
          temperature: todayEntry?.temperature,
          symptoms: activeSymptoms,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiInsights(data);
      }
    } catch {
      // silent fail
    } finally {
      setInsightsLoading(false);
    }
  }, [state.phase, state.currentDay, state.cycleLength, todayEntry?.sleepHours, todayEntry?.weightKg, todayEntry?.temperature]);

  useEffect(() => {
    fetchDailyInsights();
  }, [state.currentDay, state.phase]);

  return (
    <div className="flex flex-col gap-5 pb-28">

{/* ── Hero Phase Card ──────────────────────────────────── */}
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }} 
      animate={{ opacity: 1, scale: 1 }} 
      transition={{ duration: 0.5 }}
      className={`relative rounded-3xl overflow-hidden p-6 ${info.gradient} text-primary-foreground`}
    >
      <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full opacity-20 bg-primary-foreground" />
      <div className="absolute -right-4 -bottom-6 w-32 h-32 rounded-full opacity-10 bg-primary-foreground" />
      
      <div className="relative z-10">
        <p className="text-xs font-medium uppercase tracking-widest opacity-80 mb-1">{dayStr}</p>
        
        <div className="flex items-end gap-3 mb-3">
          <motion.span 
            animate={{ y: [0, -4, 0] }} 
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} 
            className="text-4xl"
          >
            {isContraception ? HORMONAL_LABELS[effectivePhase]?.emoji : info.emoji}
          </motion.span>
          
          <div>
            <h2 className="font-display text-3xl font-semibold leading-tight">
              {isContraception ? HORMONAL_LABELS[effectivePhase]?.label : info.label}
            </h2>
            <p className="text-sm opacity-85 font-medium">
              {isContraception ? "Protection Active" : info.season} · Jour {state.currentDay}
            </p>
          </div>
        </div>

        <p className="text-sm opacity-90 leading-relaxed mb-5">
          {isContraception ? HORMONAL_LABELS[effectivePhase]?.desc : info.description}
        </p>

        <button 
          onClick={onSaisie} 
          className="inline-flex items-center gap-2 bg-primary-foreground/20 hover:bg-primary-foreground/30 backdrop-blur-sm border border-primary-foreground/30 rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95"
        >
          <span>＋</span> Saisir mes données
        </button>
      </div>
    </motion.div>
      
    {/* ── WIDGET EXPERT CONTRACEPTION ── */}
{isContraception && bcInfo && (
  <motion.div 
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-gradient-to-br from-blue-50 to-white rounded-3xl p-5 border border-blue-100 shadow-sm"
  >
    <div className="flex items-center gap-4 mb-3">
      <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl border border-blue-50">
        {bcInfo.icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">
          Coaching Spécifique · {bcInfo.title}
        </p>
        <h3 className="font-bold text-sm text-slate-800">{bcInfo.focus}</h3>
      </div>
    </div>
    
    <div className="space-y-3">
      <p className="text-xs text-slate-600 leading-relaxed italic">
        "{bcInfo.advice}"
      </p>
      <div className="bg-blue-500/5 rounded-xl p-3 border border-blue-500/10">
        <p className="text-[11px] font-bold text-blue-700">
          💡 {bcInfo.nutrient}
        </p>
      </div>
    </div>
  </motion.div>
)}

{/* ── SECTION SPÉCIFIQUE POST-PARTUM ── */}
{state.mode === 'postpartum' && (
  <motion.div 
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-rose-50 border border-rose-100 rounded-3xl p-5 mb-4 shadow-sm"
  >
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl">
          🤱
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Suivi Allaitement</p>
          <h3 className="font-bold text-sm text-rose-900">Besoins Nutritionnels</h3>
        </div>
      </div>
      {/* Badge indicateur d'ajustement automatique */}
      <span className="bg-rose-500 text-white text-[9px] font-bold px-2 py-1 rounded-full animate-pulse">
        ACTIF
      </span>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white/60 p-3 rounded-2xl border border-rose-100">
        <p className="text-[10px] text-rose-600 font-bold uppercase mb-1">Énergie</p>
        <p className="text-sm font-black text-rose-900">+ 500 kcal/j</p>
      </div>
      <div className="bg-white/60 p-3 rounded-2xl border border-rose-100">
        <p className="text-[10px] text-rose-600 font-bold uppercase mb-1">Hydratation</p>
        <p className="text-sm font-black text-rose-900">+ 1 Litre/j</p>
      </div>
    </div>
    
    <p className="mt-3 text-[11px] text-rose-700 leading-relaxed italic">
      "Ton corps puise dans ses réserves pour le bébé. Ces apports sont essentiels pour ta propre récupération et la qualité du lait."
    </p>
  </motion.div>
)}
      
            {/* ✅ Ajout de l'assiette visuelle dynamique */}
<VisualPhasePlate state={state} />
      
      {/* ── AI Insights Personnalisés ────────────────────────── */}
      <AnimatePresence>
        {(todayEntry?.sleepHours !== undefined || aiInsights?.morningMessage || insightsLoading) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="bg-card rounded-3xl p-4 shadow-card border border-border/40 space-y-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full gradient-hero flex items-center justify-center flex-shrink-0">
                <span className="text-xs">🌙</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Insights du jour
                {aiInsights?.dataPoints ? ` · ${aiInsights.dataPoints}j mémorisés` : ""}
              </p>
            </div>

            {/* Sleep quality indicator */}
            {todayEntry?.sleepHours !== undefined && (
              <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ${
                todayEntry.sleepHours < 6
                  ? "bg-phase-winter/12 border border-phase-winter/40"
                  : todayEntry.sleepHours < 7
                  ? "bg-phase-summer/12 border border-phase-summer/40"
                  : "bg-phase-spring/12 border border-phase-spring/40"
              }`}>
                <span className="text-lg flex-shrink-0">
                  {todayEntry.sleepHours < 6 ? "😔" : todayEntry.sleepHours < 7 ? "😴" : "✨"}
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Sommeil · {todayEntry.sleepHours}h
                  </p>
                  <p className="text-[11px] text-foreground leading-tight">
                    {todayEntry.sleepHours < 6
                      ? "Nuit très courte — récupération prioritaire"
                      : todayEntry.sleepHours < 7
                      ? "Sommeil léger — écoute ton énergie aujourd'hui"
                      : "Bonne nuit ! Ton corps est rechargé 💚"}
                  </p>
                </div>
              </div>
            )}

            {/* Weight indicator */}
            {todayEntry?.weightKg !== undefined && (
              <div className="flex items-center gap-2.5 bg-muted/40 rounded-xl px-3 py-2 border border-border/30">
                <span className="text-lg flex-shrink-0">⚖️</span>
                <p className="text-[11px] text-foreground">
                  <span className="font-semibold">{todayEntry.weightKg} kg</span>
                  <span className="text-muted-foreground"> — poids enregistré</span>
                </p>
              </div>
            )}

            {/* Temperature */}
            {todayEntry?.temperature !== undefined && (
              <div className="flex items-center gap-2.5 bg-muted/40 rounded-xl px-3 py-2 border border-border/30">
                <span className="text-lg flex-shrink-0">🌡️</span>
                <p className="text-[11px] text-foreground">
                  <span className="font-semibold">{todayEntry.temperature}°C</span>
                  <span className="text-muted-foreground"> — température basale</span>
                </p>
              </div>
            )}

            {/* AI morning message */}
            {insightsLoading && !aiInsights?.morningMessage && (
              <div className="flex items-center gap-2 py-1">
                <Loader2 size={12} className="animate-spin text-primary" />
                <span className="text-[11px] text-muted-foreground">Analyse personnalisée en cours…</span>
              </div>
            )}
            {aiInsights?.morningMessage && (
              <p className="text-sm text-foreground leading-relaxed italic border-l-2 border-primary/40 pl-3">
                "{aiInsights.morningMessage}"
              </p>
            )}

            {/* Predicted symptoms from history */}
            {aiInsights?.predictedSymptoms && aiInsights.predictedSymptoms.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Symptômes probables aujourd'hui
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {aiInsights.predictedSymptoms.map((s) => (
                    <span
                      key={s}
                      className="text-[11px] bg-secondary/70 text-foreground px-2.5 py-1 rounded-full font-medium"
                    >
                      {s.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Sleep-specific sport advice */}
            {aiInsights?.sleepAdvice && (
              <div className="flex gap-2 items-start bg-terracotta-light rounded-xl px-3 py-2.5 border-l-4 border-terracotta">
                <span className="text-base flex-shrink-0">💤</span>
                <p className="text-xs text-foreground leading-relaxed">{aiInsights.sleepAdvice}</p>
              </div>
            )}

            {/* Adaptive cycle length badge */}
            {aiInsights?.adaptedCycleLength && aiInsights.adaptedCycleLength !== state.cycleLength && (
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/50 rounded-xl px-3 py-2">
                <span>📈</span>
                <span>
                  Cycle moyen calculé :{" "}
                  <strong className="text-foreground">{aiInsights.adaptedCycleLength}j</strong>{" "}
                  sur tes cycles précédents
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bloc Fertilité OU Bilan Expert (Selon le mode) ── */}
      {state.mode !== "menopause" ? (
        <FertilityCard 
          phase={state.phase} 
          currentDay={state.currentDay} 
          cycleLength={state.cycleLength} 
        />
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary/5 to-white rounded-[2.5rem] p-8 border-2 border-primary/10 shadow-sm mb-6"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Outil Diagnostic</span>
              <h3 className="font-display text-2xl font-bold text-foreground">Mon Bilan Expert</h3>
            </div>
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-primary/10">
              <span className="text-2xl">📋</span>
            </div>
          </div>
          <button 
            className="w-full bg-primary text-white rounded-2xl py-4 font-bold text-sm shadow-lg active:scale-95 transition-transform"
            onClick={() => alert("Génération du rapport PDF...")}
          >
            📥 Télécharger mon Bilan PDF
          </button>
        </motion.div>
      )}

      {/* ── Caloric Context Banner ────────────────────────────── */}

      {/* ── Caloric Context Banner ────────────────────────────── */}
      {(
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl px-4 py-3 shadow-card border border-border/40 flex items-center gap-3">
          <span className="text-xl flex-shrink-0">{caloricInfo.emoji}</span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Besoins nutritionnels · {info.label}
              {caloricInfo.delta !== "Besoins normaux" && (
                <span className="ml-1.5 bg-terracotta/15 text-terracotta px-2 py-0.5 rounded-full normal-case text-[10px]">{caloricInfo.delta}</span>
              )}
            </p>
            <p className="text-xs text-foreground mt-0.5">{caloricInfo.focus}</p>
          </div>
        </motion.div>
      )}

      {/* ── Immediate Reactions (top priority) ─────────────── */}
      <AnimatePresence>
        {reactions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.22 }} className="flex flex-col gap-2">
            <h3 className="font-display text-sm font-semibold text-foreground px-1 flex items-center gap-2">
              <span className="text-base">⚡</span> Conseils personnalisés — {reactions.length} action{reactions.length > 1 ? "s" : ""}
            </h3>
            {reactions.map((rx, i) => {
              const cfg = COACH_CARD_CONFIG[rx.category];
              return (
                <motion.div key={`${rx.icon}-${i}`}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.24 + i * 0.07 }}
                  className={`flex items-start gap-3 rounded-2xl p-4 ${cfg.accentBg} border-l-4`}
                  style={{ borderLeftColor: rx.category === "EAT" ? "hsl(var(--accent))" : rx.category === "MOVE" ? "hsl(var(--terracotta))" : "hsl(var(--secondary))" }}
                >
                  <span className="text-2xl flex-shrink-0">{rx.icon}</span>
                  <div className="flex-1">
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${cfg.accentText}`}>{rx.category} · {rx.title}</p>
                    <p className="text-xs text-foreground leading-relaxed">{rx.message}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Personalized Day Tip ────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.27 }}
        className="bg-card rounded-3xl p-4 shadow-card border border-border/40">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full gradient-hero flex items-center justify-center flex-shrink-0">
            <span className="text-xs">🌙</span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Conseil unique · Jour {state.currentDay}</p>
          {activeSymptoms.length > 0 && (
            <span className="text-[9px] bg-terracotta/15 text-terracotta font-bold px-1.5 py-0.5 rounded-full">Adapté à tes symptômes</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {[
            { type: "EAT", icon: "🍽️", text: personalizedTip.eat, bg: "bg-sage-light" },
            { type: "MOVE", icon: "🏃‍♀️", text: personalizedTip.move, bg: "bg-terracotta-light" },
            { type: "DO", icon: "📓", text: personalizedTip.do, bg: "bg-rose-mist" },
          ].map((t) => (
            <div key={t.type} className={`${t.bg} rounded-xl px-3 py-2.5 flex gap-2.5 items-start`}>
              <span className="text-base flex-shrink-0">{t.icon}</span>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">{t.type}</p>
                <p className="text-xs text-foreground leading-relaxed">{t.text}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── AI Coach "Conseil de Calie" ──────────────────────── */}
      <AnimatePresence>
        {coachMessage && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-card rounded-3xl p-4 shadow-card border border-border/40">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full gradient-hero flex items-center justify-center flex-shrink-0">
                <span className="text-sm">🌙</span>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Le conseil de Calie</p>
            </div>
            <p className="text-sm text-foreground leading-relaxed italic">"{coachMessage}"</p>
          </motion.div>
        )}
      </AnimatePresence>
      
{/* ── BANNIÈRE CONSEIL EXPERT (SEULEMENT SI PAS DE SYMPTÔME PRIORITAIRE) ── */}
{showExpertBanner && (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }} 
    animate={{ opacity: 1, scale: 1 }}
    className="mb-6 bg-gradient-to-br from-orange-50 to-white rounded-3xl p-5 border border-orange-100/50 shadow-sm flex gap-4"
  >
    <div className="bg-white w-12 h-12 rounded-2xl shadow-sm flex items-center justify-center flex-shrink-0 border border-orange-100">
      <span className="text-2xl">🔬</span>
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[9px] font-black uppercase tracking-tighter text-orange-600 bg-orange-100 px-2 py-0.5 rounded-md">
          Focus Scientifique · J{state.currentDay}
        </span>
      </div>
      <p className="text-xs font-bold text-gray-800 leading-relaxed">
        {dailyExpertTip.includes(':') ? dailyExpertTip.split(':').slice(1).join(':').trim() : dailyExpertTip}
      </p>
    </div>
  </motion.div>
)}
      
{/* ── ANALYSE SCIENTIFIQUE (DYNAMIQUE PILULE / NATUREL) ── */}
      {activeSymptoms.length > 0 && (
        <div className="space-y-3 mb-8 px-1">
          {activeSymptoms.map(id => {
            // Détection du mode pour choisir la bonne base de données
            const isPill = state.birthControl === 'pill';
            const advice = isPill ? PILL_SCIENCE_DB[id] : EXPERT_DB[id];
            
            if (!advice) return null;
            return (
              <motion.div 
                key={id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`border-2 rounded-[2.5rem] p-6 shadow-sm relative overflow-hidden ${
                  isPill ? 'bg-blue-50/30 border-blue-100' : 'bg-white border-primary/10'
                }`}
              >
                {/* Badge de certification adaptatif */}
                <div className={`absolute top-4 right-6 flex items-center gap-1 px-2 py-1 rounded-full border ${
                  isPill ? 'bg-blue-100 border-blue-200' : 'bg-green-50 border-green-100'
                }`}>
                   <div className={`w-1 h-1 rounded-full animate-pulse ${isPill ? 'bg-blue-500' : 'bg-green-500'}`} />
                   <span className={`text-[8px] font-extrabold uppercase tracking-tighter ${
                     isPill ? 'text-blue-700' : 'text-green-700'
                   }`}>
                     {isPill ? "Analyse Contraception" : "Certifié ANSES"}
                   </span>
                </div>

                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xl shadow-inner ${
                    isPill ? 'bg-blue-100' : 'bg-primary/10'
                  }`}>
                    {isPill ? "💊" : "🔬"}
                  </div>
                  <h3 className={`font-bold text-[14px] uppercase tracking-tight leading-none ${
                    isPill ? 'text-blue-900' : 'text-primary'
                  }`}>
                    {advice.title}
                  </h3>
                </div>

                <p className={`text-[11px] italic mb-4 leading-relaxed p-3 rounded-2xl border ${
                  isPill ? 'text-blue-800/70 bg-blue-100/20 border-blue-100' : 'text-muted-foreground bg-muted/30 border-border/40'
                }`}>
                  "{advice.mechanism}"
                </p>

                <div className="space-y-2.5 mb-4">
                  {advice.actions.map((action, i) => (
                    <div key={i} className="text-[12.5px] font-semibold flex items-start gap-3 text-foreground/90">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] shrink-0 mt-0.5 ${
                        isPill ? 'bg-blue-500/10 border-blue-200 text-blue-600' : 'bg-primary/5 border-primary/20 text-primary'
                      }`}>
                        {i + 1}
                      </div>
                      {action}
                    </div>
                  ))}
                </div>

                <div className={`pt-3 border-t border-dashed ${isPill ? 'border-blue-200' : 'border-muted-foreground/20'}`}>
                   <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                     📚 Source : <span className={isPill ? 'text-blue-600' : 'text-primary/70'}>{advice.source}</span>
                   </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      
      {/* ── EAT · MOVE · DO ──────────────────────────────────── */}
      <div>
        <motion.h3 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="font-display text-lg font-semibold text-foreground mb-3 px-1">
          Vos conseils du jour
        </motion.h3>
        <div className="flex flex-col gap-3">
          {state.mode === "menopause" ? (
            <>
              {/* ── 1. RÉACTIONS AUX SYMPTÔMES (Ménopause) ── */}
              {activeSymptoms.map(id => {
                const trigger = MENOPAUSE_SYMPTOM_TRIGGERS[id];
                if (!trigger) return null;
                return (
                  <motion.div key={id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                    className="rounded-2xl border-2 border-orange-200 bg-orange-50/50 p-4 shadow-sm mb-3">
                    <div className="flex gap-3">
                      <span className="text-2xl">{trigger.icon}</span>
                      <div>
                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Action Immédiate : {trigger.title}</p>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">{trigger.message}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* ── 2. PROGRAMME DE PRÉVENTION (Rotation quotidienne) ── */}
              {(() => {
                const daily = MENOPAUSE_DAILY_PROGRAM[new Date().getDate() % 7];
                return (
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    className="rounded-[2.5rem] border border-slate-100 bg-white p-5 shadow-card mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl shadow-inner">{daily.icon}</div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{daily.type} · {daily.title}</p>
                    </div>
                    <p className="text-sm font-bold text-slate-800 mb-1">{daily.advice}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{daily.detail}</p>
                  </motion.div>
                );
              })()}
            </>
          ) : (
          cards.map((card, i) => {
            const cfg = COACH_CARD_CONFIG[card.type];
            const hasOverride = overriddenCards.has(card.type as CardType);
            const logEntry = card.type === "EAT" ? todayEntry?.eatLog : card.type === "MOVE" ? todayEntry?.moveLog : todayEntry?.doLog;
            return (
              <motion.div key={card.type} custom={i} variants={cardVariants} initial="hidden" animate="visible"
                className={`rounded-2xl border shadow-card overflow-hidden ${cfg.accentBorder} ${hasOverride ? "opacity-60" : ""}`}>
                {hasOverride && (
                  <div className="px-4 py-1.5 bg-muted border-b border-border/40 flex items-center gap-1.5">
                    <span className="text-[9px]">⚡</span>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Action immédiate active ci-dessus</p>
                  </div>
                )}
                <div className={`${cfg.accentBg} px-4 pt-3 pb-2 border-b ${cfg.accentBorder}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{card.icon}</span>
                    <div>
                      <p className={`text-[10px] font-bold tracking-widest uppercase ${cfg.accentText}`}>{card.type}</p>
                      <p className="font-display text-sm font-semibold text-foreground leading-tight">{cfg.title}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-card px-4 py-3">
                  <p className="font-semibold text-sm text-foreground mb-1">{card.advice}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">{card.detail}</p>

                  {/* ── Mon commentaire du jour ── */}
                  {logEntry && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mb-3 rounded-xl px-3 py-2.5 border-l-4 ${cfg.accentBg} flex gap-2.5 items-start`}
                      style={{ borderLeftColor: card.type === "EAT" ? "hsl(var(--accent))" : card.type === "MOVE" ? "hsl(var(--terracotta))" : "hsl(var(--secondary))" }}
                    >
                      <span className="text-base flex-shrink-0">✍️</span>
                      <div className="flex-1">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Mon commentaire</p>
                        <p className="text-xs text-foreground leading-relaxed">{logEntry}</p>

                        {/* ── Feedback IA ── */}
                        {(() => {
                          const fb = card.type === "EAT" ? logFeedback.eatFeedback : card.type === "MOVE" ? logFeedback.moveFeedback : logFeedback.doFeedback;
                          if (feedbackLoading) return (
                            <div className="mt-2 flex items-center gap-1.5">
                              <Loader2 size={10} className="animate-spin text-primary" />
                              <span className="text-[10px] text-primary">Analyse en cours…</span>
                            </div>
                          );
                          if (fb) return (
                            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                              className="mt-2.5 pt-2.5 border-t border-border/40 flex gap-1.5 items-start">
                              <Sparkles size={11} className="text-primary mt-0.5 flex-shrink-0" />
                              <p className="text-[11px] text-primary font-medium leading-relaxed">{fb}</p>
                            </motion.div>
                          );
                          return null;
                        })()}
                      </div>
                    </motion.div>
                  )}

                  <button onClick={() => setLearnMore(card.type as CardType)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:opacity-75 transition-opacity active:scale-95 bg-primary/8 px-3 py-1.5 rounded-xl">
                    🔬 Pourquoi ? <ChevronRight size={12} />
                  </button>
                </div>
</motion.div>
              );
            }) // <--- Ferme le map
          )} {/* <--- Ferme la condition ménopause */}
        </div>
      </div>
      
      {/* ── Cycle Progress Bar ───────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
        className="bg-card rounded-2xl p-4 shadow-card border border-border/40">
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Progression du cycle</p>
          <p className="text-xs font-semibold text-primary">{Math.round((state.currentDay / state.cycleLength) * 100)}%</p>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full gradient-hero" initial={{ width: 0 }}
            animate={{ width: `${(state.currentDay / state.cycleLength) * 100}%` }}
            transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }} />
        </div>
        <div className="flex justify-between mt-2">
          {(["winter", "spring", "summer", "autumn"] as const).map((p) => {
            const pi = PHASE_INFO[p];
            return (
              <span key={p} className={`text-[9px] font-medium ${state.phase === p ? pi.textColor : "text-muted-foreground"}`}>
                {pi.emoji} {pi.label}
              </span>
            );
          })}
        </div>
      </motion.div>

{/* ── Visualisation Hormonale Unique ── */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.3 }}
      >
        {/* On appelle le graphique directement. 
            Comme on a modifié le fichier HormonalChart.tsx, 
            il affiche déjà les bons titres et les bonnes courbes selon le mode. */}
        <HormonalChart state={state} />
      </motion.div>
      
      {/* ── Ask LUNAYA ────────────────────────────────────────── */}
      <LunayaAssistant
        phase={state.phase}
        symptoms={activeSymptoms}
context={isPill ? "contraception" : "cycle"}
        quickQuestions={
          state.mode === "pill" 
            ? [
                "Comment la pilule influence mon humeur ?",
                "Que faire si j'ai du spotting sous pilule ?",
                "Quels nutriments la pilule consomme-t-elle ?",
                "Pourquoi j'ai des maux de tête pendant la pause ?",
                "Comment stabiliser ma peau sous contraception ?",
              ]
            : [
                "Pourquoi je me sens fatiguée pendant mes règles ?",
                "Comment réduire les crampes menstruelles ?",
                "Que manger pendant l'ovulation ?",
                "Pourquoi mon humeur change selon les phases ?",
                "Comment améliorer mon sommeil en phase lutéale ?",
              ]
        }
      />

      {learnMore && <LearnMoreModal phase={state.phase} cardType={learnMore} onClose={() => setLearnMore(null)} />}
    </div>
  );
}
