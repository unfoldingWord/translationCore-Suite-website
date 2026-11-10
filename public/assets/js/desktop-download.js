/**
 * Point the Desktop Download buttons at the newest translationCore 4 release.
 *
 * Links with `data-tc4-asset="windows|macos|linux"` get their href set to that
 * platform's installer in the newest non-draft release (pre-releases count)
 * that has it. Files are matched by platform and extension, not built from the
 * tag, because the naming has changed between releases.
 *
 * GitHub's /releases/latest can't be used: it ignores pre-releases, and every
 * tC4 release so far is one.
 *
 * Fallback: if the API is unreachable (or rate-limited: 60 requests an hour
 * per visitor IP) the links keep the release built into the page
 * (DESKTOP_VERSION in src/lib/jsonld.ts).
 */
(function () {
  const API = 'https://api.github.com/repos/unfoldingWord/translationCore4/releases?per_page=10';
  const PATTERNS = {
    windows: /windows-x64.*\.exe$/i,
    macos: /macos-arm64.*\.pkg$/i,
    linux: /linux-x64.*\.zip$/i,
  };

  // Newest release (the API lists newest first) with a fully uploaded file for
  // this platform. Per platform, so while a release is still uploading, each
  // button keeps the previous release until its own file is in place.
  function newestInstaller(releases, platform) {
    const pattern = PATTERNS[platform];
    if (!pattern) return null;
    for (const release of releases) {
      if (release.draft) continue;
      const asset = (release.assets || []).find((a) => pattern.test(a.name) && (!a.state || a.state === 'uploaded'));
      if (asset) return asset.browser_download_url;
    }
    return null;
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const links = document.querySelectorAll('[data-tc4-asset]');
    if (!links.length) return;
    try {
      const resp = await fetch(API, { headers: { Accept: 'application/vnd.github+json' } });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const releases = await resp.json();
      if (!Array.isArray(releases)) throw new Error('unexpected response');
      links.forEach((link) => {
        const url = newestInstaller(releases, link.dataset.tc4Asset);
        if (url) link.href = url;
      });
    } catch (err) {
      console.warn('Could not fetch the latest translationCore 4 release:', err);
      // Links keep the release built into the page.
    }
  });
})();
