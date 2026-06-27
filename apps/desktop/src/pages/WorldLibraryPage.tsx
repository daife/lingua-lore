import { Plus, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";
import { api } from "../lib/tauri";
import { useAppStore } from "../stores/useAppStore";

export function WorldLibraryPage() {
  const { worlds, activeWorld, setWorlds, setActiveWorld, setError } = useAppStore();
  const [openForm, setOpenForm] = useState(worlds.length === 0);
  const [creating, setCreating] = useState(false);

  async function openWorld(worldId: string) {
    try {
      const bootstrap = await api.getWorldBootstrap(worldId);
      setActiveWorld(bootstrap.world, bootstrap.scene_id);
    } catch (err) {
      setError(String(err));
    }
  }

  async function createWorld(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setCreating(true);
    try {
      await api.createWorld({
        title: String(form.get("title") || "Untitled World"),
        description: String(form.get("description") || ""),
        genre: String(form.get("genre") || "mystery"),
        target_language: String(form.get("target_language") || "English"),
        language_level: String(form.get("language_level") || "B1"),
        narrative_style: String(form.get("narrative_style") || "immersive literary prose")
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

  return (
    <div className="world-panel">
      <button className="command-button" onClick={() => setOpenForm((value) => !value)}>
        <Plus size={16} />
        New world
      </button>

      {openForm ? (
        <form className="world-form" onSubmit={createWorld}>
          <input name="title" placeholder="World title" required />
          <textarea name="description" placeholder="Premise, tone, core conflict" rows={4} />
          <input name="genre" placeholder="Genre" defaultValue="mystery fantasy" />
          <div className="split">
            <input name="target_language" placeholder="Language" defaultValue="English" />
            <input name="language_level" placeholder="Level" defaultValue="B1" />
          </div>
          <input name="narrative_style" placeholder="Narrative style" defaultValue="immersive literary prose" />
          <button className="primary-button" disabled={creating}>
            <Sparkles size={16} />
            {creating ? "Creating..." : "Create"}
          </button>
        </form>
      ) : null}

      <div className="world-list">
        {worlds.map((world) => (
          <button
            className={world.id === activeWorld?.id ? "world-item active" : "world-item"}
            key={world.id}
            onClick={() => void openWorld(world.id)}
          >
            <strong>{world.title}</strong>
            <span>{world.target_language} · {world.language_level}</span>
            <p>{world.description || "No description yet."}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
