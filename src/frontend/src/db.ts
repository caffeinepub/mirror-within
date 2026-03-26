/**
 * db.ts — Mirror Within backend persistence utilities
 *
 * Pure utility functions that accept an actor parameter.
 * All calls are fire-and-forget safe — null actor is a no-op.
 */

import type { FeedbackEntry, JournalEntry } from "./backend.d";

/** Generates/reads a persistent anonymous userId from localStorage */
export function getUserId(): string {
  let id = localStorage.getItem("mw_user_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("mw_user_id", id);
  }
  return id;
}

export async function dbSaveEntry(
  actor: any,
  params: {
    storyName: string;
    inputMode: string;
    entryPoint: string;
    lens: string;
    rawText: string;
    aiReply: string;
    conversationThread: Array<{ role: string; text: string }>;
    analysis: {
      emotions: string[];
      triggers: string[];
      beliefs: string[];
      coping: string[];
      primaryWound?: string;
      secondaryWound?: string | null;
      mirrorMode?: string;
      loopInterruption?: string;
      confidence?: string;
    };
  },
): Promise<void> {
  if (!actor) return;
  const summary = params.rawText.slice(0, 200);
  const entry: JournalEntry = {
    id: crypto.randomUUID(),
    userId: getUserId(),
    storyName: params.storyName,
    inputMode: params.inputMode,
    summary,
    entryPoint: params.entryPoint,
    lens: params.lens,
    rawText: params.rawText,
    aiReply: params.aiReply,
    conversationTurns: params.conversationThread.map((t) => ({
      role: t.role,
      text: t.text,
    })),
    emotions: params.analysis.emotions || [],
    triggers: params.analysis.triggers || [],
    beliefs: params.analysis.beliefs || [],
    coping: params.analysis.coping || [],
    primaryWound: params.analysis.primaryWound ?? "",
    secondaryWound: params.analysis.secondaryWound ?? "",
    mirrorMode: params.analysis.mirrorMode ?? "",
    loopInterruption: params.analysis.loopInterruption ?? "",
    confidence: params.analysis.confidence ?? "low",
    timestamp: BigInt(Date.now()),
  };
  await (actor as any).saveEntry(entry);
}

export async function dbGetEntries(actor: any): Promise<JournalEntry[]> {
  if (!actor) return [];
  const userId = getUserId();
  return (actor as any).getEntries(userId) as Promise<JournalEntry[]>;
}

export async function dbDeleteEntry(
  actor: any,
  entryId: string,
): Promise<boolean> {
  if (!actor) return false;
  const userId = getUserId();
  return (actor as any).deleteEntry(userId, entryId) as Promise<boolean>;
}

export async function dbSaveFeedback(
  actor: any,
  entry: {
    id: string;
    userName: string;
    message: string;
    screen: string;
    createdAt: string;
  },
): Promise<void> {
  if (!actor) return;
  await (actor as any).saveFeedback(entry);
}

export async function dbGetAllFeedback(actor: any): Promise<FeedbackEntry[]> {
  if (!actor) return [];
  return (actor as any).getAllFeedback() as Promise<FeedbackEntry[]>;
}
