/******************************************************************************
 * useAIReply.js
 * Part 1
 * Imports + Hook Skeleton + State
 ******************************************************************************/

import {
  useState,
  useCallback,
  useMemo,
} from "react";

import AIReplyAPI from "../services/aiReplyApi";

import PromptBuilder from "../services/promptBuilder";

import ToneService from "../services/toneService";

import GrammarService from "../services/grammarService";

import ReplyCache from "../services/replyCache";

/* ==========================================================================
   Hook
========================================================================== */

const useAIReply = ({
  email = null,
  initialTone,
} = {}) => {

  /* ==========================================================
      Reply State
  ========================================================== */

  const [reply, setReply] = useState("");

  /* ==========================================================
      Tone
  ========================================================== */

  const [tone, setTone] = useState(
    ToneService.normalizeTone(
      initialTone ||
      ToneService.getDefaultTone()
    )
  );

  /* ==========================================================
      Loading
  ========================================================== */

  const [loading, setLoading] =
    useState(false);

  /* ==========================================================
      Error
  ========================================================== */

  const [error, setError] =
    useState(null);

  /* ==========================================================
      Copy State
  ========================================================== */

  const [copied, setCopied] =
    useState(false);

  /* ==========================================================
      Metadata
  ========================================================== */

  const [lastGeneratedAt, setLastGeneratedAt] =
    useState(null);

  const [generationCount, setGenerationCount] =
    useState(0);

  /* ==========================================================
      Derived Values
  ========================================================== */

  const wordCount = useMemo(() => {

    return GrammarService.countWords(reply);

  }, [reply]);

  const characterCount = useMemo(() => {

    return GrammarService.countCharacters(reply);

  }, [reply]);

  const hasReply = useMemo(() => {

    return reply.trim().length > 0;

  }, [reply]);
/******************************************************************************
 * useAIReply.js
 * Part 2
 * Generate AI Reply
 ******************************************************************************/

/* ==========================================================================
   Generate AI Reply
========================================================================== */

const generateReply = useCallback(

  async (instructions = "") => {

    if (!email) return;

    setLoading(true);
    setError(null);

    try {

      /* --------------------------------------------------------
         Build Prompt
      -------------------------------------------------------- */

      const prompt =
        PromptBuilder.buildReplyPrompt({

          email,

          tone,

          instructions,

        });

      /* --------------------------------------------------------
         Cache Key
      -------------------------------------------------------- */

      const cacheKey = JSON.stringify({

        subject: email.subject,

        body: email.body,

        tone,

        instructions,

      });

      /* --------------------------------------------------------
         Execute Request
      -------------------------------------------------------- */

      const response =
        await ReplyCache.executeRequest(

          cacheKey,

          () =>
            AIReplyAPI.safeRequest(() =>
              AIReplyAPI.generateReply({
                prompt,
              })
            )

        );

      /* --------------------------------------------------------
         Update State
      -------------------------------------------------------- */

      const generatedReply =
        response?.reply || "";

      setReply(generatedReply);

      setLastGeneratedAt(
        new Date()
      );

      setGenerationCount(
        (count) => count + 1
      );

      return generatedReply;

    } catch (err) {

      console.error(
        "AI Reply Generation Failed",
        err
      );

      setError(
        err?.message ||
        "Unable to generate AI reply."
      );

      return null;

    } finally {

      setLoading(false);

    }

  },

  [email, tone]

);

/******************************************************************************
 * End Part 2
 ******************************************************************************/
/******************************************************************************
 * useAIReply.js
 * Part 3
 * Regenerate + Rewrite + Grammar
 ******************************************************************************/

/* ==========================================================================
   Regenerate Reply
========================================================================== */

const regenerateReply = useCallback(

  async (instructions = "") => {

    if (!email) return;

    setLoading(true);
    setError(null);

    try {

      const prompt =
        PromptBuilder.buildReplyPrompt({

          email,

          tone,

          instructions,

        });

      const response =
        await AIReplyAPI.safeRequest(() =>
          AIReplyAPI.regenerateReply({
            prompt,
          })
        );

      const regeneratedReply =
        response?.reply || "";

      setReply(regeneratedReply);

      setLastGeneratedAt(
        new Date()
      );

      setGenerationCount(
        (count) => count + 1
      );

      return regeneratedReply;

    } catch (err) {

      console.error(
        "AI Reply Regeneration Failed",
        err
      );

      setError(
        err?.message ||
        "Unable to regenerate reply."
      );

      return null;

    } finally {

      setLoading(false);

    }

  },

  [email, tone]

);

/* ==========================================================================
   Rewrite Reply
========================================================================== */

const rewriteReply = useCallback(

  async (selectedTone = tone) => {

    if (!reply.trim()) return;

    setLoading(true);
    setError(null);

    try {

      const prompt =
        PromptBuilder.buildRewritePrompt({

          reply,

          tone: selectedTone,

        });

      const response =
        await AIReplyAPI.safeRequest(() =>
          AIReplyAPI.rewriteReply({
            prompt,
          })
        );

      const rewrittenReply =
        response?.reply || "";

      setReply(rewrittenReply);

      return rewrittenReply;

    } catch (err) {

      console.error(
        "AI Rewrite Failed",
        err
      );

      setError(
        err?.message ||
        "Unable to rewrite reply."
      );

      return null;

    } finally {

      setLoading(false);

    }

  },

  [reply, tone]

);

/* ==========================================================================
   Grammar Fix
========================================================================== */

const grammarFix = useCallback(

  async () => {

    if (!reply.trim()) return;

    setLoading(true);
    setError(null);

    try {

      const prompt =
        GrammarService.buildGrammarPrompt(
          reply
        );

      const response =
        await AIReplyAPI.safeRequest(() =>
          AIReplyAPI.grammarReply({
            prompt,
          })
        );

      const correctedReply =
        response?.reply || "";

      setReply(correctedReply);

      return correctedReply;

    } catch (err) {

      console.error(
        "Grammar Fix Failed",
        err
      );

      setError(
        err?.message ||
        "Unable to improve grammar."
      );

      return null;

    } finally {

      setLoading(false);

    }

  },

  [reply]

);

/******************************************************************************
 * End Part 3
 ******************************************************************************/
/******************************************************************************
 * useAIReply.js
 * Part 4
 * Copy + Retry + Reset + Tone Management
 ******************************************************************************/

/* ==========================================================================
   Copy Reply
========================================================================== */

const copyReply = useCallback(async () => {

  if (!reply.trim()) return false;

  try {

    await navigator.clipboard.writeText(reply);

    setCopied(true);

    setTimeout(() => {

      setCopied(false);

    }, 2000);

    return true;

  } catch (error) {

    console.error(
      "Failed to copy reply.",
      error
    );

    setError(
      "Unable to copy reply."
    );

    return false;

  }

}, [reply]);

/* ==========================================================================
   Retry Generation
========================================================================== */

const retry = useCallback(async () => {

  setError(null);

  return generateReply();

}, [generateReply]);

/* ==========================================================================
   Reset Hook
========================================================================== */

const reset = useCallback(() => {

  setReply("");

  setError(null);

  setCopied(false);

  setGenerationCount(0);

  setLastGeneratedAt(null);

}, []);

/* ==========================================================================
   Change Tone
========================================================================== */

const changeTone = useCallback((nextTone) => {

  const normalizedTone =
    ToneService.normalizeTone(nextTone);

  setTone(normalizedTone);

}, []);

/* ==========================================================================
   Manual Reply Update
========================================================================== */

const updateReply = useCallback((text) => {

  setReply(text);

}, []);

/******************************************************************************
 * End Part 4
 ******************************************************************************/
/******************************************************************************
 * useAIReply.js
 * Part 5
 * Enterprise Return + Export
 ******************************************************************************/

/* ==========================================================================
   Hook Return
========================================================================== */

return {

  /* --------------------------------------------------------
     State
  -------------------------------------------------------- */

  reply,

  tone,

  loading,

  error,

  copied,

  lastGeneratedAt,

  generationCount,

  /* --------------------------------------------------------
     Derived
  -------------------------------------------------------- */

  hasReply,

  wordCount,

  characterCount,

  /* --------------------------------------------------------
     Actions
  -------------------------------------------------------- */

  generateReply,

  regenerateReply,

  rewriteReply,

  grammarFix,

  copyReply,

  retry,

  reset,

  changeTone,

  updateReply,

};

};

/******************************************************************************
 * Default Export
 ******************************************************************************/

export default useAIReply;

/******************************************************************************
 * End useAIReply.js
 ******************************************************************************/