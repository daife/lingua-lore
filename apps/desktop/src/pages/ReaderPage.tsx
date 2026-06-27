import { FormEvent, MouseEvent, useRef, useState } from "react";
import { BookmarkPlus, Loader2, Send, Wand2 } from "lucide-react";
import { api } from "../lib/tauri";
import { readSelectionSnapshot, SelectionSnapshot } from "../lib/selection";
import type { ChoiceOutput, TranslationResult } from "../lib/types";
import { useAppStore } from "../stores/useAppStore";

export function ReaderPage() {
  const {
    activeWorld,
    activeSceneId,
    turns,
    choices,
    loading,
    setLoading,
    setError,
    pushTurn
  } = useAppStore();
  const storyRef = useRef<HTMLDivElement | null>(null);
  const [selection, setSelection] = useState<SelectionSnapshot | null>(null);
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [translating, setTranslating] = useState(false);

  if (!activeWorld || !activeSceneId) {
    return null;
  }

  async function sendFreeText(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = String(form.get("text") || "").trim();
    if (!text) {
      return;
    }
    event.currentTarget.reset();
    await sendTurn({ kind: "free_text", text });
  }

  async function selectChoice(choice: ChoiceOutput) {
    if (choice.id) {
      await sendTurn({ kind: "choice", choice_id: choice.id });
      return;
    }
    await sendTurn({ kind: "free_text", text: `${choice.label}. ${choice.text}` });
  }

  async function sendTurn(input: { kind: "free_text"; text: string } | { kind: "choice"; choice_id: string }) {
    setLoading(true);
    try {
      const result = await api.sendStoryTurn({
        world_id: activeWorld!.id,
        scene_id: activeSceneId!,
        input
      });
      pushTurn(result);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleMouseUp(_event: MouseEvent) {
    const snapshot = readSelectionSnapshot(storyRef.current);
    setSelection(snapshot);
    setTranslation(null);
    if (!snapshot) {
      return;
    }
    setTranslating(true);
    try {
      const result = await api.translateSelection({
        worldId: activeWorld.id,
        text: snapshot.text,
        context: snapshot.context,
        sourceLanguage: activeWorld.target_language,
        targetLanguage: "Chinese"
      });
      setTranslation(result);
    } catch (err) {
      setError(String(err));
    } finally {
      setTranslating(false);
    }
  }

  async function saveWord() {
    if (!translation) {
      return;
    }
    try {
      await api.saveVocabulary({
        worldId: activeWorld.id,
        sourceText: translation.source_text,
        translatedText: translation.translated_text,
        sourceLanguage: activeWorld.target_language,
        targetLanguage: "Chinese",
        context: selection?.context
      });
    } catch (err) {
      setError(String(err));
    }
  }

  return (
    <div className="reader-page">
      <header className="story-header">
        <div>
          <span>{activeWorld.target_language} · {activeWorld.language_level}</span>
          <h1>{activeWorld.title}</h1>
        </div>
        <button
          className="command-button compact"
          disabled={loading}
          onClick={() => void sendTurn({ kind: "free_text", text: "Begin the story with a vivid opening scene." })}
        >
          {loading ? <Loader2 className="spin" size={16} /> : <Wand2 size={16} />}
          Start turn
        </button>
      </header>

      <div className="story-viewport" ref={storyRef} onMouseUp={handleMouseUp}>
        {turns.length === 0 ? (
          <div className="opening-note">
            <h2>{activeWorld.description || "A new story is waiting."}</h2>
            <p>Press Start turn or enter a free action below.</p>
          </div>
        ) : (
          turns.map((turn) => (
            <article className="turn-block" key={turn.id}>
              <p className="narration">{turn.output.narration}</p>
              {turn.output.dialogues.map((dialogue, index) => (
                <p className="dialogue" key={`${turn.id}-${index}`}>
                  <strong>{dialogue.speaker}</strong>
                  <span>{dialogue.text}</span>
                </p>
              ))}
              <div className="scene-strip">
                <span>{turn.output.scene_status.location}</span>
                <span>{turn.output.scene_status.mood}</span>
                <span>{turn.output.scene_status.current_objective}</span>
              </div>
            </article>
          ))
        )}
      </div>

      <section className="choice-panel" aria-label="Choices">
        {choices.map((choice) => (
          <button className={`choice-card risk-${choice.risk}`} key={choice.label} onClick={() => void selectChoice(choice)} disabled={loading}>
            <strong>{choice.label}</strong>
            <span>{choice.text}</span>
            <small>{choice.intent} · {choice.risk}</small>
          </button>
        ))}
      </section>

      <form className="input-box" onSubmit={sendFreeText}>
        <input name="text" placeholder="Type a free action..." disabled={loading} />
        <button className="primary-button" disabled={loading}>
          {loading ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
          Send
        </button>
      </form>

      {selection ? (
        <div className="translate-popover" style={{ left: selection.x, top: selection.y }}>
          <strong>{selection.text}</strong>
          {translating ? <p>Translating...</p> : null}
          {translation ? (
            <>
              <p>{translation.translated_text || "No translation found."}</p>
              <div className="phones">
                {translation.us_phone ? <span>US /{translation.us_phone}/</span> : null}
                {translation.uk_phone ? <span>UK /{translation.uk_phone}/</span> : null}
              </div>
              {translation.phrases.length ? (
                <ul>
                  {translation.phrases.slice(0, 3).map((item) => (
                    <li key={item.key}>{item.key}: {item.value}</li>
                  ))}
                </ul>
              ) : null}
              <button className="command-button compact" onClick={() => void saveWord()}>
                <BookmarkPlus size={16} />
                Save
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
