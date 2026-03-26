import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Feather,
  MessageSquare,
  Mic,
  PenTool,
  Sparkles,
  Sprout,
  Wind,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildAIProxyPayload, getAIReply, sendToAIProxy } from "./aiProxy";
import {
  dbGetAllFeedback,
  dbGetEntries,
  dbSaveEntry,
  dbSaveFeedback,
} from "./db";
import { useActor } from "./hooks/useActor";
import {
  type MirrorAnalysis,
  analyzeEntry,
  buildMirror,
  getAdaptiveQuestions,
  getConfidence,
  getMirrorInsights,
  saveMirrorEntry,
  woundLabels,
} from "./mirrorLogic";

type Screen =
  | "journey"
  | "breathe"
  | "support"
  | "creator"
  | "feedback"
  | "garden";

type FeedbackEntry = {
  id: string;
  userName: string;
  message: string;
  createdAt: string;
  screen: string;
};

type ChapterRecord = {
  chapter: number;
  question: string;
  response: string;
  followups: string[];
  mode: string;
};

type PatternProfile = {
  counts: Record<string, number>;
  sessions: number;
};

type JourneyDraft = {
  step: number;
  sharedName: string;
  selectedPath: string | null;
  selectedMode: string | null;
  chapterIndex: number;
  typedResponses: Record<number, string>;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const DRAFT_KEY = "mirror_within_draft_v4";
const SESSION_KEY = "mirror_within_session_v4";
const FEEDBACK_KEY = "mirror_within_feedback_v4";
const PROFILE_KEY = "mw_profile_v1";
const ENTRIES_KEY = "mirrorEntries";
const SESSION_TIMEOUT_MS = 1000 * 60 * 30;

const allowedCodes: Record<string, string> = {
  Ree17: "kareesha",
  BluhzM: "mark",
  Kayswt: "Kayden",
  FieldsD: "Garfield",
  Jade: "jaida",
  CartyK: "CartyK",
  Iamki: "creator",
};

const crisisKeywords = [
  "suicide",
  "kill myself",
  "want to die",
  "end my life",
  "end it all",
  "don't want to live",
  "hurt myself",
  "harm myself",
  "self harm",
  "overdose",
  "better off dead",
  "unalive",
  "jump off",
  "no reason to live",
  "tired of everything",
  "no point",
];

const entryPaths = [
  {
    id: "surface",
    label: "Surface level",
    tone: "Light entry point",
    blurb:
      "For when you want to ease into reflection without feeling cornered.",
    tag: "Micro-introspection",
    chapterTitle: "A quieter chapter",
    questions: [
      "What annoyed you today more than it should have?",
      "What moment stayed with you after it was over?",
      "What felt off, but you brushed past it?",
    ],
  },
  {
    id: "attacked",
    label: "Ok I feel attacked",
    tone: "Sharper honesty",
    blurb:
      "For when you want the app to call out the pattern instead of dancing around it.",
    tag: "Shadow work",
    chapterTitle: "The call-out chapter",
    questions: [
      "What truth are you avoiding because naming it would force change?",
      "What are you pretending not to care about?",
      "What keeps repeating because it feels familiar, not because it feels right?",
    ],
  },
  {
    id: "love",
    label: "Love, distance, and attachment",
    tone: "Relationship lens",
    blurb:
      "For moments shaped by rejection, craving, confusion, or being too invested.",
    tag: "Attachment patterns",
    chapterTitle: "The heart chapter",
    questions: [
      "Do you want to be loved, or do you want to be chosen?",
      "What are you over-giving to keep?",
      "Are you reacting to them, or to what they made you feel about yourself?",
    ],
  },
  {
    id: "control",
    label: "Control, pressure, and performance",
    tone: "Protective lens",
    blurb:
      "For when your mind won't stop managing, planning, bracing, or carrying everything.",
    tag: "Fear + identity",
    chapterTitle: "The grip chapter",
    questions: [
      "What are you trying to control that is actually controlling you?",
      "What would happen if you loosened your grip?",
      "Who are you when you are not performing competence?",
    ],
  },
];

const basePatterns = [
  {
    id: "avoidance",
    name: "Avoidance",
    test: (t: string) => /(avoid|ignore|pretend|fine)/i.test(t),
    advice: "You may be avoiding naming something directly.",
  },
  {
    id: "control",
    name: "Control",
    test: (t: string) => /(control|plan|figure out|overthink)/i.test(t),
    advice: "You may be trying to control outcomes to feel safe.",
  },
  {
    id: "abandonment",
    name: "Fear of abandonment",
    test: (t: string) => /(leave|left|ignored|distance|not chosen)/i.test(t),
    advice: "There may be sensitivity to rejection or distance.",
  },
  {
    id: "overgiving",
    name: "Over-giving",
    test: (t: string) => /(give|gave|fix|do everything|prove)/i.test(t),
    advice: "You may be linking worth to what you give.",
  },
  {
    id: "deflection",
    name: "Deflection",
    test: (t: string) =>
      /(idk|i don'?t know|not sure|don'?t know|unsure|maybe|i guess|no idea)/i.test(
        t,
      ),
    advice: "Uncertainty can be a form of self-protection.",
  },
  {
    id: "minimizing",
    name: "Minimizing",
    test: (t: string) =>
      /(it'?s? fine|doesn'?t matter|not a big deal|whatever|not important|i'?m fine)/i.test(
        t,
      ),
    advice:
      "Minimizing feelings is often a learned response to having them dismissed.",
  },
  {
    id: "self_blame",
    name: "Self-blame",
    test: (t: string) =>
      /(my fault|i should have|i always|i never|i ruin|i mess|blame myself)/i.test(
        t,
      ),
    advice: "You may be directing responsibility inward.",
  },
  {
    id: "rumination",
    name: "Rumination",
    test: (t: string) =>
      /(keep thinking|can'?t stop|going over|over and over|stuck on|obsessing|loop)/i.test(
        t,
      ),
    advice:
      "Your mind may be trying to solve something that isn't a thinking problem.",
  },
  {
    id: "people_pleasing",
    name: "People-pleasing",
    test: (t: string) =>
      /(make them happy|keep the peace|don'?t want to upset|not want to disappoint|their feelings|they need)/i.test(
        t,
      ),
    advice: "You may be prioritizing others' comfort over your own truth.",
  },
  {
    id: "numbness",
    name: "Emotional numbness",
    test: (t: string) =>
      /(feel nothing|don'?t feel|numb|blank|empty|disconnected|shut down)/i.test(
        t,
      ),
    advice:
      "Numbness is often protection from something that felt too big to feel.",
  },
];

// ─── Conversational follow-up engine ─────────────────────────────────────────
const vagueSignals =
  /\b(idk|i don'?t know|not sure|don'?t know|unsure|maybe|i guess|no idea)\b/i;
const minimizingSignals =
  /\b(it'?s? fine|doesn'?t matter|not a big deal|whatever|not important|i'?m fine)\b/i;

const followupTemplates = {
  vague: [
    "That's okay. What's the first word that comes to mind when you sit with this?",
    "No pressure to have an answer. What does your body do when you think about it?",
    "You don't have to know yet. What part of not knowing feels uncomfortable?",
    "What would you say if you had to guess?",
  ],
  minimizing: [
    "What would you say if it did matter?",
    "What are you protecting by keeping it small?",
    "Imagine someone you love said that to you. What would you want to say back?",
    "What does it cost you to keep calling it fine?",
  ],
  surface: [
    "What was the emotion underneath that moment before you moved on?",
    "Why do you think that specific thing stayed with you and not something else?",
    "What does that feeling remind you of from before?",
    "If you had to name the feeling in one word, what would it be?",
    "What did you want to happen instead?",
  ],
  attacked: [
    "What changes the second you stop pretending not to know this?",
    "What do you gain from keeping this pattern alive?",
    "Who taught you that this was the way to survive?",
    "What would you have to give up if this pattern no longer served you?",
    "What are you most afraid to say out loud about this?",
  ],
  love: [
    "Are you trying to be understood, or are you trying not to be abandoned?",
    "What are you accepting because being chosen feels better than being alone?",
    "What does love feel like when it's not something you have to earn?",
    "What part of you believes you have to work to keep people?",
    "What are you over-explaining right now?",
  ],
  control: [
    "What are you afraid would happen if you were not holding everything together?",
    "Who are you without the role of being the one who manages it all?",
    "What would rest actually look like for you right now?",
    "When did control start feeling like safety?",
    "What would you let go of if you knew it would still be okay?",
  ],
  integration: [
    "What do you know now that you didn't when this chapter started?",
    "What's the thing you said today that surprised you most?",
    "What pattern do you notice in what you've shared?",
    "If your past self could hear what you just said, what would they feel?",
  ],
};

function generateFollowup(
  response: string,
  pathId: string,
  exchangeCount: number,
): string {
  const r = (response || "").trim();

  // Integration question after 3+ exchanges
  if (exchangeCount >= 3) {
    const pool = followupTemplates.integration;
    return pool[exchangeCount % pool.length];
  }

  // Vague/uncertain response
  if (r.length < 15 || vagueSignals.test(r)) {
    const pool = followupTemplates.vague;
    return pool[exchangeCount % pool.length];
  }

  // Minimizing response
  if (minimizingSignals.test(r)) {
    const pool = followupTemplates.minimizing;
    return pool[exchangeCount % pool.length];
  }

  // Path-specific follow-ups
  const pathPool =
    pathId === "surface"
      ? followupTemplates.surface
      : pathId === "attacked"
        ? followupTemplates.attacked
        : pathId === "love"
          ? followupTemplates.love
          : pathId === "control"
            ? followupTemplates.control
            : followupTemplates.integration;

  return pathPool[exchangeCount % pathPool.length];
}

const adaptiveQuestions = {
  deepen: [
    "If this pattern stopped tomorrow, what would change immediately?",
    "What are you protecting by keeping this pattern alive?",
    "Where did you first learn this response?",
  ],
  shift: [
    "What perspective have you not considered yet?",
    "If someone you trust saw this, what would they say?",
    "What would the opposite reaction look like?",
  ],
  stay: [
    "What detail are you still skimming past?",
    "What part of this feels most uncomfortable to name?",
    "What are you not saying directly yet?",
  ],
};

const CREATOR_STORY = {
  WHO_I_AM: [
    "I am someone who spent years performing okayness while something quieter burned underneath.",
    "I learned early that to be soft was to be unsafe, and so I became competent. Controlled. Contained.",
  ],
  MY_BATTLE: [
    "Anxiety that lived behind productivity. Relationships I over-gave to. A relentless internal critic dressed as high standards.",
    "I journaled for years but always wrote around the real thing. I needed something that would call me out. Something that asked the question behind the question.",
  ],
  WHY_I_BUILT_THIS: [
    "I built Mirror Within because I needed it and could not find it. Not a mood tracker. Not a gratitude app. Something that goes inward instead of around.",
    "This app is for the people who already know something is there, and need help naming it.",
  ],
  CLOSING_QUOTE_LINE1:
    "You do not need to have it figured out. You just need to be honest about what you already know.",
  CLOSING_QUOTE_LINE2:
    "That is what Mirror Within is for. Take your time in here.",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function formatTimeRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function hasCrisisLanguage(text: string): boolean {
  const lower = text.toLowerCase();
  return crisisKeywords.some((kw) => lower.includes(kw));
}

function getCrisisSeverity(text: string): "high" | "medium" | "low" | null {
  const t = (text || "").toLowerCase();
  if (
    t.includes("kill myself") ||
    t.includes("end my life") ||
    t.includes("overdose")
  )
    return "high";
  if (
    t.includes("want to die") ||
    t.includes("don't want to live") ||
    t.includes("suicide")
  )
    return "medium";
  if (
    t.includes("tired of everything") ||
    t.includes("no point") ||
    t.includes("better off dead")
  )
    return "low";
  return null;
}

function severityCopy(severity: "high" | "medium" | "low" | null): {
  title: string;
  body: string;
} {
  if (severity === "high")
    return {
      title: "Immediate support matters right now.",
      body: "What you wrote suggests you may be in immediate danger. Please reach out for urgent human support now.",
    };
  if (severity === "medium")
    return {
      title: "You deserve support right now.",
      body: "What you wrote sounds serious. Please connect with crisis support, someone you trust, or emergency help if you may act on these thoughts.",
    };
  return {
    title: "It sounds like you're carrying something heavy.",
    body: "Please do not sit with this alone. Even if you are unsure, reaching out to a real person can help.",
  };
}

function detectPatternIds(texts: string[]): string[] {
  const joined = texts.join(" ");
  return basePatterns.filter((p) => p.test(joined)).map((p) => p.id);
}

function pickNextRoute(
  detectedIds: string[],
  profile: PatternProfile,
): {
  action: "deepen" | "stay" | "shift";
  focus: string | null;
  reason: string;
} {
  if (!detectedIds.length)
    return { action: "shift", focus: null, reason: "No clear pattern yet" };
  const merged: Record<string, number> = { ...profile.counts };
  for (const id of detectedIds) {
    merged[id] = (merged[id] || 0) + 1;
  }
  const dominant =
    Object.entries(merged).sort((a, b) => (b[1] || 0) - (a[1] || 0))[0]?.[0] ??
    null;
  if (dominant && (profile.counts[dominant] || 0) >= 2) {
    return {
      action: "deepen",
      focus: dominant,
      reason: "Recurring pattern detected",
    };
  }
  return {
    action: "stay",
    focus: dominant,
    reason: "Keep exploring this layer",
  };
}

function loadProfile(): PatternProfile {
  return safeJsonParse<PatternProfile>(localStorage.getItem(PROFILE_KEY), {
    counts: {},
    sessions: 0,
  });
}

function saveProfile(p: PatternProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  } catch {
    // ignore
  }
}

// ─── Detailed Analysis ────────────────────────────────────────────────────────
const analysisDictionaries = {
  emotions: {
    fear: [
      "afraid",
      "fear",
      "scared",
      "anxious",
      "panic",
      "worried",
      "uneasy",
      "nervous",
    ],
    anger: [
      "angry",
      "mad",
      "resent",
      "furious",
      "irritated",
      "pissed",
      "annoyed",
    ],
    shame: ["ashamed", "embarrassed", "humiliated", "stupid", "guilty"],
    sadness: ["sad", "hurt", "cry", "empty", "grief", "lonely", "down"],
    rejection: [
      "ignored",
      "rejected",
      "left out",
      "abandoned",
      "not chosen",
      "dismissed",
      "unwanted",
    ],
    control: [
      "control",
      "helpless",
      "powerless",
      "stuck",
      "trapped",
      "cornered",
    ],
  },
  triggers: {
    family: [
      "mom",
      "mother",
      "dad",
      "father",
      "sister",
      "brother",
      "family",
      "parent",
    ],
    relationship: [
      "boyfriend",
      "girlfriend",
      "partner",
      "husband",
      "wife",
      "relationship",
      "dating",
    ],
    work: ["work", "boss", "job", "manager", "coworker", "office", "shift"],
    selfImage: ["body", "looks", "ugly", "pretty", "weight", "shape", "skin"],
    money: ["money", "bills", "debt", "rent", "broke", "paycheck"],
    health: ["sick", "pain", "doctor", "hospital", "health", "medication"],
  },
  beliefs: {
    abandonment: ["left", "leave me", "abandoned", "not chosen", "replace me"],
    unworthiness: [
      "not enough",
      "unlovable",
      "worthless",
      "undeserving",
      "not good enough",
    ],
    overResponsibility: [
      "my fault",
      "i have to fix",
      "i have to help",
      "responsible for everyone",
    ],
    mistrust: [
      "cannot trust",
      "don't trust",
      "they lie",
      "they always lie",
      "unsafe with people",
    ],
    selfSilencing: [
      "keep quiet",
      "say nothing",
      "hold it in",
      "swallow it",
      "stay silent",
    ],
  },
  coping: {
    avoidance: [
      "avoid",
      "ignore it",
      "pretend",
      "shut down",
      "disconnect",
      "numb",
    ],
    caretaking: ["help them", "save them", "fix them", "take care of them"],
    peoplePleasing: [
      "keep the peace",
      "make them happy",
      "please them",
      "don't upset them",
    ],
    rumination: [
      "overthink",
      "thinking about it",
      "replay",
      "keep replaying",
      "looping",
    ],
    confrontation: ["argue", "confront", "call out", "fight back"],
  },
};

type DetailedAnalysis = {
  id: number;
  storyName: string;
  entryPoint: string;
  lens: string;
  entry: string;
  emotions: string[];
  triggers: string[];
  beliefs: string[];
  coping: string[];
  timestamp: string;
};

function runDetailedAnalysis(
  entry: string,
  entryPoint: string,
  lensTitle: string,
  storyName: string,
): DetailedAnalysis {
  const text = (entry || "").toLowerCase();
  function detect(map: Record<string, string[]>): string[] {
    return Object.entries(map)
      .filter(([, words]) => words.some((w) => text.includes(w)))
      .map(([label]) => label);
  }
  return {
    id: Date.now(),
    storyName: storyName || "Unnamed story",
    entryPoint: entryPoint || "surface",
    lens: lensTitle || "Unknown",
    entry,
    emotions: detect(analysisDictionaries.emotions),
    triggers: detect(analysisDictionaries.triggers),
    beliefs: detect(analysisDictionaries.beliefs),
    coping: detect(analysisDictionaries.coping),
    timestamp: new Date().toISOString(),
  };
}

function saveDetailedEntry(analysis: DetailedAnalysis): void {
  try {
    const existing: DetailedAnalysis[] = JSON.parse(
      localStorage.getItem(ENTRIES_KEY) || "[]",
    );
    if (!existing.some((e) => e.id === analysis.id)) {
      existing.push(analysis);
      localStorage.setItem(ENTRIES_KEY, JSON.stringify(existing));
    }
  } catch {
    // ignore storage errors
  }
}

function getHistoryInsights() {
  try {
    const saved: DetailedAnalysis[] = JSON.parse(
      localStorage.getItem(ENTRIES_KEY) || "[]",
    );
    if (!saved.length) return null;
    function countTags(key: keyof DetailedAnalysis) {
      const counts: Record<string, number> = {};
      for (const item of saved) {
        for (const tag of (item[key] as string[]) || []) {
          counts[tag] = (counts[tag] || 0) + 1;
        }
      }
      return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }
    function patternLabel(count: number) {
      if (count >= 5) return "Major pattern";
      if (count >= 3) return "Recurring pattern";
      if (count >= 2) return "Emerging pattern";
      return "Early signal";
    }
    return {
      count: saved.length,
      emotions: countTags("emotions"),
      triggers: countTags("triggers"),
      beliefs: countTags("beliefs"),
      coping: countTags("coping"),
      patternLabel,
    };
  } catch {
    return null;
  }
}

// ─── BreatheScreen ────────────────────────────────────────────────────────────
type BreathePhase = "inhale" | "hold-in" | "exhale" | "hold-out";
const BREATHE_PHASES: {
  phase: BreathePhase;
  label: string;
  duration: number;
}[] = [
  { phase: "inhale", label: "Inhale", duration: 4 },
  { phase: "hold-in", label: "Hold", duration: 4 },
  { phase: "exhale", label: "Exhale", duration: 4 },
  { phase: "hold-out", label: "Hold", duration: 4 },
];

function BreatheScreen({ onStop }: { onStop: () => void }) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [countdown, setCountdown] = useState(4);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef(4);
  const phaseIndexRef = useRef(0);

  useEffect(() => {
    countdownRef.current = 4;
    phaseIndexRef.current = 0;
    setCountdown(4);
    setPhaseIndex(0);
    intervalRef.current = setInterval(() => {
      countdownRef.current -= 1;
      if (countdownRef.current <= 0) {
        const nextPhase = (phaseIndexRef.current + 1) % BREATHE_PHASES.length;
        phaseIndexRef.current = nextPhase;
        countdownRef.current = BREATHE_PHASES[nextPhase].duration;
        setPhaseIndex(nextPhase);
      }
      setCountdown(countdownRef.current);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const currentPhase = BREATHE_PHASES[phaseIndex];
  const isExpanded =
    currentPhase.phase === "inhale" || currentPhase.phase === "hold-in";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center py-8"
    >
      <h2
        className="text-[24px] font-extrabold mb-2 font-display text-center"
        style={{ color: "#fff4f8" }}
      >
        Box Breathing
      </h2>
      <p className="text-sm mb-10 text-center" style={{ color: "#dbc8cf" }}>
        4 · 4 · 4 · 4 — breathe at your own pace
      </p>
      <div
        className="relative flex items-center justify-center mb-10"
        style={{ width: 220, height: 220 }}
      >
        <motion.div
          animate={{
            scale: isExpanded ? 1 : 0.72,
            opacity: isExpanded ? 0.18 : 0.06,
          }}
          transition={{ duration: 3.8, ease: "easeInOut" }}
          className="absolute rounded-full"
          style={{ width: 220, height: 220, backgroundColor: "#efc1d0" }}
        />
        <motion.div
          animate={{ scale: isExpanded ? 1 : 0.62 }}
          transition={{ duration: 3.8, ease: "easeInOut" }}
          className="absolute rounded-full border-2"
          style={{
            width: 180,
            height: 180,
            borderColor: "#efc1d0",
            backgroundColor: "rgba(239,193,208,0.07)",
          }}
        />
        <span
          className="relative text-[48px] font-extrabold font-display z-10"
          style={{ color: "#efc1d0" }}
        >
          {countdown}
        </span>
      </div>
      <motion.p
        key={currentPhase.phase}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-[28px] font-extrabold mb-12 font-display tracking-wide"
        style={{ color: "#f8e8ee" }}
      >
        {currentPhase.label}
      </motion.p>
      <div className="flex gap-3 mb-14">
        {BREATHE_PHASES.map((bp, i) => (
          <div
            key={bp.phase}
            className="rounded-full transition-all"
            style={{
              width: i === phaseIndex ? 28 : 8,
              height: 8,
              backgroundColor: i === phaseIndex ? "#efc1d0" : "#4a323c",
            }}
          />
        ))}
      </div>
      <button
        type="button"
        data-ocid="breathe.stop.button"
        onClick={onStop}
        className="rounded-full px-8 py-3 text-sm font-bold border transition-opacity hover:opacity-80"
        style={{
          borderColor: "#76515e",
          color: "#f4d6df",
          backgroundColor: "transparent",
        }}
      >
        Stop breathing
      </button>
    </motion.div>
  );
}

// ─── CrisisModal ──────────────────────────────────────────────────────────────
function CrisisModal({
  open,
  onClose,
  onSupport,
}: {
  open: boolean;
  onClose: () => void;
  onSupport: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ backgroundColor: "rgba(20,15,18,0.88)" }}
      data-ocid="crisis.modal"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm rounded-[24px] p-6 border"
        style={{ backgroundColor: "#20161b", borderColor: "#76515e" }}
      >
        <h3
          className="text-lg font-extrabold mb-3 font-display"
          style={{ color: "#fff4f8" }}
        >
          Immediate support matters
        </h3>
        <p className="text-sm leading-6 mb-4" style={{ color: "#dbc8cf" }}>
          It sounds like you may be going through something intense right now.
          This app is not enough on its own for an immediate safety crisis.
          Please reach out to emergency services, a crisis line, or someone
          physically near you.
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            data-ocid="crisis.confirm_button"
            onClick={onSupport}
            className="w-full rounded-[18px] py-3 text-sm font-extrabold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#efc1d0", color: "#1d1418" }}
          >
            Get support now
          </button>
          <button
            type="button"
            data-ocid="crisis.cancel_button"
            onClick={onClose}
            className="w-full rounded-[18px] py-3 text-sm font-bold transition-opacity hover:opacity-70"
            style={{ color: "#8d7d84", backgroundColor: "transparent" }}
          >
            Continue
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── ClearDataModal ───────────────────────────────────────────────────────────
function ClearDataModal({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ backgroundColor: "rgba(20,15,18,0.88)" }}
      data-ocid="clear_data.modal"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="w-full max-w-sm rounded-[24px] p-6 border"
        style={{ backgroundColor: "#20161b", borderColor: "#38262e" }}
      >
        <h3
          className="text-lg font-extrabold mb-2 font-display"
          style={{ color: "#fff4f8" }}
        >
          Clear all local data?
        </h3>
        <p className="text-sm leading-6 mb-4" style={{ color: "#dbc8cf" }}>
          This will permanently remove your journey drafts, feedback, and
          pattern profile from this device.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            data-ocid="clear_data.cancel_button"
            onClick={onCancel}
            className="flex-1 rounded-[18px] py-3 text-sm font-bold border"
            style={{
              borderColor: "#76515e",
              color: "#f4d6df",
              backgroundColor: "transparent",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            data-ocid="clear_data.confirm_button"
            onClick={onConfirm}
            className="flex-1 rounded-[18px] py-3 text-sm font-extrabold"
            style={{ backgroundColor: "#c0445e", color: "#fff" }}
          >
            Clear all
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── PathPreview ──────────────────────────────────────────────────────────────
function PathPreview({
  path,
  selected,
  onClick,
}: {
  path: (typeof entryPaths)[number];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[28px] border p-5 text-left transition w-full"
      style={{
        borderColor: selected ? "#efc1d0" : "#3d2a32",
        backgroundColor: selected ? "#2a1d23" : "#24181d",
      }}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-lg font-extrabold" style={{ color: "#fff4f8" }}>
            {path.label}
          </p>
          <p
            className="mt-1 text-sm font-semibold"
            style={{ color: "#efc1d0" }}
          >
            {path.tone}
          </p>
          <p className="mt-3 text-sm leading-6" style={{ color: "#d5c4cb" }}>
            {path.blurb}
          </p>
        </div>
        <span
          className="self-start rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide whitespace-nowrap"
          style={{ borderColor: "#4a323c", color: "#f0d7df" }}
        >
          {path.tag}
        </span>
      </div>
    </button>
  );
}

// ─── CreatorScreen ────────────────────────────────────────────────────────────
function CreatorScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-5"
    >
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <h2
          className="text-[24px] font-extrabold mb-2 font-display"
          style={{ color: "#fff4f8" }}
        >
          Behind the Eyes of the Creator
        </h2>
        <p
          className="text-[15px] leading-[24px] italic"
          style={{ color: "#c8a8b4" }}
        >
          A story of survival, self-inquiry, and showing up anyway.
        </p>
        <div
          className="mt-5 h-px w-16 rounded-full"
          style={{ backgroundColor: "#76515e" }}
        />
      </motion.div>

      {[
        {
          label: "Who I Am",
          title: "The person before the story",
          paras: CREATOR_STORY.WHO_I_AM,
        },
        {
          label: "My Battle",
          title: "What I actually went through",
          paras: CREATOR_STORY.MY_BATTLE,
        },
        {
          label: "Why I Built This",
          title: "The app I needed and couldn't find",
          paras: CREATOR_STORY.WHY_I_BUILT_THIS,
        },
      ].map(({ label, title, paras }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: (i + 1) * 0.08 }}
        >
          <div
            className="rounded-[24px] p-[18px] border"
            style={{ backgroundColor: "#1b1317", borderColor: "#35242c" }}
          >
            <p
              className="text-[11px] font-extrabold tracking-[1.8px] uppercase mb-3"
              style={{ color: "#d9a6b7" }}
            >
              {label}
            </p>
            <h3
              className="text-[18px] font-extrabold mb-3 font-display"
              style={{ color: "#fff4f8" }}
            >
              {title}
            </h3>
            {paras.map((para) => (
              <p
                key={para.slice(0, 24)}
                className="text-[15px] leading-[23px] mb-3"
                style={{ color: "#dbc8cf" }}
              >
                {para}
              </p>
            ))}
          </div>
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.36 }}
      >
        <div
          className="rounded-[24px] p-[22px] border"
          style={{ backgroundColor: "#1e1118", borderColor: "#76515e" }}
        >
          <p
            className="text-[17px] leading-[28px] font-semibold italic mb-4"
            style={{ color: "#f8e8ee" }}
          >
            {CREATOR_STORY.CLOSING_QUOTE_LINE1}
          </p>
          <p
            className="text-[14px] leading-[22px]"
            style={{ color: "#d6c5cb" }}
          >
            {CREATOR_STORY.CLOSING_QUOTE_LINE2}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── SupportScreen ────────────────────────────────────────────────────────────
function SupportScreen({
  crisisContent,
  crisisCount,
  locationLabel,
  onRequestLocation,
  onContinue,
}: {
  crisisContent: { title: string; body: string };
  crisisCount: number;
  locationLabel: string;
  onRequestLocation: () => void;
  onContinue: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-5"
    >
      <div
        className="rounded-[24px] p-[18px] border"
        style={{ backgroundColor: "#1b1317", borderColor: "#35242c" }}
      >
        <h2
          className="text-[22px] font-extrabold mb-3 font-display"
          style={{ color: "#fff4f8" }}
        >
          Immediate support
        </h2>
        <p
          className="text-[15px] leading-[23px] mb-4"
          style={{ color: "#dbc8cf" }}
        >
          {crisisContent.body}
        </p>
        <a
          href="tel:911"
          className="block w-full text-center rounded-[18px] py-[14px] px-4 text-sm font-extrabold mt-3 transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#efc1d0", color: "#1d1418" }}
        >
          Call emergency services
        </a>
        <a
          href="tel:988"
          className="block w-full text-center rounded-[18px] py-[14px] px-4 text-sm font-bold mt-2 border transition-opacity hover:opacity-80"
          style={{
            borderColor: "#76515e",
            color: "#f4d6df",
            backgroundColor: "transparent",
          }}
        >
          Call or text 988
        </a>
        <button
          type="button"
          onClick={onRequestLocation}
          className="block w-full text-center rounded-[18px] py-[14px] px-4 text-sm font-bold mt-2 border transition-opacity hover:opacity-80"
          style={{
            borderColor: "#76515e",
            color: "#f4d6df",
            backgroundColor: "transparent",
          }}
        >
          Share live location for this session
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="block w-full text-center rounded-[18px] py-[14px] px-4 text-sm font-bold mt-2 border transition-opacity hover:opacity-80"
          style={{
            borderColor: "#76515e",
            color: "#f4d6df",
            backgroundColor: "transparent",
          }}
        >
          Continue reflection
        </button>
      </div>
      <div
        className="rounded-[24px] p-[18px] border"
        style={{ backgroundColor: "#1b1317", borderColor: "#35242c" }}
      >
        <h3
          className="text-[18px] font-extrabold mb-3 font-display"
          style={{ color: "#fff4f8" }}
        >
          Support notes
        </h3>
        <div className="space-y-2">
          {[
            "This flow is transparent and consent-based.",
            "It does not secretly contact emergency services.",
            "Location is requested only if you choose to share it.",
            "Replace 911 and 988 if you later localize this for another region.",
          ].map((note) => (
            <p
              key={note}
              className="text-sm leading-6"
              style={{ color: "#dbc8cf" }}
            >
              • {note}
            </p>
          ))}
        </div>
        <div
          className="mt-4 rounded-[18px] border p-4"
          style={{ backgroundColor: "#2a1f24", borderColor: "#4a323c" }}
        >
          <p className="text-sm font-bold mb-1" style={{ color: "#f1d8df" }}>
            Current session
          </p>
          <p className="text-sm leading-6" style={{ color: "#dbc8cf" }}>
            Crisis flags: {crisisCount}
          </p>
          <p className="text-sm leading-6" style={{ color: "#dbc8cf" }}>
            Location: {locationLabel}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── GardenPanel ──────────────────────────────────────────────────────────────
const GARDEN_KEY = "mw_garden_v1";
const PLANT_UNLOCK_DATES_KEY = "mw_plant_unlock_dates_v1";

interface GardenProps {
  journeyStep: number;
  savedChapters: { chapter: number; question: string; response: string }[];
  selectedPath: string | null;
  profile: { sessions: number; counts: Record<string, number> };
}

const gardenPlants = [
  {
    id: "sprout",
    name: "Sprout of Beginning",
    color: "#7a9e7e",
    budColor: "#a8c5aa",
  },
  {
    id: "moonflower",
    name: "Moonflower of Self-Awareness",
    color: "#d8eeff",
    budColor: "#aad4f5",
  },
  {
    id: "lavender",
    name: "Lavender of Gentleness",
    color: "#9b8fc4",
    budColor: "#b8aedc",
  },
  {
    id: "chrysanthemum",
    name: "Chrysanthemum of Courage",
    color: "#e88fa0",
    budColor: "#f5b8c4",
  },
  {
    id: "lotus",
    name: "Lotus of Neutral Attachment",
    color: "#f4a8c0",
    budColor: "#f9d0df",
  },
  {
    id: "forgetmenot",
    name: "Forget-me-not of Letting Go",
    color: "#7ab0e8",
    budColor: "#aaccf5",
  },
  {
    id: "rose",
    name: "Rose of Self-Esteem",
    color: "#c45c6a",
    budColor: "#e08a96",
  },
  {
    id: "jasmine",
    name: "Jasmine of Confidence",
    color: "#f4f0e8",
    budColor: "#fffdf5",
  },
  {
    id: "sunflower",
    name: "Sunflower of Self-Love",
    color: "#e8c87a",
    budColor: "#f5dfa0",
  },
  {
    id: "willow",
    name: "Willow of Resilience",
    color: "#7ab87a",
    budColor: "#a8c8a8",
  },
];

const GARDEN_STYLES = `
@keyframes growUp {
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
}
@keyframes sway {
  0%, 100% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
}
@keyframes seedPulse {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.15); }
}
.plant-grow {
  transform-origin: bottom center;
  animation: growUp 1.2s ease-out both;
}
.plant-sway {
  transform-origin: bottom center;
  animation: sway 3s ease-in-out infinite;
}
.seed-pulse {
  animation: seedPulse 2.5s ease-in-out infinite;
}
`;

function PlantStageSVG({
  id,
  stage,
  color,
  budColor,
}: { id: string; stage: number; color: string; budColor: string }) {
  // Stage 0: locked seed dot
  if (stage === 0) {
    return (
      <svg viewBox="0 0 40 60" width="36" height="54" aria-hidden="true">
        <ellipse cx="20" cy="54" rx="6" ry="2.5" fill="#3b2410" opacity="0.6" />
        <ellipse
          cx="20"
          cy="50"
          rx="4"
          ry="5"
          fill="#4a3020"
          className="seed-pulse"
        />
      </svg>
    );
  }

  // Stage 1: tiny sprout
  if (stage === 1) {
    return (
      <svg viewBox="0 0 40 60" width="36" height="54" aria-hidden="true">
        <g className="plant-grow">
          <line
            x1="20"
            y1="58"
            x2="20"
            y2="42"
            stroke="#4d7c52"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <ellipse
            cx="14"
            cy="40"
            rx="5"
            ry="3"
            fill={color}
            transform="rotate(-30 14 40)"
          />
        </g>
      </svg>
    );
  }

  // Stage 2: taller stem, 2 leaves, bud — plant-specific bud colors
  if (stage === 2) {
    return (
      <svg viewBox="0 0 40 60" width="36" height="54" aria-hidden="true">
        <g className="plant-grow">
          <line
            x1="20"
            y1="58"
            x2="20"
            y2="30"
            stroke="#4d7c52"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <ellipse
            cx="13"
            cy="48"
            rx="6"
            ry="3"
            fill={color}
            transform="rotate(-35 13 48)"
          />
          <ellipse
            cx="27"
            cy="40"
            rx="6"
            ry="3"
            fill={color}
            transform="rotate(35 27 40)"
          />
          {/* bud */}
          <ellipse cx="20" cy="26" rx="4" ry="5" fill={budColor} />
          <line
            x1="20"
            y1="21"
            x2="20"
            y2="23"
            stroke="#4d7c52"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
      </svg>
    );
  }

  // Stage 3: full bloom per plant identity
  const blooms: Record<string, React.ReactNode> = {
    sprout: (
      <g className="plant-sway">
        <line
          x1="20"
          y1="58"
          x2="20"
          y2="30"
          stroke="#4d7c52"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <ellipse
          cx="13"
          cy="46"
          rx="6"
          ry="3"
          fill="#a8c5aa"
          transform="rotate(-30 13 46)"
        />
        <ellipse
          cx="27"
          cy="40"
          rx="6"
          ry="3"
          fill="#a8c5aa"
          transform="rotate(30 27 40)"
        />
        <ellipse cx="20" cy="22" rx="8" ry="10" fill="#7a9e7e" />
        <ellipse
          cx="12"
          cy="30"
          rx="6"
          ry="4"
          fill="#a8c5aa"
          transform="rotate(-30 12 30)"
        />
      </g>
    ),
    moonflower: (
      <g className="plant-sway">
        <line
          x1="20"
          y1="58"
          x2="20"
          y2="30"
          stroke="#4d7c52"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <ellipse
          cx="13"
          cy="46"
          rx="5"
          ry="3"
          fill="#7a9e7e"
          transform="rotate(-30 13 46)"
        />
        <ellipse
          cx="27"
          cy="40"
          rx="5"
          ry="3"
          fill="#7a9e7e"
          transform="rotate(30 27 40)"
        />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <ellipse
            key={a}
            cx={20}
            cy={11}
            rx="2.5"
            ry="4"
            fill="#d8eeff"
            transform={`rotate(${a} 20 22)`}
          />
        ))}
        <circle cx="20" cy="22" r="9" fill="#d8eeff" />
        <circle cx="16" cy="18" r="5" fill="#1b1317" />
      </g>
    ),
    lavender: (
      <g className="plant-sway">
        <line
          x1="20"
          y1="58"
          x2="20"
          y2="30"
          stroke="#4d7c52"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="20"
          y1="46"
          x2="13"
          y2="40"
          stroke="#7a9e7e"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="20"
          y1="46"
          x2="27"
          y2="40"
          stroke="#7a9e7e"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {[0, 4, 8, 12, 16, 20].map((i) => (
          <ellipse
            key={i}
            cx="20"
            cy={30 - i * 1.8}
            rx="3"
            ry="2"
            fill="#9b8fc4"
          />
        ))}
      </g>
    ),
    chrysanthemum: (
      <g className="plant-sway">
        <line
          x1="20"
          y1="58"
          x2="20"
          y2="32"
          stroke="#4d7c52"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <ellipse
          cx="13"
          cy="46"
          rx="5"
          ry="3"
          fill="#a8c5aa"
          transform="rotate(-30 13 46)"
        />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => (
          <ellipse
            key={a}
            cx="20"
            cy="14"
            rx="2"
            ry="6"
            fill="#e88fa0"
            transform={`rotate(${a} 20 22)`}
          />
        ))}
        <circle cx="20" cy="22" r="5" fill="#f5c8d0" />
      </g>
    ),
    lotus: (
      <g className="plant-sway">
        <line
          x1="20"
          y1="58"
          x2="20"
          y2="36"
          stroke="#4d7c52"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <ellipse
            key={a}
            cx="20"
            cy="14"
            rx="3"
            ry="8"
            fill="#f4a8c0"
            transform={`rotate(${a} 20 24)`}
          />
        ))}
        <circle cx="20" cy="24" r="5" fill="#f9d0df" />
      </g>
    ),
    forgetmenot: (
      <g className="plant-sway">
        <line
          x1="20"
          y1="58"
          x2="20"
          y2="32"
          stroke="#4d7c52"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="20"
          y1="46"
          x2="13"
          y2="40"
          stroke="#7a9e7e"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="20"
          y1="46"
          x2="27"
          y2="40"
          stroke="#7a9e7e"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse
            key={a}
            cx="20"
            cy="14"
            rx="3"
            ry="6"
            fill="#7ab0e8"
            transform={`rotate(${a} 20 22)`}
          />
        ))}
        <circle cx="20" cy="22" r="3.5" fill="#fff9e0" />
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse
            key={`b${a}`}
            cx="13"
            cy="32"
            rx="2"
            ry="4"
            fill="#7ab0e8"
            transform={`rotate(${a} 13 38)`}
          />
        ))}
        <circle cx="13" cy="38" r="2.5" fill="#fff9e0" />
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse
            key={`c${a}`}
            cx="27"
            cy="32"
            rx="2"
            ry="4"
            fill="#7ab0e8"
            transform={`rotate(${a} 27 38)`}
          />
        ))}
        <circle cx="27" cy="38" r="2.5" fill="#fff9e0" />
      </g>
    ),
    rose: (
      <g className="plant-sway">
        <line
          x1="20"
          y1="58"
          x2="20"
          y2="34"
          stroke="#4d7c52"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <ellipse
          cx="13"
          cy="48"
          rx="5"
          ry="2.5"
          fill="#a8c5aa"
          transform="rotate(-20 13 48)"
        />
        <ellipse
          cx="27"
          cy="42"
          rx="5"
          ry="2.5"
          fill="#a8c5aa"
          transform="rotate(20 27 42)"
        />
        <circle cx="20" cy="22" r="10" fill="#c45c6a" />
        <ellipse cx="20" cy="18" rx="6" ry="8" fill="#d9748a" />
        <ellipse cx="20" cy="20" rx="3.5" ry="5" fill="#e89aaa" />
      </g>
    ),
    jasmine: (
      <g className="plant-sway">
        <line
          x1="20"
          y1="58"
          x2="20"
          y2="32"
          stroke="#4d7c52"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="20"
          y1="44"
          x2="13"
          y2="37"
          stroke="#7a9e7e"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="20"
          y1="44"
          x2="27"
          y2="37"
          stroke="#7a9e7e"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <ellipse
            key={a}
            cx="20"
            cy="14"
            rx="2.5"
            ry="7"
            fill="#f4f0e8"
            transform={`rotate(${a} 20 22)`}
          />
        ))}
        <circle cx="20" cy="22" r="3" fill="#e8c87a" />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <ellipse
            key={`b${a}`}
            cx="13"
            cy="30"
            rx="2"
            ry="5"
            fill="#f4f0e8"
            transform={`rotate(${a} 13 37)`}
          />
        ))}
        <circle cx="13" cy="37" r="2.5" fill="#e8c87a" />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <ellipse
            key={`c${a}`}
            cx="27"
            cy="30"
            rx="2"
            ry="5"
            fill="#f4f0e8"
            transform={`rotate(${a} 27 37)`}
          />
        ))}
        <circle cx="27" cy="37" r="2.5" fill="#e8c87a" />
      </g>
    ),
    sunflower: (
      <g className="plant-sway">
        <line
          x1="20"
          y1="58"
          x2="20"
          y2="28"
          stroke="#4d7c52"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="20"
          y1="46"
          x2="12"
          y2="40"
          stroke="#7a9e7e"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <ellipse
          cx="10"
          cy="39"
          rx="5"
          ry="2.5"
          fill="#a8c5aa"
          transform="rotate(-30 10 39)"
        />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => (
          <ellipse
            key={a}
            cx="20"
            cy="12"
            rx="3"
            ry="7"
            fill="#e8c87a"
            transform={`rotate(${a} 20 22)`}
          />
        ))}
        <circle cx="20" cy="22" r="7" fill="#8b5e0a" />
        <circle cx="20" cy="22" r="4" fill="#6b4408" />
      </g>
    ),
    willow: (
      <g className="plant-sway">
        <line
          x1="20"
          y1="58"
          x2="20"
          y2="18"
          stroke="#4d7c52"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1="20"
          y1="18"
          x2="10"
          y2="10"
          stroke="#4d7c52"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="20"
          y1="18"
          x2="30"
          y2="10"
          stroke="#4d7c52"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {[12, 16, 20, 24, 28].map((x) => (
          <path
            key={x}
            d={`M${x} ${x < 16 ? 14 : x > 24 ? 14 : 12} Q${x - 4} ${x < 16 ? 28 : 26} ${x - 6} ${x < 16 ? 40 : 38}`}
            stroke="#7a9e7e"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        ))}
        {[12, 17, 22, 27, 32].map((x) => (
          <path
            key={`r${x}`}
            d={`M${x} ${x < 17 ? 14 : x > 27 ? 14 : 12} Q${x + 4} ${x < 17 ? 28 : 26} ${x + 6} ${x < 17 ? 40 : 38}`}
            stroke="#a8c8a8"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        ))}
      </g>
    ),
  };

  return (
    <svg viewBox="0 0 40 60" width="36" height="54" aria-hidden="true">
      {blooms[id] ?? (
        <circle cx="20" cy="30" r="6" fill={color} className="plant-sway" />
      )}
    </svg>
  );
}

function checkMilestones(
  journeyStep: number,
  savedChapters: GardenProps["savedChapters"],
  selectedPath: string | null,
  profile: GardenProps["profile"],
): string[] {
  const met: string[] = [];
  if (journeyStep >= 2) met.push("sprout");
  if (savedChapters.length > 0) met.push("moonflower");
  if (selectedPath === "surface" && savedChapters.length > 0)
    met.push("lavender");
  if (selectedPath === "attacked" && savedChapters.length > 0)
    met.push("chrysanthemum");
  if (selectedPath === "love" && savedChapters.length > 0) met.push("lotus");
  if (selectedPath === "control" && savedChapters.length > 0)
    met.push("forgetmenot");
  if (profile.sessions >= 2) met.push("rose");
  if (profile.sessions >= 4) met.push("jasmine");
  if (profile.sessions >= 6) met.push("sunflower");
  if (Object.values(profile.counts).some((v) => v >= 3)) met.push("willow");
  return met;
}

function getPlantStage(
  id: string,
  unlockedIds: string[],
  unlockDates: Record<string, number>,
): number {
  if (!unlockedIds.includes(id)) return 0;
  const ts = unlockDates[id];
  if (!ts) return 1;
  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.floor((Date.now() - ts) / msPerDay);
  if (days <= 0) return 1;
  if (days === 1) return 2;
  return 3;
}

function GardenPanel({
  journeyStep,
  savedChapters,
  selectedPath,
  profile,
}: GardenProps) {
  const [unlockedIds, setUnlockedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(GARDEN_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const [unlockDates, setUnlockDates] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem(PLANT_UNLOCK_DATES_KEY) || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const met = checkMilestones(
      journeyStep,
      savedChapters,
      selectedPath,
      profile,
    );
    const current = new Set(unlockedIds);
    const newOnes = met.filter((id) => !current.has(id));
    if (newOnes.length > 0) {
      const updated = [...unlockedIds, ...newOnes];
      setUnlockedIds(updated);
      localStorage.setItem(GARDEN_KEY, JSON.stringify(updated));
      const now = Date.now();
      const newDates = { ...unlockDates };
      for (const id of newOnes) {
        if (!newDates[id]) newDates[id] = now;
      }
      setUnlockDates(newDates);
      localStorage.setItem(PLANT_UNLOCK_DATES_KEY, JSON.stringify(newDates));
    }
  }, [
    journeyStep,
    savedChapters,
    selectedPath,
    profile,
    unlockedIds,
    unlockDates,
  ]);

  return (
    <div
      className="rounded-[32px] border p-6 shadow-2xl"
      style={{ backgroundColor: "#1b1317", borderColor: "#35242c" }}
    >
      <style>{GARDEN_STYLES}</style>
      <p
        className="text-xs font-bold uppercase tracking-[0.2em] mb-1"
        style={{ color: "#d9a6b7" }}
      >
        Your garden
      </p>
      <p className="text-sm leading-6 mb-5" style={{ color: "#dbc8cf" }}>
        Your garden grows with you — a little more each day.
      </p>
      {/* Plants with soil bed */}
      <div style={{ position: "relative" }}>
        {/* Soil bed behind plants */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 22,
            background: "linear-gradient(to bottom, #5c3d1e, #3b2410)",
            borderRadius: "0 0 12px 12px",
            zIndex: 0,
          }}
        />
        <div
          className="grid grid-cols-5 gap-3"
          style={{ position: "relative", zIndex: 1, paddingBottom: 14 }}
        >
          {gardenPlants.map((plant) => {
            const stage = getPlantStage(plant.id, unlockedIds, unlockDates);
            const isUnlocked = unlockedIds.includes(plant.id);
            return (
              <div key={plant.id} className="flex flex-col items-center gap-1">
                <div
                  className="flex items-center justify-center"
                  style={{ height: 58 }}
                >
                  <PlantStageSVG
                    id={plant.id}
                    stage={stage}
                    color={plant.color}
                    budColor={plant.budColor}
                  />
                </div>
                {isUnlocked ? (
                  <p
                    className="text-center text-[9px] leading-tight font-semibold"
                    style={{ color: "#d9a6b7" }}
                  >
                    {plant.name.split(" of ")[0]}
                  </p>
                ) : (
                  <p
                    className="text-center text-[9px] leading-tight"
                    style={{ color: "#4a323c" }}
                  >
                    ?
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {unlockedIds.length === 0 && (
        <p
          className="mt-4 text-xs leading-5 text-center"
          style={{ color: "#5a4048" }}
        >
          Begin your journey to see the first bloom.
        </p>
      )}
    </div>
  );
}

// ─── FeedbackViewer ──────────────────────────────────────────────────────────
function FeedbackViewer({ onBack, actor }: { onBack: () => void; actor: any }) {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      let local: FeedbackEntry[] = [];
      try {
        local = JSON.parse(
          localStorage.getItem("mirror_within_feedback_v4") || "[]",
        );
      } catch {}

      let remote: FeedbackEntry[] = [];
      if (actor) {
        try {
          remote = await dbGetAllFeedback(actor);
        } catch (_) {}
      }

      // Merge and deduplicate by id; remote takes precedence
      const map = new Map<string, FeedbackEntry>();
      for (const e of [...local, ...remote]) map.set(e.id, e);
      const merged = Array.from(map.values()).sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setEntries(merged);
      setLoading(false);
    }
    load();
  }, [actor]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          data-ocid="feedback.close_button"
          onClick={onBack}
          className="rounded-full border p-2 transition hover:opacity-80"
          style={{
            borderColor: "#4a323c",
            backgroundColor: "#24181d",
            color: "#f0d7df",
          }}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h2
          className="text-2xl font-extrabold font-display"
          style={{ color: "#fff4f8" }}
        >
          Feedback
        </h2>
      </div>
      {loading ? (
        <div
          className="rounded-[24px] border p-6 text-center"
          style={{ borderColor: "#3d2a32", backgroundColor: "#24181d" }}
          data-ocid="feedback.loading_state"
        >
          <p className="text-sm leading-6" style={{ color: "#dbc8cf" }}>
            Loading feedback…
          </p>
        </div>
      ) : entries.length === 0 ? (
        <div
          className="rounded-[24px] border p-6 text-center"
          style={{ borderColor: "#3d2a32", backgroundColor: "#24181d" }}
          data-ocid="feedback.empty_state"
        >
          <p className="text-sm leading-6" style={{ color: "#dbc8cf" }}>
            No feedback written yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3" data-ocid="feedback.list">
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              className="rounded-[24px] border p-5"
              style={{ borderColor: "#3d2a32", backgroundColor: "#24181d" }}
              data-ocid={`feedback.item.${i + 1}`}
            >
              <div className="flex items-center justify-between mb-2">
                <p
                  className="text-xs font-bold uppercase tracking-wide"
                  style={{ color: "#d9a6b7" }}
                >
                  {entry.userName || "Anonymous"}
                </p>
                <p className="text-xs" style={{ color: "#6b5560" }}>
                  {new Date(entry.createdAt).toLocaleDateString()}
                </p>
              </div>
              <p className="text-sm leading-6" style={{ color: "#dbc8cf" }}>
                {entry.message}
              </p>
              {entry.screen && (
                <p className="mt-2 text-xs" style={{ color: "#6b5560" }}>
                  Screen: {entry.screen}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function BookJourney({
  step,
  sharedName,
  selectedPath,
  selectedMode,
  chapterIndex,
  typedResponses,
  savedChapters,
  profile,
  onSetStep,
  onSetSharedName,
  onSetSelectedPath,
  onSetSelectedMode,
  onSetChapterIndex,
  onSetTypedResponses,
  onSetSavedChapters,
  onSetProfile,
  onCrisisDetected,
  feedbackEntries,
  feedbackText,
  onFeedbackChange,
  onSubmitFeedback,
  onClearAllData,
  crisisCount,
  locationLabel,
  onShareLocation,
  onEndSession,
  actor,
}: {
  step: number;
  sharedName: string;
  selectedPath: string | null;
  selectedMode: string | null;
  chapterIndex: number;
  typedResponses: Record<number, string>;
  savedChapters: ChapterRecord[];
  profile: PatternProfile;
  onSetStep: (s: number) => void;
  onSetSharedName: (v: string) => void;
  onSetSelectedPath: (v: string | null) => void;
  onSetSelectedMode: (v: string | null) => void;
  onSetChapterIndex: (v: number) => void;
  onSetTypedResponses: (
    fn: (prev: Record<number, string>) => Record<number, string>,
  ) => void;
  onSetSavedChapters: (fn: (prev: ChapterRecord[]) => ChapterRecord[]) => void;
  onSetProfile: (p: PatternProfile) => void;
  onCrisisDetected: (text: string) => void;
  feedbackEntries: FeedbackEntry[];
  feedbackText: string;
  onFeedbackChange: (v: string) => void;
  onSubmitFeedback: () => void;
  onClearAllData: () => void;
  crisisCount: number;
  locationLabel: string;
  onShareLocation: () => void;
  onEndSession: () => void;
  actor: any;
}) {
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [_voiceError, setVoiceError] = useState("");
  const [spokenTranscript, setSpokenTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const crisisCallbackRef = useRef<(text: string) => void>(onCrisisDetected);

  // Conversation thread state
  type ThreadEntry = { role: "prompt" | "user"; text: string };
  const [conversationThread, setConversationThread] = useState<ThreadEntry[]>(
    [],
  );
  const [threadInput, setThreadInput] = useState("");
  const [_inConversation, setInConversation] = useState(false);
  const [aiReplyLoading, setAiReplyLoading] = useState(false);
  const [detailedAnalysis, setDetailedAnalysis] =
    useState<DetailedAnalysis | null>(null);
  const [mirrorAnalysis, setMirrorAnalysis] = useState<MirrorAnalysis | null>(
    null,
  );
  const [mirrorHistory, setMirrorHistory] = useState<MirrorAnalysis[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("mirrorEntries") || "[]");
    } catch {
      return [];
    }
  });
  const threadEndRef = useRef<HTMLDivElement>(null);

  const placeholderSeed = useMemo(() => Math.floor(Math.random() * 8), []);

  const _chapterPlaceholders = [
    "start wherever it's been sitting… no need to shape it yet.",
    "what keeps coming back to you about this…",
    "say the part you almost didn't say…",
    "begin with the feeling, not the story…",
    "even if it sounds small, put it here…",
    "what's been living in the back of your mind…",
    "let it out rough — you can always refine later…",
    "write like nobody's reading…",
  ];

  const threadVoicePlaceholders = [
    "what's been coming up for you…",
    "keep going, there's more here…",
    "say the part that surprised you…",
    "what does that feel like in your body…",
    "what else wants to be said…",
    "speak the next honest thing…",
    "sit with it for a second, then speak…",
    "let it be messy — that's fine…",
  ];

  const threadTextPlaceholders = [
    "say the next honest thing… (Enter to send)",
    "what else is true right now… (Enter to send)",
    "keep going, you're in it… (Enter to send)",
    "write what came up just now… (Enter to send)",
    "the next sentence doesn't have to be perfect… (Enter to send)",
    "follow the thread… (Enter to send)",
    "say the part that's harder to admit… (Enter to send)",
    "let the thought land here… (Enter to send)",
  ];
  const activePath = useMemo(
    () => entryPaths.find((item) => item.id === selectedPath) || null,
    [selectedPath],
  );

  const activeQuestion = activePath?.questions?.[chapterIndex] ?? "";
  const currentResponse =
    selectedMode === "voice"
      ? spokenTranscript
      : (typedResponses[chapterIndex] ?? "");
  const _canAdvance = Boolean(currentResponse.trim());
  const _allChaptersDone = activePath
    ? chapterIndex >= activePath.questions.length - 1
    : false;

  // Live pattern detection on current input
  const livePatterns = useMemo(() => {
    const allText = [
      currentResponse,
      threadInput,
      ...conversationThread.filter((e) => e.role === "user").map((e) => e.text),
    ];
    return basePatterns.filter((p) => p.test(allText.join(" ")));
  }, [currentResponse, threadInput, conversationThread]);

  // Pattern detection for step 5
  const detectedPatternIds = useMemo(
    () => detectPatternIds(savedChapters.map((c) => c.response)),
    [savedChapters],
  );
  const detectedPatterns = useMemo(
    () => basePatterns.filter((p) => detectedPatternIds.includes(p.id)),
    [detectedPatternIds],
  );
  const decision = useMemo(
    () => pickNextRoute(detectedPatternIds, profile),
    [detectedPatternIds, profile],
  );
  const nextQuestions = adaptiveQuestions[decision.action];

  // Keep crisis callback ref current without re-initializing recognition
  useEffect(() => {
    crisisCallbackRef.current = onCrisisDetected;
  }, [onCrisisDetected]);

  // Speech recognition setup — runs once only
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition
        : null;
    if (!SpeechRecognition) return;
    setVoiceSupported(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i += 1) {
        transcript += `${event.results[i][0].transcript} `;
      }
      const t = transcript.trim();
      setSpokenTranscript(t);
      crisisCallbackRef.current(t);
    };
    recognition.onerror = () => {
      setVoiceError(
        "The mic got interrupted. This works best in Chrome-based browsers.",
      );
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.stop();
      } catch (_) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-seed conversation thread on Step 4 mount
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (step === 4 && activeQuestion) {
      setConversationThread([{ role: "prompt", text: activeQuestion }]);
      setInConversation(true);
      setThreadInput("");
    }
  }, [step, chapterIndex]);

  function startListening() {
    if (!recognitionRef.current) return;
    setVoiceError("");
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch (e: any) {
      // InvalidStateError means already started — ignore
      if (e?.name !== "InvalidStateError") {
        setVoiceError("Could not start mic. Please try again.");
      } else {
        setListening(true);
      }
    }
  }

  function stopListening() {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setListening(false);
  }

  async function submitThreadReply(overrideText?: string) {
    const text = overrideText || threadInput.trim();
    if (!text) return;

    // Append user message immediately
    const withUser = [
      ...conversationThread,
      { role: "user" as const, text: text },
    ];
    setConversationThread(withUser);
    onCrisisDetected(text);
    setThreadInput("");
    setAiReplyLoading(true);
    setTimeout(() => {
      threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    // Try live AI proxy first — prepend prior session context if available
    let contextualPrompt = text;
    if (actor) {
      try {
        const priorEntries = await dbGetEntries(actor);
        const recent = priorEntries.slice(0, 3);
        if (recent.length > 0) {
          const ctx = recent
            .map(
              (e) =>
                `[Prior session: ${e.entryPoint} / ${e.lens}] ${e.summary}`,
            )
            .join("\n");
          contextualPrompt = `${ctx}\n\nCurrent reflection: ${text}`;
        }
      } catch (_) {
        // silently ignore — fall back to bare prompt
      }
    }
    const aiReply = await getAIReply(contextualPrompt);

    let followup: string;
    if (aiReply) {
      followup = aiReply;
    } else {
      // Fall back to local adaptive/generated question
      const userEntries = withUser.filter((e) => e.role === "user");
      const exchangeCount = userEntries.length;
      if (exchangeCount >= 2 && selectedPath) {
        const adaptiveQs = getAdaptiveQuestions(
          selectedPath,
          mirrorAnalysis?.primaryWound ?? null,
          mirrorHistory.length,
        );
        followup =
          adaptiveQs[(exchangeCount - 1) % adaptiveQs.length] ??
          generateFollowup(text, selectedPath ?? "", exchangeCount);
      } else {
        followup = generateFollowup(text, selectedPath ?? "", exchangeCount);
      }
    }

    setConversationThread([
      ...withUser,
      { role: "prompt" as const, text: followup },
    ]);
    setAiReplyLoading(false);
    setTimeout(() => {
      threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }

  function finishChapterAndAdvance() {
    if (!activePath) return;
    const allUserTexts = conversationThread
      .filter((e) => e.role === "user")
      .map((e) => e.text)
      .join(" ");
    const fullResponse = allUserTexts || currentResponse;
    const record: ChapterRecord = {
      chapter: chapterIndex + 1,
      question: activeQuestion,
      response: fullResponse,
      followups: [],
      mode: selectedMode ?? "writing",
    };
    onSetSavedChapters((prev) => {
      const next = [
        ...prev.filter((item) => item.chapter !== record.chapter),
        record,
      ];
      return next.sort((a, b) => a.chapter - b.chapter);
    });
    setInConversation(false);
    setConversationThread([]);
    setThreadInput("");
    if (selectedMode === "voice") {
      setSpokenTranscript("");
    } else {
      onSetTypedResponses((prev) => {
        const next = { ...prev };
        delete next[chapterIndex];
        return next;
      });
    }
    if (chapterIndex < activePath.questions.length - 1) {
      onSetChapterIndex(chapterIndex + 1);
    } else {
      // Commit session to profile
      const updated: PatternProfile = {
        sessions: profile.sessions + 1,
        counts: { ...profile.counts },
      };
      for (const id of detectedPatternIds) {
        updated.counts[id] = (updated.counts[id] || 0) + 1;
      }
      onSetProfile(updated);
      saveProfile(updated);
      const allResponses = savedChapters.map((c) => c.response).join(" ");
      const da = runDetailedAnalysis(
        allResponses,
        selectedPath ?? "",
        activePath?.label ?? "",
        sharedName,
      );
      setDetailedAnalysis(da);
      saveDetailedEntry(da);
      // Full Mirror analysis
      const ma = analyzeEntry(
        `${allResponses} ${fullResponse}`,
        selectedPath ?? "",
        selectedPath ?? "surface",
        sharedName,
      );
      setMirrorAnalysis(ma);
      saveMirrorEntry(ma);
      setMirrorHistory((prev) => [...prev, ma]);
      // AI proxy integration point — fires when proxy is enabled, no-op otherwise
      const aiPayload = buildAIProxyPayload({
        latestEntry: `${allResponses} ${fullResponse}`,
        conversationThread,
        analysis: ma,
      });
      sendToAIProxy(aiPayload).then((aiResponse) => {
        if (aiResponse) {
          // AI proxy response available — store for future use
          // Currently a no-op; wire up to UI when proxy goes live
          console.debug(
            "[Mirror Within] AI proxy response received:",
            aiResponse,
          );
        }
      });
      // Fire-and-forget: persist to backend if actor is available
      if (actor) {
        const lastAiReply =
          conversationThread.filter((e) => e.role === "prompt").slice(-1)[0]
            ?.text ?? "";
        dbSaveEntry(actor, {
          storyName: sharedName,
          inputMode: selectedMode ?? "text",
          entryPoint: selectedPath ?? "",
          lens: activePath?.label ?? "",
          rawText: `${allResponses} ${fullResponse}`,
          aiReply: lastAiReply,
          conversationThread,
          analysis: ma,
        }).catch(() => {});
      }
      onSetStep(5);
    }
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Welcome / Shared name */}
      {step === 1 && (
        <motion.div
          key="step1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div
            className="inline-flex items-center rounded-full border px-4 py-2 text-sm"
            style={{
              borderColor: "#4a323c",
              backgroundColor: "#24181d",
              color: "#f0d7df",
            }}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Welcome screen
          </div>
          <div>
            <h2
              className="text-3xl font-extrabold leading-tight font-display"
              style={{ color: "#fff4f8" }}
            >
              Whose story are we reading today?
            </h2>
            <p
              className="mt-3 max-w-2xl text-sm leading-7"
              style={{ color: "#d5c4cb" }}
            >
              You do not have to use your real name. Choose the name you want
              this story to be held under.
            </p>
          </div>
          <div
            className="rounded-[28px] border p-5"
            style={{ borderColor: "#3d2a32", backgroundColor: "#24181d" }}
          >
            <label
              htmlFor="shared-name-input"
              className="block text-sm font-bold"
              style={{ color: "#f1d8df" }}
            >
              Shared name
            </label>
            <input
              id="shared-name-input"
              value={sharedName}
              onChange={(e) => onSetSharedName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && sharedName.trim()) onSetStep(2);
              }}
              placeholder="K, The version of me today, Unbothered..."
              data-ocid="journey.shared_name.input"
              className="mt-3 w-full rounded-2xl border px-4 py-3 text-white outline-none"
              style={{
                borderColor: "#4a323c",
                backgroundColor: "#2b2025",
              }}
            />
            <p className="mt-3 text-xs leading-6" style={{ color: "#bfa9b2" }}>
              Examples: K, The version of me today, Unbothered, Soft Girl, Main
              Character.
            </p>
          </div>
          <button
            type="button"
            data-ocid="journey.step1.primary_button"
            onClick={() => sharedName.trim() && onSetStep(2)}
            disabled={!sharedName.trim()}
            className="inline-flex items-center rounded-2xl px-5 py-3 font-extrabold transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#efc1d0", color: "#1d1418" }}
          >
            Turn the page
            <ChevronRight className="ml-2 h-4 w-4" />
          </button>
        </motion.div>
      )}

      {/* Step 2: Entry intensity */}
      {step === 2 && (
        <motion.div
          key="step2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div
            className="inline-flex items-center rounded-full border px-4 py-2 text-sm"
            style={{
              borderColor: "#4a323c",
              backgroundColor: "#24181d",
              color: "#f0d7df",
            }}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Entry intensity
          </div>
          <div>
            <h2
              className="text-3xl font-extrabold leading-tight font-display"
              style={{ color: "#fff4f8" }}
            >
              Where does the story begin, {sharedName}?
            </h2>
            <p
              className="mt-3 max-w-2xl text-sm leading-7"
              style={{ color: "#d5c4cb" }}
            >
              Start where you can handle. You can always peel deeper later.
            </p>
          </div>
          <div className="grid gap-4">
            {entryPaths.map((path) => (
              <PathPreview
                key={path.id}
                path={path}
                selected={selectedPath === path.id}
                onClick={() => onSetSelectedPath(path.id)}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              data-ocid="journey.step2.cancel_button"
              onClick={() => onSetStep(1)}
              className="rounded-2xl border px-5 py-3 font-bold transition hover:opacity-80"
              style={{
                borderColor: "#76515e",
                color: "#f4d6df",
                backgroundColor: "transparent",
              }}
            >
              Previous page
            </button>
            <button
              type="button"
              data-ocid="journey.step2.primary_button"
              onClick={() => selectedPath && onSetStep(3)}
              disabled={!selectedPath}
              className="inline-flex items-center rounded-2xl px-5 py-3 font-extrabold transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#efc1d0", color: "#1d1418" }}
            >
              Peel deeper
              <ChevronRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Expression method */}
      {step === 3 && (
        <motion.div
          key="step3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div
            className="inline-flex items-center rounded-full border px-4 py-2 text-sm"
            style={{
              borderColor: "#4a323c",
              backgroundColor: "#24181d",
              color: "#f0d7df",
            }}
          >
            <Feather className="mr-2 h-4 w-4" />
            Expression method
          </div>
          <div>
            <h2
              className="text-3xl font-extrabold leading-tight font-display"
              style={{ color: "#fff4f8" }}
            >
              How would you like to tell it?
            </h2>
            <p
              className="mt-3 max-w-2xl text-sm leading-7"
              style={{ color: "#d5c4cb" }}
            >
              You chose{" "}
              <span className="font-bold" style={{ color: "#efc1d0" }}>
                {activePath?.label}
              </span>
              . Now choose whether this chapter is spoken or written.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                id: "voice",
                icon: <Mic className="h-6 w-6" />,
                title: "Your very own TedTalk",
                subtitle: "Speak it out",
                desc: "For when typing feels like too much work and your truth comes out easier when you hear yourself say it.",
              },
              {
                id: "writing",
                icon: <PenTool className="h-6 w-6" />,
                title: "Hear ye Hear ye",
                subtitle: "Write it down",
                desc: "For when you want to shape the thought, slow it down, and let the page hold the weight.",
              },
            ].map((mode) => (
              <button
                type="button"
                key={mode.id}
                data-ocid={`journey.mode_${mode.id}.toggle`}
                onClick={() => onSetSelectedMode(mode.id)}
                className="rounded-[28px] border p-6 text-left transition"
                style={{
                  borderColor: selectedMode === mode.id ? "#efc1d0" : "#3d2a32",
                  backgroundColor:
                    selectedMode === mode.id ? "#2a1d23" : "#24181d",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="rounded-2xl p-3"
                    style={{ backgroundColor: "#2b2025", color: "#efc1d0" }}
                  >
                    {mode.icon}
                  </div>
                  <div>
                    <p
                      className="text-xl font-extrabold"
                      style={{ color: "#fff4f8" }}
                    >
                      {mode.title}
                    </p>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "#efc1d0" }}
                    >
                      {mode.subtitle}
                    </p>
                  </div>
                </div>
                <p
                  className="mt-4 text-sm leading-6"
                  style={{ color: "#d5c4cb" }}
                >
                  {mode.desc}
                </p>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              data-ocid="journey.step3.cancel_button"
              onClick={() => onSetStep(2)}
              className="rounded-2xl border px-5 py-3 font-bold transition hover:opacity-80"
              style={{
                borderColor: "#76515e",
                color: "#f4d6df",
                backgroundColor: "transparent",
              }}
            >
              Previous page
            </button>
            <button
              type="button"
              data-ocid="journey.step3.primary_button"
              disabled={!selectedMode}
              onClick={() => {
                if (!selectedMode) return;
                onSetChapterIndex(0);
                onSetSavedChapters(() => []);
                onSetTypedResponses(() => ({}));
                onSetStep(4);
              }}
              className="inline-flex items-center rounded-2xl px-5 py-3 font-extrabold transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#efc1d0", color: "#1d1418" }}
            >
              Continue to chapter one
              <ChevronRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 4: Chapter reflection */}
      {step === 4 && activePath && (
        <motion.div
          key={`step4-${chapterIndex}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              data-ocid="journey.step4.cancel_button"
              onClick={() => onSetStep(3)}
              className="rounded-full border p-2 transition hover:opacity-80"
              style={{
                borderColor: "#4a323c",
                backgroundColor: "#24181d",
                color: "#f0d7df",
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div
              className="inline-flex items-center rounded-full border px-4 py-2 text-sm"
              style={{
                borderColor: "#4a323c",
                backgroundColor: "#24181d",
                color: "#f0d7df",
              }}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              {activePath.chapterTitle}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold"
              style={{
                borderColor: "#4a323c",
                backgroundColor: "#24181d",
                color: "#efc1d0",
              }}
            >
              {selectedMode === "voice" ? (
                <>
                  <Mic className="h-3 w-3" /> Voice mode
                </>
              ) : (
                <>
                  <PenTool className="h-3 w-3" /> Writing mode
                </>
              )}
            </div>
          </div>

          {/* Inline live pattern notices */}
          {livePatterns.length > 0 && (
            <div
              className="rounded-[24px] border p-4"
              style={{ borderColor: "#3d2a32", backgroundColor: "#1e1519" }}
            >
              <p
                className="text-xs font-bold uppercase tracking-[0.18em] mb-3"
                style={{ color: "#d9a6b7" }}
              >
                Pattern notices
              </p>
              <div className="space-y-2">
                {livePatterns.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl p-3"
                    style={{ backgroundColor: "#24181d" }}
                  >
                    <p
                      className="text-xs font-bold uppercase tracking-wide"
                      style={{ color: "#efc1d0" }}
                    >
                      {p.name}
                    </p>
                    <p
                      className="mt-1 text-xs leading-5"
                      style={{ color: "#dbc8cf" }}
                    >
                      {p.advice}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Conversation thread */}
          <div
            className="rounded-[28px] border p-5 space-y-4"
            style={{ borderColor: "#3d2a32", backgroundColor: "#24181d" }}
          >
            <p
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: "#d9a6b7" }}
            >
              Conversation
            </p>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {conversationThread.map((entry, entryIdx) => (
                <div
                  key={`${entry.role}-${entryIdx}-${entry.text.slice(0, 8)}`}
                  className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                    entry.role === "prompt" ? "mr-8" : "ml-8"
                  }`}
                  style={{
                    backgroundColor:
                      entry.role === "prompt" ? "#2b2025" : "#331f28",
                    color: entry.role === "prompt" ? "#dbc8cf" : "#f6dae3",
                    borderLeft:
                      entry.role === "prompt"
                        ? "3px solid #4a323c"
                        : "3px solid #efc1d0",
                  }}
                >
                  {entry.text}
                </div>
              ))}
              {aiReplyLoading && (
                <div
                  className="rounded-2xl px-4 py-3 text-sm leading-6 mr-8"
                  style={{
                    backgroundColor: "#2b2025",
                    color: "#dbc8cf",
                    borderLeft: "3px solid #4a323c",
                  }}
                >
                  <span className="opacity-60 animate-pulse">
                    Mirror is reflecting…
                  </span>
                </div>
              )}
              <div ref={threadEndRef} />
            </div>
            <div className="flex gap-3">
              {selectedMode === "voice" ? (
                <div className="flex-1">
                  <p className="text-xs mb-2" style={{ color: "#bfa9b2" }}>
                    Speak your reply, then send
                  </p>
                  <textarea
                    data-ocid="journey.thread.textarea"
                    value={spokenTranscript || threadInput}
                    onChange={(e) => setThreadInput(e.target.value)}
                    placeholder={
                      threadVoicePlaceholders[
                        placeholderSeed % threadVoicePlaceholders.length
                      ]
                    }
                    rows={5}
                    className="w-full rounded-2xl border px-5 py-4 text-white outline-none"
                    style={{
                      borderColor: "#7a4a5c",
                      backgroundColor: "#2b2025",
                      boxShadow:
                        "0 0 0 1px #5a3345, inset 0 2px 8px rgba(0,0,0,0.35)",
                      fontSize: "16px",
                      lineHeight: "1.65",
                    }}
                  />
                </div>
              ) : (
                <textarea
                  data-ocid="journey.thread.textarea"
                  value={threadInput}
                  onChange={(e) => {
                    setThreadInput(e.target.value);
                    onCrisisDetected(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitThreadReply();
                    }
                  }}
                  placeholder={
                    threadTextPlaceholders[
                      placeholderSeed % threadTextPlaceholders.length
                    ]
                  }
                  rows={5}
                  className="flex-1 rounded-2xl border px-5 py-4 text-white outline-none"
                  style={{
                    borderColor: "#7a4a5c",
                    backgroundColor: "#2b2025",
                    boxShadow:
                      "0 0 0 1px #5a3345, inset 0 2px 8px rgba(0,0,0,0.35)",
                    fontSize: "16px",
                    lineHeight: "1.65",
                  }}
                />
              )}
              {selectedMode === "voice" && !voiceSupported && (
                <div
                  className="rounded-[20px] border p-4 text-center text-sm"
                  style={{
                    borderColor: "#4a323c",
                    backgroundColor: "#24181d",
                    color: "#dbc8cf",
                  }}
                >
                  Voice input isn&apos;t supported on this browser. Try Chrome
                  or Edge on desktop, or switch to text below.
                </div>
              )}
              <div className="flex flex-col gap-2 justify-end">
                {selectedMode === "voice" && voiceSupported && (
                  <button
                    type="button"
                    data-ocid="journey.mic.toggle"
                    onClick={() =>
                      listening ? stopListening() : startListening()
                    }
                    className="rounded-2xl border px-3 py-2 font-bold text-xs transition"
                    style={{
                      borderColor: listening ? "#efc1d0" : "#4a323c",
                      backgroundColor: listening ? "#2a1d23" : "#2b2025",
                      color: listening ? "#efc1d0" : "#a08090",
                    }}
                  >
                    <Mic
                      className={
                        listening ? "h-4 w-4 animate-pulse" : "h-4 w-4"
                      }
                    />
                  </button>
                )}
                <button
                  type="button"
                  data-ocid="journey.thread.submit_button"
                  onClick={() => {
                    if (selectedMode === "voice" && spokenTranscript) {
                      submitThreadReply(spokenTranscript);
                      setSpokenTranscript("");
                    } else {
                      submitThreadReply();
                    }
                  }}
                  disabled={
                    aiReplyLoading ||
                    (selectedMode === "voice"
                      ? !spokenTranscript.trim() && !threadInput.trim()
                      : !threadInput.trim())
                  }
                  className="rounded-2xl px-4 py-2 font-bold text-sm transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#efc1d0", color: "#1d1418" }}
                >
                  Send
                </button>
              </div>
            </div>
            <div
              className="flex flex-wrap gap-3 pt-2 border-t"
              style={{ borderColor: "#3d2a32" }}
            >
              <button
                type="button"
                data-ocid="journey.thread.move_on.button"
                onClick={finishChapterAndAdvance}
                className="text-sm rounded-2xl px-4 py-2 font-bold border transition hover:opacity-80"
                style={{
                  borderColor: "#76515e",
                  color: "#f4d6df",
                  backgroundColor: "transparent",
                }}
              >
                Ready to move on →
              </button>
              {(() => {
                const userMessages = conversationThread.filter(
                  (e) => e.role === "user",
                );
                const lastUser = userMessages[userMessages.length - 1];
                const showContinuePrompt =
                  userMessages.length >= 4 ||
                  (lastUser &&
                    lastUser.text.length > 80 &&
                    !vagueSignals.test(lastUser.text) &&
                    !minimizingSignals.test(lastUser.text));
                return showContinuePrompt ? (
                  <p
                    className="text-xs self-center"
                    style={{ color: "#bfa9b2" }}
                  >
                    I think we got somewhere. Continue when you're ready.
                  </p>
                ) : null;
              })()}
            </div>
          </div>
        </motion.div>
      )}

      {/* Step 5: End of chapter recap */}
      {step === 5 && activePath && (
        <motion.div
          key="step5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div
            className="inline-flex items-center rounded-full border px-4 py-2 text-sm"
            style={{
              borderColor: "#4a323c",
              backgroundColor: "#24181d",
              color: "#f0d7df",
            }}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            End of chapter
          </div>
          <div>
            <h2
              className="text-3xl font-extrabold leading-tight font-display"
              style={{ color: "#fff4f8" }}
            >
              You made it through the first layer, {sharedName}.
            </h2>
            <p
              className="mt-3 max-w-2xl text-sm leading-7"
              style={{ color: "#d5c4cb" }}
            >
              This chapter stayed in{" "}
              <span className="font-bold" style={{ color: "#efc1d0" }}>
                {activePath.label}
              </span>
              . Here's what got said out loud.
            </p>
          </div>

          {/* Chapter recap */}
          <div className="space-y-4" data-ocid="journey.chapters.list">
            {savedChapters.length === 0 ? (
              <div
                className="rounded-[28px] border p-5 text-sm"
                style={{
                  borderColor: "#3d2a32",
                  backgroundColor: "#24181d",
                  color: "#dbc8cf",
                }}
                data-ocid="journey.chapters.empty_state"
              >
                No responses saved yet.
              </div>
            ) : (
              savedChapters.map((item, i) => (
                <div
                  key={item.chapter}
                  className="rounded-[28px] border p-5"
                  style={{
                    borderColor: "#3d2a32",
                    backgroundColor: "#24181d",
                  }}
                  data-ocid={`journey.chapters.item.${i + 1}`}
                >
                  <p
                    className="text-sm font-bold uppercase tracking-[0.2em]"
                    style={{ color: "#d9a6b7" }}
                  >
                    Chapter {item.chapter}
                  </p>
                  <p
                    className="mt-3 text-lg font-extrabold font-display"
                    style={{ color: "#fff4f8" }}
                  >
                    {item.question}
                  </p>
                  <p
                    className="mt-3 whitespace-pre-wrap text-sm leading-7"
                    style={{ color: "#dbc8cf" }}
                  >
                    {item.response}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Pattern detection */}
          <div
            className="rounded-[28px] border p-5"
            style={{ borderColor: "#3d2a32", backgroundColor: "#24181d" }}
          >
            <p
              className="text-sm font-bold uppercase tracking-[0.2em] mb-4"
              style={{ color: "#d9a6b7" }}
            >
              Pattern reveal
            </p>
            {detectedPatterns.length === 0 ? (
              <p className="text-sm leading-6" style={{ color: "#dbc8cf" }}>
                No strong pattern detected yet. Keep going.
              </p>
            ) : (
              <div className="space-y-3">
                {detectedPatterns.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl p-4"
                    style={{ backgroundColor: "#2b2025" }}
                  >
                    <p className="font-bold" style={{ color: "#f6dae3" }}>
                      {p.name}
                    </p>
                    <p
                      className="mt-1 text-sm leading-6"
                      style={{ color: "#dbc8cf" }}
                    >
                      {p.advice}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Adaptive next step */}
          <div
            className="rounded-[28px] border p-5"
            style={{ borderColor: "#3d2a32", backgroundColor: "#24181d" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4" style={{ color: "#efc1d0" }} />
              <p
                className="text-sm font-bold uppercase tracking-[0.2em]"
                style={{ color: "#d9a6b7" }}
              >
                Adaptive next step
              </p>
            </div>
            <div
              className="rounded-2xl p-4 mb-4"
              style={{ backgroundColor: "#2b2025" }}
            >
              <p className="font-bold capitalize" style={{ color: "#fff4f8" }}>
                {decision.action === "deepen"
                  ? "Go deeper"
                  : decision.action === "shift"
                    ? "Shift the lens"
                    : "Stay in this layer"}
              </p>
              <p className="text-sm mt-1" style={{ color: "#dbc8cf" }}>
                {decision.reason}
              </p>
              {decision.focus && (
                <p
                  className="text-xs mt-2 font-semibold"
                  style={{ color: "#d9a6b7" }}
                >
                  Focus: {decision.focus}
                </p>
              )}
            </div>
            <div className="space-y-3">
              {nextQuestions.map((q) => (
                <div
                  key={q}
                  className="rounded-2xl p-4 text-sm leading-6"
                  style={{ backgroundColor: "#2b2025", color: "#dbc8cf" }}
                >
                  • {q}
                </div>
              ))}
            </div>
          </div>

          {/* Deeper scan - current session */}
          {detailedAnalysis && (
            <div
              className="rounded-[28px] border p-5 space-y-3"
              style={{ borderColor: "#3d2a32", backgroundColor: "#24181d" }}
            >
              <p
                className="text-sm font-bold uppercase tracking-[0.2em] mb-4"
                style={{ color: "#d9a6b7" }}
              >
                Deeper scan
              </p>
              {[
                { label: "Emotional themes", value: detailedAnalysis.emotions },
                {
                  label: "Likely trigger area",
                  value: detailedAnalysis.triggers,
                },
                {
                  label: "Core belief signals",
                  value: detailedAnalysis.beliefs,
                },
                { label: "Coping style", value: detailedAnalysis.coping },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: "#2b2025" }}
                >
                  <p
                    className="text-xs font-semibold mb-1"
                    style={{ color: "#d9a6b7" }}
                  >
                    {label}
                  </p>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "#dbc8cf" }}
                  >
                    {value.length
                      ? value.join(", ")
                      : "Nothing detected yet — keep reflecting"}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Mirror Analysis Cards */}
          {mirrorAnalysis &&
            (() => {
              const conf = getConfidence(mirrorAnalysis.woundScores);
              return (
                <>
                  {/* Core Wound Detection Card */}
                  <div
                    className="rounded-[28px] border p-5"
                    style={{
                      borderColor: "#3d2a32",
                      backgroundColor: "#24181d",
                    }}
                  >
                    <p
                      className="text-xs font-bold uppercase tracking-[0.2em] mb-3"
                      style={{ color: "#d9a6b7" }}
                    >
                      Core wound detected
                    </p>
                    <p
                      className="text-base font-extrabold"
                      style={{ color: "#f5e6ec" }}
                    >
                      {woundLabels[mirrorAnalysis.primaryWound] ||
                        mirrorAnalysis.primaryWound}
                    </p>
                    {mirrorAnalysis.secondaryWound && (
                      <p className="text-sm mt-1" style={{ color: "#b8788e" }}>
                        Undercurrent:{" "}
                        {woundLabels[mirrorAnalysis.secondaryWound] ||
                          mirrorAnalysis.secondaryWound}
                      </p>
                    )}
                    <span
                      className="inline-block mt-2 text-xs px-2 py-1 rounded-full"
                      style={{
                        backgroundColor:
                          conf.level === "high"
                            ? "#3a1520"
                            : conf.level === "medium"
                              ? "#2a0f18"
                              : "#1e0c14",
                        color:
                          conf.level === "high"
                            ? "#e8a0b8"
                            : conf.level === "medium"
                              ? "#c084a0"
                              : "#9a6070",
                      }}
                    >
                      {conf.label} confidence
                    </span>
                  </div>

                  {/* Pattern Evidence Card */}
                  <div
                    className="rounded-[28px] border p-5"
                    style={{
                      borderColor: "#3d2a32",
                      backgroundColor: "#24181d",
                    }}
                  >
                    <p
                      className="text-xs font-bold uppercase tracking-[0.2em] mb-3"
                      style={{ color: "#d9a6b7" }}
                    >
                      Pattern evidence
                    </p>
                    {mirrorAnalysis.phraseHits &&
                    mirrorAnalysis.phraseHits.length > 0 ? (
                      <div className="space-y-1">
                        {mirrorAnalysis.phraseHits.slice(0, 3).map((hit) => (
                          <p
                            key={hit.phrase}
                            className="text-sm italic"
                            style={{ color: "#c8909e" }}
                          >
                            &ldquo;{hit.phrase}&rdquo;
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm" style={{ color: "#9a6878" }}>
                        More entries will sharpen the pattern over time.
                      </p>
                    )}
                  </div>

                  {/* Mirror Mode Card */}
                  <div
                    className="rounded-[28px] border p-5"
                    style={{
                      borderColor: "#3d2a32",
                      backgroundColor: "#24181d",
                    }}
                  >
                    <p
                      className="text-xs font-bold uppercase tracking-[0.2em] mb-3"
                      style={{ color: "#d9a6b7" }}
                    >
                      Mirror
                    </p>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "#f0d8e4" }}
                    >
                      {conf.level === "low"
                        ? `There may be something around ${woundLabels[mirrorAnalysis.primaryWound] || mirrorAnalysis.primaryWound} here. ${mirrorAnalysis.mirrorMode}`
                        : mirrorAnalysis.mirrorMode}
                    </p>
                  </div>

                  {/* Loop Interruption Card */}
                  <div
                    className="rounded-[28px] border p-5"
                    style={{
                      borderColor: "#3d2a32",
                      backgroundColor: "#24181d",
                    }}
                  >
                    <p
                      className="text-xs font-bold uppercase tracking-[0.2em] mb-3"
                      style={{ color: "#d9a6b7" }}
                    >
                      One thing to try
                    </p>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "#e8c8d4" }}
                    >
                      {mirrorAnalysis.loopInterruption}
                    </p>
                  </div>
                </>
              );
            })()}

          {/* Pattern history across sessions */}
          {(() => {
            const historyInsights = getHistoryInsights();
            const mirrorInsights = getMirrorInsights(mirrorHistory);
            return (
              <div
                className="rounded-[28px] border p-5 space-y-3"
                style={{ borderColor: "#3d2a32", backgroundColor: "#24181d" }}
              >
                <p
                  className="text-sm font-bold uppercase tracking-[0.2em] mb-4"
                  style={{ color: "#d9a6b7" }}
                >
                  Your pattern history
                  {historyInsights
                    ? ` · ${historyInsights.count} session${historyInsights.count === 1 ? "" : "s"}`
                    : ""}
                </p>
                {mirrorInsights?.topWoundTrend ? (
                  <div
                    className="rounded-2xl p-4 mb-2"
                    style={{ backgroundColor: "#2b2025" }}
                  >
                    <p
                      className="text-xs font-semibold mb-1"
                      style={{ color: "#d9a6b7" }}
                    >
                      Wound trend
                    </p>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "#dbc8cf" }}
                    >
                      {woundLabels[mirrorInsights.topWoundTrend.wound] ||
                        mirrorInsights.topWoundTrend.wound}{" "}
                      — {mirrorInsights.topWoundTrend.label}
                    </p>
                    {mirrorInsights.recentShift && (
                      <p
                        className="text-xs italic mt-2"
                        style={{ color: "#9a7888" }}
                      >
                        {mirrorInsights.recentShift}
                      </p>
                    )}
                    {mirrorInsights.quietInference && (
                      <p
                        className="text-xs italic mt-1"
                        style={{ color: "#8a6878" }}
                      >
                        {mirrorInsights.quietInference}
                      </p>
                    )}
                  </div>
                ) : null}
                {historyInsights ? (
                  [
                    { label: "Emotion trend", data: historyInsights.emotions },
                    { label: "Trigger trend", data: historyInsights.triggers },
                    { label: "Belief trend", data: historyInsights.beliefs },
                    { label: "Coping trend", data: historyInsights.coping },
                  ].map(({ label, data }) => {
                    const top = data[0];
                    return (
                      <div
                        key={label}
                        className="rounded-2xl p-4"
                        style={{ backgroundColor: "#2b2025" }}
                      >
                        <p
                          className="text-xs font-semibold mb-1"
                          style={{ color: "#d9a6b7" }}
                        >
                          {label}
                        </p>
                        <p
                          className="text-sm leading-relaxed"
                          style={{ color: "#dbc8cf" }}
                        >
                          {top
                            ? `${top[0]} · appeared ${top[1]}x · ${historyInsights.patternLabel(top[1])}`
                            : "No pattern data yet"}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div
                    className="rounded-2xl p-4"
                    style={{ backgroundColor: "#2b2025" }}
                  >
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "#dbc8cf" }}
                    >
                      Complete your first session to start building a pattern
                      history.
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Profile */}
          {profile.sessions > 0 && (
            <div
              className="rounded-[28px] border p-5"
              style={{ borderColor: "#35242c", backgroundColor: "#1b1317" }}
            >
              <p
                className="text-sm font-bold uppercase tracking-[0.2em] mb-3"
                style={{ color: "#d9a6b7" }}
              >
                Your pattern profile
              </p>
              <p className="text-xs mb-2" style={{ color: "#bfa9b2" }}>
                Sessions: {profile.sessions}
              </p>
              {Object.entries(profile.counts).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(profile.counts).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between">
                      <span
                        className="text-sm capitalize"
                        style={{ color: "#dbc8cf" }}
                      >
                        {k}
                      </span>
                      <span
                        className="text-xs font-bold rounded-full px-2 py-0.5"
                        style={{
                          backgroundColor: "#2b2025",
                          color: "#efc1d0",
                        }}
                      >
                        {v}×
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Feedback */}
          <div
            className="rounded-[28px] border p-5"
            style={{ borderColor: "#35242c", backgroundColor: "#1b1317" }}
          >
            <p
              className="text-[18px] font-extrabold mb-2 font-display"
              style={{ color: "#fff4f8" }}
            >
              Feedback
            </p>
            <p className="text-sm mb-3" style={{ color: "#dbc8cf" }}>
              What felt missing or impactful?
            </p>
            <textarea
              data-ocid="journey.feedback.textarea"
              value={feedbackText}
              onChange={(e) => onFeedbackChange(e.target.value)}
              placeholder="Your feedback helps shape this app"
              rows={4}
              className="w-full rounded-[18px] px-4 py-3 text-sm border outline-none"
              style={{
                backgroundColor: "#2b2025",
                borderColor: "#4a323c",
                color: "#fff",
              }}
            />
            <button
              type="button"
              data-ocid="journey.feedback.submit_button"
              onClick={onSubmitFeedback}
              className="mt-3 inline-flex items-center rounded-2xl px-5 py-3 font-extrabold transition hover:opacity-90"
              style={{ backgroundColor: "#efc1d0", color: "#1d1418" }}
            >
              Submit feedback
            </button>
            {feedbackEntries.length > 0 && (
              <div className="mt-4 space-y-3">
                {feedbackEntries.slice(0, 3).map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[18px] p-4"
                    style={{ backgroundColor: "#2b2025" }}
                  >
                    <p
                      className="text-xs font-bold uppercase tracking-wide mb-1"
                      style={{ color: "#d9a6b7" }}
                    >
                      {entry.userName} ·{" "}
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </p>
                    <p
                      className="text-sm leading-6"
                      style={{ color: "#dbc8cf" }}
                    >
                      {entry.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Session safety */}
          <div
            className="rounded-[28px] border p-5"
            style={{ borderColor: "#35242c", backgroundColor: "#1b1317" }}
          >
            <p
              className="text-[18px] font-extrabold mb-2 font-display"
              style={{ color: "#fff4f8" }}
            >
              Session safety
            </p>
            <p className="text-sm mb-1" style={{ color: "#dbc8cf" }}>
              Crisis flags this session: {crisisCount}
            </p>
            <p className="text-sm mb-3" style={{ color: "#dbc8cf" }}>
              Location: {locationLabel}
            </p>
            <button
              type="button"
              data-ocid="journey.location.button"
              onClick={onShareLocation}
              className="w-full rounded-[18px] py-3 px-4 text-sm font-bold border transition-opacity hover:opacity-80 mb-2"
              style={{
                borderColor: "#76515e",
                color: "#f4d6df",
                backgroundColor: "transparent",
              }}
            >
              Share live location for this session
            </button>
            <button
              type="button"
              data-ocid="journey.end_session.button"
              onClick={onEndSession}
              className="w-full rounded-[18px] py-3 px-4 text-sm font-bold border transition-opacity hover:opacity-80 mb-2"
              style={{
                borderColor: "#76515e",
                color: "#f4d6df",
                backgroundColor: "transparent",
              }}
            >
              End session and clear session-only data
            </button>
            <button
              type="button"
              data-ocid="journey.clear_data.delete_button"
              onClick={onClearAllData}
              className="w-full rounded-[18px] py-3 px-4 text-sm font-bold border transition-opacity hover:opacity-80"
              style={{
                borderColor: "#76515e",
                color: "#f4d6df",
                backgroundColor: "transparent",
              }}
            >
              Clear all local data
            </button>
          </div>

          <button
            type="button"
            data-ocid="journey.step5.primary_button"
            onClick={() => {
              onSetChapterIndex(0);
              onSetSavedChapters(() => []);
              onSetTypedResponses(() => ({}));
              onSetStep(4);
            }}
            className="inline-flex items-center rounded-2xl px-5 py-3 font-extrabold transition hover:opacity-90"
            style={{ backgroundColor: "#efc1d0", color: "#1d1418" }}
          >
            Read it again
            <ChevronRight className="ml-2 h-4 w-4" />
          </button>
        </motion.div>
      )}
    </div>
  );
}

export default function App() {
  const [hydrated, setHydrated] = useState(false);
  const { actor } = useActor();
  const [screen, setScreen] = useState<Screen>("journey");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [accessInput, setAccessInput] = useState("");
  const [unlockedCode, setUnlockedCode] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [sessionCountdown, setSessionCountdown] = useState(SESSION_TIMEOUT_MS);
  const [breatheReturnScreen, setBreatheReturnScreen] =
    useState<Screen>("journey");

  // Journey state
  const [journeyStep, setJourneyStep] = useState(1);
  const [sharedName, setSharedName] = useState("");
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [typedResponses, setTypedResponses] = useState<Record<number, string>>(
    {},
  );
  const [savedChapters, setSavedChapters] = useState<ChapterRecord[]>([]);
  const [profile, setProfile] = useState<PatternProfile>({
    counts: {},
    sessions: 0,
  });

  // Crisis
  const [crisisCount, setCrisisCount] = useState(0);
  const [crisisActive, setCrisisActive] = useState(false);
  const [crisisSeverity, setCrisisSeverity] = useState<
    "high" | "medium" | "low" | null
  >(null);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [locationLabel, setLocationLabel] = useState(
    "Not shared in this session",
  );

  // Feedback
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([]);
  const [feedbackText, setFeedbackText] = useState("");

  // Modals
  const [showClearDataModal, setShowClearDataModal] = useState(false);

  const crisisContent = useMemo(
    () => severityCopy(crisisSeverity),
    [crisisSeverity],
  );

  // ── Hydration ────────────────────────────────────────────────────────────────
  useEffect(() => {
    hydrateApp();
  }, []);

  function hydrateApp() {
    const parsedDraft = safeJsonParse<JourneyDraft | null>(
      localStorage.getItem(DRAFT_KEY),
      null,
    );
    const parsedSession = safeJsonParse<{
      userName: string;
      sessionExpiresAt: number;
    } | null>(localStorage.getItem(SESSION_KEY), null);
    const parsedFeedback = safeJsonParse<FeedbackEntry[]>(
      localStorage.getItem(FEEDBACK_KEY),
      [],
    );
    const parsedProfile = loadProfile();

    setFeedbackEntries(Array.isArray(parsedFeedback) ? parsedFeedback : []);
    setProfile(parsedProfile);

    if (parsedDraft && typeof parsedDraft === "object") {
      setJourneyStep(parsedDraft.step || 1);
      setSharedName(parsedDraft.sharedName || "");
      setSelectedPath(parsedDraft.selectedPath || null);
      setSelectedMode(parsedDraft.selectedMode || null);
      setChapterIndex(parsedDraft.chapterIndex || 0);
      setTypedResponses(parsedDraft.typedResponses || {});
    }

    if (parsedSession && parsedSession.sessionExpiresAt > Date.now()) {
      setUserName(parsedSession.userName || "");
      setIsUnlocked(true);
      setSessionExpiresAt(parsedSession.sessionExpiresAt);
      setSessionCountdown(parsedSession.sessionExpiresAt - Date.now());
    } else {
      localStorage.removeItem(SESSION_KEY);
    }

    setHydrated(true);
  }

  // ── Draft autosave ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hydrated || !isUnlocked) return;
    const draft: JourneyDraft = {
      step: journeyStep,
      sharedName,
      selectedPath,
      selectedMode,
      chapterIndex,
      typedResponses,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [
    journeyStep,
    sharedName,
    selectedPath,
    selectedMode,
    chapterIndex,
    typedResponses,
    hydrated,
    isUnlocked,
  ]);

  // ── Session countdown ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isUnlocked || !sessionExpiresAt) return;
    const interval = window.setInterval(() => {
      const remaining = sessionExpiresAt - Date.now();
      setSessionCountdown(Math.max(0, remaining));
      if (remaining <= 0) {
        lockApp();
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isUnlocked, sessionExpiresAt]);

  useEffect(() => {
    document.title = "Mirror Within — Self-Inquiry Journal";
  }, []);

  // ── Session helpers ───────────────────────────────────────────────────────────
  function refreshSessionTimer(currentUserName?: string) {
    const nextExpiry = Date.now() + SESSION_TIMEOUT_MS;
    const nextUser = currentUserName || userName;
    setSessionExpiresAt(nextExpiry);
    setSessionCountdown(SESSION_TIMEOUT_MS);
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ userName: nextUser, sessionExpiresAt: nextExpiry }),
    );
  }

  function lockApp() {
    setIsUnlocked(false);
    setShowWelcome(false);
    setSessionExpiresAt(null);
    localStorage.removeItem(SESSION_KEY);
  }

  function clearSession() {
    lockApp();
  }

  function clearAllLocalData() {
    setShowClearDataModal(true);
  }

  function confirmClearAllData() {
    for (const key of [DRAFT_KEY, SESSION_KEY, FEEDBACK_KEY, PROFILE_KEY]) {
      localStorage.removeItem(key);
    }
    setFeedbackEntries([]);
    setFeedbackText("");
    setProfile({ counts: {}, sessions: 0 });
    setJourneyStep(1);
    setSharedName("");
    setSelectedPath(null);
    setSelectedMode(null);
    setChapterIndex(0);
    setTypedResponses({});
    setSavedChapters([]);
    setShowClearDataModal(false);
    lockApp();
  }

  // ── Crisis detection ──────────────────────────────────────────────────────────
  const handleCrisisDetected = useCallback((text: string) => {
    if (!hasCrisisLanguage(text)) return;
    const severity = getCrisisSeverity(text);
    setCrisisSeverity(severity);
    setCrisisActive(true);
    setCrisisCount((prev) => prev + 1);
    setShowCrisisModal(true);
    // Use functional updates to avoid stale closure; call refreshSessionTimer indirectly
    const nextExpiry = Date.now() + SESSION_TIMEOUT_MS;
    setSessionExpiresAt(nextExpiry);
    setSessionCountdown(SESSION_TIMEOUT_MS);
  }, []);

  // ── Feedback ──────────────────────────────────────────────────────────────────
  function submitFeedback() {
    if (!feedbackText.trim()) {
      window.alert("Write feedback before submitting.");
      return;
    }
    const nextEntry: FeedbackEntry = {
      id: `${Date.now()}`,
      userName,
      message: feedbackText.trim(),
      createdAt: new Date().toISOString(),
      screen,
    };
    const nextFeedback = [nextEntry, ...feedbackEntries];
    setFeedbackEntries(nextFeedback);
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(nextFeedback));
    if (actor) {
      dbSaveFeedback(actor, nextEntry).catch(() => {});
    }
    setFeedbackText("");
  }

  // ── Location ──────────────────────────────────────────────────────────────────
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationLabel("Geolocation not supported in this browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(5);
        const lng = pos.coords.longitude.toFixed(5);
        setLocationLabel(`Shared for this active session only: ${lat}, ${lng}`);
      },
      () => {
        setLocationLabel("Location not shared");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
    );
  }, []);

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (!hydrated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-5"
        style={{ backgroundColor: "#140810" }}
      >
        <div
          className="w-full max-w-sm rounded-3xl p-7"
          style={{ backgroundColor: "#20161b", border: "1px solid #38262e" }}
        >
          <p
            className="text-xs font-bold tracking-widest uppercase mb-2"
            style={{ color: "#d9a6b7" }}
          >
            Mirror Within
          </p>
          <h1
            className="text-2xl font-extrabold mb-2"
            style={{ color: "#fff7fa" }}
          >
            Loading
          </h1>
          <p
            className="text-sm"
            style={{ color: "#d6c5cb", lineHeight: "1.6" }}
          >
            Restoring your session...
          </p>
        </div>
      </div>
    );
  }

  // ── Lock screen ───────────────────────────────────────────────────────────────
  if (!isUnlocked && !showWelcome) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-5"
        style={{ backgroundColor: "#140810" }}
        data-ocid="access.page"
      >
        <div
          className="w-full max-w-sm rounded-3xl p-7"
          style={{ backgroundColor: "#20161b", border: "1px solid #38262e" }}
        >
          <p
            className="text-xs font-bold tracking-widest uppercase mb-2"
            style={{ color: "#d9a6b7" }}
          >
            Mirror Within
          </p>
          <h1
            className="text-2xl font-extrabold mb-2"
            style={{ color: "#fff7fa" }}
          >
            Private Access
          </h1>
          <p
            className="text-sm mb-6"
            style={{ color: "#d6c5cb", lineHeight: "1.6" }}
          >
            Enter your access code to continue.
          </p>
          <input
            type="text"
            value={accessInput}
            onChange={(e) => setAccessInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const name = allowedCodes[accessInput.trim()];
                if (name) {
                  setUserName(name);
                  setUnlockedCode(accessInput.trim());
                  setShowWelcome(true);
                } else {
                  alert("Invalid code. Please try again.");
                }
              }
            }}
            placeholder="Enter code"
            className="w-full rounded-2xl px-4 py-3 text-sm outline-none mb-4"
            style={{
              backgroundColor: "#2b2025",
              border: "1px solid #4a323c",
              color: "#fff",
            }}
            data-ocid="access.input"
          />
          <button
            type="button"
            data-ocid="access.submit_button"
            onClick={() => {
              const name = allowedCodes[accessInput.trim()];
              if (name) {
                setUserName(name);
                setShowWelcome(true);
              } else {
                alert("Invalid code. Please try again.");
              }
            }}
            className="w-full rounded-2xl py-4 text-sm font-extrabold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#efc1d0", color: "#1d1418" }}
          >
            Unlock
          </button>
        </div>
      </div>
    );
  }

  // ── Welcome screen ────────────────────────────────────────────────────────────
  if (showWelcome) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-5"
        style={{ backgroundColor: "#140810" }}
      >
        <div
          className="w-full max-w-sm rounded-3xl p-8 text-center"
          style={{ backgroundColor: "#20161b", border: "1px solid #38262e" }}
        >
          <p
            className="text-xs font-bold tracking-widest uppercase mb-4"
            style={{ color: "#d9a6b7" }}
          >
            Mirror Within
          </p>
          <h1
            className="text-3xl font-extrabold mb-3"
            style={{ color: "#fff7fa" }}
          >
            Welcome back, {userName}.
          </h1>
          <p
            className="text-sm mb-8"
            style={{ color: "#d6c5cb", lineHeight: "1.7" }}
          >
            This is a safe space for honest self-reflection. Take your time.
          </p>
          <button
            type="button"
            onClick={() => {
              setIsUnlocked(true);
              setShowWelcome(false);
              refreshSessionTimer(userName);
            }}
            className="w-full rounded-2xl py-4 text-sm font-extrabold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#efc1d0", color: "#1d1418" }}
          >
            Begin
          </button>
        </div>
      </div>
    );
  }

  // ── Main app ──────────────────────────────────────────────────────────────────

  // ── Step pill label ───────────────────────────────────────────────────────────
  function getStepLabel(): string {
    if (screen === "breathe") return "Breathe";
    if (screen === "support") return "Support";
    if (screen === "creator") return "Our Story";
    if (screen === "feedback") return "Feedback";
    if (screen === "garden") return "Garden";
    const labels = [
      "Welcome",
      "Entry Point",
      "Expression",
      `Ch ${journeyStep > 3 ? chapterIndex + 1 : 1}/3`,
      "Recap",
    ];
    return labels[journeyStep - 1] || "Mirror";
  }

  const shellNavItems: {
    icon: React.ReactNode;
    label: string;
    target: Screen;
  }[] = [
    {
      icon: <BookOpen className="h-3.5 w-3.5" />,
      label: "Journey",
      target: "journey",
    },
    {
      icon: <Wind className="h-3.5 w-3.5" />,
      label: "Breathe",
      target: "breathe",
    },
    {
      icon: <Sprout className="h-3.5 w-3.5" />,
      label: "Garden",
      target: "garden",
    },
    {
      icon: <Feather className="h-3.5 w-3.5" />,
      label: "Story",
      target: "creator",
    },
  ];

  const pageKey =
    screen === "journey" ? `journey-${journeyStep}-${chapterIndex}` : screen;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background:
          "linear-gradient(180deg, #120608 0%, #1e0d12 45%, #2a1018 100%)",
      }}
    >
      {/* Subtle dot pattern overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1' fill='%23ffffff' fill-opacity='0.03'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
        }}
      />
      {/* Global modals */}
      <AnimatePresence>
        {showCrisisModal && (
          <CrisisModal
            open={showCrisisModal}
            onClose={() => setShowCrisisModal(false)}
            onSupport={() => {
              setShowCrisisModal(false);
              setScreen("support");
            }}
          />
        )}
        {showClearDataModal && (
          <ClearDataModal
            open={showClearDataModal}
            onConfirm={confirmClearAllData}
            onCancel={() => setShowClearDataModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Shell card */}
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "28px",
          backdropFilter: "blur(14px)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
          overflow: "hidden",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Topbar */}
        <div
          style={{
            padding: "18px 20px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              opacity: 0.8,
              color: "#fff4f8",
              fontWeight: 700,
            }}
          >
            Mirror
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Session timer */}
            {isUnlocked && (
              <span
                style={{ fontSize: "11px", color: "#a07080", fontWeight: 600 }}
              >
                {formatTimeRemaining(sessionCountdown)}
              </span>
            )}
            {/* Step pill */}
            <div
              style={{
                fontSize: "12px",
                padding: "8px 12px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#f6eef8",
                whiteSpace: "nowrap",
              }}
            >
              {isUnlocked ? getStepLabel() : "Welcome"}
            </div>
            {/* Feedback icon - creator only */}
            {isUnlocked && unlockedCode === "Iamki" && (
              <button
                type="button"
                data-ocid="topbar.feedback.open_modal_button"
                onClick={() =>
                  setScreen(screen === "feedback" ? "journey" : "feedback")
                }
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "999px",
                  padding: "8px",
                  color:
                    screen === "feedback" ? "#efc1d0" : "rgba(246,238,248,0.7)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <MessageSquare className="h-3.5 w-3.5" />
              </button>
            )}
            {/* Log out */}
            {isUnlocked && (
              <button
                type="button"
                data-ocid="nav.logout.button"
                onClick={lockApp}
                style={{
                  background: "transparent",
                  border: "1px solid #76515e",
                  borderRadius: "999px",
                  padding: "6px 10px",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#f4d6df",
                  cursor: "pointer",
                }}
              >
                Lock
              </button>
            )}
          </div>
        </div>

        {/* Mini nav strip (only when unlocked) */}
        {isUnlocked && (
          <div
            style={{
              display: "flex",
              gap: "6px",
              padding: "12px 20px 0",
              flexWrap: "wrap",
            }}
            data-ocid="nav.panel"
          >
            {shellNavItems.map(({ icon, label, target }) => (
              <button
                key={target}
                type="button"
                data-ocid={`nav.${target}.link`}
                onClick={() => {
                  refreshSessionTimer();
                  if (target === "breathe") {
                    setBreatheReturnScreen(
                      screen === "breathe" ? "journey" : screen,
                    );
                  }
                  setScreen(target);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "6px 12px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 600,
                  background:
                    screen === target
                      ? "rgba(239,193,208,0.15)"
                      : "rgba(255,255,255,0.05)",
                  border:
                    screen === target
                      ? "1px solid rgba(239,193,208,0.35)"
                      : "1px solid rgba(255,255,255,0.08)",
                  color:
                    screen === target ? "#efc1d0" : "rgba(246,238,248,0.65)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {icon}
                {label}
              </button>
            ))}
            {/* Crisis alert if active */}
            {crisisActive && (
              <button
                type="button"
                data-ocid="nav.support.link"
                onClick={() => setScreen("support")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "6px 12px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 700,
                  background: "rgba(255,107,138,0.15)",
                  border: "1px solid rgba(255,107,138,0.4)",
                  color: "#ff6b8a",
                  cursor: "pointer",
                }}
              >
                Get support
              </button>
            )}
          </div>
        )}

        {/* Page container */}
        <div style={{ position: "relative", padding: "18px" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={pageKey}
              initial={{ opacity: 0, rotateY: -18, x: 28, scale: 0.98 }}
              animate={{ opacity: 1, rotateY: 0, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.97 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              style={{
                perspective: "1200px",
                transformStyle: "preserve-3d",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "24px",
                padding: "24px",
                minHeight: "480px",
              }}
            >
              {/* Lock / Welcome / Loading screens */}
              {!hydrated && (
                <div className="flex flex-col gap-4 py-8">
                  <p
                    className="text-xs font-bold tracking-widest uppercase"
                    style={{ color: "#d9a6b7" }}
                  >
                    Mirror Within
                  </p>
                  <h1
                    className="text-2xl font-extrabold"
                    style={{ color: "#fff7fa" }}
                  >
                    Loading
                  </h1>
                  <p
                    className="text-sm"
                    style={{ color: "#d6c5cb", lineHeight: "1.6" }}
                  >
                    Restoring your session...
                  </p>
                </div>
              )}

              {hydrated && !isUnlocked && !showWelcome && (
                <div
                  className="flex flex-col gap-5 py-4"
                  data-ocid="access.page"
                >
                  <div>
                    <p
                      className="text-xs font-bold tracking-[0.2em] uppercase mb-3"
                      style={{ color: "#d9a6b7" }}
                    >
                      Mirror Within
                    </p>
                    <h1
                      className="text-2xl font-extrabold mb-2"
                      style={{ color: "#fff7fa" }}
                    >
                      Private Access
                    </h1>
                    <p
                      className="text-sm"
                      style={{ color: "#d6c5cb", lineHeight: "1.6" }}
                    >
                      Enter your access code to continue.
                    </p>
                  </div>
                  <input
                    type="text"
                    value={accessInput}
                    onChange={(e) => setAccessInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const name = allowedCodes[accessInput.trim()];
                        if (name) {
                          setUserName(name);
                          setShowWelcome(true);
                        } else alert("Invalid code. Please try again.");
                      }
                    }}
                    placeholder="Enter code"
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{
                      backgroundColor: "#2b2025",
                      border: "1px solid #4a323c",
                      color: "#fff",
                    }}
                    data-ocid="access.input"
                  />
                  <button
                    type="button"
                    data-ocid="access.submit_button"
                    onClick={() => {
                      const name = allowedCodes[accessInput.trim()];
                      if (name) {
                        setUserName(name);
                        setUnlockedCode(accessInput.trim());
                        setShowWelcome(true);
                      } else alert("Invalid code. Please try again.");
                    }}
                    className="w-full rounded-2xl py-4 text-sm font-extrabold transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#efc1d0", color: "#1d1418" }}
                  >
                    Unlock
                  </button>
                </div>
              )}

              {hydrated && showWelcome && (
                <div className="flex flex-col items-center gap-5 py-8 text-center">
                  <p
                    className="text-xs font-bold tracking-[0.2em] uppercase"
                    style={{ color: "#d9a6b7" }}
                  >
                    Mirror Within
                  </p>
                  <h1
                    className="text-3xl font-extrabold"
                    style={{ color: "#fff7fa" }}
                  >
                    Welcome back, {userName}.
                  </h1>
                  <p
                    className="text-sm max-w-xs"
                    style={{ color: "#d6c5cb", lineHeight: "1.7" }}
                  >
                    This is a safe space for honest self-reflection. Take your
                    time.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUnlocked(true);
                      setShowWelcome(false);
                      refreshSessionTimer(userName);
                    }}
                    className="w-full rounded-2xl py-4 text-sm font-extrabold transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#efc1d0", color: "#1d1418" }}
                  >
                    Begin
                  </button>
                </div>
              )}

              {/* Main screens (when unlocked) */}
              {hydrated && isUnlocked && !showWelcome && (
                <>
                  {screen === "journey" && (
                    <BookJourney
                      step={journeyStep}
                      sharedName={sharedName}
                      selectedPath={selectedPath}
                      selectedMode={selectedMode}
                      chapterIndex={chapterIndex}
                      typedResponses={typedResponses}
                      savedChapters={savedChapters}
                      profile={profile}
                      onSetStep={setJourneyStep}
                      onSetSharedName={setSharedName}
                      onSetSelectedPath={setSelectedPath}
                      onSetSelectedMode={setSelectedMode}
                      onSetChapterIndex={setChapterIndex}
                      onSetTypedResponses={setTypedResponses}
                      onSetSavedChapters={setSavedChapters}
                      onSetProfile={setProfile}
                      onCrisisDetected={handleCrisisDetected}
                      feedbackEntries={feedbackEntries}
                      feedbackText={feedbackText}
                      onFeedbackChange={setFeedbackText}
                      onSubmitFeedback={submitFeedback}
                      onClearAllData={clearAllLocalData}
                      crisisCount={crisisCount}
                      locationLabel={locationLabel}
                      onShareLocation={requestLocation}
                      onEndSession={clearSession}
                      actor={actor}
                    />
                  )}

                  {screen === "breathe" && (
                    <BreatheScreen
                      onStop={() => setScreen(breatheReturnScreen)}
                    />
                  )}

                  {screen === "support" && (
                    <SupportScreen
                      crisisContent={crisisContent}
                      crisisCount={crisisCount}
                      locationLabel={locationLabel}
                      onRequestLocation={requestLocation}
                      onContinue={() => {
                        setCrisisActive(false);
                        refreshSessionTimer();
                        setScreen("journey");
                      }}
                    />
                  )}

                  {screen === "creator" && <CreatorScreen />}

                  {screen === "feedback" && (
                    <FeedbackViewer
                      onBack={() => setScreen("journey")}
                      actor={actor}
                    />
                  )}

                  {screen === "garden" && (
                    <GardenPanel
                      journeyStep={journeyStep}
                      savedChapters={savedChapters}
                      selectedPath={selectedPath}
                      profile={profile}
                    />
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        {isUnlocked && (
          <div style={{ padding: "16px 24px 20px", textAlign: "center" }}>
            <p style={{ fontSize: "11px", color: "#6b5560" }}>
              © {new Date().getFullYear()}. Built with ♥ using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#9e7a88" }}
              >
                caffeine.ai
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
