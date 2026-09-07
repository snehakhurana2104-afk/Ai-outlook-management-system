/******************************************************************************
 * constants.js
 * AI Reply Module
 * Enterprise Constants
 ******************************************************************************/

import {
  Briefcase,
  Smile,
  FileText,
  MessageCircle,
  Zap,
  AlignJustify,
  Languages,
  PenSquare,
} from "lucide-react";

/* ==========================================================================
 * Default Tone
 * ========================================================================== */

export const DEFAULT_TONE = "professional";

/* ==========================================================================
 * Available AI Reply Tones
 * ========================================================================== */

export const TONES = [
  {
    id: "professional",
    label: "Professional",
    icon: Briefcase,
    color: "#2563EB",
    description:
      "Business-ready, polite and concise replies.",
  },

  {
    id: "friendly",
    label: "Friendly",
    icon: Smile,
    color: "#10B981",
    description:
      "Warm and conversational replies.",
  },

  {
    id: "formal",
    label: "Formal",
    icon: FileText,
    color: "#7C3AED",
    description:
      "Official and corporate communication.",
  },

  {
    id: "casual",
    label: "Casual",
    icon: MessageCircle,
    color: "#F59E0B",
    description:
      "Relaxed everyday communication.",
  },

  {
    id: "short",
    label: "Short",
    icon: Zap,
    color: "#EF4444",
    description:
      "Brief replies with minimal text.",
  },

  {
    id: "long",
    label: "Detailed",
    icon: AlignJustify,
    color: "#0EA5E9",
    description:
      "Detailed replies with complete explanations.",
  },

  {
    id: "rewrite",
    label: "Rewrite",
    icon: PenSquare,
    color: "#EC4899",
    description:
      "Rewrite the existing reply professionally.",
  },

  {
    id: "translate",
    label: "Translate",
    icon: Languages,
    color: "#14B8A6",
    description:
      "Translate reply into another language.",
  },
];
/* ==========================================================================
 * AI Prompt Templates
 * ========================================================================== */

export const AI_PROMPTS = {
  professional:
    "Generate a professional, business-ready email reply.",

  friendly:
    "Generate a friendly and approachable email reply.",

  formal:
    "Generate a formal corporate email response using official language.",

  casual:
    "Generate a casual and conversational reply while remaining respectful.",

  short:
    "Generate a short reply in under 50 words.",

  long:
    "Generate a detailed response with complete explanations.",

  rewrite:
    "Rewrite the existing email professionally without changing its meaning.",

  translate:
    "Translate the email reply into the selected language while preserving context.",
};

/* ==========================================================================
 * Tone Categories
 * ========================================================================== */

export const TONE_GROUPS = {
  business: [
    "professional",
    "formal",
  ],

  personal: [
    "friendly",
    "casual",
  ],

  utility: [
    "short",
    "long",
    "rewrite",
    "translate",
  ],
};

/* ==========================================================================
 * AI Limits
 * ========================================================================== */

export const AI_LIMITS = {
  minCharacters: 10,

  maxCharacters: 5000,

  maxWords: 1000,

  maxTokens: 2048,

  maxHistory: 20,
};

/* ==========================================================================
 * Reply Status
 * ========================================================================== */

export const REPLY_STATUS = {
  IDLE: "idle",

  GENERATING: "generating",

  SUCCESS: "success",

  ERROR: "error",

  COPYING: "copying",

  SENDING: "sending",
};

/* ==========================================================================
 * Default AI Configuration
 * ========================================================================== */

export const DEFAULT_AI_CONFIG = {
  tone: DEFAULT_TONE,

  autoSignature: true,

  grammarCheck: true,

  smartRewrite: true,

  autoTranslate: false,

  streaming: true,
};
/* ==========================================================================
 * UI Colors
 * ========================================================================== */

export const TONE_COLORS = {
  professional: "#2563EB",
  friendly: "#10B981",
  formal: "#7C3AED",
  casual: "#F59E0B",
  short: "#EF4444",
  long: "#0EA5E9",
  rewrite: "#EC4899",
  translate: "#14B8A6",
};

/* ==========================================================================
 * Badge Colors
 * ========================================================================== */

export const TONE_BADGES = {
  professional:
    "bg-blue-100 text-blue-700 border-blue-200",

  friendly:
    "bg-green-100 text-green-700 border-green-200",

  formal:
    "bg-violet-100 text-violet-700 border-violet-200",

  casual:
    "bg-amber-100 text-amber-700 border-amber-200",

  short:
    "bg-red-100 text-red-700 border-red-200",

  long:
    "bg-sky-100 text-sky-700 border-sky-200",

  rewrite:
    "bg-pink-100 text-pink-700 border-pink-200",

  translate:
    "bg-cyan-100 text-cyan-700 border-cyan-200",
};

/* ==========================================================================
 * Supported Languages
 * ========================================================================== */

export const SUPPORTED_LANGUAGES = [
  {
    code: "en",
    name: "English",
  },
  {
    code: "hi",
    name: "Hindi",
  },
  {
    code: "fr",
    name: "French",
  },
  {
    code: "de",
    name: "German",
  },
  {
    code: "es",
    name: "Spanish",
  },
  {
    code: "it",
    name: "Italian",
  },
  {
    code: "ja",
    name: "Japanese",
  },
  {
    code: "zh",
    name: "Chinese",
  },
];

/* ==========================================================================
 * Keyboard Shortcuts
 * ========================================================================== */

export const KEYBOARD_SHORTCUTS = {
  NEXT_TONE: "ArrowRight",

  PREVIOUS_TONE: "ArrowLeft",

  FIRST_TONE: "Home",

  LAST_TONE: "End",

  APPLY: "Enter",

  CANCEL: "Escape",
};

/* ==========================================================================
 * Animation Configuration
 * ========================================================================== */

export const ANIMATION = {
  duration: 200,

  easing: "ease-in-out",

  stagger: 75,
};

/* ==========================================================================
 * Enterprise Layout
 * ========================================================================== */

export const LAYOUT = {
  buttonHeight: "h-10",

  borderRadius: "rounded-xl",

  spacing: "gap-3",

  transition:
    "transition-all duration-200",
};
/* ==========================================================================
 * Tone Lookup Map
 * ========================================================================== */

export const TONE_MAP = Object.freeze(
  TONES.reduce((accumulator, tone) => {
    accumulator[tone.id] = tone;
    return accumulator;
  }, {})
);

/* ==========================================================================
 * Tone Labels
 * ========================================================================== */

export const TONE_LABELS = Object.freeze(
  TONES.reduce((accumulator, tone) => {
    accumulator[tone.id] = tone.label;
    return accumulator;
  }, {})
);

/* ==========================================================================
 * Tone Descriptions
 * ========================================================================== */

export const TONE_DESCRIPTIONS = Object.freeze(
  TONES.reduce((accumulator, tone) => {
    accumulator[tone.id] =
      tone.description;
    return accumulator;
  }, {})
);

/* ==========================================================================
 * Enterprise AI Registry
 * ========================================================================== */

export const AI_REPLY_CONFIG = Object.freeze({
  defaultTone: DEFAULT_TONE,

  tones: TONES,

  prompts: AI_PROMPTS,

  groups: TONE_GROUPS,

  colors: TONE_COLORS,

  badges: TONE_BADGES,

  languages:
    SUPPORTED_LANGUAGES,

  shortcuts:
    KEYBOARD_SHORTCUTS,

  limits: AI_LIMITS,

  animation: ANIMATION,

  layout: LAYOUT,

  defaults:
    DEFAULT_AI_CONFIG,

  status: REPLY_STATUS,
});

/* ==========================================================================
 * Enterprise Helper Functions
 * ========================================================================== */

export const getTone = (id) =>
  TONE_MAP[id] || TONE_MAP[DEFAULT_TONE];

export const getPrompt = (id) =>
  AI_PROMPTS[id] ||
  AI_PROMPTS[DEFAULT_TONE];

export const getToneColor = (id) =>
  TONE_COLORS[id] ||
  TONE_COLORS[DEFAULT_TONE];

export const getToneBadge = (id) =>
  TONE_BADGES[id] ||
  TONE_BADGES[DEFAULT_TONE];

export const getToneLabel = (id) =>
  TONE_LABELS[id] ||
  TONE_LABELS[DEFAULT_TONE];

export const getToneDescription = (id) =>
  TONE_DESCRIPTIONS[id] ||
  TONE_DESCRIPTIONS[DEFAULT_TONE];

/* ==========================================================================
 * Freeze Configuration
 * ========================================================================== */

Object.freeze(TONES);
Object.freeze(AI_PROMPTS);
Object.freeze(TONE_GROUPS);
Object.freeze(TONE_COLORS);
Object.freeze(TONE_BADGES);
Object.freeze(SUPPORTED_LANGUAGES);
Object.freeze(KEYBOARD_SHORTCUTS);
Object.freeze(AI_LIMITS);
Object.freeze(DEFAULT_AI_CONFIG);
Object.freeze(REPLY_STATUS);