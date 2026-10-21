/* =============================================================================
   NIKONECT — site script
   Plain JS, no framework, no build step. Loaded with `defer`.
   ========================================================================== */

/* =============================================================================
   SITE_CONFIG
   -----------------------------------------------------------------------------
   Every value the site does not already know for certain lives here, and the
   UI hides anything that is still empty rather than printing a placeholder.
   Fill a value in and its element appears on the page by itself.
   ========================================================================== */
const SITE_CONFIG = {
  /* Canonical URL. Derived from the GitHub Pages address of this repo, since
     the CNAME was removed in commit 92c412d and there is no custom domain.
     TODO(Marko): replace if you point a domain at the site. Changing this
     updates the canonical tag, og:url, the JSON-LD and sitemap.xml — except
     sitemap.xml, which is a static file you must edit to match. */
  siteUrl: 'https://markopoptodorov-glitch.github.io/Nikonect-Agency/',

  /* TODO(Marko): your real address. The old site printed
     hello@nikonect.agency, which is not a mailbox you own, so it is gone.
     Leave null and the email row and dock button simply do not render. */
  email: null,

  instagram: 'nikonectagency',

  /* TODO(Marko): international format, no spaces, e.g. '38970123456'.
     Each one is a dock button only when it is filled in. */
  viber: null,
  whatsapp: null,

  /* TODO(Marko): paste a Web3Forms or Formspree endpoint to make the contact
     form actually deliver. Without one the form falls back to opening a
     mail client, and with no email either it is hidden entirely.
       Web3Forms  https://api.web3forms.com/submit   (also set formAccessKey)
       Formspree  https://formspree.io/f/xxxxxxxx    (leave formAccessKey null)
     Both are free and work from a static host. */
  formEndpoint: null,
  formAccessKey: null,

  /* TODO(Marko): real prices, or leave null.
     A null price renders as "Request a quote" — never "€—".
     The feature lines are deliberately non-committal: edit them to match
     what you actually promise per package. */
  pricing: {
    currency: '€',
    tiers: [
      {
        id: 'single',
        name: 'Single design',
        price: null,
        unit: 'per design',
        desc: 'One graphic, turned around fast.',
        features: ['One matchday graphic or thumbnail', 'First draft in 48 hours', 'Exported in the sizes you need'],
      },
      {
        id: 'pack',
        name: 'Matchday pack',
        price: null,
        unit: 'per pack',
        desc: 'A consistent set for a fixture or a campaign.',
        featured: true,
        features: ['A set of matchday and social designs', 'One consistent template across the set', 'First draft in 48 hours', 'Revision rounds agreed in your quote'],
      },
      {
        id: 'season',
        name: 'Season or event',
        price: null,
        unit: null,
        desc: 'Full coverage for a tournament or a whole season.',
        features: ['Full tournament or season coverage', 'Schedules, results and announcement graphics', 'Scope and turnaround agreed up front'],
      },
    ],
  },

  /* Cookie-free analytics, off until you switch it on.
     TODO(Marko): set enabled:true and fill siteId.
       goatcounter  siteId is your subdomain, e.g. 'nikonect'
       cloudflare   siteId is the Web Analytics beacon token */
  analytics: { enabled: false, provider: 'goatcounter', siteId: null },

  /* TODO(Marko): real quotes only, from people who agreed to be quoted.
     Left empty on purpose — nothing here is invented.
       { quote: '...', name: '...', role: '...' } */
  testimonials: [],
};

/* =============================================================================
   CONTENT — every string on the page, in both languages.
   English is also written into index.html so the page reads correctly before
   this script runs and so crawlers see real text. Switching to MK swaps it.
   ========================================================================== */
const content = {
  en: {
    'a11y.skip': 'Skip to content',
    'nav.work': 'Work', 'nav.services': 'Services', 'nav.process': 'Process',
    'nav.pricing': 'Pricing', 'nav.faq': 'FAQ', 'nav.contact': 'Contact',
    'cta.quote': 'Get a quote', 'cta.work': 'See the work',

    'hero.tag': 'Sports design studio · Macedonia',
    'hero.h1': 'Sports design that looks like a <em>final.</em>',
    'hero.sub': 'Matchday posters, lineups and social content for clubs, players and tournaments. First draft in 48 hours.',
    'hero.proofLabel': 'Designer for',

    'services.eyebrow': 'What I do',
    'services.title': 'Built for the <em>game.</em>',
    'services.s1.t': 'Matchday designs',
    'services.s1.d': 'Lineups, scorelines and gameday graphics that make every fixture look like a final.',
    'services.s2.t': 'Social media content',
    'services.s2.d': 'Post and story packs built for the feed: announcements, results and campaign sets that stay on-brand all season.',
    'services.s3.t': 'Thumbnails',
    'services.s3.d': 'Thumbnails for YouTube and video content, designed to stay readable at small sizes.',
    'services.s1.d1': 'Lineup graphics', 'services.s1.d2': 'Scorelines and results', 'services.s1.d3': 'Matchday posters',
    'services.s2.d1': 'Post templates', 'services.s2.d2': 'Stories', 'services.s2.d3': 'Carousels',
    'services.s3.d1': 'Video thumbnails', 'services.s3.d2': 'Social thumbnails',

    'work.eyebrow': 'Selected work',
    'work.title': 'The <em>portfolio.</em>',
    'work.sub': 'Client work for real tournaments, plus concept pieces made for practice. Both are labelled.',
    'work.f.all': 'All', 'work.f.client': 'Client work', 'work.f.matchdays': 'Matchdays',
    'work.f.concepts': 'Concepts', 'work.f.thumbnails': 'Thumbnails',
    'work.badge.client': 'Client work', 'work.badge.concept': 'Concept',
    'work.count': (n, total) => `Showing ${n} of ${total} designs`,
    'work.more': (n) => `Load more (${n})`,

    'process.eyebrow': 'How it works',
    'process.title': 'Three steps, <em>no fuss.</em>',
    'process.p1.t': 'Send the brief',
    'process.p1.d': 'Send the match or lineup details along with your brand assets: logo files, colours and player photos.',
    'process.p2.t': 'First draft in 48 hours',
    'process.p2.d': 'You get the first version within two days, ready for you to review and mark up.',
    'process.p3.t': 'Final files',
    'process.p3.d': 'After your revisions you get the final files, sized for wherever they are going.',

    'about.eyebrow': 'Who I am',
    'about.title': 'Sports is my <em>language.</em>',
    'about.p1': 'Nikonect is a one-person sports design studio based in Macedonia. I make matchday graphics, social media content and thumbnails for clubs, players and tournaments.',
    'about.p2': "I work fast and stay close to the game. Send me the fixture, the lineup and your brand assets, and the first draft lands within 48 hours.",
    'about.stat1': 'First draft', 'about.stat2': 'Designs', 'about.stat3': 'Years',

    'proof.eyebrow': 'Trusted by',
    'proof.title': 'Real <em>clients.</em>',
    'proof.sub': 'The clubs, tournaments and players I design for.',
    'proof.r1': 'Tournament designer · 2025',
    'proof.r2': 'Tournament designer · 2025',
    /* No year on the Borec card: the signing poster carries no date and one
       will not be invented. TODO(Marko): tell me the year. */
    'proof.r3': 'Designer',
    'proof.r4': 'Designer · 2025',

    'pricing.eyebrow': 'Packages',
    'pricing.title': 'Pick your <em>lineup.</em>',
    'pricing.quote': 'Request a quote',
    'pricing.recommended': 'Recommended',

    'faq.eyebrow': 'Questions',
    'faq.title': 'Before you <em>ask.</em>',
    'faq.q1': 'How fast is the first draft?',
    'faq.a1': 'Within 48 hours of receiving the match details and your brand assets.',
    'faq.q2': 'How many revisions are included?',
    'faq.a2': 'Revision rounds are agreed per project and written into your quote before work starts.',
    'faq.q3': 'What file formats do I get?',
    'faq.a3': 'Whatever the designs are going into. Tell me where they will be published — Instagram feed, stories, YouTube — and you get them sized and exported ready for it.',
    'faq.q4': 'How does payment work?',
    'faq.a4': 'Payment terms are agreed before work starts, as part of your quote.',
    'faq.q5': 'Do you design logos?',
    'faq.a5': 'No. Nikonect does matchday graphics, social media content and thumbnails — not logo or crest design.',

    'cta.title': 'Got a match <em>coming up?</em>',
    'cta.sub': 'First draft in 48 hours. Tell me the fixture and what you need.',

    'contact.eyebrow': 'Get in touch',
    'contact.title': "Let's work <em>together.</em>",
    'contact.name': 'Name', 'contact.email': 'Email', 'contact.type': 'What do you need?',
    'contact.select': 'Select…', 'contact.other': 'Something else',
    'contact.message': 'Message', 'contact.send': 'Send message',
    'contact.sending': 'Sending…',
    'contact.ok': 'Thanks — your message is on its way. I usually reply within a day.',
    'contact.err': 'That did not send. Please try again, or reach me on Instagram.',
    'contact.required': 'Please fill in your name, a valid email and a message.',
    'contact.mailto': 'Opening your mail app…',
    'contact.instagram': 'Instagram', 'contact.based': 'Based in', 'contact.country': 'Macedonia',
    'contact.noform': 'The contact form is not connected yet — send me a DM on Instagram and I will get back to you.',

    'footer.rights': 'All rights reserved.', 'footer.top': 'Back to top',
  },

  mk: {
    'a11y.skip': 'Оди на содржина',
    'nav.work': 'Проекти', 'nav.services': 'Услуги', 'nav.process': 'Процес',
    'nav.pricing': 'Цени', 'nav.faq': 'Прашања', 'nav.contact': 'Контакт',
    'cta.quote': 'Побарај понуда', 'cta.work': 'Погледни ги проектите',

    'hero.tag': 'Студио за спортски дизајн · Македонија',
    'hero.h1': 'Дизајн за спортски клубови што изгледа како <em>финале.</em>',
    'hero.sub': 'Постери за натпревари, најави на состави и содржина за социјални мрежи. Прва скица за 48 часа.',
    'hero.proofLabel': 'Дизајнер за',

    'services.eyebrow': 'Што работам',
    'services.title': 'Создадено за <em>играта.</em>',
    'services.s1.t': 'Дизајн за натпревари',
    'services.s1.d': 'Состави, резултати и графики за ден на натпревар што го прават секој натпревар да изгледа како финале.',
    'services.s2.t': 'Содржина за социјални мрежи',
    'services.s2.d': 'Пакети постови и стории за фидот: најави, резултати и кампањи што остануваат во ист стил цела сезона.',
    'services.s3.t': 'Thumbnail дизајн',
    'services.s3.d': 'Thumbnail-и за YouTube и видео содржина, дизајнирани да се читаат и во мала големина.',
    'services.s1.d1': 'Графики за состави', 'services.s1.d2': 'Резултати', 'services.s1.d3': 'Постери за натпревари',
    'services.s2.d1': 'Шаблони за постови', 'services.s2.d2': 'Стории', 'services.s2.d3': 'Карусели',
    'services.s3.d1': 'Thumbnail-и за видео', 'services.s3.d2': 'Thumbnail-и за социјални мрежи',

    'work.eyebrow': 'Избрани проекти',
    'work.title': '<em>Портфолио.</em>',
    'work.sub': 'Работа за вистински турнири, плус концепти направени за вежба. И двете се означени.',
    'work.f.all': 'Сите', 'work.f.client': 'Клиентска работа', 'work.f.matchdays': 'Натпревари',
    'work.f.concepts': 'Концепти', 'work.f.thumbnails': 'Thumbnail-и',
    'work.badge.client': 'Клиентска работа', 'work.badge.concept': 'Концепт',
    'work.count': (n, total) => `Прикажани ${n} од ${total} дизајни`,
    'work.more': (n) => `Прикажи уште (${n})`,

    'process.eyebrow': 'Како функционира',
    'process.title': 'Три чекори, <em>без компликации.</em>',
    'process.p1.t': 'Прати ги деталите',
    'process.p1.d': 'Прати ги деталите за натпреварот или составот заедно со твоите материјали: лого, бои и фотографии од играчи.',
    'process.p2.t': 'Прва скица за 48 часа',
    'process.p2.d': 'Првата верзија ја добиваш за два дена, подготвена за преглед и забелешки.',
    'process.p3.t': 'Финални фајлови',
    'process.p3.d': 'По твоите корекции ги добиваш финалните фајлови, во димензии за таму каде што одат.',

    'about.eyebrow': 'Кој сум јас',
    'about.title': 'Спортот е мојот <em>јазик.</em>',
    'about.p1': 'Nikonect е студио за спортски дизајн од една личност, со седиште во Македонија. Работам графики за натпревари, содржина за социјални мрежи и thumbnail-и за клубови, играчи и турнири.',
    'about.p2': 'Работам брзо и блиску до играта. Прати ми го натпреварот, составот и твоите материјали, и првата скица стигнува за 48 часа.',
    'about.stat1': 'Прва скица', 'about.stat2': 'Дизајни', 'about.stat3': 'Години',

    'proof.eyebrow': 'Доверено од',
    'proof.title': 'Вистински <em>клиенти.</em>',
    'proof.sub': 'Клубовите, турнирите и играчите за кои дизајнирам.',
    'proof.r1': 'Дизајнер на турнирот · 2025',
    'proof.r2': 'Дизајнер на турнирот · 2025',
    'proof.r3': 'Дизајнер',
    'proof.r4': 'Дизајнер · 2025',

    'pricing.eyebrow': 'Пакети',
    'pricing.title': 'Избери го твојот <em>состав.</em>',
    'pricing.quote': 'Побарај понуда',
    'pricing.recommended': 'Препорачано',

    'faq.eyebrow': 'Прашања',
    'faq.title': 'Пред да <em>прашаш.</em>',
    'faq.q1': 'Колку брзо е првата скица?',
    'faq.a1': 'За 48 часа од моментот кога ќе ги добијам деталите за натпреварот и твоите материјали.',
    'faq.q2': 'Колку корекции се вклучени?',
    'faq.a2': 'Бројот на корекции се договара за секој проект и се запишува во понудата пред да почне работата.',
    'faq.q3': 'Во кои формати ги добивам фајловите?',
    'faq.a3': 'Во она што ти треба. Кажи ми каде ќе се објавуваат — Instagram фид, стории, YouTube — и ги добиваш во точни димензии, подготвени за објава.',
    'faq.q4': 'Како функционира плаќањето?',
    'faq.a4': 'Условите за плаќање се договараат пред да почне работата, како дел од понудата.',
    'faq.q5': 'Дали работиш логоа?',
    'faq.a5': 'Не. Nikonect работи графики за натпревари, содржина за социјални мрежи и thumbnail-и — не логоа или грбови.',

    'cta.title': 'Имаш натпревар <em>наскоро?</em>',
    'cta.sub': 'Прва скица за 48 часа. Кажи ми за натпреварот и што ти треба.',

    'contact.eyebrow': 'Контакт',
    'contact.title': 'Ајде да работиме <em>заедно.</em>',
    'contact.name': 'Име', 'contact.email': 'Е-пошта', 'contact.type': 'Што ти треба?',
    'contact.select': 'Избери…', 'contact.other': 'Нешто друго',
    'contact.message': 'Порака', 'contact.send': 'Испрати порака',
    'contact.sending': 'Се испраќа…',
    'contact.ok': 'Фала — пораката е на пат. Обично одговарам во рок од еден ден.',
    'contact.err': 'Пораката не се испрати. Обиди се повторно или пиши ми на Instagram.',
    'contact.required': 'Те молам внеси име, валидна е-пошта и порака.',
    'contact.mailto': 'Се отвора твојата апликација за е-пошта…',
    'contact.instagram': 'Instagram', 'contact.based': 'Седиште', 'contact.country': 'Македонија',
    'contact.noform': 'Формата сè уште не е поврзана — прати ми DM на Instagram и ќе ти одговорам.',

    'footer.rights': 'Сите права задржани.', 'footer.top': 'Назад на почеток',
  },
};

/* ========================================================================== */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let lang = 'en';
const t = (key, ...args) => {
  const v = content[lang]?.[key] ?? content.en[key] ?? '';
  return typeof v === 'function' ? v(...args) : v;
};

/* -----------------------------------------------------------------------------
   LANGUAGE
   -------------------------------------------------------------------------- */
function applyLanguage(next) {
  lang = content[next] ? next : 'en';
  document.documentElement.lang = lang;

  for (const el of $$('[data-i18n]')) {
    const v = content[lang][el.dataset.i18n];
    if (typeof v === 'string') el.textContent = v;
  }
  for (const el of $$('[data-i18n-html]')) {
    const v = content[lang][el.dataset.i18nHtml];
    if (typeof v === 'string') el.innerHTML = v;
  }
  for (const b of $$('.lang button')) {
    b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
  }

  renderPricing();
  relabelPortfolio();
  try { localStorage.setItem('nikonect-lang', lang); } catch { /* private mode */ }
}

function initLanguage() {
  for (const b of $$('.lang button')) {
    b.addEventListener('click', () => applyLanguage(b.dataset.lang));
  }
  let saved = null;
  try { saved = localStorage.getItem('nikonect-lang'); } catch { /* ignore */ }
  if (saved && saved !== 'en') applyLanguage(saved);
}

/* -----------------------------------------------------------------------------
   PORTFOLIO
   Built once from the generated image manifest, then filtered by toggling the
   `hidden` property. The DOM is never rebuilt and no image is ever re-fetched.
   -------------------------------------------------------------------------- */

/* Human labels for the build-time type classification. Nothing here is
   derived from a filename: scripts/optimize-images.mjs classifies each source
   into one of these keys, and only these words ever reach the page. */
const TYPE_LABELS = {
  matchday:      { en: 'Matchday poster',        mk: 'Постер за натпревар' },
  thumbnail:     { en: 'Video thumbnail',        mk: 'Thumbnail за видео' },
  signing:       { en: 'Signing announcement',   mk: 'Најава на потпишување' },
  schedule:      { en: 'Schedule',               mk: 'Распоред' },
  results:       { en: 'Results',                mk: 'Резултати' },
  champions:     { en: 'Champions',              mk: 'Шампиони' },
  mvp:           { en: 'MVP award',              mk: 'МВП награда' },
  dunk:          { en: 'Dunk contest',           mk: 'Натпревар во закуцување' },
  'three-point': { en: 'Three-point contest',    mk: 'Натпревар во тројки' },
  'runner-up':   { en: 'Runner-up',              mk: 'Второ место' },
  playoff:       { en: 'Playoff bracket',        mk: 'Плеј-оф' },
  knockout:      { en: 'Knockout round',         mk: 'Елиминациона фаза' },
  final:         { en: 'Semi-final and final',   mk: 'Полуфинале и финале' },
  groups:        { en: 'Group stage',            mk: 'Групна фаза' },
  fixture:       { en: 'Fixture announcement',   mk: 'Најава на натпревар' },
  'key-art':     { en: 'Tournament key art',     mk: 'Клучна графика' },
  tournament:    { en: 'Tournament graphic',     mk: 'Турнирска графика' },
  concept:       { en: 'Concept poster',         mk: 'Концепт постер' },
};

const typeLabel = (type) => (TYPE_LABELS[type] || TYPE_LABELS.concept)[lang]
  || (TYPE_LABELS[type] || TYPE_LABELS.concept).en;

const CATEGORY = {
  slamjam:    { group: 'client',  project: 'SlamJam Skopje 2025',      filters: ['client'] },
  sportski:   { group: 'client',  project: 'Sportski Igri Veles 2025', filters: ['client'] },
  borec:      { group: 'client',  project: 'Borec Basketball',         filters: ['client'] },
  matchdays:  { group: 'concept', project: 'Matchday poster',          filters: ['matchdays'] },
  concepts:   { group: 'concept', project: 'Concept piece',            filters: ['concepts'] },
  thumbnails: { group: 'concept', project: 'Thumbnail',                filters: ['thumbnails'] },
};


/* Priority for the round-robin below. The matchday posters are the strongest
   pieces visually, so they lead. */
const CAT_ORDER = ['matchdays', 'slamjam', 'concepts', 'sportski', 'borec', 'thumbnails'];

/* How many tiles are shown before "Load more". */
const PAGE_SIZE = 24;

/* Dealing one tile from each category in turn, rather than showing a category
   at a time. Both tournaments are mostly schedule and results tables, and in
   a straight run they filled the whole first screen with near-identical
   layouts; interleaving keeps the opening varied. */
function interleaveByCategory(images) {
  const buckets = new Map(CAT_ORDER.map((c) => [c, []]));
  for (const img of images) {
    if (!buckets.has(img.cat)) buckets.set(img.cat, []);
    buckets.get(img.cat).push(img);
  }
  for (const list of buckets.values()) list.sort((a, b) => a.id.localeCompare(b.id));

  const out = [];
  let drained = false;
  while (!drained) {
    drained = true;
    for (const cat of CAT_ORDER) {
      const list = buckets.get(cat);
      if (list && list.length) { out.push(list.shift()); drained = false; }
    }
  }
  return out;
}

function srcsetFor(entry) {
  return entry.widths.map((w) => `${entry.src}-${w}.webp ${w}w`).join(', ');
}

let tiles = [];

function buildPortfolio() {
  const grid = $('#grid');
  const images = window.NIKONECT_IMAGES;
  if (!grid || !Array.isArray(images)) return;

  const sorted = interleaveByCategory(images);

  /* Creating all 83 tiles in one go was the only task over 50ms left at load.
     The first page is built immediately so the grid is usable, and the rest
     follow in idle chunks. */
  const build = (entries) => {
    const frag = document.createDocumentFragment();
    for (const entry of entries) frag.append(makeTile(entry));
    grid.append(frag);
    tiles = $$('.tile', grid);
  };

  build(sorted.slice(0, PAGE_SIZE));
  relabelPortfolio();
  initFilters();
  initLightbox();

  const rest = sorted.slice(PAGE_SIZE);
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1));
  let cursor = 0;
  const step = () => {
    if (cursor >= rest.length) return;
    build(rest.slice(cursor, cursor + PAGE_SIZE));
    cursor += PAGE_SIZE;
    relabelPortfolio();
    applyFilter();
    idle(step);
  };
  idle(step);
}

function makeTile(entry) {
  {
    const meta = CATEGORY[entry.cat] || CATEGORY.concepts;

    /* A named client in the manifest promotes the piece out of its category
       default — that is how the Valencia poster reaches Client work. */
    const project = entry.client || meta.project;
    const group = entry.client ? 'client' : meta.group;
    const filters = entry.client ? [...new Set(['client', ...meta.filters])] : meta.filters;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tile';
    btn.dataset.filters = [...filters, 'all'].join(' ');
    btn.dataset.full = `${entry.src}-1080.webp`;
    btn.dataset.type = entry.type;
    btn.dataset.project = project;
    btn.dataset.group = group;
    btn.dataset.cat = entry.cat;

    const img = document.createElement('img');
    img.src = `${entry.src}-480.webp`;
    img.srcset = srcsetFor(entry);
    img.sizes = '(min-width: 1100px) 250px, (min-width: 560px) 33vw, 45vw';
    img.width = entry.w;
    img.height = entry.h;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = `${project} — ${typeLabel(entry.type)}`;

    const frame = document.createElement('span');
    frame.className = 'tile__frame';
    frame.append(img);

    const badge = document.createElement('span');
    badge.className = `badge badge--${group}`;
    badge.dataset.badge = group;

    /* Caption is club/event on one line and the kind of graphic on the next.
       Both come from curated vocabulary, never from the source filename. */
    const name = document.createElement('span');
    name.className = 'tile__project';
    name.textContent = project;

    const kind = document.createElement('span');
    kind.className = 'tile__type';
    kind.textContent = typeLabel(entry.type);

    const text = document.createElement('span');
    text.className = 'tile__text';
    text.append(name, kind);

    const label = document.createElement('span');
    label.className = 'tile__meta';
    label.append(badge, text);

    btn.append(frame, label);
    return btn;
  }
}

/* Badge text and alt text follow the language toggle. */
function relabelPortfolio() {
  if (tiles.length) applyFilter();
  for (const tile of tiles) {
    const group = tile.dataset.group;
    const badge = $('.badge', tile);
    if (badge) badge.textContent = t(group === 'client' ? 'work.badge.client' : 'work.badge.concept');

    const kind = $('.tile__type', tile);
    if (kind) kind.textContent = typeLabel(tile.dataset.type);
    const img = $('img', tile);
    if (img) img.alt = `${tile.dataset.project} — ${typeLabel(tile.dataset.type)}`;
  }
}

let currentFilter = 'all';
let shownLimit = PAGE_SIZE;

/* Filtering and paging both work by toggling `hidden` on tiles that already
   exist. Nothing is ever created, destroyed or re-fetched. */
function applyFilter(key = currentFilter) {
  currentFilter = key;
  const status = $('#gridStatus');
  const more = $('#gridMore');

  let matched = 0;
  let shown = 0;
  for (const tile of tiles) {
    const match = key === 'all' || tile.dataset.filters.split(' ').includes(key);
    if (match) matched++;
    const visible = match && matched <= shownLimit;
    tile.hidden = !visible;
    if (visible) shown++;
  }

  for (const b of $$('.filter')) b.setAttribute('aria-pressed', String(b.dataset.filter === key));
  if (status) status.textContent = t('work.count', shown, matched);
  if (more) {
    more.hidden = shown >= matched;
    const btn = $('button', more);
    if (btn) btn.textContent = t('work.more', matched - shown);
  }
}

function initFilters() {
  for (const b of $$('.filter')) {
    b.addEventListener('click', () => {
      shownLimit = PAGE_SIZE;
      applyFilter(b.dataset.filter);
    });
  }
  $('#gridMore button')?.addEventListener('click', () => {
    shownLimit += PAGE_SIZE;
    applyFilter();
  });
  applyFilter('all');
}

/* -----------------------------------------------------------------------------
   LIGHTBOX — the 1080px step is only ever requested from here.
   -------------------------------------------------------------------------- */
function initLightbox() {
  const dlg = $('#lightbox');
  const img = $('#lightboxImg');
  const cap = $('#lightboxCap');
  if (!dlg || typeof dlg.showModal !== 'function') return;

  const open = (tile) => {
    img.src = tile.dataset.full;
    img.alt = `${tile.dataset.project} — ${typeLabel(tile.dataset.type)}`;
    cap.textContent = `${tile.dataset.project} · ${typeLabel(tile.dataset.type)}`;
    dlg.showModal();
  };

  /* Delegated, so tiles added in later idle chunks work without rebinding. */
  $('#grid')?.addEventListener('click', (e) => {
    const tile = e.target.closest('.tile');
    if (tile) open(tile);
  });
  $('#lightboxClose')?.addEventListener('click', () => dlg.close());
  // Clicking the empty area around the image closes it.
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  // Drop the large source on close so it is not kept decoded in memory.
  dlg.addEventListener('close', () => { img.removeAttribute('src'); });
}

/* -----------------------------------------------------------------------------
   MARQUEE
   The animation is pure CSS. This only pauses it off-screen and drops the
   backdrop-filter on the two fixed glass surfaces while it is visible, so a
   moving image strip is never sampled through a blur.
   -------------------------------------------------------------------------- */
function initMarquee() {
  const marquee = $('#marquee');
  if (!marquee || !('IntersectionObserver' in window)) return;

  let primed = false;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      marquee.classList.toggle('is-paused', !e.isIntersecting);
      document.documentElement.classList.toggle('marquee-visible', e.isIntersecting);

      /* First time it comes near, fetch the whole strip at once. Left lazy,
         posters would pop in one by one as the track slides them into view. */
      if (e.isIntersecting && !primed) {
        primed = true;
        for (const img of $$('img', marquee)) img.loading = 'eager';
      }
    }
  }, { rootMargin: '200px 0px' });

  io.observe(marquee);
  marquee.classList.add('is-paused');
}

/* -----------------------------------------------------------------------------
   SCROLL REVEAL — opacity and transform only.
   -------------------------------------------------------------------------- */
let revealObserver = null;

/* Lets nodes created after boot (pricing cards on a language switch) join the
   same observer, instead of being left at opacity 0 forever. */
function registerReveal(el) {
  if (revealObserver) revealObserver.observe(el);
}

function initReveal() {
  if (reduceMotion.matches || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('js-anim');

  const io = new IntersectionObserver((entries, obs) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      obs.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  revealObserver = io;
  for (const el of $$('.reveal')) io.observe(el);
}

/* -----------------------------------------------------------------------------
   COUNTERS — start once, rAF, final value rendered statically under
   prefers-reduced-motion (the markup already holds the final value).
   -------------------------------------------------------------------------- */
function initCounters() {
  const nodes = $$('[data-count]');
  if (!nodes.length) return;
  if (reduceMotion.matches || !('IntersectionObserver' in window)) return;

  const run = (el) => {
    const end = Number(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    let start = null;

    const tick = (now) => {
      if (start === null) start = now;
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver((entries, obs) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      run(e.target);
      obs.unobserve(e.target);
    }
  }, { threshold: 0.4 });

  for (const el of nodes) io.observe(el);
}

/* -----------------------------------------------------------------------------
   NAV
   -------------------------------------------------------------------------- */
function initNav() {
  const nav = $('#nav');
  const burger = $('#burger');
  const links = $('#navLinks');
  let last = window.scrollY;
  let ticking = false;

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (!links.classList.contains('is-open')) {
        nav.classList.toggle('is-hidden', y > last && y > 240);
      }
      last = y;
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  const setMenu = (open) => {
    /* Also flags the header so CSS can drop the pill's backdrop-filter, which
       otherwise becomes the containing block for the fixed sheet. */
    nav.classList.toggle('menu-open', open);
    burger.classList.toggle('is-open', open);
    links.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };

  burger.addEventListener('click', () => setMenu(!links.classList.contains('is-open')));
  for (const a of $$('a', links)) a.addEventListener('click', () => setMenu(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && links.classList.contains('is-open')) setMenu(false);
  });

  /* Anchor scrolling that accounts for the fixed nav. */
  for (const a of $$('a[href^="#"]')) {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const offset = nav.offsetHeight + 12;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({
        top: Math.max(top, 0),
        behavior: reduceMotion.matches ? 'auto' : 'smooth',
      });
      // Keep the keyboard where the eye went.
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  }
}

/* -----------------------------------------------------------------------------
   PRICING — rendered from SITE_CONFIG. A null price is "Request a quote".
   -------------------------------------------------------------------------- */
function renderPricing() {
  const host = $('#prices');
  if (!host) return;
  const { currency, tiers } = SITE_CONFIG.pricing;
  host.textContent = '';

  for (const tier of tiers) {
    const card = document.createElement('div');
    card.className = 'price glass reveal' + (tier.featured ? ' price--featured' : '');

    if (tier.featured) {
      const badge = document.createElement('div');
      badge.className = 'price__badge';
      badge.textContent = t('pricing.recommended');
      card.append(badge);
    }

    const name = document.createElement('div');
    name.className = 'price__tier';
    name.textContent = tier.name;

    const amt = document.createElement('div');
    amt.className = 'price__amt';
    if (tier.price === null || tier.price === undefined || tier.price === '') {
      amt.textContent = t('pricing.quote');
      amt.classList.add('price__amt--quote');
    } else {
      amt.textContent = `${currency}${tier.price}`;
      if (tier.unit) {
        const small = document.createElement('small');
        small.textContent = ` ${tier.unit}`;
        amt.append(small);
      }
    }

    const desc = document.createElement('div');
    desc.className = 'price__desc';
    desc.textContent = tier.desc || '';

    const ul = document.createElement('ul');
    for (const f of tier.features || []) {
      const li = document.createElement('li');
      li.textContent = f;
      ul.append(li);
    }

    const cta = document.createElement('a');
    cta.href = '#contact';
    cta.className = 'btn' + (tier.featured ? '' : ' btn--ghost');
    cta.textContent = t('cta.quote');

    card.append(name, amt, desc, ul, cta);
    host.append(card);
    registerReveal(card);
  }
}

/* -----------------------------------------------------------------------------
   CONTACT — dock, side rows, and a form that works on a static host.
   -------------------------------------------------------------------------- */
const ICONS = {
  viber: '<path d="M12 2C6.9 2 3 5.6 3 10c0 2.5 1.2 4.7 3.2 6.1V21l3.3-2a11 11 0 0 0 2.5.3c5.1 0 9-3.6 9-8s-3.9-9.3-9-9.3Z"/>',
  whatsapp: '<path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm5.2 14.1c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .1-1.7-.1a12 12 0 0 1-6.9-6c-.5-.9-.8-1.8-.8-2.6 0-.8.4-1.5.8-1.8.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2 0 .4-.1.6l-.4.5c-.1.2-.3.3-.1.6.5.9 1.8 2.2 3 2.7.3.1.4.1.6-.1l.7-.8c.2-.2.3-.2.6-.1l1.8.9c.3.1.4.2.4.4 0 .2 0 .9-.2 1.5Z"/>',
  instagram: '<path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4 1 .5.4.8.8 1 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c0 1.2-.2 1.8-.4 2.2-.2.6-.5 1-1 1.4-.4.5-.8.8-1.4 1-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2 0-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-1-.5-.4-.8-.8-1-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c0-1.2.2-1.8.4-2.2.2-.6.5-1 1-1.4.4-.5.8-.8 1.4-1 .4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 3.2a6.6 6.6 0 1 0 0 13.2 6.6 6.6 0 0 0 0-13.2Zm0 10.9a4.3 4.3 0 1 1 0-8.6 4.3 4.3 0 0 1 0 8.6Zm6.9-11.1a1.5 1.5 0 1 1-3.1 0 1.5 1.5 0 0 1 3.1 0Z"/>',
  email: '<path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm9 8L4.2 7.2v.6L12 13.6l7.8-5.8v-.6L12 13Z"/>',
};

function contactChannels() {
  const c = SITE_CONFIG;
  const list = [];
  if (c.viber) list.push({ key: 'viber', label: 'Viber', href: `viber://chat?number=%2B${c.viber}` });
  if (c.whatsapp) list.push({ key: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/${c.whatsapp}` });
  if (c.instagram) list.push({ key: 'instagram', label: 'Instagram', href: `https://ig.me/m/${c.instagram}` });
  if (c.email) list.push({ key: 'email', label: 'Email', href: `mailto:${c.email}` });
  return list;
}

function initDock() {
  const dock = $('#dock');
  if (!dock) return;
  const channels = contactChannels();
  if (!channels.length) { dock.remove(); return; }

  for (const ch of channels) {
    const a = document.createElement('a');
    a.href = ch.href;
    a.setAttribute('aria-label', ch.label);
    a.title = ch.label;
    if (ch.href.startsWith('http')) { a.target = '_blank'; a.rel = 'noopener'; }
    a.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${ICONS[ch.key]}</svg>`;
    dock.append(a);
  }

  /* Appears once the hero is behind you, hides over the contact section where
     the same links are already on the page. */
  if (!('IntersectionObserver' in window)) { dock.classList.add('is-visible'); return; }
  const hero = $('#hero');
  const contact = $('#contact');
  let pastHero = false;
  let atContact = false;
  const sync = () => dock.classList.toggle('is-visible', pastHero && !atContact);

  new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting; sync(); }).observe(hero);

  /* Hide the dock over the contact section and the footer — both already show
     the same links, and on a short screen a floating button would otherwise
     sit on top of them. */
  const tail = [contact, document.querySelector('footer')].filter(Boolean);
  const seen = new Set();
  for (const el of tail) {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) seen.add(e.target); else seen.delete(e.target);
      atContact = seen.size > 0;
      sync();
    }).observe(el);
  }
}

function initContactSide() {
  const side = $('#contactSide');
  if (!side || !SITE_CONFIG.email) return;
  const row = document.createElement('div');
  const lbl = document.createElement('div');
  lbl.className = 'lbl';
  lbl.dataset.i18n = 'contact.email';
  lbl.textContent = t('contact.email');
  const a = document.createElement('a');
  a.className = 'val';
  a.href = `mailto:${SITE_CONFIG.email}`;
  a.textContent = SITE_CONFIG.email;
  row.append(lbl, a);
  side.prepend(row);
}

function initForm() {
  const form = $('#contactForm');
  const note = $('#formNote');
  const panel = $('#formPanel');
  const submit = $('#formSubmit');
  if (!form) return;

  /* With no endpoint and no address there is nowhere for a message to go, so
     the form is removed rather than left to fail silently. */
  if (!SITE_CONFIG.formEndpoint && !SITE_CONFIG.email) {
    panel.textContent = '';
    const p = document.createElement('p');
    p.className = 'form-note';
    p.dataset.i18n = 'contact.noform';
    p.textContent = t('contact.noform');
    const a = document.createElement('a');
    a.className = 'btn';
    a.href = `https://instagram.com/${SITE_CONFIG.instagram}`;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = '@' + SITE_CONFIG.instagram;
    a.style.marginTop = '1.2rem';
    panel.append(p, a);
    return;
  }

  const say = (msg, state) => {
    note.textContent = msg;
    note.dataset.state = state;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Honeypot: a real person never sees this field.
    if (form.elements.botcheck.value) return;

    const data = new FormData(form);
    data.delete('botcheck');

    const name = (data.get('name') || '').toString().trim();
    const email = (data.get('email') || '').toString().trim();
    const message = (data.get('message') || '').toString().trim();
    if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      say(t('contact.required'), 'error');
      return;
    }

    if (!SITE_CONFIG.formEndpoint) {
      // mailto: fallback — no endpoint, but we do have an address.
      const subject = encodeURIComponent(`Nikonect enquiry — ${data.get('type') || 'Project'}`);
      const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
      say(t('contact.mailto'), 'ok');
      window.location.href = `mailto:${SITE_CONFIG.email}?subject=${subject}&body=${body}`;
      return;
    }

    if (SITE_CONFIG.formAccessKey) data.append('access_key', SITE_CONFIG.formAccessKey);
    data.append('subject', `Nikonect enquiry from ${name}`);

    submit.disabled = true;
    say(t('contact.sending'), '');
    try {
      const res = await fetch(SITE_CONFIG.formEndpoint, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      say(t('contact.ok'), 'ok');
    } catch {
      say(t('contact.err'), 'error');
    } finally {
      submit.disabled = false;
    }
  });
}

/* -----------------------------------------------------------------------------
   CUSTOM CURSOR
   Precise pointers only, one rAF loop that stops when the pointer is still,
   transform-driven, passive listener.
   -------------------------------------------------------------------------- */
function initCursor() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (reduceMotion.matches) return;

  const ring = $('#cursor');
  const dot = $('#cursorDot');
  if (!ring || !dot) return;

  document.documentElement.classList.add('cursor-on');

  let mx = innerWidth / 2, my = innerHeight / 2;
  let cx = mx, cy = my;
  let running = false;

  const loop = () => {
    cx += (mx - cx) * 0.2;
    cy += (my - cy) * 0.2;
    ring.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;

    // Stop the loop once it has caught up; a mousemove restarts it.
    if (Math.abs(mx - cx) < 0.3 && Math.abs(my - cy) < 0.3) {
      running = false;
      return;
    }
    requestAnimationFrame(loop);
  };

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    if (!running) { running = true; requestAnimationFrame(loop); }
  }, { passive: true });

  // One delegated pair of listeners instead of two per interactive element.
  const INTERACTIVE = 'a, button, input, select, textarea, summary, .tile';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(INTERACTIVE)) ring.classList.add('is-grown');
  }, { passive: true });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(INTERACTIVE)) ring.classList.remove('is-grown');
  }, { passive: true });
}

/* -----------------------------------------------------------------------------
   MISC
   -------------------------------------------------------------------------- */
function initYear() {
  const el = $('#year');
  if (el) el.textContent = String(new Date().getFullYear());
}

/* Keeps the canonical URL, og:url and JSON-LD in step with SITE_CONFIG so the
   config stays the single place to change the address. */
function syncSiteUrl() {
  const url = SITE_CONFIG.siteUrl;
  if (!url) {
    $('link[rel="canonical"]')?.remove();
    $('meta[property="og:url"]')?.remove();
    return;
  }
  const canonical = $('link[rel="canonical"]');
  if (canonical) canonical.href = url;
  $('meta[property="og:url"]')?.setAttribute('content', url);

  const ld = $('script[type="application/ld+json"]');
  if (ld) {
    try {
      const data = JSON.parse(ld.textContent);
      data.url = url;
      data.image = new URL('assets/og-image.jpg', url).href;
      ld.textContent = JSON.stringify(data);
    } catch { /* leave the static block alone if it will not parse */ }
  }
}

/* Cookie-free analytics, only when switched on and configured. */
function initAnalytics() {
  const a = SITE_CONFIG.analytics;
  if (!a || !a.enabled || !a.siteId) return;

  const s = document.createElement('script');
  s.defer = true;
  if (a.provider === 'goatcounter') {
    s.src = 'https://gc.zgo.at/count.js';
    s.dataset.goatcounter = `https://${a.siteId}.goatcounter.com/count`;
  } else if (a.provider === 'cloudflare') {
    s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    s.setAttribute('data-cf-beacon', JSON.stringify({ token: a.siteId }));
  } else {
    return;
  }
  document.head.append(s);
}

/* -----------------------------------------------------------------------------
   BOOT
   -------------------------------------------------------------------------- */
function init() {
  syncSiteUrl();
  initYear();
  initLanguage();
  renderPricing();
  buildPortfolio();
  initMarquee();
  initReveal();
  initCounters();
  initNav();
  initDock();
  initContactSide();
  initForm();
  initCursor();
  initAnalytics();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
