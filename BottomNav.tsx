import { motion } from "framer-motion";

type Tab = "today" | "cycle" | "calendar" | "profile";

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const NAV_ITEMS: { id: Tab; label: string; icon: string }[] = [
  { id: "today", label: "Aujourd'hui", icon: "✦" },
  { id: "cycle", label: "Mon Cycle", icon: "◎" },
  { id: "calendar", label: "Calendrier", icon: "▦" },
  { id: "profile", label: "Profil", icon: "⬡" },
];

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-end pb-safe bg-card/90 backdrop-blur-md border-t border-border/50 px-2 pt-2 pb-4 max-w-[480px] mx-auto">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className="relative flex flex-col items-center gap-1 px-3 py-1 min-w-[64px] group"
        >
          {active === item.id && (
            <motion.div
              layoutId="nav-pill"
              className="absolute inset-0 rounded-xl"
              style={{ background: "hsl(var(--terracotta-light))" }}
              transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
            />
          )}
          <span
            className={`relative z-10 text-xl transition-all duration-200 ${
              active === item.id
                ? "text-terracotta scale-110"
                : "text-muted-foreground group-hover:text-foreground"
            }`}
          >
            {item.icon}
          </span>
          <span
            className={`relative z-10 text-[10px] font-medium tracking-wide transition-colors duration-200 ${
              active === item.id ? "text-terracotta" : "text-muted-foreground"
            }`}
          >
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
