import { useState, useCallback } from "react";
import { CycleState, DailyEntry, detectPhase, CycleMode } from "@/lib/cycleEngine";
import { calcCurrentDay, UserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";

const ENTRIES_KEY = "lunaya_entries";
const DEVICE_ID_KEY = "lunaya_device_id";

// ── Device identifier (persists across sessions, enables AI memory) ───
export function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function loadEntries(): DailyEntry[] {
  try {
    const raw = localStorage.getItem(ENTRIES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DailyEntry[];
  } catch {
    return [];
  }
}

function persistEntries(entries: DailyEntry[]) {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

// ── Sync a single entry to the DB (fire and forget) ──────────────────
async function syncEntryToDb(
  deviceId: string,
  entry: DailyEntry,
  phase: string
): Promise<void> {
  try {
    await supabase.from("daily_entries").upsert(
      {
        device_id: deviceId,
        cycle_day: entry.day,
        entry_date: entry.date,
        phase,
        sleep_hours: entry.sleepHours ?? null,
        weight_kg: entry.weightKg ?? null,
        temperature: entry.temperature ?? null,
        symptoms: entry.symptoms ?? [],
        eat_log: entry.eatLog ?? null,
        move_log: entry.moveLog ?? null,
        do_log: entry.doLog ?? null,
        notes: entry.notes ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "device_id,entry_date" }
    );
  } catch (err) {
    console.warn("DB sync failed (non-critical):", err);
  }
}

// ── Save a completed cycle to history (for adaptive cycle learning) ───
export async function saveCycleToHistory(
  deviceId: string,
  cycleStartDate: string,
  cycleLength: number,
  periodDuration: number
): Promise<void> {
  try {
    await supabase.from("cycle_history").insert({
      device_id: deviceId,
      cycle_start_date: cycleStartDate,
      cycle_length: cycleLength,
      period_duration: periodDuration,
    });
  } catch (err) {
    console.warn("Cycle history save failed (non-critical):", err);
  }
}

const buildInitialState = (profile: UserProfile | null): CycleState => {
  const savedEntries = loadEntries();

  let currentDay = 5;
  let cycleLength = 28;
  let mode: CycleMode = "natural";

  if (profile) {
    cycleLength = profile.cycleLength;
    currentDay = calcCurrentDay(profile.lmpDate, cycleLength);
    if (profile.cycleType === "hormonal") mode = "hormonal";
    else if (profile.cycleType === "menopause") mode = "menopause";
    else mode = "natural";
  }

  const base: CycleState = {
    currentDay,
    cycleLength,
    phase: "winter",
    mode,
    entries: savedEntries.length > 0 ? savedEntries : [],
    ovulationDay: cycleLength - 14, // Luteal phase fixed at 14 days
    periodDuration: profile?.periodDuration ?? 5,
  };
  return { ...base, phase: detectPhase(base) };
};

/** Detect if 3 consecutive temps are 0.3°C above prior 6-day mean */
export function detectThermalShift(entries: DailyEntry[]): boolean {
  const temps = [...entries]
    .filter((e) => e.temperature)
    .sort((a, b) => a.day - b.day);
  if (temps.length < 9) return false;
  const last6 = temps.slice(-9, -3).map((e) => e.temperature!);
  const mean = last6.reduce((a, b) => a + b, 0) / last6.length;
  const last3 = temps.slice(-3).map((e) => e.temperature!);
  return last3.every((t) => t > mean + 0.3);
}

export function useCycleStore(profile: UserProfile | null) {
  const [state, setState] = useState<CycleState>(() => buildInitialState(profile));

  const addEntry = useCallback((entry: Partial<DailyEntry>) => {
    setState((prev) => {
      const existing = prev.entries.findIndex((e) => e.day === prev.currentDay);
      const newEntry: DailyEntry = {
        day: prev.currentDay,
        date: new Date().toISOString().split("T")[0],
        ...entry,
      };
      const newEntries =
        existing >= 0
          ? prev.entries.map((e, i) => (i === existing ? { ...e, ...entry } : e))
          : [...prev.entries, newEntry];

      persistEntries(newEntries);
      const newState = { ...prev, entries: newEntries };
      const finalState = { ...newState, phase: detectPhase(newState) };

      // Sync to DB asynchronously (non-blocking)
      const deviceId = getOrCreateDeviceId();
      syncEntryToDb(deviceId, newEntry, finalState.phase).catch(() => {});

      return finalState;
    });
  }, []);

  const setMode = useCallback((mode: CycleMode) => {
    setState((prev) => {
      const newState = { ...prev, mode };
      return { ...newState, phase: detectPhase(newState) };
    });
  }, []);

  const setCurrentDay = useCallback((day: number) => {
    setState((prev) => {
      const clamped = Math.max(1, Math.min(prev.cycleLength, day));
      const newState = { ...prev, currentDay: clamped };
      return { ...newState, phase: detectPhase(newState) };
    });
  }, []);

  const setCycleLength = useCallback((length: number) => {
    setState((prev) => {
      const clamped = Math.max(20, Math.min(45, length));
      const newState = { ...prev, cycleLength: clamped };
      return { ...newState, phase: detectPhase(newState) };
    });
  }, []);

  /** Recalculate real day from LMP when profile changes */
  const syncFromProfile = useCallback((p: UserProfile) => {
    setState((prev) => {
      const realDay = calcCurrentDay(p.lmpDate, p.cycleLength);
      const mode: CycleMode =
        p.cycleType === "hormonal"
          ? "hormonal"
          : p.cycleType === "menopause"
          ? "menopause"
          : p.cycleType === "postpartum"
          ? "postpartum"
          : "natural";
      const newState = {
        ...prev,
        currentDay: realDay,
        cycleLength: p.cycleLength,
        mode,
        periodDuration: p.periodDuration ?? 5,
      };
      return { ...newState, phase: detectPhase(newState) };
    });
  }, []);

  // Match by today's actual calendar date — not cycle day number
  // This ensures symptoms reset every real day, even if cycle day stays the same
  const todayDateStr = new Date().toISOString().split("T")[0];
  const todayEntry = state.entries.find((e) => e.date === todayDateStr);
  const thermalShiftDetected = detectThermalShift(state.entries);

  return {
    state,
    todayEntry,
    thermalShiftDetected,
    addEntry,
    setMode,
    setCurrentDay,
    setCycleLength,
    syncFromProfile,
  };
}
