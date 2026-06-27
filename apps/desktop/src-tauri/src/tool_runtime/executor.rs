use anyhow::Result;
use rusqlite::{params, Connection};
use serde::Deserialize;
use serde_json::{json, Value};

#[derive(Debug, Deserialize)]
struct CharacterProfileArgs {
    character_id: String,
}

#[derive(Debug, Deserialize)]
struct CharacterMemoryArgs {
    character_id: String,
    query: String,
    limit: i64,
}

#[derive(Debug, Deserialize)]
struct QueryArgs {
    query: String,
    limit: i64,
}

pub fn execute_readonly(conn: &Connection, name: &str, arguments: &str) -> Result<Value> {
    match name {
        "query_character_profile" => query_character_profile(conn, arguments),
        "query_character_memory" => query_character_memory(conn, arguments),
        "query_past_events" => query_past_events(conn, arguments),
        other => Ok(json!({"items": [], "error": format!("Unknown read-only tool: {other}")})),
    }
}

fn query_character_profile(conn: &Connection, arguments: &str) -> Result<Value> {
    let args: CharacterProfileArgs = serde_json::from_str(arguments)?;
    let result = conn.query_row(
        "SELECT id, name, role, personality, background, speaking_style, relationship_to_player, is_player_character
         FROM characters WHERE id = ?1",
        params![args.character_id],
        |row| {
            Ok(json!({
                "source_id": row.get::<_, String>(0)?,
                "name": row.get::<_, String>(1)?,
                "role": row.get::<_, String>(2)?,
                "personality": row.get::<_, String>(3)?,
                "background": row.get::<_, String>(4)?,
                "speaking_style": row.get::<_, String>(5)?,
                "relationship_to_player": row.get::<_, Option<String>>(6)?,
                "is_player_character": row.get::<_, i64>(7)? == 1
            }))
        },
    );
    match result {
        Ok(item) => Ok(json!({ "items": [item] })),
        Err(_) => Ok(json!({ "items": [], "note": "No matching character found." })),
    }
}

fn query_character_memory(conn: &Connection, arguments: &str) -> Result<Value> {
    let args: CharacterMemoryArgs = serde_json::from_str(arguments)?;
    let limit = args.limit.clamp(1, 10);
    let like = format!("%{}%", args.query);
    let mut stmt = conn.prepare(
        "SELECT id, content, importance, tags, created_at FROM memories
         WHERE character_id = ?1 AND content LIKE ?2
         ORDER BY importance DESC, created_at DESC LIMIT ?3",
    )?;
    let rows = stmt.query_map(params![args.character_id, like, limit], |row| {
        Ok(json!({
            "source_id": row.get::<_, String>(0)?,
            "content": row.get::<_, String>(1)?,
            "importance": row.get::<_, i64>(2)?,
            "tags": row.get::<_, String>(3)?,
            "created_at": row.get::<_, String>(4)?
        }))
    })?;
    collect_tool_rows(rows)
}

fn query_past_events(conn: &Connection, arguments: &str) -> Result<Value> {
    let args: QueryArgs = serde_json::from_str(arguments)?;
    let limit = args.limit.clamp(1, 10);
    let like = format!("%{}%", args.query);
    let mut stmt = conn.prepare(
        "SELECT id, summary, created_at FROM turns
         WHERE summary LIKE ?1
         ORDER BY created_at DESC LIMIT ?2",
    )?;
    let rows = stmt.query_map(params![like, limit], |row| {
        Ok(json!({
            "source_id": row.get::<_, String>(0)?,
            "summary": row.get::<_, String>(1)?,
            "created_at": row.get::<_, String>(2)?
        }))
    })?;
    collect_tool_rows(rows)
}

fn collect_tool_rows<I>(rows: I) -> Result<Value>
where
    I: Iterator<Item = rusqlite::Result<Value>>,
{
    let items = rows.collect::<rusqlite::Result<Vec<_>>>()?;
    if items.is_empty() {
        Ok(json!({"items": [], "note": "No matching result found."}))
    } else {
        Ok(json!({"items": items}))
    }
}
