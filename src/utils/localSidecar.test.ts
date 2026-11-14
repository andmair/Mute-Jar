import { describe, it, expect, afterEach } from 'vitest';
import { getLocalApiUrl, getOfflinePledgeSuggestions } from './localSidecar';

describe('localSidecar helpers', () => {
  afterEach(() => {
    delete (globalThis as unknown as { window?: unknown }).window;
  });

  it('returns relative API path in browser mode', () => {
    (globalThis as unknown as { window?: unknown }).window = {
      location: { hostname: 'localhost', protocol: 'http:' },
    };
    expect(getLocalApiUrl('/api/mcp')).toBe('/api/mcp');
    expect(getLocalApiUrl('api/pledges/suggest')).toBe('/api/pledges/suggest');
  });

  it('targets localhost sidecar port when running inside Tauri desktop', () => {
    (globalThis as unknown as { window?: unknown }).window = {
      location: { hostname: 'tauri.localhost', protocol: 'http:' },
      __TAURI_INTERNALS__: {},
    };
    expect(getLocalApiUrl('/api/mcp')).toBe('http://localhost:3000/api/mcp');
    expect(getLocalApiUrl('/api/integrations/relay-webhook', 4100)).toBe(
      'http://localhost:4100/api/integrations/relay-webhook'
    );
  });

  it('provides curated offline pledge suggestions for all personas', () => {
    for (const persona of ['saint', 'pragmatist', 'roastmaster'] as const) {
      const items = getOfflinePledgeSuggestions(persona, 12);
      expect(items.length).toBeGreaterThanOrEqual(2);
      for (const item of items) {
        expect(item.title.length).toBeGreaterThan(0);
        expect(item.description.length).toBeGreaterThan(0);
        expect(item.category.length).toBeGreaterThan(0);
        expect(item.actionMetric.length).toBeGreaterThan(0);
      }
    }
  });
});
