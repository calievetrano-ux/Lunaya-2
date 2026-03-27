import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { CyclePhase } from "@/lib/cycleEngine";

type CardType = "EAT" | "MOVE" | "DO";

interface NutritionDetail {
  macros: string;      // e.g. "55% glucides complexes · 25% protéines · 20% lipides sains"
  micronutrients: string[];  // top 3 key micronutrients
  glycemicAdvice: string;
  caloricNote?: string;
}

interface LearnMoreContent {
  icon: string;
  headline: string;
  body: string;
  tip: string;
  science?: string;
  nutrition?: NutritionDetail;
}

// ── Nutrition precision per phase ─────────────────────────────────────
const PHASE_NUTRITION: Record<CyclePhase, NutritionDetail> = {
  winter: {
    macros: "50% glucides doux · 25% protéines · 25% lipides anti-inflammatoires",
    micronutrients: ["🩸 Fer héminique (lentilles + Vit C)", "🧲 Magnésium (chocolat noir, graines)", "🐟 Oméga-3 (sardines, graines de lin)"],
    glycemicAdvice: "Privilégie les IG bas (légumes vapeur, légumineuses). Évite les sucres rapides qui amplifient l'inflammation et les crampes.",
    caloricNote: "Besoins normaux — focus sur la densité nutritionnelle, pas la restriction.",
  },
  spring: {
    macros: "45% glucides complexes · 25% protéines maigres · 30% lipides sains",
    micronutrients: ["🌿 Indole-3-carbinol (brocoli, crucifères)", "🥑 Graisses saines (avocat, huile olive)", "🌰 Sélénium (2 noix du Brésil/j)"],
    glycemicAdvice: "Glycémie stable = montée d'œstrogènes optimale. Évite les pics insuliniques qui court-circuitent la production hormonale.",
    caloricNote: "Besoins normaux — ton métabolisme remonte progressivement.",
  },
  summer: {
    macros: "40% glucides légers · 30% protéines · 30% lipides (focus DHA)",
    micronutrients: ["🍓 Antioxydants (fruits rouges, grenade)", "💧 Hyaluronate naturel (hydratation ×1.5)", "🐟 DHA (saumon, sardines) pour la qualité folliculaire"],
    glycemicAdvice: "Repas légers et colorés. Ton foie métabolise intensément le pic d'estradiol — allège la charge digestive.",
    caloricNote: "Besoins normaux — priorité à la qualité et l'hydratation.",
  },
  autumn: {
    macros: "55% glucides complexes · 20% protéines · 25% lipides (focus Oméga-3)",
    micronutrients: ["🧲 Magnésium (noix, graines de courge) — réduit SPM de 40%", "🍌 Vitamine B6 (banane, poulet) → sérotonine", "🎃 Zinc (graines de courge, huîtres) pour la peau"],
    glycemicAdvice: "Les pulsions sucrées = déficit en sérotonine. Glucides complexes toutes les 3-4h pour éviter les creux glycémiques et l'irritabilité.",
    caloricNote: "+150 à +300 kcal — ton métabolisme de base s'accélère réellement. C'est physiologique.",
  },
};

const CONTENT: Record<CyclePhase, Record<CardType, LearnMoreContent>> = {
  winter: {
    EAT: {
      icon: "🫐",
      headline: "Pourquoi manger du fer à J1 ?",
      science: "🔬 Science · Pendant les règles, tu perds en moyenne 30 à 80 ml de sang, soit 15–40 mg de fer. Sans compensation, ton niveau de ferritine chute — entraînant fatigue, brouillard mental et palpitations dans les jours suivants.",
      body:
        "Les lentilles et épinards combinés à la Vitamine C (citron, poivron) triplent l'absorption du fer non-héminique. Les oméga-3 (sardines, lin, chia) bloquent la synthèse des prostaglandines inflammatoires — ces molécules responsables des crampes utérines. Le chocolat noir ≥ 85 % apporte simultanément du magnésium (anti-crampes) et de la sérotonine (anti-mélancolie).",
      tip: "Évite le café pendant les repas — les tanins réduisent l'absorption du fer de 60%. Attends 1h après le repas.",
    },
    MOVE: {
      icon: "🧘‍♀️",
      headline: "Pourquoi le repos est une stratégie de performance ?",
      science: "🔬 Science · Ton corps consomme 20% de glycogène en plus pendant les règles pour alimenter les contractions utérines. Ta température basale est à son minimum cyclique (37.0–37.2°C). Le cortisol matinal est légèrement élevé.",
      body:
        "Le Yin Yoga décongestionne le bassin via des postures tenues 3–5 min, améliorant la circulation pelvienne et réduisant les spasmes utérins. Une marche de 15 min suffit à libérer des bêta-endorphines — des analgésiques naturels. Les athlètes olympiques planifient leur décharge d'entraînement en phase menstruelle : c'est une stratégie de performance, pas de la faiblesse.",
      tip: "Même 10 min d'étirements doux au lit suffisent pour libérer des endorphines. Le mouvement = antidouleur naturel.",
    },
    DO: {
      icon: "📓",
      headline: "Le pouvoir de l'introspection cyclique",
      science: "🔬 Science · Quand œstrogènes et progestérone sont tous les deux bas, le cortex préfrontal traite l'information différemment — favorisant une pensée holiste et intuitive plutôt qu'analytique.",
      body:
        "Les recherches en neurosciences féminines (Dr. Brizendine, Université de Harvard) montrent que les femmes ont accès à une vision stratégique plus aiguë pendant cette phase. L'hémisphère droit est dominant, favorisant la créativité, l'empathie et la détection des patterns. C'est le moment idéal pour évaluer et décider des grandes orientations.",
      tip: "Pose-toi ces 3 questions : Qu'est-ce qui m'a drainé ce cycle ? Qu'est-ce qui m'a nourrie ? Qu'est-ce que je veux changer ?",
    },
  },
  spring: {
    EAT: {
      icon: "🥑",
      headline: "Soutenir la montée des œstrogènes",
      science: "🔬 Science · L'estradiol monte de 20 pg/mL (J5) à son pic de 200–400 pg/mL (J13). Cette vague booste ton humeur, ta mémoire et ton métabolisme — à condition d'apporter les précurseurs nutritionnels nécessaires.",
      body:
        "Les phytoestrogènes (graines de lin, soja, légumineuses) activent les récepteurs oestrogéniques de façon douce et régulatrice. L'indole-3-carbinol du brocoli aide le foie à métaboliser les œstrogènes en métabolites protecteurs plutôt qu'inflammatoires. Les graisses saines (avocat, huile d'olive) sont les précurseurs directs de toutes tes hormones stéroïdiennes.",
      tip: "1 càs de graines de lin moulues dans ton yaourt le matin — l'action phytoestrogénique la plus documentée.",
    },
    MOVE: {
      icon: "🚴‍♀️",
      headline: "Pourquoi surfer la vague ascendante ?",
      science: "🔬 Science · Les œstrogènes en hausse augmentent la disponibilité du glycogène musculaire, améliorent la récupération et booste la dopamine post-effort. Ton endurance aérobie remonte de 12 à 18% comparée à la phase hivérale.",
      body:
        "C'est la phase idéale pour augmenter progressivement l'intensité de l'entraînement. Le cardio modéré (vélo, pilates) active la voie dopaminergique qui rend l'exercice naturellement plus plaisant. La plasticité neuromusculaire est élevée — tu apprends de nouveaux mouvements plus facilement et les automatises plus vite.",
      tip: "C'est le bon moment pour commencer une nouvelle discipline sportive — ton cerveau assimile les nouvelles coordinations 30% plus vite.",
    },
    DO: {
      icon: "🌿",
      headline: "Pourquoi ton cerveau est en mode création ?",
      science: "🔬 Science · Les œstrogènes en hausse augmentent la densité des épines dendritiques dans l'hippocampe (+25% vers J12), boostant la mémoire de travail et la plasticité synaptique.",
      body:
        "Les neuroscientifiques comparent cette fenêtre à un 'deuxième printemps cognitif' mensuel. Ta capacité à former de nouvelles connexions neuronales est à son maximum. Ta fluidité verbale, ta créativité et ta compréhension spatiale sont toutes élevées simultanément — ce qui est rare. C'est littéralement le meilleur moment du mois pour apprendre, créer et initier.",
      tip: "Planifie tes réunions créatives, présentations importantes et nouveaux apprentissages en phase Printemps.",
    },
  },
  summer: {
    EAT: {
      icon: "🍓",
      headline: "Pourquoi les antioxydants à l'ovulation ?",
      science: "🔬 Science · L'ovulation génère un stress oxydatif local intense lors de la rupture folliculaire. Le pic d'estradiol (250–400 pg/mL) mobilise intensément le foie. Ta température basale monte de 0.2–0.5°C après l'ovulation.",
      body:
        "Les antioxydants (fruits rouges, tomates, grenade) neutralisent les radicaux libres produits lors de la rupture folliculaire, protégeant la qualité de l'ovule. Le DHA des poissons gras est directement intégré dans la membrane de l'ovule, améliorant sa fertilité. Alléger les repas libère de l'énergie pour le pic hormonal plutôt que la digestion.",
      tip: "Hydratation × 1.5 — la glaire cervicale fertile est composée à 95% d'eau. Boire = fertilité optimale.",
    },
    MOVE: {
      icon: "🏃‍♀️",
      headline: "Pourquoi viser tes records à l'ovulation ?",
      science: "🔬 Science · Les œstrogènes au pic boostent la synthèse de protéines musculaires, augmentent la tolérance à la douleur de 15–20% et optimisent la réactivité neuromusculaire. C'est ton superpower physique mensuel.",
      body:
        "Mais attention : les œstrogènes augmentent aussi la laxité des ligaments, surtout au genou (risque LCA × 2 autour de l'ovulation). Échauffe-toi 15 min minimum, sécurise tes appuis, évite les pivots brusques non contrôlés. Les sports collectifs, le HIIT et la compétition sont naturellement stimulants car la testostérone (pic ovulatoire) booste aussi la motivation et l'agressivité positive.",
      tip: "Profite de ce pic de force mais sécurise les appuis — l'échauffement articulaire n'est pas optionnel cette semaine.",
    },
    DO: {
      icon: "✨",
      headline: "Pourquoi rayonner et connecter en phase Été ?",
      science: "🔬 Science · Pendant l'ovulation, ta voix change mesurément (fréquences plus graves, perçues comme plus attractives). Ton ratio facial change légèrement. Ton intelligence émotionnelle — mesurée par les tests de lecture des émotions — est à son pic mensuel.",
      body:
        "Des études de l'Université de New Mexico ont montré que les femmes ovulant sont inconsciemment perçues comme plus attirantes et charismatiques. Elles négocient de meilleurs salaires cette semaine. Leur capacité à convaincre, connecter et influencer positivement est mesurée à son maximum. C'est de la biologie, pas de la chance.",
      tip: "Planifie : entretiens, présentations, dates importantes, négociations salariales en phase Été. Les résultats parlent d'eux-mêmes.",
    },
  },
  autumn: {
    EAT: {
      icon: "🎃",
      headline: "Pourquoi ces aliments en phase Automne ?",
      science: "🔬 Science · En phase lutéale, ton métabolisme de base augmente de 100 à 300 kcal/j. La progestérone dominante (10–20 ng/mL) mobilise le glycogène hépatique et abaisse la sérotonine — créant les fameuses pulsions sucrées.",
      body:
        "Les glucides complexes (patate douce, quinoa, avoine) stabilisent la glycémie sans pic insulinique, évitant le craving sucré. Le magnésium (noix, graines de courge, chocolat noir) réduit les symptômes prémenstruels de 40% selon 3 méta-analyses. La vitamine B6 (banane, poulet) est le cofacteur de la synthèse de sérotonine — réduisant mélancolie et irritabilité.",
      tip: "Les pulsions sucrées = signal de déficit en magnésium et sérotonine. Mange une poignée de noix AVANT de succomber au chocolat.",
    },
    MOVE: {
      icon: "🏊‍♀️",
      headline: "Pourquoi travailler avec le cycle en Automne ?",
      science: "🔬 Science · La progestérone élève légèrement la température basale (+0.3–0.5°C) et réduit les performances d'endurance de 8–12%. Le corps thermorégule moins efficacement. La récupération musculaire est plus lente.",
      body:
        "Les mouvements fluides (natation, yoga de force, pilates) sont naturellement plus efficaces sous l'influence de la progestérone car ils sollicitent les chaînes musculaires de façon harmonieuse. En phase Automne tardive (J22-J27), il est physiologiquement normal de voir ses performances baisser. Adapter l'intensité n'est pas un échec — c'est de la périodisation intelligente utilisée par toutes les athlètes professionnelles.",
      tip: "Écoute les baisses d'énergie à J22+ : réduire à 70% de l'intensité habituelle est une stratégie, pas une faiblesse.",
    },
    DO: {
      icon: "🍂",
      headline: "L'intuition comme super-pouvoir en Automne",
      science: "🔬 Science · La chute des œstrogènes active le cortex préfrontal différemment — tu perçois les problèmes plus clairement, les inefficacités te sautent aux yeux. Les filtres sociaux s'affinent.",
      body:
        "En phase Automne, les femmes rapportent une capacité accrue à détecter les mensonges, les dysfonctionnements et les situations non-alignées avec leurs valeurs. Ce n'est pas de la 'mauvaise humeur' hormonale — c'est un scan neurologique de haute précision. Les meilleures décisions stratégiques (démissions, ruptures, réorientations) sont souvent prises en phase Automne, car le voile social est levé.",
      tip: "Finalise et clôture. Les tâches incomplètes pèsent 3× plus en phase Automne — nettoie ta liste pour libérer ton énergie.",
    },
  },
};

const CARD_META: Record<CardType, { label: string; categoryIcon: string; colorClass: string; borderClass: string }> = {
  EAT: {
    label: "Nutrition",
    categoryIcon: "🍽️",
    colorClass: "bg-sage-light",
    borderClass: "border-sage",
  },
  MOVE: {
    label: "Mouvement",
    categoryIcon: "🏃‍♀️",
    borderClass: "border-terracotta",
    colorClass: "bg-terracotta-light",
  },
  DO: {
    label: "Mindset",
    categoryIcon: "📓",
    colorClass: "bg-rose-mist",
    borderClass: "border-secondary",
  },
};

interface LearnMoreModalProps {
  phase: CyclePhase;
  cardType: CardType;
  onClose: () => void;
}

export function LearnMoreModal({ phase, cardType, onClose }: LearnMoreModalProps) {
  const content = CONTENT[phase][cardType];
  const meta = CARD_META[cardType];

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
          transition={{ type: "spring", bounce: 0.13, duration: 0.5 }}
          className="w-full max-w-[480px] mx-auto bg-background rounded-t-3xl overflow-y-auto max-h-[90vh] pb-10"
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted" />
          </div>

          {/* Category banner */}
          <div className={`mx-5 mt-3 mb-4 rounded-2xl px-4 py-3 border ${meta.colorClass} ${meta.borderClass} flex items-center gap-3`}>
            <span className="text-2xl">{content.icon}</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {meta.categoryIcon} {meta.label}
              </p>
              <p className="font-display text-base font-semibold text-foreground leading-tight">
                {content.headline}
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-auto w-8 h-8 rounded-full bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              aria-label="Fermer"
            >
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 flex flex-col gap-4">
            {/* Science callout */}
            {content.science && (
              <div className="bg-muted/60 border border-border rounded-2xl px-4 py-3 flex gap-3">
                <span className="text-lg flex-shrink-0 mt-0.5">🔬</span>
                <p className="text-xs text-muted-foreground leading-relaxed">{content.science.replace("🔬 Science · ", "")}</p>
              </div>
            )}

            <p className="text-sm text-foreground leading-relaxed">{content.body}</p>

            {/* ── Nutrition Precision Module (EAT cards only) ── */}
            {cardType === "EAT" && (() => {
              const n = PHASE_NUTRITION[phase];
              return (
                <div className="flex flex-col gap-3">
                  {/* Macros */}
                  <div className="bg-sage-light border border-sage rounded-2xl px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-accent-foreground mb-1.5">📊 Répartition Macronutriments</p>
                    <p className="text-xs text-foreground leading-relaxed">{n.macros}</p>
                  </div>
                  {/* Micronutrients */}
                  <div className="bg-card border border-border/60 rounded-2xl px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">💊 Micronutriments Clés du Jour</p>
                    <div className="flex flex-col gap-1.5">
                      {n.micronutrients.map((m, i) => (
                        <p key={i} className="text-xs text-foreground leading-relaxed">{m}</p>
                      ))}
                    </div>
                  </div>
                  {/* Glycemic index */}
                  <div className="bg-terracotta-light border border-terracotta/40 rounded-2xl px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-terracotta-deep mb-1.5">📈 Indice Glycémique</p>
                    <p className="text-xs text-foreground leading-relaxed">{n.glycemicAdvice}</p>
                  </div>
                  {/* Caloric note */}
                  {n.caloricNote && (
                    <div className="bg-rose-mist border border-secondary rounded-2xl px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">🔥 Besoins Caloriques</p>
                      <p className="text-xs text-foreground leading-relaxed">{n.caloricNote}</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Tip card */}
            <div className="bg-card border border-border/60 rounded-2xl px-4 py-3 flex gap-3">
              <span className="text-xl flex-shrink-0 mt-0.5">💡</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Conseil pratique</p>
                <p className="text-sm text-foreground leading-relaxed">{content.tip}</p>
              </div>
            </div>

            <button onClick={onClose}
              className="mt-2 w-full py-3.5 rounded-2xl bg-card border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors active:scale-98">
              Fermer
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
