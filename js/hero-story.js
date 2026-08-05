/* =============================================
   ANAHAD BY SHREY — Hero Story

   Three beats, in the order the page reads:

   1. #heroMark   the logo mark holds the frame, blooms once, and dissolves
                  on the way out. Never pinned: a pin leaves the section's
                  own height to scroll past after its timeline is spent,
                  which reads as a blank panel.
   2. #heroStage  the performance photo. A scroll-scrubbed canvas sequence
                  carries Shrey through the take while the copy resolves
                  beside it. Its backdrop starts on exactly the colour the
                  mark's ends on, so beat 1 cross-dissolves into beat 2 with
                  no visible seam.
   3. #intro      "Popular Puja Services". The stage's pin ends the moment
                  the sequence is spent, so the hero scrolls away normally
                  and #intro follows it up the screen — no negative-margin
                  overlap, no z-index swap, no hard cut.

   Built on GSAP + ScrollTrigger, wired to the existing Lenis instance
   (js/smooth-scroll.js).
   ============================================= */

(function () {
  const FRAME_COUNT = 87;
  const SEQ_TIERS = [
    { name: 'w640', maxCssWidth: 700 },
    { name: 'w1280', maxCssWidth: Infinity },
  ];

  const A = Motion.seqAnchors.heroSeq;

  let els = null;
  let seq = null;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    els = collectEls();
    if (!els.stage || !els.canvas) return;

    seq = Motion.createFrameSequence(els.canvas, {
      count: FRAME_COUNT,
      naturalW: A.naturalW,
      naturalH: A.naturalH,
      focal: A.focal,
      tiers: SEQ_TIERS,
      path: (tier, n) => `assets/hero-seq/${tier}/frame-${String(n).padStart(3, '0')}.jpg`,
      onFirstFrame: () => els.stage.classList.add('is-painted'),
      onReady: () => {
        els.stage.classList.add('is-ready');
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
      },
    });

    const noMotion =
      typeof gsap === 'undefined' ||
      typeof ScrollTrigger === 'undefined' ||
      Motion.prefersReducedMotion();

    if (noMotion) {
      // CSS (@media prefers-reduced-motion / .no-motion) already renders the
      // settled hero; just park the sequence on its final frame.
      document.documentElement.classList.add('hero-no-motion');
      seq.ready.then(() => seq.setProgress(1));
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Pinning re-lays-out the stage, so re-measure the cover rect on every
    // refresh.
    ScrollTrigger.addEventListener('refresh', () => seq.resize());

    playMarkIntro();

    // `bottom top` makes the mark's timeline finish at the exact scroll
    // position where #heroStage reaches the top of the viewport and takes
    // over, so there is no dead scroll between the two.
    ScrollTrigger.matchMedia({
      '(min-width: 900px)': () => {
        const a = buildMarkScene({ end: 'bottom top' });
        const b = buildStageScene({ pin: true, end: '+=220%' });
        return () => {
          a();
          b();
        };
      },
      '(max-width: 899px)': () => {
        const a = buildMarkScene({ end: 'bottom top' });
        const b = buildStageScene({ pin: false, end: '+=160%' });
        return () => {
          a();
          b();
        };
      },
    });
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
      canvas: id('heroCanvas'),
      canvasWrap: id('heroCanvasWrap'),
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

  function buildMarkScene(options) {
    let particles = null;
    if (els.markParticles && !Motion.isCompact()) {
      particles = Motion.createParticleField(els.markParticles, { count: 42 });
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: els.mark,
        start: 'top top',
        end: options.end,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });

    // The mark holds the frame for most of the beat and only dissolves on the
    // way out — the aura blooms once, then falls away ahead of it.
    tl.to(els.markCue, { opacity: 0, duration: 0.25 }, 0)
      .to(els.markAura, { opacity: 1, scale: 1.08, duration: 0.32, ease: 'power2.out' }, 0.06)
      .to(els.markAura, { opacity: 0.1, scale: 0.72, duration: 0.87, ease: 'power2.in' }, 0.38)
      .to(els.markStack, { scale: 1.04, duration: 1.25, ease: 'none' }, 0)
      // Only the last sliver dissolves. Fading the mark out any earlier leaves
      // the rest of the beat as bare backdrop.
      .to(
        els.markStack,
        { opacity: 0, filter: 'blur(8px)', duration: 0.2, ease: 'power2.in' },
        1.05
      );

    if (particles) {
      tl.to(
        {},
        { duration: 1.25, onUpdate: () => particles.setIntensity(1 - tl.progress()) },
        0
      );
    }

    return () => {
      if (particles) particles.destroy();
      if (tl.scrollTrigger) tl.scrollTrigger.kill();
      tl.kill();
    };
  }

  /* ══════════════════════════════════════════
     Beat 2 — the photo, the sequence, the copy
     ══════════════════════════════════════════ */

  function buildStageScene(options) {
    const copyKids = [els.pretitle, els.title, els.tagline, els.buttons];

    // The photo rises out of the mark's own darkness rather than cutting in:
    // .hero-stage__backdrop starts on the exact colour .hero-mark__backdrop
    // ends on, so this fade reads as the frame lighting up, not as a swap.
    gsap.set(els.canvasWrap, { autoAlpha: 0, scale: 1.06 });
    gsap.set(els.scrim, { opacity: 0 });
    gsap.set(els.copy, { autoAlpha: 0 });
    gsap.set(copyKids, { opacity: 0, y: 26, filter: 'blur(9px)' });

    const seqState = { p: 0 };

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: els.stage,
        start: 'top top',
        end: options.end,
        scrub: 1,
        pin: options.pin,
        anticipatePin: options.pin ? 1 : 0,
        invalidateOnRefresh: true,
      },
    });

    tl
      // Lights up and settles out of its slight over-scale as the mark leaves.
      .to(els.canvasWrap, { autoAlpha: 1, duration: 0.22, ease: 'power2.out' }, 0)
      .to(els.canvasWrap, { scale: 1, duration: 0.9, ease: 'power2.out' }, 0)
      // The sequence carries the take. Under scrub every timeline unit is
      // scroll distance, so this is the bulk of the pin.
      .to(
        seqState,
        { p: 1, duration: 1.7, ease: 'none', onUpdate: () => seq.setProgress(seqState.p) },
        0.2
      )
      // Copy resolves with the photo, not a screen and a half later.
      .to(els.scrim, { opacity: 1, duration: 0.4 }, 0.1)
      .to(els.copy, { autoAlpha: 1, duration: 0.14 }, 0.14)
      .to(copyKids, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.22, stagger: 0.04 }, 0.18);

    return () => {
      if (tl.scrollTrigger) tl.scrollTrigger.kill();
      tl.kill();
    };
  }

})();
