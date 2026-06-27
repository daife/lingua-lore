use rusqlite::params;
use serde::Serialize;
use tauri::State;

use crate::domain::{AppResult, CreateWorldRequest, WorldRecord};
use crate::storage::{create_world as persist_world, list_worlds as query_worlds, AppState};

#[derive(Debug, Serialize)]
pub struct WorldBootstrap {
    pub world: WorldRecord,
    pub scene_id: String,
}

#[tauri::command]
pub fn list_worlds(state: State<AppState>) -> AppResult<Vec<WorldRecord>> {
    query_worlds(&state).map_err(|err| err.to_string())
}

#[tauri::command]
pub fn create_world(state: State<AppState>, request: CreateWorldRequest) -> AppResult<WorldRecord> {
    persist_world(&state, request).map_err(|err| err.to_string())
}

#[tauri::command]
pub fn get_world_bootstrap(state: State<AppState>, world_id: String) -> AppResult<WorldBootstrap> {
    let world = crate::storage::get_world(&state, &world_id).map_err(|err| err.to_string())?;
    let conn = state.open_world_conn(&world_id).map_err(|err| err.to_string())?;
    let scene_id = conn
        .query_row(
            "SELECT value FROM story_state WHERE key = 'scene.current'",
            [],
            |row| row.get::<_, String>(0),
        )
        .or_else(|_| {
            conn.query_row(
                "SELECT id FROM scenes ORDER BY created_at ASC LIMIT 1",
                params![],
                |row| row.get::<_, String>(0),
            )
        })
        .map_err(|err| err.to_string())?;
    Ok(WorldBootstrap { world, scene_id })
}
