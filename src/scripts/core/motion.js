import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

let lenis = null;

/** Smooth scrolling wired into GSAP's ticker so ScrollTrigger stays in sync. */
export function initSmoothScroll() {
  if (reducedMotion) return null;
  lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Route in-page anchor links through Lenis.
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: 0 });
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
  return lenis;
}

export const getLenis = () => lenis;

/** Calls `onEnter`/`onLeave` as an element enters/leaves the viewport. Returns a disconnect fn. */
export function observeVisibility(el, onChange, options = {}) {
  const io = new IntersectionObserver(([entry]) => onChange(entry.isIntersecting, entry), {
    rootMargin: '100px 0px',
    ...options,
  });
  io.observe(el);
  return () => io.disconnect();
}
