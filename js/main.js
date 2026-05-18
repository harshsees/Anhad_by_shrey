/* =============================================
   ANAHAD BY SHREY — Main JavaScript
   Navigation, Scroll Animations, Testimonials,
   FAQ Accordion, Gallery Filters (Multi-page)
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initDynamicTitlebar();
  initScrollAnimations();
  initTestimonialCarousel();
  initSmoothScroll();
  initFaqAccordion();
  initGalleryFilters();
  initFloatingActions();
});

/* ── Navbar ── */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  const navOverlay = document.getElementById('navOverlay');
  const links = navLinks.querySelectorAll('a');

  // Only apply scroll effect on homepage (hero page)
  const hero = document.querySelector('.hero');
  if (hero) {
    // Homepage: navbar starts transparent
    navbar.classList.remove('scrolled');
    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 80) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }
  // Inner pages already have .scrolled in HTML

  // Hamburger menu
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
    navOverlay.classList.toggle('visible');
    document.body.classList.toggle('modal-open');
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
  }
}


/* ── Dynamic Title Bar ── */
function initDynamicTitlebar() {
  const titlebar = document.getElementById('dynamicTitlebar');
  if (!titlebar) return;

  let scrollTimeout;
  let lastScrollPosition = 0;
  const SCROLL_THRESHOLD = 150;

  window.addEventListener('scroll', () => {
    const currentScrollPosition = window.pageYOffset || document.documentElement.scrollTop;

    if (currentScrollPosition > SCROLL_THRESHOLD) {
      titlebar.classList.add('hidden');
    } else {
      titlebar.classList.remove('hidden');
    }

    if (currentScrollPosition > 50) {
      titlebar.classList.add('scrolling');
    } else {
      titlebar.classList.remove('scrolling');
    }

    lastScrollPosition = currentScrollPosition;

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {}, 150);
  }, { passive: true });
}


/* ── Floating Actions ── */
function initFloatingActions() {
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  if (!scrollTopBtn) return;
  
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 400) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  });
}


/* ── Smooth Scroll (for same-page anchors only) ── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const navHeight = document.getElementById('navbar').offsetHeight;
        const targetPosition = target.offsetTop - navHeight;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
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


/* ── Parallax Effect on Hero (subtle) ── */
window.addEventListener('scroll', () => {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  
  const scrolled = window.pageYOffset;
  const heroHeight = hero.offsetHeight;
  
  if (scrolled < heroHeight) {
    const bg = hero.querySelector('.hero__bg');
    if (bg) {
      bg.style.transform = `translateY(${scrolled * 0.3}px)`;
    }
    const content = hero.querySelector('.hero__content');
    if (content) {
      content.style.opacity = 1 - (scrolled / heroHeight) * 1.2;
      content.style.transform = `translateY(${scrolled * 0.15}px)`;
    }
  }
});

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
