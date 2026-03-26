import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;

export interface ConversationTurn {
  role: string;
  text: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  storyName: string;
  inputMode: string;
  summary: string;
  entryPoint: string;
  lens: string;
  rawText: string;
  aiReply: string;
  conversationTurns: ConversationTurn[];
  emotions: string[];
  triggers: string[];
  beliefs: string[];
  coping: string[];
  primaryWound: string;
  secondaryWound: string;
  mirrorMode: string;
  loopInterruption: string;
  confidence: string;
  timestamp: bigint;
}

export interface FeedbackEntry {
  id: string;
  userName: string;
  message: string;
  screen: string;
  createdAt: string;
}

export interface backendInterface {
  saveEntry(entry: JournalEntry): Promise<undefined>;
  getEntries(userId: string): Promise<JournalEntry[]>;
  deleteEntry(userId: string, entryId: string): Promise<boolean>;
  saveFeedback(entry: FeedbackEntry): Promise<undefined>;
  getAllFeedback(): Promise<FeedbackEntry[]>;
}
