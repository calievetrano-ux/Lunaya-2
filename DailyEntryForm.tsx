import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X, Search } from "lucide-react";
import { DailyEntry, CycleMode } from "@/lib/cycleEngine";
import { useAppleHealth } from "@/hooks/useAppleHealth";

interface DailyEntryFormProps {
  day: number;
  mode?: CycleMode;
  existing?: DailyEntry;
  heightCm?: number;
  onHeightChange?: (h: number) => void;
  onSave: (entry: Partial<DailyEntry>) => void;
  onClose: () => void;
}

// ── CONSTANTES (AVANT LA FONCTION) ──────────────────────────────────
const MUCUS_LABELS = ["", "Sèche", "Collante", "Crémeuse", "Élastique", "Liquide 💧"];
const MUCUS_EMOJI = ["", "🔴", "🟠", "🟡", "🟢", "💧"];

interface SymptomItem { id: string; emoji: string; label: string; }
interface SymptomGroup { id: string; label: string; items: SymptomItem[]; }

const SYMPTOM_GROUPS: SymptomGroup[] = [
  {
    id: "positif",
    label: "✨ Bien-être & Positif",
    items: [
      { id: "belle_peau", emoji: "🌸", label: "Belle peau" },
      { id: "beaux_cheveux", emoji: "💇‍♀️", label: "Beaux cheveux" },
      { id: "confiance", emoji: "💪", label: "Confiance en soi" },
      { id: "energie_max", emoji: "⚡", label: "Énergie au max" },
      { id: "bonne_humeur_pos", emoji: "😄", label: "Super bonne humeur" },
      { id: "motivee_pos", emoji: "🚀", label: "Ultra motivée" },
      { id: "libido_haute", emoji: "🌹", label: "Libido élevée" },
      { id: "peau_lumineuse", emoji: "✨", label: "Peau lumineuse" },
      { id: "zen_pos", emoji: "🧘‍♀️", label: "Zen & apaisée" },
      { id: "creative", emoji: "🎨", label: "Créativité au top" },
      { id: "sociale", emoji: "🥂", label: "Envie de socialiser" },
      { id: "corps_bien", emoji: "💃", label: "Corps qui se sent bien" },
      { id: "gratitude", emoji: "🙏", label: "Gratitude / Bien dans ma tête" },
      { id: "productivite", emoji: "🎯", label: "Productivité au top" },
      { id: "serenite", emoji: "🌊", label: "Sérénité profonde" },
      { id: "souplesse", emoji: "🤸‍♀️", label: "Corps souple & léger" },
      { id: "beaux_ongles", emoji: "💅", label: "Beaux ongles" },
      { id: "magnetisme", emoji: "🌟", label: "Je rayonne / magnétisme" },
      { id: "appetit_sain", emoji: "🥗", label: "Appétit sain & équilibré" },
      { id: "bonne_digestion", emoji: "✅", label: "Digestion au top" },
      { id: "sport_facile", emoji: "🏃‍♀️", label: "Sport fluide & facile" },
      { id: "focus_laser", emoji: "🔍", label: "Focus / Concentration" },
      { id: "libido_present", emoji: "💋", label: "Envie intime présente" },
      { id: "joie_vivre", emoji: "🌈", label: "Joie de vivre" },
    ],
  },
  {
    id: "energie_mental",
    label: "⚡ Énergie & Mental",
    items: [
      { id: "energie_low", emoji: "🪫", label: "Énergie low" },
      { id: "epuisee", emoji: "😩", label: "Fatigue intense" },
      { id: "brain_fog", emoji: "🌫️", label: "Brouillard mental" },
      { id: "irritable", emoji: "😤", label: "Irritabilité" },
      { id: "triste", emoji: "😔", label: "Tristesse" },
      { id: "anxiete", emoji: "😰", label: "Anxiété" },
      { id: "stress", emoji: "😵", label: "Stress élevé" },
      { id: "surcharge_mentale", emoji: "🧠", label: "Surcharge mentale" },
      { id: "rumination", emoji: "🌀", label: "Rumination / pensées négatives" },
      { id: "manque_motivation", emoji: "😶", label: "Manque de motivation" },
      { id: "sensibilite_emotionnelle", emoji: "🥺", label: "Hypersensibilité émotionnelle" },
      { id: "colere", emoji: "🔥", label: "Colère / Agacement" },
      { id: "pleurs", emoji: "😢", label: "Envie de pleurer" },
      { id: "detachement", emoji: "🫥", label: "Détachement / Vide" },
    ],
  },
  {
    id: "corps",
    label: "🌸 Corps & Peau",
    items: [
      { id: "acne", emoji: "🫧", label: "Acné / Peau grasse" },
      { id: "peau_seche", emoji: "🧴", label: "Peau sèche / tiraillements" },
      { id: "teint_terne", emoji: "😐", label: "Teint terne / fatigué" },
      { id: "cheveux_gras", emoji: "💦", label: "Cheveux gras" },
      { id: "chute_cheveux", emoji: "💇", label: "Chute de cheveux" },
      { id: "ongles_cassants", emoji: "💔", label: "Ongles cassants" },
      { id: "retention_eau", emoji: "💧", label: "Rétention d'eau / gonflement" },
      { id: "prise_poids_res", emoji: "⚖️", label: "Sensation de prise de poids" },
      { id: "peau_piquante", emoji: "🌵", label: "Peau qui picote / gratte" },
      { id: "chaleur_peau", emoji: "🌡️", label: "Sensation de chaleur dans le corps" },
    ],
  },
  {
    id: "digestion",
    label: "🍽️ Digestion & Appétit",
    items: [
      { id: "ballonnements", emoji: "🎈", label: "Ballonnements" },
      { id: "sucre", emoji: "🍫", label: "Pulsions sucrées" },
      { id: "sale", emoji: "🍔", label: "Pulsions salées" },
      { id: "nausees", emoji: "🤢", label: "Nausées" },
      { id: "transit_lent", emoji: "🐌", label: "Transit lent" },
      { id: "diarrhee", emoji: "💨", label: "Transit accéléré / diarrhée" },
      { id: "perte_appetit", emoji: "🚫", label: "Perte d'appétit" },
      { id: "faim_exces", emoji: "🍽️", label: "Faim excessive" },
      { id: "reflux", emoji: "🔄", label: "Reflux / brûlures" },
      { id: "digestion_lente", emoji: "⏳", label: "Digestion lente / pesanteur" },
    ],
  },
  {
    id: "douleurs",
    label: "🩸 Douleurs & Physique",
    items: [
      { id: "crampes", emoji: "🩸", label: "Crampes pelviennes" },
      { id: "migraine", emoji: "🤕", label: "Migraines / maux de tête" },
      { id: "seins_sensibles", emoji: "🍈", label: "Seins sensibles" },
      { id: "douleurs_articulaires", emoji: "🦴", label: "Douleurs articulaires" },
      { id: "jambes_lourdes", emoji: "🦵", label: "Jambes lourdes" },
      { id: "douleurs_dos", emoji: "🫀", label: "Douleurs dans le dos" },
      { id: "douleurs_musculaires", emoji: "💪", label: "Courbatures / douleurs musculaires" },
      { id: "tension_nuque", emoji: "🧶", label: "Tension nuque / épaules" },
      { id: "douleurs_ovaires", emoji: "🔴", label: "Douleurs ovariennes" },
      { id: "crampes_jambes", emoji: "🦿", label: "Crampes dans les jambes" },
    ],
  },
  {
    id: "sommeil",
    label: "🌙 Sommeil",
    items: [
      { id: "profond", emoji: "😴", label: "Bon sommeil" },
      { id: "insomnie", emoji: "😳", label: "Insomnie" },
      { id: "reveils_precoces", emoji: "⏰", label: "Réveils précoces" },
      { id: "cauchemars", emoji: "😟", label: "Cauchemars / rêves intenses" },
      { id: "sommeil_agite", emoji: "🌪️", label: "Sommeil agité" },
      { id: "hypersomnie", emoji: "🛌", label: "Trop dormir / hypersomnie" },
      { id: "difficulte_endormissement", emoji: "🕙", label: "Difficulté à s'endormir" },
      { id: "sueurs_nuit", emoji: "💦", label: "Sueurs nocturnes" },
    ],
  },
  {
    id: "sexualite",
    label: "💕 Sexualité & Intime",
    items: [
      { id: "spotting", emoji: "🍷", label: "Spotting (Pertes marrons)" },
      { id: "libido_basse", emoji: "💔", label: "Libido basse" },
      { id: "secheresse_vaginale", emoji: "🌵", label: "Sécheresse vaginale" },
      { id: "douleurs_rapports", emoji: "⚡", label: "Douleurs lors des rapports" },
      { id: "pertes_abondantes", emoji: "💧", label: "Pertes abondantes" },
      { id: "odeur_inhabituelle", emoji: "🌂", label: "Odeur inhabituelle" },
      { id: "demangeaisons", emoji: "🌶️", label: "Démangeaisons intimes" },
    ],
  },
];

const MENOPAUSE_SYMPTOM_GROUPS: SymptomGroup[] = [
  {
    id: "menopause_positif",
    label: "✨ Positif / Bien-être",
    items: [
      { id: "bonne_energie",       emoji: "✨", label: "Bonne énergie" },
      { id: "bonne_humeur",        emoji: "😊", label: "Bonne humeur" },
      { id: "motivee",             emoji: "🚀", label: "Motivée" },
      { id: "calme",               emoji: "🌿", label: "Calme" },
      { id: "bon_sommeil",         emoji: "😴", label: "Bon sommeil" },
      { id: "aucun_symptome",      emoji: "🌟", label: "Aucun symptôme" },
    ],
  },
  {
    id: "menopause_vasomoteur",
    label: "🌡️ Vasomoteur",
    items: [
      { id: "bouffees_chaleur",    emoji: "🌡️", label: "Bouffées de chaleur" },
      { id: "sueurs_nocturnes",    emoji: "💦", label: "Sueurs nocturnes" },
      { id: "palpitations",        emoji: "💓", label: "Palpitations" },
    ],
  },
  {
    id: "menopause_sommeil",
    label: "🌙 Sommeil",
    items: [
      { id: "insomnie",            emoji: "😳", label: "Insomnie" },
      { id: "reveils_precoces",    emoji: "⏰", label: "Réveils précoces" },
      { id: "pb_sommeil",          emoji: "😶", label: "Mauvais sommeil" },
    ],
  },
  {
    id: "menopause_humeur",
    label: "🌀 Humeur & Mental",
    items: [
      { id: "sautes_humeur",       emoji: "🌀", label: "Sautes d'humeur" },
      { id: "mauvaise_humeur",     emoji: "😒", label: "Mauvaise humeur" },
      { id: "anxiete",             emoji: "😰", label: "Anxiété" },
      { id: "stress",              emoji: "🧠", label: "Stress" },
      { id: "depression",          emoji: "😔", label: "Dépression" },
      { id: "irritable",           emoji: "😤", label: "Irritabilité" },
      { id: "brain_fog",           emoji: "🌫️", label: "Brain fog" },
    ],
  },
  {
    id: "menopause_physique",
    label: "🦴 Physique",
    items: [
      { id: "epuisee",             emoji: "🪫", label: "Fatigue" },
      { id: "douleurs_articulaires",emoji: "🦴",label: "Douleurs articulaires" },
      { id: "douleurs_musculaires",emoji: "💪", label: "Douleurs musculaires" },
      { id: "migraine",            emoji: "🤕", label: "Maux de tête" },
      { id: "secheresse",          emoji: "🌵", label: "Sécheresse vaginale" },
      { id: "pertes_vaginales",    emoji: "💧", label: "Pertes vaginales" },
      { id: "secheresse_peau",     emoji: "🧴", label: "Peau sèche" },
      { id: "chute_cheveux",       emoji: "💇", label: "Chute de cheveux" },
      { id: "libido_basse",        emoji: "💔", label: "Libido basse" },
    ],
  },
  {
    id: "menopause_metabolisme",
    label: "⚖️ Métabolisme & Digestion",
    items: [
      { id: "prise_poids",         emoji: "⚖️", label: "Prise de poids" },
      { id: "ballonnements",       emoji: "🎈", label: "Ballonnements" },
      { id: "faim_elevee",         emoji: "🍽️", label: "Appétit élevé" },
      { id: "faim_basse",          emoji: "🚫", label: "Appétit faible" },
      { id: "digestion",           emoji: "🫃", label: "Troubles digestifs" },
    ],
  },
];

// ── COMPOSANTS INTERNES ─────────────────────────────────────────────
function MucusDrop({ level, active, onClick }: { level: number; active: boolean; onClick: () => void }) {
  const size = 28 + level * 8;
  const color = `hsl(${200 + level * 8} ${45 + level * 10}% ${55 - level * 4}%)`;
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 transition-all duration-200 focus:outline-none" style={{ minWidth: 44 }}>
      <div style={{
          width: size, height: size * 1.25,
          background: active ? color : `hsla(${200 + level * 8} 30% 65% / 0.35)`,
          borderRadius: `50% 50% 50% 50% / 40% 40% 60% 60%`,
          border: active ? `2px solid ${color}` : "2px solid transparent",
          transform: active ? "scale(1.18)" : "scale(1)",
          transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      />
      <span className={`text-[9px] font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{level}</span>
    </button>
  );
}

function SymptomIntensityBar({ symptomLabel, emoji, value, onChange }: { symptomLabel: string; emoji: string; value: number; onChange: (v: number) => void }) {
  const intensityColors = ["", "#d4a5b5", "#e8876a", "#d4613e", "#b8432a", "#8b2318"];
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-2 px-3 py-2.5 bg-background rounded-xl border border-border/60">
      <p className="text-[11px] font-semibold text-foreground flex items-center gap-1.5 mb-2">
        <span>{emoji}</span> {symptomLabel} — Intensité
      </p>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((v) => (
          <button key={v} onClick={() => onChange(v === value ? 0 : v)} className="flex-1 h-7 rounded-lg transition-all duration-200 flex items-center justify-center text-[10px] font-bold"
            style={{ background: v <= value ? intensityColors[v] : "hsl(var(--muted))", color: v <= value ? "white" : "gray" }}>{v}</button>
        ))}
      </div>
    </motion.div>
  );
}

function IntensitySlider({ label, emoji, value, onChange }: { label: string; emoji: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-foreground flex items-center gap-1.5"><span>{emoji}</span> {label}</span>
        <span className="text-xs font-bold text-primary">{value}/5</span>
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((v) => (
          <button key={v} onClick={() => onChange(v)} className="flex-1 h-2 rounded-full transition-all" style={{ background: v <= value ? "hsl(var(--primary))" : "hsl(var(--muted))" }} />
        ))}
      </div>
    </div>
  );
}

// ── FONCTION PRINCIPALE ──────────────────────────────────────────────
export function DailyEntryForm({ day, mode, existing, heightCm: initialHeightCm, onHeightChange, onSave, onClose }: DailyEntryFormProps) {
  if (!day) return null; // Sécurité anti-crash

  const isMenopause = mode === "menopause";
  const [searchTerm, setSearchTerm] = useState("");
  const { healthData, isAvailable: appleHealthAvailable } = useAppleHealth();
  const sleepSyncedFromApple = appleHealthAvailable && healthData.authorized && healthData.sleepHours != null;
  
  const [temp, setTemp] = useState(existing?.temperature?.toString() ?? "");
  const [mucus, setMucus] = useState(existing?.mucus ?? 1);
  const [bleeding, setBleeding] = useState(existing?.bleeding ?? false);
  const [bleedingIntensity, setBleedingIntensity] = useState<1 | 2 | 3 | 4>(existing?.bleedingIntensity ?? 2);
  const [expertMode, setExpertMode] = useState(false);
  const [cervixPosition, setCervixPosition] = useState(existing?.cervixPosition ?? "bas"); 
const [cervixFirmness, setCervixFirmness] = useState(existing?.cervixFirmness ?? "ferme");
  const [cervixHeight, setCervixHeight] = useState<"high" | "low">(existing?.cervixHeight ?? "low");
  const [cervixTexture, setCervixTexture] = useState<"soft" | "firm">(existing?.cervixTexture ?? "firm");
  const [cervixOpening, setCervixOpening] = useState<"open" | "closed">(existing?.cervixOpening ?? "closed");
  const [activeSymptoms, setActiveSymptoms] = useState<Set<string>>(new Set(existing?.symptoms ?? []));
  const [symptomIntensities, setSymptomIntensities] = useState<Record<string, number>>((existing as any)?.symptomIntensities ?? {});
  const [eatLog, setEatLog] = useState(existing?.eatLog ?? "");
  const [moveLog, setMoveLog] = useState(existing?.moveLog ?? "");
  const [doLog, setDoLog] = useState(existing?.doLog ?? "");
  const [sleepHours, setSleepHours] = useState(existing?.sleepHours?.toString() ?? "");
  const [weightKg, setWeightKg] = useState(existing?.weightKg?.toString() ?? "");
  const [heightCm, setHeightCm] = useState(initialHeightCm?.toString() ?? "");

  // Menopause
  const [hotFlashIntensity, setHotFlashIntensity] = useState(existing?.hotFlashIntensity ?? 0);
  const [sleepQuality, setSleepQuality] = useState(existing?.sleepQuality ?? 3);
  const [moodScore, setMoodScore] = useState(existing?.moodScore ?? 3);

  const toggleSymptom = (id: string) => {
    setActiveSymptoms((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredGroups = (isMenopause ? MENOPAUSE_SYMPTOM_GROUPS : SYMPTOM_GROUPS).map(group => ({
    ...group,
    items: group.items.filter(item => item.label.toLowerCase().includes(searchTerm.toLowerCase().trim()))
  })).filter(group => group.items.length > 0);

const handleSave = () => {
  const entry: Partial<DailyEntry> & { symptomIntensities?: Record<string, number> } = {
    temperature: temp ? parseFloat(temp) : undefined,
    mucus: isMenopause ? undefined : mucus,
    bleeding: isMenopause ? undefined : bleeding,
    bleedingIntensity: (!isMenopause && bleeding) ? bleedingIntensity : undefined,
    symptoms: Array.from(activeSymptoms),
    symptomIntensities: Object.keys(symptomIntensities).length > 0 ? symptomIntensities : undefined,
    eatLog: eatLog.trim() || undefined,
    moveLog: moveLog.trim() || undefined,
    doLog: doLog.trim() || undefined,
    sleepHours: sleepSyncedFromApple ? healthData.sleepHours : (sleepHours ? parseFloat(sleepHours) : undefined),
    weightKg: weightKg ? parseFloat(weightKg) : undefined,
    // On ajoute ici les données du col
    cervixPosition: expertMode ? cervixPosition : undefined,
    cervixFirmness: expertMode ? cervixFirmness : undefined,
    ...(isMenopause && { hotFlashIntensity, sleepQuality, moodScore }),
  };
  onSave(entry as Partial<DailyEntry>);
  onClose();
};
  
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-end" onClick={onClose}>
        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0.15 }} className="w-full max-w-[480px] mx-auto bg-card rounded-t-3xl overflow-y-auto max-h-[94vh] pb-10" onClick={e => e.stopPropagation()}>
          <div className="flex justify-center pt-3 pb-2"><div className="w-10 h-1 rounded-full bg-muted" /></div>
          <div className="px-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-xl font-semibold">Jour {day}</h2>
                <p className="text-xs text-muted-foreground">{isMenopause ? "Suivi Ménopause" : "Bilan quotidien"}</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">✕</button>
            </div>

            <section className="mb-6">
              <input type="text" placeholder="Rechercher un symptôme..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-muted/50 border border-border/50 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-orange-400 outline-none pl-11" />
            </section>

            <section className="mb-5">
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-2">🌡️ Température Basale</label>
              <input type="number" step="0.01" value={temp} onChange={e => setTemp(e.target.value)} className="w-full border rounded-xl px-4 py-3 text-lg font-display font-semibold" placeholder="36.6" />
            </section>

            {/* 💧 INDICE DE MUCUS (VISUEL) */}
<section className="mb-6 bg-blue-50/40 p-5 rounded-[2rem] border border-blue-100/50 shadow-sm">
  <div className="flex items-center justify-between mb-5">
    <label className="text-[10px] font-black uppercase tracking-widest text-blue-600">
      Glaire Cervicale (Texture)
    </label>
    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-display uppercase tracking-tighter">Indice Fertilité</span>
  </div>
  
  <div className="flex justify-between items-end px-1 mb-4">
    {[1, 2, 3, 4, 5].map((level) => (
      <MucusDrop 
        key={level} 
        level={level} 
        active={mucus === level} 
        onClick={() => setMucus(level)} 
      />
    ))}
  </div>
  
  <p className="text-center text-xs font-bold text-blue-900 bg-white/60 py-2 rounded-xl border border-blue-100 shadow-inner">
    {["Sèche", "Collante", "Crémeuse", "Élastique (Blanc d'œuf)", "Liquide / Aqueuse 💧"][mucus - 1]}
  </p>
</section>

{/* 🔍 TOUCHER DU COL (MODE EXPERT) */}
<section className="mb-8 px-1">
  <button 
    onClick={() => setExpertMode(!expertMode)}
    className="flex items-center justify-between w-full p-3 bg-muted/30 rounded-2xl border border-dashed border-border"
  >
    <div className="flex items-center gap-2">
      <span className="text-sm">🧘‍♀️</span>
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mode Expert : Position du col</span>
    </div>
    <ChevronDown size={14} className={`transition-transform duration-300 ${expertMode ? "rotate-180" : ""}`} />
  </button>

  <AnimatePresence>
    {expertMode && (
      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
        <div className="pt-4 space-y-5">
          {/* Hauteur */}
          <div className="flex items-center justify-between bg-white border border-border/50 p-2 rounded-2xl">
            <span className="text-[11px] font-bold text-muted-foreground ml-2 uppercase">Position</span>
            <div className="flex gap-1 bg-muted/50 p-1 rounded-xl">
              {["Bas", "Moyen", "Haut"].map((p) => (
                <button key={p} onClick={() => setCervixPosition(p.toLowerCase() as any)}
                  className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${cervixPosition === p.toLowerCase() ? "bg-white shadow-sm text-primary" : "text-muted-foreground opacity-50"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          {/* Fermeté */}
          <div className="flex items-center justify-between bg-white border border-border/50 p-2 rounded-2xl">
            <span className="text-[11px] font-bold text-muted-foreground ml-2 uppercase">Fermeté</span>
            <div className="flex gap-1 bg-muted/50 p-1 rounded-xl">
              {["Ferme", "Mou"].map((f) => (
                <button key={f} onClick={() => setCervixFirmness(f.toLowerCase() as any)}
                  className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${cervixFirmness === f.toLowerCase() ? "bg-white shadow-sm text-primary" : "text-muted-foreground opacity-50"}`}>
                  {f === "Ferme" ? "👃 Ferme" : "👄 Mou"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
</section>

            {isMenopause && (
              <section className="mb-5 bg-background rounded-2xl p-4 border">
                <IntensitySlider label="Bouffées de chaleur" emoji="🔥" value={hotFlashIntensity} onChange={setHotFlashIntensity} />
                <IntensitySlider label="Qualité du sommeil" emoji="😴" value={sleepQuality} onChange={setSleepQuality} />
                <IntensitySlider label="Humeur générale" emoji="🌸" value={moodScore} onChange={setMoodScore} />
              </section>
            )}

            {!isMenopause && (
              <section className="mb-5">
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-2">🩸 Saignements</label>
                <div className="flex gap-2">
                  {[false, true].map(val => (
                    <button key={String(val)} onClick={() => setBleeding(val)} className={`flex-1 py-2.5 rounded-xl text-sm border ${bleeding === val ? "bg-phase-winter text-white" : "bg-white"}`}>{val ? "Oui" : "Non"}</button>
                  ))}
                </div>
              </section>
            )}

            <section className="mb-6">
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase">🌸 Symptômes</p>
              <div className="flex flex-col gap-4">
                {filteredGroups.map(group => (
                  <div key={group.id}>
                    <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase">{group.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map(item => (
                        <button key={item.id} onClick={() => toggleSymptom(item.id)} className={`px-3 py-1.5 rounded-full text-xs border ${activeSymptoms.has(item.id) ? "bg-primary text-white" : "bg-white"}`}>
                          {item.emoji} {item.label}
                        </button>
                      ))}
                    </div>
                    {group.items.filter(i => activeSymptoms.has(i.id)).map(item => (
                      <SymptomIntensityBar key={item.id} symptomLabel={item.label} emoji={item.emoji} value={symptomIntensities[item.id] ?? 0} onChange={v => setSymptomIntensities({...symptomIntensities, [item.id]: v})} />
                    ))}
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-6 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase">📝 Journal</p>
              <textarea value={eatLog} onChange={e => setEatLog(e.target.value)} placeholder="🍽️ EAT - Repas du jour..." className="w-full bg-sage-light/30 border border-sage/30 rounded-xl p-3 text-xs" rows={2} />
              <textarea value={moveLog} onChange={e => setMoveLog(e.target.value)} placeholder="🏃‍♀️ MOVE - Sport..." className="w-full bg-terracotta-light/30 border border-terracotta/30 rounded-xl p-3 text-xs" rows={2} />
              <textarea value={doLog} onChange={e => setDoLog(e.target.value)} placeholder="📓 DO - Activité..." className="w-full bg-rose-mist border border-secondary/30 rounded-xl p-3 text-xs" rows={2} />
            </section>

            <button onClick={handleSave} className="w-full gradient-hero text-white font-bold py-4 rounded-2xl shadow-soft">Enregistrer ✓</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
