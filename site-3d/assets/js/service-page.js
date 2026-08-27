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
  ethereum: { src:'/assets/img/brands/clients/ethereum.svg', alt:'Ethereum' },
  huobi:    { src:'/assets/img/brands/cases/huobi-global.png', alt:'Huobi Global', wide:true },
  tornado:  { src:'/assets/img/brands/clients/tornado-cash.svg', alt:'Tornado Cash' },
  zenex:    { src:'/assets/img/brands/clients/zenex.svg', alt:'Zenex' },
  ghs:      { src:'/assets/img/brands/cases/1ghs.png', alt:'1GHS', wide:true },
  coinstore:{ src:'/assets/img/brands/media/coinstore.png', alt:'Coinstore' },
  cointelegraph:{ src:'/assets/img/logos/cointelegraph.svg', alt:'Cointelegraph', wide:true },
  yahoo:    { src:'/assets/img/logos/yahoo-finance.svg', alt:'Yahoo Finance', wide:true },
  forklog:  { src:'/assets/img/logos/forklog.svg', alt:'ForkLog', light:true },
  bits:     { src:'/assets/img/logos/bitsmedia.png', alt:'Bits.media', wide:true },
  beincrypto:{ src:'/assets/img/logos/beincrypto.svg', alt:'BeInCrypto', wide:true, light:true },
  coindesk: { src:'/assets/img/logos/coindesk.svg', alt:'CoinDesk', wide:true },
  theblock: { src:'/assets/img/brands/media/the-block.png', alt:'The Block' },
  benzinga: { src:'/assets/img/logos/benzinga.svg', alt:'Benzinga', wide:true },
  rbc:      { src:'/assets/img/brands/media/rbc-crypto.png', alt:'РБК Крипто', wide:true },
  cryptoru: { src:'/assets/img/brands/media/crypto-ru.png', alt:'Crypto.ru', wide:true }
};

var SERVICES = {
  strategy: {
    index:'01', photo:'/assets/img/services/web/strategy-photo-v1.jpg',
    ru:{
      meta:{ title:'Стратегия и комплексное ведение — VAK Marketing', desc:'Индивидуальная маркетинговая стратегия и комплексное ведение для проектов из iGaming, FinTech, Crypto, Web3 и B2B.' },
      crumb:'Маркетинговая система',
      hero:{ title:'Индивидуальная маркетинговая стратегия и реализация для вашего бизнеса', lead:'Собираем рабочую систему под задачу: исследование, позиционирование, каналы, запуск и аналитика находятся в одном контуре — без разрыва между планом и исполнением.', cta:'Получить консультацию', facts:[{value:'01',label:'центр ответственности вместо разрозненных подрядчиков'},{value:'8+',label:'лет работы со сложными рынками'}] },
      proof:{ label:'Почему это работает', title:'Не набор услуг, а последовательность решений', note:'Сначала фиксируем, что действительно влияет на задачу бизнеса. Затем подключаем только те направления, у которых есть понятная роль.', items:[
        ['Контекст до каналов','Разбираем нишу, цели, конкурентов и ограничения, чтобы не начинать с случайного набора активностей.'],
        ['Инструменты по задаче','PR, LinkedIn, SEO, контент и реклама подключаются тогда, когда решают конкретную часть воронки.'],
        ['Проверка гипотез','Тестируем сообщения, форматы и каналы; оставляем в работе то, что даёт измеримый сигнал.'],
        ['Один рабочий контур','Координируем внешние направления и работаем вместе с in-house-командой, если она есть.']
      ]},
      scope:{ label:'Рабочая карта', title:'Как собираем результат', note:'Стратегия не лежит в презентации: каждое решение переводится в конкретную задачу, владельца и ритм проверки.', items:[
        {title:'Рынок и исходная позиция', question:'Где лежит реальный спрос и какие ограничения нельзя игнорировать?', output:'Карта сегментов, конкурентов и факторов, которые влияют на решение клиента.'},
        {title:'Цель и критерии', question:'Какой бизнес-результат должен подтвердить, что движение идёт в нужную сторону?', output:'Цели, рабочие гипотезы, ключевые метрики и ритм сверки.'},
        {title:'Позиционирование', question:'Что именно бренд должен доказать рынку — и чем это будет подкреплено?', output:'Опорные сообщения, аргументы и логика коммуникации.'},
        {title:'Каналы', question:'Где у проекта есть право на внимание, а где не стоит тратить ресурс?', output:'Приоритет каналов и понятная роль каждого направления.'},
        {title:'Первая волна работы', question:'Что запускать сначала, чтобы быстрее получить сигнал, а не распылить команду?', output:'Последовательность задач, владельцы и точки запуска.'},
        {title:'Проверка гипотез', question:'Какие сообщения, форматы и каналы стоит проверить в реальном контексте?', output:'Матрица проверок и критерии, по которым решения остаются или снимаются.'},
        {title:'Корректировка', question:'Что усиливать, менять или останавливать после первых данных?', output:'Обновлённый приоритет задач и распределение ресурса.'},
        {title:'Рабочий ритм', question:'Как команде видеть картину целиком, а не отдельные отчёты?', output:'Короткая регулярная сводка, решения и следующий шаг.'}
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
      trust:{ title:'Проекты, с которыми работали', note:'Комплексное продвижение для проектов из crypto, fintech и iGaming.', logos:['ethereum','huobi','tornado','zenex','ghs'] },
      cta:{ title:'Обсудим, с чего начать', text:'Расскажите о бизнесе и цели. Предложим первую рабочую рамку: что исследовать, какие направления проверить и в какой последовательности двигаться.', button:'Отправить заявку', success:'Спасибо. Запрос принят — вернёмся с ответом.' }
    },
    en:{
      meta:{ title:'Strategy and full project management — VAK Marketing', desc:'A tailored marketing strategy and integrated delivery for iGaming, FinTech, Crypto, Web3 and B2B businesses.' },
      crumb:'Marketing system',
      hero:{ title:'A tailored marketing strategy and delivery model for your business', lead:'We assemble a working system around the task: research, positioning, channels, launch and analytics sit in one operating loop, without a gap between the plan and its delivery.', cta:'Book a consultation', facts:[{value:'01',label:'centre of responsibility instead of disconnected contractors'},{value:'8+',label:'years in complex markets'}] },
      proof:{ label:'Why it works', title:'Not a menu of services, but a sequence of decisions', note:'We first establish what actually affects the business goal, then bring in only the disciplines with a clear role.', items:[
        ['Context before channels','We examine the market, goals, competitors and constraints before choosing activities.'],
        ['Tools for the task','PR, LinkedIn, SEO, content and advertising are used when they solve a defined part of the funnel.'],
        ['Hypotheses under review','Messages, formats and channels are tested; only work with a measurable signal remains.'],
        ['One operating loop','We coordinate external disciplines and work alongside an in-house team when one is in place.']
      ]},
      scope:{ label:'Operating map', title:'How we build a result', note:'The strategy is not left in a deck: each decision becomes a concrete task, owner and review rhythm.', items:[
        {title:'Market and starting point', question:'Where is the real demand, and which constraints cannot be ignored?', output:'A map of segments, competitors and factors that influence the buyer’s decision.'},
        {title:'Objective and criteria', question:'Which business outcome will show that the work is moving in the right direction?', output:'Objectives, working hypotheses, key metrics and a review rhythm.'},
        {title:'Positioning', question:'What exactly must the brand prove to the market — and what will substantiate it?', output:'Core messages, evidence and a communication logic.'},
        {title:'Channels', question:'Where does the project have a right to attention, and where should resource not be spent?', output:'Channel priorities and a clear role for each workstream.'},
        {title:'First wave of work', question:'What should launch first to produce a signal rather than spread the team thin?', output:'Task sequence, owners and launch points.'},
        {title:'Hypothesis review', question:'Which messages, formats and channels should be checked in their real context?', output:'A validation matrix and criteria for keeping or stopping work.'},
        {title:'Adjustment', question:'What should be strengthened, changed or stopped after the first data?', output:'Updated priorities and resource allocation.'},
        {title:'Operating rhythm', question:'How does the team see one picture instead of isolated reports?', output:'A concise regular readout, decisions and the next move.'}
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
      trust:{ title:'Projects we have worked with', note:'Integrated marketing work for projects in crypto, fintech and iGaming.', logos:['ethereum','huobi','tornado','zenex','ghs'] },
      cta:{ title:'Let’s define the first move', text:'Tell us about the business and the goal. We will outline a useful first frame: what to research, which directions to test and in what sequence.', button:'Send request', success:'Thank you. Your request has been received.' }
    }
  },
  linkedin: {
    index:'02', photo:'/assets/img/services/web/linkedin-photo-v1.jpg',
    ru:{
      meta:{ title:'B2B-маркетинг и LinkedIn — VAK Marketing', desc:'LinkedIn как канал доверия, B2B-диалогов и квалифицированных лидов для сложных ниш.' },
      crumb:'B2B-маркетинг',
      hero:{ title:'LinkedIn как канал лидов для B2B-бизнеса и компаний со сложными рекламными ограничениями', lead:'Выстраиваем прямой путь к нужным людям: страница компании, профили команды, ICP, контент и точечный outreach работают как один разговор с рынком.', cta:'Получить консультацию', facts:[{value:'ICP',label:'сегментация по рынкам, ролям и задачам'},{value:'B2B',label:'диалоги с людьми, которые принимают решения'}] },
      proof:{ label:'Почему LinkedIn', title:'Там, где нужен доступ, а не громкий охват', note:'LinkedIn становится полезным не сам по себе, а когда профиль, контент и outreach собраны в единую логику.', items:[
        ['Работа при ограничениях','Органические и платные инструменты помогают там, где обычная реклама в соцсетях или поиске ограничена.'],
        ['Прямой выход к decision-makers','Команда находит и начинает диалог с теми, кто влияет на партнёрства и закупки.'],
        ['Охват без шума','Страница, профили и регулярная активность формируют видимость без ставки на случайный вирусный эффект.'],
        ['Система вместо разовой кампании','Каждый контакт квалифицируется и передаётся в продажи по понятному правилу.']
      ]},
      scope:{ label:'Инструменты', title:'Из страницы — в рабочий канал', note:'Собираем не поток шаблонных сообщений, а систему, в которой у каждого касания есть контекст и задача.', items:[
        'Оформление и развитие страницы компании','Контент-стратегия и регулярный постинг','Упаковка профилей менеджеров и фаундеров','Создание и ведение рабочих аккаунтов с нуля','Настройка ICP и сегментации аудитории','Поиск лидов через органику и Sales Navigator','Персонализированные outreach-сценарии','Квалификация и передача лидов в продажи'
      ]},
      diagram:{ label:'Рабочая связка', title:'От ICP до sales-команды', note:'Все четыре элемента должны быть согласованы; иначе даже хороший outreach выглядит как спам.', items:[
        ['ICP','Рынки, роли и сигналы готовности'],['Профиль','Страница и люди, которым доверяют'],['Диалог','Контент и персональное первое касание'],['Передача','Квалификация и следующий шаг в sales']
      ]},
      process:{ label:'Как проходит работа', title:'Понятный путь к квалифицированному диалогу', items:[
        ['Аудит','Разбираем текущую страницу и профили команды.'],
        ['Стратегия','Определяем ICP, аудиторию и контентные рубрики.'],
        ['Упаковка','Собираем страницу компании и профили менеджеров.'],
        ['Продвижение','Запускаем постинг, охват и точечный outreach.'],
        ['Лидогенерация','Находим и квалифицируем контакты через Sales Navigator и органические инструменты.'],
        ['Отчётность','Смотрим на охваты, диалоги, заявки и качество переданных лидов.']
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
      hero:{ title:'LinkedIn as a lead channel for B2B businesses with complex advertising restrictions', lead:'We build a direct path to the right people: company page, team profiles, ICP, content and focused outreach become one market conversation.', cta:'Book a consultation', facts:[{value:'ICP',label:'segmentation by markets, roles and tasks'},{value:'B2B',label:'conversations with the people who decide'}] },
      proof:{ label:'Why LinkedIn', title:'When access matters more than noisy reach', note:'LinkedIn works when profile, content and outreach are put into one coherent logic.', items:[
        ['Work under restrictions','Organic and paid tools remain useful where standard social or search advertising is restricted.'],
        ['Direct access to decision-makers','The team finds and opens conversations with people who influence partnerships and procurement.'],
        ['Reach without noise','A company page, credible profiles and consistent activity create visibility without betting on random virality.'],
        ['A system, not a campaign','Every contact is qualified and passed to sales through a clear rule.']
      ]},
      scope:{ label:'Tools', title:'From a page to a working channel', note:'We build a system in which every touchpoint has context and a purpose, not a stream of stock messages.', items:[
        'Company page setup and development','Content strategy and regular posting','Packaging of manager and founder profiles','Creation and management of working accounts','ICP and audience segmentation','Lead research through organic tools and Sales Navigator','Personalised outreach scenarios','Qualification and hand-off to sales'
      ]},
      diagram:{ label:'Operating chain', title:'From ICP to sales', note:'All four elements must agree. Without that, even good outreach reads as spam.', items:[
        ['ICP','Markets, roles and readiness signals'],['Profile','A page and people worth trusting'],['Conversation','Content and a personal first touch'],['Handover','Qualification and the next step with sales']
      ]},
      process:{ label:'How we work', title:'A clear route to qualified conversations', items:[
        ['Audit','We review the current page and team profiles.'],
        ['Strategy','We define ICP, audiences and content pillars.'],
        ['Packaging','We build the company page and manager profiles.'],
        ['Activation','We start posting, reach-building and focused outreach.'],
        ['Lead generation','We find and qualify contacts through Sales Navigator and organic tools.'],
        ['Reporting','We assess reach, conversations, requests and the quality of handed-over leads.']
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
    index:'03', photo:'/assets/img/services/web/pr-media-photo-v1.jpg',
    ru:{
      meta:{ title:'PR, СМИ и медиа — VAK Marketing', desc:'Публикации, интервью и экспертные материалы в профильных международных и СНГ-медиа.' },
      crumb:'PR и медиасеть',
      hero:{ title:'Публикации и позиции в медиа, которые укрепляют доверие к бренду', lead:'Подбираем издания, собираем материал и ведём размещение от брифа до ссылки и отчёта. Для рынка, партнёров, инвесторов и поисковой выдачи.', cta:'Обсудить публикацию', facts:[{value:'Tier 1–3',label:'международные и СНГ-медиа'},{value:'PR',label:'материал, площадка и контекст в одной логике'}] },
      proof:{ label:'Зачем PR', title:'Публикация должна работать дольше дня выхода', note:'Сильное размещение фиксирует позицию бренда в нескольких контурах: доверие, поиск, аудитория и будущие переговоры.', items:[
        ['Репутация','Публикации в известных изданиях помогают подтвердить статус компании для партнёров, инвесторов и клиентов.'],
        ['Поисковое присутствие','Упоминания в авторитетных СМИ поддерживают видимость бренда в поисковой выдаче.'],
        ['Новая аудитория','Проект появляется в поле зрения профильного сообщества и людей за пределами текущей базы.'],
        ['Новый трафик','Публикации и обзорные позиции создают дополнительные точки входа к продукту.']
      ]},
      scope:{ label:'Форматы', title:'Материал под конкретный повод', note:'Не ставим пресс-релиз туда, где нужна колонка, и не делаем рейтинг ради строчки в списке. Формат следует задаче и площадке.', items:[
        'Пресс-релизы','Интервью с фаундерами и топ-менеджерами','Экспертные статьи и авторские колонки','Обзорные и аналитические материалы о проекте','Комментарии для журналистов и упоминания в готовых материалах','Рейтинги и позиции в обзорных материалах ТОП-5 и ТОП-10'
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
        ['iGaming','Перед выходом на новый рынок или важным коммерческим этапом.'],
        ['FinTech и payments','Когда репутация имеет вес в разговоре с партнёрами и регуляторами.'],
        ['Crypto и Web3','Перед листингом, pre-sale, запуском или важной коммуникационной точкой.'],
        ['Фаундеры','Когда личная экспертность должна поддержать репутацию компании.']
      ]},
      trust:{ title:'Проекты, с которыми работали', note:'Публикации помогли усилить репутационный контур проектов из сложных цифровых отраслей.', logos:['ethereum','huobi','tornado','coinstore','zenex'] },
      cta:{ title:'Подберём медиа под вашу задачу', text:'Опишите повод, рынок и желаемый результат. Мы предложим формат, пул изданий и реалистичный маршрут размещения.', button:'Отправить заявку', success:'Спасибо. Запрос принят — вернёмся с ответом.' }
    },
    en:{
      meta:{ title:'PR, media and publications — VAK Marketing', desc:'Press releases, interviews and expert materials for specialist international and CIS media.' },
      crumb:'PR and media network',
      hero:{ title:'Media placements and rankings that strengthen brand trust', lead:'We select the outlets, shape the material and manage publication from brief to live link and report — for the market, partners, investors and search visibility.', cta:'Discuss a publication', facts:[{value:'Tier 1–3',label:'international and CIS media'},{value:'PR',label:'material, outlet and context in one logic'}] },
      proof:{ label:'Why PR', title:'A publication should work beyond its launch day', note:'A strong placement fixes the brand position across several contexts: trust, search, audience and future conversations.', items:[
        ['Reputation','Known outlets help validate company status for partners, investors and clients.'],
        ['Search presence','Authoritative mentions support brand visibility in search results.'],
        ['A new audience','The project enters the field of view of specialist communities and people beyond its existing base.'],
        ['New entry points','Publications and review positions create additional paths to the product.']
      ]},
      scope:{ label:'Formats', title:'Material for a specific occasion', note:'We do not put a press release where a column is needed or produce a ranking for a line in a list. Format follows the task and the outlet.', items:[
        'Press releases','Founder and executive interviews','Expert articles and authored columns','Project overview and analytical pieces','Comments for journalists and mentions in ready-made materials','TOP-5 and TOP-10 positions in review content'
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
        ['iGaming','Before entering a market or an important commercial phase.'],
        ['FinTech and payments','Where reputation matters in conversations with partners and regulators.'],
        ['Crypto and Web3','Before a listing, pre-sale, launch or significant communications moment.'],
        ['Founders','When personal expertise must support company reputation.']
      ]},
      trust:{ title:'Projects we have worked with', note:'Publications helped strengthen the reputational context of projects in complex digital sectors.', logos:['ethereum','huobi','tornado','coinstore','zenex'] },
      cta:{ title:'Let’s select media for the task', text:'Tell us about the occasion, market and desired outcome. We will suggest a format, outlet pool and realistic placement route.', button:'Send request', success:'Thank you. Your request has been received.' }
    }
  },
  seo: {
    index:'04', photo:'/assets/img/services/web/ai-seo-photo-v1.jpg',
    ru:{
      meta:{ title:'AI SEO и SERP — VAK Marketing', desc:'SEO-стратегия, техническая оптимизация, контент и аналитика для конкурентных ниш и разных гео.' },
      crumb:'AI SEO и SERP',
      hero:{ title:'SEO для конкурентных ниш, где важно понимать рынок, а не просто собирать ключи', lead:'Соединяем семантику, структуру сайта, техническую работу, контент и внешние факторы. AI-инструменты помогают быстрее анализировать материал и находить точки роста, но не заменяют стратегию.', cta:'Получить консультацию', facts:[{value:'SEO',label:'структура, контент и внешние сигналы в одной системе'},{value:'GEO',label:'работа с локальной спецификой поиска'}] },
      proof:{ label:'Подход', title:'Там, где обычный SEO-план заканчивается', note:'AI используем как рабочий инструмент анализа, а не как обещание автоматического результата.', items:[
        ['Быстрее анализ','Инструменты ускоряют разбор семантики, конкурентов и паттернов выдачи.'],
        ['Сложные отрасли','Учитываем специфику FinTech, iGaming и Crypto, где выше конкуренция и больше ограничений.'],
        ['Сложные запросы','Работаем с конкурентной семантикой и коммерческими кластерами, где поверхностной оптимизации мало.'],
        ['Разные гео','Адаптируем стратегию под локальную логику поиска и рынок продукта.']
      ]},
      scope:{ label:'Что входит в работу', title:'SEO как последовательная инженерная работа', note:'Каждая часть влияет на следующую: невозможно оценивать контент отдельно от структуры или ссылки отдельно от целевой страницы.', items:[
        'Аудит текущих позиций и конкурентного поля','Сбор и кластеризация семантического ядра','Оптимизация структуры сайта под поисковые запросы','Технический SEO-аудит и исправления','Контент-стратегия под ключевые кластеры','Линкбилдинг и работа с внешними факторами','Мониторинг позиций и аналитика динамики','Репутация бренда в поисковой выдаче — SERP'
      ]},
      diagram:{ label:'Контур работы', title:'Поиск видит не один элемент', note:'Структура, материал и внешние сигналы должны поддерживать одну коммерческую задачу.', items:[
        ['Семантика','Что и как ищет рынок'],['Структура','Куда ведёт поисковой запрос'],['Контент','Чем страница отвечает на намерение'],['SERP','Как бренд выглядит среди результатов']
      ]},
      process:{ label:'Как проходит работа', title:'От исходной позиции к управляемой динамике', items:[
        ['Аудит','Анализируем сайт, позиции и конкурентное поле.'],
        ['Стратегия','Формируем семантику, приоритеты и план продвижения.'],
        ['Оптимизация','Дорабатываем структуру, техническую часть и контент.'],
        ['Продвижение','Ведём работу над внешними факторами и контентными кластерами.'],
        ['Мониторинг','Отслеживаем динамику и корректируем решения на данных.'],
        ['Отчётность','Показываем изменения по ключевым направлениям и следующим действиям.']
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
      hero:{ title:'SEO for competitive sectors where market understanding matters more than a keyword list', lead:'We connect semantics, site structure, technical work, content and external factors. AI tools help us analyse material and find growth points faster; they do not replace strategy.', cta:'Book a consultation', facts:[{value:'SEO',label:'structure, content and external signals in one system'},{value:'GEO',label:'work with local search behaviour'}] },
      proof:{ label:'The approach', title:'Where a typical SEO plan stops', note:'We use AI as a practical analytical tool, not as a promise of an automatic result.', items:[
        ['Faster analysis','Tools speed up analysis of semantics, competitors and search-result patterns.'],
        ['Complex sectors','We account for FinTech, iGaming and Crypto specifics, where competition and constraints are higher.'],
        ['Complex queries','We work with competitive semantic clusters where superficial optimisation is not enough.'],
        ['Different geographies','We adapt the strategy to local search logic and the product market.']
      ]},
      scope:{ label:'What is included', title:'SEO as sequential engineering work', note:'Each part affects the next: content cannot be assessed apart from structure, nor links apart from their target pages.', items:[
        'Audit of current positions and competitor landscape','Keyword research and semantic clustering','Site structure optimisation for search intent','Technical SEO audit and fixes','Content strategy for priority clusters','Link building and external factors','Position monitoring and trend analysis','Brand reputation in search results — SERP'
      ]},
      diagram:{ label:'Working loop', title:'Search does not see one element', note:'Structure, material and external signals must support the same commercial task.', items:[
        ['Semantics','What the market searches and how'],['Structure','Where the query is taken'],['Content','How the page answers intent'],['SERP','How the brand appears among results']
      ]},
      process:{ label:'How we work', title:'From starting position to manageable movement', items:[
        ['Audit','We analyse the site, positions and competitive landscape.'],
        ['Strategy','We set semantic priorities and a promotion plan.'],
        ['Optimisation','We improve structure, technical foundation and content.'],
        ['Promotion','We develop external factors and content clusters.'],
        ['Monitoring','We track movement and adjust decisions through data.'],
        ['Reporting','We show change by priority direction and the next actions.']
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
    index:'06', photo:'/assets/img/services/web/localization-photo-v1.jpg',
    ru:{
      meta:{ title:'Translation & Localization Services — VAK Marketing', desc:'Перевод и локализация материалов для Crypto, FinTech, iGaming, Web3 и образовательных проектов.' },
      crumb:'Translation & Localization',
      hero:{ title:'Переводим и локализуем материалы для Crypto, FinTech, iGaming, Web3 и образовательных проектов', lead:'Работаем с профильной терминологией и контекстом рынка — не просто переносим слова из одного языка в другой.', cta:'Заказать перевод', facts:[{value:'50 000+',label:'выполненных заказов'},{value:'10+',label:'языковых комбинаций'}] },
      proof:{ label:'Почему выбирают нас', title:'Точность там, где цена ошибки высока', note:'Смысл материала, тональность бренда и отраслевые термины должны оставаться целыми и в новом языке.', items:[
        ['Сложные отрасли','8+ лет работы с текстами, где стандартного языкового знания недостаточно для точного результата.'],
        ['Понятная стоимость','От 7 USD за страницу; для постоянных клиентов предусмотрены условия повторной работы.'],
        ['Срочные задачи','Берём срочные заказы от двух часов, если объём и язык позволяют выдержать контроль качества.'],
        ['Профильный контекст','Blockchain, финансы, право и IT переводятся с пониманием предмета, а не через буквальную подстановку.']
      ]},
      scope:{ label:'Материалы и документы', title:'Что можно передать в работу', note:'Подготовим материал для международного рынка, внутреннего оборота или конкретного продукта — с нужным форматом на выходе.', items:[
        'Сайты и лендинги','Презентации, pitch decks и whitepapers','Статьи, пресс-релизы и PR-материалы','Юридические и нотариальные документы','Договоры и корпоративная документация','Дипломы, аттестаты, транскрипты и сертификаты','Приложения и продуктовые интерфейсы — UI/UX-локализация','Маркетинговые и рекламные материалы'
      ]},
      sectors:{ label:'Экспертиза', title:'Ниши, где термин нельзя угадывать', note:'Перед началом работы сверяем задачу, исходный контекст и требования к стилю. Это важнее любого шаблонного глоссария.', items:[
        ['Blockchain и crypto','Токены, биржи, кошельки, инфраструктура и продукты Web3.'],
        ['FinTech и payments','Платёжные системы, финансовые продукты и документация.'],
        ['iGaming','Операторы, платформы, партнёрские и B2B-сервисы.'],
        ['IT и SaaS','Продуктовые интерфейсы, документация и коммуникации.'],
        ['Право и нотариат','Договоры, корпоративные и юридические материалы.'],
        ['Образование','Дипломы, программы, аттестаты и академические документы.'],
        ['MLM','Материалы для международных сетей и внутренних команд.'],
        ['Туризм','Сервисы, маршруты и коммуникации для путешественников.']
      ]},
      pricing:{ label:'Языки и стоимость', title:'Прозрачная логика расчёта', note:'Более 10 языковых комбинаций. Перед стартом подтверждаем объём, формат, направление и срок — без скрытых наценок.', rows:[['ENG-RU-ENG','от 7 USD / страница'],['CN-RU-CN','от 8 USD / страница'],['Другие языковые комбинации','от 9 USD / страница']], notes:['Одна страница бесплатно для новых клиентов при заказе от 10 страниц.','Скидка 15% для постоянных клиентов с пятого заказа.'] },
      process:{ label:'Как работаем', title:'От документа к готовому материалу', items:[
        ['Заявка','Вы присылаете документ или короткий бриф на перевод.'],
        ['Оценка','Рассчитываем срок, стоимость и удобный формат сдачи.'],
        ['Перевод','Материал берёт специалист с профильной экспертизой в нужной нише.'],
        ['Проверка','Проводим вычитку и контроль терминологии.'],
        ['Сдача','Передаём готовый материал в нужном формате; срочные заказы обсуждаем отдельно.']
      ]},
      trust:{ title:'Проекты и отрасли, с которыми работали', note:'Международные blockchain-компании, образовательные, gaming- и IT-проекты. Показываем только марки с доступными оригинальными активами.', logos:['ethereum','huobi','tornado','coinstore','zenex','ghs'] },
      cta:{ title:'Рассчитаем перевод под ваш материал', text:'Пришлите документ или опишите задачу. Подберём специалиста с нужной экспертизой и уточним срок, формат и стоимость.', button:'Отправить заявку', success:'Спасибо. Запрос принят — вернёмся с ответом.' }
    },
    en:{
      meta:{ title:'Translation and Localization Services — VAK Marketing', desc:'Translation and localisation for Crypto, FinTech, iGaming, Web3 and education projects.' },
      crumb:'Translation and localisation',
      hero:{ title:'Translation and localisation for Crypto, FinTech, iGaming, Web3 and education projects', lead:'We work with industry terminology and market context; we do not simply move words from one language to another.', cta:'Request a translation', facts:[{value:'50,000+',label:'completed orders'},{value:'10+',label:'language combinations'}] },
      proof:{ label:'Why clients choose us', title:'Accuracy where the cost of error is high', note:'The material’s meaning, brand voice and specialist terms must remain intact in the new language.', items:[
        ['Complex sectors','8+ years working with texts where language knowledge alone is not enough for an accurate outcome.'],
        ['Clear pricing','From USD 7 per page, with repeat-client terms for ongoing work.'],
        ['Urgent tasks','We accept urgent orders from two hours when volume and language allow a quality-control pass.'],
        ['Subject context','Blockchain, finance, law and IT are translated with subject knowledge, not literal substitution.']
      ]},
      scope:{ label:'Materials and documents', title:'What you can send to us', note:'We prepare material for an international market, internal use or a specific product, in the format needed at handover.', items:[
        'Websites and landing pages','Presentations, pitch decks and white papers','Articles, press releases and PR material','Legal and notarial documents','Contracts and corporate documentation','Diplomas, transcripts, certificates and educational documents','Applications and product interfaces — UI/UX localisation','Marketing and advertising materials'
      ]},
      sectors:{ label:'Subject expertise', title:'Fields where a term cannot be guessed', note:'Before work begins, we confirm the task, source context and style requirements. That matters more than a generic glossary.', items:[
        ['Blockchain and crypto','Tokens, exchanges, wallets, infrastructure and Web3 products.'],
        ['FinTech and payments','Payment systems, financial products and documentation.'],
        ['iGaming','Operators, platforms, affiliate and B2B services.'],
        ['IT and SaaS','Product interfaces, documentation and communications.'],
        ['Law and notarial work','Contracts, corporate and legal materials.'],
        ['Education','Diplomas, programmes, certificates and academic documents.'],
        ['MLM','Materials for international networks and internal teams.'],
        ['Travel','Services, routes and traveller communications.']
      ]},
      pricing:{ label:'Languages and pricing', title:'A transparent calculation', note:'More than ten language combinations. Before starting, we confirm volume, format, direction and timing with no hidden markup.', rows:[['ENG-RU-ENG','from USD 7 / page'],['CN-RU-CN','from USD 8 / page'],['Other language combinations','from USD 9 / page']], notes:['One page free for new clients on orders of ten pages or more.','15% discount for returning clients from the fifth order.'] },
      process:{ label:'How we work', title:'From document to a finished material', items:[
        ['Request','You send the document or a short translation brief.'],
        ['Estimate','We calculate timing, cost and handover format.'],
        ['Translation','The material is handled by a specialist with the relevant sector experience.'],
        ['Review','We edit and check terminology.'],
        ['Handover','We deliver the finished material in the required format; urgent orders are scoped separately.']
      ]},
      trust:{ title:'Projects and sectors we have worked with', note:'International blockchain companies, education, gaming and IT projects. We show only brands for which original assets are available.', logos:['ethereum','huobi','tornado','coinstore','zenex','ghs'] },
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
var number = function (n) { return String(n + 1).padStart(2, '0'); };
var currentNavScrollHandler = null;
var currentNavKeyHandler = null;
var currentRevealObserver = null;
var currentStrategyObserver = null;
var currentStrategyResizeHandler = null;

function linkArrow(label, href, extra) {
  return '<a class="' + (extra || 'link-arrow') + '" href="' + esc(href) + '">' + esc(label) + '<i></i></a>';
}
function photoAlt() {
  return language === 'en' ? 'VAK Marketing service visual' : 'Визуальный материал VAK Marketing';
}
function renderHero(d) {
  var visualClass = 'sp-hero__visual' + (isStrategy ? ' sp-hero__visual--strategy' : '');
  var depthOpen = isStrategy ? '<div class="sp-hero__depth-stage" data-strategy-depth>' : '';
  var depthClose = isStrategy ? '</div>' : '';
  var planes = isStrategy ? '<i class="sp-hero__plane sp-hero__plane--back" aria-hidden="true"></i><i class="sp-hero__plane sp-hero__plane--mid" aria-hidden="true"></i><i class="sp-hero__plane sp-hero__plane--front" aria-hidden="true"></i><i class="sp-hero__markers" aria-hidden="true"></i>' : '';
  var strategyCred = language === 'en'
    ? 'More than eight years working with complex iGaming, FinTech, Crypto and B2B markets.'
    : 'Более восьми лет работаем со сложными рынками iGaming, FinTech, Crypto и B2B.';
  var facts = isStrategy
    ? '<p class="sp-hero__cred">' + esc(strategyCred) + '</p>'
    : '<div class="sp-hero__facts">' + d.hero.facts.map(function (fact) {
        return '<div class="sp-hero__fact"><b>' + esc(fact.value) + '</b><span>' + esc(fact.label) + '</span></div>';
      }).join('') + '</div>';
  return '<section class="sp-hero"><div class="wrap sp-hero__grid">'
    + '<div class="sp-hero__copy" data-sp-reveal>'
    + '<p class="sp-kicker">' + (isStrategy ? esc(d.crumb) : esc(service.index) + ' / ' + esc(d.crumb)) + '</p>'
    + '<h1 class="sp-title">' + esc(d.hero.title) + '</h1>'
    + '<p class="sp-lead">' + esc(d.hero.lead) + '</p>'
    + '<div class="sp-hero__actions"><a class="btn btn--primary" href="#consultation">' + esc(d.hero.cta) + '</a>'
    + linkArrow(language === 'en' ? 'Back to services' : 'Все услуги', '/#services') + '</div>'
    + facts + '</div>'
    + '<div class="' + visualClass + '" data-sp-reveal style="--sp-delay:.10s">' + depthOpen + planes + '<div class="sp-hero__photo"><img src="' + service.photo + '" alt="' + photoAlt() + '" fetchpriority="high"></div>'
    + '<div class="sp-hero__trace"></div><div class="sp-hero__index"><b>' + esc(service.index) + '</b><span>VAK Marketing</span></div>' + depthClose + '</div>'
    + '</div></section>';
}
function renderStrategyProof(section) {
  return '<section class="sp-section sp-section--rule sp-decision-section"><div class="wrap">'
    + '<div class="sp-decision-frame" data-sp-reveal><div class="sp-decision-frame__intro"><p>' + esc(section.label) + '</p><h2>' + esc(section.title) + '</h2><span>' + esc(section.note) + '</span></div>'
    + '<div class="sp-decision-frame__route" aria-hidden="true"><i></i><i></i><i></i><i></i></div>'
    + '<ol class="sp-decision-frame__items">' + section.items.map(function (item, i) {
      return '<li class="sp-decision-frame__item" style="--sp-item-delay:' + (i * .08) + 's"><span>' + number(i) + '</span><h3>' + esc(item[0]) + '</h3><p>' + esc(item[1]) + '</p></li>';
    }).join('') + '</ol></div></div></section>';
}
function renderStrategyScope(section) {
  var first = section.items[0];
  var question = language === 'en' ? 'Question we answer' : 'Вопрос, на который отвечаем';
  var output = language === 'en' ? 'What remains in the work' : 'Что остаётся в работе';
  return '<section class="sp-section sp-strategy-scope-section"><div class="wrap"><div class="sp-strategy-scope">'
    + '<div class="sp-strategy-scope__intro" data-sp-reveal><p>' + esc(section.label) + '</p><h2>' + esc(section.title) + '</h2><span>' + esc(section.note) + '</span></div>'
    + '<div class="sp-strategy-scope__body" data-sp-reveal style="--sp-delay:.05s"><ol class="sp-strategy-scope__list">' + section.items.map(function (item, i) {
      var active = i === 0;
      return '<li class="sp-strategy-scope__item' + (active ? ' is-active' : '') + '" style="--sp-item-delay:' + (i * .055) + 's"><button type="button" class="sp-strategy-scope__button" data-strategy-scope-step data-question="' + esc(item.question) + '" data-output="' + esc(item.output) + '" aria-pressed="' + active + '"><span class="sp-strategy-scope__num">' + number(i) + '</span><span class="sp-strategy-scope__title">' + esc(item.title) + '</span><i aria-hidden="true"></i></button><p class="sp-strategy-scope__mobile-output" aria-hidden="' + (!active) + '">' + esc(item.output) + '</p></li>';
    }).join('') + '</ol><aside class="sp-strategy-scope__detail" id="strategyScopeDetail" aria-live="polite"><span>' + esc(question) + '</span><h3>' + esc(first.question) + '</h3><span>' + esc(output) + '</span><p>' + esc(first.output) + '</p></aside></div></div></div></section>';
}
function renderStrategySystem(section) {
  var core = language === 'en' ? 'Business<br>objective' : 'Задача<br>бизнеса';
  var sub = language === 'en' ? 'aligns the work' : 'собирает работу';
  return '<section class="sp-section sp-section--tight sp-section--rule sp-strategy-system-section"><div class="wrap">'
    + '<div class="sp-strategy-system__head" data-sp-reveal><p>' + esc(section.label) + '</p><h2>' + esc(section.title) + '</h2><span>' + esc(section.note) + '</span></div>'
    + '<div class="sp-strategy-system" data-sp-system data-sp-reveal style="--sp-delay:.04s"><div class="sp-strategy-system__field" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="sp-strategy-system__core"><strong>' + core + '</strong><span>' + esc(sub) + '</span></div><ol class="sp-strategy-system__nodes">' + section.items.map(function (item, i) {
      return '<li class="sp-strategy-system__node" style="--sp-item-delay:' + (i * .07) + 's"><span>' + number(i) + '</span><h3>' + esc(item[0]) + '</h3><p>' + esc(item[1]) + '</p></li>';
    }).join('') + '</ol></div></div></section>';
}
function renderStrategyProcess(section) {
  var phases = language === 'en'
    ? [['Define', 'Immersion and the direction of work'], ['Operate', 'Launch and review in the real market'], ['Adapt', 'Optimisation and the next expansion']]
    : [['Диагностика', 'Погружение и выбор направления'], ['Работа', 'Запуск и проверка на реальном рынке'], ['Корректировка', 'Оптимизация и следующее расширение']];
  return '<section class="sp-section sp-section--rule sp-strategy-cycle-section"><div class="wrap"><div class="sp-strategy-cycle__head" data-sp-reveal><p>' + esc(section.label) + '</p><h2>' + esc(section.title) + '</h2></div>'
    + '<ol class="sp-strategy-cycle" data-sp-reveal style="--sp-delay:.05s">' + phases.map(function (phase, i) {
      var steps = section.items.slice(i * 2, i * 2 + 2);
      return '<li class="sp-strategy-cycle__phase' + (i === 0 ? ' is-open' : '') + '" style="--sp-item-delay:' + (i * .11) + 's"><button type="button" class="sp-strategy-cycle__trigger" data-strategy-cycle-trigger aria-expanded="' + (i === 0) + '" aria-controls="strategyCycle' + i + '"><span>' + number(i) + '</span><strong>' + esc(phase[0]) + '</strong><i aria-hidden="true"></i></button><div class="sp-strategy-cycle__panel" id="strategyCycle' + i + '" aria-hidden="' + (i !== 0) + '"><div class="sp-strategy-cycle__panel-inner"><p>' + esc(phase[1]) + '</p><ol>' + steps.map(function (item, n) { return '<li><span>' + number(i * 2 + n) + '</span><div><h3>' + esc(item[0]) + '</h3><p>' + esc(item[1]) + '</p></div></li>'; }).join('') + '</ol></div></div></li>';
    }).join('') + '</ol></div></section>';
}
function renderStrategyGate(section) {
  var caveat = language === 'en'
    ? 'This format does not replace a product, sales discipline or management decisions. It creates a practical marketing frame around them.'
    : 'Этот формат не подменяет продукт, продажи или управленческие решения. Он создаёт вокруг них рабочую маркетинговую рамку.';
  return '<section class="sp-section sp-strategy-gate-section"><div class="wrap"><div class="sp-strategy-gate" data-sp-reveal><div class="sp-strategy-gate__intro"><p>' + esc(section.label) + '</p><h2>' + esc(section.title) + '</h2><span>' + esc(section.note) + '</span><aside>' + esc(caveat) + '</aside></div><ol class="sp-strategy-gate__items">' + section.items.map(function (item, i) {
      return '<li style="--sp-item-delay:' + (i * .075) + 's"><span>' + number(i) + '</span><h3>' + esc(item[0]) + '</h3><p>' + esc(item[1]) + '</p></li>';
    }).join('') + '</ol></div></div></section>';
}
function renderHead(section) {
  return '<div class="sp-head" data-sp-reveal><div><span class="sp-head__label">' + esc(section.label) + '</span><h2>' + esc(section.title) + '</h2></div>'
    + (section.note ? '<p class="sp-head__note">' + esc(section.note) + '</p>' : '') + '</div>';
}
function renderProof(section) {
  if (isStrategy) return renderStrategyProof(section);
  return '<section class="sp-section sp-section--rule"><div class="wrap">' + renderHead(section)
    + '<div class="sp-proof" data-sp-reveal style="--sp-delay:.06s">' + section.items.map(function (item, i) {
      return '<article class="sp-proof__item"><span class="sp-proof__num">' + number(i) + '</span><h3>' + esc(item[0]) + '</h3><p>' + esc(item[1]) + '</p></article>';
    }).join('') + '</div></div></section>';
}
function renderScope(section) {
  if (isStrategy) return renderStrategyScope(section);
  return '<section class="sp-section"><div class="wrap sp-scope"><div class="sp-scope__intro" data-sp-reveal><p class="sp-caption">' + esc(section.label) + '</p><h2>' + esc(section.title) + '</h2>'
    + (section.note ? '<p>' + esc(section.note) + '</p>' : '') + '</div><ol class="sp-index" data-sp-reveal style="--sp-delay:.06s">'
    + section.items.map(function (item) { return '<li class="sp-index__item"><span>' + esc(item) + '</span></li>'; }).join('')
    + '</ol></div></section>';
}
function renderDiagram(section) {
  if (isStrategy) return renderStrategySystem(section);
  return '<section class="sp-section sp-section--tight sp-section--rule"><div class="wrap">' + renderHead(section)
    + '<div class="sp-diagram sp-diagram--items-' + section.items.length + '" data-sp-reveal style="--sp-delay:.04s"><div class="sp-diagram__items">'
    + section.items.map(function (item) { return '<article class="sp-diagram__item"><i class="sp-diagram__dot"></i><h3>' + esc(item[0]) + '</h3><p>' + esc(item[1]) + '</p></article>'; }).join('')
    + '</div></div></div></section>';
}
function renderProcess(section) {
  if (isStrategy) return renderStrategyProcess(section);
  return '<section class="sp-section sp-section--rule"><div class="wrap">' + renderHead(section)
    + '<ol class="sp-process" data-sp-reveal style="--sp-delay:.05s">' + section.items.map(function (item, i) {
      return '<li class="sp-process__item"><span class="sp-process__num">' + number(i) + '</span><h3>' + esc(item[0]) + '</h3><p>' + esc(item[1]) + '</p></li>';
    }).join('') + '</ol></div></section>';
}
function renderSectors(section, modifier) {
  if (isStrategy && !modifier) return renderStrategyGate(section);
  return '<section class="sp-section' + (modifier ? ' ' + modifier : '') + '"><div class="wrap">' + renderHead(section)
    + '<div class="sp-sectors" data-sp-reveal style="--sp-delay:.05s">' + section.items.map(function (item, i) {
      return '<article class="sp-sector"><span class="sp-sector__tag">' + number(i) + '</span><h3>' + esc(item[0]) + '</h3><p>' + esc(item[1]) + '</p></article>';
    }).join('') + '</div></div></section>';
}
function renderPricing(section) {
  return '<section class="sp-section sp-section--rule"><div class="wrap sp-pricing"><div class="sp-pricing__copy" data-sp-reveal><p class="sp-caption">' + esc(section.label) + '</p><h2>' + esc(section.title) + '</h2><p>' + esc(section.note) + '</p></div>'
    + '<div data-sp-reveal style="--sp-delay:.06s"><table class="sp-price-table"><thead><tr><th>' + (language === 'en' ? 'Combination' : 'Комбинация') + '</th><th>' + (language === 'en' ? 'Price' : 'Цена') + '</th></tr></thead><tbody>'
    + section.rows.map(function (row) { return '<tr><td>' + esc(row[0]) + '</td><td>' + esc(row[1]) + '</td></tr>'; }).join('') + '</tbody></table>'
    + '<ul class="sp-pricing__notes">' + section.notes.map(function (note) { return '<li class="sp-pricing__note">' + esc(note) + '</li>'; }).join('') + '</ul></div></div></section>';
}
function renderLogo(keyName, media) {
  var logo = LOGOS[keyName];
  if (!logo) return '';
  return '<div class="sp-logo' + (media ? ' sp-logo--media' : '') + (logo.wide ? ' sp-logo--wide' : '') + (logo.light ? ' sp-logo--light' : '') + '"><img src="' + esc(logo.src) + '" alt="' + esc(logo.alt) + '" loading="lazy" decoding="async"></div>';
}
function renderMedia(section) {
  return '<section class="sp-trust"><div class="wrap"><div class="sp-trust__head" data-sp-reveal><div><p class="sp-caption">' + esc(section.label) + '</p><h2>' + esc(section.title) + '</h2></div><p>' + esc(section.note) + '</p></div>'
    + '<div class="sp-logo-grid" style="--logo-columns:5;--sp-delay:.06s" data-sp-reveal>' + section.logos.map(function (logo) { return renderLogo(logo, true); }).join('') + '</div>'
    + '<a class="sp-media-cta" href="#consultation">' + esc(section.action) + '</a></div></section>';
}
function renderTrust(section) {
  return '<section class="sp-trust' + (isStrategy ? ' sp-trust--strategy' : '') + '"><div class="wrap"><div class="sp-trust__head" data-sp-reveal><div><p class="sp-caption">' + (language === 'en' ? 'Trust' : 'Доверие') + '</p><h2>' + esc(section.title) + '</h2></div><p>' + esc(section.note) + '</p></div>'
    + '<div class="sp-logo-grid sp-logo-grid--free" style="--logo-columns:' + Math.min(5, section.logos.length) + ';--sp-delay:.06s" data-sp-reveal>' + section.logos.map(function (logo) { return renderLogo(logo, false); }).join('') + '</div></div></section>';
}
function renderCta(section) {
  return '<section class="sp-cta' + (isStrategy ? ' sp-cta--strategy' : '') + '" id="consultation"><div class="wrap sp-cta__grid"><div class="sp-cta__copy" data-sp-reveal><p class="sp-caption">' + (language === 'en' ? 'Consultation' : 'Консультация') + '</p><h2>' + esc(section.title) + '</h2><p>' + esc(section.text) + '</p></div>'
    + '<form class="sp-form" id="spForm" data-sp-reveal style="--sp-delay:.08s" novalidate><div class="sp-form__row"><label class="sp-field"><span>' + (language === 'en' ? 'Name' : 'Имя') + '</span><input name="name" autocomplete="name" required></label><label class="sp-field"><span>' + (language === 'en' ? 'Email / Telegram' : 'Email / Telegram') + '</span><input name="contact" autocomplete="email" required></label></div><input type="hidden" name="service" value="' + esc(key) + '"><p class="sp-form__note" aria-live="polite"></p><button class="btn btn--primary" type="submit">' + esc(section.button) + '</button></form></div></section>';
}
function renderFooter() {
  return '<div class="wrap"><div class="sp-foot__top"><a class="brand" href="/" aria-label="VAK Marketing"><svg class="brand__mark" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13.2" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".55"/><path d="M4.6 21.2C9 15 23 15 27.4 21.2" fill="none" stroke="currentColor" stroke-width="1.1"/><path d="M4.6 10.8C9 17 23 17 27.4 10.8" fill="none" stroke="currentColor" stroke-width="1.1"/><circle cx="16" cy="16" r="2.1" fill="currentColor"/></svg><span class="brand__text">VAK <b>Marketing</b></span></a><p class="sp-foot__copy">' + esc(language === 'en' ? 'Marketing, PR and B2B communications for complex markets.' : 'Маркетинг, PR и B2B-коммуникации для сложных рынков.') + '</p><nav class="sp-foot__links" aria-label="' + (language === 'en' ? 'Footer navigation' : 'Навигация в подвале') + '"><a href="/#services">' + (language === 'en' ? 'Services' : 'Услуги') + '</a><a href="/#cases">' + (language === 'en' ? 'Cases' : 'Кейсы') + '</a><a href="/#team">' + (language === 'en' ? 'Team' : 'Команда') + '</a><a href="/#contact">' + (language === 'en' ? 'Contacts' : 'Контакты') + '</a></nav></div><div class="sp-foot__bottom"><span>© ' + new Date().getFullYear() + ' VAK Marketing</span><a href="/">' + (language === 'en' ? 'Back to the main page' : 'На главную') + '</a></div></div>';
}

function render(d) {
  document.documentElement.lang = language;
  document.title = d.meta.title;
  var desc = $('meta[name="description"]'); if (desc) desc.setAttribute('content', d.meta.desc);
  var ogTitle = $('meta[property="og:title"]'); if (ogTitle) ogTitle.setAttribute('content', d.meta.title);
  var ogDesc = $('meta[property="og:description"]'); if (ogDesc) ogDesc.setAttribute('content', d.meta.desc);

  $('#main').innerHTML = renderHero(d) + renderProof(d.proof) + renderScope(d.scope)
    + (d.diagram ? renderDiagram(d.diagram) : '') + (d.pricing ? renderPricing(d.pricing) : '')
    + (d.media ? renderMedia(d.media) : '') + renderProcess(d.process)
    + (d.sectors ? renderSectors(d.sectors) : '') + (d.outcomes ? renderSectors(d.outcomes, 'sp-section--rule') : '')
    + (d.trust ? renderTrust(d.trust) : '') + renderCta(d.cta);
  $('#footer').innerHTML = renderFooter();
  renderNav();
  bindForm(d.cta);
  bindReveal();
  bindStrategyExperience();
}

/* ---------- Navigation and interactions -------------------------------- */
function navLinks(mobile) {
  var items = [
    ['/#services', language === 'en' ? 'Services' : 'Услуги'],
    ['/#cases', language === 'en' ? 'Cases' : 'Кейсы'],
    ['/#clients', language === 'en' ? 'Clients' : 'Клиенты'],
    ['/#team', language === 'en' ? 'Team' : 'Команда'],
    ['/#about', language === 'en' ? 'About' : 'О нас'],
    ['/#contact', language === 'en' ? 'Contacts' : 'Контакты']
  ];
  return items.map(function (item) { return '<a href="' + item[0] + '">' + item[1] + '</a>'; }).join('');
}
function renderNav() {
  var nav = $('#nav');
  nav.innerHTML = '<div class="nav__bar"><a class="brand" href="/" aria-label="VAK Marketing"><svg class="brand__mark" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13.2" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".55"/><path d="M4.6 21.2C9 15 23 15 27.4 21.2" fill="none" stroke="currentColor" stroke-width="1.1"/><path d="M4.6 10.8C9 17 23 17 27.4 10.8" fill="none" stroke="currentColor" stroke-width="1.1"/><circle cx="16" cy="16" r="2.1" fill="currentColor"/></svg><span class="brand__text">VAK <b>Marketing</b></span></a><nav class="nav__links" aria-label="' + (language === 'en' ? 'Primary navigation' : 'Основная навигация') + '">' + navLinks(false) + '</nav><div class="nav__side"><div class="lang" role="group" aria-label="Language"><button type="button" class="lang__b" data-lang="ru" aria-pressed="' + (language === 'ru') + '">RU</button><span class="lang__sep" aria-hidden="true"></span><button type="button" class="lang__b" data-lang="en" aria-pressed="' + (language === 'en') + '">EN</button></div><a class="btn btn--primary nav__cta" href="#consultation">' + (language === 'en' ? 'Book a consultation' : 'Получить консультацию') + '</a><button type="button" class="burger" id="burger" aria-expanded="false" aria-controls="menu" aria-label="' + (language === 'en' ? 'Menu' : 'Меню') + '"><span></span><span></span></button></div></div><div class="menu" id="menu" hidden><nav class="menu__links" aria-label="' + (language === 'en' ? 'Mobile navigation' : 'Мобильная навигация') + '">' + navLinks(true) + '</nav><a class="btn btn--primary" href="#consultation">' + (language === 'en' ? 'Book a consultation' : 'Получить консультацию') + '</a></div>';
  bindNav();
}
function bindNav() {
  var nav = $('#nav'), burger = $('#burger'), menu = $('#menu');
  function syncScroll() { nav.classList.toggle('is-stuck', window.scrollY > 18); }
  if (currentNavScrollHandler) window.removeEventListener('scroll', currentNavScrollHandler);
  currentNavScrollHandler = syncScroll;
  syncScroll(); window.addEventListener('scroll', currentNavScrollHandler, { passive:true });
  function close(restore) {
    if (menu.hidden) return;
    menu.hidden = true; burger.setAttribute('aria-expanded','false'); document.body.classList.remove('is-locked'); nav.classList.remove('is-open');
    if (restore) burger.focus();
  }
  burger.addEventListener('click', function () {
    var willOpen = menu.hidden;
    if (willOpen) { menu.hidden = false; burger.setAttribute('aria-expanded','true'); document.body.classList.add('is-locked'); nav.classList.add('is-open'); }
    else close(false);
  });
  menu.addEventListener('click', function (event) { if (event.target.closest('a')) close(false); });
  if (currentNavKeyHandler) window.removeEventListener('keydown', currentNavKeyHandler);
  currentNavKeyHandler = function (event) { if (event.key === 'Escape') close(true); };
  window.addEventListener('keydown', currentNavKeyHandler);
  $$('.lang__b', nav).forEach(function (button) { button.addEventListener('click', function () { language = button.getAttribute('data-lang'); try { localStorage.setItem('vak-lang', language); } catch (e) {} render(copy()); }); });
}
function bindForm(cta) {
  var form = $('#spForm'); if (!form) return;
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var name = $('[name="name"]', form), contact = $('[name="contact"]', form), note = $('.sp-form__note', form);
    if (!name.value.trim() || !contact.value.trim()) {
      note.textContent = language === 'en' ? 'Please enter your name and a contact method.' : 'Укажите имя и способ связи.';
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
function bindStrategyExperience() {
  document.body.classList.remove('sp--strategy-ready');
  if (currentStrategyResizeHandler) { window.removeEventListener('resize', currentStrategyResizeHandler); currentStrategyResizeHandler = null; }
  if (!isStrategy) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var system = $('[data-sp-system]');
  if (currentStrategyObserver) { currentStrategyObserver.disconnect(); currentStrategyObserver = null; }
  if (system) {
    if (reduced || !('IntersectionObserver' in window)) system.classList.add('is-assembled');
    else {
      currentStrategyObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-assembled');
          currentStrategyObserver.unobserve(entry.target);
        });
      }, { rootMargin:'0px 0px -14% 0px', threshold:.14 });
      currentStrategyObserver.observe(system);
    }
  }

  var scopeButtons = $$('[data-strategy-scope-step]');
  var scopeDetail = $('#strategyScopeDetail');
  function syncScopeAccessibility() {
    var useMobileOutput = window.matchMedia('(max-width: 760px)').matches;
    scopeButtons.forEach(function (item) {
      var mobileOutput = $('.sp-strategy-scope__mobile-output', item.parentElement);
      if (mobileOutput) mobileOutput.setAttribute('aria-hidden', useMobileOutput && item.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    });
  }
  function activateScope(button) {
    if (!button || !scopeDetail) return;
    scopeButtons.forEach(function (item) {
      var active = item === button;
      item.setAttribute('aria-pressed', active ? 'true' : 'false');
      item.parentElement.classList.toggle('is-active', active);
    });
    var question = $('h3', scopeDetail), output = $('p', scopeDetail);
    if (question) question.textContent = button.getAttribute('data-question') || '';
    if (output) output.textContent = button.getAttribute('data-output') || '';
    syncScopeAccessibility();
  }
  scopeButtons.forEach(function (button) { button.addEventListener('click', function () { activateScope(button); }); });
  syncScopeAccessibility();
  currentStrategyResizeHandler = syncScopeAccessibility;
  window.addEventListener('resize', currentStrategyResizeHandler, { passive:true });

  var cycleTriggers = $$('[data-strategy-cycle-trigger]');
  cycleTriggers.forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      var phase = trigger.closest('.sp-strategy-cycle__phase');
      var opening = !phase.classList.contains('is-open');
      cycleTriggers.forEach(function (item) {
        var itemPhase = item.closest('.sp-strategy-cycle__phase');
        var isOpen = item === trigger && opening;
        itemPhase.classList.toggle('is-open', isOpen);
        item.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        var panel = $('#' + item.getAttribute('aria-controls'));
        if (panel) panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      });
    });
  });

  var depth = $('[data-strategy-depth]');
  var visual = depth && depth.closest('.sp-hero__visual');
  var canTilt = !reduced && depth && visual && window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (canTilt) {
    var pending = null, raf = 0;
    function paintTilt() {
      raf = 0;
      if (!pending) return;
      var rect = visual.getBoundingClientRect();
      var dx = ((pending.clientX - rect.left) / rect.width - .5) * 2;
      var dy = ((pending.clientY - rect.top) / rect.height - .5) * 2;
      depth.style.setProperty('--sp-depth-rx', (dy * -2.15).toFixed(2) + 'deg');
      depth.style.setProperty('--sp-depth-ry', (dx * 2.15).toFixed(2) + 'deg');
      depth.style.setProperty('--sp-depth-x', (dx * 7).toFixed(1) + 'px');
      depth.style.setProperty('--sp-depth-y', (dy * 6).toFixed(1) + 'px');
      visual.classList.add('is-tilting');
    }
    visual.addEventListener('pointermove', function (event) {
      if (event.pointerType !== 'mouse') return;
      pending = event;
      if (!raf) raf = requestAnimationFrame(paintTilt);
    });
    visual.addEventListener('pointerleave', function () {
      pending = null;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      visual.classList.remove('is-tilting');
      depth.style.setProperty('--sp-depth-rx', '0deg');
      depth.style.setProperty('--sp-depth-ry', '0deg');
      depth.style.setProperty('--sp-depth-x', '0px');
      depth.style.setProperty('--sp-depth-y', '0px');
    });
  }
  if (!reduced) requestAnimationFrame(function () { document.body.classList.add('sp--strategy-ready'); });
  else document.body.classList.add('sp--strategy-ready');
}

render(copy());
})();
