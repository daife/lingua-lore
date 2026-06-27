# Lingua Lore

[**English**](README.md) | [**中文**](README.zh.md)

---

A desktop and mobile app for immersive foreign-language story reading.

### Product Names

| Language | Name |
|---|---|
| English | Lingua Lore |
| Chinese (简体中文) | 语境传说 |
| Japanese (日本語) | 言の葉ロア |

## Roadmap

### ✅ Completed

- [x] World creation & management (CRUD)
- [x] AI-assisted world draft generation
- [x] Immersive story reading experience
- [x] Branching choice-driven narrative
- [x] Free-text action input
- [x] Independent selection translation (Youdao)
- [x] World export / import (ZIP format)
- [x] Multiple API profile support
- [x] Quick mode (higher quality, higher token cost)
- [x] Multilingual UI (English / 中文 / 日本語)
- [x] Windows (MSI + NSIS) and Android (APK) builds
- [x] Automatic version update check on startup

### 🚧 In Progress

- [ ] Multi-language translation (full paragraph, more language pairs)
- [ ] Character relationship viewer
- [ ] Thinking mode support
- [ ] Reference mode (upload novel as reference material)
- [ ] Custom character cards
- [ ] Progress rollback

## Stack

- Tauri + Rust backend
- React + Vite frontend
- SQLite storage
- DeepSeek Chat Completions with an OpenAI-compatible API shape
- Youdao public dictionary endpoint for independent selection translation

## Core Runtime

- LLM story generation uses JSON Output.
- Tool calls are optional and read-only.
- Every story turn must return narration, dialogues, summary, scene status, exactly three choices, state update candidates, memory candidates, and relationship updates.
- Rust validates final JSON and commits all writes in one transaction.
- Selection translation never enters LLM context.
- World export/import uses a zip package containing `manifest.json` and `world.db`.

## Setup

```powershell
npm install
```

For Android builds, also install:

- Android Studio
- Android SDK Platform Tools
- Android SDK Build Tools
- Android SDK Platform, currently `android-36`
- Android NDK, currently `27.0.12077973`
- Rust Android targets:

```powershell
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

Recommended Android environment variables:

```powershell
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT="$env:LOCALAPPDATA\Android\Sdk"
$env:NDK_HOME="$env:ANDROID_HOME\ndk\27.0.12077973"
```

## Development

```powershell
npm run dev
npm run typecheck
```

## Windows Build

Build the Windows app locally:

```powershell
npm --workspace @lingua-lore/desktop run tauri -- build
```

Useful outputs are written under:

```text
apps/desktop/src-tauri/target/release/bundle/
```

For a fast local compile check without packaging installers:

```powershell
npm --workspace @lingua-lore/desktop run tauri -- build --debug --no-bundle
```

## Android Build

Initialize the Tauri Android project once:

```powershell
npm --workspace @lingua-lore/desktop run tauri -- android init
```

Build a release APK locally:

```powershell
npm --workspace @lingua-lore/desktop run tauri -- android build --apk --target aarch64
```

The APK is written under:

```text
apps/desktop/src-tauri/gen/android/app/build/outputs/apk/universal/release/
```

## Local Release

Releases are published from local build artifacts. GitHub Actions remote builds are intentionally not used.

1. Update versions in `package.json`, `apps/desktop/package.json`, `apps/desktop/src-tauri/Cargo.toml`, and `apps/desktop/src-tauri/tauri.conf.json`.
2. Run checks:

```powershell
npm run typecheck
cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml
```

3. Build Windows and Android locally:

```powershell
npm --workspace @lingua-lore/desktop run tauri -- build
npm --workspace @lingua-lore/desktop run tauri -- android build --apk --target aarch64
```

4. Commit, tag, and push:

```powershell
git add .
git commit -m "Prepare v0.1.x local release"
git tag v0.1.x
git push origin main
git push origin v0.1.x
```

5. Create the GitHub release from local artifacts:

```powershell
gh release create v0.1.x --title "Lingua Lore v0.1.x" --notes "Local release notes." (Get-Item apps/desktop/src-tauri/target/release/bundle/msi/*.msi).FullName (Get-Item apps/desktop/src-tauri/target/release/bundle/nsis/*.exe).FullName (Get-Item apps/desktop/src-tauri/gen/android/app/build/outputs/apk/universal/release/*.apk).FullName
```
