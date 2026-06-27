use rusqlite::params;
use tauri::State;
use uuid::Uuid;

use crate::domain::{AppResult, TranslationResult};
use crate::storage::{now, AppState};
use crate::translation;

#[tauri::command]
pub async fn translate_selection(
    _state: State<'_, AppState>,
    world_id: String,
    text: String,
    context: Option<String>,
    source_language: String,
    target_language: String,
) -> AppResult<TranslationResult> {
    let _ = (world_id, context, source_language, target_language);
    translation::translate_text(&text)
        .await
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub fn save_vocabulary(
    state: State<AppState>,
    world_id: String,
    source_text: String,
    translated_text: String,
    source_language: String,
    target_language: String,
    context: Option<String>,
    message_id: Option<String>,
) -> AppResult<()> {
    let conn = state.open_world_conn(&world_id).map_err(|err| err.to_string())?;
    conn.execute(
        "INSERT INTO vocabulary
         (id, source_text, translated_text, source_language, target_language, context, message_id, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            format!("vocab_{}", Uuid::new_v4().simple()),
            source_text,
            translated_text,
            source_language,
            target_language,
            context,
            message_id,
            now()
        ],
    )
    .map_err(|err| err.to_string())?;
    Ok(())
}
