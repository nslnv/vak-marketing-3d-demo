/* ========================================================================
   VAK Marketing — service page renderer

   Five pages use one technical shell, not one visual template. Their content
   is structured data so RU/EN, title, CTA context and semantic sections stay
   in sync. The DOM remains a collection of real section/article/list/table
   elements — the data layer only prevents five near-identical implementations
   from drifting apart over time.
   ======================================================================== */
(function () {
'use strict';

var key = document.body.getAttribute('data-service');
var $ = function (s, root) { return (root || document).querySelector(s); };
var $$ = function (s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); };
var esc = function (value) {
  return String(value == null ? '' : value).replace(/[&<>'"]/g, function (ch) {
    return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[ch];
  });
};
var two = function (ru, en) { return { ru: ru, en: en }; };
var items = function (ru, en) { return { ru: ru, en: en }; };

var LOGOS = {
  // Светлые прозрачные знаки для тёмного фона: без белых плашек и синих подложек.
  ethereum: { src:'/assets/img/brands/clients/ethereum-mark.png', alt:'Ethereum', mark:true },
  huobi:    { src:'/assets/img/brands/clients/huobi-mark.png', alt:'Huobi Global', mark:true },
  tornado:  { src:'/assets/img/brands/clients/tornado-cash.svg', alt:'Tornado Cash', mark:true },
  zenex:    { src:'/assets/img/brands/clients/zenex.svg', alt:'Zenex' },
  ghs:      { src:'/assets/img/brands/clients/1ghs-mark.png', alt:'1GHS', wide:true },
  coinstore:{ src:'/assets/img/brands/media/coinstore.png', alt:'Coinstore', mark:true },
  cointelegraph:{ src:'/assets/img/logos/cointelegraph.svg', alt:'Cointelegraph', wide:true },
  yahoo:    { src:'/assets/img/logos/partner/yahoo-finance.png', alt:'Yahoo Finance', wide:true },
  forklog:  { src:'/assets/img/logos/forklog-light.png', alt:'ForkLog', ink:true },
  bits:     { src:'/assets/img/logos/bitsmedia.png', alt:'Bits.media', wide:true },
  beincrypto:{ src:'/assets/img/logos/beincrypto-light.png', alt:'BeInCrypto', wide:true, ink:true },
  coindesk: { src:'/assets/img/logos/coindesk-light.png', alt:'CoinDesk', wide:true, ink:true },
  theblock: { src:'/assets/img/brands/media/the-block.png', alt:'The Block', mark:true },
  benzinga: { src:'/assets/img/logos/partner/benzinga.png', alt:'Benzinga', wide:true, ink:true },
  rbc:      { src:'/assets/img/brands/media/rbc-crypto.png', alt:'РБК Крипто', mark:true },
  cryptoru: { src:'/assets/img/brands/media/crypto-ru.png', alt:'Crypto.ru', mark:true }
};

var SERVICES = {
  strategy: {
    index:'01', art:'/assets/img/services/3d/strategy-object.jpg',
    ru:{
      meta:{ title:'Стратегия и комплексное ведение — VAK Marketing', desc:'Индивидуальная маркетинговая стратегия и комплексное ведение для проектов из iGaming, FinTech, Crypto, Web3 и B2B.' },
      crumb:'Маркетинговая система',
      hero:{ title:'Выстраиваем полноценную систему продвижения под задачи проекта', accent:'систему продвижения', lead:'От позиционирования и выбора каналов до привлечения клиентов, аналитики и комплексного сопровождения в одном контуре — без разрыва между планом и исполнением.', cta:'Получить консультацию' },
      proof:{ label:'Почему это работает', title:'Не набор услуг, а последовательность решений', note:'Сначала фиксируем, что действительно влияет на задачу бизнеса. Затем подключаем только те направления, у которых есть понятная роль.', items:[
        ['Контекст до каналов','Разбираем нишу, цели, конкурентов и ограничения, чтобы не начинать со случайного набора активностей.'],
        ['Инструменты по задаче','PR, LinkedIn, SEO, контент и реклама подключаются тогда, когда решают конкретную часть воронки.'],
        ['Проверка гипотез','Тестируем сообщения, форматы и каналы; оставляем в работе то, что даёт измеримый сигнал.'],
        ['Один рабочий контур','Координируем внешние направления и работаем вместе с in-house-командой, если она есть.']
      ]},
      scope:{ label:'Рабочая карта', title:'Как собираем результат', note:'На выходе вы получаете позиционирование, карту целевой аудитории, приоритетные каналы, контент- и PR-стратегию, план запуска, KPI и систему оценки, рекомендации по команде и ресурсам.', items:[
        {title:'Рынок и исходная позиция', question:'Где лежит реальный спрос и какие ограничения нельзя игнорировать?', output:'Карта сегментов, конкурентов и факторов, которые влияют на решение клиента.'},
        {title:'Цель и критерии', question:'Какой бизнес-результат должен подтвердить, что движение идёт в нужную сторону?', output:'Цели, рабочие гипотезы, ключевые метрики и ритм сверки.'},
        {title:'Позиционирование', question:'Что именно бренд должен доказать рынку — и чем это будет подкреплено?', output:'Опорные сообщения, аргументы и логика коммуникации.'},
        {title:'Каналы', question:'Где у проекта есть право на внимание, а где не стоит тратить ресурс?', output:'Приоритет каналов и понятная роль каждого направления.'},
        {title:'Первая волна работы', question:'Что запускать сначала, чтобы быстрее получить сигнал, а не распылить команду?', output:'Последовательность задач, владельцы и точки запуска.'},
        {title:'Проверка гипотез', question:'Какие сообщения, форматы и каналы стоит проверить в реальном контексте?', output:'Матрица проверок и критерии, по которым решения остаются или снимаются.'},
        {title:'Корректировка', question:'Что усиливать, менять или останавливать после первых данных?', output:'Обновлённый приоритет задач и распределение ресурса.'},
        {title:'Рабочий ритм', question:'Как команде видеть картину целиком, а не отдельные отчёты?', output:'Короткая регулярная сводка, решения и следующий шаг.'}
      ]},
      formats:{ label:'Форматы работы', title:'Выбираем глубину участия под задачу', note:'Никаких одинаковых пакетов: формат определяется тем, что уже есть в маркетинге и что нужно изменить.', items:[
        ['Стратегия как отдельный проект','Проводим исследование, определяем позиционирование, ключевые сообщения, каналы продвижения и формируем понятный план действий.'],
        ['Стратегия и сопровождение','Разрабатываем стратегию и помогаем последовательно внедрять её: контролируем реализацию, корректируем решения и отслеживаем результаты.'],
        ['Аудит и корректировка стратегии','Разбираем текущий маркетинг, находим слабые места и предлагаем конкретные изменения для повышения эффективности.'],
        ['Стратегия с последующим внедрением','Берём на себя не только разработку стратегии, но и её реализацию: контент, PR, каналы продвижения, аналитику и регулярное сопровождение.']
      ]},
      diagram:{ label:'Связи внутри работы', title:'Одна задача связывает все направления', note:'PR, контент, LinkedIn, SEO и привлечение работают в общем контексте — иначе системность остаётся только в презентации.', items:[
        ['Репутация','PR и профильные медиа'],['Диалоги','B2B-маркетинг и LinkedIn'],['Спрос','SEO и поисковая выдача'],['Содержание','Контент и SMM'],['Привлечение','Таргетированная и контекстная реклама'],['Скорость','Автоматизация маркетинговых процессов'],['Контроль','Аналитика и регулярная отчётность']
      ]},
      process:{ label:'Рабочий цикл', title:'Понять, запустить, скорректировать', items:[
        ['Погружение','Разбираем бизнес, аудиторию, цели и текущее состояние маркетинга.'],
        ['Стратегия','Формируем последовательность каналов, задач и метрик.'],
        ['Запуск','Собираем нужные направления в единый рабочий ритм.'],
        ['Тестирование','Проверяем гипотезы именно в контексте вашей ниши.'],
        ['Оптимизация','Усиливаем рабочее и останавливаем то, что не подтверждается данными.'],
        ['Масштабирование','Расширяем эффективные каналы и корректируем следующую итерацию.']
      ]},
      sectors:{ label:'Кому подходит', title:'Когда отдельной услуги уже недостаточно', note:'Подход нужен там, где маркетинг должен стать системой управления, а не набором разовых запусков.', items:[
        ['Полная система','Проектам, которым нужна связка стратегии, коммуникации и каналов, а не один исполнитель.'],
        ['После разрозненных тестов','Компаниям, которые пробовали отдельные каналы и не получили целостного результата.'],
        ['Рост без лишнего шума','Стартапам, которым важно быстро найти рабочие связки и не распылять ресурс.'],
        ['Сложные рынки','iGaming, FinTech, Crypto и B2B-проектам с высокой ценой неверного решения.']
      ]},
      outcomes:{ label:'На выходе', title:'Материалы, с которыми можно работать', note:'Не абстрактный документ, а набор решений, который помогает команде запускать и проверять работу.', items:[
        ['Позиционирование','Роль бренда, опорные сообщения и аргументы.'],['Карта целевой аудитории','Сегменты, роли и приоритетные сценарии.'],['Приоритетные каналы','Порядок подключений и роль каждого направления.'],['Контент- и PR-стратегия','Темы, форматы и логика внешней коммуникации.'],['План запуска','Последовательность задач и точки контроля.'],['KPI и система оценки','Метрики, по которым видно движение и качество работы.'],['Команда и ресурсы','Рекомендации по ролям, процессам и необходимому ресурсу.']
      ]},
      trust:{ title:'Проекты, с которыми работали', note:'Комплексное продвижение для проектов из crypto, fintech и iGaming.', logos:['ethereum','huobi','tornado','zenex','ghs'] },
      cta:{ title:'Обсудим, с чего начать', text:'Расскажите о бизнесе и цели. Предложим первую рабочую рамку: что исследовать, какие направления проверить и в какой последовательности двигаться.', button:'Отправить заявку', success:'Спасибо. Запрос принят — вернёмся с ответом.' }
    },
    en:{
      meta:{ title:'Strategy and full project management — VAK Marketing', desc:'A tailored marketing strategy and integrated delivery for iGaming, FinTech, Crypto, Web3 and B2B businesses.' },
      crumb:'Marketing system',
      hero:{ title:'A complete marketing system for your project', accent:'marketing system', lead:'From positioning and channel choice to client acquisition, analytics and integrated delivery — without a gap between the plan and its execution.', cta:'Book a consultation' },
      proof:{ label:'Why it works', title:'Not a menu of services, but a sequence of decisions', note:'We first establish what actually affects the business goal, then bring in only the disciplines with a clear role.', items:[
        ['Context before channels','We examine the market, goals, competitors and constraints before choosing activities.'],
        ['Tools for the task','PR, LinkedIn, SEO, content and advertising are used when they solve a defined part of the funnel.'],
        ['Hypotheses under review','Messages, formats and channels are tested; only work with a measurable signal remains.'],
        ['One operating loop','We coordinate external disciplines and work alongside an in-house team when one is in place.']
      ]},
      scope:{ label:'Operating map', title:'How we build a result', note:'You receive positioning, an audience map, priority channels, content and PR strategy, a launch plan, KPIs and evaluation system, plus recommendations on team and resources.', items:[
        {title:'Market and starting point', question:'Where is the real demand, and which constraints cannot be ignored?', output:'A map of segments, competitors and factors that influence the buyer’s decision.'},
        {title:'Objective and criteria', question:'Which business outcome will show that the work is moving in the right direction?', output:'Objectives, working hypotheses, key metrics and a review rhythm.'},
        {title:'Positioning', question:'What exactly must the brand prove to the market — and what will substantiate it?', output:'Core messages, evidence and a communication logic.'},
        {title:'Channels', question:'Where does the project have a right to attention, and where should resource not be spent?', output:'Channel priorities and a clear role for each workstream.'},
        {title:'First wave of work', question:'What should launch first to produce a signal rather than spread the team thin?', output:'Task sequence, owners and launch points.'},
        {title:'Hypothesis review', question:'Which messages, formats and channels should be checked in their real context?', output:'A validation matrix and criteria for keeping or stopping work.'},
        {title:'Adjustment', question:'What should be strengthened, changed or stopped after the first data?', output:'Updated priorities and resource allocation.'},
        {title:'Operating rhythm', question:'How does the team see one picture instead of isolated reports?', output:'A concise regular readout, decisions and the next move.'}
      ]},
      formats:{ label:'Ways of working', title:'The depth of engagement follows the task', note:'There are no generic packages: the format follows what already exists and what needs to change.', items:[
        ['Strategy as a standalone project','We research, define positioning, core messages and growth channels, then form a clear action plan.'],
        ['Strategy and support','We develop the strategy and help implement it step by step, reviewing delivery, correcting decisions and tracking outcomes.'],
        ['Strategy audit and correction','We review current marketing, find weak points and propose concrete changes to improve effectiveness.'],
        ['Strategy followed by implementation','We take on both the strategy and its delivery: content, PR, growth channels, analytics and ongoing support.']
      ]},
      diagram:{ label:'Connections in the work', title:'One objective connects every discipline', note:'PR, content, LinkedIn, SEO and acquisition work in one context — otherwise a “system” remains only a presentation claim.', items:[
        ['Reputation','PR and specialist media'],['Conversations','B2B marketing and LinkedIn'],['Demand','SEO and search visibility'],['Substance','Content and social'],['Acquisition','Targeted and search advertising'],['Velocity','Marketing process automation'],['Control','Analytics and regular reporting']
      ]},
      process:{ label:'Operating cycle', title:'Understand, launch, adjust', items:[
        ['Immersion','We examine the business, audience, goal and current marketing state.'],
        ['Strategy','We set the sequence of channels, tasks and metrics.'],
        ['Launch','We put the required workstreams into one operating rhythm.'],
        ['Testing','We validate hypotheses in the context of your market.'],
        ['Optimisation','We strengthen what works and stop what data does not support.'],
        ['Scaling','We extend effective channels and shape the next iteration.']
      ]},
      sectors:{ label:'A fit for', title:'When a single service is no longer enough', note:'This approach is for businesses that need marketing to become an operating system, not a series of isolated launches.', items:[
        ['A full system','Projects needing strategy, communications and channels to work as one.'],
        ['After disconnected tests','Companies that have tried individual channels without a coherent outcome.'],
        ['Focused growth','Startups that need to find working combinations without spreading resources thin.'],
        ['Complex markets','iGaming, FinTech, Crypto and B2B projects where a wrong decision is costly.']
      ]},
      outcomes:{ label:'At handover', title:'Materials a team can work with', note:'Not an abstract deck, but a set of decisions that lets the team launch and review the work.', items:[
        ['Positioning','The brand role, core messages and proof points.'],['Audience map','Segments, roles and priority scenarios.'],['Priority channels','The order of activation and role of each direction.'],['Content and PR strategy','Topics, formats and the logic of external communications.'],['Launch plan','Task sequence and review points.'],['KPIs and evaluation system','Metrics that make movement and quality visible.'],['Team and resources','Recommendations for roles, process and required resources.']
      ]},
      trust:{ title:'Projects we have worked with', note:'Integrated marketing work for projects in crypto, fintech and iGaming.', logos:['ethereum','huobi','tornado','zenex','ghs'] },
      cta:{ title:'Let’s define the first move', text:'Tell us about the business and the goal. We will outline a useful first frame: what to research, which directions to test and in what sequence.', button:'Send request', success:'Thank you. Your request has been received.' }
    }
  },
  linkedin: {
    index:'02', art:'/assets/img/services/3d/linkedin-object.jpg',
    ru:{
      meta:{ title:'B2B-маркетинг и LinkedIn — VAK Marketing', desc:'LinkedIn как канал доверия, B2B-диалогов и квалифицированных лидов для сложных ниш.' },
      crumb:'B2B-маркетинг',
      hero:{ title:'LinkedIn как канал лидов для B2B-бизнеса и компаний со сложными рекламными ограничениями', accent:'канал лидов', lead:'Выстраиваем прямой путь к нужным людям: страница компании, профили команды, ICP, контент и точечный outreach работают как один разговор с рынком.', cta:'Получить консультацию', facts:[{value:'ICP',label:'сегментация по рынкам, ролям и задачам'},{value:'B2B',label:'диалоги с людьми, которые принимают решения'}] },
      proof:{ label:'Почему LinkedIn', title:'Там, где нужен доступ, а не громкий охват', note:'LinkedIn становится полезным не сам по себе, а когда профиль, контент и outreach собраны в единую логику.', items:[
        ['Работа при ограничениях','Органические и платные инструменты помогают там, где обычная реклама в соцсетях или поиске ограничена.'],
        ['Прямой выход к decision-makers','Команда находит и начинает диалог с теми, кто влияет на партнёрства и закупки.'],
        ['Охват без шума','Страница, профили и регулярная активность формируют видимость без ставки на случайный вирусный эффект.'],
        ['Система вместо разовой кампании','Каждый контакт квалифицируется и передаётся в продажи по понятному правилу.']
      ]},
      scope:{ label:'Рабочая воронка', title:'Из страницы — в рабочий канал', note:'Собираем не поток шаблонных сообщений, а последовательность, в которой у каждого касания есть контекст и задача.', items:[
        ['Основа','Страница компании и профили команды.'],['ICP','Рынки, роли и задачи нужных компаний.'],['Контент','Рубрики и материалы, которые раскрывают экспертизу.'],['Видимость','Регулярные публикации и релевантная сеть контактов.'],['Диалог','Персональный outreach с конкретным поводом.'],['Лиды','Квалификация ответов и следующий шаг с sales-командой.']
      ]},
      diagram:{ label:'Рабочая связка', title:'От ICP до sales-команды', note:'Все четыре элемента должны быть согласованы; иначе даже хороший outreach выглядит как спам.', flow:'linkedin-route', layout:'linkedin', core:['Квалифицированный\nдиалог','к разговору, где есть следующий шаг'], items:[
        ['ICP','Рынки, роли и сигналы готовности'],['Профиль','Страница и люди, которым доверяют'],['Диалог','Контент и персональное первое касание'],['Передача','Квалификация и следующий шаг в sales']
      ]},
      process:{ label:'Как проходит работа', title:'Понятный путь к квалифицированному диалогу', items:[
        ['Подготовка',['Аудит','Анализ рынка','Анализ конкурентов','Разработка стратегии','Определение целевой аудитории']],
        ['Запуск',['Упаковка профиля','Оформление страницы','Разработка контента','Outreach','Запуск гипотез','Настройка коммуникации']],
        ['Оптимизация и поддержка',['Анализ ответов','Отчётность','Корректировка гипотез','Масштабирование','Поддержка коммуникации']]
      ]},
      sectors:{ label:'Кому особенно подходит', title:'Когда нужен прямой канал к рынку', note:'Особенно ценен для бизнесов, которым недостаточно массового охвата или закрыта часть рекламных площадок.', items:[
        ['FinTech и payments','Компании с регуляторными ограничениями и длинным циклом доверия.'],
        ['iGaming','Проекты, которым стандартные рекламные площадки не дают предсказуемого результата.'],
        ['Crypto и Web3','Команды, регулярно сталкивающиеся с ограничениями Meta и Google.'],
        ['B2B и фаундеры','Тем, кому нужен прямой разговор с партнёрами и клиентами, а не холодный массовый трафик.']
      ]},
      outcomes:{ label:'Результат работы', title:'Что появляется в системе', note:'Не обещаем одинаковую цифру всем. Настраиваем контур, по которому можно видеть качество охватов, диалогов и переданных лидов.', items:[
        ['Видимость','Рост охватов страницы компании и профилей команды.'],['Входящие диалоги','Регулярный поток релевантных ответов и обращений.'],['База контактов','Структурированная база лидов с понятной квалификацией.'],['Контроль','Прозрачные KPI и регулярная отчётность по активности.']
      ]},
      cta:{ title:'Проверим LinkedIn как канал для вашего бизнеса', text:'Расскажите о продукте, рынках и нужных типах контактов. Покажем, с чего начать без шаблонного outreach и лишних касаний.', button:'Отправить заявку', success:'Спасибо. Запрос принят — вернёмся с ответом.' }
    },
    en:{
      meta:{ title:'B2B marketing and LinkedIn — VAK Marketing', desc:'LinkedIn as a channel for trust, B2B conversations and qualified leads in complex markets.' },
      crumb:'B2B marketing',
      hero:{ title:'LinkedIn as a lead channel for B2B businesses with complex advertising restrictions', accent:'lead channel', lead:'We build a direct path to the right people: company page, team profiles, ICP, content and focused outreach become one market conversation.', cta:'Book a consultation', facts:[{value:'ICP',label:'segmentation by markets, roles and tasks'},{value:'B2B',label:'conversations with the people who decide'}] },
      proof:{ label:'Why LinkedIn', title:'When access matters more than noisy reach', note:'LinkedIn works when profile, content and outreach are put into one coherent logic.', items:[
        ['Work under restrictions','Organic and paid tools remain useful where standard social or search advertising is restricted.'],
        ['Direct access to decision-makers','The team finds and opens conversations with people who influence partnerships and procurement.'],
        ['Reach without noise','A company page, credible profiles and consistent activity create visibility without betting on random virality.'],
        ['A system, not a campaign','Every contact is qualified and passed to sales through a clear rule.']
      ]},
      scope:{ label:'Working funnel', title:'From a page to a working channel', note:'We build a sequence in which each touchpoint has context and a purpose, not a stream of stock messages.', items:[
        ['Foundation','The company page and team profiles.'],['ICP','Markets, roles and needs of the right companies.'],['Content','Content pillars and material that demonstrate expertise.'],['Visibility','Regular publishing and a relevant network.'],['Conversation','Personal outreach with a specific reason to connect.'],['Leads','Qualified replies and a clear next step with sales.']
      ]},
      diagram:{ label:'Operating chain', title:'From ICP to sales', note:'All four elements must agree. Without that, even good outreach reads as spam.', flow:'linkedin-route', layout:'linkedin', core:['Qualified\nconversation','a conversation with a clear next step'], items:[
        ['ICP','Markets, roles and readiness signals'],['Profile','A page and people worth trusting'],['Conversation','Content and a personal first touch'],['Handover','Qualification and the next step with sales']
      ]},
      process:{ label:'How we work', title:'A clear path to qualified conversations', items:[
        ['Preparation',['Audit','Market analysis','Competitor analysis','Strategy development','Target audience definition']],
        ['Launch',['Profile positioning','Company page setup','Content development','Outreach','Hypothesis testing','Communication setup']],
        ['Optimisation and support',['Reply analysis','Reporting','Hypothesis refinement','Scaling','Ongoing communication support']]
      ]},
      sectors:{ label:'Especially relevant for', title:'When a direct route to market is needed', note:'It is particularly useful where mass reach is insufficient or advertising inventory is constrained.', items:[
        ['FinTech and payments','Companies operating under regulatory constraints and long trust cycles.'],
        ['iGaming','Projects for which standard advertising platforms do not provide reliable results.'],
        ['Crypto and Web3','Teams regularly working through Meta and Google restrictions.'],
        ['B2B and founders','Those who need a direct conversation with partners and clients, not cold mass traffic.']
      ]},
      outcomes:{ label:'The working result', title:'What enters the system', note:'We do not promise one number for every business. We build a loop that makes reach, conversations and handed-over leads visible.', items:[
        ['Visibility','Growing reach for the company page and team profiles.'],['Inbound conversations','A regular flow of relevant replies and enquiries.'],['Contact base','A structured lead base with clear qualification.'],['Control','Transparent KPIs and regular activity reporting.']
      ]},
      cta:{ title:'Test LinkedIn as a channel for your business', text:'Tell us about the product, markets and contact types that matter. We will show a useful starting point without stock outreach or unnecessary touches.', button:'Send request', success:'Thank you. Your request has been received.' }
    }
  },
  pr: {
    index:'03', art:'/assets/img/services/3d/pr-object.jpg',
    ru:{
      meta:{ title:'PR, СМИ и медиа — VAK Marketing', desc:'Публикации, интервью и экспертные материалы в профильных международных и СНГ-медиа.' },
      crumb:'PR и медиасеть',
      hero:{ title:'Публикации и позиции в медиа, которые укрепляют доверие к бренду', accent:'доверие к бренду', lead:'Подбираем издания, собираем материал и ведём размещение от брифа до ссылки и отчёта. Для рынка, партнёров, инвесторов и поисковой выдачи.', cta:'Обсудить публикацию', facts:[{value:'Tier 1–3',label:'международные и СНГ-медиа'},{value:'PR',label:'материал, площадка и контекст в одной логике'}] },
      proof:{ label:'Зачем PR', title:'Публикация должна работать дольше дня выхода', note:'Сильное размещение фиксирует позицию бренда в нескольких контурах: доверие, поиск, аудитория и будущие переговоры.', items:[
        ['Репутация','Публикации в известных изданиях помогают подтвердить статус компании для партнёров, инвесторов и клиентов.'],
        ['Поисковое присутствие','Упоминания в авторитетных СМИ поддерживают видимость бренда в поисковой выдаче.'],
        ['Новая аудитория','Проект появляется в поле зрения профильного сообщества и людей за пределами текущей базы.'],
        ['Новый трафик','Публикации и обзорные позиции создают дополнительные точки входа к продукту.']
      ]},
      scope:{ label:'Форматы', title:'Материал под конкретный повод', note:'Не ставим пресс-релиз туда, где нужна колонка, и не делаем рейтинг ради строчки в списке. Формат следует задаче и площадке.', items:[
        'Пресс-релизы','Интервью с фаундерами и топ-менеджерами','Экспертные статьи и авторские колонки','Обзорные и аналитические материалы о проекте','Комментарии для журналистов и упоминания в готовых материалах','Рейтинги и позиции в обзорных материалах ТОП-5 и ТОП-10'
      ]},
      diagram:{ label:'Контур публикации', title:'Материал работает не сам по себе', note:'Пошаговая цепочка: информация становится доверием, а доверие — бизнес-результатом.', result:['Переходы','партнёрства','продажи'], items:[
        ['Повод','Новость, событие или причина для коммуникации.'],['Материал','Экспертный контент, который раскрывает тему.'],['Издание','Публикация в релевантном медиа или канале.'],['Отклик','Внимание, обсуждение и первые реакции аудитории.'],['Доверие','Накопленный авторитет и готовность к контакту.']
      ]},
      media:{ label:'Наша медиасеть', title:'Профильные и деловые издания', note:'Работаем с Tier-1, Tier-2 и Tier-3 медиа в международном и СНГ-контуре, включая crypto, fintech и бизнес-издания.', logos:['cointelegraph','yahoo','forklog','bits','beincrypto','coindesk','theblock','benzinga','rbc','cryptoru'], action:'Получить полный список доступных СМИ' },
      process:{ label:'Как проходит работа', title:'От повода к опубликованному материалу', items:[
        ['Бриф','Фиксируем цель: репутация, SEO, событие, запуск или экспертная позиция.'],
        ['Подбор изданий','Предлагаем релевантные медиа под нишу, географию и бюджет.'],
        ['Подготовка','Пишем или адаптируем пресс-релиз, интервью либо статью.'],
        ['Согласование','Вы утверждаете финальный текст и позицию бренда.'],
        ['Размещение','Публикуем материал и передаём ссылки.'],
        ['Отчёт','Собираем охваты и ссылки для вашей PR-базы.']
      ]},
      sectors:{ label:'Кому PR особенно нужен', title:'Когда рынку важны внешние сигналы доверия', note:'PR не заменяет продукт и продажи. Он делает ваш контекст понятнее там, где решение принимается не за один день.', items:[
        ['iGaming','Перед выходом на новый рынок или важным коммерческим этапом.',['Работа с репутацией','Экспертные комментарии','Отраслевые медиа','Поддержка выхода на рынок']],
        ['FinTech и payments','Когда репутация имеет вес в разговоре с партнёрами и регуляторами.',['Доверие к продукту','Безопасность и compliance','B2B-коммуникация','Экспертные публикации']],
        ['Crypto и Web3','Перед листингом, pre-sale, запуском или важной коммуникационной точкой.',['Объяснение сложного продукта','Формирование доверия','Работа с комьюнити','Международные медиа']],
        ['Фаундеры и эксперты','Когда личная экспертность должна поддержать репутацию компании.',['Личный бренд','Интервью','Экспертные колонки','Публичная экспертность']]
      ]},
      trust:{ title:'Проекты, с которыми работали', note:'Публикации помогли усилить репутационный контур проектов из сложных цифровых отраслей.', logos:['ethereum','huobi','tornado','coinstore','zenex'] },
      cta:{ title:'Подберём медиа под вашу задачу', text:'Опишите повод, рынок и желаемый результат. Мы предложим формат, пул изданий и реалистичный маршрут размещения.', button:'Отправить заявку', success:'Спасибо. Запрос принят — вернёмся с ответом.' }
    },
    en:{
      meta:{ title:'PR, media and publications — VAK Marketing', desc:'Press releases, interviews and expert materials for specialist international and CIS media.' },
      crumb:'PR and media network',
      hero:{ title:'Media placements and rankings that strengthen brand trust', accent:'brand trust', lead:'We select the outlets, shape the material and manage publication from brief to live link and report — for the market, partners, investors and search visibility.', cta:'Discuss a publication', facts:[{value:'Tier 1–3',label:'international and CIS media'},{value:'PR',label:'material, outlet and context in one logic'}] },
      proof:{ label:'Why PR', title:'A publication should work beyond its launch day', note:'A strong placement fixes the brand position across several contexts: trust, search, audience and future conversations.', items:[
        ['Reputation','Known outlets help validate company status for partners, investors and clients.'],
        ['Search presence','Authoritative mentions support brand visibility in search results.'],
        ['A new audience','The project enters the field of view of specialist communities and people beyond its existing base.'],
        ['New entry points','Publications and review positions create additional paths to the product.']
      ]},
      scope:{ label:'Formats', title:'Material for a specific occasion', note:'We do not put a press release where a column is needed or produce a ranking for a line in a list. Format follows the task and the outlet.', items:[
        'Press releases','Founder and executive interviews','Expert articles and authored columns','Project overview and analytical pieces','Comments for journalists and mentions in ready-made materials','TOP-5 and TOP-10 positions in review content'
      ]},
      diagram:{ label:'Publication system', title:'A piece does not work in isolation', note:'A step-by-step chain: information becomes trust, and trust becomes a business result.', result:['Traffic','partnerships','sales'], items:[
        ['Occasion','News, an event or a reason to communicate.'],['Material','Expert content that opens up the topic.'],['Outlet','Publication in a relevant medium or channel.'],['Response','Attention, discussion and the first audience reactions.'],['Trust','Accumulated authority and readiness to engage.']
      ]},
      media:{ label:'Our media network', title:'Specialist and business outlets', note:'We work with Tier-1, Tier-2 and Tier-3 outlets in international and CIS markets, including crypto, fintech and business media.', logos:['cointelegraph','yahoo','forklog','bits','beincrypto','coindesk','theblock','benzinga','rbc','cryptoru'], action:'Request the full list of available media' },
      process:{ label:'How we work', title:'From an occasion to a published piece', items:[
        ['Brief','We define the objective: reputation, SEO, an event, a launch or an expert position.'],
        ['Outlet selection','We propose relevant media for the niche, geography and budget.'],
        ['Preparation','We write or adapt a press release, interview or article.'],
        ['Approval','You approve the final text and brand position.'],
        ['Placement','We publish the material and deliver the links.'],
        ['Report','We collect coverage and links for your PR base.']
      ]},
      sectors:{ label:'Especially relevant for', title:'When the market needs external signals of trust', note:'PR does not replace product or sales. It clarifies the brand context where decisions are not made in one day.', items:[
        ['iGaming','Before entering a market or an important commercial phase.',['Reputation work','Expert commentary','Sector media','Market-entry support']],
        ['FinTech and payments','Where reputation matters in conversations with partners and regulators.',['Product trust','Security and compliance','B2B communications','Expert publications']],
        ['Crypto and Web3','Before a listing, pre-sale, launch or significant communications moment.',['Explaining a complex product','Building trust','Community work','International media']],
        ['Founders and experts','When personal expertise must support company reputation.',['Personal brand','Interviews','Expert columns','Public expertise']]
      ]},
      trust:{ title:'Projects we have worked with', note:'Publications helped strengthen the reputational context of projects in complex digital sectors.', logos:['ethereum','huobi','tornado','coinstore','zenex'] },
      cta:{ title:'Let’s select media for the task', text:'Tell us about the occasion, market and desired outcome. We will suggest a format, outlet pool and realistic placement route.', button:'Send request', success:'Thank you. Your request has been received.' }
    }
  },
  seo: {
    index:'04', art:'/assets/img/services/3d/seo-object.jpg',
    ru:{
      meta:{ title:'AI SEO и SERP — VAK Marketing', desc:'SEO-стратегия, техническая оптимизация, контент и аналитика для конкурентных ниш и разных гео.' },
      crumb:'AI SEO и SERP',
      hero:{ title:'SEO для конкурентных ниш, где важно понимать рынок, а не просто собирать ключи', accent:'понимать рынок', lead:'Соединяем семантику, структуру сайта, техническую работу, контент и внешние факторы. AI-инструменты помогают быстрее анализировать материал и находить точки роста, но не заменяют стратегию.', cta:'Получить консультацию', facts:[{value:'SEO',label:'структура, контент и внешние сигналы в одной системе'},{value:'GEO',label:'работа с локальной спецификой поиска'}] },
      proof:{ label:'Подход', title:'Семантика под реальный спрос, а не список ключей', note:'Строим конкурентную семантику по намерениям, воронке и коммерческой ценности — в том числе для кластеров, где стандартных SEO-подходов недостаточно.', items:[
        ['Анализ быстрее','AI-инструменты сокращают разбор семантики, конкурентов и выдачи. Больше времени остаётся на решения.'],
        ['Отраслевая специфика','В FinTech, iGaming и Crypto учитываем ограничения площадок, регуляторику и плотную конкуренцию.'],
        ['Коммерческие кластеры','Отдельно прорабатываем запросы, которые ближе всего к заявке или покупке.'],
        ['Локальная выдача','Для каждого рынка проверяем, как ищут и что показывает поиск, и адаптируем страницы.']
      ]},
      scope:{ label:'Что входит в работу', title:'SEO как последовательная инженерная работа', note:'Каждая часть влияет на следующую: невозможно оценивать контент отдельно от структуры или ссылки отдельно от целевой страницы.', phases:[
        ['Диагностика и аудит',['Аудит текущих позиций и конкурентного поля','Технический SEO-аудит','Анализ структуры сайта под поисковые запросы']],
        ['Семантическое ядро и архитектура сайта',['Сбор и кластеризация семантического ядра','Оптимизация структуры сайта под поисковые запросы','Контент-стратегия под ключевые кластеры']],
        ['Реализация',['Технические исправления','Страницы и контент под ключевые кластеры','Линкбилдинг и работа с внешними факторами']],
        ['Поддержка, оптимизация и контроль',['Мониторинг позиций и аналитика динамики','Репутация бренда в поисковой выдаче — SERP','Корректировка приоритетов по данным']]
      ]},
      diagram:{ label:'Контур работы', title:'Поиск видит не один элемент', note:'Структура, материал и внешние сигналы должны поддерживать одну коммерческую задачу.', items:[
        ['Семантика','Что и как ищет рынок'],['Структура','Куда ведёт поисковый запрос'],['Контент','Чем страница отвечает на намерение'],['Коммерческая видимость','Ответ на реальный спрос и заметный бренд в выдаче']
      ]},
      sectors:{ label:'Для каких ниш', title:'Где особенно важна предметная специфика', note:'Методология общая, но исходные ограничения, язык рынка и коммерческая логика каждой вертикали отличаются.', items:[
        ['FinTech и payments','Высокая конкуренция, регуляторный контекст и длинная воронка доверия.'],
        ['iGaming','Операторы, платформы и партнёрские сервисы в плотной конкурентной выдаче.'],
        ['Crypto и Web3','Биржи, кошельки, токены и блокчейн-сервисы с быстро меняющимся спросом.'],
        ['B2B и SaaS','Коммерческие и экспертные запросы, где органика должна вести к понятному действию.']
      ]},
      outcomes:{ label:'Результат работы', title:'Что можно наблюдать и улучшать', note:'Срок и темп зависят от сайта, рынка и конкуренции. Мы делаем динамику видимой и объяснимой, а не обещаем одинаковую цифру всем.', items:[
        ['Приоритеты','Понятный порядок работ по страницам, кластерам и техническим задачам.'],['Структура','Сайт, в котором поисковику и пользователю проще находить нужное.'],['Динамика','Регулярное наблюдение за позициями и поисковым спросом.'],['Контроль','Отчётность с решениями, а не только с таблицей позиций.']
      ]},
      trust:{ title:'Проекты, с которыми работали', note:'Продвижение и поисковая работа для проектов из crypto, fintech и iGaming.', logos:['ethereum','huobi','zenex','ghs'] },
      cta:{ title:'Разберём сайт и конкурентное поле', text:'Расскажите о продукте, географии и текущем сайте. Покажем, какие вопросы стоит проверить в первую очередь и где искать реальный запас роста.', button:'Отправить заявку', success:'Спасибо. Запрос принят — вернёмся с ответом.' }
    },
    en:{
      meta:{ title:'AI SEO and SERP — VAK Marketing', desc:'SEO strategy, technical optimisation, content and analytics for competitive niches and different markets.' },
      crumb:'AI SEO and SERP',
      hero:{ title:'SEO for competitive sectors where market understanding matters more than a keyword list', accent:'market understanding', lead:'We connect semantics, site structure, technical work, content and external factors. AI tools help us analyse material and find growth points faster; they do not replace strategy.', cta:'Book a consultation', facts:[{value:'SEO',label:'structure, content and external signals in one system'},{value:'GEO',label:'work with local search behaviour'}] },
      proof:{ label:'The approach', title:'Semantics built on real demand, not a keyword list', note:'We build competitive semantics around intent, funnel stage and commercial value — including clusters where standard SEO approaches are not enough.', items:[
        ['Faster analysis','AI tools shorten the work on semantics, competitors and search results, leaving more time for decisions.'],
        ['Sector specifics','In FinTech, iGaming and Crypto we account for platform restrictions, regulation and dense competition.'],
        ['Commercial clusters','We treat separately the queries closest to an enquiry or a purchase.'],
        ['Local search','For each market we check how people search and what results appear, then adapt the pages.']
      ]},
      scope:{ label:'What is included', title:'SEO as sequential engineering work', note:'Each part affects the next: content cannot be assessed apart from structure, nor links apart from their target pages.', phases:[
        ['Diagnostics and audit',['Audit of current positions and competitor landscape','Technical SEO audit','Site structure analysis against search demand']],
        ['Semantic core and site architecture',['Keyword research and semantic clustering','Site structure optimisation for search intent','Content strategy for priority clusters']],
        ['Implementation',['Technical fixes','Pages and content for priority clusters','Link building and external factors']],
        ['Support, optimisation and control',['Position monitoring and trend analysis','Brand reputation in search results — SERP','Priority adjustments based on data']]
      ]},
      diagram:{ label:'Working loop', title:'Search does not see one element', note:'Structure, material and external signals must support the same commercial task.', items:[
        ['Semantics','What the market searches and how'],['Structure','Where the query is taken'],['Content','How the page answers intent'],['Commercial visibility','An answer to real demand and a visible brand in results']
      ]},
      sectors:{ label:'Relevant for', title:'Where subject knowledge matters most', note:'The method is shared; the constraints, market language and commercial logic of each vertical are not.', items:[
        ['FinTech and payments','High competition, regulatory context and a long trust funnel.'],
        ['iGaming','Operators, platforms and partner services in dense search competition.'],
        ['Crypto and Web3','Exchanges, wallets, tokens and blockchain services with fast-moving demand.'],
        ['B2B and SaaS','Commercial and expert queries where organic traffic must lead to a clear next action.']
      ]},
      outcomes:{ label:'The working result', title:'What becomes observable and improvable', note:'Timing and pace depend on the site, market and competition. We make change visible and explainable rather than promise one number to everyone.', items:[
        ['Priorities','A clear work order for pages, clusters and technical tasks.'],['Structure','A site that is easier for both search engines and people to navigate.'],['Movement','Regular observation of positions and search demand.'],['Control','Reporting with decisions, not just a rankings table.']
      ]},
      trust:{ title:'Projects we have worked with', note:'Promotion and search work for projects in crypto, fintech and iGaming.', logos:['ethereum','huobi','zenex','ghs'] },
      cta:{ title:'Let’s review the site and competitive field', text:'Tell us about the product, geography and current site. We will outline which questions to test first and where a real reserve for growth may sit.', button:'Send request', success:'Thank you. Your request has been received.' }
    }
  },
  localization: {
    index:'06', art:'/assets/img/services/3d/localization-object.jpg',
    ru:{
      meta:{ title:'Перевод и локализация — VAK Marketing', desc:'Перевод и локализация для международных проектов: контент, продукт, коммуникации и документы с сохранением смысла и тональности.' },
      crumb:'Translation & Localization',
      hero:{ title:'Переводим не слова, а смысл бизнеса', accent:'смысл бизнеса', lead:'Адаптируем материалы под язык, рынок и ожидания аудитории, сохраняя точность, тональность и экспертность бренда. Работаем с образовательными и юридическими международными организациями, понимаем терминологию и контекст продукта с учётом особенностей вашей отрасли.', cta:'Заказать перевод', facts:[{value:'50 000+',label:'выполненных заказов'},{value:'10+',label:'языковых комбинаций'}] },
      proof:{ label:'Почему выбирают нас', title:'Точность там, где цена ошибки высока', note:'Смысл материала, тональность бренда и отраслевые термины должны оставаться целыми и в новом языке.', items:[
        ['Сложные отрасли','8+ лет работы с текстами, где стандартного языкового знания недостаточно для точного результата.'],
        ['Индивидуальный подход','Гибкие условия сотрудничества и специальные предложения для постоянных клиентов.'],
        ['Срочные задачи','Берём срочные заказы от двух часов, если объём и язык позволяют выдержать контроль качества.'],
        ['Профильный контекст','Право, образование, финансы и IT переводим с пониманием предмета, а не буквальной подстановкой.']
      ]},
      scope:{ label:'Материалы и документы', title:'Что можно передать в работу', note:'Подготовим материал для международного рынка, внутреннего оборота или конкретного продукта — с нужным форматом на выходе.', items:[
        'Сайты и лендинги','Презентации, pitch decks и whitepapers','Статьи, пресс-релизы и PR-материалы','Юридические и нотариальные документы','Договоры и корпоративная документация','Дипломы, аттестаты, транскрипты и сертификаты','Приложения и продуктовые интерфейсы — UI/UX-локализация','Маркетинговые и рекламные материалы'
      ]},
      diagram:{ label:'Контур локализации', title:'Смысл должен выдержать новый рынок', note:'Исходный текст, терминология, перевод и проверка работают как единая передача смысла.', items:[
        ['Исходный материал','Задача материала, аудитория и исходный формат'],['Перевод','Язык, который сохраняет смысл, а не кальку'],['Адаптация под рынок','Подстройка под особенности целевого рынка'],['Сохранение смысла и тональности','Голос бренда, интонация и акценты'],['Готовый материал для аудитории','Понятный, точный и готовый к работе текст']
      ]},
      sectors:{ label:'Ниши и направления', title:'Материалы, которые адаптируем под рынок', note:'До начала работы сверяем задачу, исходный контекст и требования к стилю. Это важнее любого шаблонного глоссария.', groups:[
        ['Контент',['Статьи','Лендинги','Презентации','PR-материалы','Медиа-тексты','Пресс-релизы','Интервью']],
        ['Продукт',['Локализация интерфейса','FAQ','Документация','Инструкции','Продуктовые материалы']],
        ['Коммуникации',['Рекламные сообщения','Материалы для партнёров','Коммерческие предложения','Презентационные материалы']],
        ['Документы для малого бизнеса и частных клиентов',['Дипломы','Аттестаты','Медицинские справки','Банковские выписки','Инвойсы','Согласия','Договоры','Юридические документы']]
      ]},
      pricing:{ label:'Языки и стоимость', title:'Прозрачная логика расчёта', note:'Более 10 языковых комбинаций. Перед стартом подтверждаем объём, формат, направление и срок — без скрытых наценок.', rows:[['ENG-RU-ENG','от 7 USD / страница'],['CN-RU-CN','от 8 USD / страница'],['Другие языковые комбинации','от 9 USD / страница']], notes:['Одна страница бесплатно для новых клиентов при заказе от 10 страниц.','Скидка 15% для постоянных клиентов с пятого заказа.'] },
      process:{ label:'Как работаем', title:'От документа к готовому материалу', items:[
        ['Заявка','Вы присылаете документ или короткий бриф на перевод.'],
        ['Оценка','Рассчитываем срок, стоимость и удобный формат сдачи.'],
        ['Перевод','Материал берёт специалист с профильной экспертизой в нужной нише.'],
        ['Проверка','Проводим вычитку и контроль терминологии.'],
        ['Сдача','Передаём готовый материал в нужном формате; срочные заказы обсуждаем отдельно.']
      ]},
      trust:{ title:'Проекты и отрасли, с которыми работали', note:'Международные технологические, образовательные, gaming- и IT-проекты.', logos:['ethereum','huobi','tornado','coinstore','zenex','ghs'] },
      cta:{ title:'Рассчитаем перевод под ваш материал', text:'Пришлите документ или опишите задачу. Подберём специалиста с нужной экспертизой и уточним срок, формат и стоимость.', button:'Отправить заявку', success:'Спасибо. Запрос принят — вернёмся с ответом.' }
    },
    en:{
      meta:{ title:'Translation and localisation — VAK Marketing', desc:'Translation and localisation for international projects: content, product, communications and documents, with meaning and tone preserved.' },
      crumb:'Translation and localisation',
      hero:{ title:'We translate business meaning, not just words', accent:'business meaning', lead:'We adapt materials to the language, market and audience expectations while keeping the brand’s accuracy, tone and expertise. We work with international education and legal organisations and understand product terminology and context in your sector.', cta:'Request a translation', facts:[{value:'50,000+',label:'completed orders'},{value:'10+',label:'language combinations'}] },
      proof:{ label:'Why clients choose us', title:'Accuracy where the cost of error is high', note:'The material’s meaning, brand voice and specialist terms must remain intact in the new language.', items:[
        ['Complex sectors','8+ years working with texts where language knowledge alone is not enough for an accurate outcome.'],
        ['Individual approach','Flexible working terms and special offers for ongoing clients.'],
        ['Urgent tasks','We accept urgent orders from two hours when volume and language allow a quality-control pass.'],
        ['Subject context','Law, education, finance and IT are translated with subject knowledge, not literal substitution.']
      ]},
      scope:{ label:'Materials and documents', title:'What you can send to us', note:'We prepare material for an international market, internal use or a specific product, in the format needed at handover.', items:[
        'Websites and landing pages','Presentations, pitch decks and white papers','Articles, press releases and PR material','Legal and notarial documents','Contracts and corporate documentation','Diplomas, transcripts, certificates and educational documents','Applications and product interfaces — UI/UX localisation','Marketing and advertising materials'
      ]},
      diagram:{ label:'Localisation system', title:'Meaning must survive a new market', note:'Source text, terminology, translation and review work as one transfer of meaning.', items:[
        ['Source material','Its purpose, audience and source format'],['Translation','Language that carries meaning, not a calque'],['Market adaptation','Fitted to the specifics of the target market'],['Meaning and tone preserved','Brand voice, tone and emphasis'],['Ready material for the audience','Clear, accurate text ready for use']
      ]},
      sectors:{ label:'Materials and directions', title:'Materials we adapt for a market', note:'Before work begins, we confirm the task, source context and style requirements. That matters more than a generic glossary.', groups:[
        ['Content',['Articles','Landing pages','Presentations','PR material','Media copy','Press releases','Interviews']],
        ['Product',['Interface localisation','FAQs','Documentation','Instructions','Product materials']],
        ['Communications',['Advertising messages','Partner materials','Commercial proposals','Presentation materials']],
        ['Documents for SMBs and private clients',['Diplomas','School certificates','Medical letters','Bank statements','Invoices','Consents','Contracts','Legal documents']]
      ]},
      pricing:{ label:'Languages and pricing', title:'A transparent calculation', note:'More than ten language combinations. Before starting, we confirm volume, format, direction and timing with no hidden markup.', rows:[['ENG-RU-ENG','from USD 7 / page'],['CN-RU-CN','from USD 8 / page'],['Other language combinations','from USD 9 / page']], notes:['One page free for new clients on orders of ten pages or more.','15% discount for returning clients from the fifth order.'] },
      process:{ label:'How we work', title:'From document to a finished material', items:[
        ['Request','You send the document or a short translation brief.'],
        ['Estimate','We calculate timing, cost and handover format.'],
        ['Translation','The material is handled by a specialist with the relevant sector experience.'],
        ['Review','We edit and check terminology.'],
        ['Handover','We deliver the finished material in the required format; urgent orders are scoped separately.']
      ]},
      trust:{ title:'Projects and sectors we have worked with', note:'International technology, education, gaming and IT projects.', logos:['ethereum','huobi','tornado','coinstore','zenex','ghs'] },
      cta:{ title:'Let’s estimate the translation for your material', text:'Send the document or describe the task. We will match the right specialist and confirm timing, format and cost.', button:'Send request', success:'Thank you. Your request has been received.' }
    }
  }
};

/* ---------- Content rendering ----------------------------------------- */
var service = SERVICES[key];
if (!service) return;

var isStrategy = key === 'strategy';
var language = 'ru';
try { language = localStorage.getItem('vak-lang') === 'en' ? 'en' : 'ru'; } catch (e) {}
var copy = function () { return service[language]; };
var currentNavScrollHandler = null;
var currentNavKeyHandler = null;
var currentNavPointerHandler = null;
var currentNavResizeHandler = null;
var currentRevealObserver = null;
var currentDiagramObserver = null;
var currentStrategyResizeHandler = null;
var currentServiceFlowObserver = null;
var currentStrategyFlowObserver = null;
var currentStrategyFlowFrame = null;
var currentServiceFlowResizeHandler = null;
var currentServiceFlowFrame = null;
var currentServiceFlowTimers = [];
var toastTimer = null;

function toast(message) {
  var el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.classList.remove('is-on'); }, 2600);
}
document.addEventListener('click', function (event) {
  var link = event.target.closest('[data-soon]');
  if (!link) return;
  event.preventDefault();
  toast(language === 'en' ? 'This section is coming soon' : 'Раздел скоро появится');
});

function linkArrow(label, href, extra) {
  return '<a class="' + (extra || 'link-arrow') + '" href="' + esc(href) + '">' + esc(label) + '<i></i></a>';
}
// The title stays white; only its key phrase carries the service gradient,
// as on the strategy page. Short prepositions and conjunctions are bound to
// the next word so a line never ends on "к", "в" or "а".
function bindShortWords(html) {
  return html.replace(/(^|[\s(])([A-Za-zА-Яа-яЁё]{1,2}) /g, '$1$2&nbsp;');
}
function renderHeroTitle(hero) {
  var title = esc(hero.title);
  var accent = hero.accent ? esc(hero.accent) : '';
  if (!accent || title.indexOf(accent) < 0) return bindShortWords(title);
  var parts = title.split(accent);
  return bindShortWords(parts[0]) + '<span class="sp-title__accent">' + bindShortWords(accent) + '</span>' + bindShortWords(parts.slice(1).join(accent));
}
function strategyProofTitle() {
  return language === 'en'
    ? '<span class="sp-decision-frame__line">Not a menu of services,</span><span class="sp-decision-frame__line">but a <span class="sp-decision-frame__accent">sequence of decisions</span></span>'
    : '<span class="sp-decision-frame__line">Не набор услуг, а</span><span class="sp-decision-frame__line"><span class="sp-decision-frame__accent">последовательность решений</span></span>';
}
function strategyFlow() {
  return '<svg class="sp-strategy-system__links" viewBox="0 0 1200 540" preserveAspectRatio="none" aria-hidden="true" focusable="false">'
    + '<defs><linearGradient id="sp-flow-lilac" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#7C5CFF" stop-opacity=".2"/><stop offset="58%" stop-color="#9B84FF" stop-opacity=".76"/><stop offset="100%" stop-color="#FF52B8" stop-opacity=".48"/></linearGradient><linearGradient id="sp-flow-cyan" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#62E4FF" stop-opacity=".18"/><stop offset="56%" stop-color="#62E4FF" stop-opacity=".72"/><stop offset="100%" stop-color="#9B84FF" stop-opacity=".48"/></linearGradient><linearGradient id="sp-flow-rose" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FF52B8" stop-opacity=".18"/><stop offset="57%" stop-color="#FF52B8" stop-opacity=".7"/><stop offset="100%" stop-color="#7C5CFF" stop-opacity=".46"/></linearGradient></defs>'
    + '<path class="sp-flow" pathLength="100" style="--sp-link-delay:.1s" stroke="url(#sp-flow-cyan)" d="M514 226 C474 205 456 182 406 176 C356 170 350 116 300 110 C266 106 244 130 214 119"/>'
    + '<path class="sp-flow" pathLength="100" style="--sp-link-delay:.15s" stroke="url(#sp-flow-lilac)" d="M600 218 C621 198 612 181 592 170 C572 159 594 143 600 115"/>'
    + '<path class="sp-flow" pathLength="100" style="--sp-link-delay:.2s" stroke="url(#sp-flow-rose)" d="M686 226 C733 205 749 182 795 177 C842 172 850 120 899 114 C932 110 951 132 981 120"/>'
    + '<path class="sp-flow" pathLength="100" style="--sp-link-delay:.25s" stroke="url(#sp-flow-lilac)" d="M514 315 C469 334 451 358 402 362 C352 366 358 403 304 405 C254 407 252 433 204 428 C171 424 160 424 130 430"/>'
    + '<path class="sp-flow" pathLength="100" style="--sp-link-delay:.3s" stroke="url(#sp-flow-cyan)" d="M560 320 C536 342 552 359 526 371 C500 383 508 401 476 414 C457 421 448 429 435 435"/>'
    + '<path class="sp-flow" pathLength="100" style="--sp-link-delay:.35s" stroke="url(#sp-flow-rose)" d="M640 320 C667 342 645 357 675 373 C705 389 689 405 724 417 C740 423 750 429 763 435"/>'
    + '<path class="sp-flow" pathLength="100" style="--sp-link-delay:.4s" stroke="url(#sp-flow-lilac)" d="M686 315 C729 332 745 356 794 361 C843 366 842 402 895 406 C947 410 950 434 997 428 C1031 423 1046 424 1070 430"/>'
    + '</svg>';
}
var SERVICE_DIAGRAM_FLOWS = {
  'linkedin-route': true,
  'localization-relay': true
};
var SERVICE_DIAGRAM_LAYOUTS = { linkedin:true, localization:true };
var SERVICE_FLOW_GRAPHS = {
  'linkedin-route': { edges:[
    { from:'n0', to:'n1', out:'br', into:'bl', tone:'cyan', opacity:.52 },
    { from:'n1', to:'n2', out:'bc', into:'tr', tone:'lilac', bend:'left', opacity:.58 },
    { from:'n2', to:'n3', out:'rc', into:'lc', tone:'rose', opacity:.54 },
    { from:'n3', to:'core', out:'tr', into:'bl', tone:'lilac', opacity:.74, primary:true }
  ] },
  'localization-relay': { edges:[
    { from:'n0', to:'n1', out:'bc', into:'tc', tone:'cyan', opacity:.5 },
    { from:'n1', to:'n2', out:'rc', into:'lc', tone:'lilac', opacity:.54 },
    { from:'n2', to:'n3', out:'tr', into:'bl', tone:'rose', opacity:.58 },
    { from:'n3', to:'n4', out:'bc', into:'tc', tone:'cyan', opacity:.54 },
    { from:'n4', to:'core', out:'rc', into:'lc', tone:'lilac', opacity:.74, primary:true }
  ] }
};
var SERVICE_FLOW_PORTS = {
  tl:{ x:0, y:0, nx:-.707, ny:-.707 }, tc:{ x:.5, y:0, nx:0, ny:-1 }, tr:{ x:1, y:0, nx:.707, ny:-.707 },
  lc:{ x:0, y:.5, nx:-1, ny:0 }, rc:{ x:1, y:.5, nx:1, ny:0 },
  bl:{ x:0, y:1, nx:-.707, ny:.707 }, bc:{ x:.5, y:1, nx:0, ny:1 }, br:{ x:1, y:1, nx:.707, ny:.707 }
};
function supportedDiagram(value, allowed, fallback) {
  return allowed[value] ? value : fallback;
}
function serviceFlow(flow) {
  var variants = {
    'linkedin-route':[
      ['cyan','M290 145 C350 196 145 280 290 350'],
      ['lilac','M315 390 C385 338 428 194 550 148'],
      ['rose','M620 150 C694 214 544 294 620 350'],
      ['lilac','M690 388 C774 356 808 268 885 252']
    ],
    'localization-relay':[
      ['cyan','M320 250 C392 187 466 135 552 130'],
      ['lilac','M690 128 C756 86 838 161 908 126'],
      ['rose','M990 156 C1092 234 818 301 692 354'],
      ['lilac','M690 390 C790 344 818 424 910 390']
    ]
  };
  var paths = variants[flow] || variants['linkedin-route'];
  var prefix = 'sp-service-' + flow;
  return '<svg class="sp-service-system__links" viewBox="0 0 1200 500" preserveAspectRatio="none" aria-hidden="true" focusable="false"><defs>'
    + '<linearGradient id="' + prefix + '-lilac" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#7C5CFF" stop-opacity=".14"/><stop offset="55%" stop-color="#A98CFF" stop-opacity=".78"/><stop offset="100%" stop-color="#FF52B8" stop-opacity=".42"/></linearGradient>'
    + '<linearGradient id="' + prefix + '-cyan" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#62E4FF" stop-opacity=".12"/><stop offset="54%" stop-color="#62E4FF" stop-opacity=".74"/><stop offset="100%" stop-color="#9B84FF" stop-opacity=".48"/></linearGradient>'
    + '<linearGradient id="' + prefix + '-rose" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FF52B8" stop-opacity=".12"/><stop offset="54%" stop-color="#FF52B8" stop-opacity=".74"/><stop offset="100%" stop-color="#7C5CFF" stop-opacity=".45"/></linearGradient>'
    + '</defs>' + paths.map(function (path, i) {
      var softOpacity = path[2] ? ';--sp-flow-opacity:' + path[2] : '';
      return '<path class="sp-service-flow" pathLength="100" style="--sp-link-delay:' + (.12 + i * .09) + 's' + softOpacity + '" stroke="url(#' + prefix + '-' + path[0] + ')" d="' + path[1] + '"/>';
    }).join('') + '</svg>';
}
function serviceFlowCanvas(flow) {
  var prefix = 'sp-service-' + flow;
  return '<svg class="sp-service-system__links" data-sp-flow-canvas preserveAspectRatio="none" aria-hidden="true" focusable="false"><defs>'
    + '<linearGradient id="' + prefix + '-lilac" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#7C5CFF" stop-opacity=".14"/><stop offset="55%" stop-color="#A98CFF" stop-opacity=".78"/><stop offset="100%" stop-color="#FF52B8" stop-opacity=".42"/></linearGradient>'
    + '<linearGradient id="' + prefix + '-cyan" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#62E4FF" stop-opacity=".12"/><stop offset="54%" stop-color="#62E4FF" stop-opacity=".74"/><stop offset="100%" stop-color="#9B84FF" stop-opacity=".48"/></linearGradient>'
    + '<linearGradient id="' + prefix + '-rose" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FF52B8" stop-opacity=".12"/><stop offset="54%" stop-color="#FF52B8" stop-opacity=".74"/><stop offset="100%" stop-color="#7C5CFF" stop-opacity=".45"/></linearGradient>'
    + '</defs><g data-sp-flow-layer></g></svg>';
}
function renderHero(d) {
  var visualClass = 'sp-hero__visual sp-hero__visual--' + key;
  return '<section class="sp-hero sp-hero--' + key + '"><div class="wrap sp-hero__grid">'
    + '<div class="sp-hero__copy" data-sp-reveal>'
    + '<h1 class="sp-title">' + renderHeroTitle(d.hero) + '</h1>'
    + '<p class="sp-lead">' + esc(d.hero.lead) + '</p>'
    + '<div class="sp-hero__actions"><a class="btn btn--primary" href="#consultation">' + esc(d.hero.cta) + '</a></div>'
    + '</div>'
    + '<div class="' + visualClass + '" data-sp-reveal style="--sp-delay:.10s"><img class="sp-hero__object" src="' + service.art + '" alt="" aria-hidden="true" fetchpriority="high"></div>'
    + '</div></section>';
}
function renderStrategyProof(section) {
  return '<section class="sp-section sp-section--rule sp-decision-section"><div class="wrap">'
    + '<div class="sp-decision-frame" data-sp-reveal><div class="sp-decision-frame__head"><h2>' + strategyProofTitle() + '</h2></div>'
    + '<ol class="sp-decision-frame__items">' + section.items.map(function (item, i) {
      return '<li class="sp-decision-frame__item" style="--sp-item-delay:' + (i * .08) + 's"><h3>' + esc(item[0]) + '</h3><p>' + esc(item[1]) + '</p></li>';
    }).join('') + '</ol></div></div></section>';
}
function renderStrategyScope(section) {
  var deliverables = copy().outcomes;
  var question = language === 'en' ? 'Question we answer' : 'Вопрос, на который отвечаем';
  var output = language === 'en' ? 'Result of this stage' : 'Результат этапа';
  return '<section class="sp-section sp-strategy-scope-section"><div class="wrap"><div class="sp-strategy-scope">'
    + '<div class="sp-strategy-scope__intro" data-sp-reveal><p>' + esc(section.label) + '</p><h2>' + esc(section.title) + '</h2><span>' + (language === 'en' ? 'You receive:' : 'На выходе вы получаете:') + '</span>'
    + '<dl class="sp-strategy-deliverables">' + deliverables.items.map(function (item) { return '<div><dt>' + esc(item[0]) + '</dt><dd>' + esc(item[1]) + '</dd></div>'; }).join('') + '</dl></div>'
    + '<div class="sp-strategy-workmap" data-sp-reveal style="--sp-delay:.05s"><p class="sp-caption">' + (language === 'en' ? 'Explore each stage' : 'Что делаем на каждом этапе') + '</p>'
    + section.items.map(function (item, i) {
      return '<details class="sp-strategy-step" name="strategy-workmap"' + (i === 0 ? ' open' : '') + '><summary><h3>' + esc(item.title) + '</h3></summary><div class="sp-strategy-step__detail"><span>' + esc(question) + '</span><p>' + esc(item.question) + '</p><span>' + esc(output) + '</span><p>' + esc(item.output) + '</p></div></details>';
    }).join('') + '</div></div></div></section>';
}
function renderStrategySystem(section) {
  var core = language === 'en' ? 'Business <br>objective' : 'Задача <br>бизнеса';
  var sub = language === 'en' ? 'aligns the work' : 'собирает работу';
  return '<section class="sp-section sp-section--tight sp-section--rule sp-strategy-system-section"><div class="wrap">'
    + '<div class="sp-strategy-system__head" data-sp-reveal><p>' + esc(section.label) + '</p><h2>' + esc(section.title) + '</h2><span>' + esc(section.note) + '</span></div>'
    + '<div class="sp-strategy-system" data-sp-system data-sp-reveal style="--sp-delay:.04s"><svg class="sp-strategy-system__links" aria-hidden="true" focusable="false"><g data-strategy-links></g></svg><div class="sp-strategy-system__core"><strong>' + core + '</strong><span>' + esc(sub) + '</span></div><ol class="sp-strategy-system__nodes">' + section.items.map(function (item, i) {
      return '<li class="sp-strategy-system__node" style="--sp-item-delay:' + (i * .07) + 's"><h3>' + esc(item[0]) + '</h3><p>' + esc(item[1]) + '</p></li>';
    }).join('') + '</ol></div></div></section>';
}
function renderStrategyProcess(section) {
  var phases = language === 'en'
    ? [['Define', 'Immersion and the direction of work'], ['Operate', 'Launch and review in the real market'], ['Adapt', 'Optimisation and the next expansion']]
    : [['Диагностика', 'Погружение и выбор направления'], ['Работа', 'Запуск и проверка на реальном рынке'], ['Корректировка', 'Оптимизация и следующее расширение']];
  return '<section class="sp-section sp-section--rule sp-strategy-cycle-section"><div class="wrap"><div class="sp-strategy-cycle__head" data-sp-reveal><p>' + esc(section.label) + '</p><h2>' + esc(section.title) + '</h2></div>'
    + '<ol class="sp-strategy-cycle" data-sp-reveal style="--sp-delay:.05s">' + phases.map(function (phase, i) {
      var steps = section.items.slice(i * 2, i * 2 + 2);
      return '<li class="sp-strategy-cycle__phase" style="--sp-item-delay:' + (i * .11) + 's"><div class="sp-strategy-cycle__phase-head"><h3>' + esc(phase[0]) + '</h3><p>' + esc(phase[1]) + '</p></div><ol class="sp-strategy-cycle__steps">' + steps.map(function (item) { return '<li><div><h4>' + esc(item[0]) + '</h4><p>' + esc(item[1]) + '</p></div></li>'; }).join('') + '</ol></li>';
    }).join('') + '</ol></div></section>';
}
function renderStrategyGate(section) {
  var caveat = language === 'en'
    ? 'This format does not replace a product, sales discipline or management decisions. It creates a practical marketing frame around them.'
    : 'Этот формат не подменяет продукт, продажи или управленческие решения. Он создаёт вокруг них рабочую маркетинговую рамку.';
  return '<section class="sp-section sp-strategy-gate-section"><div class="wrap"><div class="sp-strategy-gate" data-sp-reveal><div class="sp-strategy-gate__intro"><p>' + esc(section.label) + '</p><h2>' + esc(section.title) + '</h2><span>' + esc(section.note) + '</span><aside>' + esc(caveat) + '</aside></div><ol class="sp-strategy-gate__items">' + section.items.map(function (item, i) {
      return '<li style="--sp-item-delay:' + (i * .075) + 's"><h3>' + esc(item[0]) + '</h3><p>' + esc(item[1]) + '</p></li>';
    }).join('') + '</ol></div></div></section>';
}
function renderHead(section) {
  return '<div class="sp-head sp-head--' + key + '" data-sp-reveal><div><h2>' + esc(section.title) + '</h2></div>'
    + (section.note ? '<p class="sp-head__note">' + esc(section.note) + '</p>' : '') + '</div>';
}
function renderProof(section) {
  if (isStrategy) return renderStrategyProof(section);
  return '<section class="sp-section sp-proof-section sp-proof-section--' + key + '"><div class="wrap">' + renderHead(section)
    + '<div class="sp-proof sp-proof--' + key + '" data-sp-reveal style="--sp-delay:.06s">' + section.items.map(function (item, i) {
      return '<article class="sp-proof__item" style="--sp-item-delay:' + (i * .075) + 's"><h3>' + esc(item[0]) + '</h3><p>' + esc(item[1]) + '</p></article>';
    }).join('') + '</div></div></section>';
}
function renderScope(section) {
  if (isStrategy) return renderStrategyScope(section);
  if (key === 'linkedin') return renderLinkedinFunnel(section);
  if (key === 'seo') return renderSeoPhases(section);
  return '<section class="sp-section"><div class="wrap sp-scope"><div class="sp-scope__intro" data-sp-reveal><p class="sp-caption">' + esc(section.label) + '</p><h2>' + esc(section.title) + '</h2>'
    + (section.note ? '<p>' + esc(section.note) + '</p>' : '') + '</div><ul class="sp-index sp-index--' + key + '" data-sp-reveal style="--sp-delay:.06s">'
    + section.items.map(function (item, i) { return '<li class="sp-index__item" style="--sp-item-delay:' + (i * .055) + 's"><span>' + esc(item) + '</span></li>'; }).join('')
    + '</ul></div></section>';
}
function renderFormats(section) {
  return '<section class="sp-section sp-formats-section"><div class="wrap"><div class="sp-formats__head" data-sp-reveal><p>' + esc(section.label) + '</p><h2>' + esc(section.title) + '</h2><span>' + esc(section.note) + '</span></div>'
    + '<ol class="sp-formats" data-sp-reveal style="--sp-delay:.05s">' + section.items.map(function (item, i) {
      return '<li style="--sp-item-delay:' + (i * .075) + 's"><h3>' + esc(item[0]) + '</h3><p>' + esc(item[1]) + '</p></li>';
    }).join('') + '</ol></div></section>';
}
function renderServiceSystem(section) {
  var core = section.core || [section.title, section.note || ''];
  var flow = supportedDiagram(section.flow, SERVICE_DIAGRAM_FLOWS, 'linkedin-route');
  var layout = supportedDiagram(section.layout, SERVICE_DIAGRAM_LAYOUTS, 'linkedin');
  return '<section class="sp-section sp-section--tight sp-service-system-section sp-service-system-section--' + key + '"><div class="wrap">' + renderHead(section)
    + '<div class="sp-service-system sp-service-system--layout-' + layout + ' sp-service-system--flow-' + flow + '" data-sp-service-system data-sp-service-flow="' + flow + '" data-sp-reveal style="--sp-delay:.04s">' + serviceFlowCanvas(flow)
    + '<div class="sp-service-system__core" data-sp-flow-anchor="core"><strong>' + esc(core[0]).replace(/\n/g, '<br>') + '</strong><span>' + esc(core[1]) + '</span></div>'
    + '<ol class="sp-service-system__nodes">' + section.items.map(function (item, i) {
      return '<li class="sp-service-system__node" data-sp-flow-anchor="n' + i + '" style="--sp-item-delay:' + (i * .085) + 's"><h3>' + esc(item[0]) + '</h3><p>' + esc(item[1]) + '</p></li>';
    }).join('') + '</ol></div></div></section>';
}
// A glass funnel drawn as six stacked, tapering rings. Each ring is a short
// truncated cone: an open top ellipse with a bright rim, a shaded side wall
// with a specular streak, and a front bottom edge. Geometry is decorative,
// every word stays HTML. The central axis carries a slow light stream.
var LINKEDIN_FUNNEL_TONES = ['#8fc4ff', '#8ed3f0', '#8edbea', '#a3c5ff', '#b1baff', '#bfaef7'];
function linkedinFunnelTier(i, count, prefix) {
  var cx = 210, e = .14, yt = 24, yb = 90;
  var radius = function (k) { return 196 - k * (123 / count); };
  var rt = radius(i), rb = radius(i + 1) + 9, et = rt * e, eb = rb * e;
  var tone = LINKEDIN_FUNNEL_TONES[i % LINKEDIN_FUNNEL_TONES.length];
  var id = (prefix || 'sp-lf-') + i;
  var r = function (v) { return Math.round(v * 10) / 10; };
  var side = 'M' + r(cx - rt) + ' ' + yt + ' L' + r(cx - rb) + ' ' + yb + ' A' + r(rb) + ' ' + r(eb) + ' 0 0 0 ' + r(cx + rb) + ' ' + yb + ' L' + r(cx + rt) + ' ' + yt + ' A' + r(rt) + ' ' + r(et) + ' 0 0 1 ' + r(cx - rt) + ' ' + yt + ' Z';
  var lip = 'M' + r(cx - rb) + ' ' + yb + ' A' + r(rb) + ' ' + r(eb) + ' 0 0 0 ' + r(cx + rb) + ' ' + yb;
  var streak = 'M' + r(cx - rt * .58) + ' ' + r(yt + et * .82) + ' L' + r(cx - rb * .58) + ' ' + r(yb + eb * .82);
  return '<svg viewBox="0 0 420 116" preserveAspectRatio="xMidYMid meet" focusable="false"><defs>'
    + '<linearGradient id="' + id + '-side" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + tone + '" stop-opacity=".08"/><stop offset=".2" stop-color="' + tone + '" stop-opacity=".34"/><stop offset=".46" stop-color="' + tone + '" stop-opacity=".12"/><stop offset=".82" stop-color="' + tone + '" stop-opacity=".05"/><stop offset="1" stop-color="' + tone + '" stop-opacity=".16"/></linearGradient>'
    + '<radialGradient id="' + id + '-in" cx=".5" cy=".62" r=".6"><stop offset="0" stop-color="' + tone + '" stop-opacity=".30"/><stop offset=".55" stop-color="#0b0a1a" stop-opacity=".9"/><stop offset="1" stop-color="#07060f" stop-opacity=".95"/></radialGradient>'
    + '<linearGradient id="' + id + '-sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".13"/><stop offset=".55" stop-color="#fff" stop-opacity=".02"/><stop offset="1" stop-color="' + tone + '" stop-opacity=".10"/></linearGradient>'
    + '</defs>'
    + '<path class="sp-lf__side" d="' + side + '" fill="url(#' + id + '-side)" stroke="' + tone + '"/>'
    + '<path d="' + side + '" fill="url(#' + id + '-sheen)"/>'
    + '<path class="sp-lf__lip" d="' + lip + '" stroke="' + tone + '"/>'
    + '<path class="sp-lf__streak" d="' + streak + '"/>'
    + '<ellipse class="sp-lf__mouth" cx="' + cx + '" cy="' + yt + '" rx="' + r(rt) + '" ry="' + r(et) + '" fill="url(#' + id + '-in)" stroke="' + tone + '"/>'
    + '<ellipse class="sp-lf__rim" cx="' + cx + '" cy="' + r(yt + 1.5) + '" rx="' + r(rt * .9) + '" ry="' + r(et * .86) + '" stroke="' + tone + '"/>'
    + '<circle class="sp-lf__node" cx="' + cx + '" cy="' + yt + '" r="3.2" fill="' + tone + '"/>'
    + '</svg>';
}
function renderLinkedinFunnel(section) {
  return '<section class="sp-section sp-linkedin-funnel-section"><div class="wrap sp-linkedin-funnel-layout"><div class="sp-linkedin-funnel__head" data-sp-reveal><p>' + esc(section.label) + '</p><h2>' + esc(section.title) + '</h2><span>' + esc(section.note) + '</span></div>'
    // Narrow screens: text rows are taller than the rings, so one unbroken
    // funnel sits above the list instead of rings split between rows.
    + '<div class="sp-linkedin-funnel__stack" aria-hidden="true">' + section.items.map(function (item, i) {
      return '<div class="sp-linkedin-funnel__shape" style="--funnel-step:' + i + ';color:' + LINKEDIN_FUNNEL_TONES[i % LINKEDIN_FUNNEL_TONES.length] + '">' + linkedinFunnelTier(i, section.items.length, 'sp-lfm-') + '</div>';
    }).join('') + '</div>'
    + '<ol class="sp-linkedin-funnel" data-sp-reveal style="--sp-delay:.04s">' + section.items.map(function (item, i) {
      return '<li style="--sp-item-delay:' + (i * .07) + 's;--funnel-step:' + i + ';color:' + LINKEDIN_FUNNEL_TONES[i % LINKEDIN_FUNNEL_TONES.length] + '"><div class="sp-linkedin-funnel__shape" aria-hidden="true">' + linkedinFunnelTier(i, section.items.length) + '</div><div class="sp-linkedin-funnel__copy"><h3>' + esc(item[0]) + '</h3><p>' + esc(item[1]) + '</p></div></li>';
    }).join('') + '</ol></div></section>';
}
function renderLinkedinProcess(section) {
  return '<section class="sp-section sp-linkedin-process-section"><div class="wrap">' + renderHead(section)
    + '<ol class="sp-linkedin-phases" data-sp-reveal>' + section.items.map(function (item, i) {
      return '<li class="sp-linkedin-phase"><span class="sp-linkedin-phase__number" aria-hidden="true">' + String(i + 1).padStart(2, '0') + '</span><h3>' + esc(item[0]) + '</h3><ul>' + item[1].map(function (task) { return '<li>' + esc(task) + '</li>'; }).join('') + '</ul></li>';
    }).join('') + '</ol></div></section>';
}
function renderLinkedinIcpLine(section) {
  return '<section class="sp-section sp-linkedin-icp-section"><div class="wrap">' + renderHead(section)
    + '<ol class="sp-linkedin-icp" data-sp-reveal style="--sp-delay:.04s">' + section.items.map(function (item, i) {
      return '<li style="--sp-item-delay:' + (i * .09) + 's"><h3>' + esc(item[0]) + '</h3><p>' + esc(item[1]) + '</p></li>';
    }).join('') + '<li class="sp-linkedin-icp__result" style="--sp-item-delay:.36s"><h3>' + esc(section.core[0]).replace(/\n/g, ' ') + '</h3><p>' + esc(section.core[1]) + '</p></li></ol></div></section>';
}
// 4.3: tools grouped by phase. The brief asks for a visualisation without
// numbers, so the phases are marked by a gradient rule, not an index.
function renderSeoPhases(section) {
  return '<section class="sp-section sp-seo-phases-section"><div class="wrap sp-seo-phases-layout"><div class="sp-seo-phases__intro" data-sp-reveal><p class="sp-caption">' + esc(section.label) + '</p><h2>' + esc(section.title) + '</h2><p>' + esc(section.note) + '</p></div>'
    + '<ol class="sp-seo-phases" data-sp-reveal style="--sp-delay:.05s">' + section.phases.map(function (phase, i) {
      return '<li style="--sp-item-delay:' + (i * .08) + 's"><h3>' + esc(phase[0]) + '</h3><ul>' + phase[1].map(function (tool) { return '<li>' + esc(tool) + '</li>'; }).join('') + '</ul></li>';
    }).join('') + '</ol></div></section>';
}
// 4.4: four ringed steps on one line; the last one is the commercial outcome.
function renderSeoSteps(section) {
  return '<section class="sp-section sp-seo-steps-section"><div class="wrap">' + renderHead(section)
    + '<ol class="sp-seo-steps" data-sp-reveal style="--sp-delay:.04s">' + section.items.map(function (item, i) {
      return '<li style="--sp-item-delay:' + (i * .09) + 's"><span class="sp-seo-steps__ring" aria-hidden="true">' + String(i + 1).padStart(2, '0') + '</span><h3>' + esc(item[0]) + '</h3><p>' + esc(item[1]) + '</p></li>';
    }).join('') + '</ol></div></section>';
}
// 5.4: five points on one line, colours shifting along it, no indices.
function renderLocalizationRelay(section) {
  return '<section class="sp-section sp-loc-relay-section"><div class="wrap">' + renderHead(section)
    + '<ol class="sp-loc-relay" data-sp-reveal style="--sp-delay:.04s">' + section.items.map(function (item, i) {
      return '<li style="--sp-item-delay:' + (i * .08) + 's;--relay-step:' + i + '"><i aria-hidden="true"></i><h3>' + esc(item[0]) + '</h3><p>' + esc(item[1]) + '</p></li>';
    }).join('') + '</ol></div></section>';
}
// 5.3: four groups with the full lists from the brief; the group points move
// through the page palette instead of repeating one colour.
function renderLocalizationGroups(section) {
  return '<section class="sp-section sp-loc-groups-section"><div class="wrap">' + renderHead(section)
    + '<div class="sp-loc-groups" data-sp-reveal style="--sp-delay:.05s">' + section.groups.map(function (group, i) {
      return '<article class="sp-loc-group" style="--sp-item-delay:' + (i * .075) + 's"><h3>' + esc(group[0]) + '</h3><ul>' + group[1].map(function (entry) { return '<li>' + esc(entry) + '</li>'; }).join('') + '</ul></article>';
    }).join('') + '</div></div></section>';
}
// Five short working steps in one compact row.
function renderLocalizationSteps(section) {
  return '<section class="sp-section sp-loc-steps-section"><div class="wrap">' + renderHead(section)
    + '<ol class="sp-loc-steps" data-sp-reveal style="--sp-delay:.04s">' + section.items.map(function (item, i) {
      return '<li style="--sp-item-delay:' + (i * .07) + 's"><span aria-hidden="true">' + String(i + 1).padStart(2, '0') + '</span><h3>' + esc(item[0]) + '</h3><p>' + esc(item[1]) + '</p></li>';
    }).join('') + '</ol></div></section>';
}
function renderLinearSequence(section, modifier) {
  return '<section class="sp-section sp-linear-sequence-section sp-linear-sequence-section--' + modifier + '"><div class="wrap">' + renderHead(section)
    + '<ol class="sp-linear-sequence sp-linear-sequence--' + modifier + '" data-sp-reveal style="--sp-delay:.04s">' + section.items.map(function (item, i) {
      return '<li style="--sp-item-delay:' + (i * .085) + 's">' + '<span>' + String(i + 1).padStart(2, '0') + '</span>' + '<h3>' + esc(item[0]) + '</h3><p>' + esc(item[1]) + '</p></li>';
    }).join('') + '</ol></div></section>';
}
function renderDiagram(section) {
  if (isStrategy) return renderStrategySystem(section);
  if (key === 'linkedin') return renderLinkedinIcpLine(section);
  if (key === 'pr') return renderPrChain(section);
  if (key === 'seo') return renderSeoSteps(section);
  if (key === 'localization') return renderLocalizationRelay(section);
  return renderServiceSystem(section);
}
function renderProcess(section) {
  if (isStrategy) return renderStrategyProcess(section);
  if (key === 'linkedin') return renderLinkedinProcess(section);
  if (key === 'pr') return renderPrSteps(section);
  if (key === 'localization') return renderLocalizationSteps(section);
  return '<section class="sp-section sp-process-section sp-process-section--' + key + '"><div class="wrap">' + renderHead(section)
    + '<ol class="sp-process" data-sp-reveal style="--sp-delay:.05s">' + section.items.map(function (item, i) {
      return '<li class="sp-process__item" style="--sp-item-delay:' + (i * .075) + 's"><h3>' + esc(item[0]) + '</h3><p>' + esc(item[1]) + '</p></li>';
    }).join('') + '</ol></div></section>';
}
function renderSectors(section, variant) {
  if (section.groups) return renderLocalizationGroups(section);
  if (isStrategy && !variant) return renderStrategyGate(section);
  var type = variant || 'fields';
  return '<section class="sp-section sp-sector-section sp-sector-section--' + type + ' sp-sector-section--' + key + '"><div class="wrap">' + renderHead(section)
    + '<div class="sp-sectors sp-sectors--' + type + ' sp-sectors--' + key + '" data-sp-reveal style="--sp-delay:.05s">' + section.items.map(function (item, i) {
      var tags = Array.isArray(item[2]) ? '<ul class="sp-sector__tags">' + item[2].map(function (tag) { return '<li>' + esc(tag) + '</li>'; }).join('') + '</ul>' : '';
      return '<article class="sp-sector' + (tags ? ' sp-sector--tagged' : '') + '" style="--sp-item-delay:' + (i * .075) + 's"><h3>' + esc(item[0]) + '</h3><p>' + esc(item[1]) + '</p>' + tags + '</article>';
    }).join('') + '</div></div></section>';
}
function renderPricing(section) {
  return '<section class="sp-section sp-pricing-section sp-pricing-section--' + key + '"><div class="wrap sp-pricing"><div class="sp-pricing__copy" data-sp-reveal><p class="sp-caption">' + esc(section.label) + '</p><h2>' + esc(section.title) + '</h2><p>' + esc(section.note) + '</p></div>'
    + '<div data-sp-reveal style="--sp-delay:.06s"><dl class="sp-rate-list sp-rate-list--' + key + '">'
    + section.rows.map(function (row, i) { return '<div class="sp-rate-list__item" style="--sp-item-delay:' + (i * .075) + 's"><dt>' + esc(row[0]) + '</dt><dd>' + esc(row[1]) + '</dd></div>'; }).join('') + '</dl>'
    + '<ul class="sp-pricing__notes">' + section.notes.map(function (note) { return '<li class="sp-pricing__note">' + esc(note) + '</li>'; }).join('') + '</ul></div></div></section>';
}
function renderLogo(keyName, media) {
  var logo = LOGOS[keyName];
  if (!logo) return '';
  return '<div class="sp-logo' + (media ? ' sp-logo--media' : '') + (logo.wide ? ' sp-logo--wide' : '') + (logo.ink ? ' sp-logo--ink' : '') + (logo.mark ? ' sp-logo--mark' : '') + (logo.tile ? ' sp-logo--tile' : '') + '"><img src="' + esc(logo.src) + '" alt="' + (logo.mark ? '' : esc(logo.alt)) + '" loading="lazy" decoding="async">' + (logo.mark ? '<span class="sp-logo__name">' + esc(logo.alt) + '</span>' : '') + '</div>';
}
function renderMedia(section) {
  return '<section class="sp-trust sp-media-network sp-media-network--' + key + '"><div class="wrap"><div class="sp-trust__head" data-sp-reveal><div><p class="sp-caption">' + esc(section.label) + '</p><h2>' + esc(section.title) + '</h2></div><p>' + esc(section.note) + '</p></div>'
    + '<div class="sp-logo-grid" style="--logo-columns:5;--sp-delay:.06s" data-sp-reveal>' + section.logos.map(function (logo) { return renderLogo(logo, true); }).join('') + '</div>'
    + linkArrow(section.action, '#consultation') + '</div></section>';
}
// Five steps in one reading line; the business result hangs below the last
// step instead of becoming a sixth node that competes with "trust".
function renderPrChain(section) {
  return '<section class="sp-section sp-pr-chain-section"><div class="wrap">' + renderHead(section)
    + '<div class="sp-pr-chain-wrap" data-sp-reveal style="--sp-delay:.04s"><ol class="sp-pr-chain">' + section.items.map(function (item, i) {
      return '<li style="--sp-item-delay:' + (i * .08) + 's"><h3>' + esc(item[0]) + '</h3><p>' + esc(item[1]) + '</p>' + (i < section.items.length - 1 ? '<i class="sp-pr-chain__arrow" aria-hidden="true"></i>' : '') + '</li>';
    }).join('') + '</ol><p class="sp-pr-chain__result">' + section.result.map(esc).join('<i aria-hidden="true">→</i>') + '</p></div></div></section>';
}
// Six working steps read left to right in two rows: numbered, compact,
// without arrows so they do not repeat the publication chain above.
function renderPrSteps(section) {
  return '<section class="sp-section sp-pr-steps-section"><div class="wrap">' + renderHead(section)
    + '<ol class="sp-pr-steps" data-sp-reveal style="--sp-delay:.04s">' + section.items.map(function (item, i) {
      return '<li style="--sp-item-delay:' + (i * .07) + 's"><span aria-hidden="true">' + String(i + 1).padStart(2, '0') + '</span><h3>' + esc(item[0]) + '</h3><p>' + esc(item[1]) + '</p></li>';
    }).join('') + '</ol></div></section>';
}
// The homepage cases, trimmed to the PR-relevant ones. Only confirmed figures
// are carried over: 1GHS metrics are still marked as placeholders on the homepage.
var PR_CASES = {
  ru:{ title:'Кейсы и результаты', note:'Коротко о проектах, где PR и медиа были частью работы.', task:'Задача.', did:'Что сделали.', rail:'Кейсы, прокрутка по горизонтали', items:[
    { logo:'/assets/img/brands/cases/huobi-global.jpg', name:'Huobi Global', meta:'Криптобиржа · выход на рынок · 1 год', task:'Усилить присутствие одной из ведущих мировых криптобирж на российском рынке и поддержать выход бренда в новый регион.', did:'Масштабная кампания: таргетированная и контекстная реклама, PR-инструменты, трафик-арбитраж, медийные активности и работа с инфлюенсерами.', res:[['14 000+','новых клиентов'],['14 млн','потенциальная аудитория рынка'],['10+','индустриальных мероприятий'],['20+','коллабораций с медиа и инфлюенсерами']] },
    { logo:'/assets/img/brands/clients/zenex.svg', wordmark:true, name:'Zenex Token', meta:'Токен · PR и доверие · 6 месяцев', task:'Усилить доверие к токену, повысить узнаваемость проекта, привлечь внимание инвесторов и обеспечить трафик на официальные ресурсы.', did:'PR и медийные публикации, работа с социальными сетями, присутствие в индустриальном поле и выстраивание доверия вокруг токена.', res:[['10+','публикаций в ведущих медиа'],['20 000+','подписчиков в социальных сетях'],['3 млн','рекламный охват'],['$1,5 млн','привлечено на pre-sale токена']] },
    { logo:'/assets/img/brands/cases/1ghs.png', wordmark:true, name:'1GHS', meta:'Упаковка бренда · digital и медиа', task:'Повысить узнаваемость проекта и доверие к бренду, создать основу для системного продвижения в digital и медиа.', did:'Упаковка коммуникации, контент, PR-активности, работа с аудиторией и усиление присутствия бренда в релевантных каналах.', res:[] }
  ]},
  en:{ title:'Cases and results', note:'A short look at projects where PR and media were part of the work.', task:'Goal.', did:'What we did.', rail:'Cases, horizontal scroll', items:[
    { logo:'/assets/img/brands/cases/huobi-global.jpg', name:'Huobi Global', meta:'Crypto exchange · market entry · 1 year', task:'Strengthen the presence of one of the world’s leading crypto exchanges on the Russian market and support the brand entering a new region.', did:'A large-scale campaign: paid social and search advertising, PR tools, traffic arbitrage, media activity and influencer work.', res:[['14,000+','new clients'],['14 M','potential market audience'],['10+','industry events'],['20+','collaborations with media and influencers']] },
    { logo:'/assets/img/brands/clients/zenex.svg', wordmark:true, name:'Zenex Token', meta:'Token · PR and trust · 6 months', task:'Build trust in the token, raise awareness, attract investor attention and drive traffic to the official resources.', did:'PR and media publications, social media work, presence across the industry field and trust-building around the token.', res:[['10+','publications in leading media'],['20,000+','new social media followers'],['3 M','advertising reach'],['$1.5 M','raised at the token pre-sale']] },
    { logo:'/assets/img/brands/cases/1ghs.png', wordmark:true, name:'1GHS', meta:'Brand packaging · digital and media', task:'Raise awareness and brand trust, and create a base for systematic growth in digital and media.', did:'Communication packaging, content, PR activity, audience work and a stronger brand presence in relevant channels.', res:[] }
  ]}
};
function renderPrCasesWidget() {
  var d = PR_CASES[language];
  return '<section class="sp-section sp-pr-cases"><div class="wrap"><div class="sp-pr-cases__head" data-sp-reveal><h2>' + esc(d.title) + '</h2><p>' + esc(d.note) + '</p></div></div>'
    + '<div class="sp-pr-cases__rail" tabindex="0" aria-label="' + esc(d.rail) + '" data-sp-reveal style="--sp-delay:.05s">' + d.items.map(function (item, i) {
      var res = item.res.length ? '<ul class="sp-pr-case__res">' + item.res.slice(0, 2).map(function (r) { return '<li><b>' + esc(r[0]) + '</b><span>' + esc(r[1]) + '</span></li>'; }).join('') + '</ul>' : '';
      return '<article class="sp-pr-case" style="--sp-item-delay:' + (i * .08) + 's"><header><img class="' + (item.wordmark ? 'is-wordmark' : '') + '" src="' + esc(item.logo) + '" alt="" loading="lazy" decoding="async"><div><h3>' + esc(item.name) + '</h3><span>' + esc(item.meta) + '</span></div></header>'
        + '<p><b>' + esc(d.task) + '</b> ' + esc(item.task) + '</p><p><b>' + esc(d.did) + '</b> ' + esc(item.did) + '</p>' + res + '</article>';
    }).join('') + '</div></section>';
}
function renderTrust(section) {
  return '<section class="sp-trust sp-trust--' + key + (isStrategy ? ' sp-trust--strategy' : '') + '"><div class="wrap"><div class="sp-trust__head" data-sp-reveal><div><p class="sp-caption">' + (language === 'en' ? 'Trust' : 'Доверие') + '</p><h2>' + esc(section.title) + '</h2></div><p>' + esc(section.note) + '</p></div>'
    + '<div class="sp-logo-grid sp-logo-grid--free" style="--logo-columns:' + (section.logos.length <= 6 ? section.logos.length : 5) + ';--sp-delay:.06s" data-sp-reveal>' + section.logos.map(function (logo) { return renderLogo(logo, false); }).join('') + '</div></div></section>';
}
function renderCta(section) {
  return '<section class="sp-cta sp-cta--' + key + (isStrategy ? ' sp-cta--strategy' : '') + '" id="consultation"><div class="wrap sp-cta__grid"><div class="sp-cta__copy" data-sp-reveal><p class="sp-caption">' + (language === 'en' ? 'Consultation' : 'Консультация') + '</p><h2>' + esc(section.title) + '</h2><p>' + esc(section.text) + '</p></div>'
    + '<form class="form card sp-form" id="spForm" data-sp-reveal style="--sp-delay:.08s" novalidate><div class="f-row sp-form__row"><label class="f sp-field"><span>' + (language === 'en' ? 'Name' : 'Имя') + '</span><input name="name" autocomplete="name" required></label><label class="f sp-field"><span>Email</span><input name="email" type="email" autocomplete="email" required></label></div><label class="f sp-field"><span>' + (language === 'en' ? 'Phone / messenger' : 'Телефон / мессенджер') + '</span><input name="contact" autocomplete="tel" required></label><input type="hidden" name="service" value="' + esc(key) + '"><button class="btn btn--primary btn--wide" type="submit">' + esc(section.button) + '</button><p class="form__note sp-form__note" role="status" aria-live="polite"></p></form></div></section>';
}
function renderFooter() {
  var en = language === 'en';
  return '<div class="wrap"><div class="foot__top"><div class="foot__brand"><a class="brand" href="/" aria-label="VAK Marketing"><svg class="brand__mark" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13.2" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".55"/><path d="M4.6 21.2C9 15 23 15 27.4 21.2" fill="none" stroke="currentColor" stroke-width="1.1"/><path d="M4.6 10.8C9 17 23 17 27.4 10.8" fill="none" stroke="currentColor" stroke-width="1.1"/><circle cx="16" cy="16" r="2.1" fill="currentColor"/></svg><span class="brand__text">VAK <b>Marketing</b></span></a><p>' + esc(en ? 'A full-cycle marketing agency for iGaming, FinTech, Crypto, Web3 and B2B. Strategy, brand, media, LinkedIn, B2B leads and marketing at scale.' : 'Комплексное маркетинговое агентство для iGaming, FinTech, Crypto, Web3 и B2B. Стратегия, бренд, медиа, LinkedIn, B2B-лиды и масштабирование маркетинга.') + '</p></div><nav class="foot__col" aria-label="' + (en ? 'Company' : 'Компания') + '"><h4>' + (en ? 'Company' : 'Компания') + '</h4><a href="/#about">' + (en ? 'About' : 'О нас') + '</a><a href="/#team">' + (en ? 'Team' : 'Команда') + '</a><a href="/#founder">Founder</a><a href="/#cases">' + (en ? 'Cases' : 'Кейсы') + '</a><a href="/#contact">' + (en ? 'Contacts' : 'Контакты') + '</a></nav><nav class="foot__col" aria-label="' + (en ? 'Services' : 'Услуги') + '"><h4>' + (en ? 'Services' : 'Услуги') + '</h4><a href="/strategy/">' + (en ? 'Strategy and full management' : 'Стратегия и комплексное ведение') + '</a><a href="/linkedin/">' + (en ? 'B2B marketing and LinkedIn' : 'B2B-маркетинг и LinkedIn') + '</a><a href="/pr/">' + (en ? 'PR and media' : 'PR и СМИ') + '</a><a href="/seo/">' + (en ? 'SEO and SERP' : 'SEO и SERP') + '</a><a href="/localization/">' + (en ? 'Translation and localisation' : 'Перевод и локализация') + '</a></nav><nav class="foot__col" aria-label="' + (en ? 'Resources and contacts' : 'Материалы и контакты') + '"><h4>' + (en ? 'Resources' : 'Материалы') + '</h4><a href="/#partners">' + (en ? 'Media' : 'Медиа') + '</a><a href="/privacy/">' + (en ? 'Privacy policy' : 'Политика конфиденциальности') + '</a><h4 class="foot__h2">' + (en ? 'Contacts' : 'Контакты') + '</h4><a href="mailto:hello@vakmarketing.com">hello@vakmarketing.com</a></nav></div><div class="foot__bot"><span>© ' + new Date().getFullYear() + ' VAK Marketing</span><a href="/privacy/">' + (en ? 'Privacy policy' : 'Политика конфиденциальности') + '</a><span>' + (en ? 'All rights reserved' : 'Все права защищены') + '</span></div></div>';
}

function render(d) {
  document.documentElement.lang = language;
  document.title = d.meta.title;
  var desc = $('meta[name="description"]'); if (desc) desc.setAttribute('content', d.meta.desc);
  var ogTitle = $('meta[property="og:title"]'); if (ogTitle) ogTitle.setAttribute('content', d.meta.title);
  var ogDesc = $('meta[property="og:description"]'); if (ogDesc) ogDesc.setAttribute('content', d.meta.desc);

  $('#main').innerHTML = renderHero(d) + renderProof(d.proof) + renderScope(d.scope)
    + (d.formats ? renderFormats(d.formats) : '')
    + (d.diagram ? renderDiagram(d.diagram) : '') + (d.pricing ? renderPricing(d.pricing) : '')
    + (d.media ? renderMedia(d.media) : '') + (key === 'pr' ? renderPrCasesWidget() : '') + (d.process ? renderProcess(d.process) : '')
    + (d.sectors ? renderSectors(d.sectors) : '') + (d.outcomes && !isStrategy ? renderSectors(d.outcomes, 'outcomes') : '')
    + (d.trust ? renderTrust(d.trust) : '') + renderCta(d.cta);
  $('#footer').innerHTML = renderFooter();
  renderNav();
  bindForm(d.cta);
  bindReveal();
  bindDiagramExperience();
}

/* ---------- Navigation and interactions -------------------------------- */
function navLinks(mobile) {
  var services = [
    ['/strategy/', language === 'en' ? 'Strategy' : 'Стратегия'],
    ['/linkedin/', 'LinkedIn'],
    ['/pr/', language === 'en' ? 'PR, media and SERP' : 'PR, СМИ и SERP'],
    ['/seo/', 'AI SEO'],
    ['/localization/', language === 'en' ? 'Localization' : 'Локализация']
  ];
  var course = language === 'en' ? 'B2B and B2C LinkedIn course — coming soon' : 'B2B и B2C курс по LinkedIn — скоро';
  var items = [
    ['/#cases', language === 'en' ? 'Cases' : 'Кейсы'],
    ['/#clients', language === 'en' ? 'Clients' : 'Клиенты'],
    ['/#team', language === 'en' ? 'Team' : 'Команда'],
    ['/#about', language === 'en' ? 'About' : 'О нас'],
    ['#', language === 'en' ? 'Blog' : 'Блог', true],
    ['/#contact', language === 'en' ? 'Contacts' : 'Контакты']
  ];
  var label = language === 'en' ? 'Services' : 'Услуги';
  var serviceLinks = services.map(function (item) { return '<a href="' + item[0] + '">' + item[1] + '</a>'; }).join('')
    + '<span class="' + (mobile ? 'menu__services-course' : 'nav__services-course') + '">' + course + '</span>';
  var group = mobile
    ? '<details class="menu__services"><summary><span>' + label + '</span><i aria-hidden="true"></i></summary><div class="menu__services-links">' + serviceLinks + '</div></details>'
    : '<details class="nav__services"><summary><span>' + label + '</span><i aria-hidden="true"></i></summary><div class="nav__services-menu">' + serviceLinks + '</div></details>';
  return group + items.map(function (item) { return '<a href="' + item[0] + '"' + (item[2] ? ' data-soon' : '') + '>' + item[1] + '</a>'; }).join('');
}
function renderNav() {
  var nav = $('#nav');
  nav.innerHTML = '<div class="nav__bar"><a class="brand" href="/" aria-label="VAK Marketing"><svg class="brand__mark" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13.2" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".55"/><path d="M4.6 21.2C9 15 23 15 27.4 21.2" fill="none" stroke="currentColor" stroke-width="1.1"/><path d="M4.6 10.8C9 17 23 17 27.4 10.8" fill="none" stroke="currentColor" stroke-width="1.1"/><circle cx="16" cy="16" r="2.1" fill="currentColor"/></svg><span class="brand__text">VAK <b>Marketing</b></span></a><nav class="nav__links" aria-label="' + (language === 'en' ? 'Primary navigation' : 'Основная навигация') + '">' + navLinks(false) + '</nav><div class="nav__side"><div class="lang" role="group" aria-label="' + (language === 'en' ? 'Language' : 'Язык / Language') + '"><button type="button" class="lang__b" data-lang="ru" aria-pressed="' + (language === 'ru') + '">RU</button><span class="lang__sep" aria-hidden="true"></span><button type="button" class="lang__b" data-lang="en" aria-pressed="' + (language === 'en') + '">EN</button></div><a class="btn btn--primary nav__cta" href="#consultation">' + (language === 'en' ? 'Book a consultation' : 'Получить консультацию') + '</a><button type="button" class="burger" id="burger" aria-expanded="false" aria-controls="menu" aria-label="' + (language === 'en' ? 'Menu' : 'Меню') + '"><span></span><span></span></button></div></div><div class="menu" id="menu" hidden><nav class="menu__links" aria-label="' + (language === 'en' ? 'Mobile navigation' : 'Мобильная навигация') + '">' + navLinks(true) + '</nav><a class="btn btn--primary" href="#consultation">' + (language === 'en' ? 'Book a consultation' : 'Получить консультацию') + '</a></div>';
  bindNav();
}
function bindNav() {
  var nav = $('#nav'), burger = $('#burger'), menu = $('#menu'), desktopServices = $('.nav__services', nav);
  function syncScroll() { nav.classList.toggle('is-stuck', window.scrollY > 18); }
  if (currentNavScrollHandler) window.removeEventListener('scroll', currentNavScrollHandler);
  currentNavScrollHandler = syncScroll;
  syncScroll(); window.addEventListener('scroll', currentNavScrollHandler, { passive:true });
  function closeServices() {
    if (!desktopServices) return;
    desktopServices.removeAttribute('open');
  }
  function menuFocusable() {
    return $$('a[href],button:not([disabled]),summary,[tabindex]:not([tabindex="-1"])', menu).filter(function (el) {
      var closed = el.closest('details:not([open])');
      return !closed || el.tagName === 'SUMMARY';
    });
  }
  if (desktopServices) {
    var servicesLeaveTimer;
    var servicesOpenedByHover = false;
    var servicesEnterEvent = window.PointerEvent ? 'pointerenter' : 'mouseenter';
    var servicesLeaveEvent = window.PointerEvent ? 'pointerleave' : 'mouseleave';
    function canUseServicesPointer(event) {
      return window.matchMedia('(min-width:1081px)').matches && (!event.pointerType || event.pointerType === 'mouse');
    }
    desktopServices.addEventListener(servicesEnterEvent, function (event) {
      if (!canUseServicesPointer(event)) return;
      clearTimeout(servicesLeaveTimer);
      if (!desktopServices.open) {
        desktopServices.open = true;
        servicesOpenedByHover = true;
      }
    });
    desktopServices.addEventListener(servicesLeaveEvent, function (event) {
      if (!canUseServicesPointer(event) || !servicesOpenedByHover) return;
      clearTimeout(servicesLeaveTimer);
      servicesLeaveTimer = setTimeout(function () {
        if (!servicesOpenedByHover) return;
        desktopServices.open = false;
        servicesOpenedByHover = false;
      }, 120);
    });
    var servicesSummary = desktopServices.querySelector('summary');
    if (servicesSummary) servicesSummary.addEventListener('click', function (event) {
      if (!canUseServicesPointer(event) || !servicesOpenedByHover || !desktopServices.open) return;
      event.preventDefault();
      servicesOpenedByHover = false;
    });
  }
  function close(restore) {
    if (menu.hidden) return;
    menu.hidden = true; burger.setAttribute('aria-expanded','false'); document.body.classList.remove('is-locked'); nav.classList.remove('is-open');
    if (restore) burger.focus();
  }
  burger.addEventListener('click', function () {
    var willOpen = menu.hidden;
    if (willOpen) { closeServices(); menu.hidden = false; burger.setAttribute('aria-expanded','true'); document.body.classList.add('is-locked'); nav.classList.add('is-open'); }
    else close(false);
  });
  menu.addEventListener('click', function (event) { if (event.target.closest('a')) close(false); });
  menu.addEventListener('keydown', function (event) {
    if (event.key !== 'Tab' || menu.hidden) return;
    var focusable = menuFocusable();
    if (!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  if (currentNavKeyHandler) window.removeEventListener('keydown', currentNavKeyHandler);
  currentNavKeyHandler = function (event) {
    if (event.key !== 'Escape') return;
    var openServices = desktopServices && desktopServices.open;
    closeServices();
    close(true);
    if (openServices && menu.hidden) {
      var summary = desktopServices.querySelector('summary');
      if (summary) summary.focus();
    }
  };
  window.addEventListener('keydown', currentNavKeyHandler);
  if (currentNavPointerHandler) document.removeEventListener('click', currentNavPointerHandler);
  currentNavPointerHandler = function (event) {
    if (desktopServices && desktopServices.open && !desktopServices.contains(event.target)) closeServices();
  };
  document.addEventListener('click', currentNavPointerHandler);
  if (currentNavResizeHandler) window.removeEventListener('resize', currentNavResizeHandler);
  currentNavResizeHandler = function () {
    if (!window.matchMedia('(max-width:1080px)').matches) close(false);
  };
  window.addEventListener('resize', currentNavResizeHandler, { passive:true });
  $$('.lang__b', nav).forEach(function (button) { button.addEventListener('click', function () { language = button.getAttribute('data-lang'); try { localStorage.setItem('vak-lang', language); } catch (e) {} render(copy()); }); });
}
function bindForm(cta) {
  var form = $('#spForm'); if (!form) return;
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var name = $('[name="name"]', form), email = $('[name="email"]', form), contact = $('[name="contact"]', form), note = $('.sp-form__note', form);
    var valid = Boolean(name.value.trim() && email.value.trim() && email.validity.valid && contact.value.trim());
    [name, email, contact].forEach(function (field) { field.setAttribute('aria-invalid', valid || (field.value.trim() && (field !== email || field.validity.valid)) ? 'false' : 'true'); });
    if (!valid) {
      note.textContent = language === 'en' ? 'Please enter your name, email and contact method.' : 'Укажите имя, email и способ связи.';
      return;
    }
    note.classList.add('is-ok'); note.textContent = cta.success; form.reset();
  });
}
function bindReveal() {
  if (currentRevealObserver) { currentRevealObserver.disconnect(); currentRevealObserver = null; }
  var nodes = $$('[data-sp-reveal]');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    nodes.forEach(function (node) { node.classList.add('is-in'); }); return;
  }
  currentRevealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) { if (entry.isIntersecting) { entry.target.classList.add('is-in'); currentRevealObserver.unobserve(entry.target); } });
  }, { rootMargin:'0px 0px -8% 0px', threshold:.08 });
  nodes.forEach(function (node) { currentRevealObserver.observe(node); });
}
function clearServiceFlowLayouts() {
  if (currentServiceFlowObserver) { currentServiceFlowObserver.disconnect(); currentServiceFlowObserver = null; }
  if (currentServiceFlowResizeHandler) { window.removeEventListener('resize', currentServiceFlowResizeHandler); currentServiceFlowResizeHandler = null; }
  if (currentServiceFlowFrame) {
    if (window.cancelAnimationFrame) window.cancelAnimationFrame(currentServiceFlowFrame);
    else clearTimeout(currentServiceFlowFrame);
    currentServiceFlowFrame = null;
  }
  currentServiceFlowTimers.forEach(function (timer) { clearTimeout(timer); });
  currentServiceFlowTimers = [];
}
function serviceFlowPort(rect, boardRect, name) {
  var port = SERVICE_FLOW_PORTS[name] || SERVICE_FLOW_PORTS.rc;
  var size = Math.min(rect.width, rect.height);
  var clearance = Math.max(12, Math.min(22, size * .16));
  var x = rect.left - boardRect.left + rect.width * port.x;
  var y = rect.top - boardRect.top + rect.height * port.y;
  return { x:x + port.nx * clearance, y:y + port.ny * clearance, nx:port.nx, ny:port.ny };
}
function serviceFlowPath(start, end, edge) {
  var distance = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
  var reach = Math.min(172, Math.max(52, distance * .31));
  var c1x = start.x + start.nx * reach;
  var c1y = start.y + start.ny * reach;
  var c2x = end.x - end.nx * reach;
  var c2y = end.y - end.ny * reach;
  var bend = reach * .42;
  if (edge.bend === 'left') { c1x -= bend; c2x -= bend; }
  if (edge.bend === 'right') { c1x += bend; c2x += bend; }
  if (edge.bend === 'top') { c1y -= bend; c2y -= bend; }
  if (edge.bend === 'bottom') { c1y += bend; c2y += bend; }
  function round(value) { return Math.round(value * 10) / 10; }
  return 'M' + round(start.x) + ' ' + round(start.y)
    + ' C' + round(c1x) + ' ' + round(c1y)
    + ' ' + round(c2x) + ' ' + round(c2y)
    + ' ' + round(end.x) + ' ' + round(end.y);
}
function drawServiceFlow(system) {
  var canvas = $('[data-sp-flow-canvas]', system);
  var layer = canvas && $('[data-sp-flow-layer]', canvas);
  var flow = system.getAttribute('data-sp-service-flow');
  var graph = SERVICE_FLOW_GRAPHS[flow];
  if (!canvas || !layer || !graph) return;
  if (!window.matchMedia('(min-width:1121px)').matches) { layer.innerHTML = ''; return; }
  var boardRect = system.getBoundingClientRect();
  var width = Math.round(boardRect.width), height = Math.round(boardRect.height);
  if (width < 2 || height < 2) { layer.innerHTML = ''; return; }
  canvas.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
  var prefix = 'sp-service-' + flow;
  layer.innerHTML = graph.edges.map(function (edge, index) {
    var source = $('[data-sp-flow-anchor="' + edge.from + '"]', system);
    var target = $('[data-sp-flow-anchor="' + edge.to + '"]', system);
    if (!source || !target) return '';
    var start = serviceFlowPort(source.getBoundingClientRect(), boardRect, edge.out);
    var end = serviceFlowPort(target.getBoundingClientRect(), boardRect, edge.into);
    var classes = 'sp-service-flow' + (edge.primary ? ' sp-service-flow--primary' : '');
    var style = '--sp-link-delay:' + (.12 + index * .1).toFixed(2) + 's;--sp-flow-opacity:' + edge.opacity;
    return '<path class="' + classes + '" pathLength="100" style="' + style + '" stroke="url(#' + prefix + '-' + edge.tone + ')" d="' + serviceFlowPath(start, end, edge) + '"/>';
  }).join('');
}
function scheduleServiceFlowLayout(systems) {
  if (currentServiceFlowFrame) {
    if (window.cancelAnimationFrame) window.cancelAnimationFrame(currentServiceFlowFrame);
    else clearTimeout(currentServiceFlowFrame);
  }
  var schedule = window.requestAnimationFrame || function (callback) { return setTimeout(callback, 16); };
  currentServiceFlowFrame = schedule(function () {
    currentServiceFlowFrame = null;
    systems.forEach(function (system) {
      if (document.documentElement.contains(system)) drawServiceFlow(system);
    });
  });
}
function scheduleServiceFlowSettle(system) {
  [120, 520, 1120].forEach(function (delay) {
    var timer = setTimeout(function () {
      if (document.documentElement.contains(system)) drawServiceFlow(system);
    }, delay);
    currentServiceFlowTimers.push(timer);
  });
}
function bindServiceFlowLayouts() {
  clearServiceFlowLayouts();
  if (isStrategy) return;
  var systems = $$('[data-sp-service-system]');
  if (!systems.length) return;
  var schedule = function () { scheduleServiceFlowLayout(systems); };
  schedule();
  if ('ResizeObserver' in window) {
    currentServiceFlowObserver = new ResizeObserver(schedule);
    systems.forEach(function (system) { currentServiceFlowObserver.observe(system); });
  } else {
    currentServiceFlowResizeHandler = schedule;
    window.addEventListener('resize', currentServiceFlowResizeHandler, { passive:true });
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { schedule(); });
  }
}
function bindDiagramExperience() {
  if (currentStrategyResizeHandler) { window.removeEventListener('resize', currentStrategyResizeHandler); currentStrategyResizeHandler = null; }
  if (currentStrategyFlowObserver) { currentStrategyFlowObserver.disconnect(); currentStrategyFlowObserver = null; }
  if (currentStrategyFlowFrame) { cancelAnimationFrame(currentStrategyFlowFrame); currentStrategyFlowFrame = null; }

  bindServiceFlowLayouts();

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var systems = $$('[data-sp-system],[data-sp-service-system]');
  if (currentDiagramObserver) { currentDiagramObserver.disconnect(); currentDiagramObserver = null; }
  if (systems.length) {
    if (reduced || !('IntersectionObserver' in window)) systems.forEach(function (system) {
      system.classList.add('is-assembled');
      if (system.hasAttribute('data-sp-service-system')) scheduleServiceFlowSettle(system);
    });
    else {
      var diagramObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-assembled');
          if (entry.target.hasAttribute('data-sp-service-system')) scheduleServiceFlowSettle(entry.target);
          diagramObserver.unobserve(entry.target);
        });
      }, { rootMargin:'0px 0px -14% 0px', threshold:.14 });
      currentDiagramObserver = diagramObserver;
      systems.forEach(function (system) { diagramObserver.observe(system); });
    }
  }
  if (!isStrategy) return;

  // Measure real text blocks: connectors must end beside their labels at
  // every width and in both languages, not at fixed SVG coordinates.
  var board = $('[data-sp-system]');
  function drawStrategyLinks() {
    currentStrategyFlowFrame = null;
    if (!board || !document.documentElement.contains(board)) return;
    var svg = $('.sp-strategy-system__links', board), layer = $('[data-strategy-links]', board);
    if (!window.matchMedia('(min-width:901px)').matches) { layer.innerHTML = ''; return; }
    var rect = board.getBoundingClientRect(), core = $('.sp-strategy-system__core', board).getBoundingClientRect();
    svg.setAttribute('viewBox', '0 0 ' + rect.width + ' ' + rect.height);
    var nodes = $$('.sp-strategy-system__node', board);
    nodes.forEach(function (node, i) {
      var box = node.getBoundingClientRect(), top = i < 3;
      var sx = core.left - rect.left + core.width * (top ? [.12,.5,.88][i] : [.08,.36,.64,.92][i - 3]);
      var sy = (top ? core.top : core.bottom) - rect.top + (top ? -8 : 8);
      var ex = box.left - rect.left + box.width * .5;
      var ey = (top ? box.bottom : box.top) - rect.top + (top ? 10 : -10);
      var direction = top ? -1 : 1;
      var reach = Math.max(28, Math.abs(ey - sy) * .65);
      var path = layer.children[i];
      if (!path) {
        path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'sp-flow');
        path.setAttribute('pathLength', '100');
        path.style.setProperty('--sp-link-delay', (.1 + i * .07) + 's');
        layer.appendChild(path);
      }
      path.setAttribute('d', 'M' + sx + ' ' + sy + ' C' + sx + ' ' + (sy + direction * reach) + ' ' + ex + ' ' + (ey - direction * reach) + ' ' + ex + ' ' + ey);
    });
  }
  function scheduleStrategyLinks() {
    if (currentStrategyFlowFrame) cancelAnimationFrame(currentStrategyFlowFrame);
    currentStrategyFlowFrame = requestAnimationFrame(drawStrategyLinks);
  }
  scheduleStrategyLinks();
  currentStrategyResizeHandler = scheduleStrategyLinks;
  window.addEventListener('resize', currentStrategyResizeHandler, { passive:true });
  if (board && 'ResizeObserver' in window) {
    currentStrategyFlowObserver = new ResizeObserver(scheduleStrategyLinks);
    currentStrategyFlowObserver.observe(board);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleStrategyLinks);
}

render(copy());
})();
