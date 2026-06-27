use anyhow::Result;

use crate::domain::TurnOutput;

pub fn parse_turn_output(content: &str) -> Result<TurnOutput> {
    Ok(serde_json::from_str::<TurnOutput>(content)?)
}
