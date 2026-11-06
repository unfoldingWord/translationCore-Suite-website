(async () => {
  const btn = document.getElementById('tc-download-btn');
  if (!btn) return;

  const ua = navigator.userAgent;
  let platform = 'unknown';
  let osName = '';
  if (/Win/i.test(ua))        { platform = 'win';   osName = 'Windows'; }
  else if (/Mac/i.test(ua))   { platform = 'mac';   osName = 'macOS'; }
  else if (/Linux/i.test(ua)) { platform = 'linux'; osName = 'Linux'; }

  // Show OS label immediately — before API resolves
  const statusEl = btn.closest('.hero-download-wrap')?.querySelector('.hero-status');
  if (statusEl && osName) statusEl.textContent = `translationCore for ${osName}`;

  let downloadUrl = null;
  try {
    const res = await fetch(
      'https://api.github.com/repos/unfoldingWord/translationCore/releases?per_page=10'
    );
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const releases = await res.json();
    const liteRelease = releases.find(r => r.tag_name.toLowerCase().includes('-lite'));
    if (liteRelease) {
      const assets = liteRelease.assets;
      if (platform === 'win')
        downloadUrl = assets.find(a => /tC-win-x64/i.test(a.name) && /LITE/i.test(a.name))?.browser_download_url;
      else if (platform === 'mac')
        downloadUrl = assets.find(a => /tC-macos-universal/i.test(a.name) && /LITE/i.test(a.name))?.browser_download_url;
      else if (platform === 'linux')
        downloadUrl = assets.find(a => /tC-linux-x64/i.test(a.name) && /LITE/i.test(a.name))?.browser_download_url;
    }
  } catch (e) { /* fall through to fallback */ }

  if (downloadUrl) {
    btn.href = downloadUrl;
    btn.setAttribute('download', '');
  } else {
    btn.href = 'https://github.com/unfoldingWord/translationCore/releases';
    btn.removeAttribute('download');
    if (statusEl) statusEl.textContent = 'Windows, macOS, Linux';
  }
})();
