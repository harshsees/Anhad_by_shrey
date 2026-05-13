/* =============================================
   ANAHAD BY SHREY — Lightbox Gallery
   Full-screen image viewer with navigation
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  initLightbox();
});

function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  const lightboxCounter = document.getElementById('lightboxCounter');

  if (!lightbox) return;

  let currentImages = [];
  let currentIndex = 0;

  // Attach click handlers to gallery items with actual images
  function bindGalleryItems() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    galleryItems.forEach((item, index) => {
      const img = item.querySelector('img');
      if (img) {
        item.addEventListener('click', () => {
          // Collect all sibling images in the same gallery
          const gallery = item.closest('.gallery-grid, .modal__gallery');
          if (gallery) {
            currentImages = Array.from(gallery.querySelectorAll('img')).map(i => i.src);
            currentIndex = Array.from(gallery.querySelectorAll('.gallery-item, .modal__gallery-item')).indexOf(item);
          } else {
            currentImages = [img.src];
            currentIndex = 0;
          }
          openLightbox();
        });
      }
    });

    // Also for modal gallery items
    const modalGalleryItems = document.querySelectorAll('.modal__gallery-item');
    modalGalleryItems.forEach((item) => {
      const img = item.querySelector('img');
      if (img) {
        item.addEventListener('click', () => {
          const gallery = item.closest('.modal__gallery');
          if (gallery) {
            currentImages = Array.from(gallery.querySelectorAll('img')).map(i => i.src);
            currentIndex = Array.from(gallery.querySelectorAll('.modal__gallery-item')).indexOf(item);
          } else {
            currentImages = [img.src];
            currentIndex = 0;
          }
          openLightbox();
        });
      }
    });
  }

  function openLightbox() {
    if (currentImages.length === 0) return;
    
    lightbox.classList.add('active');
    document.body.classList.add('modal-open');
    updateLightboxImage();

    // Hide nav if single image
    lightboxPrev.style.display = currentImages.length > 1 ? 'flex' : 'none';
    lightboxNext.style.display = currentImages.length > 1 ? 'flex' : 'none';
    lightboxCounter.style.display = currentImages.length > 1 ? 'block' : 'none';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.classList.remove('modal-open');
  }

  function updateLightboxImage() {
    lightboxImage.src = currentImages[currentIndex];
    lightboxImage.alt = `Gallery image ${currentIndex + 1} of ${currentImages.length}`;
    lightboxCounter.textContent = `${currentIndex + 1} / ${currentImages.length}`;
  }

  function nextImage() {
    currentIndex = (currentIndex + 1) % currentImages.length;
    updateLightboxImage();
  }

  function prevImage() {
    currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
    updateLightboxImage();
  }

  // Event Listeners
  lightboxClose.addEventListener('click', closeLightbox);
  lightboxNext.addEventListener('click', nextImage);
  lightboxPrev.addEventListener('click', prevImage);

  // Close on overlay click
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    
    switch(e.key) {
      case 'Escape': closeLightbox(); break;
      case 'ArrowRight': nextImage(); break;
      case 'ArrowLeft': prevImage(); break;
    }
  });

  // Touch/swipe support
  let touchStartX = 0;
  let touchEndX = 0;

  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  lightbox.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextImage();
      else prevImage();
    }
  }, { passive: true });

  // Initial bind
  bindGalleryItems();

  // Expose rebind function for dynamic content
  window.rebindGalleryLightbox = bindGalleryItems;
}
