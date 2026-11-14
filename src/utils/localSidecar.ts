import { PersonaType } from '../types';

export interface OfflineSuggestionItem {
  title: string;
  description: string;
  category: string;
  actionMetric: string;
}

/**
 * Detects whether the UI is running inside a packaged Tauri desktop shell.
 */
export function isTauriDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location?.hostname || '';
  const proto = window.location?.protocol || '';
  return (
    proto === 'tauri:' ||
    host === 'tauri.localhost' ||
    '__TAURI_INTERNALS__' in (window as unknown as Record<string, unknown>)
  );
}

/**
 * Resolves `/api/*` paths. In browser/hosted environments, uses relative `/api/*`.
 * Inside a standalone Tauri desktop installer, routes to the optional local sidecar on port 3000.
 */
export function getLocalApiUrl(apiPath: string, sidecarPort = 3000): string {
  const normalized = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
  if (isTauriDesktop()) {
    return `http://localhost:${sidecarPort}${normalized}`;
  }
  return normalized;
}

/**
 * Offline-first pledge & goal suggestions used when running standalone without the optional sidecar.
 */
export function getOfflinePledgeSuggestions(
  persona: PersonaType,
  coinCount: number
): OfflineSuggestionItem[] {
  const count = Math.max(1, coinCount);

  if (persona === 'saint') {
    return [
      {
        title: 'Clean Water Micro-Donation',
        description: `Donate $${count} to a verified clean water or community relief fund.`,
        category: 'charity',
        actionMetric: `$${count} Donation`,
      },
      {
        title: 'Local Food Bank Contribution',
        description: `Fund ${count} meals via your local food pantry or GlobalGiving.`,
        category: 'charity',
        actionMetric: `${count} Meals`,
      },
      {
        title: 'Open-Source Sponsor Match',
        description: `Sponsor a community open-source maintainer with $${Math.max(5, count)}.`,
        category: 'charity',
        actionMetric: `$${Math.max(5, count)} Match`,
      },
      {
        title: 'Animal Shelter Supply Drop',
        description: `Pick up $${count} worth of pet food or blankets for a nearby shelter.`,
        category: 'charity',
        actionMetric: `$${count} Supplies`,
      },
    ];
  }

  if (persona === 'roastmaster') {
    return [
      {
        title: 'Friday Gourmet Donuts & Coffee',
        description: `Bring ${Math.max(4, Math.min(24, count))} fresh pastries or coffees to the sprint team.`,
        category: 'work',
        actionMetric: `${Math.max(4, Math.min(24, count))} Treats`,
      },
      {
        title: '3-Minute Lightning Talk',
        description: 'Present a lighthearted 3-minute demo on an unexpected topic at Friday retro.',
        category: 'work',
        actionMetric: '1 Lightning Talk',
      },
      {
        title: 'Desk Snack Restock',
        description: `Restock the team snack shelf or send digital coffee cards worth $${count}.`,
        category: 'work',
        actionMetric: `$${count} Shout`,
      },
      {
        title: 'Custom Slack Emoji Tribute',
        description: 'Let teammates vote on your next funny profile status for 48 hours.',
        category: 'work',
        actionMetric: '48h Status Dare',
      },
    ];
  }

  return [
    {
      title: 'Post-Call Pushup & Squat Set',
      description: `Knock out ${count * 5} pushups or bodyweight squats across the week.`,
      category: 'personal',
      actionMetric: `${count * 5} Reps`,
    },
    {
      title: 'Deep Reading Sprint',
      description: `Read ${count * 5} pages of a technical or leadership book screen-free.`,
      category: 'personal',
      actionMetric: `${count * 5} Pages`,
    },
    {
      title: 'Outdoor Walk Reset',
      description: `Take ${count} brisk 10-minute walks outside between meeting blocks.`,
      category: 'personal',
      actionMetric: `${count * 10} Min Walk`,
    },
    {
      title: 'Inbox Zero Sweep',
      description: `Archive or reply to ${count * 3} lingering emails before Friday EOD.`,
      category: 'personal',
      actionMetric: `${count * 3} Emails`,
    },
  ];
}
