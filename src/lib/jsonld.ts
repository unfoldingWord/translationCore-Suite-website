// JSON-LD builders. One graph per page: Base.astro emits a single
// <script type="application/ld+json"> containing Organization + WebSite plus
// whatever page-specific nodes a page passes in via the `jsonLd` prop.
//
// Every fact here is one the site itself states in its copy (the Desktop and
// Mobile pages, the License page) — nothing is added that a visitor could not
// read on the page. Keep the two in step when either changes.
import { localePath, byCode } from '../i18n/config';

export const SITE_URL = 'https://translationcore.com';
export const PRODUCT_NAME = 'translationCore';
export const PUBLISHER_ID = 'https://unfoldingword.org/#organization';
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const DESKTOP_ID = `${SITE_URL}/desktop/#software`;
export const MOBILE_ID = `${SITE_URL}/mobile/#software`;
export const SOFTWARE_LICENSE_URL = 'https://opensource.org/licenses/MIT';
export const CONTENT_LICENSE_URL = 'https://creativecommons.org/licenses/by-sa/4.0/';

/** One-sentence English definition, kept identical wherever it appears
 *  (JSON-LD, /llms.txt, /ai/summary.json). Built from the home page copy. */
export const DEFINITION =
  'translationCore is a free, open-source set of tools from unfoldingWord for churches and translation teams to understand, translate, and check Scripture: translationCore Desktop for Windows, macOS and Linux, and translationCore Mobile for Android, iPhone and the web.';

// The current Desktop release, as linked from the Download section of
// /desktop/ (src/components/pages/DesktopPage.astro). Update both together.
export const DESKTOP_VERSION = '4.1.0-preview';
const DESKTOP_RELEASE = `https://github.com/unfoldingWord/translationCore4/releases/download/v${DESKTOP_VERSION}`;
export const DESKTOP_DOWNLOADS = [
  `${DESKTOP_RELEASE}/translationCore4-${DESKTOP_VERSION}-windows-x64.exe`,
  `${DESKTOP_RELEASE}/translationCore4-${DESKTOP_VERSION}-macos-arm64-unsigned.pkg`,
  `${DESKTOP_RELEASE}/translationCore4-${DESKTOP_VERSION}-linux-x64.zip`,
];
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=org.unfoldingword.tcmobile';
const APP_STORE_URL = 'https://apps.apple.com/us/app/translationcore-mobile/id6811348123';
const MOBILE_WEB_URL = 'https://tcmobile.app';

// Only links whose identity is confirmed — a wrong sameAs merges two entities
// in a knowledge graph. These are the profiles unfoldingword.org declares in
// its own Organization JSON-LD (the same list openbiblestories.org uses).
const ORGANIZATION_SAME_AS = [
  'https://door43.org/',
  'https://www.facebook.com/unfoldingWord',
  'https://x.com/unfoldingword',
  'https://github.com/unfoldingWord',
];

export function organizationNode() {
  return {
    '@type': 'Organization',
    '@id': PUBLISHER_ID,
    name: 'unfoldingWord',
    url: 'https://unfoldingword.org/',
    logo: { '@type': 'ImageObject', url: `${SITE_URL}/assets/img/unfoldingword-logo.png` },
    sameAs: ORGANIZATION_SAME_AS,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'general inquiries',
      url: 'https://unfoldingword.org/contact',
      availableLanguage: 'en',
    },
  };
}

export function websiteNode(inLanguage: string) {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: PRODUCT_NAME,
    description: DEFINITION,
    inLanguage,
    publisher: { '@id': PUBLISHER_ID },
  };
}

export function desktopNode(inLanguage: string) {
  return {
    '@type': 'SoftwareApplication',
    '@id': DESKTOP_ID,
    name: 'translationCore Desktop',
    alternateName: 'translationCore v4 Beta',
    description:
      'A free, open-source workspace to draft, check, align, and share Bible translations, with unfoldingWord resources built in. Works offline.',
    url: `${SITE_URL}/desktop/`,
    inLanguage,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Windows, macOS, Linux',
    softwareVersion: DESKTOP_VERSION,
    downloadUrl: DESKTOP_DOWNLOADS,
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    license: SOFTWARE_LICENSE_URL,
    image: `${SITE_URL}/assets/img/tc-desktop-main.png`,
    screenshot: `${SITE_URL}/assets/img/tc-desktop-main.png`,
    publisher: { '@id': PUBLISHER_ID },
    sameAs: ['https://github.com/unfoldingWord/translationCore4'],
  };
}

export function mobileNode(inLanguage: string) {
  return {
    '@type': 'MobileApplication',
    '@id': MOBILE_ID,
    name: 'translationCore Mobile',
    description:
      'Record Scripture in your own language on Android, iPhone, or the web. Free, open source, and works offline.',
    url: `${SITE_URL}/mobile/`,
    inLanguage,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Android 7.0 or later, iOS 15.4 or later, Web',
    installUrl: [PLAY_STORE_URL, APP_STORE_URL, MOBILE_WEB_URL],
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    license: SOFTWARE_LICENSE_URL,
    image: `${SITE_URL}/assets/img/tc-mobile-logo.png`,
    screenshot: `${SITE_URL}/assets/img/tc-mobile-record.png`,
    publisher: { '@id': PUBLISHER_ID },
    sameAs: [PLAY_STORE_URL, APP_STORE_URL, 'https://github.com/unfoldingWord/tc-mobile'],
  };
}

/** The page-specific nodes for each localized page. The home page names both
 *  apps; Desktop and Mobile describe themselves. */
export function pageJsonLd(slug: string, locale: string): unknown[] {
  const tag = byCode(locale).tag;
  switch (slug) {
    case 'home':
      return [desktopNode(tag), mobileNode(tag)];
    case 'desktop':
      return [desktopNode(tag)];
    case 'mobile':
      return [mobileNode(tag)];
    case 'previous-version':
      return [
        {
          '@type': 'SoftwareApplication',
          name: 'translationCore',
          alternateName: 'translationCore (previous version)',
          url: `${SITE_URL}${localePath('en', 'previous-version')}`,
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Windows, macOS, Linux',
          isAccessibleForFree: true,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          publisher: { '@id': PUBLISHER_ID },
          sameAs: ['https://github.com/unfoldingWord/translationCore'],
        },
      ];
    default:
      return [];
  }
}

export function serializeGraph(nodes: unknown[]): string {
  // Escape "<" so a string can never close the <script> element.
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes }).replace(/</g, '\\u003c');
}
