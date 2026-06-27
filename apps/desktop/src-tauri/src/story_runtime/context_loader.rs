use anyhow::Result;
use rusqlite::{params, Connection};
use serde::Serialize;

use crate::domain::{StoryInputKind, StoryTurnInput};

#[derive(Debug, Clone, Serialize)]
pub struct StoryContext {
    pub world_profile: WorldProfileContext,
    pub current_scene: SceneContext,
    pub characters: Vec<CharacterContext>,
    pub story_state: Vec<KeyValueContext>,
    pub recent_messages: Vec<MessageContext>,
    pub recent_summaries: Vec<String>,
    pub user_action: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct WorldProfileContext {
    pub title: String,
    pub description: String,
    pub genre: String,
    pub target_language: String,
    pub language_level: String,
    pub narrative_style: String,
    pub system_prompt: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct SceneContext {
    pub id: String,
    pub title: String,
    pub location: String,
    pub mood: String,
    pub current_objective: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct CharacterContext {
    pub id: String,
    pub name: String,
    pub role: String,
    pub personality: String,
    pub background: String,
    pub speaking_style: String,
    pub relationship_to_player: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct KeyValueContext {
    pub key: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct MessageContext {
    pub role: String,
    pub speaker: Option<String>,
    pub content: String,
}

pub fn load_context(conn: &Connection, input: &StoryTurnInput) -> Result<StoryContext> {
    let world_profile = conn.query_row(
        "SELECT title, description, genre, target_language, language_level, narrative_style, system_prompt
         FROM world_profile LIMIT 1",
        [],
        |row| {
            Ok(WorldProfileContext {
                title: row.get(0)?,
                description: row.get(1)?,
                genre: row.get(2)?,
                target_language: row.get(3)?,
                language_level: row.get(4)?,
                narrative_style: row.get(5)?,
                system_prompt: row.get(6)?,
            })
        },
    )?;

    let current_scene = conn.query_row(
        "SELECT id, title, location, mood, COALESCE(current_objective, '')
         FROM scenes WHERE id = ?1",
        params![input.scene_id],
        |row| {
            Ok(SceneContext {
                id: row.get(0)?,
                title: row.get(1)?,
                location: row.get(2)?,
                mood: row.get(3)?,
                current_objective: row.get(4)?,
            })
        },
    )?;

    let characters = query_characters(conn)?;
    let story_state = query_state(conn)?;
    let recent_messages = query_recent_messages(conn, &input.scene_id)?;
    let recent_summaries = query_recent_summaries(conn, &input.scene_id)?;
    let user_action = match &input.input {
        StoryInputKind::FreeText { text } => text.clone(),
        StoryInputKind::Choice { choice_id } => conn
            .query_row(
                "SELECT label || ': ' || text FROM branch_choices WHERE id = ?1",
                params![choice_id],
                |row| row.get(0),
            )
            .unwrap_or_else(|_| format!("Selected choice {choice_id}")),
    };

    Ok(StoryContext {
        world_profile,
        current_scene,
        characters,
        story_state,
        recent_messages,
        recent_summaries,
        user_action,
    })
}

fn query_characters(conn: &Connection) -> Result<Vec<CharacterContext>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, role, personality, background, speaking_style, relationship_to_player
         FROM characters ORDER BY created_at ASC LIMIT 8",
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(CharacterContext {
            id: row.get(0)?,
            name: row.get(1)?,
            role: row.get(2)?,
            personality: row.get(3)?,
            background: row.get(4)?,
            speaking_style: row.get(5)?,
            relationship_to_player: row.get(6)?,
        })
    })?;
    Ok(rows.collect::<rusqlite::Result<Vec<_>>>()?)
}

fn query_state(conn: &Connection) -> Result<Vec<KeyValueContext>> {
    let mut stmt = conn.prepare("SELECT key, value FROM story_state ORDER BY key LIMIT 80")?;
    let rows = stmt.query_map([], |row| {
        Ok(KeyValueContext {
            key: row.get(0)?,
            value: row.get(1)?,
        })
    })?;
    Ok(rows.collect::<rusqlite::Result<Vec<_>>>()?)
}

fn query_recent_messages(conn: &Connection, scene_id: &str) -> Result<Vec<MessageContext>> {
    let mut stmt = conn.prepare(
        "SELECT role, speaker, content FROM messages
         WHERE scene_id = ?1
         ORDER BY created_at DESC LIMIT 12",
    )?;
    let rows = stmt.query_map(params![scene_id], |row| {
        Ok(MessageContext {
            role: row.get(0)?,
            speaker: row.get(1)?,
            content: row.get(2)?,
        })
    })?;
    let mut items = rows.collect::<rusqlite::Result<Vec<_>>>()?;
    items.reverse();
    Ok(items)
}

fn query_recent_summaries(conn: &Connection, scene_id: &str) -> Result<Vec<String>> {
    let mut stmt = conn.prepare(
        "SELECT summary FROM turns WHERE scene_id = ?1 ORDER BY created_at DESC LIMIT 8",
    )?;
    let rows = stmt.query_map(params![scene_id], |row| row.get(0))?;
    let mut items = rows.collect::<rusqlite::Result<Vec<_>>>()?;
    items.reverse();
    Ok(items)
}
