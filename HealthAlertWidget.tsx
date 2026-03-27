// src/components/HealthAlertWidget.tsx
// LUNAYA – Widget de détection des signaux d'alerte santé

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, ChevronDown, Phone } from "lucide-react";
import { HEALTH_ALERTS, HealthAlert } from "@/lib/postPartumEngine";

interface HealthAlertWidgetProps {
  mode: "postpartum" | "menopause";
  activeSymptoms?: string[];
}

export function HealthAlertWidget({ mode, activeSymptoms = [] }: HealthAlertWidgetProps) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);

  // Filtrer les alertes pertinentes pour ce mode
  const relevantAlerts = HEALTH_ALERTS.filter(
    (a) => a.mode === mode || a.mode === "both"
  );

  // Alertes déclenchées par les symptômes actifs
  const triggeredAlerts = relevantAlerts.filter(
    (a) =>
      !dismissed.includes(a.id) &&
      (activeSymptoms.some((s) => a.symptomTriggers.includes(s)) ||
        activeSymptoms.length === 0) // Affiche toutes si pas de symptômes sélectionnés
  );

  const urgentAlerts = triggeredAlerts.filter((a) => a.severity === "urgent");
  const warningAlerts = triggeredAlerts.filter((a) => a.severity === "warning");

  if (relevantAlerts.length === 0) return null;

  return (
    <div className="bg-card rounded-3xl shadow-card border border-border/40 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left active:bg-muted/30 transition-colors"
      >
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${
            urgentAlerts.length > 0 ? "bg-red-100" : "bg-amber-100"
          }`}
        >
          <AlertTriangle
            size={20}
            className={urgentAlerts.length > 0 ? "text-red-500" : "text-amber-500"}
          />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-base font-semibold">
            Bilan Pépite · Signaux Santé
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {urgentAlerts.length > 0
              ? `${urgentAlerts.length} signal(s) urgent(s) à vérifier`
              : `${warningAlerts.length} point(s) de vigilance`}
          </p>
        </div>
        {urgentAlerts.length > 0 && (
          <span className="text-[9px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full mr-1">
            URGENT
          </span>
        )}
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} className="text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {triggeredAlerts.length === 0 ? (
                <div className="text-center py-4">
                  <span className="text-2xl">✅</span>
                  <p className="text-sm text-muted-foreground mt-2">
                    Aucun signal d'alerte détecté. Continue comme ça !
                  </p>
                </div>
              ) : (
                triggeredAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onDismiss={() => setDismissed((d) => [...d, alert.id])}
                  />
                ))
              )}

              {/* Note légale */}
              <p className="text-[10px] text-muted-foreground text-center pt-1 border-t border-border/40">
                Ces informations sont éducatives et ne remplacent pas un avis médical.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AlertCard({ alert, onDismiss }: { alert: HealthAlert; onDismiss: () => void }) {
  const isUrgent = alert.severity === "urgent";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-3.5 ${
        isUrgent
          ? "bg-red-50 border-red-200"
          : "bg-amber-50 border-amber-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">{alert.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p
              className={`text-xs font-bold ${
                isUrgent ? "text-red-700" : "text-amber-700"
              }`}
            >
              {alert.title}
            </p>
            <button
              onClick={onDismiss}
              className="text-muted-foreground hover:text-foreground flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
            {alert.description}
          </p>
          <div
            className={`flex items-center gap-2 rounded-xl px-3 py-2 ${
              isUrgent ? "bg-red-100" : "bg-amber-100"
            }`}
          >
            {isUrgent && <Phone size={12} className="text-red-600 flex-shrink-0" />}
            <p
              className={`text-[11px] font-semibold ${
                isUrgent ? "text-red-700" : "text-amber-700"
              }`}
            >
              {alert.action}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
