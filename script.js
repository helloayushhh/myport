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
      gsap.from('.hero-subtitle', { opacity: 0, y: 15, duration: 0.8, ease: 'power2.out', delay: 0.65 });
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

  /* ---------- CONTACT FORM ---------- */
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('.submit-btn');
      const original = btn.textContent;

      btn.textContent = 'Sending...';
      btn.disabled = true;

      emailjs.sendForm(
        'service_vbdsjdm',
        'template_x2qvkj8',
        form
      )
     .then(() => {
        btn.textContent = 'Sent ✓';

        setTimeout(() => {
          btn.textContent = original;
          btn.disabled = false;
          form.reset();
        }, 2200);
      })
      .catch((error) => {
        console.error('EmailJS Error:', error);

        btn.textContent = 'Try again';

        setTimeout(() => {
          btn.textContent = original;
          btn.disabled = false;
        }, 2200);
      });
    });
  }
  /* =========================================
     PROJECT CASE-STUDY MODAL
  ========================================= */
  const PROJECTS = {

    swiftupi: {
      tag: 'Java · Spring Boot · Fintech',
      title: 'SwiftUPI',
      summary: 'An attempt to rethink UPI payments for situations where internet connectivity is unavailable, using Bluetooth Mesh as the communication layer.',
      points: [
        'Explored how an offline payment flow could work without depending on a live internet connection.',
        'Built the backend using Java, Spring Boot, and REST APIs.',
        'Worked on transaction security using AES-256-GCM and RSA-OAEP.',
        'Designed around offline communication through Bluetooth Mesh and considered transaction consistency during synchronization.',
        'Used JUnit 5 to test the system and its transaction behaviour.'
      ],
      tech: ['Java', 'Spring Boot', 'REST APIs', 'Bluetooth Mesh', 'AES-256-GCM', 'RSA-OAEP', 'JUnit 5'],
      learned: 'Learned how much complexity offline-first systems add — especially around conflict resolution and security without a live connection.',
      github: 'https://github.com/helloayushhh/swiftupi'
    },

    tanuai: {
      tag: 'React · TypeScript · AI',
      title: 'Tanu AI',
      summary: 'An AI career companion built around a simple problem: keeping job search, applications, resumes, and career preparation in one place.',
      points: [
        'Defined the product around the everyday workflow of someone actively looking for opportunities.',
        'Built the frontend with React and TypeScript and the backend with Fastify.',
        'Integrated OpenRouter to bring AI capabilities into the product.',
        'Handled deployment across Render and Vercel.',
        'Worked across both the product experience and the underlying implementation rather than treating the interface as a standalone piece.'
      ],
      tech: ['React', 'TypeScript', 'Fastify', 'OpenRouter', 'Render', 'Vercel'],
      learned: 'Learned how to scope an AI product around a real daily workflow instead of just bolting AI onto a UI.',
      github: 'https://github.com/helloayushhh/tanu-ai'
    },

    culinaryai: {
      tag: 'React · Firebase · AI',
      title: 'CulinaryAI',
      summary: 'An AI food platform exploring how AI can make a food-focused product more useful and personalized.',
      points: [
        'Started with the idea of combining food discovery with AI rather than building another static food website.',
        'Built the product interface using React and JavaScript.',
        'Used Firebase as the application backend.',
        'Integrated AI capabilities into the product experience.',
        'Worked across the product idea, interface, and implementation.'
      ],
      tech: ['React', 'Firebase', 'JavaScript', 'AI Integration'],
      learned: 'Learned how to integrate AI into a product experience without letting it overshadow the core UX.',
      github: 'https://culinaryai0.netlify.app/'
    },

    placementanalytics: {
      tag: 'Python · SQL · Power BI',
      title: 'Placement Analytics Dashboard',
      summary: 'A data project built to turn placement data into something that can be explored and understood instead of being left as raw numbers.',
      points: [
        'Started from the question of what placement data can actually tell us about performance.',
        'Used Python for working with the data and SQL for querying it.',
        'Built a Power BI dashboard to present placement insights.',
        'Focused on turning data into findings that can support better understanding and decisions.',
        'This project reflects how I approach analytical problems: structure the data first, then look for the story inside it.'
      ],
      tech: ['Python', 'SQL', 'Power BI'],
      learned: 'Learned that most of the value in a data project comes from asking better questions, not from the dashboard itself.',
      github: 'https://github.com/helloayushhh/placement-analytics-dashboard'
    },

    proresume: {
      tag: 'HTML · CSS · JavaScript',
      title: 'Pro Resume',
      summary: 'A resume builder focused on making it easier to create an ATS-friendly resume while seeing the result as it is being built.',
      points: [
        'Focused on the problem of creating a structured resume without repeatedly switching between editing and previewing.',
        'Built the experience using HTML, CSS, and JavaScript.',
        'Designed the product around ATS-friendly resume creation.',
        'Worked on both the interface and the interaction logic behind the builder.'
      ],
      tech: ['HTML', 'CSS', 'JavaScript'],
      learned: 'Learned how much UX friction disappears when you let people preview changes live instead of blindly editing.',
      github: 'https://github.com/helloayushhh/pro-resume'
    },

    smartlogistics: {
      tag: 'Python · MySQL · Optimization',
      title: 'Smart Logistics Optimizer',
      summary: 'A logistics project focused on the problem of planning deliveries more efficiently through route optimization and data.',
      points: [
        'Started with the operational problem of planning delivery routes more effectively.',
        'Used Python to work on the optimization problem.',
        'Used MySQL for storing and working with the underlying data.',
        'Focused on route optimization rather than simply displaying delivery information.',
        'The project reflects my interest in solving operational problems through a combination of data and software.'
      ],
      tech: ['Python', 'MySQL'],
      learned: 'Learned how quickly a simple routing problem turns into a real optimization challenge at scale.',
      github: 'https://github.com/helloayushhh/smart-logistics-optimizer'
    },

    editkaro: {
      tag: 'JavaScript · GSAP · Automation',
      title: 'EditKaro.in',
      summary: 'A portfolio website for a social media marketing and video editing agency, designed to make the agency’s work itself feel like part of the pitch.',
      points: [
        'Built the website using HTML, CSS, and JavaScript.',
        'Used GSAP to create motion and interaction around the portfolio experience.',
        'Connected Google Apps Script with Google Sheets for form-related automation.',
        'Worked on both the visual experience and the practical functionality behind the website.',
        'The project reflects my approach to websites: the interface should communicate what the business does, not just display information.'
      ],
      tech: ['HTML', 'CSS', 'JavaScript', 'GSAP', 'Google Apps Script', 'Google Sheets'],
      learned: 'Learned how much motion and pacing on a site can do as much selling as the copy itself.',
      github: 'https://github.com/helloayushhh/editkaro.in'
    },

    dealershipleadmanagement: {
      tag: 'Salesforce · Business Analysis',
      title: 'Dealership Lead Management',
      summary: 'A CRM case study exploring how a dealership could structure and improve its lead management process.',
      points: [
        'Started by looking at the business process rather than jumping directly into a technical solution.',
        'Documented requirements through a Business Requirements Document (BRD).',
        'Mapped the lead management process and identified how the workflow should move through the system.',
        'Created wireframes to translate the process into a usable product experience.',
        'Worked on solution design to connect the business requirement with the proposed system.'
      ],
      tech: ['BRD', 'Process Flow', 'Wireframing', 'Solution Design'],
      learned: 'Learned how much clearer a technical solution becomes once the business process is mapped out first.',
      github: 'https://github.com/helloayushhh/dealership-lead-management-salesforce-case-study'
    },

    uberfleetmanager: {
      tag: 'Product Strategy · Dashboard',
      title: 'Uber Fleet Manager Dashboard',
      summary: 'A product concept focused on how fleet operations could be represented through a dashboard that helps people understand and manage what is happening across the fleet.',
      points: [
        'Approached the project from a product perspective rather than starting with implementation.',
        'Worked on the product strategy behind the dashboard.',
        'Thought through what information an operations-focused dashboard should communicate.',
        'Created wireframes to turn the product thinking into a concrete interface.',
        'This project shows how I move from a problem space to product structure before thinking about code.'
      ],
      tech: ['Product Strategy', 'Dashboard Design', 'Wireframing'],
      learned: 'Learned how to design around what an operator needs to see first, not just what data happens to be available.',
      github: '#'
    },

    meeshoresellerteardown: {
      tag: 'Product Strategy · UX',
      title: 'Meesho Reseller Teardown',
      summary: 'A product teardown looking at the Meesho reseller experience through the lens of growth, UX, and the journey a user takes through the product.',
      points: [
        'Looked at the product as a user journey rather than analysing isolated screens.',
        'Studied the experience from a product growth perspective.',
        'Performed UX analysis to understand how the experience guides users.',
        'Mapped the user journey to identify how different parts of the product connect.',
        'This project demonstrates how I analyse an existing product before suggesting what could be improved.'
      ],
      tech: ['Product Strategy', 'UX Analysis', 'User Journey Mapping'],
      learned: 'Learned to evaluate a product by the journey it creates, not just the individual screens.',
      github: '#'
    },

    mutualfundanalytics: {
      tag: 'Python · SQL · Data Analytics',
      title: 'MutualFundAnalytics',
      summary: 'A capstone data analytics project built during my Data Analyst internship work to explore mutual fund data through analysis.',
      points: [
        'Worked on the project as a Data Analyst internship capstone.',
        'Used Python to work with and analyse the data.',
        'Used SQL to query and investigate the dataset.',
        'Focused on extracting useful information from financial data rather than simply presenting raw records.',
        'This project represents my approach to analytical work: understand the data, investigate it, and turn it into something useful.'
      ],
      tech: ['Python', 'SQL'],
      learned: 'Learned how to turn a broad, messy dataset into a focused, decision-ready analysis.',
      github: 'https://github.com/helloayushhh/mutual-fund-analytics'
    },

    inventorymanagement: {
      tag: 'Java · MySQL · Desktop App',
      title: 'Inventory Management System',
      summary: 'An inventory management application built to handle product and stock-related operations through a Java desktop application.',
      points: [
        'Built the application using Java and Java Swing.',
        'Connected the application to MySQL using JDBC.',
        'Designed the system around inventory management workflows.',
        'Implemented Role-Based Access Control (RBAC) to separate access based on user roles.',
        'Worked across the application interface, database connection, and access control.'
      ],
      tech: ['Java', 'MySQL', 'JDBC', 'Java Swing', 'RBAC'],
      learned: 'Learned how much role-based access control changes the way you design an application\u2019s core logic.',
      github: 'https://github.com/helloayushhh/inventory-management-system'
    },

    gogym: {
      tag: 'HTML · CSS · JavaScript',
      title: 'Go Gym',
      summary: 'A responsive fitness website built as a practical exercise in creating a complete web experience across different screen sizes.',
      points: [
        'Built the website using HTML, CSS, and JavaScript.',
        'Used Bootstrap to handle responsive layouts.',
        'Focused on making the experience work across different screen sizes.',
        'Worked on the structure, styling, and interaction of the website.'
      ],
      tech: ['HTML', 'CSS', 'JavaScript', 'Bootstrap'],
      learned: 'Learned the fundamentals of building layouts that actually hold up across screen sizes, not just look fine on one.',
      github: 'https://github.com/helloayushhh/go-gym-fitness'
    },

    apsportfolio: {
      tag: 'HTML · CSS · JavaScript',
      title: 'APS Portfolio',
      summary: 'My personal portfolio — built not just to display projects, but to show how I think, what I build, and how I approach turning ideas into usable products.',
      points: [
        'Built the portfolio from scratch using HTML, CSS, and JavaScript.',
        'Designed the experience around projects, product thinking, technical work, and personal work.',
        'Focused on making the portfolio itself demonstrate my approach to building digital experiences.',
        'Continuously iterate on the design, interaction, responsiveness, and functionality as the portfolio evolves.',
        'The portfolio is itself a work sample: the way I structure and present it is part of what I want a recruiter to evaluate.'
      ],
      tech: ['HTML', 'CSS', 'JavaScript'],
      learned: 'Learned that a portfolio is itself a product — worth iterating on with the same rigor as anything else I build.',
      github: 'https://github.com/helloayushhh/myport'
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
  const modalLearned = document.getElementById('modalLearned');
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

    if (modalLearned) {
      if (data.learned) {
        modalLearned.textContent = data.learned;
        modalLearned.style.display = 'block';
      } else {
        modalLearned.style.display = 'none';
      }
    }

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

    const trigger = card.querySelector('.project-trigger');

    if (trigger) {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openProjectModal(key);
      });
    }
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