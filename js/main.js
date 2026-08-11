document.addEventListener('DOMContentLoaded', function () {
  'use strict';
  var docEl = document.documentElement;
  var reduceMotion = matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  var hasGsap = !!(
    window.gsap &&
    window.ScrollTrigger &&
    window.SplitText
  );
  var hasLenis = !!window.Lenis;
  var animOn =
    hasGsap && !reduceMotion && !/[?&]noanim/.test(location.search);
  if (!animOn) docEl.classList.remove('js-anim');
  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger, SplitText);
  }

  var isIgnored = function (el) {
    return (
      el.hasAttribute('data-gsap-ignore') ||
      !!el.closest('[data-gsap-ignore]') ||
      !!el.closest('[data-reveal]')
    );
  };

  var lenis = null;
  var progress = document.querySelector('.scroll-progress');
  var nav = document.getElementById('nav');
  var lastY = 0;
  var navH = 72;
  var navLock = false;
  function measureNav() {
    if (nav) navH = nav.offsetHeight || 72;
  }
  measureNav();
  window.addEventListener('resize', measureNav);
  function onScrollFrame(y) {
    var max = docEl.scrollHeight - window.innerHeight;
    if (progress)
      progress.style.transform =
        'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    if (!nav) return;
    nav.classList.toggle('scrolled', y > 40);
    if (navLock) {
      nav.classList.remove('nav-hidden');
      lastY = y;
      return;
    }
    if (Math.abs(y - lastY) > 8) {
      nav.classList.toggle('nav-hidden', y > lastY && y > navH);
      lastY = y;
    }
  }
  if (hasLenis && animOn) {
    lenis = new Lenis({ duration: 1.1 });
    lenis.on('scroll', function (e) {
      onScrollFrame(e.scroll);
      if (hasGsap) ScrollTrigger.update();
    });
    gsap.ticker.add(function (time) {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  } else {
    window.addEventListener(
      'scroll',
      function () {
        onScrollFrame(window.scrollY);
      },
      { passive: true }
    );
  }
  onScrollFrame(window.scrollY);

  ['wheel', 'touchstart', 'keydown'].forEach(function (ev) {
    window.addEventListener(
      ev,
      function () {
        navLock = false;
      },
      { passive: true }
    );
  });

  function scrollToTarget(hash) {
    var target = document.querySelector(hash);
    if (!target) return;
    navLock = true;
    measureNav();
    if (lenis) {
      lenis.start();
      lenis.scrollTo(target, { offset: -navH });
    } else {
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - navH,
        behavior: reduceMotion ? 'auto' : 'smooth',
      });
    }
  }
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var hash = a.getAttribute('href');
      if (hash.length > 1) {
        e.preventDefault();
        scrollToTarget(hash);
      }
    });
  });

  (function () {
    var hamburger = document.getElementById('hamburger');
    var menu = document.getElementById('mobileMenu');
    if (!hamburger || !menu) return;
    var open = false;
    var behind = Array.prototype.filter.call(
      document.body.children,
      function (el) {
        return el !== menu && el !== nav;
      }
    );
    var navLogo = nav && nav.querySelector('.nav-logo');
    if (navLogo) behind.push(navLogo);
    function setMenu(state, returnFocus) {
      open = state;
      document.body.classList.toggle('menu-open', open);
      hamburger.setAttribute('aria-expanded', String(open));
      hamburger.setAttribute(
        'aria-label',
        open ? 'Fechar menu' : 'Abrir menu'
      );
      behind.forEach(function (el) {
        el.toggleAttribute('inert', open);
      });
      if (lenis) {
        open ? lenis.stop() : lenis.start();
      }
      document.body.style.overflow = open ? 'hidden' : '';
      if (open)
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            menu.querySelector('a').focus();
          });
        });
      else if (returnFocus) hamburger.focus();
    }
    hamburger.addEventListener('click', function () {
      setMenu(!open, true);
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        setMenu(false);
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) setMenu(false, true);
    });
  })();

  var animStarted = false;
  function startAnimations() {
    if (!animOn || animStarted) return;
    animStarted = true;
    var fontsReady = Promise.race([
      document.fonts && document.fonts.ready
        ? document.fonts.ready
        : Promise.resolve(),
      new Promise(function (res) {
        setTimeout(res, 1500);
      }),
    ]);
    fontsReady.then(function () {
      initTextReveal();
      initBatchReveal();
      initIntroBits();
      initParallax();
      initHowLine();
      initTrail();
      initCircuits();
      ScrollTrigger.refresh();
    });
  }
  (function () {
    var pre = document.getElementById('preloader');
    if (!animOn || !pre) {
      if (pre) pre.remove();
      startAnimations();
      return;
    }
    var seen = /[?&]nointro/.test(location.search);
    try {
      seen = seen || sessionStorage.getItem('w2r_intro') === '1';
    } catch (err) {}
    var count = document.getElementById('preCount');
    var fill = document.getElementById('preFill');
    if (seen) {
      pre.remove();
      startAnimations();
      return;
    }
    try {
      sessionStorage.setItem('w2r_intro', '1');
    } catch (err) {}
    var state = { v: 0 };
    if (lenis) lenis.stop();
    function finishIntro() {
      if (pre.parentNode) pre.remove();
      if (lenis) lenis.start();
      startAnimations();
    }
    var safety = setTimeout(function () {
      tl.kill();
      finishIntro();
    }, 5000);
    var tl = gsap.timeline({
      onComplete: function () {
        clearTimeout(safety);
        if (pre.parentNode) pre.remove();
        if (lenis) lenis.start();
      },
    });
    tl.to(state, {
      v: 100,
      duration: 1.3,
      ease: 'power2.inOut',
      onUpdate: function () {
        var n = Math.round(state.v);
        if (count) count.textContent = n + '%';
        if (fill) fill.style.transform = 'scaleX(' + n / 100 + ')';
      },
    });
    tl.add(startAnimations, '-=0.15');
    tl.to(
      pre,
      { yPercent: -100, duration: 0.85, ease: 'power4.inOut' },
      '+=0.05'
    );
  })();

  function inViewport(el) {
    var r = el.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  }
  function splitAndReveal(el, dur, stag) {
    gsap.set(el, { autoAlpha: 1 });
    var introOnly = !!el.closest('.hero') || inViewport(el);
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      linesClass: 'gsap-line',
      onSplit: function (self) {
        return gsap.from(self.lines, {
          yPercent: 115,
          duration: dur,
          stagger: stag,
          ease: 'power3.out',
          scrollTrigger: introOnly
            ? null
            : {
                trigger: el,
                start: 'clamp(top 85%)',
                toggleActions: 'play none none reverse',
              },
        });
      },
    });
  }
  function initTextReveal() {
    document
      .querySelectorAll('h1, h2, .sec-desc, .hero-subtitle, .cta-desc')
      .forEach(function (el) {
        if (isIgnored(el) && !el.classList.contains('hero-subtitle'))
          return;
        var isHeading = el.tagName === 'H1' || el.tagName === 'H2';
        splitAndReveal(
          el,
          isHeading ? 0.9 : 0.7,
          isHeading ? 0.09 : 0.05
        );
      });
  }

  function initBatchReveal() {
    var items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;
    gsap.set(items, { y: 36, autoAlpha: 0 });
    ScrollTrigger.batch(items, {
      start: 'top 88%',
      onEnter: function (batch) {
        gsap.to(batch, {
          y: 0,
          autoAlpha: 1,
          duration: 0.8,
          stagger: 0.09,
          ease: 'power3.out',
          overwrite: true,
        });
      },
      onLeaveBack: function (batch) {
        gsap.to(batch, {
          y: 36,
          autoAlpha: 0,
          duration: 0.4,
          ease: 'power2.in',
          overwrite: true,
        });
      },
    });
  }

  function initIntroBits() {
    gsap.from('#nav', {
      y: -18,
      autoAlpha: 0,
      duration: 0.8,
      ease: 'power3.out',
      delay: 0.1,
      clearProps: 'all',
    });
    gsap.from('[data-intro]', {
      y: 26,
      autoAlpha: 0,
      duration: 0.8,
      stagger: 0.12,
      ease: 'power3.out',
      delay: 0.15,
      clearProps: 'opacity,visibility,transform',
    });
    if (!document.querySelector('[data-intro-visual]')) return;
    gsap.from('[data-intro-visual]', {
      y: 90,
      autoAlpha: 0,
      scale: 0.985,
      duration: 1.1,
      ease: 'power3.out',
      delay: 0.45,
      clearProps: 'opacity,visibility,transform',
    });
  }

  function initParallax() {
    document.querySelectorAll('[data-parallax]').forEach(function (el) {
      gsap.to(el, {
        yPercent: -5,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    });
  }

  function initHowLine() {
    var steps = document.getElementById('howSteps');
    if (!steps) return;
    var items = Array.prototype.slice.call(
      steps.querySelectorAll('.how-step')
    );
    var vertical = function () {
      return matchMedia('(max-width:860px)').matches;
    };
    ScrollTrigger.create({
      trigger: steps,
      start: function () {
        return vertical() ? 'top 78%' : 'top 96%';
      },
      end: function () {
        return vertical() ? 'bottom 55%' : 'bottom 40%';
      },
      scrub: 0.4,
      onUpdate: function (self) {
        steps.style.setProperty('--p', self.progress);
        items.forEach(function (step, i) {
          step.classList.toggle(
            'lit',
            self.progress >= (i + 0.5) / items.length
          );
        });
      },
    });
  }

  function initTrail() {
    var trail = document.querySelector('.hero-trail');
    if (!trail) return;
    var traces = Array.prototype.slice.call(
      trail.querySelectorAll('.trace')
    );
    var lit = trail.querySelector('[data-node="2"]');
    var next = trail.querySelector('[data-node="3"]');
    if (!traces.length || !lit || !next) return;
    var facts2 = lit.querySelectorAll('.trail-fact');
    var facts3 = next.querySelectorAll('.trail-fact');

    var lens = traces.map(function (p) {
      return p.getTotalLength() || 1;
    });
    traces.forEach(function (p, i) {
      gsap.set(p, { strokeDasharray: lens[i] });
    });

    function reset() {
      lit.classList.remove('is-lit');
      next.classList.remove('is-lit');
      gsap.set([facts2, facts3], { autoAlpha: 0, y: 6 });
    }
    reset();

    var tl = gsap.timeline({
      repeat: -1,
      repeatDelay: 3.4,
      delay: 0.6,
      onRepeat: reset,
    });
    tl.fromTo(
      traces[0],
      { strokeDashoffset: lens[0] },
      { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }
    )
      .call(function () {
        lit.classList.add('is-lit');
      })
      .to(facts2, {
        autoAlpha: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.16,
        ease: 'power2.out',
      })
      .fromTo(
        traces[1],
        { strokeDashoffset: lens[1] },
        { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut' },
        '+=0.2'
      )
      .call(function () {
        next.classList.add('is-lit');
      })
      .to(facts3, {
        autoAlpha: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.16,
        ease: 'power2.out',
      });
  }

  function initCircuits() {
    document.querySelectorAll('.circuit').forEach(function (svg) {
      var paths = svg.querySelectorAll('.draw');
      paths.forEach(function (p) {
        var len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(p, {
          strokeDashoffset: 0,
          duration: 1.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: svg,
            start: 'top 92%',
            toggleActions: 'play none none reverse',
          },
        });
      });
      gsap.from(svg.querySelectorAll('.node'), {
        scale: 0,
        transformOrigin: 'center',
        duration: 0.5,
        stagger: 0.15,
        delay: 1.2,
        ease: 'back.out(2)',
        scrollTrigger: {
          trigger: svg,
          start: 'top 92%',
          toggleActions: 'play none none reverse',
        },
      });
    });
  }

  (function () {
    var steps = Array.prototype.slice.call(
      document.querySelectorAll('.story-step')
    );
    var imgs = document.querySelectorAll('.story-img');
    var url = document.getElementById('storyUrl');
    if (!steps.length) return;
    function activate(index) {
      steps.forEach(function (s, i) {
        s.classList.toggle('is-active', i === index);
      });
      imgs.forEach(function (img, i) {
        img.classList.toggle('is-active', i === index);
      });
      var stepUrl = steps[index].getAttribute('data-url');
      if (url && stepUrl) url.textContent = stepUrl;
    }
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) activate(steps.indexOf(entry.target));
        });
      },
      { rootMargin: '-45% 0px -45% 0px' }
    );
    steps.forEach(function (s) {
      spy.observe(s);
    });
  })();

  (function () {
    var root = document.getElementById('ben');
    var wrap = document.getElementById('benViewport');
    var dotWrap = document.getElementById('benDots');
    if (!root || !wrap || !dotWrap) return;
    var track = wrap.querySelector('.ben-track');
    var dots = Array.prototype.slice.call(dotWrap.querySelectorAll('.ben-dot'));
    var originals = track
      ? Array.prototype.slice.call(track.querySelectorAll('.ben-card'))
      : [];
    var total = originals.length;
    if (total < 3 || total !== dots.length) return;

    var EDGE = 2;
    function twin(el) {
      var copy = el.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.classList.remove('is-active');
      return copy;
    }
    track.prepend(twin(originals[total - 2]), twin(originals[total - 1]));
    track.append(twin(originals[0]), twin(originals[1]));

    var cards = Array.prototype.slice.call(track.querySelectorAll('.ben-card'));
    root.classList.add('is-carousel');
    var index = EDGE;
    var shown = -1;
    var settle = null;

    function middle(el) {
      var r = el.getBoundingClientRect();
      return r.left + r.width / 2;
    }
    function realOf(slot) {
      return (((slot - EDGE) % total) + total) % total;
    }
    function goTo(slot, smooth) {
      index = Math.max(0, Math.min(cards.length - 1, slot));
      wrap.scrollTo({
        left: wrap.scrollLeft + middle(cards[index]) - middle(wrap),
        behavior: smooth === false ? 'auto' : 'smooth',
      });
    }
    function rewind() {
      if (index >= EDGE && index < EDGE + total) return;
      goTo(index < EDGE ? index + total : index - total, false);
    }
    function mark() {
      var mid = middle(wrap);
      var best = 0;
      var dist = Infinity;
      cards.forEach(function (c, slot) {
        var d = Math.abs(middle(c) - mid);
        if (d < dist) {
          dist = d;
          best = slot;
        }
      });
      index = best;
      var real = realOf(best);
      if (real !== shown) {
        shown = real;
        cards.forEach(function (c, slot) {
          c.classList.toggle('is-active', realOf(slot) === real);
        });
        dots.forEach(function (d, n) {
          d.classList.toggle('is-active', n === real);
          if (n === real) d.setAttribute('aria-current', 'true');
          else d.removeAttribute('aria-current');
        });
      }
      clearTimeout(settle);
      settle = setTimeout(rewind, 140);
    }
    function stopAuto() {
      root.classList.remove('is-auto', 'is-paused');
    }

    wrap.addEventListener('scroll', mark, { passive: true });
    new ResizeObserver(function () {
      goTo(index, false);
      mark();
    }).observe(wrap);
    dots.forEach(function (d, n) {
      d.addEventListener('click', function () {
        stopAuto();
        var target = null;
        [n + EDGE - total, n + EDGE, n + EDGE + total].forEach(function (slot) {
          if (slot < 0 || slot >= cards.length) return;
          if (target === null || Math.abs(slot - index) < Math.abs(target - index))
            target = slot;
        });
        goTo(target);
      });
    });
    cards.forEach(function (c, slot) {
      c.addEventListener('click', function () {
        if (c.classList.contains('is-active')) return;
        stopAuto();
        goTo(slot);
      });
    });
    wrap.addEventListener('pointerdown', stopAuto);
    wrap.addEventListener('keydown', stopAuto);
    goTo(EDGE, false);
    mark();

    if (!animOn) return;
    root.classList.add('is-auto');
    dotWrap.addEventListener('animationend', function (e) {
      if (e.animationName === 'benFill') goTo(index + 1);
    });
    root.addEventListener('mouseenter', function () {
      root.classList.add('is-paused');
    });
    root.addEventListener('focusin', function () {
      root.classList.add('is-paused');
    });
    root.addEventListener('mouseleave', function () {
      root.classList.remove('is-paused');
    });
    root.addEventListener('focusout', function () {
      root.classList.remove('is-paused');
    });
  })();

  if (matchMedia('(hover:hover)').matches) {
    document.querySelectorAll('.card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', e.clientX - r.left + 'px');
        card.style.setProperty('--my', e.clientY - r.top + 'px');
      });
    });
  } else {
    var litObs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle('lit', entry.isIntersecting);
        });
      },
      { rootMargin: '-38% 0px -38% 0px' }
    );
    document.querySelectorAll('.card').forEach(function (c) {
      litObs.observe(c);
    });
  }

  (function () {
    var links = {};
    document
      .querySelectorAll('.nav-links a[href^="#"], .mob-links a[href^="#"]')
      .forEach(function (a) {
        var id = a.getAttribute('href').slice(1);
        if (
          id &&
          !a.classList.contains('nav-cta') &&
          !a.classList.contains('nav-entrar')
        )
          (links[id] = links[id] || []).push(a);
      });
    var sections = Object.keys(links)
      .map(function (id) {
        return document.getElementById(id);
      })
      .filter(Boolean);
    if (!sections.length) return;
    var visible = [];
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var i = visible.indexOf(entry.target);
          if (entry.isIntersecting) {
            if (i < 0) visible.push(entry.target);
          } else if (i > -1) {
            visible.splice(i, 1);
          }
        });
        var current = visible.reduce(function (a, b) {
          return !a || b.offsetTop < a.offsetTop ? b : a;
        }, null);
        Object.keys(links).forEach(function (id) {
          var on = !!current && current.id === id;
          links[id].forEach(function (a) {
            a.classList.toggle('active', on);
            if (on) a.setAttribute('aria-current', 'true');
            else a.removeAttribute('aria-current');
          });
        });
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );
    sections.forEach(function (s) {
      spy.observe(s);
    });
  })();

  (function () {
    var strip = document.querySelector('.promo-countdown');
    var timer = document.getElementById('promoTimer');
    if (!strip || !timer) return;
    var deadline = new Date(
      strip.getAttribute('data-deadline')
    ).getTime();
    if (isNaN(deadline)) return;
    function pad(n) {
      return String(n).padStart(2, '0');
    }
    function tick() {
      var left = deadline - Date.now();
      if (left <= 0) {
        strip.style.display = 'none';
        return;
      }
      var d = Math.floor(left / 86400000);
      var h = Math.floor(left / 3600000) % 24;
      var m = Math.floor(left / 60000) % 60;
      var s = Math.floor(left / 1000) % 60;
      timer.textContent =
        (d > 0 ? d + 'd ' : '') +
        pad(h) +
        'h ' +
        pad(m) +
        'm ' +
        pad(s) +
        's';
      setTimeout(tick, 1000);
    }
    tick();
  })();

  (function () {
    if (reduceMotion) return;
    var items = [];
    document.querySelectorAll('.js-counter').forEach(function (el) {
      var m = el.textContent.trim().match(/^(-?)(\d+)(.*)$/);
      if (m)
        items.push({
          el: el,
          sign: m[1],
          target: parseInt(m[2], 10),
          suffix: m[3],
        });
    });
    if (!items.length) return;
    function render(item, value) {
      item.el.textContent =
        (value === 0 ? '0' : item.sign + value) + item.suffix;
    }
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var item = items.find(function (i) {
            return i.el === entry.target;
          });
          if (!item) return;
          if (!entry.isIntersecting) {
            cancelAnimationFrame(item.raf);
            render(item, 0);
            return;
          }
          var start = performance.now();
          var dur = 1000;
          item.raf = requestAnimationFrame(function frame(now) {
            var t = Math.min(1, (now - start) / dur);
            var eased = 1 - Math.pow(1 - t, 3);
            render(item, Math.round(item.target * eased));
            if (t < 1) item.raf = requestAnimationFrame(frame);
          });
        });
      },
      { threshold: 0.5 }
    );
    items.forEach(function (i) {
      render(i, 0);
      obs.observe(i.el);
    });
  })();

});
