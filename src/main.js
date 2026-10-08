import './styles/main.css';

import { site } from './config.js';
import { initSmoothScroll, reducedMotion, ScrollTrigger } from './scripts/core/motion.js';
import { initCountdown } from './scripts/modules/countdown.js';
import { initCounters } from './scripts/modules/counters.js';
import { initCursor } from './scripts/modules/cursor.js';
import { initHeader } from './scripts/modules/header.js';
import { initHero } from './scripts/modules/hero.js';
import { initLiveFeed } from './scripts/modules/live-feed.js';
import { initMarquee } from './scripts/modules/marquee.js';
import { initNotifyForm } from './scripts/modules/notify-form.js';
import { runPreloader } from './scripts/modules/preloader.js';
import { initProcess } from './scripts/modules/process.js';
import { initReveals } from './scripts/modules/reveals.js';
import { initSectors } from './scripts/modules/sectors.js';

document.documentElement.classList.add('js');
if (reducedMotion) document.documentElement.classList.add('no-motion');

const year = document.querySelector('[data-year]');
if (year) year.textContent = new Date().getFullYear();

// Start at the top so the intro always plays from the hero.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

const lenis = initSmoothScroll();
lenis?.stop();

const hero = initHero();
initHeader();
initCountdown(site.launchDate);
initMarquee();
initSectors();
initProcess();
initLiveFeed();
initCounters();
initReveals();
initNotifyForm(site.subscribeEndpoint);
initCursor();

const fontsReady = document.fonts?.ready ?? Promise.resolve();
runPreloader(Promise.all([hero.ready, fontsReady])).then(() => {
  lenis?.start();
  ScrollTrigger.refresh();
  hero.intro();
});
