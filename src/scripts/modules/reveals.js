import { gsap, reducedMotion, ScrollTrigger } from '../core/motion.js';

/** Wraps each <br>-separated line of a heading so it can slide up from a mask. */
function splitLines(el) {
  const lines = el.innerHTML.split(/<br\s*\/?>/i);
  el.innerHTML = lines
    .map((html) => `<span class="split-line"><span class="split-line__inner">${html.trim()}</span></span>`)
    .join('');
  return el.querySelectorAll('.split-line__inner');
}

/** Scroll-triggered reveals for split headings and [data-reveal] blocks outside the hero. */
export function initReveals() {
  const splits = document.querySelectorAll('[data-split]');
  const blocks = [...document.querySelectorAll('[data-reveal]')].filter((el) => !el.closest('.hero'));

  if (reducedMotion) {
    gsap.set(blocks, { opacity: 1, y: 0 });
    return;
  }

  splits.forEach((el) => {
    const inners = splitLines(el);
    gsap.set(inners, { yPercent: 110 });
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => gsap.to(inners, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.09 }),
    });
  });

  ScrollTrigger.batch(blocks, {
    start: 'top 88%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.08 }),
  });
}
