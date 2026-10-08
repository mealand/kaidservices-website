const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Launch-list signup. Posts to the PHP endpoint; works without JS as a plain form POST. */
export function initNotifyForm(endpoint) {
  const form = document.querySelector('[data-notify-form]');
  if (!form) return;
  const input = form.querySelector('input[type="email"]');
  const button = form.querySelector('button[type="submit"]');
  const msg = form.querySelector('[data-form-msg]');

  const say = (text, kind = '') => {
    msg.textContent = text;
    msg.className = `notify-form__msg ${kind ? `is-${kind}` : ''}`;
  };

  // Confirmation after a no-JS submit redirected back here.
  if (new URLSearchParams(location.search).get('subscribed') === '1') {
    say("You're on the list. We'll be in touch at launch.", 'ok');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = input.value.trim();
    if (!EMAIL_RE.test(email)) {
      say('Please enter a valid email address.', 'error');
      input.focus();
      return;
    }

    button.disabled = true;
    say('Adding you to the list…');

    try {
      let ok;
      let message;
      if (import.meta.env.DEV) {
        // The PHP endpoint only runs on the live host; simulate it locally.
        await new Promise((r) => setTimeout(r, 700));
        ok = true;
      } else {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(form),
        });
        const data = await res.json().catch(() => ({}));
        ok = res.ok && data.ok;
        message = data.message;
      }

      if (ok) {
        say(message || "You're on the list. We'll be in touch at launch.", 'ok');
        form.classList.add('is-done');
        form.reset();
      } else {
        say(message || 'Something went wrong. Please try again.', 'error');
      }
    } catch {
      say('Network error. Please try again shortly.', 'error');
    } finally {
      button.disabled = false;
    }
  });
}
