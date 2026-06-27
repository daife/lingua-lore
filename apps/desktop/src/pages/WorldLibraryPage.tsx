import { ChevronDown, Plus, Sparkles, Trash2 } from "lucide-react";
import { ChangeEvent, FormEvent, useState } from "react";
import { api } from "../lib/tauri";
import type { CreateWorldRequest } from "../lib/types";
import { useAppStore } from "../stores/useAppStore";

const WORLD_GENRES = [
  "玄幻",
  "奇幻",
  "武侠",
  "仙侠",
  "都市",
  "现实",
  "军事",
  "历史",
  "游戏",
  "体育",
  "科幻",
  "灵异",
  "现代言情",
  "古代言情",
  "豪门总裁",
  "青春校园",
  "穿越重生",
  "宫斗宅斗",
  "种田经商",
  "女强爽文",
  "甜宠",
  "虐恋",
  "悬疑推理",
  "年代文",
  "娱乐圈",
  "快穿",
  "星际",
  "末世"
];

const TARGET_LANGUAGES = [
  "English",
  "简体中文",
  "繁體中文",
  "日本語",
  "한국어",
  "Français",
  "Deutsch",
  "Español",
  "Português",
  "Italiano",
  "Русский",
  "العربية"
];

const DEFAULT_WORLD_FORM: CreateWorldRequest = {
  title: "",
  description: "",
  genre: "mystery fantasy",
  target_language: "English",
  language_level: "B1",
  narrative_style: "immersive literary prose",
  characters: []
};

export function WorldLibraryPage() {
  const { worlds, activeWorld, setWorlds, setActiveWorld, clearActiveWorld, setError } = useAppStore();
  const [openForm, setOpenForm] = useState(worlds.length === 0);
  const [creating, setCreating] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [showGenrePicker, setShowGenrePicker] = useState(false);
  const [showGenreOptions, setShowGenreOptions] = useState(false);
  const [genreInput, setGenreInput] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState(DEFAULT_WORLD_FORM.target_language);
  const [formValues, setFormValues] = useState<CreateWorldRequest>(DEFAULT_WORLD_FORM);

  async function openWorld(worldId: string) {
    try {
      const bootstrap = await api.getWorldBootstrap(worldId);
      setActiveWorld(
        bootstrap.world,
        bootstrap.scene_id,
        bootstrap.turns.map((turn) => ({
          id: turn.turn_id,
          userInput: turn.user_input,
          output: turn.output
        }))
      );
    } catch (err) {
      setError(String(err));
    }
  }

  async function createWorld(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    try {
      await api.createWorld({
        title: formValues.title || "Untitled World",
        description: formValues.description,
        genre: formValues.genre || "mystery",
        target_language: formValues.target_language || "English",
        language_level: formValues.language_level || "B1",
        narrative_style: formValues.narrative_style || "immersive literary prose",
        characters: formValues.characters
      });
      const next = await api.listWorlds();
      setWorlds(next);
      setOpenForm(false);
    } catch (err) {
      setError(String(err));
    } finally {
      setCreating(false);
    }
  }

  function updateField(
    field: keyof CreateWorldRequest,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setFormValues((values) => ({ ...values, [field]: event.target.value }));
  }

  async function generateDraft() {
    setOpenForm(true);
    setDrafting(true);
    try {
      const genre = genreInput.trim();
      if (!genre) {
        return;
      }
      const draft = await api.generateWorldDraft({
        genre,
        target_language: selectedLanguage
      });
      setFormValues(draft);
      setShowGenrePicker(false);
    } catch (err) {
      setError(String(err));
    } finally {
      setDrafting(false);
    }
  }

  async function deleteWorld(worldId: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) {
      return;
    }
    try {
      await api.deleteWorld(worldId);
      if (activeWorld?.id === worldId) {
        clearActiveWorld();
      }
      setWorlds(await api.listWorlds());
    } catch (err) {
      setError(String(err));
    }
  }

  return (
    <div className="world-panel">
      <button className="command-button" onClick={() => setOpenForm((value) => !value)}>
        <Plus size={16} />
        New world
      </button>

      <button className="command-button" onClick={() => setShowGenrePicker((value) => !value)}>
        <Sparkles size={16} />
        AI fill
      </button>

      {showGenrePicker ? (
        <div className="ai-fill-panel">
          <div className="ai-fill-controls">
            <input
              value={genreInput}
              onChange={(event) => setGenreInput(event.target.value)}
              placeholder="Genre"
              disabled={drafting}
            />
            <button
              className="command-button compact"
              type="button"
              onClick={() => setShowGenreOptions((value) => !value)}
              disabled={drafting}
            >
              <ChevronDown size={16} />
              Choose
            </button>
            <select
              value={selectedLanguage}
              onChange={(event) => setSelectedLanguage(event.target.value)}
              disabled={drafting}
            >
              {TARGET_LANGUAGES.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
          </div>
          {showGenreOptions ? (
            <div className="genre-options">
              {WORLD_GENRES.map((genre) => (
                <button
                  className="genre-chip"
                  key={genre}
                  type="button"
                  onClick={() => {
                    setGenreInput(genre);
                    setShowGenreOptions(false);
                  }}
                  disabled={drafting}
                >
                  {genre}
                </button>
              ))}
            </div>
          ) : null}
          <button className="primary-button" onClick={() => void generateDraft()} disabled={drafting || !genreInput.trim()}>
            <Sparkles size={16} />
            {drafting ? "Filling..." : "Generate draft"}
          </button>
        </div>
      ) : null}

      {openForm ? (
        <form className="world-form" onSubmit={createWorld}>
          <input
            name="title"
            placeholder="World title"
            required
            value={formValues.title}
            onChange={(event) => updateField("title", event)}
          />
          <textarea
            name="description"
            placeholder="Premise, tone, core conflict"
            rows={4}
            value={formValues.description}
            onChange={(event) => updateField("description", event)}
          />
          <input
            name="genre"
            placeholder="Genre"
            value={formValues.genre}
            onChange={(event) => updateField("genre", event)}
          />
          <div className="split">
            <input
              name="target_language"
              placeholder="Language"
              value={formValues.target_language}
              onChange={(event) => updateField("target_language", event)}
            />
            <input
              name="language_level"
              placeholder="Level"
              value={formValues.language_level}
              onChange={(event) => updateField("language_level", event)}
            />
          </div>
          <input
            name="narrative_style"
            placeholder="Narrative style"
            value={formValues.narrative_style}
            onChange={(event) => updateField("narrative_style", event)}
          />
          <button className="primary-button" disabled={creating}>
            <Sparkles size={16} />
            {creating ? "Creating..." : "Create"}
          </button>
        </form>
      ) : null}

      <div className="world-list">
        {worlds.map((world) => (
          <div className={world.id === activeWorld?.id ? "world-item active" : "world-item"} key={world.id}>
            <button className="world-open-button" onClick={() => void openWorld(world.id)}>
              <strong>{world.title}</strong>
              <span>{world.target_language} · {world.language_level}</span>
              <p>{world.description || "No description yet."}</p>
            </button>
            <button
              className="icon-button danger"
              aria-label={`Delete ${world.title}`}
              title="Delete world"
              onClick={() => void deleteWorld(world.id, world.title)}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
