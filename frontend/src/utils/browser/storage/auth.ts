import {
  IKnownSession,
  IPendingSignOut,
  LOGIN_METHODS,
  LoginMethod,
} from "@/typings/local-storage";
import { getAppStorage, setAppStorage } from "@/utils/browser/storage/core";

export function getLastLoginMethod(): LoginMethod | null {
  const method = getAppStorage().lastLoginMethod;

  return method && LOGIN_METHODS.includes(method) ? method : null;
}

export function setLastLoginMethod(method: LoginMethod) {
  setAppStorage({ lastLoginMethod: method });
}

/** The session this device last saw; offline the session lookup fails and names nobody. */
export function getLastSession(): IKnownSession | null {
  return getAppStorage().lastSession ?? null;
}

export function setLastSession(session: IKnownSession | null) {
  setAppStorage({ lastSession: session });
}

/** A sign-out whose session may still answer, until a session read shows it gone. */
export function getPendingSignOut(): IPendingSignOut | null {
  return getAppStorage().pendingSignOut ?? null;
}

export function setPendingSignOut(pending: IPendingSignOut | null) {
  setAppStorage({ pendingSignOut: pending });
}
