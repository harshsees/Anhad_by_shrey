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
      initPortraitArrival();
    }

    initFilter(noMotion);
  });


  /* ══════════════════════════════════════════
     The arrival — landonorris.com's portrait reveal

     Each tile is clipped to an ellipse pinned to its top edge with no vertical
     radius, so nothing of it shows. Opening that radius wipes the photograph
     in downward behind a curved leading edge, while the image inside settles
     back from a slight over-scale — the picture arrives into the frame rather
     than the frame fading up around it.

     The two tweens are deliberately different lengths: the wipe is quick and
     the settle is slow, so the photograph is fully visible well before it has
     finished coming to rest. Matching them makes the whole thing stop dead on
     one frame, which is what reads as cheap.
     ══════════════════════════════════════════ */

  function initPortraitArrival() {
    const grid = document.getElementById('photoGallery');
    if (!grid) return;

    const items = Array.from(grid.querySelectorAll('.gallery-item'));
    if (!items.length) return;

    // Only claim the entrance once we know we can run it — the class is what
    // switches the shared .reveal system off, so setting it before this point
    // would leave the tiles invisible if anything above had bailed out.
    grid.classList.add('js-portrait-reveal');

    items.forEach((item) => {
      const img = item.querySelector('img');

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: item,
          // Late enough that the tile is properly on screen before it starts,
          // so the wipe is not already over by the time it is looked at.
          start: 'top 88%',
          once: true,
        },
      });

      tl.fromTo(
        item,
        { clipPath: 'ellipse(140% 0% at 50% 0%)' },
        { clipPath: 'ellipse(140% 155% at 50% 0%)', duration: 1.05, ease: 'power3.out' },
        0
      );

      if (img) {
        tl.fromTo(
          img,
          { scale: 1.14 },
          {
            scale: 1,
            duration: 1.6,
            ease: 'power3.out',
            // Hand the image back to CSS afterwards, or the inline transform
            // GSAP leaves behind outranks .gallery-item:hover img and the
            // hover zoom silently stops working.
            onComplete: () => gsap.set(img, { clearProps: 'transform' }),
          },
          0
        );
      }
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
