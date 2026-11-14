// Names that are never translated: wherever English has one, the locale must
// carry it verbatim. (Order matters only for readability.)
export const PROTECTED = [
  'translationCore', 'unfoldingWord', 'translationNotes', 'translationWords', 'translationQuestions',
  'translationAcademy', 'BT Servant', 'Foundations BT', 'Open Bible Stories', 'Church-Based Training',
  'Door43', 'ULT', 'UST', 'GitHub', 'Discord', 'USFM', 'Scripture Burrito', 'Markdown', 'tcmobile.app',
  'Google Play', 'App Store', 'v4 Beta', 'start-tc4.sh',
];
// The Desktop help also keeps the app's short name.
export const HELP_PROTECTED = [...PROTECTED, 'tC4'];
