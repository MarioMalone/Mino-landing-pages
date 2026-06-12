// Language switching + dark mode + interaction logic

(function () {
  'use strict';

  // ── State ──
  let currentLang = localStorage.getItem('mino-lang') || 'zh';

  // ── DOM refs ──
  const navbar = document.getElementById('navbar');
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const langBtns = [document.getElementById('lang-toggle'), document.getElementById('lang-toggle-mobile')];
  const themeBtns = [document.getElementById('theme-toggle'), document.getElementById('theme-toggle-mobile')];
  const scrollBtn = document.getElementById('scroll-to-top');

  // ── Language toggle ──
  function applyLang(lang) {
    currentLang = lang;
    localStorage.setItem('mino-lang', lang);
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-zh][data-en]').forEach(function (el) {
      el.textContent = el.getAttribute('data-' + lang);
    });

    langBtns.forEach(function (btn) {
      if (btn) {
        btn.textContent = lang === 'zh' ? '中' : 'EN';
        btn.setAttribute('aria-label', lang === 'zh' ? 'Switch to English' : '切换到中文');
      }
    });
  }

  langBtns.forEach(function (btn) {
    if (btn) {
      btn.addEventListener('click', function () {
        applyLang(currentLang === 'zh' ? 'en' : 'zh');
      });
    }
  });

  // Apply stored language on load
  applyLang(currentLang);

  // ── Dark mode toggle ──
  // mode: 'light' | 'dark' | 'system'
  function getStoredTheme() {
    return localStorage.getItem('mino-theme') || 'system';
  }

  function systemPrefersDark() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function applyTheme(mode) {
    // mode is 'light', 'dark', or 'system'
    var shouldBeDark = (mode === 'dark') || (mode === 'system' && systemPrefersDark());
    document.documentElement.classList.toggle('dark', shouldBeDark);
    localStorage.setItem('mino-theme', mode);

    // Update theme-color meta tag
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', shouldBeDark ? '#1e1e1e' : '#4A90D9');
    }
  }

  function cycleTheme() {
    var current = getStoredTheme();
    // system -> dark -> light -> system
    var next;
    if (current === 'system') next = 'dark';
    else if (current === 'dark') next = 'light';
    else next = 'system';
    applyTheme(next);
  }

  // Add click handlers to both theme toggle buttons
  themeBtns.forEach(function (btn) {
    if (btn) {
      btn.addEventListener('click', cycleTheme);
    }
  });

  // Apply stored theme on load
  applyTheme(getStoredTheme());

  // Listen for system theme changes (only matters in 'system' mode)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
    if (getStoredTheme() === 'system') {
      applyTheme('system');
    }
  });

  // ── Mobile menu ──
  function closeMobileMenu() {
    mobileMenu.classList.add('hidden');
    menuToggle.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.focus();
  }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function () {
      var isHidden = mobileMenu.classList.contains('hidden');
      if (isHidden) {
        mobileMenu.classList.remove('hidden');
        menuToggle.classList.add('menu-open');
        menuToggle.setAttribute('aria-expanded', 'true');
        // Focus first link in menu
        var firstLink = mobileMenu.querySelector('a');
        if (firstLink) firstLink.focus();
      } else {
        closeMobileMenu();
      }
    });

    // Close mobile menu when a link is clicked
    mobileMenu.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', closeMobileMenu);
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
        closeMobileMenu();
      }
    });
  }

  // ── Navbar scroll shadow ──
  function onScroll() {
    if (navbar) {
      navbar.classList.toggle('scrolled', window.scrollY > 8);
    }
    // Scroll-to-top button visibility
    if (scrollBtn) {
      var showScrollBtn = window.scrollY > 400;
      scrollBtn.classList.toggle('visible', showScrollBtn);
      scrollBtn.setAttribute('aria-hidden', String(!showScrollBtn));
      scrollBtn.setAttribute('tabindex', showScrollBtn ? '0' : '-1');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── Scroll to top ──
  if (scrollBtn) {
    scrollBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ── Stats counter animation ──
  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-target'), 10);
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1200; // ms
    var startTime = null;

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var elapsed = timestamp - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var easedProgress = easeOutCubic(progress);
      var current = Math.round(easedProgress * target);
      el.textContent = prefix + current + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  // Use IntersectionObserver to trigger counter animation
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var statNumbers = document.querySelectorAll('.stat-number[data-target]');
  if (statNumbers.length > 0 && 'IntersectionObserver' in window) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          if (prefersReducedMotion) {
            // Set final value immediately without animation
            var el = entry.target;
            var target = parseInt(el.getAttribute('data-target'), 10);
            var prefix = el.getAttribute('data-prefix') || '';
            var suffix = el.getAttribute('data-suffix') || '';
            el.textContent = prefix + target + suffix;
          } else {
            animateCounter(entry.target);
          }
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    statNumbers.forEach(function (el) {
      counterObserver.observe(el);
    });
  }

})();
