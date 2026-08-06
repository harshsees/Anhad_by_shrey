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

/* ── Contact Form ──
   Posts to Formspree over fetch so the visitor never leaves the page, and
   reports back in place. Until the real form ID is pasted into contact.html
   the submit is blocked and the visitor is pointed at WhatsApp, so no inquiry
   can silently disappear into an unconfigured endpoint. */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const status = document.getElementById('contactFormStatus');
  const button = form.querySelector('button[type="submit"]');
  const buttonLabel = button ? button.innerHTML : '';

  const say = (message, kind) => {
    if (!status) return;
    status.textContent = message;
    status.className = 'contact-form__status visible contact-form__status--' + kind;
  };

  const setBusy = (busy) => {
    if (!button) return;
    button.disabled = busy;
    button.innerHTML = busy ? 'Sending…' : buttonLabel;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (form.action.includes('YOUR_FORMSPREE_ID')) {
      say(
        'Online booking isn\'t connected yet — please reach out on WhatsApp or call +91 94094 29354 and we\'ll respond right away.',
        'error'
      );
      return;
    }

    // A bot that fills every field it finds trips this; a person never sees it.
    if (form.elements._gotcha && form.elements._gotcha.value) return;

    if (!form.checkValidity()) {
      form.reportValidity();
      say('Please fill in your name and phone number so Shrey can reach you.', 'error');
      return;
    }

    setBusy(true);
    say('Sending your inquiry…', 'pending');

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        form.reset();
        say(
          'Thank you — your inquiry has reached Shrey. You will hear back shortly, usually within a day.',
          'success'
        );
      } else {
        // Formspree reports validation and quota problems in the body.
        const data = await response.json().catch(() => null);
        const detail = data && data.errors && data.errors.length
          ? data.errors.map((x) => x.message).join(' ')
          : 'Something went wrong at our end.';
        say(detail + ' Please try again, or reach us on WhatsApp at +91 94094 29354.', 'error');
      }
    } catch (err) {
      say(
        'Your inquiry could not be sent — please check your connection, or reach us on WhatsApp at +91 94094 29354.',
        'error'
      );
    } finally {
      setBusy(false);
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

  initNavFollower(navLinks);
}


/* ── The pill's sliding highlight ──
   One element parked behind the links that moves and resizes onto whichever
   item is active or hovered. Measuring rather than hard-coding widths means
   the highlight fits each label exactly, and keeps fitting when the labels
   change or the font loads late and reflows them.

   .navbar__cta is excluded throughout: it carries its own fill, and sliding a
   translucent capsule under a solid gold button reads as a rendering fault. */
function initNavFollower(navLinks) {
  if (!navLinks) return;

  const items = Array.from(navLinks.querySelectorAll('a:not(.navbar__cta)'));
  if (!items.length) return;

  const follower = document.createElement('span');
  follower.className = 'navbar__follower';
  follower.setAttribute('aria-hidden', 'true');
  navLinks.prepend(follower);

  const home = navLinks.querySelector('a.active:not(.navbar__cta)');
  let resting = home || null;

  const moveTo = (el) => {
    if (!el) {
      follower.classList.remove('is-ready');
      return;
    }
    // offsetLeft is relative to .navbar__links, which is the positioned
    // ancestor — no getBoundingClientRect arithmetic needed, and no dependence
    // on where the page happens to be scrolled to.
    follower.style.width = el.offsetWidth + 'px';
    follower.style.transform = `translateX(${el.offsetLeft}px)`;
    follower.classList.add('is-ready');
  };

  items.forEach((el) => {
    el.addEventListener('mouseenter', () => moveTo(el));
    el.addEventListener('focus', () => moveTo(el));
  });

  navLinks.addEventListener('mouseleave', () => moveTo(resting));
  navLinks.addEventListener('focusout', (e) => {
    if (!navLinks.contains(e.relatedTarget)) moveTo(resting);
  });

  // The pill is laid out in the webfont, so the first measurement is taken
  // against the fallback and is wrong by a few pixels per label. Re-measure
  // once the real font is in, and on resize.
  const settle = () => moveTo(resting);
  settle();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(settle);
  window.addEventListener('resize', settle);
}


/* ── Scroll Effects ── consolidated navbar colour state,
   hero parallax, and scroll-to-top button visibility onto a single
   scroll-update path: Lenis's 'scroll' event when smooth scroll is
   active, or a single rAF-throttled native listener otherwise (never
   both, to avoid double/racing updates). */
/* Sections painted in maroon/dark art. The bar carries no background of its
   own any more, so its ink has to follow whatever happens to be behind it:
   over one of these it stays ivory, everywhere else it goes dark (.scrolled).
   Anything new that is dark-on-top just needs to match this list. */
const NAV_DARK_ZONES =
  '.hero-mark, .hero-stage, .page-header, .cta-banner, .footer, .section--dark, .hero';

function initScrollEffects() {
  const navbar = document.getElementById('navbar');
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  // #heroMark opens the homepage's cinematic hero (js/hero-story.js owns its
  // internal motion); .hero is the legacy selector used by the inner pages.
  const hero = document.getElementById('heroMark') || document.querySelector('.hero');
  const heroBg = hero ? hero.querySelector('.hero__bg') : null;
  const heroContent = hero ? hero.querySelector('.hero__content') : null;
  const darkZones = Array.from(document.querySelectorAll(NAV_DARK_ZONES));

  // Probe a little below the bar's own midline — deep enough to be inside the
  // section behind it, shallow enough not to read the one after.
  const inkUpdate = () => {
    if (!navbar) return;
    const probe = navbar.offsetHeight * 0.55;
    const overDark = darkZones.some((zone) => {
      const r = zone.getBoundingClientRect();
      return r.top <= probe && r.bottom > probe;
    });
    navbar.classList.toggle('scrolled', !overDark);
  };

  // Hide going down, show coming back up — the Team USA behaviour. The
  // threshold keeps the bar put through the small jitter a trackpad produces
  // at rest, which would otherwise flap it in and out.
  let lastY = 0;
  const HIDE_AFTER = 240;
  const JITTER = 6;

  const revealUpdate = (scrollY) => {
    if (!navbar) return;
    const delta = scrollY - lastY;
    if (Math.abs(delta) < JITTER) return;

    // Never hide while the mobile drawer is open — the drawer is a child of
    // the bar, so taking the bar off-screen would take the menu with it.
    const drawerOpen = document.getElementById('navLinks')?.classList.contains('open');
    const hide = delta > 0 && scrollY > HIDE_AFTER && !drawerOpen;
    navbar.classList.toggle('navbar--hidden', hide);
    lastY = scrollY;
  };

  const update = (scrollY) => {
    // Only the ink changes with what is behind the bar; the bar's own
    // visibility is a function of scroll direction, handled above.
    inkUpdate();
    revealUpdate(scrollY);

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

  // Set the opening ink before a single scroll event has fired, and re-read it
  // when a pin or a resize moves the zones under the bar.
  update(window.pageYOffset);
  window.addEventListener('resize', inkUpdate, { passive: true });
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.addEventListener('refresh', inkUpdate);
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
    // Lets js/section-motion.js sync the testimonials background glow to
    // the active quote without this module knowing anything about GSAP.
    document.dispatchEvent(new CustomEvent('testimonial:change', { detail: { index: currentIndex, total } }));
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


/* The gallery's category filter now lives in js/gallery-motion.js, which
   reflows the surviving tiles instead of snapping them. It was removed from
   here rather than left in place: both bound the same buttons, and this one
   set an inline `display`, which would have overridden the class the new
   one toggles. */


/* Hero parallax is now handled inside initScrollEffects() above, driven
   by Lenis's scroll event when active (or the rAF-throttled native
   fallback), instead of its own unthrottled listener. */

/* ── Hover Slider for Puja Cards ──
   Driven by GSAP rather than setInterval plus a CSS transition. Three things
   made the old one stutter:

   • setInterval fires on the timer thread, not the frame clock, so a tick
     landing mid-frame started the CSS transition a frame late and the slide
     arrived with a visible hitch.
   • The interval (1100ms) and the transition (400ms) were set independently,
     so the strip snapped to a stop and sat still for 700ms — read as a jerk
     rather than a pan.
   • Leaving the card set `transition: none`, jumped the track home, then put
     the transition back on a 50ms setTimeout. If the pointer returned inside
     that window the next move had no transition at all and teleported.

   One GSAP tween per move fixes all three: it is on the same rAF clock as
   Lenis, the hold is expressed as part of the same timeline, and leaving
   *animates* home with overwrite so a re-entry simply retargets the tween in
   flight instead of fighting it. */
const sliderTimers = new Map();

window.startHoverSlider = function (wrapper) {
  const track = wrapper.querySelector('.puja-card__slider-track');
  if (!track || sliderTimers.has(wrapper)) return;

  const slides = track.querySelectorAll('.puja-card__slide');
  if (slides.length <= 1) return;

  const dots = Array.from(wrapper.querySelectorAll('.puja-card__dot'));
  const setDots = (i) => dots.forEach((d, n) => d.classList.toggle('active', n === i));

  // No GSAP (or the visitor asked for less motion): step without tweening
  // rather than dropping the feature.
  const canTween = typeof gsap !== 'undefined' && !(window.Motion && Motion.prefersReducedMotion());

  let index = Number(track.dataset.currentIndex || 0);
  const state = {};

  const advance = () => {
    index = (index + 1) % slides.length;
    track.dataset.currentIndex = index;
    setDots(index);

    if (canTween) {
      gsap.to(track, {
        xPercent: -100 * index,
        duration: 0.9,
        ease: 'power3.inOut',
        overwrite: 'auto',
      });
      state.call = gsap.delayedCall(1.5, advance);
    } else {
      track.style.transform = `translateX(${-100 * index}%)`;
      state.call = { kill: () => clearTimeout(state.id) };
      state.id = setTimeout(advance, 1500);
    }
  };

  // A beat before the first move, so brushing across a grid of cards does not
  // set every one of them going.
  if (canTween) {
    state.call = gsap.delayedCall(0.45, advance);
  } else {
    state.id = setTimeout(advance, 450);
    state.call = { kill: () => clearTimeout(state.id) };
  }

  sliderTimers.set(wrapper, state);
};

window.stopHoverSlider = function (wrapper) {
  const state = sliderTimers.get(wrapper);
  if (state) {
    state.call?.kill();
    sliderTimers.delete(wrapper);
  }

  const track = wrapper.querySelector('.puja-card__slider-track');
  if (!track) return;

  track.dataset.currentIndex = 0;
  const dots = Array.from(wrapper.querySelectorAll('.puja-card__dot'));
  dots.forEach((d, n) => d.classList.toggle('active', n === 0));

  if (typeof gsap !== 'undefined' && !(window.Motion && Motion.prefersReducedMotion())) {
    gsap.to(track, { xPercent: 0, duration: 0.7, ease: 'power3.out', overwrite: 'auto' });
  } else {
    track.style.transform = 'translateX(0%)';
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
