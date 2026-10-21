document.addEventListener('DOMContentLoaded', () => {
  // Primary navigation toggle (mobile)
  const navToggle = document.querySelector('.nav-toggle');
  const primaryMenu = document.getElementById('primary-menu');
  if (navToggle && primaryMenu) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      primaryMenu.classList.toggle('open', !expanded);
      // When closing the primary menu, also ensure any open submenus are closed
      if (expanded) {
        document.querySelectorAll('.menu li.has-submenu.open').forEach((li) => {
          li.classList.remove('open');
          li.querySelector(':scope > a')?.setAttribute('aria-expanded', 'false');
        });
      }
    });
  }

  // Generic submenu toggles (mobile): first tap opens, second tap navigates.
  const isMobileQuery = '(max-width: 760px)';
  const isMobileWidth = () => window.matchMedia(isMobileQuery).matches;

  const setupSubmenuToggles = () => {
    document.querySelectorAll('.menu li.has-submenu').forEach((li) => {
      const link = li.querySelector(':scope > a');
      if (!link) return;
      if (link.dataset.bound === 'true') return; // avoid duplicate binding
      link.dataset.bound = 'true';
      link.setAttribute('aria-expanded', link.getAttribute('aria-expanded') || 'false');

      link.addEventListener('click', (e) => {
        if (!isMobileWidth()) return;
        const isOpen = li.classList.contains('open');
        if (!isOpen) {
          e.preventDefault();
          li.classList.add('open');
          link.setAttribute('aria-expanded', 'true');
        } else {
          // allow navigation and tidy up
          li.classList.remove('open');
          link.setAttribute('aria-expanded', 'false');
          if (primaryMenu) primaryMenu.classList.remove('open');
          if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
        }
      });

      link.addEventListener('keydown', (e) => {
        if (!isMobileWidth()) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const isOpen = li.classList.contains('open');
          li.classList.toggle('open', !isOpen);
          link.setAttribute('aria-expanded', String(!isOpen));
        } else if (e.key === 'Escape') {
          li.classList.remove('open');
          link.setAttribute('aria-expanded', 'false');
        }
      });
    });
  };

  setupSubmenuToggles();

  // Close submenus when clicking outside (mobile only)
  document.addEventListener('click', (evt) => {
    if (!isMobileWidth()) return;
    const menu = document.querySelector('.menu');
    const clickedInsideMenu = menu ? menu.contains(evt.target) : false;
    if (!clickedInsideMenu) {
      document.querySelectorAll('.menu li.has-submenu.open').forEach((li) => {
        li.classList.remove('open');
        li.querySelector(':scope > a')?.setAttribute('aria-expanded', 'false');
      });
    }
  });

  // Reset submenus when switching to desktop view
  window.addEventListener('resize', () => {
    if (!isMobileWidth()) {
      document.querySelectorAll('.menu li.has-submenu.open').forEach((li) => {
        li.classList.remove('open');
        li.querySelector(':scope > a')?.setAttribute('aria-expanded', 'false');
      });
    }
  });

  // Smooth scroll for in-page anchor links
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href.length <= 1) return;
      const target = document.getElementById(href.slice(1));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', href);
      }
    });
  });

  // Highlight active Impactful WSU nav link when section is in view
  const impactfulLink = document.querySelector('.impactful-link');
  const impactfulSection = document.getElementById('impactful-wsu');
  if (impactfulLink && impactfulSection) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        impactfulLink.classList.toggle('active', entry.isIntersecting);
      });
    }, { root: null, threshold: 0.2 });
    observer.observe(impactfulSection);
  }

  const expandButtons = document.querySelectorAll('.expand-btn');
  const overlay = document.getElementById('modal-overlay');
  const modalBody = document.getElementById('modal-body');
  const modalTitle = document.getElementById('modal-title');
  const closeBtn = document.querySelector('.modal-close');
  const prevBtn = document.querySelector('.modal-prev');
  const nextBtn = document.querySelector('.modal-next');
  let lastFocused = null;
  let activeButton = null;
  let buttonsOrder = [];
  let activeIndex = -1;

  const openModal = (titleText, contentEl) => {
    lastFocused = document.activeElement;
    modalTitle.textContent = titleText || '';
    modalBody.innerHTML = contentEl ? contentEl.innerHTML : '';

    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    closeBtn.focus();
  };

  const closeModal = () => {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    modalBody.innerHTML = '';
    // Reset the triggering button state
    if (activeButton) {
      const activeSymbol = activeButton.querySelector('.symbol');
      if (activeSymbol) activeSymbol.textContent = '+';
      activeButton.setAttribute('aria-expanded', 'false');
      activeButton = null;
    }
    if (lastFocused) lastFocused.focus();
  };

  // Maintain an ordered list of buttons for navigation
  buttonsOrder = Array.from(expandButtons);

  expandButtons.forEach((btn, idx) => {
    const contentId = btn.getAttribute('aria-controls');
    const content = contentId ? document.getElementById(contentId) : null;
    const symbol = btn.querySelector('.symbol');
    const titleEl = btn.closest('.info-card')?.querySelector('.card-title');

    if (!content || !symbol || !titleEl) return;

    // Ensure card content stays hidden within card (we use it as source for the modal)
    content.setAttribute('aria-hidden', 'true');
    content.classList.remove('open');
    content.style.maxHeight = '0px';
    content.removeAttribute('hidden');

    btn.addEventListener('click', () => {
      const isOpen = overlay.classList.contains('is-open');

      // If modal already open and same button clicked, close it (toggle behavior)
      if (isOpen && activeButton === btn) {
        closeModal();
        return;
      }

      // If modal open from another card, reset that button first
      if (isOpen && activeButton && activeButton !== btn) {
        const prevSymbol = activeButton.querySelector('.symbol');
        if (prevSymbol) prevSymbol.textContent = '+';
        activeButton.setAttribute('aria-expanded', 'false');
      }

      // Set current button as active and open modal
      activeButton = btn;
      activeIndex = idx;
      symbol.textContent = '−';
      btn.setAttribute('aria-expanded', 'true');
      openModal(titleEl.textContent, content);
    });
  });

  // Close interactions
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
      closeModal();
    }
    // Arrow key navigation when modal is open
    if (overlay.classList.contains('is-open')) {
      if (e.key === 'ArrowLeft') {
        navigateModal(-1);
      } else if (e.key === 'ArrowRight') {
        navigateModal(1);
      }
    }
  });

  // Navigation helpers
  const navigateModal = (delta) => {
    if (activeIndex === -1) return;
    let newIndex = activeIndex + delta;
    if (newIndex < 0) newIndex = buttonsOrder.length - 1;
    if (newIndex >= buttonsOrder.length) newIndex = 0;

    const newBtn = buttonsOrder[newIndex];
    if (!newBtn) return;

    // Reset current button state
    if (activeButton) {
      const prevSymbol = activeButton.querySelector('.symbol');
      if (prevSymbol) prevSymbol.textContent = '+';
      activeButton.setAttribute('aria-expanded', 'false');
    }

    // Activate new button and update modal content
    const newContentId = newBtn.getAttribute('aria-controls');
    const newContent = newContentId ? document.getElementById(newContentId) : null;
    const newSymbol = newBtn.querySelector('.symbol');
    const newTitleEl = newBtn.closest('.info-card')?.querySelector('.card-title');

    if (!newContent || !newSymbol || !newTitleEl) return;

    activeButton = newBtn;
    activeIndex = newIndex;
    newSymbol.textContent = '−';
    newBtn.setAttribute('aria-expanded', 'true');
    openModal(newTitleEl.textContent, newContent);
  };

  if (prevBtn) prevBtn.addEventListener('click', () => navigateModal(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => navigateModal(1));

  // Scroll-to-top button behavior
  const scrollTopBtn = document.querySelector('.scroll-top');
  const toggleScrollTop = () => {
    if (!scrollTopBtn) return;
    const show = window.scrollY > 300;
    scrollTopBtn.classList.toggle('show', show);
  };
  window.addEventListener('scroll', toggleScrollTop);
  toggleScrollTop();
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Reveal on scroll for elements with .reveal
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const revealObs = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach((el) => revealObs.observe(el));
  }

  // Count-up animation for stats band
  const counters = document.querySelectorAll('.stat-value[data-count]');
  const formatNumber = (n) => {
    if (n >= 1000) return `${Math.round(n / 100) / 10}k+`;
    return `${n}`;
  };
  const runCounter = (el) => {
    const target = parseInt(el.getAttribute('data-count') || '0', 10);
    const duration = 1200; // ms
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const val = Math.floor(target * p);
      el.textContent = formatNumber(val);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = formatNumber(target);
    };
    requestAnimationFrame(step);
  };
  if (counters.length) {
    const counterObs = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach((el) => counterObs.observe(el));
  }
  // SDG 17 Dashboard removed per request

});