# 语境传说

[**English**](README.md) | [**中文**](README.zh.md)

---

一款用于沉浸式外语故事阅读的桌面和移动端应用。

### 产品名称

| 语言 | 名称 |
|---|---|
| English | Lingua Lore |
| 简体中文 | 语境传说 |
| 日本語 | 言の葉ロア |

## 开发路线图

### ✅ 已完成

- [x] 世界创建与管理（增删改查）
- [x] AI 辅助世界草稿生成
- [x] 沉浸式故事阅读体验
- [x] 分支选择式互动叙事
- [x] 自由文本行动输入
- [x] 独立划词翻译（有道词典）
- [x] 世界导出 / 导入（ZIP 格式）
- [x] 多 API 配置支持
- [x] 快速模式（更高品质，更高 token 消耗）
- [x] 多语言界面（简体中文 / English / 日本語）
- [x] Windows（MSI + NSIS）及 Android（APK）构建
- [x] 启动时自动版本更新检测

### 🚧 规划中

- [ ] 多语种翻译（整段翻译、更多语言对）
- [ ] 人物关系查看
- [ ] 思考模式支持
- [ ] 参考模式支持（上传小说作为参考素材）
- [ ] 自定义角色卡片
- [ ] 进度回退

## 技术栈

- Tauri + Rust 后端
- React + Vite 前端
- SQLite 存储
- DeepSeek Chat Completions（兼容 OpenAI API）
- 有道词典公共接口（独立划词翻译）

## 核心运行机制

- LLM 故事生成使用 JSON Output 模式
- 工具调用为可选且只读
- 每个故事回合必须返回：叙述、对话、摘要、场景状态、三个选择、状态更新候选、记忆候选、关系更新
- Rust 端校验最终 JSON 并在单个事务内提交所有写入
- 划词翻译不进入 LLM 上下文
- 世界导出/导入使用 ZIP 包，包含 `manifest.json` 和 `world.db`

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

1. 更新版本号：`package.json`、`apps/desktop/package.json`、`apps/desktop/src-tauri/Cargo.toml`、`apps/desktop/src-tauri/tauri.conf.json`
2. 运行检查：

```powershell
npm run typecheck
cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml
```

3. 本地构建 Windows 和 Android：

```powershell
npm --workspace @lingua-lore/desktop run tauri -- build
npm --workspace @lingua-lore/desktop run tauri -- android build --apk --target aarch64
```

4. 提交、打标签并推送：

```powershell
git add .
git commit -m "Prepare v0.1.x local release"
git tag v0.1.x
git push origin main
git push origin v0.1.x
```

5. 从本地产物创建 GitHub Release：

```powershell
gh release create v0.1.x --title "Lingua Lore v0.1.x" --notes "Local release notes." (Get-Item apps/desktop/src-tauri/target/release/bundle/msi/*.msi).FullName (Get-Item apps/desktop/src-tauri/target/release/bundle/nsis/*.exe).FullName (Get-Item apps/desktop/src-tauri/gen/android/app/build/outputs/apk/universal/release/*.apk).FullName
```
