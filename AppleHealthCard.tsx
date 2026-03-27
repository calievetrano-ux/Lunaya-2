import { useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useAppleHealth } from "@/hooks/useAppleHealth";

interface AppleHealthCardProps {
  onCycleSync?: (lmpDate: string) => void;
}

export function AppleHealthCard({ onCycleSync }: AppleHealthCardProps) {
  const {
    healthData,
    loading,
    error,
    isAvailable,
    requestPermissions,
    fetchHealthData,
  } = useAppleHealth();

  // Auto-fetch si déjà autorisé
  useEffect(() => {
    if (healthData.authorized) fetchHealthData();
  }, [healthData.authorized]);

  // Propose de synchroniser la date LMP si détectée
  useEffect(() => {
    if (healthData.cycleStart && onCycleSync) {
      onCycleSync(healthData.cycleStart);
    }
  }, [healthData.cycleStart]);

  if (!isAvailable) {
    return (
      <div className="bg-card rounded-2xl p-4 border border-border/40 flex items-center gap-3">
        <span className="text-2xl">🍎</span>
        <div>
          <p className="text-sm font-semibold text-foreground">Apple Health</p>
          <p className="text-xs text-muted-foreground">Disponible uniquement sur iPhone</p>
        </div>
      </div>
    );
  }

  if (!healthData.authorized) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[hsl(340_30%_96%)] to-[hsl(18_52%_97%)] rounded-2xl p-4 border border-[hsl(340_30%_85%)] shadow-card"
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🍎</span>
          <div>
            <p className="text-sm font-semibold text-foreground">Connecter Apple Health</p>
            <p className="text-xs text-muted-foreground">Sync sommeil, pas, cycles</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
          Autorise LUNAYA à lire tes données de santé pour enrichir automatiquement ton suivi : date de tes règles, qualité de sommeil, activité physique.
        </p>
        {error && (
          <p className="text-xs text-destructive mb-2">⚠️ {error}</p>
        )}
        <button
          onClick={requestPermissions}
          disabled={loading}
          className="w-full gradient-hero text-primary-foreground font-semibold py-2.5 rounded-xl text-sm shadow-soft active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 size={14} className="animate-spin" /> Connexion...</>
          ) : (
            "🔗 Autoriser Apple Health"
          )}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-4 border border-border/40 shadow-card"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🍎</span>
          <p className="text-sm font-semibold text-foreground">Apple Health</p>
          <span className="text-[10px] bg-[hsl(142_50%_90%)] text-[hsl(142_50%_35%)] px-2 py-0.5 rounded-full font-semibold">Connecté</span>
        </div>
        <button
          onClick={fetchHealthData}
          disabled={loading}
          className="text-[11px] font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full active:scale-95 disabled:opacity-50"
        >
          {loading ? <Loader2 size={10} className="animate-spin inline" /> : "Actualiser"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          {
            emoji: "😴",
            label: "Sommeil",
            value: healthData.sleepHours != null ? `${healthData.sleepHours}h` : "—",
            sub: "nuit dernière",
          },
          {
            emoji: "👟",
            label: "Pas",
            value: healthData.steps != null ? healthData.steps.toLocaleString("fr-FR") : "—",
            sub: "aujourd'hui",
          },
          {
            emoji: "❤️",
            label: "Fréq. cardiaque",
            value: healthData.heartRate != null ? `${healthData.heartRate} bpm` : "—",
            sub: "au repos",
          },
          {
            emoji: "🩸",
            label: "Dernier cycle",
            value: healthData.cycleStart
              ? new Date(healthData.cycleStart + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
              : "—",
            sub: "depuis Apple Health",
          },
        ].map((item) => (
          <div key={item.label} className="bg-background rounded-xl p-3 border border-border/40">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">{item.emoji}</span>
              <p className="text-[10px] text-muted-foreground font-medium">{item.label}</p>
            </div>
            <p className="font-display text-base font-bold text-foreground">{item.value}</p>
            <p className="text-[9px] text-muted-foreground">{item.sub}</p>
          </div>
        ))}
      </div>

      {healthData.cycleStart && onCycleSync && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 bg-primary/8 rounded-xl px-3 py-2.5 border border-primary/20 flex items-center justify-between"
        >
          <p className="text-xs text-foreground flex-1 leading-relaxed">
            📅 Cycle détecté le{" "}
            <strong>
              {new Date(healthData.cycleStart + "T12:00:00").toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
              })}
            </strong>{" "}
            — synchroniser dans LUNAYA ?
          </p>
          <button
            onClick={() => onCycleSync(healthData.cycleStart!)}
            className="ml-2 text-[11px] font-semibold text-primary-foreground bg-primary px-3 py-1.5 rounded-lg active:scale-95 flex-shrink-0"
          >
            Sync
          </button>
        </motion.div>
      )}

      {error && <p className="text-xs text-destructive mt-2">⚠️ {error}</p>}
    </motion.div>
  );
}
