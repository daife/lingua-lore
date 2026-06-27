import { useEffect, useState } from "react";
import { BookOpen, Library, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Settings } from "lucide-react";
import { message } from "@tauri-apps/plugin-dialog";
import { WorldLibraryPage } from "../pages/WorldLibraryPage";
import { ReaderPage } from "../pages/ReaderPage";
import { SettingsPanel } from "../pages/SettingsPage";
import { translate } from "../lib/i18n";
import { api } from "../lib/tauri";
import { useAppStore } from "../stores/useAppStore";

export function App() {
  const {
    activeWorld,
    appLanguage,
    settingsError,
    setWorlds,
    setApiProfile,
    setLibraryError,
    setSettingsError
  } = useAppStore();
  const t = (key: Parameters<typeof translate>[1], value?: string) => translate(appLanguage, key, value);
  const shouldShowPanels = () =>
    typeof window === "undefined" ? true : !window.matchMedia("(max-width: 1180px)").matches;
  const [libraryOpen, setLibraryOpen] = useState(shouldShowPanels);
  const [settingsOpen, setSettingsOpen] = useState(shouldShowPanels);

  useEffect(() => {
    void (async () => {
      const result = await api.checkVersion();
      if (result.has_update) {
        await message(
          `${translate(appLanguage, "updateAvailable")} ${result.latest_version}\n\n${translate(appLanguage, "updatePrompt")}`,
          { title: translate(appLanguage, "updateTitle"), kind: "info" }
        );
        api.quitApp();
      }
    })();
  }, [appLanguage]);

  useEffect(() => {
    void api
      .listWorlds()
      .then(setWorlds)
      .catch((err) => setLibraryError(String(err)));
    void api
      .getApiProfile()
      .then(setApiProfile)
      .catch((err) => setSettingsError(String(err)));
  }, [setApiProfile, setLibraryError, setSettingsError, setWorlds]);

  return (
    <main
      className={[
        "shell",
        libraryOpen ? "" : "library-collapsed",
        settingsOpen ? "" : "settings-collapsed"
      ].filter(Boolean).join(" ")}
    >
      <div className="shell-toolbar" aria-label={t("layoutControls")}>
        <button
          className="icon-button"
          type="button"
          onClick={() => setLibraryOpen((open) => !open)}
          aria-label={libraryOpen ? t("hideWorldLibrary") : t("showWorldLibrary")}
        >
          {libraryOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={() => setSettingsOpen((open) => !open)}
          aria-label={settingsOpen ? t("hideSettings") : t("showSettings")}
        >
          {settingsOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
        </button>
      </div>
      <button
        className="drawer-scrim"
        type="button"
        aria-label={t("closeSidePanels")}
        onClick={() => {
          setLibraryOpen(false);
          setSettingsOpen(false);
        }}
      />
      <aside className="sidebar" aria-label={t("worldLibrary")} aria-hidden={!libraryOpen}>
        <div className="brand">
          <BookOpen size={22} />
          <div>
            <strong>{t("brand")}</strong>
          </div>
        </div>
        <div className="section-title">
          <Library size={16} />
          <span>{t("worlds")}</span>
        </div>
        <WorldLibraryPage />
      </aside>

      <section className="reader-shell">
        {activeWorld ? <ReaderPage /> : <div className="empty-reader">{t("emptyReader")}</div>}
      </section>

      <aside className="inspector" aria-label={t("settingsAndStatus")} aria-hidden={!settingsOpen}>
        <div className="section-title">
          <Settings size={16} />
          <span>{t("settings")}</span>
        </div>
        <SettingsPanel />
        {settingsError ? (
          <div className="error-box" role="alert">
            <button onClick={() => setSettingsError(undefined)}>{t("dismiss")}</button>
            <p>{settingsError}</p>
          </div>
        ) : null}
      </aside>
    </main>
  );
}
