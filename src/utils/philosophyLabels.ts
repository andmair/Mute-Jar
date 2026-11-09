import { PersonaType } from '../types';

export interface PhilosophyMeta {
  id: PersonaType;
  title: string; // e.g. "The Habit Builder"
  classicTitle: string; // e.g. "The Pragmatist"
  tagline: string;
  boxTitle: string;
  targetUnitLabel: string;
  targetNoun: string; // "Donation Threshold" | "Habit Milestone" | "Forfeit Trigger"
  summary: string;
  benefit: string;
  colorScheme: {
    accent: string;
    border: string;
    bg: string;
    badge: string;
    text: string;
    iconColor: string;
  };
}

export const PHILOSOPHY_CONFIGS: Record<PersonaType, PhilosophyMeta> = {
  saint: {
    id: 'saint',
    title: 'The Saint',
    classicTitle: 'The Saint',
    tagline: 'Charity & Giving',
    boxTitle: 'Charity Donation Target',
    targetUnitLabel: 'Mutecoins',
    targetNoun: 'Donation Threshold',
    summary: 'Turn awkward meeting slip-ups into real global good. Each Mutecoin funds charitable donations to vetted non-profits.',
    benefit: 'Supports global donation aggregators (Every.org, GlobalGiving, PayPal Giving Fund) or your chosen cause.',
    colorScheme: {
      accent: 'sky',
      border: 'border-sky-300 dark:border-sky-800',
      bg: 'bg-sky-50 dark:bg-sky-950/30',
      badge: 'bg-sky-500 text-white',
      text: 'text-sky-700 dark:text-sky-300',
      iconColor: 'text-sky-500',
    },
  },
  pragmatist: {
    id: 'pragmatist',
    title: 'The Habit Builder',
    classicTitle: 'The Pragmatist',
    tagline: 'Productivity & Growth',
    boxTitle: 'Productivity Habit Goal',
    targetUnitLabel: 'Mutecoins',
    targetNoun: 'Habit Milestone Target',
    summary: 'Make yourself better with every mute. Convert Mutecoins into pushup reps, book pages, and focused habit streaks.',
    benefit: 'Tracks personal development, fitness reps, and deep-work milestones in Mutecoins.',
    colorScheme: {
      accent: 'amber',
      border: 'border-amber-300 dark:border-amber-800',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      badge: 'bg-amber-500 text-white',
      text: 'text-amber-700 dark:text-amber-300',
      iconColor: 'text-amber-500',
    },
  },
  roastmaster: {
    id: 'roastmaster',
    title: 'The Forfeit Master',
    classicTitle: 'The Roast Master',
    tagline: 'Humor & Team Fun',
    boxTitle: 'Team Activity / Forfeit',
    targetUnitLabel: 'Mutecoins',
    targetNoun: 'Forfeit Trigger Target',
    summary: 'Keep the team laughing. If you speak on mute, you buy coffees, bring donuts, or do a playful lightning presentation.',
    benefit: 'Sets social dare thresholds and team treat triggers when coin thresholds are met.',
    colorScheme: {
      accent: 'rose',
      border: 'border-rose-300 dark:border-rose-800',
      bg: 'bg-rose-50 dark:bg-rose-950/30',
      badge: 'bg-rose-500 text-white',
      text: 'text-rose-700 dark:text-rose-300',
      iconColor: 'text-rose-500',
    },
  },
};

export function getPhilosophyDisplayTitle(
  persona: PersonaType,
  labelStyle: 'improved' | 'classic' = 'improved'
): string {
  const conf = PHILOSOPHY_CONFIGS[persona] || PHILOSOPHY_CONFIGS.pragmatist;
  if (labelStyle === 'classic') {
    return conf.classicTitle;
  }
  return conf.title;
}

export function getPhilosophyCombinedLabel(
  persona: PersonaType,
  labelStyle: 'improved' | 'classic' = 'improved'
): { title: string; subtitle: string; tag: string } {
  const conf = PHILOSOPHY_CONFIGS[persona] || PHILOSOPHY_CONFIGS.pragmatist;
  if (persona === 'saint') {
    return {
      title: 'The Saint',
      subtitle: 'Charity & Giving',
      tag: 'Charity Impact',
    };
  }
  if (persona === 'pragmatist') {
    return {
      title: labelStyle === 'classic' ? 'The Pragmatist' : 'The Habit Builder',
      subtitle: labelStyle === 'classic' ? 'Productivity & Growth' : 'Personal Growth & Habits (The Pragmatist)',
      tag: 'Habit Milestone',
    };
  }
  return {
    title: labelStyle === 'classic' ? 'The Roast Master' : 'The Forfeit Master',
    subtitle: labelStyle === 'classic' ? 'Humor & Team Fun' : 'Team Treats & Dares (The Roast Master)',
    tag: 'Team Forfeit',
  };
}
