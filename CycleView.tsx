import { CycleState, CycleMode } from "@/lib/cycleEngine";
import { CycleWheel } from "@/components/CycleWheel";
import { MenopauseView } from "@/components/MenopauseView";
import { PostPartumView } from "@/components/PostPartumView";
import { UserProfile } from "@/hooks/useUserProfile";

interface CycleViewProps {
  state: CycleState;
  onModeChange: (mode: CycleMode) => void;
  profile: UserProfile;
  onSaisie: () => void;
  onLogPeriod: () => void;
  onProfileUpdate?: (partial: Partial<UserProfile>) => void;
}

export function CycleView({ state, profile, onSaisie, onLogPeriod, onProfileUpdate }: CycleViewProps) {
  if (state.mode === "menopause") {
    return (
      <MenopauseView
        state={state}
        lmpDate={profile.lmpDate}
        onSaisie={onSaisie}
      />
    );
  }

  if (state.mode === "postpartum") {
    return (
      <PostPartumView
        state={state}
        profile={profile}
        onProfileUpdate={onProfileUpdate ?? (() => {})}
        onSaisie={onSaisie}
      />
    );
  }

  return <CycleWheel state={state} lmpDate={profile.lmpDate} onLogPeriod={onLogPeriod} />;
}
