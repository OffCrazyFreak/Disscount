import { LOGIN_METHODS, LoginMethod } from "@/typings/local-storage";
import { getAppStorage, setAppStorage } from "@/utils/browser/storage/core";

/**
 * Get the login method the user last used (email, google, or facebook).
 */
export function getLastLoginMethod(): LoginMethod | null {
  const method = getAppStorage().lastLoginMethod;

  return method && LOGIN_METHODS.includes(method) ? method : null;
}

/**
 * Persist the login method the user just used so we can show a "last used" badge.
 */
export function setLastLoginMethod(method: LoginMethod) {
  setAppStorage({ lastLoginMethod: method });
}
