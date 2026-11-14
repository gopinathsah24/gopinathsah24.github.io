const root = document.documentElement;
const header = document.querySelector('.site-header');
const navigation = document.querySelector('.site-nav');
const menuToggle = document.querySelector('.menu-toggle');
const themeToggle = document.querySelector('.theme-toggle');
const mobileViewport = window.matchMedia('(max-width: 680px)');

function savePreference(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Theme controls still work when storage is unavailable.
  }
}

function updateThemeControl() {
  const isDark = root.dataset.theme === 'dark';
  themeToggle.setAttribute('aria-pressed', String(isDark));
  themeToggle.setAttribute(
    'aria-label',
    `Switch to ${isDark ? 'light' : 'dark'} theme`,
  );
  document.querySelector('meta[name="theme-color"]').content = isDark
    ? '#111722'
    : '#f3f2ed';
}
themeToggle.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  savePreference('gopi:theme', root.dataset.theme);
  updateThemeControl();
});
updateThemeControl();
themeToggle.hidden = false;

function setMenu(open, restoreFocus = false) {
  header.classList.toggle('menu-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute(
    'aria-label',
    open ? 'Close navigation' : 'Open navigation',
  );
  if (!open && restoreFocus) menuToggle.focus();
}
menuToggle.addEventListener('click', () => {
  setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
});
navigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenu(false);
});
document.addEventListener('click', (event) => {
  if (!header.contains(event.target)) setMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && header.classList.contains('menu-open')) {
    setMenu(false, true);
  }
});
mobileViewport.addEventListener('change', () => setMenu(false));
menuToggle.hidden = false;
root.classList.add('has-js');

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.06, rootMargin: '0px 0px 30px 0px' },
  );
  for (const element of document.querySelectorAll('.reveal')) {
    element.classList.add('reveal-ready');
    revealObserver.observe(element);
  }
}

const navigationLinks = [...navigation.querySelectorAll('a')];
const trackedSections = navigationLinks.map((link) =>
  document.querySelector(link.getAttribute('href')),
);
const progress = document.querySelector('.scroll-progress');
let scrollFrame = 0;
function updateScroll() {
  const maxScroll = root.scrollHeight - window.innerHeight;
  const fraction = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  progress.style.transform = `scaleX(${Math.min(1, Math.max(0, fraction))})`;
  const activationPoint = window.scrollY + window.innerHeight * 0.36;
  let activeIndex = -1;
  trackedSections.forEach((section, index) => {
    if (section.offsetTop <= activationPoint) activeIndex = index;
  });
  if (maxScroll > 0 && window.scrollY >= maxScroll - 3) {
    activeIndex = trackedSections.length - 1;
  }
  navigationLinks.forEach((link, index) => {
    if (index === activeIndex) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  scrollFrame = 0;
}
function requestScrollUpdate() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
}
window.addEventListener('scroll', requestScrollUpdate, { passive: true });
window.addEventListener('resize', requestScrollUpdate, { passive: true });
updateScroll();

const carousel = document.querySelector('.project-carousel');
const projectGrid = carousel.querySelector('.project-grid');
const projectCards = [...carousel.querySelectorAll('.project-card')];
const picker = carousel.querySelector('.project-picker');
const projectCount = document.querySelector('.project-count');
const carouselStatus = carousel.querySelector('.carousel-status');
const filterControls = document.querySelector('.project-filters');
const filterButtons = [...filterControls.querySelectorAll('button')];
let availableProjects = [...projectCards];
let projectIndex = 0;

for (const card of projectCards) {
  const heading = card.querySelector('h3');
  heading.id = `project-title-${card.id}`;
  card.setAttribute('role', 'group');
  card.setAttribute('aria-roledescription', 'slide');
  card.setAttribute('aria-labelledby', heading.id);
}
function projectName(card) {
  return card.querySelector('h3').textContent.trim();
}
function updatePicker() {
  picker.replaceChildren(
    ...availableProjects.map((card) => new Option(projectName(card), card.id)),
  );
}
function showProject(index, announce = true) {
  const previous = availableProjects[projectIndex];
  const restoreFocus = previous?.contains(document.activeElement);
  projectIndex =
    ((index % availableProjects.length) + availableProjects.length) %
    availableProjects.length;
  const selected = availableProjects[projectIndex];
  for (const card of projectCards) {
    card.hidden = card !== selected;
    card.classList.toggle('is-current', card === selected);
  }
  picker.value = selected.id;
  projectCount.textContent = `${String(projectIndex + 1).padStart(2, '0')} / ${String(availableProjects.length).padStart(2, '0')}`;
  carousel.style.setProperty(
    '--carousel-progress',
    (projectIndex + 1) / availableProjects.length,
  );
  if (announce) {
    carouselStatus.textContent = `${projectName(selected)}, project ${projectIndex + 1} of ${availableProjects.length}`;
  }
  if (restoreFocus)
    selected.querySelector('.project-open')?.focus({ preventScroll: true });
  requestScrollUpdate();
}
carousel
  .querySelector('.carousel-previous')
  .addEventListener('click', () => showProject(projectIndex - 1));
carousel
  .querySelector('.carousel-next')
  .addEventListener('click', () => showProject(projectIndex + 1));
picker.addEventListener('change', () => {
  showProject(availableProjects.findIndex((card) => card.id === picker.value));
});
carousel.addEventListener('keydown', (event) => {
  if (
    event.ctrlKey ||
    event.altKey ||
    event.metaKey ||
    event.target.closest('select, input, textarea, [contenteditable="true"]')
  )
    return;
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  showProject(projectIndex + (event.key === 'ArrowRight' ? 1 : -1));
});
for (const button of filterButtons) {
  button.addEventListener('click', () => {
    const currentProject = availableProjects[projectIndex];
    availableProjects = projectCards.filter(
      (card) =>
        button.dataset.filter === 'all' ||
        card.dataset.categories.split(' ').includes(button.dataset.filter),
    );
    for (const candidate of filterButtons) {
      candidate.setAttribute('aria-pressed', String(candidate === button));
    }
    updatePicker();
    showProject(Math.max(0, availableProjects.indexOf(currentProject)));
  });
}
let touchStart = null;
projectGrid.addEventListener('pointerdown', (event) => {
  if (
    event.pointerType !== 'touch' ||
    !event.isPrimary ||
    event.target.closest('a, button, select')
  )
    return;
  touchStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
  projectGrid.setPointerCapture(event.pointerId);
});
projectGrid.addEventListener('pointerup', (event) => {
  if (!touchStart || touchStart.id !== event.pointerId) return;
  const dx = event.clientX - touchStart.x;
  const dy = event.clientY - touchStart.y;
  touchStart = null;
  if (projectGrid.hasPointerCapture(event.pointerId)) {
    projectGrid.releasePointerCapture(event.pointerId);
  }
  if (Math.abs(dx) >= 55 && Math.abs(dx) > Math.abs(dy) * 1.4) {
    showProject(projectIndex + (dx < 0 ? 1 : -1));
  }
});
projectGrid.addEventListener('pointercancel', () => {
  touchStart = null;
});
updatePicker();
showProject(0, false);
carousel.setAttribute('aria-roledescription', 'carousel');
carousel.classList.add('is-enhanced');
carousel.querySelector('.carousel-controls').hidden = false;
filterControls.hidden = false;
filterControls.querySelector('[data-filter="all"] span').textContent = String(
  projectCards.length,
).padStart(2, '0');

const dialog = document.querySelector('.project-dialog');
const dialogContent = dialog.querySelector('.dialog-content');
let dialogTrigger = null;
if (typeof dialog.showModal === 'function') {
  for (const button of document.querySelectorAll('.project-open')) {
    const template = document.getElementById(
      `detail-${button.dataset.project}`,
    );
    if (!template) continue;
    button.addEventListener('click', () => {
      dialogTrigger = button;
      dialogContent.replaceChildren(template.content.cloneNode(true));
      dialog.showModal();
      dialog.scrollTop = 0;
      document.body.classList.add('dialog-open');
    });
    button.hidden = false;
  }
  dialog
    .querySelector('.dialog-close')
    .addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab' || event.ctrlKey || event.altKey || event.metaKey)
      return;
    const controls = [
      ...dialog.querySelectorAll('button:not(:disabled), a[href]'),
    ];
    const first = controls[0];
    const last = controls.at(-1);
    if (
      (!event.shiftKey && document.activeElement === last) ||
      (event.shiftKey && document.activeElement === first)
    ) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
  });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    dialogTrigger?.focus({ preventScroll: true });
  });
}

const copyButton = document.querySelector('.copy-email');
const emailLink = document.querySelector('#contact-email');
const toast = document.querySelector('.toast');
let toastTimeout;
function showToast(message) {
  clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.classList.add('is-visible');
  toastTimeout = setTimeout(() => toast.classList.remove('is-visible'), 4500);
}
copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(emailLink.textContent.trim());
    showToast('Email copied. Say hello!');
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(emailLink);
    selection?.removeAllRanges();
    selection?.addRange(range);
    showToast('Email selected. Use your device copy command.');
  }
});
copyButton.hidden = false;

const indiaClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});
function updateClock() {
  document.querySelector('.footer-time').textContent =
    `${indiaClock.format(new Date())} IST`;
}
updateClock();
setInterval(updateClock, 60_000);
