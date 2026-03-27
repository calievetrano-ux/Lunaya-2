import { useState } from "react";
import { AppleHealthCard } from "@/components/AppleHealthCard";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  RotateCcw,
  Activity,
  ChevronRight,
  Pencil,
  Save,
  Heart,
  LogOut,
  Trash2,
  RefreshCcw,
  AlertTriangle,
} from "lucide-react";
import { CycleState } from "@/lib/cycleEngine";
import { UserProfile } from "@/hooks/useUserProfile";

interface ProfileViewProps {
  state: CycleState;
  profile: UserProfile;
  onDayChange: (day: number) => void;
  onCycleLengthChange: (length: number) => void;
  onProfileUpdate: (partial: Partial<UserProfile>) => void;
  onResetCycle: () => void;
  onLogout: () => void;
  onResetData: () => void;
  onDeleteAccount: () => void;
  onRestartOnboarding: () => void;
}

const CYCLE_TYPES: { id: UserProfile["cycleType"]; label: string; emoji: string; desc: string }[] = [
  { id: "natural", label: "Cycle Naturel", emoji: "🌿", desc: "Méthode symptothermique complète · Suivi fertilité actif" },
  { id: "hormonal", label: "Sous Contraception", emoji: "💊", desc: "Pilule, implant… · Prédictions ovulation désactivées" },
  { id: "menopause", label: "Ménopause / Périménopause", emoji: "🌸", desc: "Calendrier 28j désactivé · Journal de confort activé" },
  { id: "postpartum", label: "Post-partum", emoji: "👶", desc: "Après une naissance · Cycle en reconstruction" },
];

// ─── Mock health data (simulates Apple Health / Google Fit) ──────────────────
const MOCK_HEALTH = {
  steps: 7_842,
  activeMinutes: 38,
  workoutToday: "Marche rapide · 30 min",
};

export function ProfileView({
  state,
  profile,
  onProfileUpdate,
  onResetCycle,
  onLogout,
  onResetData,
  onDeleteAccount,
  onRestartOnboarding,
}: ProfileViewProps) {
  /* ─── local edit state ─────────────────────────────────────────── */
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(profile.firstName);
  const [age, setAge] = useState(String(profile.age));
  const [cycleType, setCycleType] = useState<UserProfile["cycleType"]>(profile.cycleType);
  const [lmpDate, setLmpDate] = useState(profile.lmpDate);
  const [cycleLength, setCycleLength] = useState(String(profile.cycleLength));
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetDataConfirm, setShowResetDataConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const hasUnsaved =
    firstName !== profile.firstName ||
    age !== String(profile.age) ||
    cycleType !== profile.cycleType ||
    lmpDate !== profile.lmpDate ||
    cycleLength !== String(profile.cycleLength);

  const handleSave = () => {
    const parsedAge = parseInt(age) || profile.age;
    const parsedCycleLength = parseInt(cycleLength) || profile.cycleLength;
    onProfileUpdate({
      firstName: firstName.trim() || profile.firstName,
      age: parsedAge,
      cycleType,
      lmpDate,
      cycleLength: Math.max(20, Math.min(45, parsedCycleLength)),
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setFirstName(profile.firstName);
    setAge(String(profile.age));
    setCycleType(profile.cycleType);
    setLmpDate(profile.lmpDate);
    setCycleLength(String(profile.cycleLength));
    setEditing(false);
  };

  const handleReset = () => {
    onResetCycle();
    setShowResetConfirm(false);
  };

  // EAT advice adjusted if health data connected
  const healthEatAdvice = profile.cycleType === "menopause"
    ? "Ton activité d'aujourd'hui (+38 min) demande une recharge en calcium et protéines : yaourt grec, amandes et sardines sont tes alliés post-entraînement."
    : "Ton activité d'aujourd'hui (+38 min) demande une recharge en fer et protéines : lentilles + viande rouge ou œufs pour compenser les pertes et reconstruire le muscle.";

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="flex flex-col gap-5 pb-28">

      {/* ── Header Card ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-3xl p-6 shadow-card border border-border/40"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full gradient-hero flex items-center justify-center shadow-soft flex-shrink-0">
            <span className="text-3xl">🌺</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl font-semibold text-foreground truncate">
              {profile.firstName}
            </h2>
            <p className="text-sm text-muted-foreground">
              {CYCLE_TYPES.find((t) => t.id === profile.cycleType)?.emoji}{" "}
              {CYCLE_TYPES.find((t) => t.id === profile.cycleType)?.label}
            </p>
            <p className="text-xs text-muted-foreground">{profile.age} ans</p>
          </div>
          <button
            onClick={() => setEditing((e) => !e)}
            className="w-9 h-9 rounded-full border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all active:scale-90"
          >
            <Pencil size={14} />
          </button>
        </div>

        {/* stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Cycles", value: String(profile.periodHistory?.length ?? 0) },
            { label: "Saisies", value: String(state.entries.length) },
            { label: "Mode", value: state.mode === "menopause" ? "🌸" : state.mode === "hormonal" ? "💊" : "🌿" },
          ].map((s) => (
            <div key={s.label} className="bg-background rounded-2xl p-2.5 text-center border border-border/40">
              <p className="font-display font-bold text-lg text-primary leading-tight">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* body metrics row */}
        {(profile.heightCm || profile.weightKg) && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            {profile.heightCm && (
              <div className="bg-background rounded-2xl p-2.5 text-center border border-border/40">
                <p className="font-display font-bold text-lg text-primary leading-tight">{profile.heightCm} <span className="text-xs font-normal">cm</span></p>
                <p className="text-[10px] text-muted-foreground">📏 Taille</p>
              </div>
            )}
            {profile.weightKg && (
              <div className="bg-background rounded-2xl p-2.5 text-center border border-border/40">
                <p className="font-display font-bold text-lg text-primary leading-tight">{profile.weightKg} <span className="text-xs font-normal">kg</span></p>
                <p className="text-[10px] text-muted-foreground">⚖️ Poids (dernier)</p>
              </div>
            )}
          </div>
        )}

      </motion.div>

      {/* ── Edit Form ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editing && (
          <motion.div
            key="edit-form"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="bg-card rounded-3xl p-5 shadow-card border border-primary/30"
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-full gradient-hero flex items-center justify-center flex-shrink-0">
                <Pencil size={12} className="text-primary-foreground" />
              </div>
              <h3 className="font-display text-base font-semibold text-foreground">Modifier mon profil</h3>
            </div>

            <div className="flex flex-col gap-4">
              {/* Prénom */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                  Prénom
                </label>
                <input
                  type="text"
                  placeholder="Ton prénom"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-base font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>

              {/* Âge */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                  Âge
                </label>
                <input
                  type="number"
                  min="12"
                  max="80"
                  placeholder="ex: 32"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-base font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
                {parseInt(age) >= 45 && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-primary mt-1.5 px-1"
                  >
                    🌸 Le mode Ménopause est recommandé pour ton âge
                  </motion.p>
                )}
              </div>

              {/* Sélecteur de branche */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Profil Hormonal (cœur du système)
                </label>
                <div className="flex flex-col gap-2">
                  {CYCLE_TYPES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setCycleType(t.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all ${
                        cycleType === t.id
                          ? "border-primary bg-primary/8 shadow-soft"
                          : "border-border bg-background hover:border-primary/40"
                      }`}
                    >
                      <span className="text-xl flex-shrink-0">{t.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${cycleType === t.id ? "text-primary" : "text-foreground"}`}>
                          {t.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">{t.desc}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        cycleType === t.id ? "border-primary bg-primary" : "border-muted"
                      }`}>
                        {cycleType === t.id && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
                      </div>
                    </button>
                  ))}
                </div>

                {/* branch hint */}
                <AnimatePresence>
                  {cycleType === "menopause" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 bg-rose-mist border border-secondary rounded-2xl px-4 py-3 flex gap-2.5 items-start overflow-hidden"
                    >
                      <span className="text-lg flex-shrink-0">🌸</span>
                      <p className="text-xs text-foreground leading-relaxed">
                        <strong>Mode Ménopause activé :</strong> le cadran de 28 jours et les prédictions d'ovulation seront remplacés par ton Journal de Confort (bouffées de chaleur, sommeil, moral).
                      </p>
                    </motion.div>
                  )}
                  {cycleType === "hormonal" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 bg-sage-light border border-sage rounded-2xl px-4 py-3 flex gap-2.5 items-start overflow-hidden"
                    >{/* ── Section Abonnement Prix Libre ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mx-0 p-6 bg-gradient-to-br from-[hsl(38_75%_95%)] to-white rounded-3xl border border-orange-200 shadow-sm text-center"
      >
        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Heart className="text-orange-600" size={24} />
        </div>
        <h3 className="font-display text-lg font-bold text-orange-900">Soutenir LUNAYA 🌙</h3>
        <p className="text-xs text-orange-800/70 mt-1 mb-5 leading-relaxed">
          Accède à l'expertise complète **EAT • MOVE • DO** et soutiens une technologie au service des femmes.
        </p>
        
        <button 
          onClick={() => window.location.href = "https://buy.stripe.com/test_dRm00c3u11ka7gh8g9dEs00"}
          className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold shadow-lg shadow-orange-200 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          S'abonner (Prix libre)
        </button>
        <p className="text-[10px] text-orange-400 mt-3 italic">Paiement sécurisé via Stripe</p>
      </motion.div>
                      <span className="text-lg flex-shrink-0">💊</span>
                      <p className="text-xs text-foreground leading-relaxed">
                        <strong>Mode Contraception :</strong> les prédictions d'ovulation sont désactivées. Le suivi se concentre sur les effets secondaires et la semaine de pause.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* LMP date (hidden for menopause) */}
              {cycleType !== "menopause" && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                    📅 Début des dernières règles
                  </label>
                  <input
                    type="date"
                    max={today}
                    value={lmpDate}
                    onChange={(e) => setLmpDate(e.target.value)}
                    className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-base font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              )}

              {/* Cycle length (hidden for menopause) */}
              {cycleType !== "menopause" && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                    🔄 Durée du cycle (jours)
                  </label>
                  <div className="flex items-center gap-4 bg-background border border-border rounded-2xl px-5 py-3">
                    <button
                      onClick={() => setCycleLength((l) => String(Math.max(20, parseInt(l) - 1)))}
                      className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-lg font-bold text-muted-foreground hover:text-primary hover:border-primary transition-all active:scale-90"
                    >
                      −
                    </button>
                    <span className="flex-1 text-center font-display text-2xl font-bold text-foreground">
                      {cycleLength}
                    </span>
                    <button
                      onClick={() => setCycleLength((l) => String(Math.min(45, parseInt(l) + 1)))}
                      className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-lg font-bold text-muted-foreground hover:text-primary hover:border-primary transition-all active:scale-90"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Save / Cancel */}
            <div className="flex gap-3 mt-5">
              <button
                onClick={handleCancel}
                className="flex-1 py-3 rounded-2xl border border-border text-sm font-semibold text-muted-foreground bg-background transition-all active:scale-95"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={!firstName.trim() || !age}
                className="flex-1 py-3 rounded-2xl gradient-hero text-primary-foreground text-sm font-semibold shadow-soft disabled:opacity-40 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Save size={14} />
                Enregistrer
              </button>
            </div>

            {hasUnsaved && (
              <p className="text-center text-[10px] text-primary mt-2 animate-pulse">
                ● Modifications non sauvegardées
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Données de Santé ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-3xl p-5 shadow-card border border-border/40"
      >
        <div className="flex items-center gap-2 mb-4">
          <Heart size={16} className="text-primary" />
          <h3 className="font-display text-base font-semibold text-foreground">Données de Santé</h3>
        </div>
        <AppleHealthCard
          onCycleSync={(lmpDate) => {
            onProfileUpdate({ lmpDate });
          }}
        />
      </motion.div>

      {/* ── Actions ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="bg-card rounded-3xl p-5 shadow-card border border-border/40"
      >
        <h3 className="font-display text-base font-semibold mb-4 text-foreground">Mon Compte</h3>

        <div className="flex flex-col gap-2.5">

          {/* ── Restart Onboarding ── */}
          <button
            onClick={onRestartOnboarding}
            className="w-full flex items-center gap-3 py-3 px-4 rounded-2xl border border-border bg-background hover:border-primary/50 transition-all text-left active:scale-95"
          >
            <RefreshCcw size={15} className="text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Recommencer la configuration</p>
              <p className="text-[11px] text-muted-foreground">Reconfigurer le mode, la date, les préférences</p>
            </div>
            <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />
          </button>

          {/* ── Reset Cycle ── */}
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full flex items-center gap-3 py-3 px-4 rounded-2xl border border-border bg-background hover:border-primary/50 transition-all text-left active:scale-95"
            >
              <RotateCcw size={15} className="text-primary flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Réinitialiser mon cycle</p>
                <p className="text-[11px] text-muted-foreground">Remet le compteur à J1 pour aujourd'hui</p>
              </div>
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-rose-mist border border-secondary/60 rounded-2xl p-4"
            >
              <p className="text-sm font-semibold text-foreground mb-1">Confirmer la réinitialisation ?</p>
              <p className="text-xs text-muted-foreground mb-3">
                Aujourd'hui sera enregistré comme J1. Tes saisies sont conservées.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground bg-background">
                  Annuler
                </button>
                <button onClick={handleReset} className="flex-1 py-2 rounded-xl gradient-hero text-primary-foreground text-sm font-semibold">
                  Confirmer
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Reset Data ── */}
          {!showResetDataConfirm ? (
            <button
              onClick={() => setShowResetDataConfirm(true)}
              className="w-full flex items-center gap-3 py-3 px-4 rounded-2xl border border-orange-200 bg-background hover:border-orange-400 transition-all text-left active:scale-95"
            >
              <Trash2 size={15} className="text-[hsl(38_75%_45%)] flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Effacer mes données</p>
                <p className="text-[11px] text-muted-foreground">Supprime l'historique, les saisies et les symptômes</p>
              </div>
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[hsl(38_75%_96%)] border border-[hsl(38_75%_70%)] rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={14} className="text-[hsl(38_65%_42%)] flex-shrink-0" />
                <p className="text-sm font-semibold text-foreground">Effacer toutes mes données ?</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Supprime les saisies, symptômes, données de ménopause et l'historique de nutrition. Ton profil est conservé.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowResetDataConfirm(false)} className="flex-1 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground bg-background">
                  Annuler
                </button>
                <button onClick={() => { onResetData(); setShowResetDataConfirm(false); }} className="flex-1 py-2 rounded-xl bg-[hsl(38_75%_55%)] text-white text-sm font-semibold">
                  Confirmer
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Logout ── */}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 py-3 px-4 rounded-2xl border border-border bg-background hover:border-primary/50 transition-all text-left active:scale-95"
          >
            <LogOut size={15} className="text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Se déconnecter</p>
              <p className="text-[11px] text-muted-foreground">Revenir à l'écran d'accueil</p>
            </div>
          </button>

          {/* ── Delete Account ── */}
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center gap-3 py-3 px-4 rounded-2xl border border-destructive/30 bg-background hover:border-destructive/70 transition-all text-left active:scale-95"
            >
              <Trash2 size={15} className="text-destructive flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-destructive">Supprimer mon compte</p>
                <p className="text-[11px] text-muted-foreground">Suppression définitive de toutes tes données</p>
              </div>
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-destructive/5 border border-destructive/40 rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={14} className="text-destructive flex-shrink-0" />
                <p className="text-sm font-semibold text-destructive">Suppression définitive</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Cette action est irréversible. Ton profil, toutes tes données et ton historique seront effacés définitivement.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground bg-background">
                  Annuler
                </button>
                <button onClick={onDeleteAccount} className="flex-1 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold">
                  Supprimer
                </button>
              </div>
            </motion.div>
          )}

        </div>
      </motion.div>

      {/* ── About LUNAYA ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-3xl overflow-hidden gradient-autumn p-5 text-primary-foreground shadow-soft"
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🌙</span>
          <h3 className="font-display text-base font-bold">LUNAYA</h3>
        </div>
        <p className="text-sm opacity-90 leading-relaxed">
          Coach en Intelligence Hormonale · Méthode symptothermique · Version 1.0
        </p>
        <p className="text-[11px] opacity-70 mt-2">© 2026 LUNAYA · Conçu avec ♡ pour votre bien-être</p>
      </motion.div>

    </div>
  );
}

