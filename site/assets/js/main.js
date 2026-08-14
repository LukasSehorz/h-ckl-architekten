/* =========================================================
   Häckl Architekten — Motion
   Animationslogik 1:1 nach Referenz (GSAP + ScrollTrigger,
   ScrollSmoother durch Lenis ersetzt, SplitText durch
   eigenen Zeilen-Splitter).
   ========================================================= */
(function () {
  'use strict';

  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

  const EASE = 'M0,0 C0.3,0 0.09,1 1,1';
  // CustomEase ist Club-only -> exakter kubischer Ersatz der Referenzkurve
  const CUSTOM = 'cubic-bezier(0.3, 0, 0.09, 1)';
  const customEase = CustomBezier(0.3, 0, 0.09, 1);

  function CustomBezier(x1, y1, x2, y2) {
    // Numerische Auswertung einer kubischen Bezier als GSAP-Ease
    return function (t) {
      let start = 0, end = 1, mid, x;
      for (let i = 0; i < 18; i++) {
        mid = (start + end) / 2;
        x = bez(mid, x1, x2);
        if (x < t) start = mid; else end = mid;
      }
      return bez((start + end) / 2, y1, y2);
    };
    function bez(t, a, b) {
      const u = 1 - t;
      return 3 * u * u * t * a + 3 * u * t * t * b + t * t * t;
    }
  }

  const easeInOutQuart = (t) => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;

  /* ---------- Mobile VH ---------- */
  function setVH() {
    document.documentElement.style.setProperty('--vh', window.innerHeight * 0.01 + 'px');
  }
  setVH();
  window.addEventListener('resize', setVH);

  /* ---------- Smooth Scroll (Lenis statt ScrollSmoother) ---------- */
  const lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.5,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  const scroller = {
    paused(state) { state ? lenis.stop() : lenis.start(); }
  };
  scroller.paused(true);

  /* ---------- Zeilen-Splitter (SplitText-Ersatz) ---------- */
  function splitLines(el) {
    const text = el.textContent.trim();
    const words = text.split(/\s+/);
    el.innerHTML = words.map(w => `<span class="w">${w}</span>`).join(' ');
    const wordEls = Array.from(el.querySelectorAll('.w'));
    const rows = [];
    let lastTop = null, current = null;
    wordEls.forEach(w => {
      const top = Math.round(w.offsetTop);
      if (lastTop === null || Math.abs(top - lastTop) > 4) {
        current = []; rows.push(current); lastTop = top;
      }
      current.push(w.textContent);
    });
    el.innerHTML = rows.map(r => `<div class="line"><span>${r.join(' ')}</span></div>`).join('');
    return Array.from(el.querySelectorAll('.line > span'));
  }

  /* =========================================================
     1) Hero-Pin
     ========================================================= */
  function initHeroParallax() {
    ['.hero_wrapper', '.hero_video', '.hero_video_overlay'].forEach(sel => {
      const el = document.querySelector(sel);
      if (!el) return;
      // pinSpacing:false -> die Portfolio-Sektion schiebt sich über den fixierten Hero
      ScrollTrigger.create({ trigger: el, start: 'top top', end: '200% bottom', pin: true, pinSpacing: false });
    });
  }

  /* =========================================================
     2) Preloader
     ========================================================= */
  const preloader = document.querySelector('.u-preloader');
  const preloaderNum = document.querySelector('.preloader_num');
  const heroHeading = document.querySelector('[data-hero-split]');
  const heroLines = heroHeading ? splitLines(heroHeading) : [];

  gsap.set('.hero_subheading', { opacity: 0 });
  gsap.set(heroLines, { yPercent: 100 });
  gsap.set('[hero-btn-secondary]', { opacity: 0 });
  gsap.set('[hero-btn-primary]', { opacity: 0 });

  const hasVisited = sessionStorage.getItem('ha_hasVisited');

  if (!hasVisited) {
    const progress = { value: 0 };
    const tl = gsap.timeline({
      onComplete() {
        gsap.set(preloader, { display: 'none', clipPath: 'none', opacity: 0 });
        gsap.set('.preloader_logo', { display: 'none' });
        scroller.paused(false);
        initHeroParallax();
        ScrollTrigger.refresh();
        sessionStorage.setItem('ha_hasVisited', 'true');
      }
    });

    tl.to(progress, {
      value: 100, duration: 1.5, ease: customEase,
      onUpdate: () => { preloaderNum.textContent = Math.round(progress.value); }
    }, 0)
      .from(preloaderNum, { duration: 1.5, y: 100, ease: customEase }, 0)
      .to(preloaderNum, { duration: 1.5, opacity: 1 }, 0)
      .to('.preloader_logo', { duration: 1.5, opacity: .03 }, 0)
      .to('.preloader_content', { duration: 1.5, opacity: 1 }, 0)
      .to(preloaderNum, { duration: .5, opacity: 0 })
      .to('.preloader_content', { duration: .5, opacity: 0 }, '<')
      .to(preloader, {
        duration: 1, ease: customEase,
        clipPath: 'polygon(0% 0%, 0% 100%, calc(50% - 7.5rem) 100%, calc(50% - 7.5rem) calc(50% - 7.5rem), calc(50% + 7.5rem) calc(50% - 7.5rem), calc(50% + 7.5rem) calc(50% + 7.5rem), calc(50% - 7.5rem) calc(50% + 7.5rem), calc(50% - 7.5rem) 100%, 100% 100%, 100% 0%)'
      }, '<')
      .fromTo('.hero_video', { scale: .8 }, { duration: 1, ease: customEase, scale: .9 }, '<')
      .to(preloader, {
        duration: 1, ease: customEase,
        clipPath: 'polygon(0% 0%, 0% 100%, calc(0% - 0.001px) 100%, calc(0% - 0.001px) calc(0% - 0.001px), calc(100% + 0.001px) calc(0% - 0.001px), calc(100% + 0.001px) calc(100% + 0.001px), calc(0% - 0.001px) calc(100% + 0.001px), calc(0% - 0.001px) 100%, 100% 100%, 100% 0%)'
      })
      .fromTo('.hero_video', { scale: .9 }, { duration: 1, ease: customEase, scale: 1 }, '<')
      .to('.hero_subheading', { duration: 1, opacity: 1 })
      .to(heroLines, { yPercent: 0, duration: 1.25, stagger: .085, ease: customEase }, '<')
      .to('[hero-btn-secondary]', { duration: 1, opacity: 1 }, '<.5')
      .to('[hero-btn-primary]', { duration: 1, opacity: 1 }, '<0.1');
  } else {
    gsap.set('.hero_subheading', { opacity: 1 });
    gsap.set(heroLines, { yPercent: 0 });
    gsap.set('[hero-btn-secondary],[hero-btn-primary]', { opacity: 1 });
    gsap.to(preloader, {
      opacity: 0, duration: 1, ease: 'power2.inOut',
      onComplete() {
        gsap.set(preloader, { display: 'none' });
        scroller.paused(false);
        ScrollTrigger.refresh();
      }
    });
    initHeroParallax();
  }

  /* =========================================================
     3) Logo-Buchstaben beim Scrollen ausblenden
     ========================================================= */
  const logoLetters = document.querySelectorAll('[data-logo-letter]');
  ScrollTrigger.create({
    trigger: '.section_hero',
    start: '1% top',
    end: 'bottom bottom',
    invalidateOnRefresh: true,
    onEnter: () => gsap.to(logoLetters, { yPercent: 150, ease: 'power3.inOut', stagger: .025 }),
    onLeaveBack: () => gsap.to(logoLetters, { yPercent: 0, ease: 'power3.inOut', stagger: .025 }),
  });

  /* =========================================================
     4) Navbar: heller Zustand über Hero + CTA
     ========================================================= */
  const navbar = document.querySelector('.navbar');
  navbar.classList.add('on_hero');
  [['.section_hero', '-10% top', '50% top'], ['.section_cta', 'top top', 'bottom top']].forEach(([sel, start, end]) => {
    ScrollTrigger.create({
      trigger: sel, start, end,
      onEnter: () => navbar.classList.add('on_hero'),
      onLeave: () => navbar.classList.remove('on_hero'),
      onEnterBack: () => navbar.classList.add('on_hero'),
      onLeaveBack: () => navbar.classList.remove('on_hero'),
    });
  });

  /* =========================================================
     5) Navigation öffnen / schließen
     ========================================================= */
  function toggleNavigation() {
    const isActive = navbar.classList.toggle('active');
    scroller.paused(isActive);
  }
  document.querySelectorAll('.navbar_menu_btn').forEach(btn => btn.addEventListener('click', toggleNavigation));
  document.addEventListener('click', (e) => {
    const isNav = e.target.closest('.navbar_nav_inner');
    const isLink = e.target.closest('.navbar_nav a, .navbar_cta a');
    const isBtn = Array.from(document.querySelectorAll('.navbar_menu_btn')).some(b => b.contains(e.target));
    if (navbar.classList.contains('active') && !isBtn && (isLink || !isNav)) toggleNavigation();
  });
  const dd = document.querySelector('.navbar_nav_dd');
  if (dd) dd.querySelector('.navbar_nav_dd_btn').addEventListener('click', (e) => { e.stopPropagation(); dd.classList.toggle('open'); });

  /* =========================================================
     6) Leistungen: 3D-Karussell
     ========================================================= */
  const carousel = document.querySelector('.carousel');
  const carouselWrapper = document.querySelector('.carousel_wrapper');
  const carouselContainer = document.querySelector('.carousel_container');

  if (carousel) {
    // Ring auf 14 Plätze auffüllen — Plätze 5..14 bleiben LEER (wie Referenz)
    const base = Array.from(carousel.children);
    const TOTAL = 14;
    for (let i = base.length; i < TOTAL; i++) {
      const li = document.createElement('li');
      li.className = 'carousel_card';
      li.setAttribute('data-service-empty', '');
      li.setAttribute('aria-hidden', 'true');
      carousel.appendChild(li);
    }
    Array.from(carousel.children).forEach((card, i) => {
      card.setAttribute('index', i + 1);
      card.style.setProperty('--index', i + 1);
    });
  }

  const mm = gsap.matchMedia();
  mm.add('(min-width: 768px)', () => {
    if (!carousel) return;
    carouselWrapper.style.height = (carouselContainer.offsetHeight * 2) + 'px';

    gsap.set(carousel, { '--rotate': 0 });

    gsap.fromTo(carousel, { rotateY: -102 }, {
      rotateY: -25, '--rotate': 25, yPercent: 100, ease: 'power1.inOut',
      scrollTrigger: { trigger: '.carousel_wrapper', start: 'top 75%', end: 'bottom 25%', scrub: true, invalidateOnRefresh: true }
    });
    gsap.fromTo('.carousel_card_img', { x: 100 }, {
      x: -100, ease: 'power1.inOut',
      scrollTrigger: { trigger: '.carousel_wrapper', start: 'top 75%', end: 'bottom 25%', scrub: true, invalidateOnRefresh: true }
    });
    gsap.fromTo('.carousel_card_img', { y: -100 }, {
      y: 100, ease: 'none',
      scrollTrigger: { trigger: '.carousel_wrapper', start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true }
    });
  });

  /* =========================================================
     7) Zahlen-Counter
     ========================================================= */
  const nums = document.querySelectorAll('.about_num_title_inner');
  gsap.from(nums, {
    textContent: 0, duration: 2, ease: 'expo.out',
    snap: { textContent: 1 },
    scrollTrigger: { trigger: '.about_nums', start: 'top 75%', invalidateOnRefresh: true },
    stagger: {
      onUpdate: function () {
        this.targets()[0].innerHTML = String(Math.ceil(Number(this.targets()[0].textContent)));
      }
    }
  });

  /* =========================================================
     8) Vorteile: gepinntes Akkordeon
     ========================================================= */
  // Breakpoint deckt sich mit dem CSS: unter 992px läuft die Sektion ungepinnt im Fluss
  mm.add('(min-width: 992px)', () => {
    const panels = gsap.utils.toArray('.advantage');
    const imgs = gsap.utils.toArray('.advantage_img');
    if (!panels.length) return;

    ScrollTrigger.create({ trigger: '.advantages_wrapper', start: 'top top', end: '200% bottom', pin: true, pinSpacing: false });

    // Hinweis: ScrollTriggers eingebautes snap schreibt direkt auf window.scrollY
    // und kollidiert dadurch mit Lenis (Sprünge an die Bereichsenden).
    // Deshalb unten ein eigener Snap über lenis.scrollTo().
    const tlPin = gsap.timeline({
      scrollTrigger: {
        trigger: '.section_advantages', start: 'top top', end: 'bottom bottom',
        scrub: true, invalidateOnRefresh: true,
      }
    });
    const tlSt = tlPin.scrollTrigger;
    let prev = null;

    panels.forEach((panel, i) => {
      const body = panel.querySelector('.advantage_body');
      const numBg = panel.querySelector('.advantage_num_bg');
      const header = panel.querySelector('.advantage_header');
      const divider = panel.querySelector('.advantage_divider');
      gsap.set(panel, { zIndex: i });

      if (i > 0 && prev) {
        tlPin.from(body, { height: 0, ease: 'none', duration: 1 }, i);
        tlPin.to(numBg, { opacity: 0, ease: 'none', duration: 1 }, i);
        if (imgs[i]) tlPin.from(imgs[i], { opacity: 0, ease: 'none', duration: .6 }, i);
        tlPin.to(prev.body, { height: 0, ease: 'none', duration: 1 }, i);
        tlPin.to(prev.header, { opacity: .3, ease: 'none', duration: 1 }, i);
        tlPin.to(prev.divider, { opacity: 0, ease: 'none', duration: 1 }, i);
      }
      tlPin.to(divider, { width: '100%', duration: 1, ease: 'none' }, i);
      prev = { body, header, divider };

      panel.addEventListener('click', () => {
        const step = i / (panels.length - 1);
        const target = tlSt.start + (tlSt.end - tlSt.start) * step;
        lenis.scrollTo(target, { duration: 1, easing: easeInOutQuart });
      });
    });

    // Eigener Snap: rastet nach dem Scrollen auf den nächsten Panel-Zustand ein
    let snapTimer = null, snapping = false;
    const onSnapScroll = () => {
      if (snapping) return;
      clearTimeout(snapTimer);
      snapTimer = setTimeout(() => {
        const y = window.scrollY;
        const a = tlSt.start, b = tlSt.end;
        if (y <= a || y >= b) return;
        const steps = panels.length - 1;
        const p = (y - a) / (b - a);
        const target = a + (Math.round(p * steps) / steps) * (b - a);
        if (Math.abs(target - y) < 2) return;
        snapping = true;
        lenis.scrollTo(target, {
          duration: 0.9, easing: easeInOutQuart,
          onComplete: () => { snapping = false; },
        });
        setTimeout(() => { snapping = false; }, 1400);
      }, 160);
    };
    lenis.on('scroll', onSnapScroll);
    return () => { lenis.off('scroll', onSnapScroll); clearTimeout(snapTimer); };
  });

  /* =========================================================
     9) CTA-Parallax
     ========================================================= */
  gsap.fromTo('.cta_image', { yPercent: -12.84 }, {
    yPercent: 12.84, ease: 'none',
    scrollTrigger: { trigger: '.section_cta', start: 'top bottom', end: 'bottom top', scrub: true }
  });

  /* =========================================================
     10) FAQ-Akkordeon
     ========================================================= */
  document.querySelectorAll('.faq_item').forEach((item, i) => {
    const head = item.querySelector('.faq_item_header');
    head.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq_item').forEach(x => x.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
      ScrollTrigger.refresh();
    });
  });

  /* =========================================================
     11) Sanfte Einblendungen für Überschriften
     ========================================================= */
  gsap.utils.toArray('[data-reveal]').forEach(el => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });

  /* ---------- Anker-Navigation über Lenis ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: 0, duration: 1.2 });
    });
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
