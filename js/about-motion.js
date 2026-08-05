/* =============================================
   ANAHAD BY SHREY — About page motion

   Two scroll-driven sections, both modelled on the Team USA reference:

   1. #ceremonyDeck  "Meet the ceremonies". Pinned; the scroll steps through
                     four ceremonies. The name column lights one entry at a
                     time, the centre deck shuffles the matching card to the
                     front, and the still + quote on the right follow it.
   2. #ring          Five stills orbiting the copy that holds them. Pinned;
                     the ring turns and draws inward while the section sinks
                     from cream to maroon.

   Both degrade to a readable static pose: with GSAP missing or reduced
   motion set, the deck shows its first card and the ring lays its frames
   out evenly without ever animating.
   ============================================= */

(function () {
  const CARD_COUNT = 4;
  const RING_COUNT = 5;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const deck = document.getElementById('ceremonyDeck');
    const ring = document.getElementById('ring');
    if (!deck && !ring) return;

    const noMotion =
      typeof gsap === 'undefined' ||
      typeof ScrollTrigger === 'undefined' ||
      Motion.prefersReducedMotion();

    if (noMotion) {
      if (deck) setDeckIndex(deck, 0, true);
      if (ring) layoutRing(ring, 0, true);
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    ScrollTrigger.matchMedia({
      '(min-width: 900px)': () => {
        const a = deck ? buildDeck(deck, { pin: true, end: '+=300%' }) : null;
        const b = ring ? buildRing(ring, { pin: true, end: '+=180%' }) : null;
        return () => {
          if (a) a();
          if (b) b();
        };
      },
      // Stacked layout below 900px: no pin, so the sections simply scroll and
      // the same progress drives a gentler version of each.
      '(max-width: 899px)': () => {
        const a = deck ? buildDeck(deck, { pin: false, end: 'bottom top' }) : null;
        const b = ring ? buildRing(ring, { pin: false, end: 'bottom top' }) : null;
        return () => {
          if (a) a();
          if (b) b();
        };
      },
    });
  }

  /* ══════════════════════════════════════════
     Meet the ceremonies — the deck
     ══════════════════════════════════════════ */

  /** The pose a card sits in, expressed as its distance from the front of the
   *  deck. 0 is the live card; positive is still to come and peeks out behind
   *  it; negative has been dealt and is on its way off the top. */
  function cardPose(offset) {
    if (offset < 0) {
      return { x: -40, y: -70, rotation: -9, scale: 0.94, autoAlpha: 0, zIndex: 1 };
    }
    if (offset === 0) {
      return { x: 0, y: 0, rotation: -1.5, scale: 1, autoAlpha: 1, zIndex: 30 };
    }
    // Fourth card back and beyond is fully hidden — three is all the eye reads.
    return {
      x: offset * 10,
      y: -offset * 14,
      rotation: offset * 3.2,
      scale: 1 - offset * 0.045,
      autoAlpha: offset > 3 ? 0 : 1,
      zIndex: 30 - offset,
    };
  }

  function setDeckIndex(deck, index, instant) {
    const cards = deck.querySelectorAll('.ceremony-deck__card');
    const names = deck.querySelectorAll('.ceremony-deck__name');
    const asides = deck.querySelectorAll('.ceremony-deck__aside-item');

    names.forEach((el, i) => el.classList.toggle('is-active', i === index));
    asides.forEach((el, i) => el.classList.toggle('is-active', i === index));

    cards.forEach((card, i) => {
      const pose = cardPose(i - index);
      if (instant || typeof gsap === 'undefined') {
        Object.keys(pose).forEach((k) => {
          if (k === 'autoAlpha') {
            card.style.opacity = pose[k];
            card.style.visibility = pose[k] ? 'visible' : 'hidden';
          } else if (k === 'zIndex') {
            card.style.zIndex = pose[k];
          }
        });
        if (typeof gsap !== 'undefined') gsap.set(card, pose);
        return;
      }
      gsap.to(card, Object.assign({ duration: 0.55, ease: 'power3.out' }, pose));
    });

    // Whichever clip is in front is the only one that should be running.
    cards.forEach((card, i) => {
      const video = card.querySelector('video');
      if (!video) return;
      if (i === index) {
        const play = video.play();
        if (play && play.catch) play.catch(() => {});
      } else {
        video.pause();
      }
    });
  }

  function buildDeck(deck, options) {
    let current = -1;

    setDeckIndex(deck, 0, true);

    const st = ScrollTrigger.create({
      trigger: deck,
      start: 'top top',
      end: options.end,
      pin: options.pin,
      anticipatePin: options.pin ? 1 : 0,
      scrub: options.pin ? 0.6 : true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        // Four equal steps across the pin. The clamp matters at p === 1,
        // which would otherwise index one past the last card.
        const index = Math.min(CARD_COUNT - 1, Math.floor(self.progress * CARD_COUNT));
        if (index !== current) {
          current = index;
          setDeckIndex(deck, index);
        }
      },
    });

    // The oversized title drifts against the scroll, so the deck reads as
    // moving across it rather than with it.
    const title = deck.querySelector('.ceremony-deck__backdrop-title');
    let titleTween = null;
    if (title) {
      titleTween = gsap.to(title, {
        yPercent: -12,
        ease: 'none',
        scrollTrigger: {
          trigger: deck,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    }

    return () => {
      st.kill();
      if (titleTween) {
        if (titleTween.scrollTrigger) titleTween.scrollTrigger.kill();
        titleTween.kill();
      }
    };
  }

  /* ══════════════════════════════════════════
     The ring
     ══════════════════════════════════════════ */

  /* Where the five frames sit, as a fraction of the safe area's half-width and
     half-height from its centre. Hand-placed rather than swept round an
     ellipse: the copy in the middle is tall and narrow, so a strict ellipse
     either put frames through the headline or had to shrink until the ring
     stopped reading as one. Every anchor keeps |x| >= 0.62, which is well
     outside the copy at any viewport, so clearance is structural rather than
     something that has to be re-tuned per breakpoint. */
  const RING_ANCHORS = [
    { x: -0.74, y: -0.60, tilt: -5 },
    { x: 0.72, y: -0.64, tilt: 4 },
    { x: 0.88, y: 0.16, tilt: -3 },
    { x: 0.64, y: 0.74, tilt: 5 },
    { x: -0.80, y: 0.52, tilt: -4 },
  ];

  /** Places the five frames around the copy. `p` is scroll progress: they drift
   *  on their own slow cycles and draw very slightly inward, which reads as an
   *  orbit without any of them ever crossing the middle. */
  function layoutRing(ring, p, instant) {
    const frames = ring.querySelectorAll('.ring__frame');
    if (!frames.length) return;

    // Measured on .ring__orbit rather than the section: the orbit is inset from
    // the top by the title bar's height, so the safe area is already baked into
    // its box and a frame at the top cannot end up under the bar.
    const orbit = ring.querySelector('.ring__orbit') || ring;
    const box = orbit.getBoundingClientRect();
    const halfW = (box.width || window.innerWidth) / 2;
    const halfH = (box.height || window.innerHeight) / 2;

    // Drawn in a little as the section goes dark, so the group tightens.
    const draw = 1 - 0.06 * p;

    frames.forEach((frame, i) => {
      const a = RING_ANCHORS[i % RING_ANCHORS.length];
      // Each frame rides its own slow cycle, offset by index, so they never
      // move as a block.
      const phase = p * Math.PI * 2 + i * 1.25;
      const x = a.x * halfW * draw + Math.cos(phase) * 12;
      const y = a.y * halfH * draw + Math.sin(phase) * 16;
      const rotation = a.tilt + Math.sin(phase) * 1.5;
      const scale = 0.9 + 0.1 * p;
      const pose = {
        x,
        y,
        rotation,
        scale,
        // Staggered fade-in so they arrive one after another, not as a block.
        autoAlpha: Motion.clamp01((p - i * 0.06) / 0.22),
        xPercent: -50,
        yPercent: -50,
      };
      if (instant || typeof gsap === 'undefined') {
        frame.style.transform =
          `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`;
        frame.style.opacity = instant ? 1 : pose.autoAlpha;
        return;
      }
      gsap.set(frame, pose);
    });
  }

  function buildRing(ring, options) {
    // Colour is driven through custom properties so the CSS keeps ownership of
    // what cream and maroon actually are.
    const from = { bg: [250, 246, 240], ink: [44, 24, 16] };
    const to = { bg: [74, 16, 24], ink: [245, 235, 217] };
    const mix = (a, b, t) => Math.round(a + (b - a) * t);
    const rgb = (c) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;

    const paint = (p) => {
      const bg = from.bg.map((v, i) => mix(v, to.bg[i], p));
      const ink = from.ink.map((v, i) => mix(v, to.ink[i], p));
      ring.style.setProperty('--ring-bg', rgb(bg));
      ring.style.setProperty('--ring-ink', rgb(ink));
    };

    layoutRing(ring, 0);
    paint(0);

    const st = ScrollTrigger.create({
      trigger: ring,
      start: 'top top',
      end: options.end,
      pin: options.pin,
      anticipatePin: options.pin ? 1 : 0,
      scrub: options.pin ? 0.8 : true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        layoutRing(ring, self.progress);
        // The colour lands well before the ring finishes turning, so the
        // frames get most of their travel against the dark.
        paint(Motion.clamp01(self.progress / 0.55));
      },
      onRefresh: (self) => {
        layoutRing(ring, self.progress);
        paint(Motion.clamp01(self.progress / 0.55));
      },
    });

    return () => st.kill();
  }
})();
