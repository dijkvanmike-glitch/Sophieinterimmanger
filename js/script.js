/* ============================================================
   Sophie Broers — Interim Management
   Interactions v2: preloader, nav, reveals, counters, cursor,
   magnetic buttons, scroll progress, FAQ, contact form
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- Preloader --- */
  const preloader = document.getElementById('preloader');
  const hidePreloader = () => preloader && preloader.classList.add('preloader--done');
  window.addEventListener('load', () => setTimeout(hidePreloader, 600));
  // Safety fallback: never trap the page behind the loader
  setTimeout(hidePreloader, 2600);

  /* --- Year in footer --- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* --- Sticky nav background on scroll --- */
  const nav = document.getElementById('nav');
  const toTop = document.getElementById('toTop');
  const progress = document.getElementById('scrollProgress');

  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('nav--scrolled', y > 40);
    if (toTop) toTop.classList.toggle('to-top--show', y > 600);
    if (progress) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* --- Mobile menu --- */
  const toggle = document.getElementById('navToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('nav--open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen');
    });
    nav.querySelectorAll('.nav__links a').forEach((link) =>
      link.addEventListener('click', () => {
        nav.classList.remove('nav--open');
        toggle.setAttribute('aria-expanded', 'false');
      })
    );
  }

  /* --- Scroll reveal --- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !prefersReduced) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }

  /* --- Animated stat counters --- */
  const counters = document.querySelectorAll('.stat__num');
  const runCounter = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const duration = 1600;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = prefix + Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window && !prefersReduced) {
    const co = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            co.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => co.observe(el));
  } else {
    counters.forEach((el) => (el.textContent = (el.dataset.prefix || '') + el.dataset.count + (el.dataset.suffix || '')));
  }

  /* --- Hero parallax on background --- */
  const heroBg = document.querySelector('.hero__bg');
  if (heroBg && !prefersReduced) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y < window.innerHeight) heroBg.style.transform = `translateY(${y * 0.15}px) scale(1.05)`;
    }, { passive: true });
  }

  /* --- Custom cursor + magnetic buttons (desktop, fine pointer) --- */
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine && !prefersReduced) {
    const cursor = document.getElementById('cursor');
    const dot = document.getElementById('cursorDot');
    let mx = 0, my = 0, cx = 0, cy = 0;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      if (dot) { dot.style.left = mx + 'px'; dot.style.top = my + 'px'; }
    });

    const render = () => {
      cx += (mx - cx) * 0.18;
      cy += (my - cy) * 0.18;
      if (cursor) { cursor.style.left = cx + 'px'; cursor.style.top = cy + 'px'; }
      requestAnimationFrame(render);
    };
    render();

    document.querySelectorAll('[data-cursor="hover"], a, button').forEach((el) => {
      el.addEventListener('mouseenter', () => cursor && cursor.classList.add('cursor--hover'));
      el.addEventListener('mouseleave', () => cursor && cursor.classList.remove('cursor--hover'));
    });

    // Magnetic effect
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* --- FAQ: close others when one opens (accordion) --- */
  const faqItems = document.querySelectorAll('.faq__item');
  faqItems.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        faqItems.forEach((other) => { if (other !== item) other.open = false; });
      }
    });
  });

  /* --- Contact form → open mail client pre-filled --- */
  const form = document.getElementById('contactForm');
  const note = document.getElementById('formNote');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();

      if (!name || !email || !message) {
        if (note) note.textContent = 'Vul je naam, e-mailadres en bericht in.';
        return;
      }
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!emailOk) {
        if (note) note.textContent = 'Controleer je e-mailadres.';
        return;
      }

      const subject = encodeURIComponent(`Interim-aanvraag via website — ${name}`);
      const body = encodeURIComponent(
        `Naam: ${name}\nE-mail: ${email}\n\n${message}`
      );
      window.location.href = `mailto:sophie_broers@hotmail.com?subject=${subject}&body=${body}`;
      if (note) note.textContent = 'Je mailprogramma wordt geopend met je bericht — verstuur het om af te ronden.';
      form.reset();
    });
  }
});
