// Fetch the latest Translation Notes release tag directly from the Door43 Gitea API.
const FALLBACK_TAG = 'v88';
const DCS_API_URL = 'https://git.door43.org/api/v1/repos/unfoldingWord/en_tn/releases/latest';

const BOOK_GROUPS = [
  {
    label: 'Pentateuch',
    books: [
      { label: 'Genesis',     id: 'gen', legacyId: '01-GEN' },
      { label: 'Exodus',      id: 'exo', legacyId: '02-EXO' },
      { label: 'Leviticus',   id: 'lev', legacyId: '03-LEV' },
      { label: 'Numbers',     id: 'num', legacyId: '04-NUM' },
      { label: 'Deuteronomy', id: 'deu', legacyId: '05-DEU' }
    ]
  },
  {
    label: 'Historical Books',
    books: [
      { label: 'Joshua',       id: 'jos', legacyId: '06-JOS' },
      { label: 'Judges',       id: 'jdg', legacyId: '07-JDG' },
      { label: 'Ruth',         id: 'rut', legacyId: '08-RUT' },
      { label: '1 Samuel',     id: '1sa', legacyId: '09-1SA' },
      { label: '2 Samuel',     id: '2sa', legacyId: '10-2SA' },
      { label: '1 Kings',      id: '1ki', legacyId: '11-1KI' },
      { label: '2 Kings',      id: '2ki', legacyId: '12-2KI' },
      { label: '1 Chronicles', id: '1ch', legacyId: '13-1CH' },
      { label: '2 Chronicles', id: '2ch', legacyId: '14-2CH' },
      { label: 'Ezra',         id: 'ezr', legacyId: '15-EZR' },
      { label: 'Nehemiah',     id: 'neh', legacyId: '16-NEH' },
      { label: 'Esther',       id: 'est', legacyId: '17-EST' }
    ]
  },
  {
    label: 'Wisdom Literature',
    books: [
      { label: 'Job',           id: 'job', legacyId: '18-JOB' },
      { label: 'Psalms',        id: 'psa', legacyId: '19-PSA' },
      { label: 'Proverbs',      id: 'pro', legacyId: '20-PRO' },
      { label: 'Ecclesiastes',  id: 'ecc', legacyId: '21-ECC' },
      { label: 'Song of Songs', id: 'sng', legacyId: '22-SNG' }
    ]
  },
  {
    label: 'Major Prophets',
    books: [
      { label: 'Isaiah',       id: 'isa', legacyId: '23-ISA' },
      { label: 'Jeremiah',     id: 'jer', legacyId: '24-JER' },
      { label: 'Lamentations', id: 'lam', legacyId: '25-LAM' },
      { label: 'Ezekiel',      id: 'ezk', legacyId: '26-EZK' },
      { label: 'Daniel',       id: 'dan', legacyId: '27-DAN' }
    ]
  },
  {
    label: 'Minor Prophets',
    books: [
      { label: 'Hosea',     id: 'hos', legacyId: '28-HOS' },
      { label: 'Joel',      id: 'jol', legacyId: '29-JOL' },
      { label: 'Amos',      id: 'amo', legacyId: '30-AMO' },
      { label: 'Obadiah',   id: 'oba', legacyId: '31-OBA' },
      { label: 'Jonah',     id: 'jon', legacyId: '32-JON' },
      { label: 'Micah',     id: 'mic', legacyId: '33-MIC' },
      { label: 'Nahum',     id: 'nam', legacyId: '34-NAM' },
      { label: 'Habakkuk',  id: 'hab', legacyId: '35-HAB' },
      { label: 'Zephaniah', id: 'zep', legacyId: '36-ZEP' },
      { label: 'Haggai',    id: 'hag', legacyId: '37-HAG' },
      { label: 'Zechariah', id: 'zec', legacyId: '38-ZEC' },
      { label: 'Malachi',   id: 'mal', legacyId: '39-MAL' }
    ]
  },
  {
    label: 'Gospels & Acts',
    books: [
      { label: 'Matthew', id: 'mat', legacyId: '41-MAT' },
      { label: 'Mark',    id: 'mrk', legacyId: '42-MRK' },
      { label: 'Luke',    id: 'luk', legacyId: '43-LUK' },
      { label: 'John',    id: 'jhn', legacyId: '44-JHN' },
      { label: 'Acts',    id: 'act', legacyId: '45-ACT' }
    ]
  },
  {
    label: 'Pauline Epistles',
    books: [
      { label: 'Romans',          id: 'rom', legacyId: '46-ROM' },
      { label: '1 Corinthians',   id: '1co', legacyId: '47-1CO' },
      { label: '2 Corinthians',   id: '2co', legacyId: '48-2CO' },
      { label: 'Galatians',       id: 'gal', legacyId: '49-GAL' },
      { label: 'Ephesians',       id: 'eph', legacyId: '50-EPH' },
      { label: 'Philippians',     id: 'php', legacyId: '51-PHP' },
      { label: 'Colossians',      id: 'col', legacyId: '52-COL' },
      { label: '1 Thessalonians', id: '1th', legacyId: '53-1TH' },
      { label: '2 Thessalonians', id: '2th', legacyId: '54-2TH' },
      { label: '1 Timothy',       id: '1ti', legacyId: '55-1TI' },
      { label: '2 Timothy',       id: '2ti', legacyId: '56-2TI' },
      { label: 'Titus',           id: 'tit', legacyId: '57-TIT' },
      { label: 'Philemon',        id: 'phm', legacyId: '58-PHM' }
    ]
  },
  {
    label: 'General Epistles & Revelation',
    books: [
      { label: 'Hebrews',    id: 'heb', legacyId: '59-HEB' },
      { label: 'James',      id: 'jas', legacyId: '60-JAS' },
      { label: '1 Peter',    id: '1pe', legacyId: '61-1PE' },
      { label: '2 Peter',    id: '2pe', legacyId: '62-2PE' },
      { label: '1 John',     id: '1jn', legacyId: '63-1JN' },
      { label: '2 John',     id: '2jn', legacyId: '64-2JN' },
      { label: '3 John',     id: '3jn', legacyId: '65-3JN' },
      { label: 'Jude',       id: 'jud', legacyId: '66-JUD' },
      { label: 'Revelation', id: 'rev', legacyId: '67-REV' }
    ]
  }
];

let cachedRelease = null;
let releasePromise = null;

/**
 * Fetch the latest Translation Notes release tag from the Door43 Gitea API.
 * Falls back to FALLBACK_TAG if the API is unreachable.
 * Results are cached in-memory for the page session.
 */
async function fetchLatestRelease() {
  if (cachedRelease) {
    return cachedRelease;
  }

  if (!releasePromise) {
    releasePromise = fetch(DCS_API_URL, { headers: { Accept: 'application/json' } })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Door43 API responded ${response.status}.`);
        }
        return response.json();
      })
      .then((data) => {
        const tag = (data && data.tag_name) || FALLBACK_TAG;
        const assets = (data && data.assets) || [];
        const available_books = assets
          .map((a) => a.name)
          .filter((name) => name.endsWith('_LETTER.pdf'))
          .map((name) => {
            const match = name.match(/^en_tn_(.+?)_v\d+_LETTER\.pdf$/);
            return match ? match[1] : null;
          })
          .filter(Boolean);
        cachedRelease = { tag, available_books: available_books.length > 0 ? available_books : null };
        return cachedRelease;
      })
      .catch((err) => {
        console.warn('Could not fetch release info from Door43, using fallback tag:', err);
        releasePromise = null;
        cachedRelease = { tag: FALLBACK_TAG, available_books: null };
        return cachedRelease;
      });
  }

  return releasePromise;
}

/**
 * Build the Door43 download URL for a specific book and release tag.
 * Pattern: en_tn_{legacyId}_{tag}_LETTER.pdf
 */
function buildDownloadUrl(tag, legacyId) {
  const filename = `en_tn_${legacyId}_${tag}_LETTER.pdf`;
  return `https://git.door43.org/unfoldingWord/en_tn/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(filename)}`;
}

/**
 * Populate the book select dropdown.
 * If availableBooks is null, show all books.
 */
function populateBookSelect(select, availableBooks) {
  const availableSet = availableBooks ? new Set(availableBooks) : null;

  while (select.options.length > 1) {
    select.remove(1);
  }
  select.querySelectorAll('optgroup').forEach((og) => og.remove());

  BOOK_GROUPS.forEach((group) => {
    const filteredBooks = group.books.filter(
      (book) => !availableSet || availableSet.has(book.legacyId)
    );
    if (filteredBooks.length === 0) return;

    const optgroup = document.createElement('optgroup');
    optgroup.label = group.label;

    filteredBooks.forEach((book) => {
      const option = document.createElement('option');
      option.value = book.id;
      option.textContent = book.label;
      option.dataset.label = book.label;
      option.dataset.bookId = book.id;
      if (book.legacyId) {
        option.dataset.legacyId = book.legacyId;
      }
      optgroup.append(option);
    });

    select.append(optgroup);
  });
}

function updateVersionLabels(tag) {
  document.querySelectorAll('[data-version-label]').forEach((el) => {
    el.textContent = tag;
  });
}

function setStatus(message, { isError = false, asHtml = false } = {}) {
  const el = document.getElementById('download-message');
  if (!el) return;
  el.classList.toggle('helps-status--error', Boolean(isError));
  if (asHtml) {
    el.innerHTML = message;
  } else {
    el.textContent = message;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('book-select');
  if (!select) return;

  // Show all books initially while release info loads.
  populateBookSelect(select, null);

  // Pre-fetch release info to update the version label.
  fetchLatestRelease()
    .then((release) => {
      updateVersionLabels(release.tag);
      if (release.available_books && release.available_books.length > 0) {
        populateBookSelect(select, release.available_books);
      }
    })
    .catch((err) => {
      console.warn('Could not pre-fetch release info:', err);
      updateVersionLabels(FALLBACK_TAG);
    });

  select.addEventListener('change', async (event) => {
    const selectedOption = event.target.selectedOptions && event.target.selectedOptions[0];
    const bookId    = selectedOption && (selectedOption.dataset.bookId || selectedOption.value);
    const legacyId  = selectedOption && selectedOption.dataset.legacyId;
    const bookLabel = (selectedOption && (selectedOption.dataset.label || selectedOption.textContent)) || 'the selected book';

    if (!bookId) {
      setStatus('Sorry, we could not determine which book you selected.', { isError: true });
      return;
    }

    if (!legacyId) {
      setStatus('Missing book identifier — please try a different book.', { isError: true });
      return;
    }

    event.target.disabled = true;
    setStatus(`Looking up the latest translation notes for ${bookLabel}…`);

    try {
      const release = await fetchLatestRelease();
      const tag = release.tag;
      updateVersionLabels(tag);

      const url = buildDownloadUrl(tag, legacyId);

      window.open(url, '_blank', 'noopener');

      setStatus(
        `Opening <em>${bookLabel}</em> translation notes (${tag}). ` +
        `If nothing happened, <a href="${url}" target="_blank" rel="noopener" class="inline-link">click here</a>.`,
        { asHtml: true }
      );
    } catch (err) {
      console.error(err);
      setStatus((err && err.message) || 'Could not load the download. Please try again.', { isError: true });
    } finally {
      event.target.disabled = false;
    }
  });
});
