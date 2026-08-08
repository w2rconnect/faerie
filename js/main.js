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
  function onScrollFrame(y) {
    var max = docEl.scrollHeight - window.innerHeight;
    if (progress)
      progress.style.transform =
        'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    if (nav) nav.classList.toggle('scrolled', y > 40);
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

  function scrollToTarget(hash) {
    var target = document.querySelector(hash);
    if (!target) return;
    if (lenis) {
      lenis.scrollTo(target, { offset: -70 });
    } else {
      target.scrollIntoView({
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
    function setMenu(state) {
      open = state;
      document.body.classList.toggle('menu-open', open);
      hamburger.setAttribute('aria-expanded', String(open));
      hamburger.setAttribute(
        'aria-label',
        open ? 'Fechar menu' : 'Abrir menu'
      );
      if (lenis) {
        open ? lenis.stop() : lenis.start();
      }
      document.body.style.overflow = open ? 'hidden' : '';
    }
    hamburger.addEventListener('click', function () {
      setMenu(!open);
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        setMenu(false);
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) setMenu(false);
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
      initFloatChips();
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
          scrollTrigger: inViewport(el)
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

  function initFloatChips() {
    if (window.innerWidth < 768) return;
    var layer = document.querySelector('.hero-float-layer');
    if (!layer) return;
    var chips = Array.prototype.slice.call(
      layer.querySelectorAll('.hero-chip')
    );
    var vh = window.innerHeight;
    var cfg = { dur: [14, 19], rot: [-10, 10], stagger: 2.6 };
    function rand(min, max) {
      return min + Math.random() * (max - min);
    }
    chips.forEach(function (chip, i) {
      var zone = i % 2 === 0 ? [56, 68] : [74, 86];
      function launch(delay) {
        var x = rand(zone[0], zone[1]);
        var dur = rand(cfg.dur[0], cfg.dur[1]);
        gsap.set(chip, {
          left: x + 'vw',
          top: vh + 60,
          opacity: 0,
          rotation: rand(cfg.rot[0], cfg.rot[1]),
        });
        gsap.to(chip, {
          top: -80,
          duration: dur,
          delay: delay,
          ease: 'none',
          onUpdate: function () {
            var p = this.progress();
            var o = p < 0.12 ? p / 0.12 : p > 0.8 ? (1 - p) / 0.2 : 1;
            gsap.set(chip, { opacity: o * 0.6 });
          },
          onComplete: function () {
            launch(0);
          },
        });
      }
      launch(i * cfg.stagger);
    });
    window.addEventListener('resize', function () {
      vh = window.innerHeight;
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
      .querySelectorAll('.nav-links a[href^="#"]')
      .forEach(function (a) {
        var id = a.getAttribute('href').slice(1);
        if (
          id &&
          !a.classList.contains('nav-cta') &&
          !a.classList.contains('nav-entrar')
        )
          links[id] = a;
      });
    var sections = Object.keys(links)
      .map(function (id) {
        return document.getElementById(id);
      })
      .filter(Boolean);
    if (!sections.length) return;
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          Object.keys(links).forEach(function (id) {
            links[id].classList.remove('active');
          });
          links[entry.target.id].classList.add('active');
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

  (function () {
    var body = document.getElementById('iaConsoleBody');
    if (!body) return;
    var cmd = '> analisando matricula_45123.pdf';
    var steps = [
      'R1 e averbações extraídas',
      '2 proprietários qualificados',
      'alienação fiduciária detectada',
      'contrato pronto em 4s',
    ];
    function stepHtml(text) {
      return '<span class="ok">✓</span> ' + text;
    }
    if (reduceMotion || !animOn) {
      body.innerHTML =
        '<div class="ia-line cmd">' +
        cmd +
        '</div>' +
        steps
          .map(function (s) {
            return '<div class="ia-line">' + stepHtml(s) + '</div>';
          })
          .join('');
      return;
    }
    var caret = '<span class="ia-caret"></span>';
    function typeCmd(el, i, done) {
      if (i <= cmd.length) {
        el.innerHTML = cmd.slice(0, i) + caret;
        setTimeout(function () {
          typeCmd(el, i + 1, done);
        }, 26);
      } else {
        el.innerHTML = cmd;
        done();
      }
    }
    function showStep(index) {
      if (index >= steps.length) {
        setTimeout(restart, 3800);
        return;
      }
      var el = document.createElement('div');
      el.className = 'ia-line';
      el.innerHTML = stepHtml(steps[index]);
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      el.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
      body.appendChild(el);
      requestAnimationFrame(function () {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
      setTimeout(function () {
        showStep(index + 1);
      }, 450);
    }
    function restart() {
      body.innerHTML = '';
      var el = document.createElement('div');
      el.className = 'ia-line cmd';
      body.appendChild(el);
      typeCmd(el, 0, function () {
        setTimeout(function () {
          showStep(0);
        }, 350);
      });
    }
    setTimeout(restart, 1600);
  })();
});
