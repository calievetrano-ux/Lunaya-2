import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ArrowLeft, Sparkles, ShieldCheck, Apple } from "lucide-react";
import { UserProfile } from "@/hooks/useUserProfile";

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

// Les étapes : -1 (Diagnostic), 0 (Prénom/Âge), 1 (Profil), 2 (Dates), 3 (Paiement)
type Step = -1 | 0 | 1 | 1.5 | 2 | 3;

const CYCLE_TYPES = [
  { id: "natural", label: "Cycle Naturel", emoji: "🌿", desc: "Méthode symptothermique complète" },
  { id: "hormonal", label: "Contraception Hormonale", emoji: "💊", desc: "Pilule, implant, stérilet hormonal…" },
  { id: "menopause", label: "Ménopause", emoji: "🌸", desc: "Périménopause ou ménopause" },
  { id: "postpartum", label: "Post-partum", emoji: "👶", desc: "Après une naissance" },
];

const HORMONAL_OPTIONS = [
  { id: "pill", label: "Pilule", emoji: "💊", desc: "Prise quotidienne (combinée ou micro)" },
  { id: "iud_hormonal", label: "Stérilet Hormonal", emoji: "🛡️", desc: "Protection longue durée (SIU)" },
  { id: "other", label: "Autre", emoji: "💉", desc: "Implant, anneau, patch..." },
];

const DIAGNOSTIC_GOALS = [
  { id: "acne", label: "Acné & Santé de la peau", icon: "✨" },
  { id: "inflammation", label: "Digestion & Inflammation", icon: "🌿" },
  { id: "energy", label: "Fatigue & Énergie", icon: "⚡" },
  { id: "mood", label: "Sautes d'humeur & Stress", icon: "🧠" },
  { id: "cycle", label: "Régularité du cycle", icon: "🔄" },
];

export function OnboardingScreen({ onComplete }: OnboardingProps) {
  // --- ÉTATS ---
const [step, setStep] = useState<number>(-1); // On remplace <Step> par <number>
  const [showSuccess, setShowSuccess] = useState(false);
  const [goals, setGoals] = useState<string[]>([]);
  const [firstName, setFirstName] = useState("");
  const [age, setAge] = useState("");
  const [cycleType, setCycleType] = useState<UserProfile["cycleType"] | "">("");
  const [lmpDate, setLmpDate] = useState("");
  const [cycleLength, setCycleLength] = useState(28);
  const [dir, setDir] = useState(1);
  // Ajoute ceci avec les autres useState
const [birthControl, setBirthControl] = useState<"pill" | "iud_hormonal" | "other" | "">("");

  const slideVariants = {
    initial: (dir: number) => ({ x: dir * 60, opacity: 0 }),
    animate: { x: 0, opacity: 1, transition: { duration: 0.35, ease: "easeOut" } },
    exit: (dir: number) => ({ x: dir * -60, opacity: 0, transition: { duration: 0.25 } }),
  };

const goNext = () => { 
    setDir(1); 
    setStep((s) => {
      if (s === 1 && cycleType === "hormonal") return 1.5; // Bifurcation vers le sous-choix
      if (s === 1.5) return 2; // Retour au flux principal
      return (s + 1) as Step;
    }); 
  };

  const goBack = () => { 
    setDir(-1); 
    setStep((s) => {
      if (s === 2 && cycleType === "hormonal") return 1.5; // Retour au sous-choix
      if (s === 1.5) return 1; // Retour au profil hormonal
      return (s - 1) as Step;
    }); 
  };
  
const handleFinish = () => {
    if (!cycleType) return;
    setShowSuccess(true);

    const cleanProfile: UserProfile = {
      firstName: firstName.trim() || "Kalila",
      age: parseInt(age) || 30,
      cycleType: (cycleType as UserProfile["cycleType"]) || "natural",
      // On enregistre ici TOUS les choix faits durant l'onboarding
      birthControl: birthControl || undefined, 
      goals: goals, // On garde tes objectifs (Acné, Énergie, etc.)
      lmpDate: lmpDate || new Date().toISOString().split("T")[0],
      cycleLength: cycleLength || 28,
      periodDuration: 5,
    };

    setTimeout(() => {
      onComplete(cleanProfile);
    }, 3000);
  };;

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-[#FFF9F5] flex flex-col items-center justify-center p-8 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-8">
          <div className="relative">
            <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.1, 0.3] }} transition={{ repeat: Infinity, duration: 3 }} className="absolute inset-0 bg-orange-300 rounded-full blur-3xl" />
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="relative text-8xl">🌙</motion.div>
          </div>
          <div className="space-y-4">
            <h1 className="font-display text-4xl font-bold text-orange-900">Bienvenue, {firstName}</h1>
            <p className="text-orange-700/80 text-lg italic font-medium">"Écoute ton corps, il a des choses à te dire."</p>
          </div>
          <div className="flex items-center gap-2 text-orange-600/50 mt-12 animate-pulse">
            <Sparkles size={16} />
            <p className="text-xs uppercase tracking-[0.2em] font-bold">Génération de ton programme</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-[480px] mx-auto overflow-x-hidden">
      {/* Header */}
      <div className="px-6 pt-10 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🌙</span>
          <span className="font-display text-2xl font-bold text-gradient">LUNAYA</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-full border border-green-100 text-[10px] font-bold text-green-700 uppercase tracking-tight">
          <ShieldCheck size={12} /> Données protégées
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 flex gap-2 mb-8">
        {[-1, 0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-400 ${i <= step ? "bg-orange-500 flex-1" : "bg-muted flex-none w-4"}`} />
        ))}
      </div>

      <div className="flex-1 px-6 relative">
        <AnimatePresence mode="wait" custom={dir}>
          {/* STEP -1: DIAGNOSTIC */}
          {step === -1 && (
            <motion.div key="step-1" custom={dir} variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col gap-6">
              <div className="space-y-2">
                <h1 className="font-display text-3xl font-bold text-foreground leading-tight text-balance text-orange-950">
                  Ton diagnostic personnalisé
                </h1>
                <p className="text-muted-foreground text-sm">Quels sont tes objectifs principaux ?</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {DIAGNOSTIC_GOALS.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => setGoals(prev => prev.includes(goal.id) ? prev.filter(g => g !== goal.id) : [...prev, goal.id])}
                    className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${goals.includes(goal.id) ? "border-orange-500 bg-orange-50 shadow-sm ring-1 ring-orange-500/20" : "border-border bg-card hover:border-orange-200"}`}
                  >
                    <span className="text-xl">{goal.icon}</span>
                    <span className={`text-sm font-semibold ${goals.includes(goal.id) ? "text-orange-900" : "text-foreground"}`}>{goal.label}</span>
                  </button>
                ))}
              </div>
              <button onClick={goNext} disabled={goals.length === 0} className="mt-4 w-full gradient-hero text-primary-foreground font-bold py-4 rounded-2xl shadow-lg disabled:opacity-40">
                Lancer mon analyse <ChevronRight size={18} className="inline ml-1" />
              </button>
            </motion.div>
          )}

          {/* STEP 0: IDENTITY */}
          {step === 0 && (
            <motion.div key="step0" custom={dir} variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col gap-6">
              <h1 className="font-display text-3xl font-bold text-orange-950">Apprenons à nous connaître</h1>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Ton Prénom</label>
                  <input type="text" placeholder="Calie" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full bg-card border border-border rounded-2xl px-5 py-4 text-base focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Ton Âge</label>
                  <input type="number" placeholder="21" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-card border border-border rounded-2xl px-5 py-4 text-base focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={goBack} className="w-14 h-14 rounded-2xl border flex items-center justify-center text-muted-foreground"><ArrowLeft size={20} /></button>
                <button onClick={goNext} disabled={!firstName.trim() || !age} className="flex-1 gradient-hero text-primary-foreground font-bold rounded-2xl">Continuer</button>
              </div>
            </motion.div>
          )}

{/* STEP 1: HORMONAL PROFILE */}
          {step === 1 && (
            <motion.div key="step1" custom={dir} variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col gap-6">
              <h1 className="font-display text-3xl font-bold text-orange-950">Ton profil hormonal</h1>
              <div className="grid gap-3">
                {CYCLE_TYPES.map((type) => (
                  <button key={type.id} onClick={() => setCycleType(type.id as UserProfile["cycleType"])} className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${cycleType === type.id ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500/20" : "border-border bg-card"}`}>
                    <span className="text-2xl">{type.emoji}</span>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${cycleType === type.id ? "text-orange-900" : "text-foreground"}`}>{type.label}</p>
                      <p className="text-[11px] text-muted-foreground leading-tight">{type.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={goBack} className="w-14 h-14 rounded-2xl border flex items-center justify-center text-muted-foreground"><ArrowLeft size={20} /></button>
                <button 
                  onClick={() => {
                    // SI l'utilisatrice choisit Hormonal, on l'envoie vers 1.5
                    if (cycleType === "hormonal") {
                      setStep(1.5);
                    } else {
                      // SINON (naturel, ménopause...), elle va direct aux dates
                      goNext();
                    }
                  }} 
                  disabled={!cycleType} 
                  className="flex-1 gradient-hero text-primary-foreground font-bold rounded-2xl"
                >
                  Continuer
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 1.5: TYPE DE CONTRACEPTION PRÉCIS */}
          {step === 1.5 && (
            <motion.div key="step1.5" custom={dir} variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col gap-6">
              <div className="space-y-2">
                <h1 className="font-display text-3xl font-bold text-orange-950">Précise ta protection</h1>
                <p className="text-muted-foreground text-sm">Cela nous permet d'adapter tes conseils de fiabilité.</p>
              </div>
              
              <div className="grid gap-3">
                {HORMONAL_OPTIONS.map((opt) => (
                  <button 
                    key={opt.id} 
                    onClick={() => setBirthControl(opt.id as any)} 
                    className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${birthControl === opt.id ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500/20" : "border-border bg-card"}`}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${birthControl === opt.id ? "text-orange-900" : "text-foreground"}`}>{opt.label}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={() => setStep(1)} className="w-14 h-14 rounded-2xl border flex items-center justify-center text-muted-foreground"><ArrowLeft size={20} /></button>
                <button onClick={goNext} disabled={!birthControl} className="flex-1 gradient-hero text-primary-foreground font-bold rounded-2xl">Continuer</button>
              </div>
            </motion.div>
          )}
          
          {/* STEP 2: CYCLE DATES */}
          {step === 2 && (
            <motion.div key="step2" custom={dir} variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col gap-6">
              <h1 className="font-display text-3xl font-bold text-orange-950">Ton dernier cycle</h1>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Début des dernières règles</label>
                  <input type="date" max={new Date().toISOString().split("T")[0]} value={lmpDate} onChange={(e) => setLmpDate(e.target.value)} className="w-full bg-card border border-border rounded-2xl px-5 py-4" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Durée moyenne du cycle : <span className="text-orange-600">{cycleLength} jours</span></label>
                  <input type="range" min="20" max="45" value={cycleLength} onChange={(e) => setCycleLength(parseInt(e.target.value))} className="w-full accent-orange-500" />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={goBack} className="w-14 h-14 rounded-2xl border flex items-center justify-center text-muted-foreground"><ArrowLeft size={20} /></button>
                <button onClick={goNext} disabled={!lmpDate} className="flex-1 gradient-hero text-primary-foreground font-bold rounded-2xl">Continuer</button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: PAYMENT & UNLOCK */}
          {step === 3 && (
            <motion.div key="step3" custom={dir} variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col gap-5">
              <h1 className="font-display text-3xl font-bold text-orange-950">C'est prêt, {firstName} !</h1>
              <div className="bg-orange-50/50 p-5 rounded-3xl border border-orange-100 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0"><Apple size={20} /></div>
                <p className="text-xs text-orange-800 leading-relaxed italic">
                  "En tant que diététicienne, j'ai conçu LUNAYA pour t'offrir un suivi basé sur la science. Débloque tes conseils anti-inflammatoires personnalisés."
                </p>
              </div>
              
              <div className="flex flex-col gap-4 mt-2">
                <button 
                  onClick={() => {
                    window.open("https://buy.stripe.com/test_dRm00c3u11ka7gh8g9dEs00", "_blank");
                    const btn = document.getElementById('final-trigger');
                    if (btn) btn.style.display = 'block';
                  }}
                  className="w-full py-5 bg-orange-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:bg-orange-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Contribuer & Débloquer ✨
                </button>

                <button
                  id="final-trigger"
                  style={{ display: 'none' }}
                  onClick={handleFinish}
                  className="w-full py-4 bg-white border-2 border-orange-500 text-orange-600 rounded-2xl font-bold text-sm animate-in fade-in zoom-in duration-500 shadow-sm"
                >
                  Accéder à mon programme →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-12" />
    </div>
  );
}
