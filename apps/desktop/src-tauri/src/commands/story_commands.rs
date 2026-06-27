use tauri::State;

use crate::domain::{AppResult, StoryTurnInput, StoryTurnResult};
use crate::storage::{load_api_profile, AppState};
use crate::story_runtime;

#[tauri::command]
pub async fn send_story_turn(
    state: State<'_, AppState>,
    input: StoryTurnInput,
) -> AppResult<StoryTurnResult> {
    let profile = load_api_profile(&state)
        .map_err(|err| err.to_string())?
        .ok_or_else(|| "Please configure a DeepSeek API profile first.".to_string())?;
    story_runtime::send_story_turn(&state, profile, input)
        .await
        .map_err(|err| err.to_string())
}
