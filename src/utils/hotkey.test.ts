import { describe, it, expect } from 'vitest';
import {
  DEFAULT_AUDIO_MONITOR_HOTKEY,
  parseHotkeyFromEvent,
  matchesHotkey,
} from './hotkey';

describe('Audio Monitor Hotkey Utilities', () => {
  it('formats modifier + letter combos using physical key codes', () => {
    const res = parseHotkeyFromEvent({
      key: 'µ', // macOS Alt+Shift+M character output
      code: 'KeyM',
      ctrlKey: false,
      altKey: true,
      shiftKey: true,
      metaKey: false,
    });
    expect(res.hotkey).toBe(DEFAULT_AUDIO_MONITOR_HOTKEY);
    expect(res.error).toBeUndefined();
  });

  it('rejects single non-function keys without modifiers', () => {
    const res = parseHotkeyFromEvent({
      key: 'm',
      code: 'KeyM',
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
    });
    expect(res.hotkey).toBeNull();
    expect(res.error).toBeDefined();
  });

  it('allows standalone function keys like F8', () => {
    const res = parseHotkeyFromEvent({
      key: 'F8',
      code: 'F8',
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
    });
    expect(res.hotkey).toBe('F8');
  });

  it('cancels recording when Escape is pressed alone', () => {
    const res = parseHotkeyFromEvent({
      key: 'Escape',
      code: 'Escape',
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
    });
    expect(res.cancelled).toBe(true);
    expect(res.hotkey).toBeNull();
  });

  it('matches configured shortcuts exactly and ignores key repeat', () => {
    expect(
      matchesHotkey(
        {
          key: 'Â',
          code: 'KeyM',
          ctrlKey: false,
          altKey: true,
          shiftKey: true,
          metaKey: false,
        },
        'Alt+Shift+M'
      )
    ).toBe(true);

    expect(
      matchesHotkey(
        {
          key: 'm',
          code: 'KeyM',
          ctrlKey: true,
          altKey: true,
          shiftKey: true,
          metaKey: false,
        },
        'Alt+Shift+M'
      )
    ).toBe(false);

    expect(
      matchesHotkey(
        {
          key: 'M',
          code: 'KeyM',
          ctrlKey: false,
          altKey: true,
          shiftKey: true,
          metaKey: false,
          repeat: true,
        },
        'Alt+Shift+M'
      )
    ).toBe(false);

    expect(
      matchesHotkey(
        {
          key: 'M',
          code: 'KeyM',
          ctrlKey: false,
          altKey: true,
          shiftKey: true,
          metaKey: false,
        },
        ''
      )
    ).toBe(false);
  });
});
