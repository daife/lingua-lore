CREATE TABLE IF NOT EXISTS world_profile (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  genre TEXT NOT NULL,
  target_language TEXT NOT NULL,
  language_level TEXT NOT NULL,
  narrative_style TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  personality TEXT NOT NULL,
  background TEXT NOT NULL,
  speaking_style TEXT NOT NULL,
  relationship_to_player TEXT,
  is_player_character INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS scenes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  mood TEXT NOT NULL,
  summary TEXT,
  current_objective TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  scene_id TEXT NOT NULL,
  turn_id TEXT,
  role TEXT NOT NULL,
  speaker TEXT,
  content TEXT NOT NULL,
  message_kind TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS turns (
  id TEXT PRIMARY KEY,
  scene_id TEXT NOT NULL,
  user_message_id TEXT NOT NULL,
  assistant_message_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  raw_output_json TEXT NOT NULL,
  selected_choice_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS branch_choices (
  id TEXT PRIMARY KEY,
  turn_id TEXT NOT NULL,
  label TEXT NOT NULL,
  text TEXT NOT NULL,
  intent TEXT NOT NULL,
  risk TEXT NOT NULL,
  selected INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS story_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS state_update_logs (
  id TEXT PRIMARY KEY,
  turn_id TEXT NOT NULL,
  key TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT NOT NULL,
  reason TEXT NOT NULL,
  applied INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

DROP TABLE IF EXISTS chapters;
DROP TABLE IF EXISTS world_lore;

CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  memory_type TEXT NOT NULL,
  content TEXT NOT NULL,
  importance INTEGER NOT NULL,
  tags TEXT NOT NULL,
  source_turn_id TEXT,
  created_at TEXT NOT NULL,
  last_used_at TEXT
);

CREATE TABLE IF NOT EXISTS memory_candidates (
  id TEXT PRIMARY KEY,
  turn_id TEXT NOT NULL,
  character_id TEXT NOT NULL,
  content TEXT NOT NULL,
  importance INTEGER NOT NULL,
  tags TEXT NOT NULL,
  accepted INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS relationship_state (
  character_id TEXT NOT NULL,
  dimension TEXT NOT NULL,
  value INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (character_id, dimension)
);

CREATE TABLE IF NOT EXISTS relationship_update_logs (
  id TEXT PRIMARY KEY,
  turn_id TEXT NOT NULL,
  character_id TEXT NOT NULL,
  dimension TEXT NOT NULL,
  old_value INTEGER,
  delta INTEGER NOT NULL,
  new_value INTEGER,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL
);
