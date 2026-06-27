import { useEffect } from "react";
import { BookOpen, Library, Settings } from "lucide-react";
import { WorldLibraryPage } from "../pages/WorldLibraryPage";
import { ReaderPage } from "../pages/ReaderPage";
import { SettingsPanel } from "../pages/SettingsPage";
import { api } from "../lib/tauri";
import { useAppStore } from "../stores/useAppStore";

export function App() {
  const { activeWorld, setWorlds, setApiProfile, error, setError } = useAppStore();

  useEffect(() => {
    void Promise.all([api.listWorlds(), api.getApiProfile()])
      .then(([worlds, profile]) => {
        setWorlds(worlds);
        setApiProfile(profile);
      })
      .catch((err) => setError(String(err)));
  }, [setApiProfile, setError, setWorlds]);

  return (
    <main className="shell">
      <aside className="sidebar" aria-label="World library">
        <div className="brand">
          <BookOpen size={22} />
          <div>
            <strong>Lingua Lore</strong>
          </div>
        </div>
        <div className="section-title">
          <Library size={16} />
          <span>Worlds</span>
        </div>
        <WorldLibraryPage />
      </aside>

      <section className="reader-shell">
        {activeWorld ? <ReaderPage /> : <div className="empty-reader">Create or open a world to begin.</div>}
      </section>

      <aside className="inspector" aria-label="Settings and status">
        <div className="section-title">
          <Settings size={16} />
          <span>Settings</span>
        </div>
        <SettingsPanel />
        {error ? (
          <div className="error-box" role="alert">
            <button onClick={() => setError(undefined)}>Dismiss</button>
            <p>{error}</p>
          </div>
        ) : null}
      </aside>
    </main>
  );
}
