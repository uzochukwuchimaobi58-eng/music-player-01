import { Track } from '../types';

/**
 * Strips leading non-alphanumeric characters (brackets, quotes, punctuation, tags)
 * and normalizes the string for accurate, natural alphabetical comparison.
 * Examples:
 *   '[Naijaloaded] Olamide' -> 'naijaloaded olamide' (starts with 'n')
 *   'action film' -> 'action film' (starts with 'a')
 *   '"Hello"' -> 'hello' (starts with 'h')
 *   'Zéro Problémé' -> 'zero probleme' (starts with 'z')
 */
export function getSortKey(str: string): string {
  if (!str) return '';
  // Remove leading brackets, symbols, quotes, hyphens, hashes, or dots
  const stripped = str.replace(/^[\s\[\]\(\)\{\}"'_\-–—#\.\?!«»]+/, '').trim();
  // Normalize accented characters (e.g. 'é' -> 'e') for clean grouping
  const normalized = (stripped || str.trim()).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return normalized.toLowerCase();
}

/**
 * Natural, case-insensitive, punctuation-aware comparator for music titles.
 * Ensures lowercase titles (e.g. 'action film') sort with uppercase 'A',
 * bracketed titles (e.g. '[Naijaloaded]') sort by their letter ('N'),
 * and the list cleanly ends at 'Z' with no misplaced songs following it.
 */
export function compareMusicTitles(aTitle: string, bTitle: string): number {
  const keyA = getSortKey(aTitle);
  const keyB = getSortKey(bTitle);

  // Group numeric-starting titles either naturally or before letters
  const isANum = /^[0-9]/.test(keyA);
  const isBNum = /^[0-9]/.test(keyB);
  if (isANum && !isBNum) return -1;
  if (!isANum && isBNum) return 1;

  const cmp = keyA.localeCompare(keyB, undefined, {
    sensitivity: 'base',
    numeric: true,
  });

  if (cmp !== 0) return cmp;
  return (aTitle || '').localeCompare(bTitle || '', undefined, { sensitivity: 'base' });
}

/**
 * Natural comparator for artists.
 */
export function compareMusicArtists(aArtist: string, bArtist: string): number {
  const keyA = getSortKey(aArtist);
  const keyB = getSortKey(bArtist);

  const cmp = keyA.localeCompare(keyB, undefined, {
    sensitivity: 'base',
    numeric: true,
  });

  if (cmp !== 0) return cmp;
  return (aArtist || '').localeCompare(bArtist || '', undefined, { sensitivity: 'base' });
}

/**
 * Sorts an array of tracks strictly alphabetically by title (A to Z)
 * using natural case-insensitive comparison.
 */
export function sortTracksAlphabetical(tracks: Track[]): Track[] {
  return [...tracks].sort((a, b) => compareMusicTitles(a.title, b.title));
}
