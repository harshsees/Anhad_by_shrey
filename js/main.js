/* =============================================
   ANAHAD BY SHREY — Main JavaScript
   Navigation, Scroll Animations, Testimonials,
   FAQ Accordion, Gallery Filters (Multi-page)
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollEffects();
  initScrollAnimations();
  initPeelImageHolders();
  initTestimonialCarousel();
  initSmoothScroll();
  initFaqAccordion();
  initGalleryFilters();
  initFooterYear();
  initContactForm();
  initStatCounters();
  initMagneticButtons();
  initCardSpotlight();
});

/* ── Stat Counters (count-up when scrolled into view) ── */
function initStatCounters() {
  const stats = document.querySelectorAll('.stat__number');
  if (!stats.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const animateCount = (el) => {
    const match = el.textContent.trim().match(/^([\d,]+)(.*)$/);
    if (!match) return;
    const target = parseInt(match[1].replace(/,/g, ''), 10);
    const suffix = match[2];
    if (!target) return;

    const duration = 1200;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased).toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target.toLocaleString() + suffix;
    };
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  stats.forEach(el => observer.observe(el));
}

/* ── Contact Form (guards against the Formspree ID not being set yet) ── */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const status = document.getElementById('contactFormStatus');

  form.addEventListener('submit', (e) => {
    if (form.action.includes('YOUR_FORMSPREE_ID')) {
      e.preventDefault();
      if (status) {
        status.textContent = 'Online booking isn\'t connected yet — please reach out on WhatsApp or call +91 94094 29354 and we\'ll respond right away.';
        status.classList.add('visible');
      }
    }
  });
}

/* ── Footer Year ── */
function initFooterYear() {
  document.querySelectorAll('.footer__year').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
}

/* ── Navbar ── */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  const navOverlay = document.getElementById('navOverlay');
  const links = navLinks.querySelectorAll('a');

  // Hamburger menu
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    const isOpen = navLinks.classList.toggle('open');
    navOverlay.classList.toggle('visible');
    document.body.classList.toggle('modal-open');
    hamburger.setAttribute('aria-expanded', isOpen);
    if (isOpen) {
      window.lenis?.stop();
    } else {
      window.lenis?.start();
    }
  });

  // Close menu on overlay click
  navOverlay.addEventListener('click', closeNav);

  // Close menu on link click
  links.forEach(link => {
    link.addEventListener('click', closeNav);
  });

  function closeNav() {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
    navOverlay.classList.remove('visible');
    document.body.classList.remove('modal-open');
    hamburger.setAttribute('aria-expanded', 'false');
    window.lenis?.start();
  }
}


/* ── Scroll Effects ── consolidated navbar show/hide + scrolled state,
   hero parallax, and scroll-to-top button visibility onto a single
   scroll-update path: Lenis's 'scroll' event when smooth scroll is
   active, or a single rAF-throttled native listener otherwise (never
   both, to avoid double/racing updates). */
function initScrollEffects() {
  const navbar = document.getElementById('navbar');
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  const hero = document.querySelector('.hero');
  const heroBg = hero ? hero.querySelector('.hero__bg') : null;
  const heroContent = hero ? hero.querySelector('.hero__content') : null;

  let lastScrollPosition = 0;

  const update = (scrollY) => {
    // Navbar show/hide + scrolled background — homepage only (inner
    // pages carry .scrolled in HTML from the start, see initNavbar).
    if (hero && navbar) {
      if (scrollY > lastScrollPosition && scrollY > 100) {
        navbar.classList.add('navbar-hidden');
      } else {
        navbar.classList.remove('navbar-hidden');
      }
      if (scrollY > 80) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
      lastScrollPosition = scrollY;
    }

    // Scroll-to-top button visibility
    if (scrollTopBtn) {
      if (scrollY > 400) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
    }

    // Hero parallax (subtle)
    if (hero) {
      const heroHeight = hero.offsetHeight;
      if (scrollY < heroHeight) {
        if (heroBg) {
          heroBg.style.transform = `translateY(${scrollY * 0.3}px)`;
        }
        if (heroContent) {
          heroContent.style.opacity = 1 - (scrollY / heroHeight) * 1.2;
          heroContent.style.transform = `translateY(${scrollY * 0.15}px)`;
        }
      }
    }
  };

  if (window.lenis) {
    window.lenis.on('scroll', (lenis) => update(lenis.animatedScroll));
  } else {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        update(window.pageYOffset);
        ticking = false;
      });
    }, { passive: true });
  }
}


/* ── Smooth Scroll (for same-page anchors + scroll-to-top button) ── */
function initSmoothScroll() {
  const scrollToTarget = (targetPosition) => {
    if (window.lenis) {
      window.lenis.scrollTo(targetPosition);
    } else {
      window.scrollTo({ top: targetPosition, behavior: 'smooth' });
    }
  };

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const navHeight = document.getElementById('navbar').offsetHeight;
        const targetPosition = target.offsetTop - navHeight;
        scrollToTarget(targetPosition);
      }
    });
  });

  const scrollTopBtn = document.getElementById('scrollTopBtn');
  if (scrollTopBtn) {
    scrollTopBtn.removeAttribute('onclick');
    scrollTopBtn.addEventListener('click', () => scrollToTarget(0));
  }
}


/* ── Scroll Animations (Intersection Observer) ── */
function initScrollAnimations() {
  const reveals = document.querySelectorAll('.reveal');
  
  if (!reveals.length) return;

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -80px 0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  reveals.forEach(el => observer.observe(el));
}


/* ── Peel Image Holder Component + Scroll Peel Transition ── */
function PeelImageHolder({ src, alt, title, className = '', scrollPeelId = '' }) {
  const clipId = `peelFrameClip-${scrollPeelId || 'holder'}-${Math.random().toString(36).slice(2, 8)}`;
  const label = alt || title || 'Ceremony image';
  const root = document.createElement('div');
  root.className = ['peel-image-holder', className].filter(Boolean).join(' ');
  root.setAttribute('role', 'img');
  root.setAttribute('aria-label', label);

  if (scrollPeelId) {
    root.dataset.scrollPeelId = scrollPeelId;
  }

  root.innerHTML = `
    <svg viewBox="0 0 200 280" preserveAspectRatio="xMidYMid slice" class="peel-image-holder__svg" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="${clipId}">
          <path d="M 40 74 A 60 60 0 0 1 160 74 L 160 246 Q 160 258 148 258 L 74 258 Q 40 258 40 224 Z"></path>
        </clipPath>
      </defs>

      <image href="${src}" x="0" y="0" width="200" height="280" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"></image>

      <path class="peel-corner-shadow" d="M 156 242 C 173 247 188 259 194 271 C 182 275 166 272 151 262 Z" fill="rgba(32, 8, 12, 0.35)"></path>

      <g class="peel-corner">
        <path d="M 160 238 C 176 244 193 258 198 274 C 184 277 166 271 149 260 Z" fill="#7f122b"></path>
        <path d="M 161 239 C 177 246 190 258 194 271 C 180 272 166 268 153 259 Z" fill="#b11d3b"></path>
        <path d="M 162 241 C 174 246 184 254 189 264 C 180 263 171 260 162 255 Z" fill="#db4a61" opacity="0.82"></path>
        <path d="M 162 243 C 171 247 179 253 184 260" fill="none" stroke="rgba(255, 211, 219, 0.78)" stroke-width="1.3" stroke-linecap="round"></path>
      </g>
    </svg>
  `;

  return root;
}

window.PeelImageHolder = PeelImageHolder;

function initPeelImageHolders() {
  const mounts = document.querySelectorAll('.js-peel-holder');
  if (!mounts.length) return;

  const holders = [];

  mounts.forEach((mount, index) => {
    const { src, alt, title, className, scrollPeelId } = mount.dataset;
    if (!src) return;

    const holder = PeelImageHolder({
      src,
      alt,
      title,
      className: className || '',
      scrollPeelId: scrollPeelId || `peel-holder-${index + 1}`
    });

    mount.replaceWith(holder);
    holders.push(holder);
  });

  initScrollPeelTransition(holders);
}

function initScrollPeelTransition(holders) {
  const overlay = document.getElementById('scrollPeelOverlay');
  if (!overlay || !holders.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const ease = (value) => value * value * (3 - 2 * value);

  const resetState = () => {
    holders.forEach((holder) => {
      holder.classList.remove('is-active');
      holder.style.setProperty('--scroll-peel-progress', '0');
    });
    overlay.style.setProperty('--peel-overlay-progress', '0');
    overlay.style.opacity = '0';
  };

  if (reduceMotion.matches) {
    resetState();
    overlay.style.display = 'none';
    return;
  }

  let activeHolder = null;
  let ticking = false;

  const update = () => {
    ticking = false;

    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportCenter = viewportHeight / 2;

    let nearestHolder = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    holders.forEach((holder) => {
      const rect = holder.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > viewportHeight) return;

      const holderCenter = rect.top + (rect.height / 2);
      const distanceToCenter = Math.abs(holderCenter - viewportCenter);
      if (distanceToCenter < nearestDistance) {
        nearestDistance = distanceToCenter;
        nearestHolder = holder;
      }
    });

    if (!nearestHolder) {
      activeHolder = null;
      resetState();
      return;
    }

    if (activeHolder !== nearestHolder) {
      if (activeHolder) activeHolder.classList.remove('is-active');
      activeHolder = nearestHolder;
      activeHolder.classList.add('is-active');
    }

    const normalized = clamp(1 - (nearestDistance / (viewportHeight * 0.58)), 0, 1);
    const progress = ease(normalized);

    holders.forEach((holder) => {
      holder.style.setProperty('--scroll-peel-progress', holder === activeHolder ? progress.toFixed(4) : '0');
    });

    const activeRect = activeHolder.getBoundingClientRect();
    const peelOriginX = activeRect.left + (activeRect.width * 0.84);
    const peelOriginY = activeRect.top + (activeRect.height * 0.92);

    overlay.style.setProperty('--peel-origin-x', `${peelOriginX}px`);
    overlay.style.setProperty('--peel-origin-y', `${peelOriginY}px`);
    overlay.style.setProperty('--peel-overlay-progress', progress.toFixed(4));
    overlay.style.opacity = progress > 0.01 ? '1' : '0';
  };

  const requestTick = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };

  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);

  if (typeof reduceMotion.addEventListener === 'function') {
    reduceMotion.addEventListener('change', (event) => {
      if (event.matches) {
        resetState();
        overlay.style.display = 'none';
        return;
      }
      overlay.style.display = '';
      requestTick();
    });
  }

  requestTick();
}


/* ── Testimonial Carousel ── */
function initTestimonialCarousel() {
  const track = document.getElementById('testimonialTrack');
  const dotsContainer = document.getElementById('testimonialDots');
  const prevBtn = document.getElementById('testimonialPrev');
  const nextBtn = document.getElementById('testimonialNext');
  
  if (!track) return;

  const testimonials = track.querySelectorAll('.testimonial');
  let currentIndex = 0;
  const total = testimonials.length;

  // Create dots
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('button');
    dot.classList.add('carousel-dot');
    if (i === 0) dot.classList.add('active');
    dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
  }

  function goTo(index) {
    currentIndex = index;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });
  }

  prevBtn.addEventListener('click', () => {
    goTo(currentIndex === 0 ? total - 1 : currentIndex - 1);
  });

  nextBtn.addEventListener('click', () => {
    goTo(currentIndex === total - 1 ? 0 : currentIndex + 1);
  });

  // Auto-rotate every 6 seconds
  let autoPlay = setInterval(() => {
    goTo(currentIndex === total - 1 ? 0 : currentIndex + 1);
  }, 6000);

  // Pause on hover
  const carousel = document.getElementById('testimonialCarousel');
  carousel.addEventListener('mouseenter', () => clearInterval(autoPlay));
  carousel.addEventListener('mouseleave', () => {
    autoPlay = setInterval(() => {
      goTo(currentIndex === total - 1 ? 0 : currentIndex + 1);
    }, 6000);
  });

  // Touch/swipe support
  let touchStartX = 0;
  let touchEndX = 0;

  carousel.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  carousel.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goTo(currentIndex === total - 1 ? 0 : currentIndex + 1);
      } else {
        goTo(currentIndex === 0 ? total - 1 : currentIndex - 1);
      }
    }
  }
}


/* ── FAQ Accordion ── */
function initFaqAccordion() {
  const faqList = document.getElementById('faqList');
  if (!faqList) return;

  const items = faqList.querySelectorAll('.faq-item');
  items.forEach(item => {
    const question = item.querySelector('.faq-item__question');
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      // Close all
      items.forEach(i => i.classList.remove('active'));
      // Toggle current
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}


/* ── Gallery Category Filters ── */
function initGalleryFilters() {
  const buttons = document.querySelectorAll('.gallery-cat-btn');
  const items = document.querySelectorAll('.gallery-grid--large .gallery-item');

  if (!buttons.length || !items.length) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active btn
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const cat = btn.dataset.category;
      items.forEach(item => {
        if (cat === 'all' || item.dataset.category === cat) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}


/* Hero parallax is now handled inside initScrollEffects() above, driven
   by Lenis's scroll event when active (or the rAF-throttled native
   fallback), instead of its own unthrottled listener. */

/* ── Hover Slider for Puja Cards ── */
const sliderTimers = new Map();

window.startHoverSlider = function(wrapper) {
  const track = wrapper.querySelector('.puja-card__slider-track');
  const dotsContainer = wrapper.querySelector('.puja-card__dots');
  if (!track) return;
  
  const slides = track.querySelectorAll('.puja-card__slide');
  if (slides.length <= 1) return;
  
  let dots = [];
  if (dotsContainer) {
    dots = Array.from(dotsContainer.querySelectorAll('.puja-card__dot'));
  }
  
  let currentIndex = parseInt(track.dataset.currentIndex || '0');
  
  const timer = setInterval(() => {
    currentIndex = (currentIndex + 1) % slides.length;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    track.dataset.currentIndex = currentIndex;
    
    // Update dots
    if (dots.length > 0) {
      dots.forEach(d => d.classList.remove('active'));
      if (dots[currentIndex]) {
        dots[currentIndex].classList.add('active');
      }
    }
  }, 1100); // 1100ms swipe speed
  
  sliderTimers.set(wrapper, timer);
};

window.stopHoverSlider = function(wrapper) {
  const timer = sliderTimers.get(wrapper);
  if (timer) {
    clearInterval(timer);
    sliderTimers.delete(wrapper);
  }
  
  // Instantly snap back to the first image on unhover
  const track = wrapper.querySelector('.puja-card__slider-track');
  if (track) {
    track.style.transition = 'none'; // remove transition for instant snap
    track.style.transform = `translateX(0%)`;
    track.dataset.currentIndex = 0;
    
    const dotsContainer = wrapper.querySelector('.puja-card__dots');
    if (dotsContainer) {
      const dots = Array.from(dotsContainer.querySelectorAll('.puja-card__dot'));
      dots.forEach(d => d.classList.remove('active'));
      if (dots[0]) dots[0].classList.add('active');
    }
    
    // restore transition immediately after layout calculation
    setTimeout(() => {
      track.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
    }, 50);
  }
};


/* ── Magnetic Buttons (mouse-only, reduced-motion aware) ──
   Buttons pull slightly toward the cursor on hover and spring back on
   leave. Skipped on touch/coarse-pointer devices and under
   prefers-reduced-motion. The pull itself rides the CSS transform
   transition already defined on .btn (see css/styles.css) — no inline
   transition juggling needed. */
function initMagneticButtons() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduceMotion || !canHover) return;

  const strength = 0.3;
  const maxOffset = 10;

  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const offsetX = Math.max(-maxOffset, Math.min(maxOffset, x * strength));
      const offsetY = Math.max(-maxOffset, Math.min(maxOffset, y * strength));
      btn.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}


/* ── Card Spotlight (mouse-only, reduced-motion aware) ──
   Puja/why cards get a soft glow that follows the cursor, driven by
   --mouse-x/--mouse-y custom properties consumed by a ::before layer
   in css/styles.css. Same gating as the magnetic buttons above.
   Delegated on document because .puja-card is rendered asynchronously
   (puja-modal.js fetches data/pujas.json after DOMContentLoaded), so a
   direct querySelectorAll here would miss it. */
function initCardSpotlight() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduceMotion || !canHover) return;

  document.addEventListener('mousemove', (e) => {
    const card = e.target.closest('.puja-card, .why-card');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  });
}
