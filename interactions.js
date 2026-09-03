(() => {
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
  const revealItems = [...document.querySelectorAll('[data-reveal]')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  root.classList.add('is-enhanced');

  revealItems.forEach(item => {
    const delay = Number.parseInt(item.dataset.revealDelay || '0', 10);
    item.style.setProperty('--reveal-delay', `${Math.max(0, delay)}ms`);
  });

  let revealObserver = null;

  function revealAll() {
    revealItems.forEach(item => item.classList.add('is-revealed'));
    revealObserver?.disconnect();
    revealObserver = null;
  }

  function initializeReveals() {
    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      revealAll();
      return;
    }

    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        revealObserver.unobserve(entry.target);
      });
    }, {
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.12,
    });

    revealItems.forEach(item => revealObserver.observe(item));
  }

  initializeReveals();

  const onMotionPreferenceChange = event => {
    root.classList.toggle('reduce-motion', event.matches);
    if (event.matches) revealAll();
  };

  root.classList.toggle('reduce-motion', reducedMotion.matches);
  if ('addEventListener' in reducedMotion) {
    reducedMotion.addEventListener('change', onMotionPreferenceChange);
  } else {
    reducedMotion.addListener(onMotionPreferenceChange);
  }

  if (!header) return;

  let scrollFrame = 0;
  const updateHeader = () => {
    header.classList.toggle('is-compact', window.scrollY > 72);
    scrollFrame = 0;
  };

  const requestHeaderUpdate = () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(updateHeader);
  };

  updateHeader();
  window.addEventListener('scroll', requestHeaderUpdate, { passive: true });

  const sectionLinks = new Map();
  navLinks.forEach(link => {
    const id = decodeURIComponent(link.hash.slice(1));
    const section = document.getElementById(id);
    if (section) sectionLinks.set(section, link);
  });

  if (!sectionLinks.size || !('IntersectionObserver' in window)) return;

  const visibleSections = new Set();

  function setActiveSection(section) {
    sectionLinks.forEach((link, candidate) => {
      if (candidate === section) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function updateActiveSection() {
    if (window.scrollY < Math.max(120, window.innerHeight * 0.45)) {
      setActiveSection(null);
      return;
    }

    const candidates = [...visibleSections];
    if (!candidates.length) return;

    const readingLine = header.getBoundingClientRect().height + window.innerHeight * 0.2;
    candidates.sort((a, b) => {
      const aDistance = Math.abs(a.getBoundingClientRect().top - readingLine);
      const bDistance = Math.abs(b.getBoundingClientRect().top - readingLine);
      return aDistance - bDistance;
    });
    setActiveSection(candidates[0]);
  }

  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        visibleSections.add(entry.target);
      } else {
        visibleSections.delete(entry.target);
      }
    });
    updateActiveSection();
  }, {
    rootMargin: '-12% 0px -48% 0px',
    threshold: 0,
  });

  sectionLinks.forEach((_link, section) => sectionObserver.observe(section));
  window.addEventListener('scroll', updateActiveSection, { passive: true });
})();
