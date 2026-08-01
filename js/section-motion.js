/* =============================================
   ANAHAD BY SHREY — Section Motion
   Scroll choreography for the sections below the
   hero: #intro photo wipe, Ceremony Explorer depth
   parallax, Testimonials performance-stage, and the
   closing CTA particle bookend.
   ============================================= */

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    initIntroReveal();
    initCeremonyMotion();
    initTestimonialStage();
    initCtaFinale();
  });

  /* ── #intro: photo wipe + heading reveal ── */
  function initIntroReveal() {
    if (Motion.prefersReducedMotion()) return;

    const wrapper = document.getElementById('introImageWrapper');
    const heading = document.getElementById('introHeading');

    if (wrapper) {
      gsap.set(wrapper, { clipPath: 'inset(0 100% 0 0)' });
      gsap.to(wrapper, {
        clipPath: 'inset(0 0% 0 0)',
        duration: 1.1,
        ease: 'power3.inOut',
        scrollTrigger: { trigger: wrapper, start: 'top 82%', once: true },
      });
    }

    if (heading) {
      const words = Motion.splitWords(heading);
      gsap.set(words, { yPercent: 120, opacity: 0 });
      gsap.to(words, {
        yPercent: 0,
        opacity: 1,
        duration: 0.7,
        stagger: 0.04,
        ease: 'power3.out',
        scrollTrigger: { trigger: heading, start: 'top 88%', once: true },
      });
    }
  }

  /* ── Ceremony Explorer: heading reveal + diamond parallax depth ── */
  function initCeremonyMotion() {
    if (Motion.prefersReducedMotion()) return;

    const heading = document.getElementById('ceremonyHeading');
    const grid = document.getElementById('ceremonyGrid');
    if (!grid) return;

    if (heading) {
      const words = Motion.splitWords(heading);
      gsap.set(words, { yPercent: 120, opacity: 0 });
      gsap.to(words, {
        yPercent: 0,
        opacity: 1,
        duration: 0.7,
        stagger: 0.05,
        ease: 'power3.out',
        scrollTrigger: { trigger: heading, start: 'top 85%', once: true },
      });
    }

    // Parallax is skipped on touch/compact layouts, where the grid
    // stacks vertically and drifting diamonds would just look jittery.
    if (Motion.isCompact()) return;

    grid.querySelectorAll('.ceremony-decor-diamond').forEach((diamond, i) => {
      gsap.to(diamond, {
        yPercent: (i % 2 === 0 ? -1 : 1) * 30,
        ease: 'none',
        scrollTrigger: { trigger: grid, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  }

  /* ── Testimonials: active-quote stage glow + entrance ── */
  function initTestimonialStage() {
    const glow = document.getElementById('testimonialStageGlow');
    const section = document.getElementById('testimonials');
    if (!glow || !section) return;

    if (!Motion.prefersReducedMotion()) {
      const state = { x: 50 };
      document.addEventListener('testimonial:change', (e) => {
        const { index, total } = e.detail;
        const targetX = total > 1 ? (index / (total - 1)) * 100 : 50;
        gsap.to(state, {
          x: targetX,
          duration: 0.7,
          ease: 'power2.out',
          onUpdate: () => glow.style.setProperty('--stage-x', state.x + '%'),
        });
      });

      const carousel = section.querySelector('.testimonial-carousel');
      if (carousel) {
        gsap.from(carousel, {
          opacity: 0,
          scale: 0.96,
          filter: 'blur(6px)',
          duration: 1,
          scrollTrigger: { trigger: section, start: 'top 75%', once: true },
        });
      }
    }
  }

  /* ── CTA Banner: closing particle bookend + heading reveal ── */
  function initCtaFinale() {
    const section = document.getElementById('ctaBanner');
    const mount = document.getElementById('ctaParticles');
    const heading = document.getElementById('ctaHeading');
    if (!section) return;
    if (Motion.prefersReducedMotion()) return;

    if (mount && !Motion.isCompact()) {
      const particles = Motion.createParticleField(mount, { count: 26, speed: 0.12 });
      ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        onEnter: () => particles.setIntensity(1),
        onLeave: () => particles.setIntensity(0),
        onEnterBack: () => particles.setIntensity(1),
        onLeaveBack: () => particles.setIntensity(0),
      });
    }

    if (heading) {
      gsap.from(heading, {
        opacity: 0,
        scale: 0.92,
        filter: 'blur(10px)',
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: heading, start: 'top 85%', once: true },
      });
    }
  }
})();
