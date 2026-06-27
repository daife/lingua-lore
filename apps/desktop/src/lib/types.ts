export type RiskLevel = "low" | "medium" | "high";

export interface WorldRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  cover_path?: string | null;
  storage_path: string;
  target_language: string;
  language_level: string;
  created_at: string;
  updated_at: string;
  last_opened_at?: string | null;
}

export interface CreateWorldRequest {
  title: string;
  description: string;
  genre: string;
  target_language: string;
  language_level: string;
  narrative_style: string;
}

export interface ApiProfile {
  id: string;
  name: string;
  base_url: string;
  model: string;
  api_key: string;
  use_strict_tools: boolean;
}

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
  id?: string | null;
  label: "A" | "B" | "C";
  text: string;
  intent: string;
  risk: RiskLevel;
}

export interface TurnOutput {
  narration: string;
  dialogues: Dialogue[];
  turn_summary: string;
  scene_status: SceneStatus;
  choices: ChoiceOutput[];
  state_updates: unknown[];
  memory_candidates: unknown[];
  relationship_updates: unknown[];
}

export interface StoryTurnResult {
  turn_id: string;
  output: TurnOutput;
}

export interface WorldBootstrap {
  world: WorldRecord;
  scene_id: string;
}

export interface TranslationResult {
  source_text: string;
  translated_text: string;
  us_phone: string;
  uk_phone: string;
  related_words: Array<{ key: string; value: string }>;
  phrases: Array<{ key: string; value: string }>;
  example_sentences: string;
  provider: string;
}
