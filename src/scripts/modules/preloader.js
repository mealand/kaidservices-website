import { gsap, reducedMotion } from '../core/motion.js';

/**
 * Shows the preloader until `ready` resolves (and at least `minTime` ms have passed),
 * then wipes it away. Resolves once the page is revealed.
 */
export function runPreloader(ready, { minTime = 1600 } = {}) {
  const el = document.querySelector('[data-preloader]');
  if (!el) return Promise.resolve();

  const countEl = el.querySelector('[data-preloader-count]');
  const barEl = el.querySelector('[data-preloader-bar]');
  const progress = { v: 0 };
  const render = () => {
    countEl.textContent = Math.round(progress.v);
    barEl.style.transform = `scaleX(${progress.v / 100})`;
  };

  document.body.classList.add('is-loading');

  if (reducedMotion) {
    return ready.then(() => {
      el.remove();
      document.body.classList.remove('is-loading');
    });
  }

  // Creep toward 90% while assets load, then finish.
  const creep = gsap.to(progress, { v: 90, duration: minTime / 1000, ease: 'power1.out', onUpdate: render });
  const minWait = new Promise((r) => setTimeout(r, minTime));

  return Promise.all([ready.catch(() => {}), minWait]).then(
    () =>
      new Promise((resolve) => {
        creep.kill();
        gsap
          .timeline({
            onComplete: () => {
              el.remove();
              resolve();
            },
          })
          .to(progress, { v: 100, duration: 0.5, ease: 'power2.out', onUpdate: render })
          .add(() => document.body.classList.remove('is-loading'))
          .to(el.querySelector('.preloader__center'), { y: -30, opacity: 0, duration: 0.5, ease: 'power2.in' }, '+=0.1')
          .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, '-=0.2');
      }),
  );
}
