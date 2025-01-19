/**
 * Get the base URL of the current environment.
 * @returns {string} - The base URL (protocol + host)
 */
export const baseUrl = (): string => {
  return window.location.origin;
};
