const SOUND_URL = '/sounds/draft-complete.mp3';

/**
 * Plays the repo indexing completion chime once. Skipped when the user prefers reduced motion
 * (same signal we use for motion) or when `Audio`/`play` is unavailable.
 */
export function playRepoIndexingCompleteSound(): void {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const audio = new Audio(SOUND_URL);
  audio.volume = 0.85;
  void audio.play().catch(() => {
    // Autoplay policy or missing asset — toast still informs the user
  });
}
