import { FormEvent, useEffect, useState } from "react";
import { Save, Zap } from "lucide-react";
import { api } from "../lib/tauri";
import { useAppStore } from "../stores/useAppStore";
import type { ApiProfile } from "../lib/types";

const DEFAULT_PROFILE: ApiProfile = {
  id: "",
  name: "DeepSeek",
  base_url: "https://api.deepseek.com/beta",
  model: "deepseek-v4-flash",
  api_key: "",
  use_strict_tools: true
};

export function SettingsPanel() {
  const { apiProfile, quickMode, setApiProfile, setError, setQuickMode } = useAppStore();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(false);
  }, [apiProfile]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const profile = await api.saveApiProfile({
        id: apiProfile?.id ?? "",
        name: String(form.get("name") || "DeepSeek"),
        base_url: String(form.get("base_url") || DEFAULT_PROFILE.base_url),
        model: String(form.get("model") || DEFAULT_PROFILE.model),
        api_key: String(form.get("api_key") || ""),
        use_strict_tools: true
      });
      setApiProfile(profile);
      setSaved(true);
    } catch (err) {
      setError(String(err));
    }
  }

  const profile = apiProfile ?? DEFAULT_PROFILE;

  return (
    <form className="settings-form" onSubmit={save}>
      <label>
        Name
        <input name="name" defaultValue={profile.name} />
      </label>
      <label>
        Base URL
        <input name="base_url" defaultValue={profile.base_url} />
      </label>
      <label>
        Model
        <input name="model" defaultValue={profile.model} />
      </label>
      <label>
        API Key
        <input name="api_key" type="password" defaultValue={profile.api_key} />
      </label>
      <button className="primary-button">
        <Save size={16} />
        {saved ? "Saved" : "Save API profile"}
      </button>
      <button
        className={quickMode ? "quick-mode-toggle active" : "quick-mode-toggle"}
        type="button"
        onClick={() => setQuickMode(!quickMode)}
        aria-pressed={quickMode}
      >
        <Zap size={16} />
        Quick mode
      </button>
    </form>
  );
}
