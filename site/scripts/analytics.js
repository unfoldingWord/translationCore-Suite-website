/*
 * Google Analytics 4 for the translationCore website.
 * Measurement ID for the translationCore website GA4 stream.
 */
(function () {
  var GA_ID = 'G-LT1CE2F1PZ';
  if (!/^G-[A-Z0-9]{6,}$/.test(GA_ID)) return;
  // Only count real visits to the live site, so test deployments do not pollute the data.
  // To test on another address (for example a pages.dev preview), add it to this list.
  var HOSTS = ['translationcore.com', 'www.translationcore.com'];
  if (HOSTS.indexOf(location.hostname) === -1) return;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID, { anonymize_ip: true });

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
  document.head.appendChild(s);

  // Count downloads and store visits (links are rewritten at load, so read the href at click time).
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var h = a.href;
    var kind = null;
    if (/\/releases\/download\//.test(h)) kind = 'download_click';
    else if (/play\.google\.com|apps\.apple\.com/.test(h)) kind = 'store_click';
    else if (/btservant\.ai|foundationsbt\.com|churchbased\.bible|openbiblestories\.org|discord\.gg/.test(h)) kind = 'partner_click';
    if (kind) gtag('event', kind, { link_url: h, link_text: (a.textContent || '').trim().slice(0, 80) });
  });
})();
