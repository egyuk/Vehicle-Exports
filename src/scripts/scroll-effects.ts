/**
 * Shared scroll scheduler.
 *
 * Effects register a read step and a write step. Scroll events only schedule a
 * single animation frame; inside it every read runs before any write, so one
 * effect's style write can never invalidate layout for another effect's
 * measurement. That read/write interleaving is what produces the browser's
 * "forced reflow while executing JavaScript" warning.
 */

type Effect = {
  read: () => unknown;
  write: (value: any) => void;
};

const effects: Effect[] = [];
let scheduled = false;

function flush() {
  scheduled = false;
  const values = effects.map(effect => effect.read());
  effects.forEach((effect, i) => effect.write(values[i]));
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(flush);
}

export function addScrollEffect<T>(read: () => T, write: (value: T) => void) {
  effects.push({ read, write });
  if (effects.length === 1) {
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
  }
  schedule();
}
