/* ==========================================================================
   VAK Marketing — RU / EN.
   Русский лежит прямо в разметке, английский в словаре ниже.
   Ключ = значение атрибута data-i18n, значение = HTML для замены.
   ========================================================================== */
(function () {
'use strict';

var EN = {
  'a11y.skip':'Skip to content',

  /* шапка */
  'nav.services':'Services','nav.allServices':'View all services','nav.course':'B2B and B2C LinkedIn course — coming soon','nav.strategy':'Strategy','nav.linkedin':'LinkedIn',
  'nav.pr':'PR, media and SERP','nav.seo':'AI SEO','nav.localization':'Localization',
  'nav.cases':'Cases','nav.clients':'Clients','nav.team':'Team',
  'nav.about':'About','nav.blog':'Blog','nav.contacts':'Contacts',
  'nav.cta':'Book a consultation',
  'nav.menu':'Menu','nav.close':'Close','nav.prShort':'PR','nav.localizationShort':'Translation','nav.founder':'Founder','nav.courseShort':'Course','nav.soon':'soon',

  /* первый экран */
  'hero.h1':'Full-cycle marketing, PR <br>and B2B growth for <span class="hero__accent">iGaming, <br>FinTech</span> and <span class="hero__accent">Web3</span> projects',
  'hero.sub':'We build positioning, strengthen brand trust and run growth as one system: PR, LinkedIn, SEO, content, media and automation.',
  'hero.cta1':'Discuss your project','hero.cta2':'See our services',

  /* о нас */
  'about.h2':'About VAK Marketing',
  'about.p1':'We specialise in dynamic, competitive markets: iGaming, FinTech, Crypto, Web3, Payments, SaaS and B2B.',
  'about.p2':'Our job is to assemble a complete marketing system for the project. Strategy, positioning and brand packaging first, then PR, LinkedIn, SEO, content, lead generation, media placements and process automation.',
  'about.p3':'That is how a company earns its reputation and gains access to the people who decide: partners, investors, clients and relevant B2B opportunities.',
  'about.cta':'More about us<i></i>',
  'about.visual.system':'GROWTH SYSTEM',
  'about.visual.systemValue':'Strategy · PR · content',
  'about.visual.result':'RESULT',
  'about.visual.resultValue':'Reputation · access · demand',
  'about.module.short1':'Market','about.module.d1':'segments · competitors',
  'about.module.short2':'Position','about.module.d2':'offer · evidence',
  'about.module.short3':'Channels','about.module.d3':'PR · LinkedIn',
  'about.module.short4':'Content','about.module.d4':'topics · SEO',
  'about.module.short5':'Leads','about.module.d5':'qualification · pipeline',
  'about.module.short6':'Result','about.module.d6':'partners · deals',
  'about.flowline':'<span>Strategy</span><i aria-hidden="true"></i><span>Tactics</span><i aria-hidden="true"></i><span>Optimisation</span><i aria-hidden="true"></i><span>Result</span>',
  'about.flow.kicker':'OPERATING SYSTEM',
  'about.flow.t1':'Diagnosis','about.flow.d1':'market, goals, growth points',
  'about.flow.t2':'Positioning','about.flow.d2':'brand role and trust',
  'about.flow.t3':'Marketing system','about.flow.d3':'PR, LinkedIn, SEO, content',
  'about.flow.t4':'Demand and analytics','about.flow.d4':'leads, partnerships, growth',
  'about.flow.result':'RESULT','about.flow.value':'Reputation · access · demand',

  /* цифры */
  'fig.l1':'years of experience','fig.d1':'in crypto, fintech, iGaming and B2B marketing',
  'fig.l2':'publications','fig.d2':'for our clients in international finance and iGaming media',
  'fig.l3':'media outlets','fig.d3':'in our partner and placement database',
  'fig.l4':'projects','fig.d4':'supported with PR, marketing, content and growth',

  /* с кем работаем */
  'aud.h2':'Who we work with',
  'aud.sub':'From tech start-ups to international companies. We work with projects of every scale and find solutions for specific business goals.',
  'aud.t1':'iGaming projects',
  'aud.d1':'Operators, platforms, PSPs, affiliate teams and B2B services that need a stronger brand, more trust and more partner requests.',
  'aud.t2':'FinTech and payment companies',
  'aud.d2':'Payment providers, card programmes, banking-as-a-service, financial services and infrastructure products.',
  'aud.t3':'Crypto and Web3',
  'aud.d3':'Exchanges, wallets, DeFi, tokens, infrastructure projects, blockchain services and Web3 startups.',
  'aud.t4':'Founders and experts',
  'aud.d4':'Entrepreneurs who need a personal brand, visible expertise and an audience that trusts them.',

  /* услуги */
  'srv.h2':'Our services','srv.more':'Read more<i></i>',
  'srv.s1':'Strategy','srv.s2':'LinkedIn','srv.s3':'PR &amp; media',
  'srv.s4':'AI SEO','srv.s5':'Course','srv.s6':'Localization',
  'srv.t1':'Strategy and full project management',
  'srv.d1':'We build the marketing strategy and take the project end to end: positioning, PR, content, LinkedIn, SEO, lead generation, analytics and reporting.',
  'srv.t2':'B2B marketing and LinkedIn growth',
  'srv.d2':'We help companies, founders and sales teams turn LinkedIn into a channel of trust, expertise, B2B conversations and leads.',
  'srv.t3':'PR, media and SERP',
  'srv.d3':'Articles, press releases, interviews and expert commentary in Tier-1 and Tier-2-3 media, and strengthen brand reputation in search results.',
  'srv.t4':'AI SEO and marketing automation',
  'srv.d4':'SEO structure, keyword strategy, content, analytics and automation of marketing processes.',
  'srv.t5':'B2B and B2C LinkedIn course',
  'srv.d5':'Educational products for companies, sales teams, founders, experts and entrepreneurs, including our LinkedIn course.',
  'srv.t6':'Translation &amp; Localization Services',
  'srv.d6':'We adapt websites, decks, articles, press releases, whitepapers, pitch decks and any documents for international markets.',

  /* клиенты */
  'cli.h2':'Trusted by projects in Crypto, FinTech, iGaming and Web3',
  'cli.sub':'International blockchain companies, crypto ecosystems, payment services, exchanges, iGaming projects and founders.',
  'cli.nda':'<span>NDA iGaming projects</span>',

  /* кейсы */
  'cs.h2':'Cases and results',
  'cs.sub':'Entering new markets, PR and media, brand packaging, LinkedIn, B2B growth, content and full-cycle marketing.',
  'cs.task':'Goal.','cs.did':'What we did.','cs.key':'Key results',
  'cs.m1':'Crypto exchange · market entry · 1 year',
  'cs.q1':'Strengthen Huobi Global’s presence on the Russian market and support the brand’s entry into a new region.',
  'cs.w1':'Launched an integrated campaign: paid social and search advertising, PR, work with media and influencers. Organised industry events and collaborations.',
  'cs.v1a':'14 <i>M</i>','cs.r1a':'advertising campaign reach',
  'cs.v1b':'6,000+','cs.r1b':'new clients',
  'cs.v1c':'100+','cs.r1c':'collaborations with media and influencers',
  'cs.v1d':'10+','cs.r1d':'industry events',

  'cs.m2':'Token · PR and trust · 6 months',
  'cs.q2':'Build trust in the token, introduce the project to potential investors and drive traffic to the official resources.',
  'cs.w2':'Prepared PR and media materials, grew the social channels and strengthened the project’s presence in specialist media.',
  'cs.v2a':'$1.5 <i>M</i>','cs.r2a':'raised in the token pre-sale',
  'cs.v2b':'45+','cs.r2b':'media publications',
  'cs.v2c':'3 <i>M</i>','cs.r2c':'advertising reach',
  'cs.v2d':'20,000+','cs.r2d':'social media followers',

  'cs.m3':'Brand packaging · digital and media · 1 year',
  'cs.q3':'Raise awareness of the project and trust in the brand, and strengthen its presence in digital channels and media.',
  'cs.w3':'Prepared the brand’s communication package, content and PR activity, and organised industry events.',
  'cs.v3a':'8,000+','cs.r3a':'audience growth',
  'cs.v3b':'1.2 <i>M</i>','cs.r3b':'total audience reach',
  'cs.v3c':'15+','cs.r3c':'publications and media mentions',
  'cs.v3d':'4','cs.r3d':'industry events for the brand',

  'cs.m4':'LinkedIn marketing · 6 months',
  'cs.q4':'Develop LinkedIn as a B2B promotion channel in iGaming and build communication with decision-makers.',
  'cs.w4':'Set up the company page and employee profiles, prepared content pillars, configured Sales Navigator and designed communication scenarios. Defined the ideal customer profile: the companies the product suits best, by sector, needs and decision-makers.',
  'cs.v4a':'120+','cs.r4a':'conversations with decision-makers',
  'cs.v4b':'900+','cs.r4b':'target contacts found',
  'cs.v4c':'38%','cs.r4c':'invitation acceptance rate',
  'cs.v4d':'2,400+','cs.r4d':'warm leads over the engagement',

  'cs.m5':'B2B lead generation · 1 year',
  'cs.q5':'Systematically find potential B2B clients and partners through LinkedIn with personalised, spam-free communication.',
  'cs.w5':'Defined the ideal customer profile (ICP), split the audience into four segments, prepared personalised message scenarios and set up regular work with contacts and campaign results.',
  'cs.v5a':'45+','cs.r5a':'warm leads per month',
  'cs.v5b':'19%','cs.r5b':'response rate',
  'cs.v5c':'4','cs.r5c':'target audience segments',
  'cs.v5d':'60','cs.r5d':'touches per day',

  /* основатель */
  'fnd.eyebrow':'Founder of VAK Marketing',
  'fnd.role':'Founder of VAK Marketing — crypto, fintech, iGaming, PR and B2B marketing',
  'fnd.p1':'Worked with Ethereum Foundation, Huobi Global, Tornado Cash and other international projects. 80+ personal publications and expert mentions in industry and business media, including Crypto.ru, ForkLog, Bits.media and Yahoo Finance.',
  'fnd.p2':'Today the agency focuses on helping iGaming, FinTech, Crypto, Web3 and B2B companies build systematic marketing and win better growth opportunities.',
  /* команда */
  'team.h2':'Our team',
  'team.sub':'The team brings together strategy, AI, content, localization, SEO and B2B marketing.',
  'team.r1':'Strategy Lead','team.d1':'Positioning, marketing structure and launch priorities.',
  'team.r2':'Chief AI Officer (CAIO)','team.d2':'AI tools for research, content and marketing operations.',
  'team.r3':'Head of Content and Communications','team.d3':'Editorial strategy, expert content and brand communications.',
  'team.r4':'VP of Localization','team.d4':'Adapting products and communications for local markets.',
  'team.r5':'Head of SEO','team.d5':'Search strategy, site architecture and organic traffic.',
  'team.r6':'LinkedIn/B2B Marketing','team.d6':'Profiles, outreach and dialogue with target B2B companies.',

  /* партнёры */
  'ptn.h2':'Partners and media network',
  'ptn.sub':'A wide network of media, platforms, marketing, technology and crypto/fintech partners.',

  /* форма */
  'cta.h2':'Get a free consultation',
  'cta.sub':'Tell us about your project and we will suggest the channels that fit you and where to start.',
  'form.name':'Name','form.email':'Email','form.contact':'Phone / messenger',
  'form.o1':'Full marketing strategy','form.o2':'B2B marketing and LinkedIn',
  'form.o3':'PR and media placements','form.o4':'SEO and SERP',
  'form.o5':'Marketing automation','form.o6':'Educational products / course',
  'form.o7':'Translation &amp; Localization','form.o8':'Not sure yet, I need advice',
  'form.send':'Send request',

  /* подвал */
  'foot.desc':'A full-cycle marketing agency for iGaming, FinTech, Crypto, Web3 and B2B. Strategy, brand, media, LinkedIn, B2B leads and marketing at scale.',
  'foot.c1':'Company','foot.c2':'Services','foot.c3':'Resources',
  'foot.about':'About','foot.team':'Team','foot.media':'Media',
  'foot.s1':'Strategy and full management','foot.s2':'B2B marketing and LinkedIn',
  'foot.s3':'PR and media','foot.s4':'SEO and SERP',
  'foot.s5':'Marketing automation','foot.s6':'Educational products',
  'foot.privacy':'Privacy policy','foot.rights':'All rights reserved'
};

var META = {
  ru: {
    title:'VAK Marketing — маркетинг, PR и B2B-продвижение для iGaming, FinTech, Crypto и Web3',
    desc:'VAK Marketing выстраивает маркетинговую систему для iGaming, FinTech, Crypto и Web3: позиционирование, PR, LinkedIn, SEO, контент, лидогенерация, медиа и автоматизация.'
  },
  en: {
    title:'VAK Marketing — marketing, PR and B2B growth for iGaming, FinTech, Crypto and Web3',
    desc:'VAK Marketing builds a complete marketing system for iGaming, FinTech, Crypto and Web3: positioning, PR, LinkedIn, SEO, content, lead generation, media and automation.'
  }
};

var nodes = [].slice.call(document.querySelectorAll('[data-i18n]'));
nodes.forEach(function (el) { el.__ru = el.innerHTML; });

window.__lang = 'ru';
window.__dict = null;

function apply(lang) {
  var en = lang === 'en';
  window.__lang = lang;
  window.__dict = en ? EN : null;

  nodes.forEach(function (el) {
    var k = el.getAttribute('data-i18n');
    var v = en ? EN[k] : el.__ru;
    if (v != null) el.innerHTML = v;
  });

  document.documentElement.lang = lang;
  document.title = META[lang].title;
  var m = document.querySelector('meta[name="description"]');
  if (m) m.setAttribute('content', META[lang].desc);

  [].slice.call(document.querySelectorAll('.lang__b')).forEach(function (b) {
    b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang));
  });

  document.querySelector('#rail') && document.querySelector('#rail')
    .setAttribute('aria-label', en ? 'Cases, scroll horizontally' : 'Кейсы, прокрутка по горизонтали');

  if (typeof window.__setSrv === 'function') window.__setSrv();
  if (typeof window.__ringSync === 'function') window.__ringSync();

  try { localStorage.setItem('vak-lang', lang); } catch (e) {}
}

[].slice.call(document.querySelectorAll('.lang__b')).forEach(function (b) {
  b.addEventListener('click', function () { apply(b.getAttribute('data-lang')); });
});

var saved = null;
try { saved = localStorage.getItem('vak-lang'); } catch (e) {}
if (!saved && !/^ru\b/i.test(navigator.language || '') && !/(ru|uk|be|kk)/i.test((navigator.languages || []).join(','))) {
  saved = 'en';
}
if (saved === 'en') apply('en');

})();
