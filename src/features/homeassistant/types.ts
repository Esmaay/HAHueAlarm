/**
 * Home Assistant connection model.
 *
 * Credentials are entered in-app and kept in the device keychain — never in the
 * repository — so a public repo can't leak them. The long-lived access token is
 * created by the user in Home Assistant (Profile → Security).
 */

export interface HAConfig {
  /** Base URL with no trailing slash, e.g. `http://homeassistant.local:8123`. */
  baseUrl: string;
  /** Long-lived access token. */
  token: string;
}

/** A Home Assistant entity, trimmed to what the light picker needs. */
export interface HAEntity {
  entityId: string;
  friendlyName: string;
  /** Current state, e.g. `on` / `off` / `unavailable`. */
  state: string;
}

export type ConnectionStatus = 'unconfigured' | 'checking' | 'connected' | 'error';

export interface TestResult {
  ok: boolean;
  /** Human-readable reason when `ok` is false. */
  error?: string;
}
