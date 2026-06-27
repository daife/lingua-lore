# Database Layout

Global data is stored in the user's roaming application data directory:

```txt
LinguaLore/
  app.db
  worlds/
    world_xxx/
      world.db
      assets/
      exports/
  logs/
```

`app.db` contains the bookshelf, API profile, and global settings.

Each world has an independent `world.db` with world profile, characters, scenes, messages, turns, choices, story state, memories, relationship state, lore, and vocabulary.

Migrations live in:

```txt
apps/desktop/src-tauri/migrations/app/001_init.sql
apps/desktop/src-tauri/migrations/world/001_init.sql
```
