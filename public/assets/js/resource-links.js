/**
 * Dynamically resolve download links to the latest release from the Door43 Gitea API.
 *
 * Links with `data-download="{repo}"` get their href updated to the latest whole-resource PDF.
 * Links with `data-door43="{repo}"` get their href updated to the latest version on Door43.
 *
 * Fallback: if the API is unreachable, the links remain pointed at the releases/latest
 * redirect page, which Door43 handles gracefully.
 */
(function () {
  const DCS_API = 'https://git.door43.org/api/v1/repos/unfoldingWord';
  const REPOS = ['en_tw', 'en_ta', 'en_ult', 'en_ust', 'en_tq'];

  async function fetchLatestTag(repo) {
    const resp = await fetch(`${DCS_API}/${repo}/releases/latest`, {
      headers: { Accept: 'application/json' }
    });
    if (!resp.ok) throw new Error(`${repo}: HTTP ${resp.status}`);
    const data = await resp.json();
    return data.tag_name;
  }

  // Translation Words and Academy publish one whole-resource LETTER PDF.
  // ULT, UST and Translation Questions publish per-book LETTER PDFs plus an
  // un-suffixed whole-resource PDF (en_ult_v91.pdf); there is no
  // en_ult_v91_LETTER.pdf, so asking for one gets a 404.
  const WHOLE_LETTER = new Set(['en_tw', 'en_ta']);

  function buildPdfUrl(repo, tag) {
    const filename = WHOLE_LETTER.has(repo) ? `${repo}_${tag}_LETTER.pdf` : `${repo}_${tag}.pdf`;
    return `https://git.door43.org/unfoldingWord/${repo}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(filename)}`;
  }

  function buildDoor43Url(repo, tag) {
    return `https://preview.door43.org/u/unfoldingWord/${repo}/${tag}/`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    REPOS.forEach(async (repo) => {
      try {
        const tag = await fetchLatestTag(repo);

        // Update download links
        document.querySelectorAll(`[data-download="${repo}"]`).forEach((link) => {
          link.href = buildPdfUrl(repo, tag);
        });

        // Update Door43 preview links
        document.querySelectorAll(`[data-door43="${repo}"]`).forEach((link) => {
          link.href = buildDoor43Url(repo, tag);
        });
      } catch (err) {
        console.warn(`Could not fetch latest release for ${repo}:`, err);
        // Links keep their fallback hrefs (releases/latest redirect)
      }
    });
  });
})();
