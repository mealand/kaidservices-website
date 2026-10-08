/** Live countdown to the configured launch date. */
export function initCountdown(launchDate) {
  const root = document.querySelector('[data-countdown]');
  if (!root) return;
  const target = new Date(launchDate).getTime();
  const units = {
    d: root.querySelector('[data-unit="d"]'),
    h: root.querySelector('[data-unit="h"]'),
    m: root.querySelector('[data-unit="m"]'),
    s: root.querySelector('[data-unit="s"]'),
  };
  const pad = (n) => String(n).padStart(2, '0');

  const set = (el, value) => {
    if (el.textContent === value) return;
    el.textContent = value;
    el.classList.remove('is-tick');
    void el.offsetWidth; // restart the tick animation
    el.classList.add('is-tick');
  };

  let timer = 0;
  const tick = () => {
    const diff = Math.max(0, target - Date.now());
    if (Number.isNaN(target) || diff === 0) {
      root.classList.add('is-live');
      Object.values(units).forEach((el) => (el.textContent = '00'));
      clearInterval(timer);
      return;
    }
    const s = Math.floor(diff / 1000);
    set(units.d, pad(Math.floor(s / 86400)));
    set(units.h, pad(Math.floor((s % 86400) / 3600)));
    set(units.m, pad(Math.floor((s % 3600) / 60)));
    set(units.s, pad(s % 60));
  };
  tick();
  timer = setInterval(tick, 1000);
}
