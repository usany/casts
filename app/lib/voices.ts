export const AVAILABLE_VOICES = [
  'Kore',
  'Puck',
  'Breeze',
  'Juniper',
  'Chime',
  'Echo',
  'Orbit',
  'Sage',
] as const;

export type PrebuiltVoice = (typeof AVAILABLE_VOICES)[number];
