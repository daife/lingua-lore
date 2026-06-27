export type RiskLevel = "low" | "medium" | "high";

export interface Dialogue {
  speaker: string;
  text: string;
}

export interface SceneStatus {
  location: string;
  mood: string;
  current_objective: string;
}

export interface ChoiceOutput {
  label: "A" | "B" | "C";
  text: string;
  intent: string;
  risk: RiskLevel;
}

export interface StateUpdate {
  key: string;
  value: string;
  reason: string;
}

export interface MemoryCandidate {
  character_id: string;
  content: string;
  importance: number;
  tags: string[];
}

export interface RelationshipUpdate {
  character_id: string;
  dimension: string;
  delta: number;
  reason: string;
}

export interface TurnOutput {
  narration: string;
  dialogues: Dialogue[];
  turn_summary: string;
  scene_status: SceneStatus;
  choices: ChoiceOutput[];
  state_updates: StateUpdate[];
  memory_candidates: MemoryCandidate[];
  relationship_updates: RelationshipUpdate[];
}
