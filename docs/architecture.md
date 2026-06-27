# Lingua Lore Architecture

Lingua Lore is a Windows desktop app built with Tauri, React, Rust, and SQLite.

The runtime follows the `Read-Only Tools + JSON Turn Report + Transaction Commit` pattern:

1. React sends a free action or selected branch choice.
2. Rust loads the current `world.db` context.
3. DeepSeek receives OpenAI-compatible Chat Completions messages with `response_format: {"type":"json_object"}`.
4. DeepSeek may call read-only tools for lore, memories, past events, or character profiles.
5. Rust executes only local read queries and sends tool results back as `role: "tool"`.
6. DeepSeek returns a final JSON turn with narration, dialogues, exactly three choices, summary, status updates, memory candidates, and relationship updates.
7. Rust validates the JSON and commits all writes in one SQLite transaction.

Selection translation is intentionally outside this loop. It calls Youdao's public dictionary JSON endpoint directly and never enters the story prompt or message history.
