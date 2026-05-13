/* =============================================
   ANAHAD BY SHREY — Puja Modal System
   Dynamic modal rendering + WhatsApp integration
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  initPujaSystem();
});

const WHATSAPP_NUMBER = '919409429354';

async function initPujaSystem() {
  try {
    const response = await fetch('data/pujas.json');
    const pujas = await response.json();
    renderPujaCards(pujas);
    initModal(pujas);
  } catch (error) {
    console.error('Error loading puja data:', error);
    // Fallback: render cards from inline data
    renderFallbackCards();
  }
}

/* ── Render Puja Cards ── */
function renderPujaCards(pujas) {
  const grid = document.getElementById('pujaGrid');
  if (!grid) return;

  grid.innerHTML = pujas.map((puja, index) => {
    let imageContent = '';
    let dotsContent = '';
    
    if (puja.previewImages && puja.previewImages.length > 0) {
      const slides = puja.previewImages.map(img => `<div class="puja-card__slide"><img src="${img}" alt="${puja.name}" loading="lazy"></div>`).join('');
      imageContent = `<div class="puja-card__slider-track">${slides}</div>`;
      if (puja.previewImages.length > 1) {
        const dots = puja.previewImages.map((_, i) => `<span class="puja-card__dot ${i === 0 ? 'active' : ''}"></span>`).join('');
        dotsContent = `<div class="puja-card__dots">${dots}</div>`;
      }
    } else if (puja.image) {
      imageContent = `<div class="puja-card__slider-track"><div class="puja-card__slide"><img src="${puja.image}" alt="${puja.name}" loading="lazy"></div></div>`;
    } else {
      imageContent = `<div class="puja-card__placeholder"><span class="puja-card__placeholder-icon">🙏</span><span class="puja-card__placeholder-text">Add Image</span></div>`;
    }

    return `
    <div class="puja-card reveal" data-puja-id="${puja.id}" style="--stagger-index: ${index}" tabindex="0" role="button" aria-label="View details for ${puja.name}">
      <div class="puja-card__image-wrapper" style="overflow: hidden;" onmouseenter="startHoverSlider(this)" onmouseleave="stopHoverSlider(this)">
        ${imageContent}
        ${dotsContent}
      </div>
      <div class="puja-card__content">
        <h3 class="puja-card__name">${puja.name}</h3>
        <span class="puja-card__name-gujarati">${puja.nameGujarati}</span>
        <p class="puja-card__desc">${puja.shortDescription}</p>
        <span class="puja-card__cta">Learn More →</span>
      </div>
    </div>
    `;
  }).join('');


  // Re-observe for scroll animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -50px 0px', threshold: 0.1 });

  grid.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ── Fallback if JSON fails ── */
function renderFallbackCards() {
  const grid = document.getElementById('pujaGrid');
  if (!grid) return;

  const fallbackPujas = [
    { name: 'Snatra Puja', nameGujarati: 'સ્નાત્ર પૂજા', desc: 'Sacred bathing ceremony of the Tirthankara' },
    { name: 'Sattar Bhed Puja', nameGujarati: 'સત્તર ભેદ પૂજા', desc: 'Seventy-fold worship ceremony' },
    { name: 'Navpad Oli Puja', nameGujarati: 'નવપદ ઓળી પૂજા', desc: 'Nine supreme positions festival puja' },
    { name: 'Panch Kalyanak Puja', nameGujarati: 'પંચ કલ્યાણક પૂજા', desc: 'Five auspicious events celebration' },
  ];

  grid.innerHTML = fallbackPujas.map(p => `
    <div class="puja-card">
      <div class="puja-card__image-wrapper">
        <div class="puja-card__placeholder">
          <span class="puja-card__placeholder-icon">🙏</span>
          <span class="puja-card__placeholder-text">Add Image</span>
        </div>
      </div>
      <div class="puja-card__content">
        <h3 class="puja-card__name">${p.name}</h3>
        <span class="puja-card__name-gujarati">${p.nameGujarati}</span>
        <p class="puja-card__desc">${p.desc}</p>
        <span class="puja-card__cta">Learn More →</span>
      </div>
    </div>
  `).join('');
}

/* ── Modal System ── */
function initModal(pujas) {
  const modal = document.getElementById('pujaModal');
  const modalContent = document.getElementById('modalContent');
  const closeBtn = document.getElementById('modalClose');
  const grid = document.getElementById('pujaGrid');

  if (!modal || !grid) return;

  // Open modal on card click
  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.puja-card');
    if (!card) return;

    const pujaId = card.dataset.pujaId;
    const puja = pujas.find(p => p.id === pujaId);
    if (puja) openModal(puja);
  });

  // Also open on Enter key for accessibility
  grid.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const card = e.target.closest('.puja-card');
      if (!card) return;

      const pujaId = card.dataset.pujaId;
      const puja = pujas.find(p => p.id === pujaId);
      if (puja) openModal(puja);
    }
  });

  // Close modal
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  function openModal(puja) {
    // Populate modal content
    document.getElementById('modalTitle').textContent = puja.name;
    document.getElementById('modalTitleGujarati').textContent = puja.nameGujarati;
    document.getElementById('modalDescription').textContent = puja.fullDescription;
    document.getElementById('modalSignificance').textContent = puja.significance;

    // Hero image — use onerror fallback
    const heroContainer = document.getElementById('modalHeroImage');
    if (puja.image) {
      heroContainer.innerHTML = `
        <img src="${puja.image}" alt="${puja.name}" class="modal__hero-image"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="modal__hero-placeholder" style="display:none;">
          <span class="modal__hero-placeholder-icon">🙏</span>
          <span class="modal__hero-placeholder-text">${puja.name} Image</span>
        </div>
      `;
    } else {
      heroContainer.innerHTML = `
        <div class="modal__hero-placeholder">
          <span class="modal__hero-placeholder-icon">🙏</span>
          <span class="modal__hero-placeholder-text">${puja.name} Image</span>
        </div>
      `;
    }

    // What's included
    const includesList = document.getElementById('modalIncludes');
    includesList.innerHTML = puja.whatsIncluded.map(item => 
      `<li>${item}</li>`
    ).join('');

    // Gallery
    const gallerySection = document.getElementById('modalGallerySection');
    const galleryContainer = document.getElementById('modalGallery');
    if (puja.galleryImages && puja.galleryImages.length > 0) {
      gallerySection.style.display = 'block';
      galleryContainer.innerHTML = puja.galleryImages.map(img =>
        `<div class="modal__gallery-item">
          <img src="${img}" alt="${puja.name} gallery" loading="lazy">
        </div>`
      ).join('');
      // Rebind lightbox
      if (window.rebindGalleryLightbox) window.rebindGalleryLightbox();
    } else {
      gallerySection.style.display = 'none';
    }

    // WhatsApp link
    const whatsappLink = document.getElementById('modalWhatsApp');
    const encodedMsg = encodeURIComponent(
      `Namaste Shrey, I would like to inquire about booking your devotional singing services for ${puja.name}. Could you please provide more details? Thank you!`
    );
    whatsappLink.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMsg}`;

    // Show modal
    modal.classList.add('active');
    document.body.classList.add('modal-open');
    
    // Reset scroll position of modal content
    modalContent.scrollTop = 0;
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
  }
}
