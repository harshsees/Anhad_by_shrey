/* =============================================
   ANAHAD BY SHREY — Hero Story

   Three beats, in the order the page reads:

   1. #heroMark   the logo mark holds the frame, blooms once, and dissolves
                  on the way out.
   2. #heroStage  the performance photograph. It lifts out of the mark's own
                  darkness and drifts slowly while the copy resolves beside
                  it. This used to scrub an 87-frame canvas sequence; it is
                  one photograph now, which is lighter, sharper and needs no
                  pin at all.
   3. #intro      "Popular Puja Services", which simply follows the hero up
                  the screen.

   Nothing here is pinned. A pin wraps its section in a spacer, and the seam
   between that spacer and the next section was one of the visible divisions
   the page was asked to lose. Without it the whole hero is one continuous
   scroll.

   Built on GSAP + ScrollTrigger, wired to the existing Lenis instance
   (js/smooth-scroll.js).
   ============================================= */

(function () {
  let els = null;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    els = collectEls();
    if (!els.stage || !els.photo) return;

    const noMotion =
      typeof gsap === 'undefined' ||
      typeof ScrollTrigger === 'undefined' ||
      Motion.prefersReducedMotion();

    if (noMotion) {
      // CSS (@media prefers-reduced-motion / .hero-no-motion) already renders
      // the settled hero.
      document.documentElement.classList.add('hero-no-motion');
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    playMarkIntro();
    buildMarkScene();
    buildStageScene();
  }

  function collectEls() {
    const id = (x) => document.getElementById(x);
    return {
      mark: id('heroMark'),
      markStack: id('heroMarkStack'),
      markLogo: id('heroMarkLogo'),
      markAura: id('heroMarkAura'),
      markParticles: id('heroMarkParticles'),
      markCue: id('heroMarkCue'),

      stage: id('heroStage'),
      frame: id('heroFrame'),
      photo: id('heroPhoto'),
      scrim: id('heroScrim'),
      copy: id('heroCopy'),
      pretitle: id('heroPretitle'),
      title: id('heroTitle'),
      tagline: id('heroTagline'),
      buttons: id('heroButtons'),
    };
  }

  /* ══════════════════════════════════════════
     Beat 1 — the mark
     ══════════════════════════════════════════ */

  function playMarkIntro() {
    // Autoplay entrance on load. This animates the mark's *children* while the
    // scroll timeline animates their container, so the two never contend for
    // the same properties on the same element.
    gsap.set(els.markLogo, { opacity: 0, scale: 0.94, filter: 'blur(14px)' });
    gsap.set(els.markCue, { opacity: 0 });

    gsap
      .timeline({ delay: 0.15 })
      .to(els.markLogo, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.4, ease: 'power3.out' })
      .to(els.markCue, { opacity: 1, duration: 0.6 }, 0.9);
  }

  function buildMarkScene() {
    let particles = null;
    if (els.markParticles && !Motion.isCompact()) {
      // Many small dots rather than a few soft ones: at r 1–3 they read as
      // out-of-focus bokeh, which fought the crisp dot field on the backdrop.
      // Dropping the radius and roughly doubling the count makes the drifting
      // layer and the static layer look like the same material.
      particles = Motion.createParticleField(els.markParticles, {
        count: 96,
        minRadius: 0.6,
        maxRadius: 1.5,
        speed: 0.14,
      });
    }

    // `bottom top` finishes the mark exactly as #heroStage reaches the top of
    // the viewport and takes over, so there is no dead scroll between them.
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: els.mark,
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });

    tl.to(els.markCue, { opacity: 0, duration: 0.25 }, 0)
      .to(els.markAura, { opacity: 1, scale: 1.08, duration: 0.32, ease: 'power2.out' }, 0.06)
      .to(els.markAura, { opacity: 0.1, scale: 0.72, duration: 0.87, ease: 'power2.in' }, 0.38)
      .to(els.markStack, { scale: 1.04, duration: 1.25, ease: 'none' }, 0)
      .to(els.markStack, { opacity: 0, filter: 'blur(8px)', duration: 0.2, ease: 'power2.in' }, 1.05);

    if (particles) {
      tl.to({}, { duration: 1.25, onUpdate: () => particles.setIntensity(1 - tl.progress()) }, 0);
    }
  }

  /* ══════════════════════════════════════════
     Beat 2 — the photograph and the copy
     ══════════════════════════════════════════ */

  function buildStageScene() {
    // The photo rises out of the mark's darkness rather than cutting in:
    // .hero-stage__backdrop starts on the exact colour .hero-mark__backdrop
    // ends on, so this reads as the frame lighting up, not as a swap.
    gsap.set(els.frame, { autoAlpha: 0 });
    gsap.set(els.photo, { scale: 1.12 });
    gsap.set(els.scrim, { opacity: 0 });
    gsap.set(els.copy, { autoAlpha: 0 });

    const copyKids = [els.pretitle, els.title, els.tagline, els.buttons];
    gsap.set(copyKids, { opacity: 0, y: 26, filter: 'blur(9px)' });

    // The arrival plays once, on its own clock, as the stage comes into view —
    // it is not scrubbed, so the copy cannot half-appear and sit there.
    gsap
      .timeline({
        scrollTrigger: { trigger: els.stage, start: 'top 65%', once: true },
      })
      .to(els.frame, { autoAlpha: 1, duration: 0.7, ease: 'power2.out' }, 0)
      .to(els.photo, { scale: 1, duration: 1.8, ease: 'power2.out' }, 0)
      .to(els.scrim, { opacity: 1, duration: 0.9 }, 0.15)
      .to(els.copy, { autoAlpha: 1, duration: 0.3 }, 0.25)
      .to(
        copyKids,
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.7, stagger: 0.09, ease: 'power3.out' },
        0.3
      );

    // A slow drift across the whole section, so the photo is never quite
    // static while it is on screen.
    gsap.to(els.photo, {
      yPercent: -6,
      ease: 'none',
      scrollTrigger: {
        trigger: els.stage,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  }
})();
