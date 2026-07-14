const navbar = document.getElementById('navbar');
const toggleBtn = document.querySelector('[data-nav-toggle]');
const nav = document.querySelector('[data-nav]');

if (toggleBtn && nav) {
  const close = () => {
    toggleBtn.classList.remove('is-open');
    toggleBtn.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
  };

  toggleBtn.addEventListener('click', () => {
    const open = toggleBtn.classList.toggle('is-open');
    toggleBtn.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });

  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', close));

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1080) close();
  });
}

if (navbar) {
  let ticking = false;
  const update = () => {
    ticking = false;
    navbar.classList.toggle('scrolled', window.scrollY > 18);
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
}
