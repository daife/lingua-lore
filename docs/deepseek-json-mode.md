# DeepSeek JSON Mode

The Rust client sends OpenAI-compatible requests to:

```txt
{base_url}/chat/completions
```

The app sets:

```json
{
  "response_format": { "type": "json_object" },
  "tool_choice": "auto",
  "temperature": 0.85,
  "max_tokens": 4096,
  "stream": false
}
```

The system prompt contains the word `json` and includes an exact example of the expected `TurnOutput` shape. Empty content and invalid JSON trigger a repair prompt and retry.
