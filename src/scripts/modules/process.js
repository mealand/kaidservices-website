import { gsap, reducedMotion } from '../core/motion.js';
import { countUp } from './counters.js';

/**
 * Platform teaser: on wide screens the stage cards scroll horizontally inside a pinned
 * section; on small screens they stack. Each card's mock UI animates when it becomes active.
 */
export function initProcess() {
  const section = document.querySelector('[data-process]');
  if (!section) return;
  const track = section.querySelector('[data-process-track]');
  const stages = [...section.querySelectorAll('[data-stage]')];
  const countEl = section.querySelector('[data-process-count]');
  const barEl = section.querySelector('[data-process-bar]');

  const activate = (stage) => {
    if (stage.classList.contains('is-active')) return;
    stage.classList.add('is-active');
    stage.querySelectorAll('[data-ui-count]').forEach((el) => countUp(el, Number(el.dataset.uiCount), 1.8));
  };

  // Activation works for both layouts: IntersectionObserver also sees transformed positions.
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && activate(e.target)),
    { threshold: 0.6 },
  );
  stages.forEach((s) => io.observe(s));

  if (reducedMotion) {
    stages.forEach(activate);
    return;
  }

  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    // Travel until the last card sits one gutter from the right edge.
    const distance = () => {
      const last = stages[stages.length - 1];
      const gutter = parseFloat(getComputedStyle(track).paddingLeft) || 0;
      return Math.max(0, last.offsetLeft + last.offsetWidth + Math.min(gutter, 56) - window.innerWidth);
    };
    gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: section.querySelector('.process__pin'),
        scrub: 0.8,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const i = Math.min(stages.length, Math.floor(self.progress * stages.length) + 1);
          countEl.textContent = String(i).padStart(2, '0');
          barEl.style.transform = `scaleX(${Math.max(1 / stages.length, self.progress)})`;
        },
      },
    });
  });
}
