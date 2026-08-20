document.addEventListener('DOMContentLoaded', () => {

  /* ---------- DEVICE DETECTION ----------
     Lenis's touch-sync mode re-implements scrolling via JS/RAF, which on real
     phones (especially iOS Safari) feels laggy and disconnected compared to
     native momentum scrolling. Desktop (mouse/trackpad wheel) is where Lenis
     actually adds value — so we only enable it there and let touch devices
     use the browser's native scroll, which is what "buttery smooth" means
     on a phone. */
  const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- SMOOTH SCROLL (desktop/pointer devices only) ---------- */
  let lenis = null;
  if (!isTouchDevice && typeof Lenis !== 'undefined' && window.gsap) {
    try {
      lenis = new Lenis({
        duration: 1.2,
        smoothWheel: true,
        syncTouch: false,
        wheelMultiplier: 0.9
      });

      lenis.on('scroll', ScrollTrigger.update);

      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });

      gsap.ticker.lagSmoothing(0);
    } catch (err) {
      console.warn('Lenis failed to initialize, falling back to native scroll.', err);
      lenis = null;
    }
  }

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

  /* ---------- SCROLL REVEALS: slow fade in + slow fade out (snappier on touch) ---------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    // On touch devices, fast flick-scrolling can quickly outrun slow reveal
    // tweens, making content visibly lag behind the finger. Keep the desktop
    // timings (they were tuned for mouse-wheel pacing) but move faster on touch.
    const revealIn = isTouchDevice ? 0.5 : 1.2;
    const revealOut = isTouchDevice ? 0.6 : 2.2;
    const revealDistance = isTouchDevice ? 16 : 25;

    document.querySelectorAll('.reveal').forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        end: 'bottom -10%',

        onEnter: () => {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: revealIn,
            ease: 'power2.out'
          });
        },
          onEnterBack: () => {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: revealIn,
            ease: 'power2.out'
          });
        },
        onLeave: () => {
          gsap.to(el, {
            opacity: 0,
            y: -revealDistance,
            duration: revealOut,
            ease: 'power2.out'
          });
        },
        onLeaveBack: () => {
          gsap.to(el, {
            opacity: 0,
            y: revealDistance,
            duration: revealOut,
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

  /* =========================================
     PROJECT CASE-STUDY MODAL
  ========================================= */
  const PROJECTS = {
    swiftupi: {
      tag: 'React Native',
      title: 'SwiftUPI',
      summary: 'An offline-first UPI payment app built to keep transactions working even when the network doesn\u2019t.',
      points: [
        'End-to-end encryption on every transaction using AES-256-GCM and RSA-OAEP.',
        'Offline payment routing over Bluetooth mesh when there\u2019s no internet connection.',
        'Atomic hash claiming to prevent double-spends and race conditions during sync.',
        'Multi-threaded test suite (JUnit 5) covering concurrent transaction edge cases.'
      ],
      tech: ['Java 17', 'Spring Boot', 'Bluetooth Mesh', 'AES-256-GCM', 'RSA-OAEP', 'JUnit 5'],
      github: 'https://github.com/helloayushhh/swiftupi'
    },
    tanuai: {
      tag: 'Open Source',
      title: 'TanuAI',
      summary: 'An AI career companion that helps track applications, prep for interviews, and stay on top of the job search.',
      points: [
        'Live Fastify backend deployed on Render with an in-memory store for fast iteration.',
        'React + TypeScript frontend built with Vite, Framer Motion, and TanStack Query.',
        'Kanban-style application tracker with drag-and-drop status columns and modal editing.',
        'Diagnosed and fixed a PATCH route bug that was silently dropping status updates.'
      ],
      tech: ['React', 'TypeScript', 'Vite', 'Fastify', 'Framer Motion', 'TanStack Query'],
      github: 'https://github.com/helloayushhh/tanu-ai'
    },
    gallery: {
      tag: 'Open Source',
      title: 'Gallery',
      summary: 'A lightweight, self-hostable photo gallery for organizing and browsing image collections.',
      points: [
        'Responsive masonry grid that adapts across desktop, tablet, and mobile.',
        'Lazy-loaded images with smooth fade-in transitions to keep scrolling fast.',
        'Simple folder-based structure so anyone can drop in their own images and go.'
      ],
      tech: ['JavaScript', 'HTML/CSS', 'Lazy Loading'],
      github: 'https://github.com/Kaifazad/Gallery'
    },
    metricmovies: {
      tag: 'React · TMDB',
      title: 'Metric Movies',
      summary: 'A movie discovery app that pulls live data from TMDB and surfaces ratings, cast, and recommendations.',
      points: [
        'Search and browse movies with real-time data from The Movie Database API.',
        'Detail pages with cast, ratings, and similar-title recommendations.',
        'Componentized React architecture built for quick iteration on new features.'
      ],
      tech: ['React', 'TMDB API', 'REST'],
      github: '#'
    },
    solarsystem: {
      tag: 'Open Source',
      title: 'Solar System',
      summary: 'An interactive, to-scale visualization of the solar system built for the browser.',
      points: [
        'Real-time orbital animation with adjustable simulation speed.',
        'Click-to-focus camera controls for inspecting individual planets.',
        'Built entirely with vanilla JS and CSS 3D transforms — no rendering libraries.'
      ],
      tech: ['JavaScript', 'CSS 3D Transforms', 'Canvas'],
      github: '#'
    }
  };

  const modalOverlay = document.getElementById('projectModalOverlay');
  const modalEl = document.getElementById('projectModal');
  const modalCloseBtn = document.getElementById('modalClose');
  const modalTag = document.getElementById('modalTag');
  const modalTitle = document.getElementById('modalTitle');
  const modalSummary = document.getElementById('modalSummary');
  const modalPoints = document.getElementById('modalPoints');
  const modalTech = document.getElementById('modalTech');
  const modalGithub = document.getElementById('modalGithub');
  const modalGithubLabel = document.getElementById('modalGithubLabel');

  let lastFocusedEl = null;

  function openProjectModal(key) {
    const data = PROJECTS[key];
    if (!data || !modalOverlay) return;

    modalTag.textContent = data.tag || '';
    modalTitle.textContent = data.title || '';
    modalSummary.textContent = data.summary || '';

    modalPoints.innerHTML = '';
    (data.points || []).forEach(point => {
      const li = document.createElement('li');
      li.textContent = point;
      modalPoints.appendChild(li);
    });

    modalTech.innerHTML = '';
    (data.tech || []).forEach(t => {
      const span = document.createElement('span');
      span.textContent = t;
      modalTech.appendChild(span);
    });

    if (data.github && data.github !== '#') {
      modalGithub.href = data.github;
      modalGithub.style.display = 'inline-flex';
      modalGithubLabel.textContent = 'View on GitHub';
    } else {
      modalGithub.style.display = 'none';
    }

    lastFocusedEl = document.activeElement;
    modalOverlay.classList.add('open');
    modalOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
    modalCloseBtn.focus();
  }

  function closeProjectModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('open');
    modalOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lenis) lenis.start();
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  document.querySelectorAll('.project-card[data-project]').forEach(card => {
    const key = card.getAttribute('data-project');

    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-no-modal]')) return;
      openProjectModal(key);
    });

    card.addEventListener('keydown', (e) => {
      if (e.target.closest('[data-no-modal]')) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openProjectModal(key);
      }
    });
  });

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeProjectModal);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeProjectModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('open')) {
      closeProjectModal();
    }
  });
});