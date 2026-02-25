/**
 * User context utility.
 * Returns the current user's display name for created_by fields.
 * When auth is integrated, this will pull from the authenticated session.
 * For now, uses a browser-persisted username with a fallback.
 */

const STORAGE_KEY = "alleato_user_name";
const DEFAULT_USER = "System User";

export function getCurrentUser(): string {
  if (typeof window === "undefined") return DEFAULT_USER;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_USER;
}

export function setCurrentUser(name: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, name);
}
