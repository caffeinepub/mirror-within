/**
 * aiProxy.ts — Mirror Within external AI proxy integration point
 *
 * This module prepares and sends the current reflection context to an external
 * AI proxy server. The proxy calls OpenAI (or another LLM) server-side, which
 * keeps the API key completely out of the browser.
 *
 * HOW TO ACTIVATE:
 *   1. Set AI_PROXY_ENDPOINT to your proxy server URL.
 *   2. Flip AI_PROXY_ENABLED to true.
 *
 * While disabled (default), sendToAIProxy always returns null and the existing
 * local Mirror logic continues completely unchanged.
 */

// ---------------------------------------------------------------------------
// Configuration — edit these when your proxy is ready
// ---------------------------------------------------------------------------

export const AI_PROXY_ENDPOINT =
  "https://mirror-within-proxy.onrender.com/api/reflect";
export const AI_PROXY_ENABLED = true;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConversationTurn = { role: "prompt" | "user"; text: string };

export type AIProxyRequest = {
  latestEntry: string;
  recentConversationTurns: ConversationTurn[];
  detectedEmotions: string[];
  detectedTriggers: string[];
  detectedBeliefs: string[];
  detectedCopingStyles: string[];
  phraseHits: { wound: string; phrase: string; weight: number }[];
  intensityHits: { strong: number; medium: number; pattern: number };
  contradictionHits: { label: string; weight: number }[];
  woundScores: Record<string, number>;
  primaryWound: string;
  secondaryWound: string | null;
  confidence: "high" | "medium" | "low";
  recentMirrorEntries: object[];
  recentMirrorRecentQuestions: string[];
};

export type AIProxyResponse = {
  conversationReply: string;
  mirrorMode: string;
  loopInterruption: string;
  nextQuestion: string;
  primaryWound: string;
  secondaryWound: string | null;
  confidence: "high" | "medium" | "low";
  reasoningTags: string[];
};

// ---------------------------------------------------------------------------
// Helper — derive confidence level from wound evidence
// ---------------------------------------------------------------------------

export function deriveConfidence(
  woundScores: Record<string, number>,
  phraseHits: AIProxyRequest["phraseHits"],
  contradictionHits: AIProxyRequest["contradictionHits"],
  intensityHits: AIProxyRequest["intensityHits"],
): "high" | "medium" | "low" {
  const maxScore = Math.max(0, ...Object.values(woundScores));
  const evidenceCount =
    phraseHits.length +
    contradictionHits.length +
    intensityHits.strong +
    intensityHits.medium +
    intensityHits.pattern;
  if (maxScore >= 12 || evidenceCount >= 7) return "high";
  if (maxScore >= 7 || evidenceCount >= 4) return "medium";
  return "low";
}

// ---------------------------------------------------------------------------
// Main send function
// ---------------------------------------------------------------------------

export async function sendToAIProxy(
  payload: AIProxyRequest,
): Promise<AIProxyResponse | null> {
  if (!AI_PROXY_ENABLED || !AI_PROXY_ENDPOINT) return null;
  try {
    const response = await fetch(AI_PROXY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.warn(
        `[Mirror Within] AI proxy responded with status ${response.status}. Falling back to local logic.`,
      );
      return null;
    }
    return (await response.json()) as AIProxyResponse;
  } catch (err) {
    console.warn(
      "[Mirror Within] AI proxy request failed. Falling back to local logic.",
      err,
    );
    return null;
  }
}

// ---------------------------------------------------------------------------
// Payload builder — assembles full reflection context from local state
// ---------------------------------------------------------------------------

export function buildAIProxyPayload(opts: {
  latestEntry: string;
  conversationThread: ConversationTurn[];
  analysis: {
    emotions: string[];
    triggers: string[];
    beliefs: string[];
    coping: string[];
    phraseHits: AIProxyRequest["phraseHits"];
    intensityHits: AIProxyRequest["intensityHits"];
    contradictionHits: AIProxyRequest["contradictionHits"];
    woundScores: Record<string, number>;
    primaryWound: string;
    secondaryWound: string | null;
  };
}): AIProxyRequest {
  const { latestEntry, conversationThread, analysis } = opts;

  let recentMirrorEntries: object[] = [];
  try {
    const raw = localStorage.getItem("mirrorEntries");
    const all: object[] = raw ? JSON.parse(raw) : [];
    recentMirrorEntries = all.slice(-5);
  } catch {
    recentMirrorEntries = [];
  }

  let recentMirrorRecentQuestions: string[] = [];
  try {
    const raw = localStorage.getItem("mirrorRecentQuestions");
    recentMirrorRecentQuestions = raw ? JSON.parse(raw) : [];
  } catch {
    recentMirrorRecentQuestions = [];
  }

  const confidence = deriveConfidence(
    analysis.woundScores,
    analysis.phraseHits,
    analysis.contradictionHits,
    analysis.intensityHits,
  );

  return {
    latestEntry,
    recentConversationTurns: conversationThread.slice(-10),
    detectedEmotions: analysis.emotions,
    detectedTriggers: analysis.triggers,
    detectedBeliefs: analysis.beliefs,
    detectedCopingStyles: analysis.coping,
    phraseHits: analysis.phraseHits,
    intensityHits: analysis.intensityHits,
    contradictionHits: analysis.contradictionHits,
    woundScores: analysis.woundScores,
    primaryWound: analysis.primaryWound,
    secondaryWound: analysis.secondaryWound,
    confidence,
    recentMirrorEntries,
    recentMirrorRecentQuestions,
  };
}
