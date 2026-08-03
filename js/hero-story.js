/* =============================================
   ANAHAD BY SHREY — Hero Story

   Scene 1 (#heroMark)  the logo mark holds centre stage; a mic is drawn out
                        from behind it and sweeps away on a wavy path while
                        the mark scrolls off. Deliberately NOT pinned: a pin
                        leaves the section's own height to scroll past after
                        its timeline has finished, which read as a blank
                        panel between the mark and the photo.
   Scene 2 (#heroStage) the mic completes its arc onto the mic in frame 001 of
                        the canvas sequence. The travelling mic is cut from this
                        very footage, so the two are the same object: the photo
                        comes up underneath it at the moment it arrives, the
                        copy resolves with it, and the sequence carries the mic
                        down into his hand and to his mouth. No flash over the
                        join. Until then the stage shows only its backdrop,
                        which starts on the colour the mark's ends on so the
                        boundary between the two is invisible.
                        #intro is pulled up under the stage's exit so the hero
                        hands straight over instead of scrolling past twice.

   Built on GSAP + ScrollTrigger, wired to the existing Lenis instance
   (js/smooth-scroll.js). The mic path is driven from timeline onUpdate rather
   than tweened, because its landing point depends on live canvas geometry.
   ============================================= */

(function () {
  const FRAME_COUNT = 87;
  const SEQ_TIERS = [
    { name: 'w640', maxCssWidth: 700 },
    { name: 'w1280', maxCssWidth: Infinity },
  ];
  // Distance in images/mic-real.png pixels between the mic's head centre and
  // its base centre — the PNG is built so that span is 70% of its height, and
  // micAnchors.heroSeq.land.length measures the same span in the photo. Scale
  // is just the ratio of the two, so the travelling mic matches the
  // photographed one at any viewport.
  const MIC_BASE_H = 173;
  // Fraction of the stage timeline before the mic touches down. Scene 1 now
  // flies it all the way onto his hand, so this is only the slack that lets
  // mobile — where the stage is not pinned and is therefore still sliding up —
  // settle onto the live landing point.
  const DROP = 0.08;
  // Fraction of the mark scene spent drawing the mic out from behind the mark
  // before the travel proper starts.
  const EMERGE = 0.26;
  // Depth of the mic's S-swing, as a fraction of the straight-line distance to
  // the seam. Enough to read as storytelling, not so much that it looks tossed.
  const WAVE = 0.13;

  const A = Motion.micAnchors.heroSeq;
  const clamp01 = Motion.clamp01;
  const lerp = Motion.lerp;
  const ease = Motion.ease;

  let els = null;
  let seq = null;
  // Which scene currently owns the mic. Both scenes agree exactly on the seam
  // pose, so the hand-over is invisible even mid-scrub.
  let stageOwnsMic = false;

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
    bridgeLenis();

    // Pinning re-lays-out the stage, so re-measure the cover rect on every
    // refresh — the mic's landing point is derived from it.
    ScrollTrigger.addEventListener('refresh', () => seq.resize());

    gsap.set(els.mic, { xPercent: -50, yPercent: -50, transformOrigin: '50% 50%' });

    playMarkIntro();

    // The mark scene is never pinned, at either width: `bottom top` makes its
    // timeline finish at the exact scroll position where #heroStage reaches
    // the top of the viewport and takes over, so there is no dead scroll —
    // and no blank panel — between the two.
    ScrollTrigger.matchMedia({
      '(min-width: 900px)': () => {
        const a = buildMarkScene({ pin: false, end: 'bottom top' });
        const b = buildStageScene({ pin: true, end: '+=300%' });
        return () => {
          a();
          b();
        };
      },
      '(max-width: 899px)': () => {
        const a = buildMarkScene({ pin: false, end: 'bottom top' });
        const b = buildStageScene({ pin: false, end: '+=180%' });
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

      mic: id('heroMic'),
      micGlow: id('heroMicGlow'),

      stage: id('heroStage'),
      canvas: id('heroCanvas'),
      canvasWrap: id('heroCanvasWrap'),
      scrim: id('heroScrim'),
      copy: id('heroCopy'),
      pretitle: id('heroPretitle'),
      title: id('heroTitle'),
      tagline: id('heroTagline'),
      buttons: id('heroButtons'),
      socialProof: id('heroSocialProof'),
    };
  }

  function bridgeLenis() {
    if (!window.lenis) return;
    // GSAP's ScrollTrigger pin transform only applies correctly when
    // gsap.ticker is the SOLE driver of Lenis's raf loop (the official
    // Lenis+GSAP recipe). smooth-scroll.js constructs Lenis with
    // autoRaf: true for pages without GSAP; here we hand driving over
    // to gsap.ticker exclusively so there is exactly one driver, not two
    // (two conflicting time sources previously caused a runaway scroll).
    window.lenis.options.autoRaf = false;
    window.lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => window.lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ══════════════════════════════════════════
     Geometry — every pose the mic passes through
     ══════════════════════════════════════════ */

  /** The rect the canvas paints the frame into, in wrap-local px. Same maths
   *  frame-sequence.js uses, recomputed here so the poses below are available
   *  before the sequence has ever measured itself. */
  function frameRect(wrap) {
    return Motion.coverRect(wrap.width, wrap.height, A.naturalW, A.naturalH, A.focal.x, A.focal.y);
  }

  /** The mic Shrey is catching in frame 001, in viewport px.
   *
   *  With `projected`, the wrap's offset is taken relative to #heroStage
   *  instead of the viewport — i.e. where the hand *will* be once the stage
   *  reaches the top of the viewport. That is exactly the moment scene 2 takes
   *  over, so scene 1 can fly the mic all the way onto his hand while the
   *  stage is still below the fold. */
  function landPose(projected) {
    const wrap = els.canvasWrap.getBoundingClientRect();
    const origin = projected ? els.stage.getBoundingClientRect() : { left: 0, top: 0 };
    const r = frameRect(wrap);
    return {
      x: wrap.left - origin.left + r.x + A.land.cx * r.w,
      y: wrap.top - origin.top + r.y + A.land.cy * r.h,
      scale: (A.land.length * r.h) / MIC_BASE_H,
      rot: A.land.rotation,
    };
  }

  /** The pose the two scenes hand the mic over in. It is the landing pose
   *  itself: scene 1 now completes the whole journey, so the mic is already on
   *  his hand — inside the impact bloom — when the photo takes the screen.
   *  Nothing is left over for scene 2 to cross, which is what used to leave a
   *  blank panel between the mark and the photo. */
  function seamPose() {
    return landPose(true);
  }

  /** The logo mark's medallion — the point the mic is drawn out from — plus
   *  the point just clear of the mark where the travel proper begins. */
  function markPose() {
    const r = els.markLogo.getBoundingClientRect();
    const cx = r.left + r.width * 0.5;
    const cy = r.top + r.height * 0.22;
    return {
      cx,
      cy,
      // Down and to the left of the emblem: swinging out low gives the wavy
      // climb to his raised hand something to climb from.
      outX: cx - r.height * 0.3,
      outY: cy + r.height * 0.52,
    };
  }

  /* ══════════════════════════════════════════
     Scene 1 — the mark, and the mic it releases
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

  /* The mic's scene-1 pose — now the entire journey, medallion to hand. Two
     beats in one function so they are always continuous: it is drawn out from
     behind the mark (growing out of a blur at the medallion), then sweeps onto
     his hand along a single S-curve — the straight line to the seam plus one
     sine swing along its normal, damped so the pose at p = 1 is exactly
     seamPose(). The start point is re-read from the live logo rect every tick,
     so the mic stays attached to the mark while the mark scrolls away and only
     detaches as the travel takes over. */
  function placeMicForMark(p) {
    const m = markPose();
    const seam = seamPose();

    const out = ease.outCubic(clamp01(p / EMERGE));
    const travel = clamp01((p - EMERGE) / (1 - EMERGE));
    const t = ease.inOutCubic(travel);

    // End of the emerge — the pose the travel starts from.
    const ox = lerp(m.cx, m.outX, out);
    const oy = lerp(m.cy, m.outY, out);

    const dx = seam.x - ox;
    const dy = seam.y - oy;
    const len = Math.hypot(dx, dy) || 1;
    const swing = Math.sin(travel * Math.PI * 2) * WAVE * len * (1 - travel * 0.35);

    gsap.set(els.mic, {
      x: lerp(ox, seam.x, t) + (-dy / len) * swing,
      y: lerp(oy, seam.y, t) + (dx / len) * swing,
      scale: lerp(lerp(0.1, seam.scale * 0.74, out), seam.scale, t),
      rotation:
        lerp(lerp(16, -2, out), seam.rot, t) +
        Math.sin(travel * Math.PI * 2) * 9 * (1 - travel),
      opacity: clamp01(p / (EMERGE * 0.5)),
      filter: 'blur(' + ((1 - out) * 12).toFixed(2) + 'px)',
    });

    // The mic charges up over the second half of the travel.
    gsap.set(els.micGlow, { opacity: ease.inQuad(clamp01((travel - 0.5) / 0.5)) * 0.5 });
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
        pin: options.pin,
        anticipatePin: options.pin ? 1 : 0,
        invalidateOnRefresh: true,
      },
      onUpdate: () => {
        if (!stageOwnsMic) placeMicForMark(tl.progress());
      },
    });

    // The mark holds the frame for most of the scene and only dissolves on the
    // way out — the aura blooms once as the mic clears it, then falls away.
    tl.to(els.markCue, { opacity: 0, duration: 0.25 }, 0)
      .to(els.markAura, { opacity: 1, scale: 1.08, duration: 0.32, ease: 'power2.out' }, 0.06)
      .to(els.markAura, { opacity: 0.1, scale: 0.72, duration: 0.87, ease: 'power2.in' }, 0.38)
      .to(els.markStack, { scale: 1.04, duration: 1.25, ease: 'none' }, 0)
      // Only the last sliver dissolves. Fading the mark out any earlier leaves
      // the rest of the scene as bare backdrop — which is exactly the empty
      // stretch the impact bloom used to paper over, and the bloom is gone now.
      .to(
        els.markStack,
        { opacity: 0, filter: 'blur(8px)', duration: 0.15, ease: 'power2.in' },
        1.1
      );

    if (particles) {
      tl.to(
        {},
        { duration: 1.25, onUpdate: () => particles.setIntensity(1 - tl.progress()) },
        0
      );
    }

    // Park the mic at its scene-1 pose straight away so it isn't visible at
    // full size for a frame before the first scroll event lands.
    placeMicForMark(0);

    return () => {
      if (particles) particles.destroy();
      if (tl.scrollTrigger) tl.scrollTrigger.kill();
      tl.kill();
    };
  }

  /* ══════════════════════════════════════════
     Scene 2 — the drop, the catch, the sequence
     ══════════════════════════════════════════ */

  function placeMicForStage(p) {
    const total = stageDuration();
    const seam = seamPose();
    const land = landPose(false);
    const t = ease.inOutCubic(clamp01(p / (DROP / total)));

    // Opacity is derived from progress rather than tweened, so a reload part
    // way into the stage still shows the mic in flight instead of inheriting
    // whatever value the scene-1 timeline last wrote. It holds until the photo
    // underneath is fully up, then goes — the photographed mic is in the same
    // pose, so what is left behind is the same mic.
    const fadeFrom = 0.06 / total;
    const fadeTo = 0.13 / total;

    gsap.set(els.mic, {
      x: lerp(seam.x, land.x, t),
      y: lerp(seam.y, land.y, t),
      scale: lerp(seam.scale, land.scale, t),
      rotation: lerp(seam.rot, land.rot, t),
      opacity: 1 - clamp01((p - fadeFrom) / (fadeTo - fadeFrom)),
      filter: 'blur(0px)',
    });
  }

  // Total length of the stage timeline in its own units; kept in one place so
  // the mic's drop can be expressed as a fraction of overall progress.
  let stageTotal = DROP + 2.35;
  // (overwritten with tl.duration() once buildStageScene has run)
  function stageDuration() {
    return stageTotal;
  }

  /* Hands the screen from the stage to #intro. ScrollTrigger copies the
     pinned element's z-index onto the pin-spacer it wraps it in, so the spacer
     — not .hero-stage — is what actually competes with #intro, and restyling
     the stage alone does nothing. Write the spacer's z-index directly; the
     class is kept for the unpinned case and for anything that wants to hook it. */
  function setReleased(on) {
    els.stage.classList.toggle('is-released', on);
    const spacer = els.stage.parentElement;
    if (spacer && spacer.classList.contains('pin-spacer')) {
      spacer.style.zIndex = on ? '0' : '2';
    }
  }

  function buildStageScene(options) {
    const copyKids = [els.pretitle, els.title, els.tagline, els.buttons, els.socialProof];

    // The photo stays down until the mic actually gets here. Showing it during
    // the slide-in put a lit photograph directly against the mark's dark
    // backdrop — that hard horizontal line is the partition — and left the
    // mic that is already in the shot sitting there while ours flew in.
    gsap.set(els.canvasWrap, { autoAlpha: 0, clipPath: 'none' });
    gsap.set(els.scrim, { opacity: 0 });
    gsap.set(els.copy, { autoAlpha: 0 });
    gsap.set(copyKids, { opacity: 0, y: 26, filter: 'blur(9px)' });
    gsap.set(els.micGlow, { opacity: 0 });

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
        // The hand-over to #intro rides the *scroll*, not the timeline: with
        // scrub the timeline trails by up to a second, which is long enough to
        // watch the hero start scrolling away before #intro covers it. These
        // three fire on the scroll position itself, so the swap is exact.
        onLeave: () => setReleased(true),
        onEnterBack: () => setReleased(false),
        onRefresh: (self) => setReleased(self.progress >= 1),
      },
      onUpdate: () => {
        const p = tl.progress();
        stageOwnsMic = p > 0.0005;
        placeMicForStage(p);
      },
    });

    tl
      // The photo comes up under the mic the moment the mic gets here. Both are
      // showing the same object in the same pose, so this reads as the mic
      // arriving in shot rather than as a cross-fade.
      .to(els.canvasWrap, { autoAlpha: 1, duration: 0.06, ease: 'power1.out' }, 0)
      // The mic's glow is driven from progress instead (see placeMicForMark) —
      // it starts in scene 1, and tweening it here as well would have the two
      // timelines fight over it. The sequence picks up straight away: the mic
      // drops into his hand and he brings it to his mouth.
      .to(
        seqState,
        { p: 1, duration: 1.55, ease: 'none', onUpdate: () => seq.setProgress(seqState.p) },
        0.14
      )
      // Copy arrives with the mic, not a screen and a half later — and lands
      // quickly, because under scrub every timeline unit is scroll distance.
      .to(els.scrim, { opacity: 1, duration: 0.4 }, 0.05)
      .to(els.copy, { autoAlpha: 1, duration: 0.12 }, 0.08)
      .to(copyKids, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.18, stagger: 0.035 }, 0.12);

    stageTotal = tl.duration();

    return () => {
      if (tl.scrollTrigger) tl.scrollTrigger.kill();
      tl.kill();
    };
  }

})();
