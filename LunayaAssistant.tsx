import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, ChevronDown } from "lucide-react";

interface AiMessage { role: "user" | "assistant"; content: string; }

const AI_HISTORY_KEY = "lunaya_cycle_ai_history";

function loadHistory(): AiMessage[] {
  try { return JSON.parse(localStorage.getItem(AI_HISTORY_KEY) ?? "[]").slice(-20); }
  catch { return []; }
}
function saveHistory(msgs: AiMessage[]) {
  localStorage.setItem(AI_HISTORY_KEY, JSON.stringify(msgs.slice(-20)));
}

interface LunayaAssistantProps {
  phase?: string;
  symptoms?: string[];
  context?: string; // "cycle" | "menopause" | "postpartum"
  quickQuestions?: string[];
  isBreastfeeding?: boolean;
  ppWeek?: number;
}

// Questions rapides contextualisées par mode
const QUESTIONS_BY_CONTEXT: Record<string, string[]> = {
  cycle: [
    "Pourquoi je me sens fatiguée pendant mes règles ?",
    "Comment réduire les crampes menstruelles ?",
    "Que manger pendant l'ovulation ?",
    "Pourquoi mon humeur change selon les phases ?",
    "Comment améliorer mon sommeil en phase lutéale ?",
  ],
  menopause: [
    "Comment réduire mes bouffées de chaleur naturellement ?",
    "Quels aliments pour protéger mes os en ménopause ?",
    "Comment améliorer mon sommeil perturbé ?",
    "Les phytoestrogènes sont-ils efficaces ?",
    "Faut-il faire un bilan osseux en ménopause ?",
    "Comment gérer la sécheresse vaginale ?",
  ],
  postpartum: [
    "Pourquoi je pleure sans raison ? (baby blues)",
    "Que manger pour récupérer après l'accouchement ?",
    "Ma chute de cheveux est-elle normale ?",
    "Comment soutenir mon allaitement naturellement ?",
    "Quand puis-je reprendre le sport doucement ?",
    "Comment savoir si j'ai une dépression post-partum ?",
  ],
};

function getAssistantConfig(context: string, isBreastfeeding?: boolean, ppWeek?: number) {
  if (context === "postpartum") {
    return {
      emoji: "🤍",
      title: "Demander à LUNAYA",
      subtitle: `Accompagnement post-partum${ppWeek ? ` · Semaine ${ppWeek}` : ""}`,
      placeholder: "Pose ta question en toute confiance…",
    };
  }
  if (context === "menopause") {
    return {
      emoji: "🛡️",
      title: "Demander à LUNAYA",
      subtitle: "Guide ménopause · Prévention & Bien-être",
      placeholder: "Pose ta question sur la ménopause…",
    };
  }
  return {
    emoji: "🌙",
    title: "Demander à LUNAYA",
    subtitle: "Pose tes questions sur ton cycle",
    placeholder: "Pose ta question…",
  };
}

export function LunayaAssistant({ phase, symptoms = [], context = "cycle", quickQuestions, isBreastfeeding, ppWeek }: LunayaAssistantProps) {
  const config = getAssistantConfig(context, isBreastfeeding, ppWeek);
  const questions = quickQuestions ?? QUESTIONS_BY_CONTEXT[context] ?? QUESTIONS_BY_CONTEXT.cycle;
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<AiMessage[]>(loadHistory);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [history, open]);

  const sendQuestion = async (question: string) => {
    if (!question.trim() || loading) return;
    setError("");
    const userMsg: AiMessage = { role: "user", content: question };
    const newHistory = [...history, userMsg];
    setHistory(newHistory);
    saveHistory(newHistory);
    setInput("");
    setLoading(true);

    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

      const res = await fetch(`${SUPABASE_URL}/functions/v1/cycle-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "apikey": SUPABASE_KEY,
        },
        body: JSON.stringify({ question, phase, symptoms, context }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) setError("Trop de requêtes. Réessaie dans un moment.");
        else if (res.status === 402) setError("Crédit IA insuffisant.");
        else setError(data.error ?? "Erreur du service. Réessaie.");
        setLoading(false);
        return;
      }

      const assistantMsg: AiMessage = { role: "assistant", content: data.answer };
      const updated = [...newHistory, assistantMsg];
      setHistory(updated);
      saveHistory(updated);
    } catch {
      setError("Impossible de contacter l'assistant. Vérifie ta connexion.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendQuestion(input); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-3xl shadow-card border border-border/40 overflow-hidden"
    >
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left active:bg-muted/30 transition-colors"
      >
        <div className="w-10 h-10 rounded-2xl gradient-hero flex items-center justify-center text-xl flex-shrink-0">{config.emoji}</div>
        <div className="flex-1">
          <h3 className="font-display text-base font-semibold">{config.title}</h3>
          <p className="text-[11px] text-muted-foreground">{config.subtitle}</p>
        </div>
        {history.length > 0 && (
          <span className="text-[9px] bg-primary/15 text-primary font-bold px-2 py-0.5 rounded-full mr-1">
            {history.filter(m => m.role === "user").length}
          </span>
        )}
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
                    {questions.map((q) => (
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
                  placeholder={config.placeholder}
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
                  <button onClick={() => { setHistory([]); saveHistory([]); setError(""); }}
                    className="text-[10px] text-muted-foreground active:scale-95"
                  >
                    Effacer la conversation
                  </button>
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
