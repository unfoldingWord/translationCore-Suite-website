document.addEventListener('DOMContentLoaded', () => {
  const headerElement = document.getElementById('site-header');
  if (headerElement) {
    headerElement.innerHTML = `
      <div class="header-container">
        <a href="/" class="brand-link">
          <div class="brand">
            <img src="/assets/images/tc_logo.png" alt="translationCore" class="brand-logo">
            <span class="brand-name">translationCore&reg; Suite</span>
          </div>
        </a>
        <button class="menu-toggle" aria-label="Toggle menu" aria-expanded="false">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <nav class="site-nav">
          <a href="/translationcore/">translationCore&reg;</a>
          <a href="/translation-helps/">Resources</a>
          <a href="/#related-projects">Related Projects</a>
        </nav>
      </div>
    `;

    const menuToggle = headerElement.querySelector('.menu-toggle');
    const siteNav = headerElement.querySelector('.site-nav');

    if (menuToggle && siteNav) {
      menuToggle.addEventListener('click', () => {
        const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
        menuToggle.setAttribute('aria-expanded', !isExpanded);
        siteNav.classList.toggle('is-active');
        document.body.classList.toggle('menu-open');
      });

      // Close menu when a link is clicked
      siteNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          menuToggle.setAttribute('aria-expanded', 'false');
          siteNav.classList.remove('is-active');
          document.body.classList.remove('menu-open');
        });
      });
    }
  }
});
