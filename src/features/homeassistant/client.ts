/**
 * Thin Home Assistant REST client.
 *
 * All calls are Bearer-authenticated with the user's long-lived token and time
 * out rather than hanging on an unreachable LAN address. Errors are mapped to
 * short, human-readable strings for the setup screen.
 */

import type { HAConfig, HAEntity, TestResult } from './types';

const REQUEST_TIMEOUT_MS = 10_000;

interface RawState {
  entity_id: string;
  state: string;
  attributes?: { friendly_name?: string };
}

/** Trim whitespace and any trailing slashes from a base URL. */
export function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

function friendlyError(error: unknown): string {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'Timed out — check the URL and that Home Assistant is reachable.';
  }

  if (error instanceof TypeError) {
    return 'Could not reach Home Assistant — check the URL and your network.';
  }

  return error instanceof Error ? error.message : 'Unknown error';
}

async function haFetch(config: HAConfig, path: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(`${normalizeBaseUrl(config.baseUrl)}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
        ...init?.headers,
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Verify the URL + token by hitting the API root. Never throws. */
export async function testConnection(config: HAConfig): Promise<TestResult> {
  try {
    const response = await haFetch(config, '/api/');

    if (response.status === 401) {
      return { ok: false, error: 'Token rejected — create a new long-lived token.' };
    }

    if (!response.ok) {
      return { ok: false, error: `Home Assistant returned ${response.status}.` };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: friendlyError(error) };
  }
}

/** Fetch all `light.*` entities, sorted by friendly name. Throws on failure. */
export async function fetchLightEntities(config: HAConfig): Promise<HAEntity[]> {
  const response = await haFetch(config, '/api/states');

  if (!response.ok) {
    throw new Error(`Home Assistant returned ${response.status}.`);
  }

  const states = (await response.json()) as RawState[];

  return states
    .filter((entity) => entity.entity_id.startsWith('light.'))
    .map((entity) => ({
      entityId: entity.entity_id,
      friendlyName: entity.attributes?.friendly_name ?? entity.entity_id,
      state: entity.state,
    }))
    .sort((a, b) => a.friendlyName.localeCompare(b.friendlyName));
}

/**
 * Turn a light on at a given brightness / colour temperature. Used by the
 * sunrise engine in a later phase; kept here so all HA I/O lives in one module.
 */
export async function setLight(
  config: HAConfig,
  entityIds: string[],
  options: { brightnessPct?: number; colorTempKelvin?: number },
): Promise<void> {
  const body: Record<string, unknown> = { entity_id: entityIds };

  if (options.brightnessPct !== undefined) {
    body.brightness_pct = options.brightnessPct;
  }

  if (options.colorTempKelvin !== undefined) {
    body.color_temp_kelvin = options.colorTempKelvin;
  }

  const response = await haFetch(config, '/api/services/light/turn_on', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Home Assistant returned ${response.status}.`);
  }
}

/** Turn the given lights off (used by the "turn off after dismiss" option). */
export async function turnOffLights(config: HAConfig, entityIds: string[]): Promise<void> {
  const response = await haFetch(config, '/api/services/light/turn_off', {
    method: 'POST',
    body: JSON.stringify({ entity_id: entityIds }),
  });

  if (!response.ok) {
    throw new Error(`Home Assistant returned ${response.status}.`);
  }
}

/** Activate a Home Assistant scene by entity id. */
export async function activateScene(config: HAConfig, sceneId: string): Promise<void> {
  const response = await haFetch(config, '/api/services/scene/turn_on', {
    method: 'POST',
    body: JSON.stringify({ entity_id: sceneId }),
  });

  if (!response.ok) {
    throw new Error(`Home Assistant returned ${response.status}.`);
  }
}

export { friendlyError };
