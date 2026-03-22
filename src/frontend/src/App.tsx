import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
type Screen =
  | "onboarding"
  | "checkin"
  | "intake"
  | "shadow"
  | "journal"
  | "insights"
  | "resources"
  | "breathe"
  | "creator";

type PromptItem = {
  id: string;
  question: string;
  placeholder: string;
  category: "intake" | "shadow";
};

type SavedEntry = {
  id: string;
  createdAt: string;
  answers: Record<string, string>;
  mood: string;
  reason: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = "mirror_within_entries_v1";

const prompts: PromptItem[] = [
  {
    id: "why_downloaded",
    category: "intake",
    question: "Why did you download this app in the first place?",
    placeholder: "What are you hoping to understand, heal, or change?",
  },
  {
    id: "feelings_today",
    category: "intake",
    question:
      "How are you feeling right now beneath the first answer that comes to mind?",
    placeholder: "Name the emotions, body sensations, and thoughts.",
  },
  {
    id: "what_hurts",
    category: "intake",
    question: "What keeps hurting even when you try to move on?",
    placeholder: "What pattern keeps repeating?",
  },
  {
    id: "mask",
    category: "shadow",
    question: "What version of yourself do you perform for other people?",
    placeholder: "Who are you trying to protect, please, or impress?",
  },
  {
    id: "trigger",
    category: "shadow",
    question:
      "Who triggers you the most, and what might they reflect back to you?",
    placeholder: "What qualities do they bring up in you?",
  },
  {
    id: "control",
    category: "shadow",
    question:
      "Where are you forcing control because you are afraid of being hurt?",
    placeholder: "What would soften if you loosened your grip?",
  },
  {
    id: "truth",
    category: "shadow",
    question: "What truth about yourself have you been avoiding?",
    placeholder: "Write the sentence you least want to admit.",
  },
  {
    id: "self_betrayal",
    category: "shadow",
    question:
      "In what ways do you betray yourself to avoid rejection, conflict, or abandonment?",
    placeholder: "Where do you silence yourself?",
  },
  {
    id: "integration",
    category: "shadow",
    question: "What part of yourself are you ready to stop hiding?",
    placeholder: "What would living more honestly this week look like?",
  },
];

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
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function hasCrisisLanguage(text: string): boolean {
  const lower = text.toLowerCase();
  return crisisKeywords.some((kw) => lower.includes(kw));
}

function buildInsight(answers: Record<string, string>): string[] {
  const values = Object.values(answers).join(" ").toLowerCase();
  const patterns: string[] = [];
  if (
    values.includes("control") ||
    values.includes("afraid") ||
    values.includes("scared")
  )
    patterns.push(
      "Fear may be showing up as control, hyper-vigilance, or overthinking.",
    );
  if (
    values.includes("please") ||
    values.includes("rejection") ||
    values.includes("abandon")
  )
    patterns.push(
      "People-pleasing or fear of abandonment may be shaping your choices.",
    );
  if (
    values.includes("angry") ||
    values.includes("resent") ||
    values.includes("trigger")
  )
    patterns.push(
      "Your anger may be pointing toward unmet needs, violated boundaries, or disowned parts of self.",
    );
  if (
    values.includes("tired") ||
    values.includes("empty") ||
    values.includes("numb")
  )
    patterns.push(
      "Exhaustion may be emotional, not just physical. You may need rest, grief, or honesty more than productivity.",
    );
  if (patterns.length === 0)
    patterns.push(
      "Your answers suggest you are still uncovering the pattern. Read them slowly and notice which sentence feels the most charged or uncomfortable.",
    );
  return patterns;
}

function loadFromStorage(): SavedEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedEntry[]) : [];
  } catch {
    return [];
  }
}

function saveToStorage(entries: SavedEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function PrimaryButton({
  onClick,
  children,
  "data-ocid": ocid,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  "data-ocid"?: string;
}) {
  return (
    <button
      type="button"
      data-ocid={ocid}
      onClick={onClick}
      className="w-full rounded-[18px] py-4 px-4 text-sm font-extrabold mt-1 transition-opacity hover:opacity-90 active:opacity-80"
      style={{ backgroundColor: "#efc1d0", color: "#1d1418" }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  onClick,
  children,
  "data-ocid": ocid,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  "data-ocid"?: string;
}) {
  return (
    <button
      type="button"
      data-ocid={ocid}
      onClick={onClick}
      className="w-full rounded-[18px] py-[14px] px-4 text-sm font-bold mt-2 border transition-opacity hover:opacity-80 active:opacity-70"
      style={{
        borderColor: "#76515e",
        color: "#f4d6df",
        backgroundColor: "transparent",
      }}
    >
      {children}
    </button>
  );
}

function Card({
  children,
  className = "",
}: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[24px] p-[18px] mb-4 border ${className}`}
      style={{ backgroundColor: "#20161b", borderColor: "#38262e" }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-[22px] font-extrabold mb-3 font-display"
      style={{ color: "#fff4f8" }}
    >
      {children}
    </h2>
  );
}

function BodyText({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[15px] leading-[23px] mb-3" style={{ color: "#dbc8cf" }}>
      {children}
    </p>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-bold mb-2 mt-1" style={{ color: "#f2d7e0" }}>
      {children}
    </p>
  );
}

function MultilineInput({
  value,
  onChange,
  placeholder,
  "data-ocid": ocid,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  "data-ocid"?: string;
}) {
  return (
    <textarea
      data-ocid={ocid}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={5}
      className="w-full rounded-[18px] p-[14px] text-[15px] leading-[22px] border focus:outline-none focus:ring-2"
      style={{
        backgroundColor: "#2b2025",
        borderColor: "#4a323c",
        color: "#fff",
        minHeight: "120px",
        resize: "vertical",
      }}
    />
  );
}

function SingleInput({
  value,
  onChange,
  placeholder,
  "data-ocid": ocid,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  "data-ocid"?: string;
}) {
  return (
    <input
      data-ocid={ocid}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-[18px] px-[14px] py-[15px] text-[15px] border mb-3 focus:outline-none focus:ring-2"
      style={{
        backgroundColor: "#2b2025",
        borderColor: "#4a323c",
        color: "#fff",
        minHeight: "54px",
      }}
    />
  );
}

function PromptCard({
  prompt,
  value,
  onChange,
}: {
  prompt: PromptItem;
  value: string;
  onChange: (id: string, val: string) => void;
}) {
  return (
    <Card>
      <p
        className="text-[17px] font-bold mb-3 leading-[24px]"
        style={{ color: "#fff0f5" }}
      >
        {prompt.question}
      </p>
      <MultilineInput
        value={value}
        onChange={(v) => onChange(prompt.id, v)}
        placeholder={prompt.placeholder}
        data-ocid={`${prompt.id}.textarea`}
      />
    </Card>
  );
}

// ─── Breathe Screen ───────────────────────────────────────────────────────────
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
      className="flex flex-col items-center"
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

// ─── Entry Detail Modal ───────────────────────────────────────────────────────
function EntryDetailModal({
  entry,
  onClose,
}: {
  entry: SavedEntry | null;
  onClose: () => void;
}) {
  if (!entry) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-5 overflow-y-auto"
      style={{ backgroundColor: "rgba(20,15,18,0.92)" }}
      data-ocid="entry_detail.modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyUp={(e) => {
        if (e.key === "Escape") onClose();
      }}
      role="presentation"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-lg rounded-[24px] p-6 border my-8"
        style={{ backgroundColor: "#20161b", borderColor: "#38262e" }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p
              className="text-[13px] font-extrabold tracking-[1.2px] uppercase mb-1"
              style={{ color: "#d9a6b7" }}
            >
              Journal Entry
            </p>
            <p className="text-sm" style={{ color: "#dbc8cf" }}>
              {new Date(entry.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div
          className="rounded-[18px] p-4 mb-4"
          style={{ backgroundColor: "#2b2025" }}
        >
          <p
            className="text-xs font-bold uppercase tracking-wide mb-1"
            style={{ color: "#d9a6b7" }}
          >
            Mood
          </p>
          <p className="text-[15px]" style={{ color: "#fff0f5" }}>
            {entry.mood || "Not set"}
          </p>
        </div>
        <div
          className="rounded-[18px] p-4 mb-4"
          style={{ backgroundColor: "#2b2025" }}
        >
          <p
            className="text-xs font-bold uppercase tracking-wide mb-1"
            style={{ color: "#d9a6b7" }}
          >
            Why I came here
          </p>
          <p
            className="text-[15px] leading-[23px]"
            style={{ color: "#fff0f5" }}
          >
            {entry.reason || "Not set"}
          </p>
        </div>

        {prompts
          .filter((p) => entry.answers[p.id])
          .map((p) => (
            <div
              key={p.id}
              className="rounded-[18px] p-4 mb-3"
              style={{ backgroundColor: "#2b2025" }}
            >
              <p
                className="text-xs font-bold uppercase tracking-wide mb-1"
                style={{ color: "#d9a6b7" }}
              >
                {p.category === "shadow" ? "Shadow" : "Intake"}
              </p>
              <p
                className="text-sm font-semibold mb-2 leading-[20px]"
                style={{ color: "#f6dae3" }}
              >
                {p.question}
              </p>
              <p
                className="text-[15px] leading-[23px]"
                style={{ color: "#e8d0d8" }}
              >
                {entry.answers[p.id]}
              </p>
            </div>
          ))}

        <button
          type="button"
          data-ocid="entry_detail.close_button"
          onClick={onClose}
          className="w-full mt-3 rounded-[18px] py-3 text-sm font-bold border transition-opacity hover:opacity-80"
          style={{
            borderColor: "#76515e",
            color: "#f4d6df",
            backgroundColor: "transparent",
          }}
        >
          Close
        </button>
      </motion.div>
    </div>
  );
}

// ─── Crisis Modal ─────────────────────────────────────────────────────────────
function CrisisModal({
  open,
  crisisCount,
  onClose,
  onResources,
  onShareLocation,
}: {
  open: boolean;
  crisisCount: number;
  onClose: () => void;
  onResources: () => void;
  onShareLocation: () => void;
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
        <p className="text-sm leading-6 mb-3" style={{ color: "#dbc8cf" }}>
          It sounds like you may be going through something intense right now.
          This app is not enough on its own for an immediate safety crisis.
          Please reach out to emergency services, a crisis line, or someone
          physically near you right now if you may act on these thoughts.
        </p>
        {crisisCount >= 2 && (
          <p className="text-sm leading-6 mb-3" style={{ color: "#d9a6b7" }}>
            You can also choose to share your live location for this session
            only if you want faster help reaching you.
          </p>
        )}
        <div className="flex flex-col gap-2 mt-4">
          <button
            type="button"
            data-ocid="crisis.confirm_button"
            onClick={onResources}
            className="w-full rounded-[18px] py-3 text-sm font-extrabold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#efc1d0", color: "#1d1418" }}
          >
            Crisis resources
          </button>
          <button
            type="button"
            data-ocid="crisis.secondary_button"
            onClick={onShareLocation}
            className="w-full rounded-[18px] py-3 text-sm font-bold border transition-opacity hover:opacity-80"
            style={{
              borderColor: "#76515e",
              color: "#f4d6df",
              backgroundColor: "transparent",
            }}
          >
            Share live location
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

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({
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
      data-ocid="delete.modal"
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
          Delete local journal entries?
        </h3>
        <p className="text-sm leading-6 mb-4" style={{ color: "#dbc8cf" }}>
          This will permanently remove all saved entries from this device.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            data-ocid="delete.cancel_button"
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
            data-ocid="delete.confirm_button"
            onClick={onConfirm}
            className="flex-1 rounded-[18px] py-3 text-sm font-extrabold"
            style={{ backgroundColor: "#c0445e", color: "#fff" }}
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Nav ─────────────────────────────────────────────────────────────────────
const navItems: { label: string; screen: Screen }[] = [
  { label: "Check-in", screen: "checkin" },
  { label: "Breathe", screen: "breathe" },
  { label: "Intake", screen: "intake" },
  { label: "Shadow", screen: "shadow" },
  { label: "Journal", screen: "journal" },
  { label: "Insights", screen: "insights" },
  { label: "Help", screen: "resources" },
  { label: "Our Story", screen: "creator" },
];

function Nav({
  current,
  onNav,
}: { current: Screen; onNav: (s: Screen) => void }) {
  return (
    <nav className="flex flex-wrap gap-2 mb-5" data-ocid="nav.panel">
      {navItems.map(({ label, screen }) => (
        <button
          type="button"
          key={screen}
          data-ocid={`nav.${screen}.link`}
          onClick={() => onNav(screen)}
          className="rounded-full px-[13px] py-[9px] text-[13px] font-semibold border transition-all"
          style={{
            backgroundColor: current === screen ? "#38262e" : "#2a1e24",
            borderColor: "#4a323c",
            color: "#f1d8df",
          }}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}

// ─── Creator Screen ───────────────────────────────────────────────────────────
// ── EDIT YOUR STORY BELOW ──
// Replace the placeholder text in each section with your own words.
// Sections: WHO_I_AM, MY_BATTLE, WHY_I_BUILT_THIS, CLOSING_QUOTE

const CREATOR_STORY = {
  // ── WHO I AM ─────────────────────────────────────────────────────────────
  // A short intro. Who are you before the story starts?
  WHO_I_AM: [
    "I'm someone who spent years performing okay-ness while falling apart on the inside. I built things to feel useful when I couldn't feel much else. I've been the person in the room holding everyone together — while quietly having no idea how to hold myself.",
    "This is not a story about healing being linear. It's a story about staying.",
  ],

  // ── MY BATTLE ────────────────────────────────────────────────────────────
  // The honest version of what you've been through with mental health.
  MY_BATTLE: [
    "I built this app from the inside of a dark chapter. Not from a place of having it figured out, but from a place of desperately needing something that could hold me while I tried to figure it out.",
    "There were nights I sat with the weight of every version of myself I'd abandoned — the one who used to laugh easily, the one who trusted people before the patterns started, the one who slept without running through every possible way the next day could go wrong.",
    "Anxiety taught me to plan for disaster. Depression told me the disaster had already happened. And somewhere between those two voices, I stopped being able to hear my own.",
    "I went through the journals. The therapist offices. The mornings where getting up felt like a physical battle against gravity. I watched the people I loved struggle to understand why I was struggling. I smiled through things that were fracturing me. I built a life that looked fine from the outside and felt like survival from the inside.",
    'And slowly — not all at once, and not forever — I started asking different questions. Not "why am I like this?" but "what am I avoiding knowing about myself?"',
  ],

  // ── WHY I BUILT THIS ──────────────────────────────────────────────────────
  // Connect your story to why Mirror Within exists.
  WHY_I_BUILT_THIS: [
    "Mirror Within exists because I couldn't find a tool that trusted me. Every app I tried felt like it was trying to fix me, calm me down, or coach me into productivity. None of them wanted to sit in the hard question with me.",
    'I wanted something that would ask the real thing. Not "how are you feeling today on a scale of 1–10?" but "what are you performing, and who taught you that performance was safer than truth?"',
    "I built this for the version of me that needed it — and for anyone who recognizes themselves in that description. You don't need to be in crisis to use this. You just need to be willing to look.",
  ],

  // ── CLOSING QUOTE ─────────────────────────────────────────────────────────
  // A closing reflection, quote, or message to the person reading.
  CLOSING_QUOTE_LINE1:
    '"You are not behind on your healing. You are exactly where the work begins."',
  CLOSING_QUOTE_LINE2:
    "Thank you for being here. Thank you for looking inward when everything in you wanted to look away. This app is yours now — use it honestly.",
};

function CreatorScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      data-ocid="creator.section"
    >
      {/* Hero title block */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0 }}
        className="mb-6"
      >
        <p
          className="text-[12px] font-extrabold tracking-[2px] uppercase mb-3"
          style={{ color: "#d9a6b7" }}
        >
          Behind the Eyes
        </p>
        <h2
          className="text-[30px] leading-[36px] font-extrabold font-display mb-3"
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

      {/* Who I Am */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08 }}
      >
        <Card>
          <p
            className="text-[11px] font-extrabold tracking-[1.8px] uppercase mb-3"
            style={{ color: "#d9a6b7" }}
          >
            Who I Am
          </p>
          <SectionTitle>The person before the story</SectionTitle>
          {CREATOR_STORY.WHO_I_AM.map((para) => (
            <BodyText key={para.slice(0, 24)}>{para}</BodyText>
          ))}
        </Card>
      </motion.div>

      {/* My Battle */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.16 }}
      >
        <Card>
          <p
            className="text-[11px] font-extrabold tracking-[1.8px] uppercase mb-3"
            style={{ color: "#d9a6b7" }}
          >
            My Battle
          </p>
          <SectionTitle>The honest version</SectionTitle>
          {CREATOR_STORY.MY_BATTLE.map((para) => (
            <BodyText key={para.slice(0, 24)}>{para}</BodyText>
          ))}
        </Card>
      </motion.div>

      {/* Why I Built This */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.24 }}
      >
        <Card>
          <p
            className="text-[11px] font-extrabold tracking-[1.8px] uppercase mb-3"
            style={{ color: "#d9a6b7" }}
          >
            Why I Built This
          </p>
          <SectionTitle>The app I needed</SectionTitle>
          {CREATOR_STORY.WHY_I_BUILT_THIS.map((para) => (
            <BodyText key={para.slice(0, 24)}>{para}</BodyText>
          ))}
        </Card>
      </motion.div>

      {/* Closing quote — styled distinctly with a left-border accent */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.32 }}
      >
        <div
          className="rounded-[24px] p-[18px] mb-4"
          style={{
            backgroundColor: "#1c1117",
            borderLeft: "4px solid #efc1d0",
            border: "1px solid #2e1e26",
            borderLeftWidth: "4px",
            borderLeftColor: "#efc1d0",
          }}
        >
          <p
            className="text-[15px] leading-[25px] italic font-medium mb-3"
            style={{ color: "#f4d6df" }}
          >
            {CREATOR_STORY.CLOSING_QUOTE_LINE1}
          </p>
          <p
            className="text-[15px] leading-[25px]"
            style={{ color: "#c8a8b4" }}
          >
            {CREATOR_STORY.CLOSING_QUOTE_LINE2}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Screens ─────────────────────────────────────────────────────────────────
function OnboardingScreen({ onBegin }: { onBegin: () => void }) {
  const features = [
    {
      title: "Feeling check-ins",
      text: "Start with what you feel, not what you think you should say.",
    },
    {
      title: "Why you came here",
      text: "Name the wound, the pattern, or the question that brought you in.",
    },
    {
      title: "Shadow questions",
      text: "Face the parts of yourself you perform, hide, reject, or fear.",
    },
    {
      title: "Answer space",
      text: "Write freely and save entries locally on the device for later reflection.",
    },
    {
      title: "Crisis prompts",
      text: "If crisis language appears, the app surfaces immediate help options and optional session-only location sharing.",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid grid-cols-1 gap-3 mb-4">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-[22px] p-4 border"
            style={{ backgroundColor: "#20161b", borderColor: "#38262e" }}
          >
            <p
              className="text-[17px] font-bold mb-2"
              style={{ color: "#ffe8ef" }}
            >
              {f.title}
            </p>
            <p className="text-sm leading-[22px]" style={{ color: "#d7c4cb" }}>
              {f.text}
            </p>
          </div>
        ))}
      </div>

      <Card>
        <SectionTitle>Transparent safety note</SectionTitle>
        <BodyText>
          This app is for guided introspection and journaling. It does not
          replace emergency care or licensed mental health treatment. If you
          mention suicide or self-harm, the app will show urgent support options
          and offer voluntary session-only location sharing. It does not
          secretly contact emergency services or force location access.
        </BodyText>
        <PrimaryButton onClick={onBegin} data-ocid="onboarding.primary_button">
          Begin reflection
        </PrimaryButton>
      </Card>
    </motion.div>
  );
}

function CheckinScreen({
  mood,
  reason,
  onMoodChange,
  onReasonChange,
  onNext,
}: {
  mood: string;
  reason: string;
  onMoodChange: (v: string) => void;
  onReasonChange: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card>
        <SectionTitle>Check-in</SectionTitle>
        <FieldLabel>How are you feeling right now?</FieldLabel>
        <SingleInput
          value={mood}
          onChange={onMoodChange}
          placeholder="Heavy, numb, hopeful, angry, ashamed, restless..."
          data-ocid="checkin.mood.input"
        />
        <FieldLabel>Why did you download this app?</FieldLabel>
        <MultilineInput
          value={reason}
          onChange={onReasonChange}
          placeholder="What are you trying to understand about yourself?"
          data-ocid="checkin.reason.textarea"
        />
        <PrimaryButton onClick={onNext} data-ocid="checkin.primary_button">
          Go deeper
        </PrimaryButton>
      </Card>
    </motion.div>
  );
}

function IntakeScreen({
  prompts: intakePrompts,
  answers,
  onChange,
  onNext,
}: {
  prompts: PromptItem[];
  answers: Record<string, string>;
  onChange: (id: string, val: string) => void;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <h2
        className="text-[24px] font-extrabold mb-4 font-display"
        style={{ color: "#fff4f8" }}
      >
        Intake prompts
      </h2>
      {intakePrompts.map((p) => (
        <PromptCard
          key={p.id}
          prompt={p}
          value={answers[p.id] || ""}
          onChange={onChange}
        />
      ))}
      <PrimaryButton onClick={onNext} data-ocid="intake.primary_button">
        Continue to shadow work
      </PrimaryButton>
    </motion.div>
  );
}

function ShadowScreen({
  prompts: shadowPrompts,
  answers,
  onChange,
  onNext,
}: {
  prompts: PromptItem[];
  answers: Record<string, string>;
  onChange: (id: string, val: string) => void;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <h2
        className="text-[24px] font-extrabold mb-4 font-display"
        style={{ color: "#fff4f8" }}
      >
        Shadow work
      </h2>
      {shadowPrompts.map((p) => (
        <PromptCard
          key={p.id}
          prompt={p}
          value={answers[p.id] || ""}
          onChange={onChange}
        />
      ))}
      <PrimaryButton onClick={onNext} data-ocid="shadow.primary_button">
        Save and review
      </PrimaryButton>
    </motion.div>
  );
}

function JournalScreen({
  journalEntries,
  onSave,
  onViewInsights,
  onDeleteAll,
  onViewEntry,
}: {
  journalEntries: SavedEntry[];
  onSave: () => void;
  onViewInsights: () => void;
  onDeleteAll: () => void;
  onViewEntry: (entry: SavedEntry) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card>
        <SectionTitle>Journal actions</SectionTitle>
        <BodyText>
          Save this reflection locally on the device so you can revisit patterns
          later.
        </BodyText>
        <PrimaryButton onClick={onSave} data-ocid="journal.save_button">
          Save entry locally
        </PrimaryButton>
        <SecondaryButton
          onClick={onViewInsights}
          data-ocid="journal.insights.secondary_button"
        >
          View insights
        </SecondaryButton>
      </Card>

      <Card>
        <SectionTitle>Saved entries</SectionTitle>
        {journalEntries.length === 0 ? (
          <p
            className="text-sm"
            style={{ color: "#dbc8cf" }}
            data-ocid="journal.entries.empty_state"
          >
            No saved entries yet.
          </p>
        ) : (
          <div data-ocid="journal.entries.list">
            {journalEntries.map((entry, i) => (
              <button
                type="button"
                key={entry.id}
                data-ocid={`journal.entries.item.${i + 1}`}
                onClick={() => onViewEntry(entry)}
                className="w-full text-left pt-3 mt-3 border-t cursor-pointer rounded-[12px] px-2 transition-colors hover:bg-[#2b1e25] focus:outline-none"
                style={{ borderColor: "#3d2932" }}
              >
                <p
                  className="font-bold text-sm mb-1"
                  style={{ color: "#f6dae3" }}
                >
                  {new Date(entry.createdAt).toLocaleString()}
                </p>
                <p className="text-sm mb-1" style={{ color: "#dbc8cf" }}>
                  Mood: {entry.mood || "Not set"}
                </p>
                <p
                  className="text-sm leading-[21px] line-clamp-2"
                  style={{ color: "#cbb6bf" }}
                >
                  Why I came here: {entry.reason || "Not set"}
                </p>
                <p
                  className="text-xs mt-1 font-semibold"
                  style={{ color: "#a07080" }}
                >
                  Read full →
                </p>
              </button>
            ))}
          </div>
        )}
        <SecondaryButton
          onClick={onDeleteAll}
          data-ocid="journal.delete_button"
        >
          Delete saved local entries
        </SecondaryButton>
      </Card>
    </motion.div>
  );
}

function InsightsScreen({
  insights,
  crisisCount,
  locationLabel,
  onShareLocation,
  onEndSession,
  journalEntries,
}: {
  insights: string[];
  crisisCount: number;
  locationLabel: string;
  onShareLocation: () => void;
  onEndSession: () => void;
  journalEntries: SavedEntry[];
}) {
  const recentEntries = journalEntries.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card>
        <SectionTitle>Recent moods</SectionTitle>
        {recentEntries.length === 0 ? (
          <p
            className="text-sm"
            style={{ color: "#dbc8cf" }}
            data-ocid="insights.moods.empty_state"
          >
            No saved entries yet.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {recentEntries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3">
                <span
                  className="rounded-full px-[11px] py-[6px] text-[13px] font-semibold border"
                  style={{
                    backgroundColor: "#2b2025",
                    color: "#f1d8df",
                    borderColor: "#4a323c",
                    whiteSpace: "nowrap",
                  }}
                >
                  {entry.mood || "—"}
                </span>
                <span className="text-xs" style={{ color: "#8d7d84" }}>
                  {new Date(entry.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle>Reflection insights</SectionTitle>
        <BodyText>
          These are simple pattern prompts based on what you wrote. They are not
          diagnoses.
        </BodyText>
        {insights.map((item, i) => (
          <div
            key={item.slice(0, 30)}
            data-ocid={`insights.item.${i + 1}`}
            className="rounded-[18px] p-[14px] mb-3"
            style={{ backgroundColor: "#2b2025" }}
          >
            <p className="text-sm leading-[22px]" style={{ color: "#f8e8ee" }}>
              {item}
            </p>
          </div>
        ))}
      </Card>

      <Card>
        <SectionTitle>Session safety</SectionTitle>
        <BodyText>Crisis flags this session: {crisisCount}</BodyText>
        <BodyText>Location status: {locationLabel}</BodyText>
        <SecondaryButton
          onClick={onShareLocation}
          data-ocid="insights.location.secondary_button"
        >
          Share live location for this session
        </SecondaryButton>
        <SecondaryButton
          onClick={onEndSession}
          data-ocid="insights.endsession.secondary_button"
        >
          End session and clear session-only data
        </SecondaryButton>
      </Card>
    </motion.div>
  );
}

function ResourcesScreen({ onShareLocation }: { onShareLocation: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card>
        <SectionTitle>Crisis resources</SectionTitle>
        <BodyText>
          If there is immediate danger, call emergency services right now or go
          to the nearest emergency department. Do not rely on journaling alone
          in an active crisis.
        </BodyText>

        <a
          href="tel:988"
          className="block"
          data-ocid="resources.call988.primary_button"
        >
          <button
            type="button"
            className="w-full rounded-[18px] py-4 px-4 text-sm font-extrabold mt-1 transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#efc1d0", color: "#1d1418" }}
          >
            Call or text 988
          </button>
        </a>

        <SecondaryButton
          onClick={onShareLocation}
          data-ocid="resources.location.secondary_button"
        >
          Share live location for this session
        </SecondaryButton>

        <p className="text-xs mt-3 leading-5" style={{ color: "#b89ca7" }}>
          Replace the hotline button and crisis copy with the right local
          resources for the region where you launch the app.
        </p>
      </Card>
    </motion.div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("onboarding");
  const [breatheReturnScreen, setBreatheReturnScreen] =
    useState<Screen>("checkin");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [mood, setMood] = useState("");
  const [reason, setReason] = useState("");
  const [journalEntries, setJournalEntries] = useState<SavedEntry[]>(() =>
    loadFromStorage(),
  );
  const [crisisCount, setCrisisCount] = useState(0);
  const [locationLabel, setLocationLabel] = useState(
    "Not shared in this session",
  );
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<SavedEntry | null>(null);

  const intakePrompts = useMemo(
    () => prompts.filter((p) => p.category === "intake"),
    [],
  );
  const shadowPrompts = useMemo(
    () => prompts.filter((p) => p.category === "shadow"),
    [],
  );
  const insights = useMemo(() => buildInsight(answers), [answers]);

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
    );
  }, []);

  function checkCrisis(value: string) {
    if (hasCrisisLanguage(value)) {
      setCrisisCount((prev) => prev + 1);
      setShowCrisisModal(true);
    }
  }

  function updateField(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    checkCrisis(value);
  }

  function handleMoodChange(value: string) {
    setMood(value);
    checkCrisis(value);
  }

  function handleReasonChange(value: string) {
    setReason(value);
    checkCrisis(value);
  }

  function saveEntry() {
    const entry: SavedEntry = {
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      answers,
      mood,
      reason,
    };
    const updated = [entry, ...journalEntries];
    setJournalEntries(updated);
    saveToStorage(updated);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  }

  function clearSession() {
    setAnswers({});
    setMood("");
    setReason("");
    setCrisisCount(0);
    setLocationLabel("Not shared in this session");
    setScreen("onboarding");
  }

  function confirmDeleteEntries() {
    localStorage.removeItem(STORAGE_KEY);
    setJournalEntries([]);
    setShowDeleteModal(false);
  }

  function navigateToBreathe() {
    setBreatheReturnScreen(screen === "breathe" ? "checkin" : screen);
    setScreen("breathe");
  }

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    document.title = "Mirror Within — Self-Inquiry Journal";
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#140f12" }}>
      {/* Modals */}
      <AnimatePresence>
        {showCrisisModal && (
          <CrisisModal
            open={showCrisisModal}
            crisisCount={crisisCount}
            onClose={() => setShowCrisisModal(false)}
            onResources={() => {
              setShowCrisisModal(false);
              setScreen("resources");
            }}
            onShareLocation={() => {
              requestLocation();
              setShowCrisisModal(false);
            }}
          />
        )}
        {showDeleteModal && (
          <DeleteModal
            open={showDeleteModal}
            onConfirm={confirmDeleteEntries}
            onCancel={() => setShowDeleteModal(false)}
          />
        )}
        {selectedEntry && (
          <EntryDetailModal
            entry={selectedEntry}
            onClose={() => setSelectedEntry(null)}
          />
        )}
      </AnimatePresence>

      {/* Save toast */}
      <AnimatePresence>
        {savedMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-40 rounded-full px-5 py-3 text-sm font-bold shadow-lg"
            style={{ backgroundColor: "#efc1d0", color: "#1d1418" }}
            data-ocid="journal.success_state"
          >
            Entry saved locally ✓
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="mx-auto max-w-[640px] px-5 pt-8 pb-12">
        {/* Hero */}
        <header className="mb-5">
          <p
            className="text-[13px] font-extrabold tracking-[1.5px] uppercase mb-2"
            style={{ color: "#d9a6b7" }}
          >
            Mirror Within
          </p>
          <h1
            className="text-[31px] leading-[38px] font-extrabold mb-3 font-display"
            style={{ color: "#fff7fa" }}
          >
            A self-inquiry app for facing your real self.
          </h1>
          <p
            className="text-[15px] leading-[23px]"
            style={{ color: "#d6c5cb" }}
          >
            Guided questions, private journaling, pattern-spotting, and crisis
            support prompts built with transparency.
          </p>
        </header>

        {/* Nav */}
        {screen !== "onboarding" && (
          <Nav
            current={screen}
            onNav={(s) => {
              if (s === "breathe") {
                navigateToBreathe();
              } else {
                setScreen(s);
              }
            }}
          />
        )}

        {/* Screens */}
        <main>
          <AnimatePresence mode="wait">
            {screen === "onboarding" && (
              <motion.div
                key="onboarding"
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <OnboardingScreen onBegin={() => setScreen("checkin")} />
              </motion.div>
            )}
            {screen === "checkin" && (
              <motion.div
                key="checkin"
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <CheckinScreen
                  mood={mood}
                  reason={reason}
                  onMoodChange={handleMoodChange}
                  onReasonChange={handleReasonChange}
                  onNext={() => setScreen("intake")}
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
            {screen === "intake" && (
              <motion.div
                key="intake"
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <IntakeScreen
                  prompts={intakePrompts}
                  answers={answers}
                  onChange={updateField}
                  onNext={() => setScreen("shadow")}
                />
              </motion.div>
            )}
            {screen === "shadow" && (
              <motion.div
                key="shadow"
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <ShadowScreen
                  prompts={shadowPrompts}
                  answers={answers}
                  onChange={updateField}
                  onNext={() => setScreen("journal")}
                />
              </motion.div>
            )}
            {screen === "journal" && (
              <motion.div
                key="journal"
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <JournalScreen
                  journalEntries={journalEntries}
                  onSave={saveEntry}
                  onViewInsights={() => setScreen("insights")}
                  onDeleteAll={() => setShowDeleteModal(true)}
                  onViewEntry={setSelectedEntry}
                />
              </motion.div>
            )}
            {screen === "insights" && (
              <motion.div
                key="insights"
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <InsightsScreen
                  insights={insights}
                  crisisCount={crisisCount}
                  locationLabel={locationLabel}
                  onShareLocation={requestLocation}
                  onEndSession={clearSession}
                  journalEntries={journalEntries}
                />
              </motion.div>
            )}
            {screen === "resources" && (
              <motion.div
                key="resources"
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <ResourcesScreen onShareLocation={requestLocation} />
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
          <p className="text-xs" style={{ color: "#8d7d84" }}>
            © {currentYear}. Built with{" "}
            <span style={{ color: "#d9a6b7" }}>♥</span> using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-80"
              style={{ color: "#d9a6b7" }}
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
