use serde_json::json;

use crate::deepseek::{FunctionDefinition, ToolDefinition};

pub fn read_only_tool_definitions(strict: bool) -> Vec<ToolDefinition> {
    vec![
        tool(
            "query_character_memory",
            "Query relevant memories of a character in the current world.",
            json!({
                "type": "object",
                "properties": {
                    "character_id": {"type": "string", "description": "The character id."},
                    "query": {"type": "string", "description": "The memory query."},
                    "limit": {"type": "integer", "description": "Maximum number of memories to return.", "minimum": 1, "maximum": 10}
                },
                "required": ["character_id", "query", "limit"],
                "additionalProperties": false
            }),
            strict,
        ),
        tool(
            "query_world_lore",
            "Query relevant world lore, locations, factions, rules, history, or supernatural systems in the current world.",
            json!({
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The lore query."},
                    "limit": {"type": "integer", "description": "Maximum number of lore entries to return.", "minimum": 1, "maximum": 10}
                },
                "required": ["query", "limit"],
                "additionalProperties": false
            }),
            strict,
        ),
        tool(
            "query_past_events",
            "Query past story events in the current world when recent messages are not enough for continuity.",
            json!({
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The event query."},
                    "limit": {"type": "integer", "description": "Maximum number of events to return.", "minimum": 1, "maximum": 10}
                },
                "required": ["query", "limit"],
                "additionalProperties": false
            }),
            strict,
        ),
        tool(
            "query_character_profile",
            "Query a full character profile in the current world.",
            json!({
                "type": "object",
                "properties": {
                    "character_id": {"type": "string", "description": "The character id."}
                },
                "required": ["character_id"],
                "additionalProperties": false
            }),
            strict,
        ),
    ]
}

fn tool(name: &str, description: &str, parameters: serde_json::Value, strict: bool) -> ToolDefinition {
    ToolDefinition {
        kind: "function".to_string(),
        function: FunctionDefinition {
            name: name.to_string(),
            description: description.to_string(),
            parameters,
            strict: strict.then_some(true),
        },
    }
}
