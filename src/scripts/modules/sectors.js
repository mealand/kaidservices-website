import { illustrations } from '../illustrations/index.js';
import { finePointer, gsap, reducedMotion, ScrollTrigger } from '../core/motion.js';

/** Mounts each sector illustration, draws it on when scrolled into view and adds pointer tilt. */
export function initSectors() {
  document.querySelectorAll('[data-illustration]').forEach((figure) => {
    const build = illustrations[figure.dataset.illustration];
    if (!build) return;
    figure.innerHTML = build();
    const svg = figure.querySelector('svg');
    const lines = svg.querySelectorAll('.l');

    if (reducedMotion) {
      gsap.set(lines, { strokeDashoffset: 0 });
      svg.classList.add('is-drawn');
      return;
    }

    ScrollTrigger.create({
      trigger: figure,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        gsap.to(lines, {
          strokeDashoffset: 0,
          duration: 1.6,
          ease: 'power2.inOut',
          stagger: { amount: 1.4, from: 'start' },
        });
        gsap.delayedCall(1.1, () => svg.classList.add('is-drawn'));
      },
    });
  });

  if (!finePointer || reducedMotion) return;

  document.querySelectorAll('[data-sector]').forEach((card) => {
    const rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    const ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    gsap.set(card, { transformPerspective: 1200 });

    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', `${px * 100}%`);
      card.style.setProperty('--my', `${py * 100}%`);
      ry((px - 0.5) * 6);
      rx((0.5 - py) * 6);
    });
    card.addEventListener('pointerleave', () => {
      rx(0);
      ry(0);
    });
  });
}
