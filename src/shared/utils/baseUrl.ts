/**
 * Get the base URL of the current environment.
 * @returns {string} - The base URL (protocol + host)
 */
const PROD_BASE_URL = "https://youngtour.netlify.app"; // Replace with your actual domain

export const baseUrl = (): string => {
  if (window.location.hostname === "localhost") {
    return window.location.origin; // Use dynamic origin in development
  }
  return PROD_BASE_URL; // Always return fixed URL in production
};
