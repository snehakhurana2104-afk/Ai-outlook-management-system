/******************************************************************************
 * toneService.js
 * Part 1
 * Enterprise Tone Configuration
 ******************************************************************************/

export const TONES = [
  {
    id: "Professional",
    label: "Professional",
    description: "Corporate business communication",
    icon: "Briefcase",
    color: "blue",
  },
  {
    id: "Friendly",
    label: "Friendly",
    description: "Warm and conversational",
    icon: "Smile",
    color: "green",
  },
  {
    id: "Formal",
    label: "Formal",
    description: "Official business language",
    icon: "Building2",
    color: "slate",
  },
  {
    id: "Casual",
    label: "Casual",
    description: "Relaxed communication",
    icon: "Coffee",
    color: "orange",
  },
  {
    id: "Short",
    label: "Short",
    description: "Brief reply",
    icon: "Minimize2",
    color: "purple",
  },
  {
    id: "Long",
    label: "Detailed",
    description: "Complete detailed response",
    icon: "Maximize2",
    color: "indigo",
  },
];

export const DEFAULT_TONE = "Professional";
/******************************************************************************
 * toneService.js
 * Part 2
 * Enterprise Helpers
 ******************************************************************************/

export const getTone = (id) => {
  return (
    TONES.find((tone) => tone.id === id) ||
    TONES[0]
  );
};

export const getAllTones = () => {
  return [...TONES];
};

export const isValidTone = (id) => {
  return TONES.some(
    (tone) => tone.id === id
  );
};

export const getDefaultTone = () => {
  return DEFAULT_TONE;
};
/******************************************************************************
 * toneService.js
 * Part 3
 * Normalization
 ******************************************************************************/

export const normalizeTone = (value) => {

  if (!value) {
    return DEFAULT_TONE;
  }

  const normalized =
    value.trim();

  if (isValidTone(normalized)) {
    return normalized;
  }

  return DEFAULT_TONE;

};

export const getToneDescription = (tone) => {
  return getTone(tone).description;
};

export const getToneColor = (tone) => {
  return getTone(tone).color;
};

export const getToneIcon = (tone) => {
  return getTone(tone).icon;
};
/******************************************************************************
 * toneService.js
 * Part 4
 * Export
 ******************************************************************************/

const ToneService = {

  TONES,

  DEFAULT_TONE,

  getTone,

  getAllTones,

  isValidTone,

  normalizeTone,

  getToneDescription,

  getToneColor,

  getToneIcon,

  getDefaultTone,

};

export default ToneService;