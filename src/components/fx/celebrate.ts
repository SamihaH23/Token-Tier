import confetti from 'canvas-confetti';

const COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b'];

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Small burst from an element (or the bottom of the screen). */
export function burstFrom(el?: Element | null, particleCount = 28) {
  if (reduced()) return;
  let origin = { x: 0.5, y: 0.8 };
  if (el) {
    const r = el.getBoundingClientRect();
    origin = { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight };
  }
  void confetti({ particleCount, spread: 60, startVelocity: 28, scalar: 0.8, origin, colors: COLORS, disableForReducedMotion: true });
}

/** Big two-sided celebration, e.g. when an eval run finishes. */
export function celebrateBig() {
  if (reduced()) return;
  const opts = { particleCount: 70, spread: 75, startVelocity: 45, colors: COLORS, disableForReducedMotion: true };
  void confetti({ ...opts, angle: 60, origin: { x: 0, y: 0.75 } });
  void confetti({ ...opts, angle: 120, origin: { x: 1, y: 0.75 } });
}
