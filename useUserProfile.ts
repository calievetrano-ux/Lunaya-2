import { useState, useCallback } from "react";
import { CycleMode } from "@/lib/cycleEngine";

export interface PeriodRecord {
  startDate: string;
  endDate: string;
  intensity: "light" | "medium" | "heavy";
  cycleLength?: number;
}

export interface UserProfile {
  firstName: string;
  age: number;
  cycleType: CycleMode | "postpartum";
  lmpDate: string; // ISO date string of last menstrual period
  cycleLength: number;
  periodDuration: number; // average period duration in days
  periodHistory?: PeriodRecord[];
  // Body metrics (persistent)
  heightCm?: number;  // height in cm
  weightKg?: number;  // last logged weight in kg
  // Post-partum specific
  isBreastfeeding?: boolean;
  birthDate?: string; // ISO date of delivery (for PP timeline)
}

const STORAGE_KEY = "lunaya_profile";

function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as UserProfile;
    // backfill default periodDuration if not present
    if (!p.periodDuration) p.periodDuration = 5;
    return p;
  } catch {
    return null;
  }
}

function saveProfile(profile: UserProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

/** Calculate the current cycle day from LMP date */
export function calcCurrentDay(lmpDate: string, cycleLength: number): number {
  const lmp = new Date(lmpDate);
  const today = new Date();
  const diffMs = today.getTime() - lmp.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const day = (diffDays % cycleLength) + 1;
  return Math.max(1, Math.min(cycleLength, day));
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(loadProfile);

  const saveAndSet = useCallback((p: UserProfile) => {
    saveProfile(p);
    setProfile(p);
  }, []);

  const updateProfile = useCallback(
    (partial: Partial<UserProfile>) => {
      if (!profile) return;
      const updated = { ...profile, ...partial };
      saveAndSet(updated);
    },
    [profile, saveAndSet]
  );

  const resetCycle = useCallback(() => {
    if (!profile) return;
    const today = new Date().toISOString().split("T")[0];
    const updated = { ...profile, lmpDate: today };
    saveAndSet(updated);
  }, [profile, saveAndSet]);

  const clearProfile = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setProfile(null);
  }, []);

  /** Log a period: updates LMP, computes period duration & stores history */
  const logPeriod = useCallback(
    (entry: { startDate: string; endDate: string; intensity: "light" | "medium" | "heavy" }) => {
      if (!profile) return;

      const start = new Date(entry.startDate);
      const end = new Date(entry.endDate);
      const duration = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;

      // Compute new cycle length if previous LMP exists
      const prevLmp = profile.lmpDate ? new Date(profile.lmpDate) : null;
      let newCycleLength = profile.cycleLength;
      if (prevLmp) {
        const prevCycleLen = Math.round(
          (start.getTime() - prevLmp.getTime()) / 86400000
        );
        // Only trust if plausible (20-45 days)
        if (prevCycleLen >= 20 && prevCycleLen <= 45) {
          newCycleLength = prevCycleLen;
        }
      }

      // Rolling average for period duration (last 3 records)
      const history: PeriodRecord[] = [
        ...(profile.periodHistory ?? []).slice(-2),
        { ...entry, cycleLength: newCycleLength },
      ];
      const avgDuration = Math.round(
        history.map((h) => {
          const s = new Date(h.startDate);
          const e = new Date(h.endDate);
          return Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
        }).reduce((a, b) => a + b, 0) / history.length
      );

      const updated: UserProfile = {
        ...profile,
        lmpDate: entry.startDate,
        cycleLength: newCycleLength,
        periodDuration: avgDuration,
        periodHistory: history,
      };
      saveAndSet(updated);
    },
    [profile, saveAndSet]
  );

  return { profile, saveAndSet, updateProfile, resetCycle, clearProfile, logPeriod };
}
