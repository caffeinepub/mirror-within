// ─── Mirror Analysis Logic ───────────────────────────────────────────────────
// All Mirror analysis constants and functions for the Book Journey app.

export const woundLabels: Record<string, string> = {
  abandonment: "Fear of abandonment",
  unworthiness: "Core unworthiness",
  overResponsibility: "Over-responsibility",
  selfSilencing: "Self-silencing",
  emotionalAvoidance: "Emotional avoidance",
  controlHypervigilance: "Control & hypervigilance",
  approvalAddiction: "Approval-seeking",
  fixerIdentity: "Fixer identity",
  chaosFamiliarity: "Chaos familiarity",
  intimacyFear: "Fear of intimacy",
};

// ─── Lenses By Stage ────────────────────────────────────────────────────────
export const lensesByStage = {
  surface: [
    {
      key: "cbt",
      title: "Cognitive Behavioral",
      subtitle: "Thought patterns & beliefs",
      promptTitle: "What thought was loudest?",
      prompt:
        "Notice the automatic thought that showed up. What were you telling yourself in that moment?",
    },
    {
      key: "attachment",
      title: "Attachment",
      subtitle: "Bonds & closeness",
      promptTitle: "Who does this connect to?",
      prompt:
        "Think about who this feeling connects to — past or present. What does closeness feel like for you?",
    },
    {
      key: "somatic",
      title: "Somatic",
      subtitle: "Body & sensation",
      promptTitle: "Where do you feel this?",
      prompt:
        "Your body holds what your mind skips. Where do you feel this in your chest, throat, stomach, or limbs?",
    },
    {
      key: "selfcompassion",
      title: "Self-Compassion",
      subtitle: "Kindness toward self",
      promptTitle: "What would you say to a friend?",
      prompt:
        "If a friend were carrying what you're carrying right now, what would you want them to hear?",
    },
    {
      key: "mindfulness",
      title: "Mindfulness",
      subtitle: "Present-moment awareness",
      promptTitle: "What is here right now?",
      prompt:
        "Without fixing or analyzing — what is simply present for you right now?",
    },
    {
      key: "act",
      title: "ACT",
      subtitle: "Values & acceptance",
      promptTitle: "What does this cost you?",
      prompt:
        "When you avoid this feeling, what do you give up? What value are you drifting away from?",
    },
  ],
  attacked: [
    {
      key: "shadow",
      title: "Shadow Work",
      subtitle: "Hidden or denied self",
      promptTitle: "What are you not admitting?",
      prompt:
        "The shadow holds what we've been taught to deny. What part of this reaction embarrasses or shames you most?",
    },
    {
      key: "ouroboros",
      title: "Ouroboros",
      subtitle: "Repeating cycles",
      promptTitle: "What is the loop?",
      prompt:
        "You've been here before. What is the pattern that keeps circling back, even when you think you've left it?",
    },
    {
      key: "stoic",
      title: "Stoic",
      subtitle: "Control & acceptance",
      promptTitle: "What is actually in your control?",
      prompt:
        "List what is yours to act on — and what you're spending energy trying to control that was never yours.",
    },
    {
      key: "narrative",
      title: "Narrative",
      subtitle: "The story you tell",
      promptTitle: "What story are you telling?",
      prompt:
        "Every reaction has a story behind it. What narrative are you living inside right now — and who wrote it?",
    },
    {
      key: "duality",
      title: "Duality",
      subtitle: "Contradictions within",
      promptTitle: "What two truths are in conflict?",
      prompt:
        "Where do you hold two contradictory truths at once? What are you saying with your actions versus your words?",
    },
    {
      key: "socialmirror",
      title: "Social Mirror",
      subtitle: "Approval & validation",
      promptTitle: "Whose eyes are you seeing through?",
      prompt:
        "Whose voice is measuring you right now? What would you do if their opinion simply couldn't touch you?",
    },
  ],
  deep: [
    {
      key: "jung",
      title: "Jungian",
      subtitle: "Archetypes & the unconscious",
      promptTitle: "What archetype is activated?",
      prompt:
        "What ancient pattern is playing out? The wounded child, the shadow self, the inner critic — which voice just spoke?",
    },
    {
      key: "existential",
      title: "Existential",
      subtitle: "Meaning & mortality",
      promptTitle: "What does this mean about your life?",
      prompt:
        "Strip the situation down to its core. What does this moment reveal about what you value, fear, or avoid?",
    },
  ],
};

// ─── Research Question Bank ─────────────────────────────────────────────────
export const researchQuestionBank: Record<string, string[]> = {
  cbt: [
    "What thought was running loudest in that moment?",
    "If a friend had this thought, what would you say to them?",
    "What evidence actually supports this belief — and what contradicts it?",
    "What is the most accurate, honest version of what happened?",
    "What would change if you replaced the thought with something more balanced?",
  ],
  attachment: [
    "Who does this person remind you of from earlier in your life?",
    "What does closeness feel like in your body?",
    "When did you first learn to manage your needs alone?",
    "What would it mean if someone stayed without needing to earn it?",
    "Where does the fear of being 'too much' come from?",
  ],
  selfcompassion: [
    "If someone you loved were in your position, what would you want them to hear?",
    "What would it feel like to hold this with gentleness instead of judgment?",
    "Can you name three things this situation is not your fault?",
    "What would you say to yourself right now if you weren't afraid of being soft?",
  ],
  act: [
    "What is the feeling asking you to avoid?",
    "What would you do differently if the feeling didn't have veto power?",
    "Which of your values is this situation pulling you away from?",
    "What does full acceptance of this feeling — without needing to fix it — look like?",
    "What action is aligned with who you want to be, regardless of the feeling?",
  ],
  mindfulness: [
    "What do you notice in your body right now without trying to change it?",
    "What is present — as sensation, not story?",
    "If you stayed with this for 60 more seconds without reacting, what would shift?",
    "Where does your attention keep returning?",
  ],
  shadow: [
    "What is the part of this you're most embarrassed to admit?",
    "What are you denying about yourself that this situation is reflecting back?",
    "What would you judge harshly in someone else that you are also doing?",
    "What old persona are you protecting here?",
    "What is the wound underneath the behavior?",
  ],
  ouroboros: [
    "How many times have you been in this same position?",
    "What do you have to believe about yourself for this loop to keep running?",
    "What would it cost you to break this cycle completely?",
    "What is this pattern protecting you from?",
    "When did this cycle begin — and what was the original wound?",
  ],
  stoic: [
    "What in this situation is actually within your control?",
    "What are you trying to manage that was never yours to carry?",
    "What would a version of you who was completely at peace with the outcome do?",
    "What virtue — courage, honesty, patience — is being asked of you right now?",
  ],
  existential: [
    "What does this situation reveal about what you actually value?",
    "If your life were a story, what chapter is this?",
    "What would you regret not doing if this were your last year?",
    "What meaning are you making from this — and is it the only meaning possible?",
  ],
  socialmirror: [
    "Whose approval are you still working to earn?",
    "What version of yourself do you hide to stay acceptable?",
    "What honest thing have you held back to keep the peace?",
    "What would you do if you knew their opinion couldn't define you?",
  ],
  narrative: [
    "What is the story you've been living inside — and who wrote it?",
    "What would change if you became the author of this chapter instead of the protagonist reacting to it?",
    "What alternative story could you tell about the same events?",
    "What story about yourself are you most afraid to challenge?",
  ],
  duality: [
    "Where do you hold two contradictory truths at once?",
    "What are you saying with your words versus your actions?",
    "What do you want and also fear in equal measure?",
    "What would integration — holding both sides — look like for you?",
  ],
  somatic: [
    "Where in your body does this live — and what is it trying to say?",
    "What happens in your throat, chest, or stomach when you sit with this?",
    "If the sensation in your body had words, what would it say?",
    "What does your body do when you finally feel safe?",
  ],
  jung: [
    "What inner figure — child, shadow, hero — is speaking loudest right now?",
    "What ancient pattern is playing out through this situation?",
    "What does your inner critic sound like — and whose voice is that originally?",
    "What part of yourself have you exiled that this situation is asking you to reclaim?",
  ],
};

// ─── Phrase Signals ─────────────────────────────────────────────────────────
export const phraseSignals: Record<
  string,
  { phrase: string; weight: number }[]
> = {
  abandonment: [
    { phrase: "they always leave", weight: 3 },
    { phrase: "i knew they would leave", weight: 3 },
    { phrase: "i get replaced", weight: 3 },
    { phrase: "not chosen", weight: 2 },
    { phrase: "left behind", weight: 2 },
    { phrase: "forgot about me", weight: 2 },
    { phrase: "they pulled away", weight: 2 },
    { phrase: "i was too much", weight: 3 },
  ],
  unworthiness: [
    { phrase: "not good enough", weight: 3 },
    { phrase: "not enough", weight: 2 },
    { phrase: "there is something wrong with me", weight: 3 },
    { phrase: "i am the problem", weight: 3 },
    { phrase: "i feel worthless", weight: 3 },
    { phrase: "i ruin everything", weight: 3 },
  ],
  overResponsibility: [
    { phrase: "i have to fix", weight: 3 },
    { phrase: "it is on me", weight: 3 },
    { phrase: "no one else will", weight: 2 },
    { phrase: "if i do not do it", weight: 2 },
    { phrase: "i have to hold everything together", weight: 3 },
    { phrase: "it falls on me", weight: 2 },
  ],
  selfSilencing: [
    { phrase: "i did not say anything", weight: 2 },
    { phrase: "i just kept quiet", weight: 2 },
    { phrase: "i let it go", weight: 2 },
    { phrase: "it is not worth arguing", weight: 2 },
    { phrase: "i stayed silent", weight: 2 },
    { phrase: "i swallowed it", weight: 3 },
  ],
  emotionalAvoidance: [
    { phrase: "i do not want to think about it", weight: 2 },
    { phrase: "i shut down", weight: 3 },
    { phrase: "i went numb", weight: 3 },
    { phrase: "i distracted myself", weight: 2 },
    { phrase: "i avoided it", weight: 2 },
    { phrase: "i pretended i did not care", weight: 3 },
  ],
  controlHypervigilance: [
    { phrase: "i need to know", weight: 2 },
    { phrase: "i need control", weight: 3 },
    { phrase: "i kept checking", weight: 2 },
    { phrase: "i could not relax", weight: 2 },
    { phrase: "waiting for something bad", weight: 3 },
    { phrase: "i was on edge", weight: 2 },
  ],
  approvalAddiction: [
    { phrase: "i just want them to be happy", weight: 2 },
    { phrase: "i did not want to upset them", weight: 2 },
    { phrase: "i wanted their approval", weight: 3 },
    { phrase: "i wanted them to choose me", weight: 3 },
    { phrase: "i kept proving myself", weight: 3 },
    { phrase: "i did what they wanted", weight: 2 },
  ],
  fixerIdentity: [
    { phrase: "i can help them", weight: 2 },
    { phrase: "i can save them", weight: 3 },
    { phrase: "they need me", weight: 3 },
    { phrase: "i wanted to heal them", weight: 3 },
    { phrase: "i can change them", weight: 2 },
    { phrase: "i kept trying to help", weight: 2 },
  ],
  chaosFamiliarity: [
    { phrase: "peace feels weird", weight: 3 },
    { phrase: "i am used to chaos", weight: 3 },
    { phrase: "calm feels wrong", weight: 3 },
    { phrase: "i kept waiting for the other shoe to drop", weight: 2 },
    { phrase: "drama feels normal", weight: 3 },
    { phrase: "when things are calm i get restless", weight: 3 },
  ],
  intimacyFear: [
    { phrase: "i want closeness but", weight: 3 },
    { phrase: "i pulled away", weight: 2 },
    { phrase: "i do not want them too close", weight: 3 },
    { phrase: "being known scares me", weight: 3 },
    { phrase: "i wanted them but kept distance", weight: 3 },
    { phrase: "i do not know how to let someone in", weight: 3 },
  ],
};

// ─── Intensity Signals ──────────────────────────────────────────────────────
export const intensitySignals = {
  strong: [
    "always",
    "never",
    "every time",
    "constantly",
    "completely",
    "literally",
    "all i do",
    "the whole time",
  ],
  medium: [
    "really",
    "so much",
    "too much",
    "again",
    "still",
    "kept",
    "super",
    "deeply",
  ],
  pattern: [
    "i always",
    "i keep",
    "every time",
    "again and again",
    "same thing",
    "once again",
  ],
};

// ─── Contradiction Signals ──────────────────────────────────────────────────
export const contradictionSignals: {
  left: string[];
  right: string[];
  label: string;
  weight: number;
}[] = [
  {
    left: [
      "i do not care",
      "i dont care",
      "it does not matter",
      "it doesnt matter",
    ],
    right: [
      "it hurt",
      "i was hurt",
      "it still hurts",
      "i cried",
      "i was upset",
    ],
    label: "avoidanceAttachmentGap",
    weight: 4,
  },
  {
    left: ["i deserve better", "i know better", "i knew better"],
    right: ["i stayed", "i went back", "i still stayed", "i still went back"],
    label: "awarenessBehaviorGap",
    weight: 5,
  },
  {
    left: ["i want closeness", "i want love", "i want intimacy"],
    right: ["i pulled away", "i shut down", "i pushed them away"],
    label: "intimacyAmbivalence",
    weight: 5,
  },
  {
    left: ["i wanted peace", "i wanted calm"],
    right: ["i started an argument", "i picked a fight", "i stirred it up"],
    label: "chaosAttachment",
    weight: 5,
  },
];

// ─── Wound Question Bank ────────────────────────────────────────────────────
const woundQuestionBank: Record<string, string[]> = {
  abandonment: [
    "What would it mean if someone stayed, without you having to earn it?",
    "Where in your body do you feel the anticipation of being left?",
    "When did you first learn that people leave?",
    "What would you do differently if you trusted someone would still be there?",
  ],
  unworthiness: [
    "What evidence have you been collecting to prove you are not enough?",
    "Whose voice does that critical thought sound like?",
    "If the shame had a face, whose would it be?",
    "What would you have to believe about yourself to act differently?",
  ],
  overResponsibility: [
    "What happens in your body when you try to put something down?",
    "Who taught you that you were responsible for everyone's feelings?",
    "What would fall apart if you stopped holding it together?",
    "What are you afraid will happen if you rest?",
  ],
  selfSilencing: [
    "What did you want to say that you did not?",
    "What do you expect to happen if you speak plainly?",
    "When did silence become safer than speaking?",
    "What would you say if you knew it would be heard?",
  ],
  emotionalAvoidance: [
    "What feeling are you most afraid to let in fully?",
    "What do you think you would find if you stopped distracting yourself?",
    "What does the numbness protect you from?",
    "What would you have to face if you stopped running?",
  ],
  controlHypervigilance: [
    "What are you scanning for right now?",
    "What is the worst thing that could happen if you let go of control?",
    "When did safety start to depend on knowing what comes next?",
    "What do you lose when you stop monitoring?",
  ],
  approvalAddiction: [
    "Whose approval are you still trying to earn?",
    "What version of yourself do you hide to stay acceptable?",
    "What would you do if you knew their opinion could not touch you?",
    "What honest thing have you not said to keep the peace?",
  ],
  fixerIdentity: [
    "What are you afraid would happen to your relationships if you stopped fixing?",
    "What do you get from being the one who holds things together?",
    "When does helping someone feel like it is really about you?",
    "What would you need to feel valuable if you were not helping?",
  ],
  chaosFamiliarity: [
    "What does peace feel like in your body?",
    "When calm arrives, what do you start waiting for?",
    "What does intensity give you that peace does not?",
    "What would it mean to trust that a calm moment is not a trick?",
  ],
  intimacyFear: [
    "What is the risk of someone knowing you fully?",
    "What have you kept hidden from someone close to you, and why?",
    "When did closeness start to feel dangerous?",
    "What would you need to feel safe enough to let someone in?",
  ],
};

const stageBank = {
  surface: [
    "What is the first thing that comes to mind when you sit with this?",
    "Where do you feel this in your body?",
    "What are you not saying out loud about this?",
    "What would change if someone truly understood this?",
  ],
  pattern: [
    "Have you felt this way before?",
    "What is the oldest version of this feeling you can remember?",
    "What keeps pulling you back into this pattern?",
    "When you notice this happening, what do you usually do?",
  ],
  confrontation: [
    "What is the hardest part of this to admit?",
    "What would have to change inside you for this to shift?",
    "What are you protecting by holding this pattern?",
    "What does this pattern cost you?",
  ],
  identity: [
    "Who would you be without this wound?",
    "What story about yourself are you most attached to?",
    "If this wound healed, what would you have to give up?",
    "What does carrying this wound let you avoid?",
  ],
};

// ─── analyzeEntry ────────────────────────────────────────────────────────────
export type MirrorAnalysis = {
  id: string;
  storyName: string;
  entryPoint: string;
  lens: string;
  rawLensKey: string;
  entry: string;
  emotions: string[];
  triggers: string[];
  beliefs: string[];
  coping: string[];
  phraseHits: { wound: string; phrase: string; weight: number }[];
  intensityHits: { strong: number; medium: number; pattern: number };
  contradictionHits: { label: string; weight: number }[];
  woundScores: Record<string, number>;
  primaryWound: string;
  secondaryWound: string | null;
  mirrorVariant: number;
  mirrorMode: string;
  loopInterruption: string;
  timestamp: string;
};

export function analyzeEntry(
  entry: string,
  lensKey: string,
  entryPoint: string,
  storyName: string,
): MirrorAnalysis {
  const text = (entry || "").toLowerCase();

  // ── Emotion detection ──
  const emotionMap: Record<string, string[]> = {
    fear: [
      "afraid",
      "scared",
      "terrified",
      "anxious",
      "nervous",
      "dread",
      "panic",
      "fear",
      "worried",
      "on edge",
      "unsafe",
    ],
    anger: [
      "angry",
      "furious",
      "rage",
      "mad",
      "frustrated",
      "bitter",
      "resentful",
      "annoyed",
      "livid",
      "outraged",
    ],
    shame: [
      "ashamed",
      "shame",
      "embarrassed",
      "humiliated",
      "worthless",
      "disgusting",
      "pathetic",
      "failure",
      "disgrace",
    ],
    sadness: [
      "sad",
      "depressed",
      "grief",
      "heartbroken",
      "lonely",
      "empty",
      "hopeless",
      "crying",
      "tearful",
      "devastated",
      "lost",
    ],
    rejection: [
      "rejected",
      "unwanted",
      "excluded",
      "left out",
      "not chosen",
      "abandoned",
      "pushed away",
      "replaced",
      "invisible",
    ],
    control: [
      "control",
      "controlling",
      "need to know",
      "can not trust",
      "checking",
      "monitoring",
      "watching",
      "planning",
      "overthinking",
    ],
  };

  // ── Trigger detection ──
  const triggerMap: Record<string, string[]> = {
    family: [
      "mom",
      "dad",
      "parent",
      "sister",
      "brother",
      "family",
      "childhood",
      "growing up",
      "raised",
      "home",
      "father",
      "mother",
    ],
    relationship: [
      "partner",
      "boyfriend",
      "girlfriend",
      "husband",
      "wife",
      "friend",
      "relationship",
      "dating",
      "they",
      "them",
      "love",
      "ex",
    ],
    work: [
      "boss",
      "work",
      "job",
      "career",
      "colleague",
      "coworker",
      "fired",
      "promotion",
      "office",
      "professional",
    ],
    selfImage: [
      "mirror",
      "body",
      "fat",
      "ugly",
      "appearance",
      "looks",
      "weight",
      "beauty",
      "attractive",
      "image",
    ],
    money: [
      "money",
      "broke",
      "debt",
      "bills",
      "afford",
      "financial",
      "poor",
      "rich",
      "salary",
      "income",
    ],
    health: [
      "sick",
      "illness",
      "pain",
      "body",
      "hospital",
      "diagnosis",
      "mental health",
      "therapy",
      "doctor",
      "chronic",
    ],
  };

  // ── Belief detection ──
  const beliefMap: Record<string, string[]> = {
    abandonment: [
      "they always leave",
      "no one stays",
      "i get left",
      "people leave me",
      "i push everyone away",
      "i end up alone",
    ],
    unworthiness: [
      "i am not enough",
      "i do not deserve",
      "i am the problem",
      "something is wrong with me",
      "i ruin things",
      "i am worthless",
    ],
    overResponsibility: [
      "i have to fix",
      "it is my job",
      "no one else will do it",
      "i have to handle",
      "i have to carry",
      "it is on me",
    ],
    mistrust: [
      "i can not trust",
      "people always betray",
      "no one is reliable",
      "everyone lies",
      "they will hurt me",
      "trust is dangerous",
    ],
    selfSilencing: [
      "i should not say",
      "it is not worth it",
      "they will not listen",
      "better to stay quiet",
      "i keep it inside",
      "no one cares",
    ],
  };

  // ── Coping detection ──
  const copingMap: Record<string, string[]> = {
    avoidance: [
      "avoid",
      "distract",
      "ignore",
      "numb",
      "shut down",
      "escape",
      "pretend",
      "disappear",
      "hide",
      "not think about",
    ],
    caretaking: [
      "take care of",
      "fix for them",
      "help them",
      "rescue",
      "save them",
      "heal them",
      "do for them",
      "make it better for",
    ],
    peoplePleasing: [
      "make them happy",
      "keep peace",
      "what they want",
      "not upset them",
      "please them",
      "agree with",
      "go along with",
      "say yes",
    ],
    rumination: [
      "keep thinking",
      "cannot stop thinking",
      "replay",
      "obsess",
      "what if",
      "go over it again",
      "circular thoughts",
      "cannot let go",
    ],
    confrontation: [
      "confront",
      "called them out",
      "said it",
      "pushed back",
      "argued",
      "stood my ground",
      "told them off",
      "demanded",
    ],
  };

  function detect(map: Record<string, string[]>): string[] {
    return Object.entries(map)
      .filter(([, words]) => words.some((w) => text.includes(w)))
      .map(([label]) => label);
  }

  const emotions = detect(emotionMap);
  const triggers = detect(triggerMap);
  const beliefs = detect(beliefMap);
  const coping = detect(copingMap);

  // ── Phrase hits ──
  const phraseHits: { wound: string; phrase: string; weight: number }[] = [];
  for (const [wound, signals] of Object.entries(phraseSignals)) {
    for (const sig of signals) {
      if (text.includes(sig.phrase)) {
        phraseHits.push({ wound, phrase: sig.phrase, weight: sig.weight });
      }
    }
  }

  // ── Intensity hits ──
  const intensityHits = { strong: 0, medium: 0, pattern: 0 };
  for (const word of intensitySignals.strong) {
    if (text.includes(word)) intensityHits.strong += 1;
  }
  for (const word of intensitySignals.medium) {
    if (text.includes(word)) intensityHits.medium += 1;
  }
  for (const word of intensitySignals.pattern) {
    if (text.includes(word)) intensityHits.pattern += 1;
  }

  // ── Contradiction hits ──
  const contradictionHits: { label: string; weight: number }[] = [];
  for (const sig of contradictionSignals) {
    const hasLeft = sig.left.some((l) => text.includes(l));
    const hasRight = sig.right.some((r) => text.includes(r));
    if (hasLeft && hasRight) {
      contradictionHits.push({ label: sig.label, weight: sig.weight });
    }
  }

  // ── Wound scoring ──
  const woundScores: Record<string, number> = {
    abandonment: 0,
    unworthiness: 0,
    overResponsibility: 0,
    selfSilencing: 0,
    emotionalAvoidance: 0,
    controlHypervigilance: 0,
    approvalAddiction: 0,
    fixerIdentity: 0,
    chaosFamiliarity: 0,
    intimacyFear: 0,
  };

  // Emotion scoring
  if (emotions.includes("rejection")) woundScores.abandonment += 3;
  if (emotions.includes("fear")) {
    woundScores.abandonment += 2;
    woundScores.controlHypervigilance += 1;
  }
  if (emotions.includes("shame")) woundScores.unworthiness += 3;
  if (emotions.includes("control")) woundScores.controlHypervigilance += 3;
  if (emotions.includes("anger")) {
    woundScores.selfSilencing += 1;
    woundScores.controlHypervigilance += 1;
  }
  if (emotions.includes("sadness")) {
    woundScores.abandonment += 1;
    woundScores.unworthiness += 1;
  }

  // Trigger scoring
  if (triggers.includes("family") || triggers.includes("relationship")) {
    woundScores.abandonment += 2;
    woundScores.intimacyFear += 1;
    woundScores.overResponsibility += 1;
    woundScores.selfSilencing += 1;
    woundScores.chaosFamiliarity += 1;
    woundScores.approvalAddiction += 1;
  }

  // Belief scoring
  if (beliefs.includes("abandonment")) woundScores.abandonment += 3;
  if (beliefs.includes("unworthiness")) woundScores.unworthiness += 3;
  if (beliefs.includes("overResponsibility")) {
    woundScores.overResponsibility += 3;
    woundScores.fixerIdentity += 2;
  }
  if (beliefs.includes("selfSilencing")) woundScores.selfSilencing += 3;
  if (beliefs.includes("mistrust")) {
    woundScores.intimacyFear += 2;
    woundScores.controlHypervigilance += 2;
  }

  // Coping scoring
  if (coping.includes("avoidance")) {
    woundScores.emotionalAvoidance += 3;
    woundScores.intimacyFear += 1;
  }
  if (coping.includes("caretaking")) {
    woundScores.fixerIdentity += 3;
    woundScores.overResponsibility += 2;
  }
  if (coping.includes("peoplePleasing")) {
    woundScores.approvalAddiction += 3;
    woundScores.selfSilencing += 2;
  }
  if (coping.includes("rumination")) {
    woundScores.controlHypervigilance += 2;
    woundScores.chaosFamiliarity += 1;
  }

  // Phrase hits
  for (const hit of phraseHits) {
    woundScores[hit.wound] = (woundScores[hit.wound] || 0) + hit.weight;
  }

  // Intensity boost
  const intensityBoost =
    intensityHits.strong * 2 +
    intensityHits.medium * 1 +
    intensityHits.pattern * 1.5;
  const topWound = Object.entries(woundScores).sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0];
  if (topWound) woundScores[topWound] += intensityBoost;

  // Contradiction hits
  for (const hit of contradictionHits) {
    if (hit.label === "avoidanceAttachmentGap") {
      woundScores.emotionalAvoidance += hit.weight;
      woundScores.abandonment += 2;
    }
    if (hit.label === "awarenessBehaviorGap") {
      woundScores.unworthiness += 2;
      woundScores.chaosFamiliarity += hit.weight;
    }
    if (hit.label === "intimacyAmbivalence") {
      woundScores.intimacyFear += hit.weight;
      woundScores.abandonment += 2;
    }
    if (hit.label === "chaosAttachment") {
      woundScores.chaosFamiliarity += hit.weight;
      woundScores.controlHypervigilance += 2;
    }
  }

  // Lens boosts
  if (lensKey === "shadow") woundScores.unworthiness += 1;
  if (lensKey === "ouroboros") woundScores.chaosFamiliarity += 2;
  if (lensKey === "attachment") woundScores.abandonment += 1;
  if (lensKey === "act") woundScores.emotionalAvoidance += 1;
  if (lensKey === "stoic") woundScores.controlHypervigilance += 1;
  if (lensKey === "socialmirror") woundScores.approvalAddiction += 1;

  // Sort and derive wounds
  const sorted = Object.entries(woundScores).sort((a, b) => b[1] - a[1]);
  const primaryWound = sorted[0]?.[0] ?? "unworthiness";
  const secondaryWound =
    sorted[1]?.[1] && sorted[1][1] > 0 ? sorted[1][0] : null;

  const mirrorVariant = Math.floor(Date.now() / 1000) % 3;
  const mirrorMode = buildMirror(primaryWound, secondaryWound, mirrorVariant);
  const loopInterruption = buildInterruption(primaryWound);

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    storyName: storyName || "Unnamed story",
    entryPoint: entryPoint || "surface",
    lens: lensKey,
    rawLensKey: lensKey,
    entry,
    emotions,
    triggers,
    beliefs,
    coping,
    phraseHits,
    intensityHits,
    contradictionHits,
    woundScores,
    primaryWound,
    secondaryWound,
    mirrorVariant,
    mirrorMode,
    loopInterruption,
    timestamp: new Date().toISOString(),
  };
}

// ─── buildMirror ─────────────────────────────────────────────────────────────
export function buildMirror(
  primary: string,
  secondary: string | null,
  variant: number,
): string {
  const mirrors: Record<string, string[]> = {
    abandonment: [
      "You do not only fear being left. You fear being left after giving everything.",
      "A part of you keeps bracing for absence before anyone has fully gone.",
      "You keep scanning for signs of leaving, and that scanning becomes its own pain.",
    ],
    unworthiness: [
      "A part of you keeps asking pain to prove what you already fear about your worth.",
      "You are reading this moment like evidence against yourself.",
      "Shame keeps trying to turn one hard moment into a verdict on who you are.",
    ],
    overResponsibility: [
      "You keep stepping in like everything will collapse without you, then wonder why you are exhausted.",
      "You learned to carry too much, and now your body treats burden like duty.",
      "You keep confusing being responsible with being required to hold everyone together.",
    ],
    selfSilencing: [
      "You keep swallowing the truth to keep the peace, but the swallowed truth is still shaping your life.",
      "You mute yourself early, then live inside the resentment later.",
      "Silence has become a strategy, but it keeps costing you your own clarity.",
    ],
    emotionalAvoidance: [
      "You are not only avoiding the feeling. You are avoiding what the feeling might force you to admit.",
      "Numbing may look like relief, but it also keeps the truth out of reach.",
      "Avoidance is protecting you from the feeling and the decision hidden behind it.",
    ],
    controlHypervigilance: [
      "Your nervous system keeps scanning for what could go wrong, then mistakes vigilance for safety.",
      "You keep tightening around uncertainty as if control could prevent pain.",
      "Hypervigilance has learned to masquerade as preparedness.",
    ],
    approvalAddiction: [
      "You keep offering a version of yourself that is easy to keep, then ache when nobody truly sees you.",
      "Approval keeps pulling you away from honesty one small compromise at a time.",
      "You may be shaping yourself for acceptance and then grieving the loss of yourself afterward.",
    ],
    fixerIdentity: [
      "You keep trying to be the one who changes them, and call it love when it is really over-functioning.",
      "Rescuing gives you a role, but it also keeps you tied to pain that is not yours.",
      "You may feel most valuable when needed, even when that need drains you.",
    ],
    chaosFamiliarity: [
      "Peace may not feel safe yet, because chaos has been the rhythm your body learned to recognize.",
      "A calm moment can feel suspicious when your system is used to storms.",
      "Part of you may trust intensity more than peace because intensity feels familiar.",
    ],
    intimacyFear: [
      "You may want closeness deeply, but part of you still treats being known like a risk.",
      "You move toward connection and brace against exposure at the same time.",
      "Closeness may feel good until it starts to feel revealing.",
    ],
  };

  const variants = mirrors[primary] ?? mirrors.unworthiness;
  let result = variants[variant % variants.length];

  if (secondary && woundLabels[secondary]) {
    result += ` Beneath that, ${woundLabels[secondary].toLowerCase()} may also be shaping the story.`;
  }

  return result;
}

// ─── buildInterruption ───────────────────────────────────────────────────────
export function buildInterruption(primary: string): string {
  const interruptions: Record<string, string> = {
    abandonment:
      "Before chasing, pause and ask one direct question instead of assuming the worst.",
    unworthiness:
      "Replace the first self-attack with one sentence that is honest but not cruel.",
    overResponsibility:
      "Name what is yours to carry and leave one piece of someone else's burden with them.",
    selfSilencing:
      "Say one preference plainly before your body turns it into resentment.",
    emotionalAvoidance:
      "Name the feeling out loud and stay with it for 90 seconds before reacting.",
    controlHypervigilance:
      "Choose one small action you control and release one outcome you do not.",
    approvalAddiction:
      "Do one honest thing that might not earn approval but does protect your self-respect.",
    fixerIdentity:
      "Do not rescue immediately. Let the other person hold their own discomfort for 10 minutes.",
    chaosFamiliarity:
      "When things feel calm, do not create motion. Stay still long enough to notice that calm is not danger.",
    intimacyFear:
      "Share one true sentence instead of performing the version of you that feels safest.",
  };
  return interruptions[primary] ?? interruptions.unworthiness;
}

// ─── getConfidence ────────────────────────────────────────────────────────────
export function getConfidence(woundScores: Record<string, number>): {
  level: "high" | "medium" | "low";
  label: string;
  maxScore: number;
  evidenceCount: number;
} {
  const scores = Object.values(woundScores);
  const maxScore = Math.max(...scores, 0);
  const evidenceCount = scores.filter((s) => s > 0).length;
  let level: "high" | "medium" | "low" = "low";
  if (maxScore >= 12 || evidenceCount >= 7) level = "high";
  else if (maxScore >= 7 || evidenceCount >= 4) level = "medium";
  const label =
    level === "high" ? "High" : level === "medium" ? "Medium" : "Emerging";
  return { level, label, maxScore, evidenceCount };
}

// ─── getAdaptiveQuestions ────────────────────────────────────────────────────
export function getAdaptiveQuestions(
  lensKey: string,
  primaryWound: string | null,
  historyLength: number,
): string[] {
  let stage: keyof typeof stageBank = "surface";
  if (historyLength >= 6) stage = "identity";
  else if (historyLength >= 4) stage = "confrontation";
  else if (historyLength >= 2) stage = "pattern";

  const stageQuestions = stageBank[stage] ?? stageBank.surface;
  const lensQuestions = researchQuestionBank[lensKey] ?? [];
  const woundQuestions = primaryWound
    ? (woundQuestionBank[primaryWound] ?? [])
    : [];

  const combined = [...stageQuestions, ...lensQuestions, ...woundQuestions];
  const unique = Array.from(new Set(combined));

  // Filter recently used
  let recent: string[] = [];
  try {
    recent = JSON.parse(localStorage.getItem("mirrorRecentQuestions") || "[]");
  } catch {
    recent = [];
  }

  const filtered = unique.filter((q) => !recent.includes(q));
  const pool = filtered.length >= 3 ? filtered : unique;

  // Pick 3-4
  const selected: string[] = [];
  const count = Math.min(pool.length, 4);
  const startIndex = historyLength % Math.max(pool.length - count, 1);
  for (let i = 0; i < count; i++) {
    selected.push(pool[(startIndex + i) % pool.length]);
  }

  // Save recently used
  try {
    const nextRecent = [...recent, ...selected].slice(-20);
    localStorage.setItem("mirrorRecentQuestions", JSON.stringify(nextRecent));
  } catch {
    // ignore
  }

  return selected;
}

// ─── saveMirrorEntry ─────────────────────────────────────────────────────────
export function saveMirrorEntry(entry: MirrorAnalysis): void {
  try {
    const existing: MirrorAnalysis[] = JSON.parse(
      localStorage.getItem("mirrorEntries") || "[]",
    );
    existing.push(entry);
    localStorage.setItem("mirrorEntries", JSON.stringify(existing));
  } catch {
    // ignore
  }
}

// ─── loadMirrorHistory ────────────────────────────────────────────────────────
export function loadMirrorHistory(): MirrorAnalysis[] {
  try {
    return JSON.parse(localStorage.getItem("mirrorEntries") || "[]");
  } catch {
    return [];
  }
}

// ─── getMirrorInsights ────────────────────────────────────────────────────────
export function getMirrorInsights(entries: MirrorAnalysis[]) {
  if (!entries.length) return null;

  // Wound trends
  const woundCounts: Record<string, number> = {};
  for (const e of entries) {
    woundCounts[e.primaryWound] = (woundCounts[e.primaryWound] || 0) + 1;
    if (e.secondaryWound) {
      woundCounts[e.secondaryWound] =
        (woundCounts[e.secondaryWound] || 0) + 0.5;
    }
  }

  function patternLabel(count: number): string {
    if (count >= 5) return "Major pattern";
    if (count >= 3) return "Recurring pattern";
    if (count >= 2) return "Emerging pattern";
    return "Not enough history yet";
  }

  const sortedWounds = Object.entries(woundCounts).sort((a, b) => b[1] - a[1]);
  const topWound = sortedWounds[0]
    ? {
        wound: sortedWounds[0][0],
        score: sortedWounds[0][1],
        label: patternLabel(sortedWounds[0][1]),
      }
    : null;
  const secondaryWoundTrend = sortedWounds[1]
    ? {
        wound: sortedWounds[1][0],
        score: sortedWounds[1][1],
        label: patternLabel(sortedWounds[1][1]),
      }
    : null;

  // Emotion / trigger / belief / coping trends
  function topTag(key: keyof MirrorAnalysis): string | null {
    const counts: Record<string, number> = {};
    for (const e of entries) {
      const arr = e[key] as string[] | undefined;
      if (Array.isArray(arr)) {
        for (const tag of arr) {
          counts[tag] = (counts[tag] || 0) + 1;
        }
      }
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] ?? null;
  }

  const emotionTrend = topTag("emotions");
  const triggerTrend = topTag("triggers");
  const beliefTrend = topTag("beliefs");
  const copingTrend = topTag("coping");

  // Recent shift
  let recentShift = "";
  if (entries.length >= 2) {
    const recent = entries.slice(-3);
    const recentPrimary = recent[recent.length - 1]?.primaryWound;
    const prevPrimary = recent[0]?.primaryWound;
    if (recentPrimary === prevPrimary) {
      recentShift = `The pattern still circles around ${woundLabels[recentPrimary] || recentPrimary}.`;
    } else if (prevPrimary && recentPrimary) {
      recentShift = `There may be movement from ${woundLabels[prevPrimary] || prevPrimary} toward ${woundLabels[recentPrimary] || recentPrimary}.`;
    }
  }

  // Quiet inference
  let quietInference = "";
  if (topWound && topWound.score >= 3) {
    const w = topWound.wound;
    const inferences: Record<string, string> = {
      abandonment: "You may be bracing for endings before they arrive.",
      unworthiness:
        "You may be measuring your value by how hard situations feel.",
      overResponsibility:
        "You may be holding what was never only yours to hold.",
      selfSilencing: "You may be speaking less of your truth than you need to.",
      emotionalAvoidance:
        "You may be more familiar with avoiding feelings than feeling them.",
      controlHypervigilance:
        "You may be working harder to prevent pain than to process it.",
      approvalAddiction:
        "You may be editing yourself for others more than you realize.",
      fixerIdentity: "You may feel most useful when someone needs rescuing.",
      chaosFamiliarity:
        "Peace may still feel like something to be suspicious of.",
      intimacyFear:
        "Closeness may still feel risky in ways that are hard to name.",
    };
    quietInference = inferences[w] ?? "";
  }

  return {
    topWoundTrend: topWound,
    secondaryWoundTrend,
    emotionTrend,
    triggerTrend,
    beliefTrend,
    copingTrend,
    recentShift,
    quietInference,
    patternLabel,
  };
}
