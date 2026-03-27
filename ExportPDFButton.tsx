// src/components/ExportPDFButton.tsx
// LUNAYA – Export PDF "Partager avec mon médecin"

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Loader2, Check } from "lucide-react";

interface ExportPDFButtonProps {
  mode: string;
  symptoms?: string[];
  currentDay?: number;
  phase?: string;
  firstName?: string;
  isBreastfeeding?: boolean;
  birthDate?: string;
}

export function ExportPDFButton({
  mode,
  symptoms = [],
  currentDay = 1,
  phase = "",
  firstName = "Utilisatrice",
  isBreastfeeding,
  birthDate,
}: ExportPDFButtonProps) {
  const [status, setStatus] = useState<"idle" | "generating" | "done">("idle");

  const generateReport = async () => {
    setStatus("generating");

    // Génère le HTML du rapport
    const today = new Date().toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const modeLabel =
      mode === "postpartum"
        ? "Post-Partum"
        : mode === "menopause"
        ? "Ménopause"
        : mode === "hormonal"
        ? "Contraception Hormonale"
        : "Cycle Naturel";

    const symptomsSection =
      symptoms.length > 0
        ? `<ul>${symptoms.map((s) => `<li>${s}</li>`).join("")}</ul>`
        : "<p>Aucun symptôme enregistré ce jour.</p>";

    const ppSection =
      mode === "postpartum"
        ? `
      <h2>Informations Post-Partum</h2>
      <table>
        <tr><td><b>Date d'accouchement estimée</b></td><td>${birthDate ?? "Non renseigné"}</td></tr>
        <tr><td><b>Allaitement</b></td><td>${isBreastfeeding ? "Oui (besoins : +500 kcal/j, +1L eau)" : "Non"}</td></tr>
      </table>
    `
        : "";

    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bilan LUNAYA – ${firstName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Georgia, serif; color: #2d2d2d; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { border-bottom: 3px solid #c8a882; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 28px; font-weight: bold; color: #8b5e3c; letter-spacing: 4px; }
    .subtitle { color: #888; font-size: 13px; margin-top: 4px; }
    h1 { font-size: 20px; margin-top: 8px; color: #2d2d2d; }
    h2 { font-size: 15px; color: #8b5e3c; margin: 24px 0 12px; border-bottom: 1px solid #e8ddd0; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    td { padding: 8px 12px; border-bottom: 1px solid #f0ebe5; font-size: 13px; }
    td:first-child { font-weight: 600; width: 45%; color: #555; }
    ul { padding-left: 20px; }
    li { font-size: 13px; padding: 3px 0; }
    .note { background: #fdf8f0; border-left: 4px solid #c8a882; padding: 14px 18px; border-radius: 4px; margin-top: 24px; }
    .note p { font-size: 12px; color: #666; line-height: 1.6; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e8ddd0; font-size: 11px; color: #aaa; text-align: center; }
    .tag { display: inline-block; background: #f0ebe5; padding: 3px 10px; border-radius: 20px; font-size: 11px; margin: 2px; }
    @media print {
      body { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">LUNAYA</div>
    <div class="subtitle">Intelligence Hormonale · Bilan Santé Personnel</div>
    <h1>Récapitulatif pour consultation médicale</h1>
  </div>

  <h2>Informations Générales</h2>
  <table>
    <tr><td>Prénom</td><td>${firstName}</td></tr>
    <tr><td>Date du bilan</td><td>${today}</td></tr>
    <tr><td>Mode de suivi</td><td>${modeLabel}</td></tr>
    <tr><td>Jour de cycle / PP</td><td>J${currentDay}</td></tr>
    <tr><td>Phase actuelle</td><td>${phase}</td></tr>
  </table>

  ${ppSection}

  <h2>Symptômes Enregistrés</h2>
  ${symptomsSection}

  <h2>Contexte Hormonal</h2>
  <p style="font-size:13px; line-height:1.7; margin-bottom:12px;">
    ${
      mode === "postpartum"
        ? "La patiente est en période post-partum. Les taux d'œstrogènes et de progestérone ont chuté de ~95% dans les 72h suivant l'accouchement. Le repos ovarien est normal et attendu, particulièrement en cas d'allaitement (inhibition par la prolactine)."
        : mode === "menopause"
        ? "La patiente est en période de ménopause/périménopause. L'estradiol est bas (<30 pg/mL), la progestérone quasi absente, et la FSH élevée (>30 mUI/mL). Une surveillance de la densité osseuse et du profil cardiovasculaire est recommandée."
        : "La patiente suit son cycle hormonal naturel via l'application LUNAYA (méthode symptothermique)."
    }
  </p>

  <div class="note">
    <p><strong>Note importante :</strong> Ce document est généré automatiquement par l'application LUNAYA à titre informatif. Il ne se substitue pas à un diagnostic médical. Les données sont basées sur l'auto-saisie de la patiente.</p>
  </div>

  <div class="footer">
    LUNAYA · Application de santé hormonale féminine · Généré le ${today}
    <br>Ce rapport est confidentiel et destiné à usage médical uniquement.
  </div>
</body>
</html>`;

    // Ouvrir dans un nouvel onglet pour impression/sauvegarde PDF
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LUNAYA_Bilan_${firstName}_${new Date().toISOString().split("T")[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Ouvrir aussi pour impression directe
    const printWindow = window.open(url, "_blank");
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => printWindow.print(), 500);
      };
    }

    setTimeout(() => {
      setStatus("done");
      setTimeout(() => setStatus("idle"), 3000);
    }, 1000);
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={generateReport}
      disabled={status === "generating"}
      className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl font-semibold text-sm transition-all ${
        status === "done"
          ? "bg-green-100 text-green-700 border border-green-200"
          : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 active:scale-97"
      }`}
    >
      {status === "generating" ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          Génération en cours…
        </>
      ) : status === "done" ? (
        <>
          <Check size={18} />
          Rapport téléchargé !
        </>
      ) : (
        <>
          <FileText size={18} />
          Partager avec mon médecin
        </>
      )}
    </motion.button>
  );
}
