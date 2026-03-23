import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Feather,
  Mic,
  PauseCircle,
  PenTool,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
type Screen = "journey" | "breathe" | "support" | "creator";

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
const SESSION_TIMEOUT_MS = 1000 * 60 * 15;

const allowedCodes: Record<string, string> = {
  Ree17: "kareesha",
  BluhzM: "mark",
  Kayswt: "Kayden",
  FieldsD: "Garfield",
  Jade: "jaida",
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

const followupsByPath: Record<string, string[]> = {
  surface: [
    "Why did that small moment take up more space than it should have?",
    "What emotion was under the irritation, distance, or discomfort?",
  ],
  attacked: [
    "What changes the second you stop pretending not to know this?",
    "What do you gain from keeping this pattern alive?",
  ],
  love: [
    "Are you trying to be understood, or are you trying not to be abandoned?",
    "What are you accepting because being chosen feels better than being alone?",
  ],
  control: [
    "What are you afraid would happen if you were not holding everything together?",
    "Who are you without the role of being the one who manages it all?",
  ],
};

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
];

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

// ─── ProgressRings ────────────────────────────────────────────────────────────
function ProgressRings({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          className="h-2.5 w-8 rounded-full transition-all duration-300"
          style={{
            backgroundColor: item <= step ? "#efc1d0" : "#3a2b31",
          }}
        />
      ))}
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

// ─── BookJourney ──────────────────────────────────────────────────────────────
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
}) {
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [spokenTranscript, setSpokenTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  const activePath = useMemo(
    () => entryPaths.find((item) => item.id === selectedPath) || null,
    [selectedPath],
  );

  const activeQuestion = activePath?.questions?.[chapterIndex] ?? "";
  const followups = selectedPath ? (followupsByPath[selectedPath] ?? []) : [];
  const currentResponse =
    selectedMode === "voice"
      ? spokenTranscript
      : (typedResponses[chapterIndex] ?? "");
  const canAdvance = Boolean(currentResponse.trim());
  const allChaptersDone = activePath
    ? chapterIndex >= activePath.questions.length - 1
    : false;

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

  // Speech recognition setup
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
      onCrisisDetected(t);
    };
    recognition.onerror = () => {
      setVoiceError(
        "The mic got interrupted. This works best in Chrome-based browsers.",
      );
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    return () => recognition.stop();
  }, [onCrisisDetected]);

  function startListening() {
    if (!recognitionRef.current) return;
    setVoiceError("");
    setListening(true);
    recognitionRef.current.start();
  }

  function stopListening() {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setListening(false);
  }

  function handleTypedChange(val: string) {
    onSetTypedResponses((prev) => ({ ...prev, [chapterIndex]: val }));
    onCrisisDetected(val);
  }

  function saveAndAdvance() {
    if (!activePath || !canAdvance) return;
    const record: ChapterRecord = {
      chapter: chapterIndex + 1,
      question: activeQuestion,
      response: currentResponse,
      followups,
      mode: selectedMode ?? "writing",
    };
    onSetSavedChapters((prev) => {
      const next = [
        ...prev.filter((item) => item.chapter !== record.chapter),
        record,
      ];
      return next.sort((a, b) => a.chapter - b.chapter);
    });
    if (selectedMode === "voice") {
      setSpokenTranscript("");
      stopListening();
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
      onSetStep(5);
    }
  }

  const sidebarDisplay = {
    name: sharedName || "Not chosen yet",
    beginning: activePath?.label || "Not chosen yet",
    style:
      selectedMode === "voice"
        ? "Your very own TedTalk"
        : selectedMode === "writing"
          ? "Hear ye Hear ye"
          : "Not chosen yet",
    progress:
      step < 4 || !activePath
        ? "Not started yet"
        : `${Math.min(chapterIndex + 1, activePath.questions.length)} / ${
            activePath.questions.length
          }`,
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      {/* Main section */}
      <section
        className="rounded-[32px] border p-6 shadow-2xl md:p-8"
        style={{ backgroundColor: "#1b1317", borderColor: "#35242c" }}
      >
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
              <p
                className="mt-3 text-xs leading-6"
                style={{ color: "#bfa9b2" }}
              >
                Examples: K, The version of me today, Unbothered, Soft Girl,
                Main Character.
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
                    borderColor:
                      selectedMode === mode.id ? "#efc1d0" : "#3d2a32",
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
                onClick={() => selectedMode && onSetStep(4)}
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
            <div>
              <p
                className="text-sm font-semibold uppercase tracking-[0.2em]"
                style={{ color: "#d9a6b7" }}
              >
                Chapter {chapterIndex + 1} of {activePath.questions.length}
              </p>
              <h2
                className="mt-2 text-3xl font-extrabold leading-tight font-display"
                style={{ color: "#fff4f8" }}
              >
                {activeQuestion}
              </h2>
              <p
                className="mt-3 max-w-2xl text-sm leading-7"
                style={{ color: "#d5c4cb" }}
              >
                {selectedMode === "voice"
                  ? `${sharedName}, say it out loud first. Let it be messy before it is meaningful.`
                  : `${sharedName}, write like no one is grading this. Let the sentence land before you edit it.`}
              </p>
            </div>

            {selectedMode === "voice" ? (
              <div
                className="rounded-[28px] border p-5"
                style={{ borderColor: "#3d2a32", backgroundColor: "#24181d" }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="rounded-2xl p-3"
                      style={{ backgroundColor: "#2b2025", color: "#efc1d0" }}
                    >
                      <Mic className="h-6 w-6" />
                    </div>
                    <div>
                      <p
                        className="text-xl font-extrabold"
                        style={{ color: "#fff4f8" }}
                      >
                        Your very own TedTalk
                      </p>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "#efc1d0" }}
                      >
                        Live voice capture
                      </p>
                    </div>
                  </div>
                  {voiceSupported &&
                    (!listening ? (
                      <button
                        type="button"
                        data-ocid="journey.mic.primary_button"
                        onClick={startListening}
                        className="inline-flex items-center rounded-2xl px-4 py-3 font-extrabold transition hover:opacity-90"
                        style={{ backgroundColor: "#efc1d0", color: "#1d1418" }}
                      >
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Start mic
                      </button>
                    ) : (
                      <button
                        type="button"
                        data-ocid="journey.mic.stop.button"
                        onClick={stopListening}
                        className="inline-flex items-center rounded-2xl px-4 py-3 font-extrabold"
                        style={{ backgroundColor: "#ff6b8a", color: "#fff" }}
                      >
                        <PauseCircle className="mr-2 h-4 w-4" />
                        Stop mic
                      </button>
                    ))}
                </div>
                {!voiceSupported && (
                  <div
                    className="mt-4 rounded-2xl border p-4 text-sm leading-6"
                    style={{
                      borderColor: "#7a3b4c",
                      backgroundColor: "#3a1f28",
                      color: "#ffd9e2",
                    }}
                    data-ocid="journey.voice.error_state"
                  >
                    Voice capture is not available in this browser. Chrome
                    usually works best.
                  </div>
                )}
                {voiceError && (
                  <div
                    className="mt-4 rounded-2xl border p-4 text-sm leading-6"
                    style={{
                      borderColor: "#7a3b4c",
                      backgroundColor: "#3a1f28",
                      color: "#ffd9e2",
                    }}
                    data-ocid="journey.voice.error_state"
                  >
                    {voiceError}
                  </div>
                )}
                <div
                  className="mt-5 rounded-2xl border p-4"
                  style={{ borderColor: "#4a323c", backgroundColor: "#2b2025" }}
                >
                  <p className="text-sm font-bold" style={{ color: "#f1d8df" }}>
                    Transcript
                  </p>
                  <p
                    className="mt-3 min-h-[180px] whitespace-pre-wrap text-sm leading-6"
                    style={{ color: "#dbc8cf" }}
                  >
                    {spokenTranscript ||
                      "Start speaking and your words will appear here."}
                  </p>
                </div>
              </div>
            ) : (
              <div
                className="rounded-[28px] border p-5"
                style={{ borderColor: "#3d2a32", backgroundColor: "#24181d" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="rounded-2xl p-3"
                    style={{ backgroundColor: "#2b2025", color: "#efc1d0" }}
                  >
                    <PenTool className="h-6 w-6" />
                  </div>
                  <div>
                    <p
                      className="text-xl font-extrabold"
                      style={{ color: "#fff4f8" }}
                    >
                      Hear ye Hear ye
                    </p>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "#efc1d0" }}
                    >
                      Chapter response
                    </p>
                  </div>
                </div>
                <textarea
                  data-ocid="journey.chapter.textarea"
                  value={typedResponses[chapterIndex] ?? ""}
                  onChange={(e) => handleTypedChange(e.target.value)}
                  placeholder="Write the first honest version, not the polished one."
                  className="mt-5 min-h-[220px] w-full rounded-2xl border px-4 py-3 text-white outline-none"
                  style={{
                    borderColor: "#4a323c",
                    backgroundColor: "#2b2025",
                  }}
                />
              </div>
            )}

            {currentResponse.trim() && (
              <div
                className="rounded-[28px] border p-5"
                style={{ borderColor: "#3d2a32", backgroundColor: "#24181d" }}
              >
                <p
                  className="text-sm font-bold uppercase tracking-[0.2em]"
                  style={{ color: "#d9a6b7" }}
                >
                  Peel deeper
                </p>
                <div className="mt-4 space-y-3">
                  {followups.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl p-4 text-sm leading-6"
                      style={{ backgroundColor: "#2b2025", color: "#dbc8cf" }}
                    >
                      • {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                data-ocid="journey.chapter.primary_button"
                disabled={!canAdvance}
                onClick={saveAndAdvance}
                className="inline-flex items-center rounded-2xl px-5 py-3 font-extrabold transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#efc1d0", color: "#1d1418" }}
              >
                {allChaptersDone ? "Finish chapter" : "Next page"}
                <ChevronRight className="ml-2 h-4 w-4" />
              </button>
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
                <p
                  className="font-bold capitalize"
                  style={{ color: "#fff4f8" }}
                >
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
                      <div
                        key={k}
                        className="flex items-center justify-between"
                      >
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
      </section>

      {/* Sidebar */}
      <aside className="space-y-6">
        <div
          className="rounded-[32px] border p-6 shadow-2xl"
          style={{ backgroundColor: "#1b1317", borderColor: "#35242c" }}
        >
          <h3
            className="text-xl font-extrabold font-display mb-4"
            style={{ color: "#fff4f8" }}
          >
            Current selections
          </h3>
          <div className="space-y-3">
            {[
              { label: "Shared name", value: sidebarDisplay.name },
              { label: "Story beginning", value: sidebarDisplay.beginning },
              { label: "Expression style", value: sidebarDisplay.style },
              { label: "Chapter progress", value: sidebarDisplay.progress },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-2xl p-4"
                style={{ backgroundColor: "#24181d" }}
              >
                <p
                  className="text-xs font-bold uppercase tracking-wide"
                  style={{ color: "#d9a6b7" }}
                >
                  {label}
                </p>
                <p
                  className="mt-2 text-sm leading-6"
                  style={{ color: "#f6dae3" }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {profile.sessions > 0 && (
          <div
            className="rounded-[32px] border p-6 shadow-2xl"
            style={{ backgroundColor: "#1b1317", borderColor: "#35242c" }}
          >
            <h3
              className="text-xl font-extrabold font-display mb-3"
              style={{ color: "#fff4f8" }}
            >
              Pattern profile
            </h3>
            <p className="text-xs mb-3" style={{ color: "#bfa9b2" }}>
              {profile.sessions} session{profile.sessions !== 1 ? "s" : ""}{" "}
              completed
            </p>
            {Object.entries(profile.counts).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(profile.counts).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between rounded-2xl px-3 py-2"
                    style={{ backgroundColor: "#24181d" }}
                  >
                    <span
                      className="text-sm capitalize"
                      style={{ color: "#dbc8cf" }}
                    >
                      {k}
                    </span>
                    <span
                      className="text-xs font-bold rounded-full px-2 py-0.5"
                      style={{ backgroundColor: "#2b2025", color: "#efc1d0" }}
                    >
                      {v}×
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "#dbc8cf" }}>
                No patterns recorded yet.
              </p>
            )}
          </div>
        )}

        <div
          className="rounded-[32px] border p-6 shadow-2xl"
          style={{ backgroundColor: "#1b1317", borderColor: "#35242c" }}
        >
          <h3
            className="text-xl font-extrabold font-display mb-3"
            style={{ color: "#fff4f8" }}
          >
            Why this layout works
          </h3>
          <ul
            className="space-y-3 text-sm leading-6"
            style={{ color: "#d5c4cb" }}
          >
            <li>• Avoidant users are not hit with every tool at once.</li>
            <li>• Deeper users still get a clear path inward.</li>
            <li>• The experience feels like unfolding, not confronting.</li>
            <li>• Story language makes reflection feel less clinical.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [hydrated, setHydrated] = useState(false);
  const [screen, setScreen] = useState<Screen>("journey");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [accessInput, setAccessInput] = useState("");
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
  function handleCrisisDetected(text: string) {
    if (!hasCrisisLanguage(text)) return;
    const severity = getCrisisSeverity(text);
    setCrisisSeverity(severity);
    setCrisisActive(true);
    setCrisisCount((prev) => prev + 1);
    setShowCrisisModal(true);
    refreshSessionTimer();
  }

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
        style={{ backgroundColor: "#140f12" }}
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
        style={{ backgroundColor: "#140f12" }}
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
        style={{ backgroundColor: "#140f12" }}
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
  const navItems: { label: string; target: Screen }[] = [
    { label: "Journey", target: "journey" },
    { label: "Breathe", target: "breathe" },
    { label: "Support", target: "support" },
    { label: "Our Story", target: "creator" },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#120d10" }}>
      {/* Modals */}
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

      {/* Crisis banner */}
      {crisisActive && (
        <div
          className="sticky top-0 z-30 px-5 py-3 flex items-center justify-between gap-4"
          style={{
            backgroundColor: "#3a1f28",
            borderBottom: "1px solid #7a3b4c",
          }}
        >
          <p className="text-sm font-bold" style={{ color: "#ffd9e2" }}>
            {crisisContent.title}
          </p>
          <button
            type="button"
            data-ocid="crisis.banner.button"
            onClick={() => setScreen("support")}
            className="rounded-full px-4 py-2 text-xs font-extrabold transition-opacity hover:opacity-90 whitespace-nowrap"
            style={{ backgroundColor: "#ff6b8a", color: "#fff" }}
          >
            Get support
          </button>
        </div>
      )}

      {/* Main layout */}
      <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
        {/* Header */}
        <header
          className="rounded-[30px] border p-6 shadow-2xl mb-6"
          style={{ backgroundColor: "#1b1317", borderColor: "#35242c" }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <p
                className="text-xs font-bold uppercase tracking-[0.25em]"
                style={{ color: "#d9a6b7" }}
              >
                Mirror Within{userName ? ` · ${userName}` : ""}
              </p>
              <h1
                className="mt-2 text-3xl font-extrabold leading-tight font-display md:text-4xl"
                style={{ color: "#fff4f8" }}
              >
                A slower entrance, like opening a book instead of opening a
                wound.
              </h1>
            </div>
            <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
              <ProgressRings step={screen === "journey" ? journeyStep : 0} />
              <div className="flex items-center gap-3">
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: "#a07080" }}
                >
                  {formatTimeRemaining(sessionCountdown)}
                </span>
                <button
                  type="button"
                  data-ocid="nav.logout.button"
                  onClick={() => lockApp()}
                  className="text-[11px] font-bold rounded-full px-3 py-1 border transition-opacity hover:opacity-80"
                  style={{
                    borderColor: "#76515e",
                    color: "#f4d6df",
                    backgroundColor: "transparent",
                  }}
                >
                  Log out
                </button>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex flex-wrap gap-2 mt-5" data-ocid="nav.panel">
            {navItems.map(({ label, target }) => (
              <button
                type="button"
                key={target}
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
                className="rounded-full px-[13px] py-[9px] text-[13px] font-semibold border transition-all"
                style={{
                  backgroundColor: screen === target ? "#38262e" : "#2a1e24",
                  borderColor: "#4a323c",
                  color: "#f1d8df",
                }}
              >
                {label}
              </button>
            ))}
          </nav>
        </header>

        {/* Screen content */}
        <main>
          <AnimatePresence mode="wait">
            {screen === "journey" && (
              <motion.div
                key="journey"
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
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
                />
              </motion.div>
            )}

            {screen === "breathe" && (
              <motion.div
                key="breathe"
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <BreatheScreen onStop={() => setScreen(breatheReturnScreen)} />
              </motion.div>
            )}

            {screen === "support" && (
              <motion.div
                key="support"
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
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
              </motion.div>
            )}

            {screen === "creator" && (
              <motion.div
                key="creator"
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <CreatorScreen />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="text-xs" style={{ color: "#6b5560" }}>
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
        </footer>
      </div>
    </div>
  );
}
