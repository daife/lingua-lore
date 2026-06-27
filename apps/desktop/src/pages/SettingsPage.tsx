import { FormEvent, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { api } from "../lib/tauri";
import { useAppStore } from "../stores/useAppStore";
import type { ApiProfile } from "../lib/types";

const DEFAULT_PROFILE: ApiProfile = {
  id: "",
  name: "DeepSeek",
  base_url: "https://api.deepseek.com",
  model: "deepseek-chat",
  api_key: "",
  use_strict_tools: false
};

export function SettingsPanel() {
  const { apiProfile, setApiProfile, setError } = useAppStore();
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
        use_strict_tools: form.get("use_strict_tools") === "on"
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
      <label className="check-row">
        <input name="use_strict_tools" type="checkbox" defaultChecked={profile.use_strict_tools} />
        Strict tool schema
      </label>
      <button className="primary-button">
        <Save size={16} />
        {saved ? "Saved" : "Save API profile"}
      </button>
    </form>
  );
}
