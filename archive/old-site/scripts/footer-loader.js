document.addEventListener('DOMContentLoaded', () => {
  const footerElement = document.getElementById('site-footer');
  if (footerElement) {
    footerElement.innerHTML = `
      <div class="footer-columns">
        <div class="footer-brand">
          <div class="footer-brand-row">
            <img src="/assets/images/tc_logo.png" alt="translationCore">
            <span>translationCore&reg;</span>
          </div>
          <p class="footer-brand-project">a project of <a href="https://unfoldingword.org" class="footer-brand-uw" target="_blank" rel="noopener">unfoldingWord</a></p>
        </div>

        <div class="footer-col">
          <h4>Resources</h4>
          <ul>
            <li><a href="/translation-helps/#resources">Translation Notes</a></li>
            <li><a href="/translation-helps/#translation-words">Translation Words</a></li>
            <li><a href="/translation-helps/#translation-academy">Translation Academy</a></li>
            <li><a href="/translation-helps/#source-texts">Source Texts</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>translationCore&reg; App</h4>
          <ul>
            <li><a href="/translationcore/">translationCore&reg;</a></li>
            <li><a href="https://github.com/unfoldingWord/translationCore/releases" target="_blank" rel="noopener">Release Notes</a></li>
            <li><a href="https://github.com/unfoldingWord/translationCore" target="_blank" rel="noopener">GitHub</a></li>
            <li><a href="https://forum.door43.org/c/software/translationcore" target="_blank" rel="noopener">Community Forum</a></li>
            <li><a href="https://unfoldingword.org/contact" target="_blank" rel="noopener">Contact unfoldingWord</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Related Projects</h4>
          <ul>
            <li><a href="https://foundationsbt.com" target="_blank" rel="noopener">Foundations BT</a></li>
            <li><a href="https://churchbased.bible/training/" target="_blank" rel="noopener">Church-Based Training</a></li>
            <li><a href="https://openbiblestories.org" target="_blank" rel="noopener">Open Bible Stories</a></li>
            <li><a href="https://nt.bible" target="_blank" rel="noopener">nt.Bible</a></li>
          </ul>
        </div>
      </div>

      <hr class="footer-divider">

      <div class="footer-bottom">
        <p>License: CC BY-SA 4.0</p>
      </div>
    `;
  }
});
