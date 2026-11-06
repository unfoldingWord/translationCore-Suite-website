(function () {
  // The visitor's interface language, as a preference rather than a property
  // of the URL they happened to arrive at (the same behaviour as
  // openbiblestories.org's locale.js, without the content-language swap that
  // site needs for its single-URL pages).
  //
  //   1. On a first visit the language comes from the BROWSER
  //      (navigator.languages), matched against the 16 locales this site is
  //      published in.
  //   2. A pick from the language switcher OVERRIDES that, and is remembered
  //      in localStorage under "tc.locale".
  //
  // It redirects only from the un-prefixed English URL, and only to a variant
  // the page actually has (its hreflang cluster). A prefixed URL (/fr/desktop/)
  // is somebody's explicit choice and is never redirected away from. Without
  // JavaScript nothing here runs and every page serves the language it was
  // built in.
  var KEY = 'tc.locale';
  var page = window.__tcLocale;
  if (!page || !page.locales || !page.locales.length) return;

  function stored() {
    try {
      var v = localStorage.getItem(KEY);
      return v && page.locales.indexOf(v) !== -1 ? v : null;
    } catch (e) {
      return null;
    }
  }

  function remember(code) {
    try {
      localStorage.setItem(KEY, code);
    } catch (e) {
      /* private mode, or site data blocked: the pick still applies to this page */
    }
  }

  // An exact tag wins over a primary-subtag match ("pt-PT" prefers "pt"),
  // and the browser's own order is the priority order.
  function fromBrowser() {
    var wanted = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
    for (var i = 0; i < wanted.length; i++) {
      var tag = String(wanted[i] || '').toLowerCase();
      if (!tag) continue;
      for (var j = 0; j < page.locales.length; j++) {
        if (tag === String(page.tags[page.locales[j]] || '').toLowerCase()) return page.locales[j];
      }
      var primary = tag.split('-')[0];
      if (page.locales.indexOf(primary) !== -1) return primary;
      for (var k = 0; k < page.locales.length; k++) {
        if (String(page.tags[page.locales[k]] || '').toLowerCase().split('-')[0] === primary) return page.locales[k];
      }
    }
    return null;
  }

  // Remember a switcher pick. The link itself navigates to that locale's
  // copy of the page.
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[data-locale]');
    if (a) remember(a.getAttribute('data-locale'));
  });

  var preferred = stored() || fromBrowser();
  if (!preferred || preferred === page.locale) return;

  if (page.alternates && page.locale === page.defaultLocale) {
    var tag = page.tags[preferred];
    var link = tag && document.querySelector('link[rel="alternate"][hreflang="' + tag + '"]');
    if (link) {
      var to = new URL(link.getAttribute('href'), location.href).pathname + location.search + location.hash;
      if (to !== location.pathname + location.search + location.hash) location.replace(to);
    }
  }
})();
