(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  /* Theme */
  const root = document.documentElement, themeBtn = $('#theme');
  const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } },
                  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };
  const applyTheme = t => {
    root.dataset.theme = t;
    themeBtn.setAttribute('aria-label', `Switch to ${t === 'dark' ? 'light' : 'dark'} theme`);
    $('meta[name="theme-color"]').content = t === 'dark' ? '#16141c' : '#f7f5fc';
  };
  applyTheme(store.get('theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
  themeBtn.addEventListener('click', () => {
    const t = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(t); store.set('theme', t);
  });

  /* Mobile menu */
  const burger = $('#burger'), menu = $('#menu');
  const setMenu = open => { menu.classList.toggle('open', open); burger.setAttribute('aria-expanded', open); };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* Nav shadow, back-to-top */
  const nav = $('#nav'), top = $('#top');
  const onScroll = () => {
    nav.classList.toggle('scrolled', scrollY > 10);
    top.classList.toggle('show', scrollY > 600);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  top.addEventListener('click', () => scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));

  /* Active link highlighting */
  const links = $$('.menu a');
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => spy.observe(s));

  /* Scroll reveal */
  const io = new IntersectionObserver((entries, o) => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); o.unobserve(en.target); }
  }), { threshold: 0.12 });
  $$('.reveal').forEach(el => io.observe(el));

  /* Hero code editor (typed once on load) */
  const code = $('#code');
  const lines = [
    '<span class="c">// who am i</span>',
    '<span class="k">const</span> daniya = {',
    '  role: <span class="s">"Aspiring Full Stack Developer"</span>,',
    '  college: <span class="s">"Atria Institute of Technology"</span>,',
    '  graduating: <span class="s">2027</span>,',
    '  stack: [<span class="s">"React"</span>, <span class="s">"Node"</span>, <span class="s">"MongoDB"</span>],',
    '};',
    '',
    'daniya.<span class="k">build</span>(<span class="s">"something useful"</span>);'
  ];
  if (reduced) code.innerHTML = lines.join('\n');
  else {
    let i = 0, buf = '';
    const tick = () => {
      if (i >= lines.length) return;
      buf += (i ? '\n' : '') + lines[i++];
      code.innerHTML = buf;
      setTimeout(tick, 380);
    };
    tick();
  }

  /* Contact form: POST JSON to the Node backend in /server */
  // After deploying the backend separately (e.g. Render + GitHub Pages), put its URL here:
  const PROD_API = ''; // e.g. 'https://your-service.onrender.com/api/contact'
  const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
  const API = isLocal ? (location.port === '3000' ? '/api/contact' : 'http://localhost:3000/api/contact') : (PROD_API || '/api/contact');

  const form = $('#form'), status = $('#status'), btn = $('.send', form), lbl = $('.lbl', btn);
  const say = (msg, type) => { status.textContent = msg; status.className = 'status ' + (type || ''); };
  const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  const FIELDS = ['name', 'email', 'subject', 'message'];

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (btn.disabled) return;
    let bad = null;
    FIELDS.forEach(n => {
      const el = form.elements[n], v = el.value.trim();
      const fail = !v || (n === 'email' && !emailOk(v));
      el.classList.toggle('invalid', fail);
      el.setAttribute('aria-invalid', fail);
      if (fail && !bad) bad = el;
    });
    if (bad) {
      say(bad.name === 'email' && bad.value.trim() ? 'Enter a valid email address.' : 'Fill in all fields before sending.', 'err');
      bad.focus(); return;
    }

    btn.disabled = true; btn.classList.add('loading'); lbl.textContent = 'Sending…'; say('Sending your message…');
    const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 45000);
    try {
      const body = Object.fromEntries(FIELDS.concat('website').map(n => [n, form.elements[n].value]));
      const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || `Server error (${res.status}).`);
      form.reset();
      say('Message sent. Thank you, I will reply soon.', 'ok');
    } catch (err) {
      const offline = err.name === 'AbortError' || err instanceof TypeError;
      say(offline ? 'Could not reach the server. Check your connection and try again, or email daniya28fathima@gmail.com directly.' : err.message, 'err');
    } finally {
      clearTimeout(timer);
      btn.disabled = false; btn.classList.remove('loading'); lbl.textContent = 'Send Message';
    }
  });
})();
