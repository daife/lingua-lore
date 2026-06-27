import { create } from "zustand";
import type { ApiProfile, ChoiceOutput, StoryTurnResult, TurnOutput, WorldRecord } from "../lib/types";

export interface ReaderTurn {
  id: string;
  output: TurnOutput;
}

interface AppStore {
  worlds: WorldRecord[];
  activeWorld?: WorldRecord;
  activeSceneId?: string;
  apiProfile?: ApiProfile | null;
  turns: ReaderTurn[];
  choices: ChoiceOutput[];
  loading: boolean;
  error?: string;
  setWorlds: (worlds: WorldRecord[]) => void;
  setActiveWorld: (world: WorldRecord, sceneId: string) => void;
  setApiProfile: (profile: ApiProfile | null) => void;
  pushTurn: (result: StoryTurnResult) => void;
  setLoading: (loading: boolean) => void;
  setError: (error?: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  worlds: [],
  turns: [],
  choices: [],
  loading: false,
  setWorlds: (worlds) => set({ worlds }),
  setActiveWorld: (activeWorld, activeSceneId) =>
    set({ activeWorld, activeSceneId, turns: [], choices: [] }),
  setApiProfile: (apiProfile) => set({ apiProfile }),
  pushTurn: (result) =>
    set((state) => ({
      turns: [...state.turns, { id: result.turn_id, output: result.output }],
      choices: result.output.choices
    })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error })
}));
