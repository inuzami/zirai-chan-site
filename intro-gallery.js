(() => {
  const gallery = document.querySelector('.intro-gallery');
  const dialog = document.querySelector('#intro-gallery-dialog');
  if (!gallery || !dialog) return;

  const links = [...gallery.querySelectorAll('.intro-gallery__shot')];
  const slides = links.map(link => {
    const image = link.querySelector('img');
    return {
      src: image.getAttribute('src'),
      srcset: image.getAttribute('srcset'),
      full: link.getAttribute('href'),
      alt: image.alt,
      caption: link.dataset.caption,
    };
  });
  const viewer = gallery.querySelector('.intro-gallery__viewer');
  const main = gallery.querySelector('.intro-gallery__main');
  const mainImage = main.querySelector('img');
  const thumbs = gallery.querySelector('.intro-gallery__thumbs');
  const status = gallery.querySelector('.intro-gallery__status');
  const compactLayout = window.matchMedia('(max-width: 900px)');
  let currentIndex = 0;
  let gesture = null;
  let opener = null;

  const buttons = slides.map((slide, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'intro-gallery__thumb';
    button.setAttribute('aria-label', `${index + 1} / ${slides.length}：${slide.caption}を表示`);
    button.setAttribute('aria-controls', main.id);
    const image = document.createElement('img');
    image.src = slide.src;
    image.alt = '';
    image.width = 1600;
    image.height = 900;
    image.loading = 'lazy';
    image.decoding = 'async';
    button.append(image);
    button.addEventListener('click', () => selectSlide(index));
    thumbs.append(button);
    return button;
  });

  function selectSlide(index) {
    currentIndex = (index + slides.length) % slides.length;
    const slide = slides[currentIndex];
    mainImage.sizes = '(max-width: 620px) calc(100vw - 2rem), calc(100vw - 3rem)';
    mainImage.srcset = slide.srcset;
    mainImage.src = slide.src;
    mainImage.alt = slide.alt;
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === currentIndex)));
    status.textContent = `${currentIndex + 1} / ${slides.length}：${slide.caption}`;
  }

  main.addEventListener('pointerdown', event => {
    if (!compactLayout.matches || !event.isPrimary || event.pointerType === 'mouse') return;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
    main.setPointerCapture(event.pointerId);
  });

  main.addEventListener('pointerup', event => {
    if (!gesture || event.pointerId !== gesture.id) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    gesture = null;
    const threshold = Math.max(40, Math.min(75, main.clientWidth * 0.1));
    // Vertical gestures remain native page scrolling; only horizontal swipes switch images.
    if (Math.abs(dx) >= threshold && Math.abs(dx) > Math.abs(dy) * 1.3) {
      selectSlide(currentIndex + (dx < 0 ? 1 : -1));
    }
  });
  main.addEventListener('pointercancel', () => { gesture = null; });
  main.addEventListener('lostpointercapture', () => { gesture = null; });
  compactLayout.addEventListener('change', () => { gesture = null; });

  links.forEach((link, index) => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const image = dialog.querySelector('.gallery-lightbox__image');
      image.src = slides[index].full;
      image.alt = slides[index].alt;
      dialog.querySelector('.gallery-lightbox__caption').textContent = slides[index].caption;
      opener = link;
      document.documentElement.classList.add('gallery-dialog-open');
      dialog.showModal();
    });
  });

  dialog.querySelector('.gallery-lightbox__close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    const outside = event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom;
    if (event.target === dialog && outside) dialog.close();
  });
  // Native dialog handles Escape and traps focus. Restore scroll and the opening link on close.
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('gallery-dialog-open');
    if (opener?.getClientRects().length) opener.focus({ preventScroll: true });
  });

  selectSlide(0);
  viewer.hidden = false;
  gallery.classList.add('is-ready');
})();
