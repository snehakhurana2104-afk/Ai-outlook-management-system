/******************************************************************************
 * AI Reply Module
 * index.js
 * Centralized Enterprise Exports
 ******************************************************************************/

/* ==========================================================================
 * Components
 * ========================================================================== */

export { default as ToneSelector } from "./ToneSelector";
export { default as ToneButton } from "./ToneButton";

/* ==========================================================================
 * Constants
 * ========================================================================== */

export {
  DEFAULT_TONE,
  TONES,
  AI_PROMPTS,
  TONE_GROUPS,
  AI_LIMITS,
  REPLY_STATUS,
  DEFAULT_AI_CONFIG,
  TONE_COLORS,
  TONE_BADGES,
  SUPPORTED_LANGUAGES,
  KEYBOARD_SHORTCUTS,
  ANIMATION,
  LAYOUT,
  TONE_MAP,
  TONE_LABELS,
  TONE_DESCRIPTIONS,
  AI_REPLY_CONFIG,
  getTone,
  getPrompt,
  getToneColor,
  getToneBadge,
  getToneLabel,
  getToneDescription,
} from "./constants";

/* ==========================================================================
 * Future Components
 * Uncomment as they are created
 * ========================================================================== */

// export { default as AIReplyBox } from "./AIReplyBox";
// export { default as AIReplyToolbar } from "./AIReplyToolbar";
// export { default as AIReplyEditor } from "./AIReplyEditor";
// export { default as AIReplyActions } from "./AIReplyActions";
// export { default as AIReplyPreview } from "./AIReplyPreview";
// export { default as AIReplyHistory } from "./AIReplyHistory";

/* ==========================================================================
 * Future Hooks
 * Uncomment when available
 * ========================================================================== */

// export { default as useAIReply } from "./hooks/useAIReply";

/* ==========================================================================
 * Module Metadata
 * ========================================================================== */

export const MODULE_NAME = "AI Reply";

export const MODULE_VERSION = "1.0.0";

export const MODULE_AUTHOR = "Enterprise Outlook AI";

export const MODULE_DESCRIPTION =
  "Enterprise AI Reply components, constants, and utilities.";