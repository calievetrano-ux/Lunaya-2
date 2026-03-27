import { useState, useCallback } from "react";
import { Capacitor } from "@capacitor/core";

// Dynamic import to avoid errors on web
let HealthKit: any = null;
if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
  import("@perfood/capacitor-healthkit").then((m) => {
    HealthKit = m.CapacitorHealthkit;
  });
}

export interface HealthData {
  sleepHours?: number;       // heures de sommeil la nuit dernière
  steps?: number;            // pas aujourd'hui
  heartRate?: number;        // fréquence cardiaque au repos
  cycleStart?: string;       // date début dernier cycle (Apple Health)
  authorized: boolean;
  available: boolean;
}

const READ_PERMISSIONS = [
  "sleep",
  "steps",
  "heart_rate",
  "menstruation",
];

export function useAppleHealth() {
  const [healthData, setHealthData] = useState<HealthData>({
    authorized: false,
    available: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAvailable =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";

  const requestPermissions = useCallback(async () => {
    if (!isAvailable || !HealthKit) {
      setError("Apple Health n'est disponible que sur iPhone.");
      return false;
    }
    try {
      setLoading(true);
      await HealthKit.requestAuthorization({
        all: [],
        read: READ_PERMISSIONS,
        write: [],
      });
      setHealthData((prev) => ({ ...prev, authorized: true, available: true }));
      return true;
    } catch (e: any) {
      setError("Autorisation refusée ou non disponible.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAvailable]);

  const fetchHealthData = useCallback(async () => {
    if (!isAvailable || !HealthKit) return;
    try {
      setLoading(true);
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      yesterday.setHours(21, 0, 0, 0); // 21h hier

      // Sommeil
      let sleepHours: number | undefined;
      try {
        const sleepRes = await HealthKit.querySampleType({
          sampleName: "sleep",
          startDate: yesterday.toISOString(),
          endDate: now.toISOString(),
          limit: 20,
        });
        if (sleepRes?.resultData?.length) {
          const totalMs = sleepRes.resultData.reduce((sum: number, s: any) => {
            const start = new Date(s.startDate).getTime();
            const end = new Date(s.endDate).getTime();
            return sum + (end - start);
          }, 0);
          sleepHours = Math.round((totalMs / 3600000) * 10) / 10;
        }
      } catch {}

      // Pas
      let steps: number | undefined;
      try {
        const stepsRes = await HealthKit.querySampleType({
          sampleName: "steps",
          startDate: startOfDay.toISOString(),
          endDate: now.toISOString(),
          limit: 100,
        });
        if (stepsRes?.resultData?.length) {
          steps = stepsRes.resultData.reduce(
            (sum: number, s: any) => sum + (s.value ?? 0),
            0
          );
        }
      } catch {}

      // Fréquence cardiaque
      let heartRate: number | undefined;
      try {
        const hrRes = await HealthKit.querySampleType({
          sampleName: "heart_rate",
          startDate: startOfDay.toISOString(),
          endDate: now.toISOString(),
          limit: 10,
        });
        if (hrRes?.resultData?.length) {
          const vals = hrRes.resultData.map((s: any) => s.value);
          heartRate = Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length);
        }
      } catch {}

      // Cycle menstruel (dernière date de début)
      let cycleStart: string | undefined;
      try {
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        const cycleRes = await HealthKit.querySampleType({
          sampleName: "menstruation",
          startDate: threeMonthsAgo.toISOString(),
          endDate: now.toISOString(),
          limit: 10,
        });
        if (cycleRes?.resultData?.length) {
          const sorted = [...cycleRes.resultData].sort(
            (a: any, b: any) =>
              new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          );
          cycleStart = sorted[0].startDate.split("T")[0];
        }
      } catch {}

      setHealthData({
        authorized: true,
        available: true,
        sleepHours,
        steps,
        heartRate,
        cycleStart,
      });
    } catch (e: any) {
      setError("Impossible de récupérer les données.");
    } finally {
      setLoading(false);
    }
  }, [isAvailable]);

  return {
    healthData,
    loading,
    error,
    isAvailable,
    requestPermissions,
    fetchHealthData,
  };
}
