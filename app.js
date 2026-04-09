const STORAGE_KEY = 'tooling_setup_checks_v2';

const progressBar = document.getElementById('progressBar');
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');
const navItems = Array.from(document.querySelectorAll('.nav-item'));
const sections = Array.from(document.querySelectorAll('.section'));
const checkboxes = Array.from(document.querySelectorAll('input[data-check]'));
const progressCount = document.getElementById('progressCount');
const resetChecklistBtn = document.getElementById('resetChecklist');
const copyButtons = Array.from(document.querySelectorAll('button[data-copy]'));
const zoomableImages = Array.from(document.querySelectorAll('.zoomable'));
const imageModal = document.getElementById('imageModal');
const imageModalImg = document.getElementById('imageModalImg');
const imageModalClose = document.getElementById('imageModalClose');
const shotCards = Array.from(document.querySelectorAll('.shot-card'));

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveState(next) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function renderChecklistProgress() {
  const done = checkboxes.filter((c) => c.checked).length;
  progressCount.textContent = `${done} / ${checkboxes.length} Steps`;
}

function initChecklist() {
  const state = loadState();

  checkboxes.forEach((cb) => {
    const key = cb.dataset.check;
    cb.checked = Boolean(state[key]);

    cb.addEventListener('change', () => {
      const next = loadState();
      next[key] = cb.checked;
      saveState(next);
      renderChecklistProgress();
    });
  });

  renderChecklistProgress();

  resetChecklistBtn.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    checkboxes.forEach((cb) => {
      cb.checked = false;
    });
    renderChecklistProgress();
  });
}

async function copyCode(id) {
  const node = document.getElementById(id);
  if (!node) return;
  await navigator.clipboard.writeText(node.textContent || '');
}

function initCopy() {
  copyButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const target = btn.dataset.copy;
      const original = btn.textContent;
      try {
        await copyCode(target);
        btn.textContent = 'Kopiert ✓';
      } catch {
        btn.textContent = 'Copy fehlgeschlagen';
      }
      setTimeout(() => {
        btn.textContent = original;
      }, 1300);
    });
  });
}

function setActiveSection(id) {
  sections.forEach((sec) => sec.classList.toggle('active', sec.id === id));
  navItems.forEach((item) => item.classList.toggle('active', item.dataset.target === id));
}

function scrollToSection(id) {
  const section = document.getElementById(id);
  if (!section) return;
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setActiveSection(id);
  sidebar.classList.remove('open');
}

function initNav() {
  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      scrollToSection(item.dataset.target);
    });
  });

  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });
}

function updateProgressBarByScroll() {
  const scrollTop = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const pct = maxScroll > 0 ? Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100)) : 0;
  progressBar.style.width = `${pct}%`;
}

function initImageModal() {
  if (!imageModal || !imageModalImg || !imageModalClose) return;

  const openModal = (src, alt) => {
    if (!src) return;
    imageModalImg.src = src;
    imageModalImg.alt = alt || 'Vergrössertes Bild';
    imageModal.hidden = false;
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    imageModal.hidden = true;
    imageModalImg.src = '';
    document.body.style.overflow = '';
  };

  // Safety: modal starts hidden on every page load
  closeModal();

  zoomableImages.forEach((img) => {
    img.addEventListener('click', () => openModal(img.currentSrc || img.src, img.alt));
  });

  // Also allow click on the full card (image or caption area)
  shotCards.forEach((card) => {
    card.addEventListener('click', () => {
      const img = card.querySelector('img');
      if (!img) return;
      openModal(img.currentSrc || img.src, img.alt);
    });
  });

  imageModalClose.addEventListener('click', closeModal);
  imageModal.addEventListener('click', (event) => {
    if (event.target === imageModal) closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !imageModal.hidden) closeModal();
  });
}

function initSectionObserver() {
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target?.id) {
        setActiveSection(visible.target.id);
      }
    },
    { root: null, threshold: [0.25, 0.45, 0.7] },
  );

  sections.forEach((section) => observer.observe(section));

  window.addEventListener('scroll', updateProgressBarByScroll, { passive: true });
  updateProgressBarByScroll();
}

initChecklist();
initCopy();
initNav();
initImageModal();
initSectionObserver();
