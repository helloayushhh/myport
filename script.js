document.addEventListener('DOMContentLoaded', () => {

    /* ---------- SMOOTH SCROLL ---------- */
  const lenis = new Lenis({
    duration: 1.2,
    smoothWheel: true,
    syncTouch: true,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.1
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
  
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- NAV: unified dropdown everywhere (incl. footer) ---------- */
  const navPill = document.getElementById('navPill');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  function closeMenu(){
    navPill.classList.remove('open');
    navMenu.classList.remove('open');
    navToggle.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const opening = !navToggle.classList.contains('is-open');
      navToggle.classList.toggle('is-open', opening);
      navToggle.setAttribute('aria-expanded', String(opening));
      navMenu.classList.toggle('open', opening);
      navPill.classList.toggle('open', opening);
    });
  }

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  /* ---------- HERO HEADLINE: one-time entrance scramble ---------- */
  const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*';

  function scrambleIn(el, duration = 700) {
    if (!el) return;
    const target = el.textContent.trim();
    if (!target) return;
    const start = performance.now();

    function frame(now) {
      const progress = Math.min(1, (now - start) / duration);
      const revealCount = Math.floor(progress * target.length);
      let output = '';
      for (let i = 0; i < target.length; i++) {
        output += i < revealCount ? target[i] : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }
      el.textContent = output;
      if (progress < 1) requestAnimationFrame(frame);
      else el.textContent = target;
    }
    requestAnimationFrame(frame);
  }

  if (!reduceMotion) {
    const scrambleTargets = document.querySelectorAll('.hero-headline .scramble-target');
    scrambleTargets.forEach((element, index) => {
      setTimeout(() => scrambleIn(element, 750), 250 + index * 220);
    });

    if (window.gsap) {
      gsap.from('.hero-tagline', { opacity: 0, y: 25, duration: 0.9, ease: 'power3.out', delay: 0.8 });
      gsap.from('.hero-marks', { opacity: 0, y: 15, duration: 0.8, ease: 'power2.out', delay: 1 });
      gsap.from('.hero-scroll-cue', { opacity: 0, duration: 0.8, delay: 1.2 });
    }
  }

  /* ---------- SCROLL PROGRESS PILL ---------- */
  const progressPill = document.querySelector('.progress-pill');
  function updateProgress(){
    if (!progressPill) return;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
    progressPill.style.setProperty('--progress', pct + '%');
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* ---------- SCROLL REVEALS: slow fade in + slow fade out ---------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    document.querySelectorAll('.reveal').forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        end: 'bottom -10%',

        onEnter: () => {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: 'power2.out'
          });
        },
          onEnterBack: () => {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: 'power2.out'
          });
        },
        onLeave: () => {
          gsap.to(el, {
            opacity: 0,
            y: -25,
            duration: 2.2,
            ease: 'power2.out'
          });
        },
        onLeaveBack: () => {
          gsap.to(el, {
            opacity: 0,
            y: 25,
            duration: 2.2,
            ease: 'power2.out'
          });
        }
      });
    });

  /* Footer wordmark parallax */
    if (!reduceMotion) {
      const footerHero = document.querySelector('.footer-hero');

      if (footerHero) {
        gsap.to('.footer-wordmark', {
          yPercent: -12,
          ease: 'none',
          scrollTrigger: {
            trigger: '.footer-hero',
            start: 'top bottom',
            end: 'bottom bottom',
            scrub: true
          }
        });
      }
    }

  } else {
    document.querySelectorAll('.reveal').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
  }

  /* ---------- CONTACT FORM (demo submit) ---------- */
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('.submit-btn');
      const original = btn.textContent;
      btn.textContent = 'Sent ✓';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = original;
        btn.disabled = false;
        form.reset();
      }, 2200);
    });
  }
});