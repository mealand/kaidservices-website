import { finePointer, gsap, reducedMotion } from '../core/motion.js';

/** Custom blend-mode cursor and magnetic hover for [data-magnetic] elements (fine pointers only). */
export function initCursor() {
  if (!finePointer || reducedMotion) return;
  const cursor = document.querySelector('[data-cursor]');
  if (!cursor) return;
  document.documentElement.classList.add('has-cursor');

  const dot = cursor.querySelector('.cursor__dot');
  const ring = cursor.querySelector('.cursor__ring');
  const dotX = gsap.quickTo(dot, 'x', { duration: 0.1 });
  const dotY = gsap.quickTo(dot, 'y', { duration: 0.1 });
  const ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' });

  window.addEventListener(
    'pointermove',
    (e) => {
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
    },
    { passive: true },
  );

  document.addEventListener('pointerover', (e) => {
    cursor.classList.toggle('is-hover', !!e.target.closest('a, button, input, [data-sector]'));
  });
  document.addEventListener('pointerleave', () => gsap.to(cursor, { opacity: 0, duration: 0.2 }));
  document.addEventListener('pointerenter', () => gsap.to(cursor, { opacity: 1, duration: 0.2 }));

  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - (r.left + r.width / 2)) * 0.3);
      y((e.clientY - (r.top + r.height / 2)) * 0.4);
    });
    el.addEventListener('pointerleave', () => {
      x(0);
      y(0);
    });
  });
}
