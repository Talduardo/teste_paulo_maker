/**
 * main.js
 * Paulo Maker — Premium Interaction Layer
 * Lenis + GSAP ScrollTrigger + SplitText + Magnetic + Parallax
 */

(function () {
  'use strict';

  /* ─── LENIS SMOOTH SCROLL ───────────────────────────── */
  let lenis;
  function initLenis() {
    if (typeof Lenis === 'undefined') return;
    lenis = new Lenis({
      duration: 1.25,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      smooth: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Sync GSAP ScrollTrigger with Lenis
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(time => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  /* ─── CUSTOM CURSOR ─────────────────────────────────── */
  function initCursor() {
    const isTouch = window.matchMedia('(pointer:coarse)').matches;
    if (isTouch) return;

    const dot   = document.getElementById('cur-dot');
    const ring  = document.getElementById('cur-ring');
    const label = document.getElementById('cur-label');
    if (!dot || !ring) return;

    let mx = -100, my = -100, rx = -100, ry = -100;

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top  = my + 'px';
      if (label) {
        label.style.left = mx + 'px';
        label.style.top  = my + 'px';
      }
    });

    (function ringLoop() {
      rx += (mx - rx) * 0.10;
      ry += (my - ry) * 0.10;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      requestAnimationFrame(ringLoop);
    })();

    const hoverEls = document.querySelectorAll('a, button, .team-card, .svc-card, .ev-item, .soc-btn, [data-cursor]');
    hoverEls.forEach(el => {
      el.addEventListener('mouseenter', () => {
        document.body.classList.add('cur-hover');
        if (label && el.dataset.cursor) label.textContent = el.dataset.cursor;
      });
      el.addEventListener('mouseleave', () => {
        document.body.classList.remove('cur-hover');
        if (label) label.textContent = '';
      });
    });
  }

  /* ─── NAV ───────────────────────────────────────────── */
  function initNav() {
    const nav = document.getElementById('topnav');
    if (!nav) return;
    window.addEventListener('scroll', () => {
      nav.classList.toggle('stuck', scrollY > 70);
    }, { passive: true });
  }

  /* ─── PROGRESS BAR ──────────────────────────────────── */
  function initProgressBar() {
    const bar = document.getElementById('progress-bar');
    if (!bar) return;
    window.addEventListener('scroll', () => {
      const h = document.documentElement;
      const pct = h.scrollTop / (h.scrollHeight - h.clientHeight) * 100;
      bar.style.width = pct + '%';
    }, { passive: true });
  }

  /* ─── HAMBURGER ─────────────────────────────────────── */
  function initHamburger() {
    const hamBtn  = document.getElementById('ham-btn');
    const mobMenu = document.getElementById('mob-menu');
    const links   = document.querySelectorAll('.mob-nav-link');
    if (!hamBtn || !mobMenu) return;

    const open  = () => { hamBtn.classList.add('open');  mobMenu.classList.add('open');  hamBtn.setAttribute('aria-expanded','true');  document.body.style.overflow = 'hidden'; };
    const close = () => { hamBtn.classList.remove('open'); mobMenu.classList.remove('open'); hamBtn.setAttribute('aria-expanded','false'); document.body.style.overflow = ''; };

    hamBtn.addEventListener('click', () => mobMenu.classList.contains('open') ? close() : open());
    links.forEach(link => {
      link.addEventListener('click', close);
      link.addEventListener('touchend', function(e) {
        e.preventDefault();
        const href = this.getAttribute('href');
        close();
        setTimeout(() => { const t = document.querySelector(href); if (t) t.scrollIntoView({ behavior: 'smooth' }); }, 320);
      }, { passive: false });
    });
    mobMenu.addEventListener('click', e => { if (e.target === mobMenu) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && mobMenu.classList.contains('open')) close(); });
  }

  /* ─── MAGNETIC BUTTONS ──────────────────────────────── */
  function initMagnetic() {
    const isTouch = window.matchMedia('(pointer:coarse)').matches;
    if (isTouch) return;
    document.querySelectorAll('.btn-magnetic').forEach(wrap => {
      const btn = wrap.firstElementChild;
      wrap.addEventListener('mousemove', e => {
        const r = wrap.getBoundingClientRect();
        const cx = (e.clientX - r.left - r.width / 2) * 0.38;
        const cy = (e.clientY - r.top  - r.height / 2) * 0.38;
        if (typeof gsap !== 'undefined') {
          gsap.to(btn, { x: cx, y: cy, duration: .4, ease: 'power2.out' });
        }
      });
      wrap.addEventListener('mouseleave', () => {
        if (typeof gsap !== 'undefined') {
          gsap.to(btn, { x: 0, y: 0, duration: .6, ease: 'elastic.out(1.2, 0.5)' });
        }
      });
    });
  }

  /* ─── HERO MOUSE PARALLAX (fallback CSS if no WebGL) ─── */
  function initHeroParallax() {
    const isTouch = window.matchMedia('(pointer:coarse)').matches;
    if (isTouch) return;
    const hero = document.getElementById('hero');
    if (!hero) return;

    hero.addEventListener('mousemove', e => {
      const r  = hero.getBoundingClientRect();
      const cx = (e.clientX - r.left) / r.width  - 0.5;
      const cy = (e.clientY - r.top)  / r.height - 0.5;

      const vlines = document.querySelectorAll('.h-vline');
      vlines.forEach((vl, i) => {
        const mult = i === 0 ? 1 : -1;
        if (typeof gsap !== 'undefined') {
          gsap.to(vl, { x: cx * 12 * mult, duration: 1.2, ease: 'power2.out' });
        }
      });
    });
  }

  /* ─── STATS COUNTER ─────────────────────────────────── */
  function initCounters() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    document.querySelectorAll('.stat-num[data-count]').forEach(el => {
      const target  = parseInt(el.dataset.count);
      const sup     = el.querySelector('sup');
      const supHTML = sup ? sup.outerHTML : '';
      let started   = false;
      ScrollTrigger.create({
        trigger: el, start: 'top 85%',
        onEnter: () => {
          if (started) return; started = true;
          gsap.to({ val: 0 }, {
            val: target, duration: 2.4, ease: 'power2.out',
            onUpdate: function () {
              el.innerHTML = Math.round(this.targets()[0].val) + supHTML;
            }
          });
        }
      });
    });
  }

  /* ─── GSAP SCROLL REVEALS ───────────────────────────── */
  function initScrollAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    // Generic reveal — STORYTELLING: Revelação
    gsap.utils.toArray('.gsap-reveal').forEach(el => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' }
      });
    });

    // Scale reveal — STORYTELLING: Storytelling
    const scaleEls = gsap.utils.toArray('.gsap-reveal-scale');
    scaleEls.forEach((el, i) => {
      gsap.to(el, {
        opacity: 1, scale: 1, duration: 1.1, ease: 'power3.out', delay: i * 0.07,
        scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none none' }
      });
    });

    // Directional reveals
    gsap.utils.toArray('.gsap-reveal-left').forEach(el => {
      gsap.to(el, {
        opacity: 1, x: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' }
      });
    });
    gsap.utils.toArray('.gsap-reveal-right').forEach(el => {
      gsap.to(el, {
        opacity: 1, x: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' }
      });
    });

    // Phase watermarks — DIRECTION: Direcionamento
    document.querySelectorAll('.sec-phase').forEach(el => {
      gsap.fromTo(el,
        { x: -70, opacity: 0 },
        { x: 0, opacity: 1, duration: 1.5, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none none' }
        }
      );
    });

    // Hero entrance animations — STORYTELLING: Storytelling
    const phase = document.querySelector('.h-phase');
    const title = document.querySelector('.h-title');
    const divider = document.querySelector('.h-divider');
    const sub = document.querySelector('.h-sub');
    const actions = document.querySelector('.h-actions');
    const scroll = document.querySelector('.h-scroll');

    if (phase) gsap.to(phase, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', delay: .35 });
    if (title) {
      gsap.to(title, { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out', delay: .5 });
      // underline reveal
      const uw = title.querySelector('.underline-word');
      if (uw) {
        gsap.to(uw.querySelector('::after') || uw, {
          '--line-scale': 1, duration: .9, ease: 'power3.out', delay: 1.3
        });
        // Fallback: animate pseudo via GSAP CSS
        gsap.fromTo(uw, {}, {
          onComplete: () => {
            uw.style.setProperty('--ls', '1');
          }, delay: 1.2, duration: .01
        });
        // Actually trigger with CSS class
        setTimeout(() => uw.classList.add('line-reveal'), 1200);
      }
    }
    if (divider) gsap.to(divider, { opacity: 1, y: 0, duration: .8, ease: 'power3.out', delay: .75 });
    if (sub) gsap.to(sub, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', delay: .88 });
    if (actions) gsap.to(actions, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', delay: 1.0 });
    if (scroll) gsap.to(scroll, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', delay: 1.2 });

    // Section title char-by-char split text (if SplitText available)
    if (typeof SplitText !== 'undefined') {
      document.querySelectorAll('.sec-title').forEach(el => {
        const split = new SplitText(el, { type: 'lines' });
        gsap.from(split.lines, {
          opacity: 0, y: 28, stagger: 0.08, duration: 1.0, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 84%' }
        });
      });
    }

    // SVC card 3D tilt — FEEDBACK: Feedback
    const isTouch = window.matchMedia('(pointer:coarse)').matches;
    if (!isTouch) {
      document.querySelectorAll('.svc-card').forEach(card => {
        card.addEventListener('mousemove', e => {
          const r  = card.getBoundingClientRect();
          const cx = (e.clientX - r.left) / r.width  - 0.5;
          const cy = (e.clientY - r.top)  / r.height - 0.5;
          gsap.to(card, { rotateY: cx * 9, rotateX: -cy * 6, duration: .45, ease: 'power2.out', transformPerspective: 700 });
        });
        card.addEventListener('mouseleave', () => {
          gsap.to(card, { rotateY: 0, rotateX: 0, duration: .65, ease: 'power3.out' });
        });
      });

      document.querySelectorAll('.team-card').forEach(card => {
        card.addEventListener('mousemove', e => {
          const r  = card.getBoundingClientRect();
          const cx = (e.clientX - r.left) / r.width  - 0.5;
          const cy = (e.clientY - r.top)  / r.height - 0.5;
          gsap.to(card, { rotateY: cx * 6, rotateX: -cy * 5, duration: .5, ease: 'power2.out', transformPerspective: 800 });
        });
        card.addEventListener('mouseleave', () => {
          gsap.to(card, { rotateY: 0, rotateX: 0, duration: .7, ease: 'power3.out' });
        });
      });
    }
  }

  /* ─── UNDERLINE REVEAL ──────────────────────────────── */
  function initUnderlineReveal() {
    // CSS class-based trigger
    const style = document.createElement('style');
    style.textContent = `
      .underline-word::after {
        transition: transform .85s cubic-bezier(.16,1,.3,1);
      }
      .underline-word.line-reveal::after {
        transform: scaleX(1) !important;
      }
    `;
    document.head.appendChild(style);
  }

  /* ─── SECTION BACKGROUND PARALLAX ──────────────────── */
  function initSectionParallax() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    // Floating bg pieces parallax
    document.querySelectorAll('[data-parallax]').forEach(el => {
      const speed = parseFloat(el.dataset.parallax) || 0.2;
      gsap.to(el, {
        y: () => -ScrollTrigger.maxScroll(window) * speed,
        ease: 'none',
        scrollTrigger: { start: 'top top', end: 'bottom bottom', scrub: 1.5 }
      });
    });
  }

  /* ─── WEB GL INIT ───────────────────────────────────── */
  function initWebGL() {
    const canvas = document.getElementById('webgl-canvas');
    if (!canvas || typeof THREE === 'undefined') {
      console.warn('Three.js not loaded — falling back to CSS board');
      initCSSBoardFallback();
      return;
    }

    // Dynamic import of chess engine
    const script = document.createElement('script');
    script.type = 'module';
    script.textContent = `
      import { ChessEngine } from './chess-engine.js';
      const hero = document.getElementById('hero');
      if (hero) {
        try {
          window._chessEngine = new ChessEngine(hero);
          window._chessEngine.startCellGlow(420);

          // Scroll sync
          window.addEventListener('scroll', () => {
            const h = document.documentElement;
            const progress = h.scrollTop / (h.clientHeight);
            if (window._chessEngine) window._chessEngine.setScrollProgress(Math.min(1, progress));
          }, { passive: true });
        } catch(e) {
          console.warn('Chess engine error:', e);
        }
      }
    `;
    document.head.appendChild(script);
  }

  /* ─── CSS BOARD FALLBACK (if no WebGL) ─────────────── */
  function initCSSBoardFallback() {
    const grid = document.getElementById('css-board-grid');
    if (!grid) return;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = document.createElement('div');
        cell.className = 'board-cell ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
        grid.appendChild(cell);
      }
    }
    // Random cell glow
    const cells = grid.querySelectorAll('.board-cell');
    setInterval(() => {
      const idx = Math.floor(Math.random() * 64);
      const cell = cells[idx];
      if (!cell.dataset.glowing) {
        cell.dataset.glowing = '1';
        cell.classList.add('active-glow');
        setTimeout(() => { cell.classList.remove('active-glow'); delete cell.dataset.glowing; }, 1800);
      }
    }, 420);
  }

  /* ─── INIT ALL ──────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    initLenis();
    initCursor();
    initNav();
    initProgressBar();
    initHamburger();
    initMagnetic();
    initHeroParallax();
    initUnderlineReveal();
    initWebGL();

    // GSAP-dependent after slight delay for CDN load
    if (typeof gsap !== 'undefined') {
      initScrollAnimations();
      initCounters();
      initSectionParallax();
    } else {
      window.addEventListener('load', () => {
        initScrollAnimations();
        initCounters();
        initSectionParallax();
      });
    }
  });

})();
