/* =====================================================================
   effects.js – VISUAL EFFECTS ONLY
   Handles animations, theme switching and scroll behaviour.
   It never talks to the server and never changes portfolio data.
   All data loading / rendering / CRUD stays in app.js.
   ===================================================================== */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function raf(fn) { return window.requestAnimationFrame(fn); }

  /* ---------- 1. Theme toggle (remembered in this browser) ---------- */
  var themeBtn = $('#themeToggle');
  var themeMeta = $('meta[name="theme-color"]');
  function applyThemeMeta() {
    if (themeMeta) themeMeta.setAttribute('content', root.getAttribute('data-theme') === 'light' ? '#f4f5fb' : '#06070d');
  }
  applyThemeMeta();
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('rz-theme', next); } catch (e) {}
      applyThemeMeta();
    });
  }

  /* ---------- 2. Scroll: progress bar, sticky header, back-to-top, timeline fill ---------- */
  var progress = $('#scrollProgress');
  var topbar = $('#topbar');
  var toTop = $('#toTop');
  var timeline = $('#educationList');
  var ticking = false;

  function onScroll() {
    var y = window.pageYOffset || root.scrollTop;
    var max = root.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    if (topbar) topbar.classList.toggle('scrolled', y > 12);
    if (toTop) toTop.classList.toggle('show', y > 700);
    if (timeline) {
      var r = timeline.getBoundingClientRect();
      var start = window.innerHeight * 0.75;
      var p = (start - r.top) / Math.max(r.height, 1);
      timeline.style.setProperty('--tl', Math.max(0, Math.min(1, p)).toFixed(3));
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; raf(onScroll); } }, { passive: true });
  window.addEventListener('resize', function () { raf(onScroll); });
  onScroll();

  if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });

  // Header gets a solid background while the mobile menu is open
  var menuToggle = $('#menuToggle');
  var mainNav = $('#mainNav');
  if (menuToggle && mainNav && topbar) {
    var syncMenu = function () { topbar.classList.toggle('menu-open', mainNav.classList.contains('open')); };
    new MutationObserver(syncMenu).observe(mainNav, { attributes: true, attributeFilter: ['class'] });
  }

  /* ---------- 3. Highlight the nav link of the section in view ---------- */
  var navLinks = $$('#mainNav > a');
  var sections = navLinks.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = '#' + entry.target.id;
        navLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { navObserver.observe(s); });
  }

  /* ---------- 4. Scroll-reveal (static blocks + cards that app.js renders) ---------- */
  var revealObserver = null;
  if ('IntersectionObserver' in window && !reduceMotion) {
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  }
  function reveal(el, index) {
    if (!revealObserver) { el.classList.add('in'); return; }
    if (el.classList.contains('reveal')) return;
    if (index != null) el.style.setProperty('--i', index);
    el.classList.add('reveal');
    revealObserver.observe(el);
  }
  $$('[data-reveal]').forEach(function (el) {
    var i = parseFloat(el.style.getPropertyValue('--i'));
    reveal(el, isNaN(i) ? null : i);
  });

  /* ---------- 5. Watch the lists that app.js fills in ---------- */
  var listIds = ['skillsList', 'educationList', 'experienceList', 'projectsList'];
  var CARD_SELECTOR = '.skill-pill, .timeline-card, .experience-card, .project-card, .empty-state';

  function hueFor(text) {                       // same category => same colour
    var h = 0, s = String(text || '');
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return h;
  }

  function decorateList(list) {
    var cards = $$(CARD_SELECTOR, list);
    cards.forEach(function (card, i) {
      if (card.classList.contains('skill-pill')) {
        var cat = $('.skill-category', card);
        card.style.setProperty('--h', hueFor(cat ? cat.textContent.trim().toLowerCase() : 'technical'));
        reveal(card, Math.min(i, 14) * 0.5);
      } else {
        reveal(card, Math.min(i, 6));
      }
    });
  }

  /* ---------- 6. Skills marquee + animated counters ---------- */
  var marquee = $('#marquee');
  var marqueeTrack = $('#marqueeTrack');
  var lastMarqueeKey = '';

  function skillNames() {
    return $$('#skillsList .skill-pill > span').map(function (s) {
      var node = s.firstChild;
      return node && node.nodeType === 3 ? node.textContent.trim() : '';
    }).filter(Boolean);
  }
  function buildMarquee() {
    if (!marquee || !marqueeTrack) return;
    var names = skillNames();
    var key = names.join('|');
    if (key === lastMarqueeKey) return;
    lastMarqueeKey = key;
    if (!names.length) { marquee.hidden = true; marqueeTrack.textContent = ''; return; }
    var reps = Math.max(1, Math.ceil(20 / names.length));
    var frag = doc.createDocumentFragment();
    for (var copy = 0; copy < 2; copy++) {          // two identical halves => seamless loop
      for (var r = 0; r < reps; r++) {
        names.forEach(function (n) {
          var item = doc.createElement('span');
          item.className = 'marquee-item';
          item.textContent = n;                      // textContent: user data is never parsed as HTML
          frag.appendChild(item);
        });
      }
    }
    marqueeTrack.textContent = '';
    marqueeTrack.appendChild(frag);
    marquee.hidden = false;
  }

  var statEls = $$('[data-stat]');
  var statTargets = { projects: 0, skills: 0, domains: 0 };
  var statStarted = false;
  function countAnimate(el, to) {
    var from = parseInt(el.textContent, 10) || 0;
    if (reduceMotion || from === to) { el.textContent = to; return; }
    var t0 = null, dur = 1100;
    function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * eased);
      if (p < 1) raf(step);
    }
    raf(step);
  }
  function updateStats() {
    var cats = {};
    $$('#skillsList .skill-category').forEach(function (c) { cats[c.textContent.trim().toLowerCase()] = true; });
    statTargets.projects = $$('#projectsList .project-card').length;
    statTargets.skills = $$('#skillsList .skill-pill').length;
    statTargets.domains = Object.keys(cats).length;
    statEls.forEach(function (el) { countAnimate(el, statTargets[el.getAttribute('data-stat')] || 0); });
    statStarted = true;
  }

  var refreshTimer = null;
  function onListChange(list) {
    decorateList(list);
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function () { buildMarquee(); updateStats(); }, 60);
  }
  listIds.forEach(function (id) {
    var list = doc.getElementById(id);
    if (!list) return;
    new MutationObserver(function () { onListChange(list); }).observe(list, { childList: true });
    if (list.querySelector(CARD_SELECTOR)) onListChange(list);
  });

  /* ---------- 7. Mouse-follow spotlight on cards ---------- */
  var SPOT = '.glass-card, .skill-pill, .timeline-card, .experience-card, .project-card, .contact-card';
  if (finePointer) {
    doc.addEventListener('mousemove', function (e) {
      var card = e.target.closest ? e.target.closest(SPOT) : null;
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

  /* ---------- 8. 3D tilt on project cards ---------- */
  if (finePointer && !reduceMotion) {
    doc.addEventListener('mousemove', function (e) {
      var card = e.target.closest ? e.target.closest('.project-card') : null;
      if (!card) return;
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty('--ry', (x * 7).toFixed(2) + 'deg');
      card.style.setProperty('--rx', (-y * 7).toFixed(2) + 'deg');
    }, { passive: true });
    doc.addEventListener('mouseout', function (e) {
      var card = e.target.closest ? e.target.closest('.project-card') : null;
      if (!card || (e.relatedTarget && card.contains(e.relatedTarget))) return;
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  }

  /* ---------- 9. Hero parallax (portrait + chips follow the mouse) ---------- */
  var hero = $('#home');
  var heroVisual = $('#heroVisual');
  if (hero && heroVisual && finePointer && !reduceMotion) {
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      heroVisual.style.setProperty('--px', (((e.clientX - r.left) / r.width) - 0.5).toFixed(3));
      heroVisual.style.setProperty('--py', (((e.clientY - r.top) / r.height) - 0.5).toFixed(3));
    }, { passive: true });
    hero.addEventListener('mouseleave', function () {
      heroVisual.style.setProperty('--px', 0);
      heroVisual.style.setProperty('--py', 0);
    });
  }

  /* ---------- 10. Cursor glow ---------- */
  var glow = $('#cursorGlow');
  if (glow && finePointer && !reduceMotion) {
    var gx = window.innerWidth / 2, gy = window.innerHeight / 3, tx = gx, ty = gy;
    window.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; glow.classList.add('on'); }, { passive: true });
    doc.addEventListener('mouseleave', function () { glow.classList.remove('on'); });
    (function loop() {
      gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
      glow.style.transform = 'translate3d(' + gx.toFixed(1) + 'px,' + gy.toFixed(1) + 'px,0)';
      raf(loop);
    })();
  }

  /* ---------- 11. Typing effect in the hero ---------- */
  var typed = $('#typedText');
  if (typed) {
    var words = (typed.getAttribute('data-words') || '').split('|').map(function (w) { return w.trim(); }).filter(Boolean);
    if (words.length) {
      if (reduceMotion) { typed.textContent = words[0]; }
      else {
        var wi = 0, ci = 0, deleting = false;
        (function tick() {
          var word = words[wi];
          typed.textContent = word.slice(0, ci);
          var delay = deleting ? 38 : 82;
          if (!deleting && ci === word.length) { deleting = true; delay = 1700; }
          else if (deleting && ci === 0) { deleting = false; wi = (wi + 1) % words.length; delay = 380; }
          ci += deleting ? -1 : 1;
          setTimeout(tick, delay);
        })();
      }
    }
  }

  /* ---------- 12. Small details ---------- */
  // Close the mobile menu when tapping outside it
  doc.addEventListener('click', function (e) {
    if (!mainNav || !mainNav.classList.contains('open')) return;
    if (mainNav.contains(e.target) || (menuToggle && menuToggle.contains(e.target))) return;
    mainNav.classList.remove('open');
  });

  // Nothing renders until the API answers, so make sure counters/marquee also run on a late first paint
  window.addEventListener('load', function () { raf(function () { onScroll(); if (!statStarted) { buildMarquee(); updateStats(); } }); });
})();
