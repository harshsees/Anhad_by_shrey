/* =============================================
   ANAHAD BY SHREY — Motion System: Particle Field
   Lightweight canvas particle drift (warm gold embers,
   evoking diya light / incense rather than concert haze).
   Paused off-screen, skipped under reduced motion.
   ============================================= */

(function () {
  window.Motion = window.Motion || {};

  /**
   * Mounts a drifting particle field inside `container` (must be
   * position: relative/absolute already). Returns a controller with
   * setIntensity(0..1) and destroy().
   */
  Motion.createParticleField = function (container, options) {
    const opts = Object.assign(
      {
        count: 46,
        color: '201, 168, 76', // --gold as rgb
        minRadius: 1,
        maxRadius: 3,
        speed: 0.18,
      },
      options
    );

    const canvas = document.createElement('canvas');
    canvas.className = 'motion-particles';
    canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let intensity = 1;
    let running = true;
    let rafId = null;

    const particles = [];

    function resize() {
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      particles.length = 0;
      for (let i = 0; i < opts.count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: opts.minRadius + Math.random() * (opts.maxRadius - opts.minRadius),
          drift: (Math.random() - 0.5) * 0.25,
          speed: opts.speed * (0.5 + Math.random()),
          alpha: 0.25 + Math.random() * 0.5,
          twinkle: Math.random() * Math.PI * 2,
        });
      }
    }

    function tick() {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      if (intensity > 0.01) {
        particles.forEach((p) => {
          p.y -= p.speed;
          p.x += p.drift;
          p.twinkle += 0.02;
          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;

          const flicker = 0.6 + Math.sin(p.twinkle) * 0.4;
          ctx.beginPath();
          ctx.fillStyle = `rgba(${opts.color}, ${(p.alpha * flicker * intensity).toFixed(3)})`;
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      rafId = requestAnimationFrame(tick);
    }

    resize();
    seed();
    tick();

    const resizeObserver = new ResizeObserver(() => {
      resize();
      seed();
    });
    resizeObserver.observe(container);

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          running = entry.isIntersecting;
          if (running && rafId === null) tick();
        });
      },
      { threshold: 0 }
    );
    visibilityObserver.observe(container);

    return {
      setIntensity(value) {
        intensity = Math.max(0, Math.min(1, value));
      },
      destroy() {
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
        resizeObserver.disconnect();
        visibilityObserver.disconnect();
        canvas.remove();
      },
    };
  };
})();
