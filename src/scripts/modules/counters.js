import { gsap, reducedMotion, ScrollTrigger } from '../core/motion.js';

/** Animates an element's number from 0 to `to`, keeping prefix/suffix and thousands separators. */
export function countUp(el, to = Number(el.dataset.countTo ?? el.dataset.uiCount), duration = 1.6) {
  const decimals = Number(el.dataset.decimals ?? 0);
  const suffix = el.dataset.suffix ?? '';
  const fmt = (v) => v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
  if (reducedMotion) {
    el.textContent = fmt(to);
    return;
  }
  const state = { v: 0 };
  gsap.to(state, { v: to, duration, ease: 'power2.out', onUpdate: () => (el.textContent = fmt(state.v)) });
}

/** Scroll-triggered counters for any [data-count-to] element. */
export function initCounters() {
  document.querySelectorAll('[data-count-to]').forEach((el) => {
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => countUp(el) });
  });
}
