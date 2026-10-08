import { gsap, reducedMotion, ScrollTrigger } from '../core/motion.js';

/**
 * Loads the WebGL tower scene (code-split) and wires the HUD readout.
 * Returns { ready, intro } — `ready` resolves when the scene can render,
 * `intro()` plays the headline reveal and starts the build sequence.
 */
export function initHero() {
  const hero = document.querySelector('.hero');
  const canvas = hero?.querySelector('[data-hero-canvas]');
  if (!hero || !canvas) return { ready: Promise.resolve(), intro() {} };

  const hud = {
    level: hero.querySelector('[data-hud-level]'),
    pct: hero.querySelector('[data-hud-pct]'),
    status: hero.querySelector('[data-hud-status]'),
  };
  const pad = (n) => String(n).padStart(2, '0');
  const onProgress = ({ level, floors, pct, status }) => {
    hud.level.textContent = `L${pad(level)} / ${floors}`;
    hud.pct.textContent = `${pct}%`;
    hud.status.textContent = status;
  };

  // Headline starts masked below its line; the preloader covers this state.
  const lines = hero.querySelectorAll('.line__inner');
  if (!reducedMotion) gsap.set(lines, { yPercent: 110 });

  let scene = null;
  const ready = import('../three/tower-scene.js')
    .then(({ createTowerScene }) => {
      scene = createTowerScene(canvas, { reducedMotion, onProgress });
    })
    .catch((err) => {
      console.warn('[hero] WebGL scene unavailable, using static fallback.', err);
      hero.classList.add('no-webgl');
      onProgress({ level: 24, floors: 24, pct: 100, status: 'Coming soon' });
    });

  // Scroll: lift the camera and drift the copy as the hero leaves.
  ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: 'bottom top',
    onUpdate: (self) => scene?.setScroll(self.progress),
  });
  if (!reducedMotion) {
    gsap.to(hero.querySelector('.hero__inner'), {
      yPercent: -18,
      opacity: 0.2,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    });
  }

  function intro() {
    const reveals = hero.querySelectorAll('[data-reveal]');
    if (reducedMotion) {
      gsap.set(lines, { yPercent: 0 });
      gsap.set(reveals, { opacity: 1, y: 0 });
      scene?.start();
      return;
    }
    gsap
      .timeline({ defaults: { ease: 'expo.out' } })
      .add(() => scene?.start())
      .to(lines, { yPercent: 0, duration: 1.4, stagger: 0.12 }, 0.1)
      .to(reveals, { opacity: 1, y: 0, duration: 1.1, stagger: 0.1 }, 0.5)
      .from('.site-header', { opacity: 0, duration: 1.2 }, 0.3);
  }

  return { ready, intro };
}
