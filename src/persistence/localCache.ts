/**
 * Frontend persistence abstraction.
 *
 * Supabase is the intended database and storage provider. Until that
 * integration is connected, this module keeps non-sensitive records in a
 * device-local cache so the UI can be wired once. It is not a replacement
 * for the database.
 *
 * Never store passwords, exchange secrets, or API keys here.
 */

export type PersistenceStatus = "memory" | "device-cache" | "remote";

export interface PersistenceResult<T> {
  ok: boolean;
  value: T;
  status: PersistenceStatus;
  error?: string;
}

function canUseStorage(): boolean {
  try {
    const key = "__hermes_probe";
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function readCache<T>(key: string, fallback: T): PersistenceResult<T> {
  if (!canUseStorage()) {
    return { ok: true, value: fallback, status: "memory" };
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return { ok: true, value: fallback, status: "device-cache" };
    return { ok: true, value: JSON.parse(raw) as T, status: "device-cache" };
  } catch {
    return {
      ok: false,
      value: fallback,
      status: "memory",
      error: "Could not read the local cache.",
    };
  }
}

export function writeCache<T>(key: string, value: T): PersistenceResult<T> {
  if (!canUseStorage()) {
    return {
      ok: true,
      value,
      status: "memory",
      error: "Device storage is unavailable. Changes stay in this session only.",
    };
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return { ok: true, value, status: "device-cache" };
  } catch {
    return {
      ok: false,
      value,
      status: "memory",
      error: "Could not write to the local cache.",
    };
  }
}

export function removeCache(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export const persistenceCopy = {
  deviceOnly:
    "Saved on this device only. Cloud persistence (Supabase) is not connected yet.",
  unavailable: "Storage is unavailable. This change will not survive a refresh.",
  notRemote: "Not stored remotely.",
};
