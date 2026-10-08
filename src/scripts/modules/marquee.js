import { gsap, reducedMotion, ScrollTrigger } from '../core/motion.js';

/** Infinite sector marquee whose speed and direction respond to scroll velocity. */
export function initMarquee() {
  const track = document.querySelector('[data-marquee]');
  if (!track || reducedMotion) return;

  // Duplicate content so the loop is seamless.
  track.innerHTML += track.innerHTML;

  const loop = gsap.to(track, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
  loop.totalTime(loop.duration() * 1000); // headroom so reversing never hits time 0
  let dir = 1;

  ScrollTrigger.create({
    trigger: track,
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: (self) => {
      const v = self.getVelocity();
      if (Math.abs(v) > 10) dir = v > 0 ? 1 : -1;
      const boost = 1 + Math.min(Math.abs(v) / 400, 4);
      gsap.to(loop, { timeScale: dir * boost, duration: 0.2, overwrite: true });
      gsap.to(loop, { timeScale: dir, duration: 1.2, delay: 0.2, ease: 'power2.out' });
    },
    onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
  });
}
