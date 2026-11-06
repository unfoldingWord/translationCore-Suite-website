# Native review of the translations

The 15 non-English locales of this site were translated with machine assistance in the migration to Astro. They passed `npm run check:locales`: every string present, every tag, link and `{placeholder}` intact, and every protected name (translationCore, unfoldingWord, translationNotes, BT Servant, …) kept verbatim. **No native speaker has reviewed them yet.**

That is the remaining gap. A sentence that is understandable but not what a speaker would say is what makes a page look machine-translated. On this site the readers are church leaders and translation teams, often deciding whether to trust a tool with Scripture.

## The ask

For each language, one person who reads it natively (ideally someone who works with Bible translation in that language) and about an hour:

```
npm run review -- es --out=es-review.md
```

This writes a sheet with the key, the English, the current translation and an empty **Suggested** column. Read the **Current** column as a speaker, not against the English, and write a better phrase only where one is needed. Strings marked `[markup]` must keep their `<…>` tags; `[placeholder]` strings must keep `{book}`, `{tag}` or `{url}`.

`npm run review -- --priority` produces sheets for es, fr, hi and ar first: the largest translation-team audiences among the 15.

## Applying a review

Edit `src/i18n/{locale}/*.json`, run `npm run check:locales`, open a pull request, and note the reviewer and date below.

| Locale | Reviewed by | Date |
|---|---|---|
| (none yet) | | |
