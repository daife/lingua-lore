use tauri::State;

use crate::domain::{AppResult, TranslationResult};
use crate::storage::AppState;
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
    let _ = (world_id, context);
    translation::translate_text(&text, &source_language, &target_language)
        .await
        .map_err(|err| err.to_string())
}
