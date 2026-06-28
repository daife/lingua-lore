# 语境传说

[**English**](README.md) | [**中文**](README.zh.md)

---

语境传说是一款用于沉浸式外语互动阅读的 Tauri 桌面应用。当前运行机制的核心不是“聊天框套故事皮肤”，而是本地 SQLite 状态、DeepSeek 兼容 Chat Completions、结构化 JSON 故事回合，以及一层只能读取世界资料的 LLM 工具系统。

### 产品名称

| 语言 | 名称 |
|---|---|
| English | Lingua Lore |
| 简体中文 | 语境传说 |
| 日本語 | 言の葉ロア |

## 运行总览

![语境传说运行总览](docs/images/runtime-overview.png)

应用有两级存储：

- `app.db` 保存世界列表和 API 配置。
- 每个世界都有独立的 `world.db`，位于应用数据目录下。它保存世界档案、场景、角色、消息、回合、分支选项、故事状态、记忆和关系状态。

世界草稿生成、世界创建、故事回合预览、故事回合提交是四件不同的事。这个边界很重要：`preview_story_turn` 可以调用 LLM 和只读工具，但不会把生成结果写入世界数据库；只有前端把 preview 发回 `commit_story_turn_preview` 后，Rust 才会提交数据库事务。

## 世界生成与初始化

“AI 填写”调用的是 `generate_world_draft`。它读取最新保存的 API 配置，向模型发送带 schema 要求的 Chat Completions 请求，并要求返回一个 `CreateWorldRequest` JSON 对象。这个世界草稿生成器不注册工具。模型请求最多重试 4 次；如果草稿 JSON 不合法，会追加修复提示让模型重新输出。

草稿只是表单数据。真正创建世界发生在 `create_world`：

- 在 `app.db.worlds` 中插入一个世界记录。
- 创建独立世界目录和 `world.db`。
- 对世界数据库执行 migration。
- 将请求内容写入 `world_profile`。
- 创建一个开场场景，目标是 `Initialize the story`。
- 写入 `story_state.scene.current`，指向这个开场场景。
- 必须且只能有一个玩家角色，玩家角色固定存为 `char_player`。
- 如果请求中带有非玩家初始角色，它们的 `trust` 初始值为 `0`；当前前端通常只提交玩家角色。

打开已有世界时，`get_world_bootstrap` 会读取世界记录，优先使用 `story_state.scene.current` 找当前场景，找不到时退回第一个场景，并从 `turns`、`messages`、`branch_choices` 重建历史回合。

## 故事回合运行方式

![语境传说故事回合运行](docs/images/story-turn-runtime.png)

阅读器的第一回合会发送自由文本动作：`Initialize the story with a vivid opening scene.` 后续回合可以来自分支选择，也可以来自玩家自由输入。

正常流程如下：

1. 前端调用 `preview_story_turn`。
2. Rust 从 `world.db` 装载上下文。
3. Rust 构造 system message 和 user message。
4. 调用 DeepSeek，请求 JSON 输出，并提供只读工具。
5. 如果模型请求工具，Rust 执行对应的只读 SQLite 查询，并把工具结果追加回消息列表。
6. 模型返回正文后，Rust 将其解析为 `TurnOutput` 并校验。
7. 如果解析或校验失败，Rust 追加修复提示并重试本回合。
8. 校验通过后，preview 返回给前端，此时还没有写数据库。
9. 前端调用 `commit_story_turn_preview`。
10. Rust 再次校验，并在一个 SQLite 事务中写入本回合。

代码里的主要限制：

| 区域 | 限制 |
|---|---:|
| 模型请求重试 | 4 |
| 回合修复尝试 | 4 |
| 单次 preview 工具轮数 | 3 |
| 单次 preview 工具调用总数 | 8 |
| 装载最近消息 | 12 |
| 装载最近摘要 | 8 |
| 写入 prompt 的角色数 | 12 |
| 装载故事状态行数 | 80 |
| 装载关系状态行数 | 80 |

## 上下文、工具与记忆

`load_context` 会读取一个紧凑快照：

- 世界档案：标题、简介、类型、目标语言、语言等级、叙事风格。
- 当前场景：标题、地点、氛围、当前目标。
- 角色列表，玩家角色排在前面。
- 故事状态键值。
- 关系状态。
- 当前场景最近消息。
- 当前场景最近回合摘要。
- 本次用户行动，也就是自由文本或被选中的分支选项文本。

模型可用的只读工具只有三个：

| 工具 | 读取内容 |
|---|---|
| `query_character_profile` | 按 `character_id` 查询一个角色档案 |
| `query_character_memory` | 按角色和 SQL `LIKE` 查询已晋升记忆 |
| `query_past_events` | 按 SQL `LIKE` 查询历史回合摘要 |

这些工具不是代理，也不能写库。它们只是从 SQLite 返回 JSON 行。当前代码里没有向量数据库，也没有 embedding 检索。

记忆是在提交阶段形成的：

- 模型输出 `memory_candidates`。
- Rust 会把所有候选写入 `memory_candidates`。
- 只有当 `importance >= 7` 且引用的角色已经存在时，候选才会晋升写入 `memories`。
- 后续工具调用可以通过 `query_character_memory` 读回已晋升记忆。

关系状态也来自模型输出，但由 Rust 控制提交：

- 每条关系更新必须引用已存在角色。
- 单次 delta 限制在 `-2..2`。
- 存储后的关系值会限制在 `-100..100`。
- 每条已应用更新都会写入 `relationship_update_logs`。

## 提交语义

`commit_turn` 在一个 SQLite 事务中完成所有写入：

- 如果输入来自分支选择，将旧分支选项标记为已选择。
- 插入用户消息和助手故事消息。
- 插入 `turns` 行，并保存模型原始 JSON。
- 更新当前场景状态和摘要。
- 插入下一轮三个分支选项，并分配稳定 choice ID。
- 应用允许的故事状态更新，并写日志。
- 插入重要的新 NPC；如果同名角色已存在则跳过。
- 记录记忆候选，并晋升高重要度且有效的记忆。
- 应用关系 delta，并写日志。

提交前会先校验。一个故事回合必须包含非空叙述、严格三个 `A` / `B` / `C` 选项、合法风险等级、允许的故事状态 key、`1..10` 的记忆重要度，以及 `-2..2` 的关系变化量。

## 阅读器行为

快速模式不会改变模型、prompt、temperature 或校验规则。当前前端实现是在已有 choice ID 时，提前为所有可选分支请求 preview；如果玩家点中了已经预取的选项，就直接提交缓存 preview，而不是等待新生成。因此它会让选择后的响应更快，但可能消耗更多模型请求，因为未选择的分支也可能已经生成。

划词翻译独立于故事运行时。被选中的文本会带着附近上下文发给翻译 provider，结果显示在浮层里。它不会进入故事 prompt，也不会修改世界状态。

## 技术栈

- Tauri + Rust 后端
- React + Vite 前端
- SQLite 存储
- DeepSeek Chat Completions（兼容 OpenAI 请求结构）
- 有道词典公共接口（独立划词翻译）

## 环境配置

```powershell
npm install
```

Android 构建需要额外安装：

- Android Studio
- Android SDK Platform Tools
- Android SDK Build Tools
- Android SDK Platform，当前 `android-36`
- Android NDK，当前 `27.0.12077973`
- Rust Android 目标：

```powershell
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

推荐 Android 环境变量：

```powershell
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT="$env:LOCALAPPDATA\Android\Sdk"
$env:NDK_HOME="$env:ANDROID_HOME\ndk\27.0.12077973"
```

## 开发

```powershell
npm run dev
npm run typecheck
```

## Windows 构建

本地构建 Windows 应用：

```powershell
npm --workspace @lingua-lore/desktop run tauri -- build
```

输出文件位于：

```text
apps/desktop/src-tauri/target/release/bundle/
```

快速编译检查（不打包安装程序）：

```powershell
npm --workspace @lingua-lore/desktop run tauri -- build --debug --no-bundle
```

## Android 构建

初始化 Tauri Android 项目（仅需一次）：

```powershell
npm --workspace @lingua-lore/desktop run tauri -- android init
```

构建 release APK：

```powershell
npm --workspace @lingua-lore/desktop run tauri -- android build --apk --target aarch64
```

APK 输出位置：

```text
apps/desktop/src-tauri/gen/android/app/build/outputs/apk/universal/release/
```

## 本地发布

发布版本直接从本地构建产物发布，不使用 GitHub Actions 远程构建。

1. **完成代码修改并更新版本号**。需要更新的文件：

   | 文件 | 字段 |
   |---|---|
   | `package.json` | `version` |
   | `apps/desktop/package.json` | `version` |
   | `apps/desktop/src-tauri/Cargo.toml` | `version` |
   | `apps/desktop/src-tauri/tauri.conf.json` | `version` |
   | `apps/desktop/src-tauri/gen/android/app/tauri.properties` | `versionName` + `versionCode` |

   > Android `tauri.properties` 是自动生成文件，需要在构建前手动编辑。

2. **配置 Android APK 签名**：在 `apps/desktop/src-tauri/gen/android/app/build.gradle.kts` 中配置 release signing。

3. **运行检查：**

   ```powershell
   npm run typecheck
   cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml
   ```

4. **提交所有修改**：

   ```powershell
   git add .
   git commit -m "feat: your feature description"
   git push origin main
   ```

5. **本地构建 Windows 和 Android：**

   ```powershell
   npm --workspace @lingua-lore/desktop run tauri -- build
   npm --workspace @lingua-lore/desktop run tauri -- android build --apk --target aarch64
   ```

6. **打标签，并从明确的本地产物路径创建 GitHub Release。**
