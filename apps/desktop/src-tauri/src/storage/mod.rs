use anyhow::{Context, Result};
use chrono::Utc;
use rusqlite::{params, Connection};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use uuid::Uuid;

use crate::domain::{ApiProfile, CreateWorldRequest, WorldRecord};
use crate::security;

const APP_MIGRATION: &str = include_str!("../../migrations/app/001_init.sql");
const WORLD_MIGRATION: &str = include_str!("../../migrations/world/001_init.sql");

pub struct AppState {
    pub data_dir: PathBuf,
    pub app_db_path: PathBuf,
    pub lock: Mutex<()>,
}

impl AppState {
    pub fn initialize() -> Result<Self> {
        let data_dir = dirs::data_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("LinguaLore");
        fs::create_dir_all(data_dir.join("worlds"))?;
        fs::create_dir_all(data_dir.join("logs"))?;
        let app_db_path = data_dir.join("app.db");
        let conn = Connection::open(&app_db_path)?;
        conn.execute_batch(APP_MIGRATION)?;
        Ok(Self {
            data_dir,
            app_db_path,
            lock: Mutex::new(()),
        })
    }

    pub fn app_conn(&self) -> Result<Connection> {
        Ok(Connection::open(&self.app_db_path)?)
    }

    pub fn world_db_path(&self, world_id: &str) -> PathBuf {
        self.data_dir.join("worlds").join(world_id).join("world.db")
    }

    pub fn open_world_conn(&self, world_id: &str) -> Result<Connection> {
        let path = self.world_db_path(world_id);
        let conn = Connection::open(path)?;
        conn.execute_batch(WORLD_MIGRATION)?;
        Ok(conn)
    }
}

pub fn now() -> String {
    Utc::now().to_rfc3339()
}

pub fn slugify(input: &str) -> String {
    let slug: String = input
        .to_ascii_lowercase()
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() { c } else { '-' })
        .collect();
    slug.split('-').filter(|s| !s.is_empty()).collect::<Vec<_>>().join("-")
}

pub fn list_worlds(state: &AppState) -> Result<Vec<WorldRecord>> {
    let conn = state.app_conn()?;
    let mut stmt = conn.prepare(
        "SELECT id, slug, title, description, cover_path, storage_path, target_language,
                language_level, created_at, updated_at, last_opened_at
         FROM worlds ORDER BY COALESCE(last_opened_at, created_at) DESC",
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(WorldRecord {
            id: row.get(0)?,
            slug: row.get(1)?,
            title: row.get(2)?,
            description: row.get(3)?,
            cover_path: row.get(4)?,
            storage_path: row.get(5)?,
            target_language: row.get(6)?,
            language_level: row.get(7)?,
            created_at: row.get(8)?,
            updated_at: row.get(9)?,
            last_opened_at: row.get(10)?,
        })
    })?;
    rows.collect::<rusqlite::Result<Vec<_>>>().map_err(Into::into)
}

pub fn create_world(state: &AppState, req: CreateWorldRequest) -> Result<WorldRecord> {
    let _guard = state.lock.lock().expect("storage lock poisoned");
    let id = format!("world_{}", Uuid::new_v4().simple());
    let base_slug = slugify(&req.title);
    let slug = if base_slug.is_empty() { id.clone() } else { base_slug };
    let world_dir = state.data_dir.join("worlds").join(&id);
    fs::create_dir_all(world_dir.join("assets").join("avatars"))?;
    fs::create_dir_all(world_dir.join("assets").join("covers"))?;
    fs::create_dir_all(world_dir.join("assets").join("images"))?;
    fs::create_dir_all(world_dir.join("exports"))?;
    let storage_path = world_dir.to_string_lossy().to_string();
    let created_at = now();

    let conn = state.app_conn()?;
    conn.execute(
        "INSERT INTO worlds
         (id, slug, title, description, cover_path, storage_path, target_language, language_level, created_at, updated_at, last_opened_at)
         VALUES (?1, ?2, ?3, ?4, NULL, ?5, ?6, ?7, ?8, ?8, ?8)",
        params![
            &id,
            unique_slug(&conn, &slug)?,
            &req.title,
            &req.description,
            &storage_path,
            &req.target_language,
            &req.language_level,
            &created_at
        ],
    )?;

    let world_conn = state.open_world_conn(&id)?;
    seed_world(&world_conn, &id, &req, &created_at)?;
    get_world(state, &id)
}

fn unique_slug(conn: &Connection, slug: &str) -> Result<String> {
    let mut candidate = slug.to_string();
    let mut suffix = 2;
    loop {
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM worlds WHERE slug = ?1",
            params![&candidate],
            |row| row.get(0),
        )?;
        if count == 0 {
            return Ok(candidate);
        }
        candidate = format!("{slug}-{suffix}");
        suffix += 1;
    }
}

pub fn get_world(state: &AppState, world_id: &str) -> Result<WorldRecord> {
    let conn = state.app_conn()?;
    conn.execute(
        "UPDATE worlds SET last_opened_at = ?1 WHERE id = ?2",
        params![now(), world_id],
    )?;
    conn.query_row(
        "SELECT id, slug, title, description, cover_path, storage_path, target_language,
                language_level, created_at, updated_at, last_opened_at
         FROM worlds WHERE id = ?1",
        params![world_id],
        |row| {
            Ok(WorldRecord {
                id: row.get(0)?,
                slug: row.get(1)?,
                title: row.get(2)?,
                description: row.get(3)?,
                cover_path: row.get(4)?,
                storage_path: row.get(5)?,
                target_language: row.get(6)?,
                language_level: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
                last_opened_at: row.get(10)?,
            })
        },
    )
    .with_context(|| format!("world not found: {world_id}"))
}

fn seed_world(conn: &Connection, id: &str, req: &CreateWorldRequest, created_at: &str) -> Result<()> {
    conn.execute(
        "INSERT INTO world_profile
         (id, title, description, genre, target_language, language_level, narrative_style, system_prompt, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, NULL, ?8, ?8)",
        params![
            id,
            &req.title,
            &req.description,
            &req.genre,
            &req.target_language,
            &req.language_level,
            &req.narrative_style,
            created_at
        ],
    )?;
    let chapter_id = format!("chapter_{}", Uuid::new_v4().simple());
    let scene_id = format!("scene_{}", Uuid::new_v4().simple());
    conn.execute(
        "INSERT INTO chapters (id, title, summary, order_index, status, created_at)
         VALUES (?1, 'Opening Chapter', '', 0, 'active', ?2)",
        params![chapter_id, created_at],
    )?;
    conn.execute(
        "INSERT INTO scenes (id, chapter_id, title, location, mood, summary, current_objective, status, created_at)
         VALUES (?1, ?2, 'Opening Scene', 'Unspecified', 'expectant', '', 'Begin the story', 'active', ?3)",
        params![scene_id, chapter_id, created_at],
    )?;
    conn.execute(
        "INSERT INTO story_state (key, value, updated_at) VALUES ('scene.current', ?1, ?2)",
        params![scene_id, created_at],
    )?;
    Ok(())
}

pub fn load_api_profile(state: &AppState) -> Result<Option<ApiProfile>> {
    let conn = state.app_conn()?;
    let mut stmt = conn.prepare(
        "SELECT id, name, base_url, model, encrypted_api_key, use_strict_tools
         FROM api_profiles ORDER BY created_at DESC LIMIT 1",
    )?;
    let mut rows = stmt.query([])?;
    if let Some(row) = rows.next()? {
        let encrypted: String = row.get(4)?;
        Ok(Some(ApiProfile {
            id: row.get(0)?,
            name: row.get(1)?,
            base_url: row.get(2)?,
            model: row.get(3)?,
            api_key: security::decrypt_secret(&encrypted),
            use_strict_tools: row.get::<_, i64>(5)? == 1,
        }))
    } else {
        Ok(None)
    }
}

pub fn save_api_profile(state: &AppState, profile: ApiProfile) -> Result<ApiProfile> {
    let conn = state.app_conn()?;
    let id = if profile.id.trim().is_empty() {
        format!("api_{}", Uuid::new_v4().simple())
    } else {
        profile.id.clone()
    };
    conn.execute(
        "INSERT OR REPLACE INTO api_profiles
         (id, name, base_url, model, encrypted_api_key, use_strict_tools, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            &id,
            &profile.name,
            &profile.base_url,
            &profile.model,
            security::encrypt_secret(&profile.api_key),
            if profile.use_strict_tools { 1 } else { 0 },
            now()
        ],
    )?;
    Ok(ApiProfile { id, ..profile })
}
