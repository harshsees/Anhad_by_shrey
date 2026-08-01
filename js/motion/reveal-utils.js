/* =============================================
   ANAHAD BY SHREY — Motion System: Shared Utilities
   Reduced-motion/mobile flags, object-fit:cover point
   mapping (used to land the traveling mic exactly on
   its real pixels), and an accessible word-split helper.
   ============================================= */

(function () {
  window.Motion = window.Motion || {};

  Motion.prefersReducedMotion = function () {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  // Matches the layout breakpoint where pinned/travel sequences degrade
  // to simpler scroll-linked fades (mobile browser chrome resize makes
  // ScrollTrigger pin distances unreliable below this width).
  Motion.isCompact = function () {
    return window.innerWidth < 900;
  };

  /**
   * Given a container element rendering an image at CSS `object-fit: cover`
   * (object-position: center), returns the on-screen point (relative to the
   * container's top-left, in px) that a fractional point (px, py in 0..1)
   * of the *source* image currently maps to. This is what lets the
   * standalone mic crop line up with the real mic pixels inside the full
   * photo at any viewport size.
   */
  Motion.getCoverPoint = function (container, naturalW, naturalH, px, py) {
    const w = container.clientWidth;
    const h = container.clientHeight;
    const imageAspect = naturalW / naturalH;
    const containerAspect = w / h;

    let renderedW, renderedH, offsetX, offsetY;
    if (imageAspect > containerAspect) {
      renderedH = h;
      renderedW = h * imageAspect;
      offsetX = (w - renderedW) / 2;
      offsetY = 0;
    } else {
      renderedW = w;
      renderedH = w / imageAspect;
      offsetX = 0;
      offsetY = (h - renderedH) / 2;
    }

    return {
      x: offsetX + px * renderedW,
      y: offsetY + py * renderedH,
      // px-per-source-fraction scale, useful for sizing a crop box to stay
      // proportional to the rendered image (e.g. mic focus box width).
      scaleW: renderedW,
      scaleH: renderedH,
    };
  };

  /**
   * Splits an element's text into per-word spans for stagger reveals
   * without touching the actual text content — screen readers read the
   * element exactly as before. Returns the animatable inner spans.
   */
  Motion.splitWords = function (el) {
    if (el.dataset.split === 'true') {
      return Array.from(el.querySelectorAll('.split-word__inner'));
    }
    const tokens = el.textContent.split(/(\s+)/);
    el.textContent = '';
    const inners = [];

    tokens.forEach((token) => {
      if (token === '') return;
      if (/^\s+$/.test(token)) {
        el.appendChild(document.createTextNode(token));
        return;
      }
      const outer = document.createElement('span');
      outer.className = 'split-word';
      const inner = document.createElement('span');
      inner.className = 'split-word__inner';
      inner.textContent = token;
      outer.appendChild(inner);
      el.appendChild(outer);
      inners.push(inner);
    });

    el.dataset.split = 'true';
    return inners;
  };

  Motion.debounce = function (fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  };

  // Known mic anchor points (fraction of source-image dimensions) used by
  // hero-story.js and section-motion.js. Tuned by eye against the real
  // photos; kept in one place so re-tuning doesn't require touching the
  // animation logic itself.
  Motion.micAnchors = {
    hero: {
      src: 'images/hero-image.jpeg',
      naturalW: 4160,
      naturalH: 2773,
      cx: 0.338,
      cy: 0.38,
      boxW: 0.085,
      boxH: 0.155,
    },
    intro: {
      src: 'assets/images/shrey_pic_1.jpeg',
      naturalW: 1600,
      naturalH: 1066,
      cx: 0.45,
      cy: 0.427,
      boxW: 0.095,
      boxH: 0.26,
    },
  };
})();
