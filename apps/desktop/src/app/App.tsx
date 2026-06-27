import { useEffect, useState } from "react";
import { BookOpen, Library, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Settings } from "lucide-react";
import { WorldLibraryPage } from "../pages/WorldLibraryPage";
import { ReaderPage } from "../pages/ReaderPage";
import { SettingsPanel } from "../pages/SettingsPage";
import { api } from "../lib/tauri";
import { useAppStore } from "../stores/useAppStore";

export function App() {
  const { activeWorld, setWorlds, setApiProfile, error, setError } = useAppStore();
  const shouldShowPanels = () =>
    typeof window === "undefined" ? true : !window.matchMedia("(max-width: 1180px)").matches;
  const [libraryOpen, setLibraryOpen] = useState(shouldShowPanels);
  const [settingsOpen, setSettingsOpen] = useState(shouldShowPanels);

  useEffect(() => {
    void Promise.all([api.listWorlds(), api.getApiProfile()])
      .then(([worlds, profile]) => {
        setWorlds(worlds);
        setApiProfile(profile);
      })
      .catch((err) => setError(String(err)));
  }, [setApiProfile, setError, setWorlds]);

  return (
    <main
      className={[
        "shell",
        libraryOpen ? "" : "library-collapsed",
        settingsOpen ? "" : "settings-collapsed"
      ].filter(Boolean).join(" ")}
    >
      <div className="shell-toolbar" aria-label="Layout controls">
        <button
          className="icon-button"
          type="button"
          onClick={() => setLibraryOpen((open) => !open)}
          aria-label={libraryOpen ? "Hide world library" : "Show world library"}
        >
          {libraryOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={() => setSettingsOpen((open) => !open)}
          aria-label={settingsOpen ? "Hide settings" : "Show settings"}
        >
          {settingsOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
        </button>
      </div>
      <button
        className="drawer-scrim"
        type="button"
        aria-label="Close side panels"
        onClick={() => {
          setLibraryOpen(false);
          setSettingsOpen(false);
        }}
      />
      <aside className="sidebar" aria-label="World library" aria-hidden={!libraryOpen}>
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

      <aside className="inspector" aria-label="Settings and status" aria-hidden={!settingsOpen}>
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
