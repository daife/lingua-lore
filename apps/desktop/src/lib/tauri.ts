import { invoke } from "@tauri-apps/api/core";
import type {
  ApiProfile,
  CreateWorldRequest,
  StoryTurnResult,
  TranslationResult,
  WorldBootstrap,
  WorldRecord
} from "./types";

export const api = {
  listWorlds: () => invoke<WorldRecord[]>("list_worlds"),
  createWorld: (request: CreateWorldRequest) => invoke<WorldRecord>("create_world", { request }),
  getWorldBootstrap: (worldId: string) =>
    invoke<WorldBootstrap>("get_world_bootstrap", { worldId }),
  getApiProfile: () => invoke<ApiProfile | null>("get_api_profile"),
  saveApiProfile: (profile: ApiProfile) => invoke<ApiProfile>("save_api_profile", { profile }),
  sendStoryTurn: (input: {
    world_id: string;
    scene_id: string;
    input: { kind: "choice"; choice_id: string } | { kind: "free_text"; text: string };
  }) => invoke<StoryTurnResult>("send_story_turn", { input }),
  translateSelection: (payload: {
    worldId: string;
    text: string;
    context?: string;
    sourceLanguage: string;
    targetLanguage: string;
  }) =>
    invoke<TranslationResult>("translate_selection", {
      worldId: payload.worldId,
      text: payload.text,
      context: payload.context ?? null,
      sourceLanguage: payload.sourceLanguage,
      targetLanguage: payload.targetLanguage
    }),
  saveVocabulary: (payload: {
    worldId: string;
    sourceText: string;
    translatedText: string;
    sourceLanguage: string;
    targetLanguage: string;
    context?: string;
    messageId?: string;
  }) =>
    invoke<void>("save_vocabulary", {
      worldId: payload.worldId,
      sourceText: payload.sourceText,
      translatedText: payload.translatedText,
      sourceLanguage: payload.sourceLanguage,
      targetLanguage: payload.targetLanguage,
      context: payload.context ?? null,
      messageId: payload.messageId ?? null
    })
};
