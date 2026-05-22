// lib/experiments.js — Deterministic A/B testing, no external deps
// Uses a simple hash of userId + experimentName for a stable 50/50 split.
// Same user always gets the same variant — doesn't change across requests.

/**
 * Hash a string to an unsigned 32-bit int (fast, deterministic).
 * djb2 variant.
 */
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0; // to unsigned
}

/**
 * Get the variant for a user in an experiment.
 *
 * @param {string} userId   - The user's unique ID (MongoDB _id or similar)
 * @param {string} expName  - Experiment name, e.g. 'homepage_hero'
 * @param {string[]} variants - Variant names (default: ['control', 'variant'])
 * @returns {string} - One of the variant strings
 *
 * @example
 * const variant = getVariant(user._id, 'homepage_hero');
 * // → 'control' | 'variant'
 *
 * const variant = getVariant(user._id, 'cta_copy', ['red', 'blue', 'green']);
 * // → 'red' | 'blue' | 'green'
 */
export function getVariant(userId, expName, variants = ['control', 'variant']) {
  if (!userId) return variants[0]; // unauthenticated → always control
  const hash = hashString(String(userId) + expName);
  return variants[hash % variants.length];
}

/**
 * Check if user is in the 'variant' bucket for a boolean experiment.
 * Convenience wrapper around getVariant.
 *
 * @example
 * if (isVariant(user._id, 'new_feed_layout')) {
 *   // show new layout
 * }
 */
export function isVariant(userId, expName) {
  return getVariant(userId, expName) === 'variant';
}

/**
 * Server-side helper — returns variant + logs to console in dev.
 * Safe to call inside getServerSideProps.
 */
export function getServerVariant(userId, expName, variants = ['control', 'variant']) {
  const variant = getVariant(userId, expName, variants);
  if (process.env.NODE_ENV === 'development') {
    console.log(`[experiment] ${expName} → user:${userId} → ${variant}`);
  }
  return variant;
}

// Active experiments registry — edit here to add/remove experiments
export const EXPERIMENTS = {
  HOMEPAGE_HERO: 'homepage_hero',
  ONBOARDING_SKIP: 'onboarding_skip_button',
  FEED_LAYOUT: 'feed_card_layout',
  TAKE_CTA: 'take_cta_copy',
};
