/* =============================================
   ANAHAD BY SHREY — Gallery motion

   1. #reel   the strip of stills travels sideways while the section is
              pinned, so scrolling down reads as panning across a reel.
              Distance is measured from the track itself rather than
              assumed, so adding or removing a still needs no re-tuning.
   2. #photoGallery
              category filter with a FLIP-style reflow — the surviving
              tiles animate from where they were to where the closed-up
              grid puts them, instead of snapping.

   Falls back to a plain horizontally scrollable strip and an instant
   filter when GSAP is missing or reduced motion is set.
   ============================================= */

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const noMotion =
      typeof gsap === 'undefined' ||
      typeof ScrollTrigger === 'undefined' ||
      Motion.prefersReducedMotion();

    if (noMotion) {
      document.documentElement.classList.add('no-reel-motion');
    } else {
      gsap.registerPlugin(ScrollTrigger);
      initReel();
      initEditorialBand();
    }

    initFilter(noMotion);
  });


  /* ══════════════════════════════════════════
     The editorial band — landonorris.com's portrait section

     Measured off the live site rather than guessed at. Two things are moving
     at once there, and it is the combination that gives it its character:

     1. The whole strip travels left while the section is pinned, so scrolling
        down reads as moving along a wall of pictures.
     2. Every frame *also* carries a small translate of its own, ramping from 0
        to about 52px as it crosses and then holding at that cap. Because each
        frame starts its ramp when it enters, no two are ever at the same
        offset, so the wall has depth instead of sliding as one rigid board.

     Point 2 is the whole trick, and it is the part that is invisible until you
     look at the numbers: the drift is only ~52px, far too small to read as
     movement on its own, but it is what stops the strip feeling like a slide.
     `data-drift` scales it per frame so the larger, nearer-looking pictures
     lag furthest.
     ══════════════════════════════════════════ */

  const DRIFT_MAX = 52;

  function initEditorialBand() {
    const band = document.getElementById('editorialGallery');
    const track = document.getElementById('photoGallery');
    if (!band || !track) return;

    const items = Array.from(track.querySelectorAll('.editorial__item'));
    if (!items.length) return;

    const distance = () => {
      const viewport = track.parentElement;
      return Math.max(0, track.scrollWidth - viewport.clientWidth);
    };

    // 1 — the strip.
    const strip = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: band,
        start: 'top top',
        end: () => '+=' + (distance() + window.innerHeight * 0.4),
        pin: true,
        anticipatePin: 1,
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
    });

    // 2 — the per-frame lag. `containerAnimation` is what makes this possible:
    // it measures each frame's start and end against its position along the
    // strip's own tween rather than down the page. Without it every frame
    // would fire together, because none of them ever moves vertically at all.
    items.forEach((item) => {
      const depth = parseFloat(item.dataset.drift || '0.6');
      gsap.fromTo(
        item,
        { x: 0 },
        {
          x: DRIFT_MAX * depth,
          ease: 'none',
          scrollTrigger: {
            trigger: item,
            containerAnimation: strip,
            start: 'left right',
            end: 'right left',
            scrub: true,
            invalidateOnRefresh: true,
          },
        }
      );
    });
  }

  /* ══════════════════════════════════════════
     The reel
     ══════════════════════════════════════════ */

  function initReel() {
    const reel = document.getElementById('reel');
    const track = document.getElementById('reelTrack');
    if (!reel || !track) return;

    // How far the track has to travel for its last still to reach the right
    // edge. Stable before the images load: .reel__item sets an explicit width
    // and the img an aspect-ratio, so the strip's layout does not depend on
    // any of them having arrived.
    const distance = () => {
      const viewport = track.parentElement;
      return Math.max(0, track.scrollWidth - viewport.clientWidth);
    };

    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: reel,
        start: 'top top',
        // Pin for as much vertical scroll as there is horizontal travel, so
        // the strip moves at roughly the speed the page does.
        end: () => '+=' + (distance() + window.innerHeight * 0.4),
        pin: true,
        anticipatePin: 1,
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
    });

    return () => {
      if (tween.scrollTrigger) tween.scrollTrigger.kill();
      tween.kill();
    };
  }

  /* ══════════════════════════════════════════
     Category filter
     ══════════════════════════════════════════ */

  function initFilter(noMotion) {
    const grid = document.getElementById('photoGallery');
    const buttons = document.querySelectorAll('.gallery-cat-btn');
    if (!grid || !buttons.length) return;

    const items = Array.from(grid.querySelectorAll('.gallery-item'));

    const apply = (category) => {
      const matches = (el) => category === 'all' || el.dataset.category === category;

      if (noMotion) {
        items.forEach((el) => el.classList.toggle('is-filtered-out', !matches(el)));
        return;
      }

      // FLIP: read every tile's position before the layout changes, apply the
      // filter, then tween each survivor from its old box to its new one.
      const before = new Map();
      items.forEach((el) => before.set(el, el.getBoundingClientRect()));

      items.forEach((el) => el.classList.toggle('is-filtered-out', !matches(el)));

      items.forEach((el) => {
        if (el.classList.contains('is-filtered-out')) return;
        const start = before.get(el);
        const end = el.getBoundingClientRect();
        // A tile that was hidden has no meaningful previous box — fade it up
        // in place rather than flying it in from wherever it happened to be.
        if (!start || !start.width) {
          gsap.fromTo(
            el,
            { opacity: 0, scale: 0.92 },
            { opacity: 1, scale: 1, duration: 0.45, ease: 'power2.out' }
          );
          return;
        }
        gsap.fromTo(
          el,
          { x: start.left - end.left, y: start.top - end.top },
          { x: 0, y: 0, duration: 0.5, ease: 'power3.out' }
        );
      });

      // The grid's height changed, so anything pinned below it has moved.
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    };

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.classList.toggle('active', b === btn));
        apply(btn.dataset.category);
      });
    });
  }
})();
