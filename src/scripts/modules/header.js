import { ScrollTrigger } from '../core/motion.js';

/** Frosted header after leaving the top; hides on scroll down, returns on scroll up. */
export function initHeader() {
  const header = document.querySelector('[data-header]');
  if (!header) return;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const y = self.scroll();
      header.classList.toggle('is-scrolled', y > 40);
      header.classList.toggle('is-hidden', y > window.innerHeight * 0.8 && self.direction === 1);
    },
  });
}
