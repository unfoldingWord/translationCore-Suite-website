/**
 * Dynamically resolve all translationCore download links on the product page
 * to the latest release assets from the GitHub API.
 *
 * Links carry a `data-tc-asset` attribute (e.g. "win-x64-MAX", "mac-universal-LITE")
 * which is matched against asset filenames in the latest MAX and LITE releases.
 *
 * Fallback: links keep their existing href (GitHub releases page) if the API
 * is unreachable or an asset is not found.
 */
(async () => {
  if (!document.querySelector('[data-tc-asset]')) return;

  const ASSET_PATTERNS = {
    'win-x64-MAX':        /tC-win-x64.*MAX.*\.exe$/i,
    'win-x32-MAX':        /tC-win-x32.*MAX.*\.exe$/i,
    'mac-x64-MAX':        /tC-macos-x64.*MAX.*\.dmg$/i,
    'mac-universal-MAX':  /tC-macos-universal.*MAX.*\.dmg$/i,
    'linux-x64-MAX':      /tC-linux-x64.*MAX.*\.deb$/i,
    'linux-arm64-MAX':    /tC-linux-arm64.*MAX.*\.deb$/i,
    'win-x64-LITE':       /tC-win-x64.*LITE.*\.exe$/i,
    'win-x32-LITE':       /tC-win-x32.*LITE.*\.exe$/i,
    'mac-x64-LITE':       /tC-macos-x64.*LITE.*\.dmg$/i,
    'mac-universal-LITE': /tC-macos-universal.*LITE.*\.dmg$/i,
    'linux-x64-LITE':     /tC-linux-x64.*LITE.*\.deb$/i,
    'linux-arm64-LITE':   /tC-linux-arm64.*LITE.*\.deb$/i,
  };

  try {
    const res = await fetch(
      'https://api.github.com/repos/unfoldingWord/translationCore/releases?per_page=10'
    );
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const releases = await res.json();

    const isLite = r => r.tag_name.toLowerCase().includes('-lite');
    const liteRelease = releases.find(r =>  isLite(r) && !r.prerelease && !r.draft);
    const maxRelease  = releases.find(r => !isLite(r) && !r.prerelease && !r.draft);

    [maxRelease, liteRelease].forEach(release => {
      if (!release) return;
      Object.entries(ASSET_PATTERNS).forEach(([key, pattern]) => {
        const asset = release.assets.find(a => pattern.test(a.name));
        if (!asset) return;
        document.querySelectorAll(`[data-tc-asset="${key}"]`).forEach(link => {
          link.href = asset.browser_download_url;
        });
      });
    });

    // Surface the resolved version tags next to each card heading
    if (maxRelease) {
      document.querySelectorAll('[data-tc-max-version]').forEach(el => {
        el.textContent = maxRelease.tag_name;
      });
    }
    if (liteRelease) {
      document.querySelectorAll('[data-tc-lite-version]').forEach(el => {
        el.textContent = liteRelease.tag_name;
      });
    }
  } catch (e) {
    console.warn('Could not fetch translationCore releases:', e);
    // Links keep their fallback hrefs (GitHub releases page)
  }
})();
