/**
 * @fileoverview Platform detection hook for Tauri apps.
 *
 * Uses @tauri-apps/plugin-os to detect the current OS platform.
 * The `platform()` function is synchronous and reads from the
 * native plugin internals injected at startup.
 *
 * Falls back gracefully in browser/test environments where the
 * Tauri runtime is not available.
 */

import { platform as getTauriPlatform } from '@tauri-apps/plugin-os';

export type Platform = 'macos' | 'windows' | 'linux' | 'ios' | 'android' | string;

let _cachedPlatform: Platform | null = null;

/**
 * Resolve the current platform string once and cache it.
 * Returns an empty string if the Tauri runtime is unavailable.
 */
function resolvePlatform(): Platform {
  if (_cachedPlatform !== null)
    return _cachedPlatform;
  try {
    _cachedPlatform = getTauriPlatform();
  }
  catch {
    // Fallback: browser / test environment
    _cachedPlatform = '';
  }
  return _cachedPlatform;
}

export interface PlatformInfo {
  /** Raw platform string: 'macos' | 'windows' | 'linux' | ... */
  platform: Platform;
  /** true when running on macOS */
  isMac: boolean;
  /** true when running on Windows */
  isWindows: boolean;
  /** true when running on Linux */
  isLinux: boolean;
}

/**
 * Returns platform information.
 *
 * Synchronous — safe to call at module or render level.
 * The result is computed once and cached for the lifetime of the process.
 *
 * @example
 * const { isMac, isWindows } = usePlatform()
 * // <TitleBar isMac={isMac} />
 */
export function usePlatform(): PlatformInfo {
  const platform = resolvePlatform();
  return {
    platform,
    isMac: platform === 'macos',
    isWindows: platform === 'windows',
    isLinux: platform === 'linux',
  };
}
