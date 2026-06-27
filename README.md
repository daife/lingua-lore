# Lingua Lore

Lingua Lore is a Windows desktop app for immersive foreign-language story reading.

Stack:

- Tauri + Rust backend
- React + Vite frontend
- SQLite storage
- DeepSeek Chat Completions with OpenAI-compatible API shape
- Youdao public dictionary endpoint for independent selection translation

Core runtime:

- LLM story generation uses JSON Output.
- Tool calls are optional and read-only.
- Every story turn must return narration, dialogues, summary, scene status, exactly three choices, state update candidates, memory candidates, and relationship updates.
- Rust validates final JSON and commits all writes in one transaction.
- Selection translation never enters LLM context.

Useful commands:

```powershell
npm install
npm run dev
npm run build
```

No local build test was run while creating this implementation because the project objective explicitly said it was not required.
