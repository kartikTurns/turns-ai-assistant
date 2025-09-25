// Utility functions for URL parameter handling

const AUTH_STORAGE_KEY = 'claude-auth-params';

export interface AuthParams {
  accessToken?: string;
  businessId?: string;
}

/**
 * Extract authentication parameters from URL query string
 */
export function getAuthParamsFromUrl(): AuthParams {
  const params = new URLSearchParams(window.location.search);

  return {
    accessToken: params.get('access_token') || undefined,
    // Handle both business_id and buisness_id (typo from user's example)
    businessId: params.get('business_id') || params.get('buisness_id') || undefined,
  };
}

/**
 * Check if auth parameters are present in URL
 */
export function hasAuthParams(): boolean {
  const { accessToken, businessId } = getAuthParamsFromUrl();
  return !!(accessToken && businessId);
}

/**
 * Clean auth parameters from URL without page reload
 */
export function cleanAuthParamsFromUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('access_token');
  url.searchParams.delete('business_id');
  url.searchParams.delete('buisness_id'); // Handle typo variant

  // Update URL without reload
  window.history.replaceState({}, document.title, url.toString());
}

/**
 * Save authentication parameters to localStorage
 */
export function saveAuthParamsToStorage(authParams: AuthParams): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authParams));
  } catch (error) {
    console.error('Failed to save auth params to localStorage:', error);
  }
}

/**
 * Load authentication parameters from localStorage
 */
export function loadAuthParamsFromStorage(): AuthParams {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load auth params from localStorage:', error);
  }
  return {};
}

/**
 * Clear authentication parameters from localStorage
 */
export function clearAuthParamsFromStorage(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear auth params from localStorage:', error);
  }
}

/**
 * Check if valid auth parameters exist in localStorage
 */
export function hasStoredAuthParams(): boolean {
  const stored = loadAuthParamsFromStorage();
  return !!(stored.accessToken && stored.businessId);
}

/**
 * Get combined auth params (URL takes precedence over localStorage)
 */
export function getEffectiveAuthParams(): AuthParams {
  const urlParams = getAuthParamsFromUrl();
  if (urlParams.accessToken && urlParams.businessId) {
    return urlParams;
  }
  return loadAuthParamsFromStorage();
}