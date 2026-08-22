(function () {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const Score = window.RRScore;
  const Store = window.RRStore;

  const ROUTES = {
    home: { title: '오늘의 레이더', eyebrow: 'PERSONAL RESEARCH INTELLIGENCE' },
    research: { title: '연구 피드', eyebrow: 'PAPERS · PREPRINTS · METHODS' },
    opportunities: { title: '미국 연구기회', eyebrow: 'PHD · POSTBAC · VISITING · INTERNSHIP' },
    deadlines: { title: '마감 캘린더', eyebrow: 'DEADLINES · EVENTS · APPLICATIONS' },
    library: { title: '내 라이브러리', eyebrow: 'SAVED · SHORTLISTED · READ · ARCHIVED' },
    sources: { title: '수집 상태', eyebrow: 'SOURCE HEALTH · PIPELINE · VERIFICATION' }
  };

  const KIND_LABELS = {
    paper: '논문', preprint: 'Preprint', review: '리뷰', method: '방법론', news: '뉴스', commentary: '논평',
    guideline: '가이드라인', policy: '정책', conference: '학회', workshop: '워크숍', webinar: 'Webinar',
    phd: 'PhD', internship: '인턴십', postbac: 'Postbac', visiting: 'Visiting', fellowship: 'Fellowship', funding: 'Funding'
  };

  const STATUS_LABELS = {
    new: 'NEW', important: 'IMPORTANT', open: 'OPEN', watch: 'WATCH', closed: 'CLOSED', restricted: 'RESTRICTED'
  };

  const ICONS = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/></svg>',
    flask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 3h6M10 3v6l-5.3 9.2A1.8 1.8 0 0 0 6.3 21h11.4a1.8 1.8 0 0 0 1.6-2.8L14 9V3"/><path d="M7.5 16h9"/></svg>',
    plane: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 2 9 15"/><path d="m22 2-7 20-4-9-9-4Z"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>',
    bookmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z"/></svg>',
    pulse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12h4l2-6 4 12 2-6h6"/></svg>',
    sliders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3"/><path d="M1 14h6M9 8h6M17 16h6"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></svg>',
    monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 4 4L19 6"/></svg>',
    archive: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18v4H3zM5 10v10h14V10M9 14h6"/></svg>',
    external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 3h7v7M10 14 21 3M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v12M7 10l5 5 5-5M4 21h16"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>',
    note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h5"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m9 18 6-6-6-6"/></svg>',
    install: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v12M7 10l5 5 5-5"/><rect x="4" y="18" width="16" height="3" rx="1"/></svg>'
  };

  const app = {
    data: null,
    items: [],
    profile: null,
    defaultProfile: null,
    topics: {},
    meta: {},
    health: { sources: [] },
    sources: {},
    brief: {},
    reviewQueue: { items: [] },
    route: 'home',
    query: '',
    topicFilters: new Set(),
    sort: 'score',
    kindFilter: 'all',
    statusFilter: 'all',
    opportunityFilter: 'eligible',
    feedView: Store.get().feedView || 'list',
    libraryTab: Store.get().libraryTab || 'saved',
    calendarCursor: new Date(),
    commandIndex: 0,
    deferredInstall: null
  };

  function icon(name) { return ICONS[name] || ''; }
  function hydrateStaticIcons(root = document) {
    $$('[data-icon]', root).forEach(node => { node.innerHTML = icon(node.dataset.icon); });
  }
  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
  }
  function escapeAttr(value) { return escapeHTML(value).replace(/`/g, '&#96;'); }
  function safeURL(url) {
    try { const parsed = new URL(url, location.href); return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '#'; }
    catch (_) { return '#'; }
  }
  function parseDate(value) { return Score.parseDate(value); }
  function formatDate(value, options = {}) {
    const date = parseDate(value);
    if (!date) return '날짜 미정';
    return new Intl.DateTimeFormat('ko-KR', Object.assign({ year:'numeric', month:'short', day:'numeric' }, options)).format(date);
  }
  function formatShortDate(value) {
    const date = parseDate(value);
    if (!date) return '미정';
    return new Intl.DateTimeFormat('ko-KR', { month:'short', day:'numeric' }).format(date);
  }
  function daysUntil(value) {
    const date = parseDate(value);
    if (!date) return null;
    const now = new Date(); now.setHours(0,0,0,0); date.setHours(0,0,0,0);
    return Score.daysBetween(now, date);
  }
  function dDay(value) {
    const days = daysUntil(value);
    if (days == null) return '';
    if (days === 0) return 'D-DAY';
    return days > 0 ? `D-${days}` : `D+${Math.abs(days)}`;
  }
  function truncate(value, length = 90) {
    const text = String(value || '').trim();
    return text.length > length ? `${text.slice(0, length - 1)}…` : text;
  }
  function topicMeta(topic) { return app.topics[topic] || { label: topic, color: '#0b6757', group:'research' }; }
  function primaryTopic(item) {
    const topics = item.topics || [];
    return topics.sort((a,b) => (app.profile?.interests?.[b] || 0) - (app.profile?.interests?.[a] || 0))[0] || '3d-genome';
  }
  function itemColor(item) { return topicMeta(primaryTopic(item)).color; }
  function kindLabel(item) { return KIND_LABELS[item.kind] || item.kind || '항목'; }
  function statusLabel(item) { return STATUS_LABELS[item.status] || String(item.status || '').toUpperCase(); }
  function isResearch(item) { return !Score.isOpportunity(item) && !Score.isEvent(item); }
  function isDeadline(item) { return Boolean(item.deadlineAt); }
  function getStore() { return Store.get(); }
  function scoreItems() {
    const now = new Date();
    app.items.forEach(item => { item._score = Score.score(item, app.profile, now); });
  }
  function byScore(a,b) { return b._score.final - a._score.final || (parseDate(b.publishedAt) || 0) - (parseDate(a.publishedAt) || 0); }
  function byDate(a,b) { return (parseDate(b.publishedAt) || 0) - (parseDate(a.publishedAt) || 0); }
  function byDeadline(a,b) {
    const ad = parseDate(a.deadlineAt)?.getTime() ?? Infinity;
    const bd = parseDate(b.deadlineAt)?.getTime() ?? Infinity;
    return ad - bd;
  }
  function itemById(id) { return app.items.find(item => item.id === String(id)); }

  async function fetchJSON(url) {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${url}: ${response.status}`);
    return response.json();
  }

  async function loadData() {
    const fallback = window.RR_FALLBACK || {};
    const paths = {
      feed: 'data/feed.json', profile: 'data/profile.json', topics: 'data/topics.json', meta: 'data/meta.json', health: 'data/source-health.json', sources: 'data/sources.json', brief: 'data/daily-brief.json', review: 'data/review-queue.json'
    };
    const results = {};
    let networkCount = 0;
    await Promise.all(Object.entries(paths).map(async ([key, path]) => {
      try { results[key] = await fetchJSON(path); networkCount += 1; }
      catch (error) { console.warn(`Fallback used for ${key}`, error); results[key] = fallback[key]; }
    }));
    if (!results.feed?.items) throw new Error('feed.json 또는 fallback data가 없습니다.');
    app.items = results.feed.items;
    app.defaultProfile = results.profile || fallback.profile;
    app.profile = getStore().profile || JSON.parse(JSON.stringify(app.defaultProfile));
    app.topics = results.topics || {};
    app.meta = results.meta || {};
    app.health = results.health || { sources: [] };
    app.sources = results.sources || {};
    app.brief = results.brief || {};
    app.reviewQueue = results.review || { items: [] };
    app.data = results;
    scoreItems();
    updateSyncStatus(networkCount === Object.keys(paths).length ? 'live' : 'fallback');
  }

  function updateSyncStatus(mode) {
    const pill = $('#syncStatus');
    const text = $('#syncText');
    if (!pill || !text) return;
    pill.classList.remove('is-warning','is-error');
    if (mode === 'live') text.textContent = `업데이트 ${formatShortDate(app.meta.generatedAt)}`;
    else { pill.classList.add('is-warning'); text.textContent = 'Offline snapshot'; }
  }

  function applyTheme() {
    const setting = getStore().theme || 'system';
    const resolved = setting === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : setting;
    document.documentElement.dataset.theme = resolved;
    $('#themeButton').innerHTML = `<span>${icon(setting === 'system' ? 'monitor' : resolved === 'dark' ? 'moon' : 'sun')}</span>`;
    $('#themeButton').title = `테마: ${setting}`;
  }

  function cycleTheme() {
    const current = getStore().theme || 'system';
    const next = current === 'system' ? 'light' : current === 'light' ? 'dark' : 'system';
    Store.setValue('theme', next);
    applyTheme();
    toast('테마 변경', next === 'system' ? '시스템 설정을 따릅니다.' : `${next} mode로 변경했습니다.`);
  }

  function currentRouteFromHash() {
    const route = location.hash.replace(/^#\/?/, '').split('?')[0];
    return ROUTES[route] ? route : (Store.get().lastRoute || 'home');
  }
  function navigate(route, options = {}) {
    if (!ROUTES[route]) route = 'home';
    app.route = route;
    Store.setValue('lastRoute', route);
    if (!options.silent) location.hash = `/${route}`;
    renderRoute();
    closeSidebar();
    window.scrollTo({ top: 0, behavior: options.instant ? 'auto' : 'smooth' });
  }

  function renderNav() {
    const store = getStore();
    const research = app.items.filter(isResearch).length;
    const opportunities = app.items.filter(Score.isOpportunity).length;
    const deadlines = app.items.filter(item => item.deadlineAt && (daysUntil(item.deadlineAt) ?? -1) >= 0).length;
    const today = app.items.filter(item => {
      const d = parseDate(item.publishedAt); if (!d) return false;
      return Score.daysBetween(d, new Date()) <= 3;
    }).length;
    $('#navTodayCount').textContent = today;
    $('#navResearchCount').textContent = research;
    $('#navOpportunityCount').textContent = opportunities;
    $('#navDeadlineCount').textContent = deadlines;
    $('#navSavedCount').textContent = store.saved.length;
    $('#navHealthCount').textContent = (app.health.sources || []).filter(source => ['healthy','configured'].includes(source.status)).length;
    $$('.nav-item').forEach(button => button.classList.toggle('is-active', button.dataset.route === app.route));
  }

  function renderSidebarTopics() {
    const counts = {};
    app.items.forEach(item => (item.topics || []).forEach(topic => counts[topic] = (counts[topic] || 0) + 1));
    const ordered = Object.entries(app.topics).sort(([,a],[,b]) => (app.profile.interests?.[b.label] || 0) - (app.profile.interests?.[a.label] || 0));
    $('#sidebarTopics').innerHTML = Object.entries(app.topics)
      .sort(([a],[b]) => (app.profile.interests?.[b] || 0) - (app.profile.interests?.[a] || 0))
      .map(([id, meta]) => `<button type="button" class="topic-filter ${app.topicFilters.has(id) ? 'is-active' : ''}" data-topic-filter="${escapeAttr(id)}" style="--topic-color:${escapeAttr(meta.color)}"><i class="topic-dot"></i><span>${escapeHTML(meta.label)}</span><small>${counts[id] || 0}</small></button>`).join('');
  }

  function renderHeader() {
    const meta = ROUTES[app.route];
    $('#pageTitle').textContent = meta.title;
    $('#pageEyebrow').textContent = meta.eyebrow;
    renderNav();
    renderSidebarTopics();
    renderTicker();
    $('#footerMeta').textContent = `${app.meta.itemCount || app.items.length}개 항목 · ${app.meta.pipeline || 'curated feed'} · ${formatDate(app.meta.generatedAt)}`;
  }

  function renderTicker() {
    const deadlines = app.items.filter(item => item.deadlineAt && (daysUntil(item.deadlineAt) ?? -1) >= 0).sort(byDeadline).slice(0,8);
    if (!deadlines.length) { $('#ticker').hidden = true; return; }
    $('#ticker').hidden = false;
    const one = deadlines.map(item => `<span><b>${dDay(item.deadlineAt)}</b>${escapeHTML(item.titleKo)} · ${formatShortDate(item.deadlineAt)}</span>`).join('');
    $('#tickerTrack').innerHTML = `<div class="ticker-track-inner">${one}${one}</div>`;
  }

  function filteredBase(route = app.route) {
    let items = [...app.items];
    if (route === 'research') items = items.filter(isResearch);
    if (route === 'opportunities') items = items.filter(Score.isOpportunity);
    if (route === 'deadlines') items = items.filter(isDeadline);
    if (route === 'library') {
      const ids = new Set(getStore()[app.libraryTab] || []);
      items = items.filter(item => ids.has(item.id));
    }
    if (app.topicFilters.size) items = items.filter(item => (item.topics || []).some(topic => app.topicFilters.has(topic)));
    if (app.query) {
      const q = app.query.toLowerCase();
      items = items.filter(item => [item.title,item.titleKo,item.summary,item.whyItMatters,item.source?.name,...(item.tags||[]),...(item.topics||[])].join(' ').toLowerCase().includes(q));
    }
    if (app.kindFilter !== 'all') items = items.filter(item => item.kind === app.kindFilter);
    if (app.statusFilter !== 'all') items = items.filter(item => item.status === app.statusFilter);
    if (route === 'opportunities') {
      if (app.opportunityFilter === 'eligible') items = items.filter(item => item.eligibility?.international !== false && item.status !== 'restricted');
      if (app.opportunityFilter === 'visa') items = items.filter(item => /j-1|sponsor|paperwork support|visa support/i.test(String(item.eligibility?.visa || '')));
      if (app.opportunityFilter === 'restricted') items = items.filter(item => item.status === 'restricted' || item.eligibility?.international === false);
    }
    if (app.sort === 'date') items.sort(byDate);
    else if (app.sort === 'deadline') items.sort(byDeadline);
    else items.sort(byScore);
    return items;
  }

  function scoreBadge(item, className = 'score-badge') {
    return `<div class="${className}" style="--score:${item._score.final};--topic-color:${itemColor(item)}" title="개인화 점수 ${item._score.final}"><b>${item._score.final}</b></div>`;
  }
  function chips(item, options = {}) {
    const output = [];
    if (item.status) output.push(`<span class="chip ${escapeAttr(item.status)}">${escapeHTML(statusLabel(item))}</span>`);
    output.push(`<span class="chip">${escapeHTML(kindLabel(item))}</span>`);
    if (options.topic !== false) output.push(`<span class="chip">${escapeHTML(topicMeta(primaryTopic(item)).label)}</span>`);
    if (item.verification?.level === 'preprint') output.push('<span class="chip preprint">PREPRINT</span>');
    if (item.verification?.level === 'automated-metadata') output.push('<span class="chip auto">AUTO · REVIEW</span>');
    if (item.verification?.level === 'official-page' || item.verification?.level === 'official-feed') output.push('<span class="chip verified">VERIFIED</span>');
    return output.join('');
  }

  function signalCard(item) {
    const store = getStore();
    return `<article class="signal-card ${store.read.includes(item.id) ? 'is-read' : ''}" data-item-id="${escapeAttr(item.id)}" style="--topic-color:${itemColor(item)}">
      <div class="card-kicker"><div class="chip-row">${chips(item)}</div>${scoreBadge(item)}</div>
      <h3>${escapeHTML(item.titleKo)}</h3>
      <div class="source-line">${escapeHTML(item.source?.name || '')} · ${formatDate(item.publishedAt)}</div>
      <p class="summary">${escapeHTML(item.summary)}</p>
      <div class="card-bottom"><span>${escapeHTML(item._score.reasons[0] || '개인화 점수로 선별')}</span><div class="card-actions">
        <button class="micro-button ${store.shortlisted.includes(item.id) ? 'is-active' : ''}" data-action="shortlist" data-id="${escapeAttr(item.id)}" aria-label="Shortlist">${icon('star')}</button>
        <button class="micro-button ${store.saved.includes(item.id) ? 'is-active' : ''}" data-action="save" data-id="${escapeAttr(item.id)}" aria-label="북마크">${icon('bookmark')}</button>
      </div></div>
    </article>`;
  }

  function deadlineRow(item) {
    return `<button type="button" class="deadline-row" data-item-id="${escapeAttr(item.id)}" style="--topic-color:${itemColor(item)}"><span class="d-day">${dDay(item.deadlineAt)}</span><span><strong>${escapeHTML(truncate(item.titleKo,58))}</strong><small>${formatDate(item.deadlineAt)} · ${escapeHTML(item.source?.name || '')}</small></span><span>›</span></button>`;
  }

  function renderHome() {
    const ranked = [...app.items].filter(item => item.status !== 'closed').sort(byScore);
    const briefIds = new Set(app.brief?.itemIds || []);
    const brief = [...ranked.filter(item => briefIds.has(item.id)), ...ranked.filter(item => !briefIds.has(item.id))].slice(0, 8);
    const lead = brief[0] || ranked[0];
    const deadlines = app.items.filter(item => item.deadlineAt && (daysUntil(item.deadlineAt) ?? -1) >= 0).sort(byDeadline).slice(0,4);
    const new72 = app.items.filter(item => { const d=parseDate(item.publishedAt); return d && Score.daysBetween(d,new Date()) <= 3; }).length;
    const oa = app.items.filter(item => isResearch(item) && item.access?.openAccess).length;
    const eligible = app.items.filter(item => Score.isOpportunity(item) && item.eligibility?.international === true && item.status !== 'restricted').length;
    const urgent = deadlines.filter(item => (daysUntil(item.deadlineAt) ?? 999) <= 30).length;
    const highFit = app.items.filter(item => item._score.final >= 90).length;

    $('#viewRoot').innerHTML = `<div class="view-enter">
      <section class="hero-grid">
        <article class="hero-card" style="--topic-color:${itemColor(lead)}">
          <span class="hero-kicker"><i></i> CURATED DAILY SIGNAL · ${formatDate(app.brief?.date || new Date())}</span>
          <h2>${escapeHTML(lead.titleKo)}</h2>
          <p>${escapeHTML(lead.whyItMatters)}</p>
          <div class="hero-actions"><button class="solid" data-item-id="${escapeAttr(lead.id)}">핵심 분석 열기</button><button class="glass" data-route="research">전체 연구 피드</button>${app.deferredInstall ? '<button class="glass" data-action="install">앱 설치</button>' : ''}</div>
        </article>
        <aside class="hero-side panel"><div class="hero-side-head"><h3>마감 임박</h3><span>${deadlines.length} TRACKED</span></div><div class="deadline-stack">${deadlines.length ? deadlines.map(deadlineRow).join('') : '<div class="empty-state"><h3>예정된 마감 없음</h3></div>'}</div></aside>
      </section>
      <section class="metric-grid">
        ${metricCard('최근 72시간',new72,'new signals')}
        ${metricCard('맞춤도 90+',highFit,'high-priority')}
        ${metricCard('즉시 열람',oa,'open access')}
        ${metricCard('International 가능',eligible,'verified/likely')}
        ${metricCard('30일 내 마감',urgent,'action required')}
      </section>
      <div class="section-title"><div><h2>오늘의 Brief</h2><p>사용자 관심도와 행동 가능성을 함께 계산한 상위 항목</p></div><button data-route="research">전체 보기 →</button></div>
      <section class="brief-grid">${brief.slice(0,4).map(signalCard).join('')}</section>
      <div class="section-title"><div><h2>추가 Signal</h2><p>관심 분야를 넓히되 낮은 신뢰 항목은 제외했습니다.</p></div></div>
      <section class="brief-grid">${brief.slice(4,8).map(signalCard).join('')}</section>
      <div class="section-title"><div><h2>Radar Operations</h2><p>업데이트 타임라인과 수집 파이프라인 상태</p></div><button data-route="sources">수집 상태 →</button></div>
      <section class="dashboard-grid">
        <div class="timeline-panel panel"><span class="mini-label">LATEST INGESTION</span><div class="timeline-list">${ranked.slice(0,6).map(timelineItem).join('')}</div></div>
        <div class="source-panel panel"><span class="mini-label">SOURCE HEALTH</span><div class="source-health-list">${(app.health.sources||[]).slice(0,6).map(sourceHealthRow).join('')}</div></div>
      </section>
    </div>`;
  }

  function metricCard(label,value,note) { return `<div class="metric-card"><span>${escapeHTML(label)}</span><strong>${value}</strong><small>${escapeHTML(note)}</small></div>`; }
  function timelineItem(item) { return `<div class="timeline-item" data-item-id="${escapeAttr(item.id)}" style="--topic-color:${itemColor(item)}"><span class="timeline-date">${formatShortDate(item.publishedAt)}</span><i class="timeline-dot"></i><span class="timeline-copy"><strong>${escapeHTML(truncate(item.titleKo,84))}</strong><small>${escapeHTML(item.source?.name || '')} · score ${item._score.final}</small></span></div>`; }
  function sourceHealthRow(source) { return `<div class="source-health-row"><i class="health-light ${escapeAttr(source.status)}"></i><span><strong>${escapeHTML(source.label)}</strong><small>${escapeHTML(source.message || '')}</small></span><b>${source.items ?? '—'}</b></div>`; }

  function feedToolbar(route, count) {
    const kinds = route === 'research'
      ? [['all','전체 유형'],['paper','논문'],['preprint','Preprint'],['review','리뷰'],['method','방법론'],['policy','정책·가이드']]
      : [['all','전체 유형'],['phd','PhD'],['postbac','Postbac'],['internship','인턴십'],['visiting','Visiting']];
    return `<div class="feed-toolbar">
      <div class="toolbar-left">
        <select class="filter-select" id="kindFilter" aria-label="유형 필터">${kinds.map(([v,l]) => `<option value="${v}" ${app.kindFilter===v?'selected':''}>${l}</option>`).join('')}</select>
        <select class="filter-select" id="statusFilter" aria-label="상태 필터"><option value="all">전체 상태</option>${['new','important','open','watch','restricted','closed'].map(v=>`<option value="${v}" ${app.statusFilter===v?'selected':''}>${STATUS_LABELS[v]}</option>`).join('')}</select>
        ${route === 'opportunities' ? `<button class="filter-button ${app.opportunityFilter==='eligible'?'is-active':''}" data-opportunity-filter="eligible">지원 가능</button><button class="filter-button ${app.opportunityFilter==='visa'?'is-active':''}" data-opportunity-filter="visa">Visa/J-1</button><button class="filter-button ${app.opportunityFilter==='restricted'?'is-active':''}" data-opportunity-filter="restricted">지원 제한</button><button class="filter-button ${app.opportunityFilter==='all'?'is-active':''}" data-opportunity-filter="all">전체</button>` : ''}
      </div>
      <div class="toolbar-right"><span class="result-count">${count}개 항목</span><select class="filter-select" id="sortSelect"><option value="score" ${app.sort==='score'?'selected':''}>맞춤도순</option><option value="date" ${app.sort==='date'?'selected':''}>최신순</option><option value="deadline" ${app.sort==='deadline'?'selected':''}>마감순</option></select><div class="view-toggle"><button data-feed-view="list" class="${app.feedView==='list'?'is-active':''}" aria-label="목록 보기">${icon('list')}</button><button data-feed-view="grid" class="${app.feedView==='grid'?'is-active':''}" aria-label="카드 보기">${icon('grid')}</button></div></div>
    </div>`;
  }

  function feedCard(item) {
    const store = getStore();
    const date = parseDate(item.publishedAt) || new Date();
    const month = date.toLocaleString('en-US',{month:'short'}).toUpperCase();
    const deadlineText = item.deadlineAt ? `${dDay(item.deadlineAt)} · ${formatShortDate(item.deadlineAt)}` : item._score.reasons[0] || 'Personalized match';
    return `<article class="feed-card ${store.read.includes(item.id)?'is-read':''} ${store.archived.includes(item.id)?'is-archived':''}" data-item-id="${escapeAttr(item.id)}" style="--topic-color:${itemColor(item)};--score:${item._score.final}">
      <div class="feed-date"><strong>${String(date.getDate()).padStart(2,'0')}</strong><span>${month} ${date.getFullYear()}</span></div>
      <div class="feed-main"><div class="chip-row">${chips(item)}</div><h3>${escapeHTML(item.titleKo)}</h3><div class="feed-meta"><span>${escapeHTML(item.source?.name || '')}</span><span>·</span><span>${escapeHTML(item.verification?.level || 'curated')}</span>${item.access?.openAccess?'<span>·</span><span>Open Access</span>':''}</div><p class="feed-summary">${escapeHTML(item.summary)}</p></div>
      <div class="feed-side"><div><div class="score-line"><span>Research fit</span><b>${item._score.final}</b></div><div class="progress"><i></i></div><div class="deadline-copy"><span>${item.deadlineAt?'Deadline':'Top reason'}</span><strong>${escapeHTML(deadlineText)}</strong></div></div><div class="feed-actions"><button class="micro-button ${store.shortlisted.includes(item.id)?'is-active':''}" data-action="shortlist" data-id="${escapeAttr(item.id)}" title="Shortlist">${icon('star')}</button><button class="micro-button ${store.saved.includes(item.id)?'is-active':''}" data-action="save" data-id="${escapeAttr(item.id)}" title="북마크">${icon('bookmark')}</button><button class="micro-button ${store.read.includes(item.id)?'is-active':''}" data-action="read" data-id="${escapeAttr(item.id)}" title="읽음">${icon('check')}</button></div></div>
    </article>`;
  }

  function renderFeed(route) {
    const items = filteredBase(route);
    const intro = route === 'research'
      ? `<div class="section-title"><div><h2>Curated Research Feed</h2><p>3D genome, epigenetics, IVG, single-molecule, mechanobiology를 한 피드에서 비교합니다.</p></div></div>`
      : `<div class="section-title"><div><h2>Opportunity Intelligence</h2><p>지원 가능성·visa 정보·마감일을 연구 적합도와 함께 평가합니다.</p></div></div>`;
    $('#viewRoot').innerHTML = `<div class="view-enter">${intro}${feedToolbar(route,items.length)}<div class="feed-list ${app.feedView==='grid'?'grid-mode':''}" id="feedList">${items.length ? items.map(feedCard).join('') : emptyState('조건에 맞는 항목이 없습니다','검색어 또는 필터를 조정하십시오.')}</div></div>`;
  }

  function emptyState(title, text) { return `<div class="empty-state"><span>${icon('search')}</span><h3>${escapeHTML(title)}</h3><p>${escapeHTML(text)}</p></div>`; }

  function renderDeadlines() {
    const items = filteredBase('deadlines').filter(item => (daysUntil(item.deadlineAt) ?? -1) >= 0).sort(byDeadline);
    const cursor = new Date(app.calendarCursor.getFullYear(), app.calendarCursor.getMonth(), 1);
    $('#viewRoot').innerHTML = `<div class="view-enter">
      <div class="section-title"><div><h2>Deadline Intelligence</h2><p>지원·등록 마감과 event date를 분리해 관리합니다.</p></div><div class="library-header-actions"><a class="button ghost" href="data/deadlines.ics" download>전체 iCalendar</a></div></div>
      <section class="deadline-layout">
        <div class="calendar-panel panel"><div class="calendar-head"><h2>${new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'long'}).format(cursor)}</h2><div class="calendar-actions"><button data-calendar-move="-1">이전</button><button data-calendar-today="1">오늘</button><button data-calendar-move="1">다음</button></div></div>${calendarGrid(cursor,items)}</div>
        <aside class="deadline-list-panel panel"><h3>다가오는 마감</h3><div class="deadline-list-large">${items.length ? items.slice(0,12).map(deadlineCard).join('') : emptyState('마감 없음','현재 감시 범위 내 마감이 없습니다.')}</div></aside>
      </section>
    </div>`;
  }

  function calendarGrid(cursor, items) {
    const year = cursor.getFullYear(), month = cursor.getMonth();
    const first = new Date(year,month,1), start = new Date(year,month,1-first.getDay());
    const weekdays = ['일','월','화','수','목','금','토'];
    let html = `<div class="calendar-grid">${weekdays.map(day=>`<div class="weekday">${day}</div>`).join('')}`;
    const today = new Date();
    for (let i=0;i<42;i++) {
      const day = new Date(start); day.setDate(start.getDate()+i);
      const key = `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`;
      const events = items.filter(item => item.deadlineAt === key);
      const classes = ['calendar-day'];
      if (day.getMonth() !== month) classes.push('is-outside');
      if (day.toDateString() === today.toDateString()) classes.push('is-today');
      html += `<div class="${classes.join(' ')}"><b>${day.getDate()}</b>${events.slice(0,3).map(item=>`<div class="calendar-event" data-item-id="${escapeAttr(item.id)}" style="--topic-color:${itemColor(item)}" title="${escapeAttr(item.titleKo)}">${escapeHTML(truncate(item.titleKo,28))}</div>`).join('')}</div>`;
    }
    return html + '</div>';
  }
  function deadlineCard(item) {
    const eligible = item.eligibility?.international === false ? '현재 지원 제한' : item.eligibility?.international === true ? 'International 가능' : '자격 확인 필요';
    return `<article class="deadline-card" data-item-id="${escapeAttr(item.id)}"><span class="d-day">${dDay(item.deadlineAt)}</span><span><strong>${escapeHTML(item.titleKo)}</strong><small>${formatDate(item.deadlineAt)} · ${escapeHTML(item.source?.name || '')}</small><i class="eligibility-flag">${escapeHTML(eligible)}</i></span></article>`;
  }

  function renderLibrary() {
    const store = getStore();
    const tabs = [['saved','북마크',store.saved.length],['shortlisted','Shortlist',store.shortlisted.length],['read','읽음',store.read.length],['archived','보관',store.archived.length]];
    const items = filteredBase('library');
    $('#viewRoot').innerHTML = `<div class="view-enter">
      <div class="section-title"><div><h2>Personal Library</h2><p>브라우저에 저장되며 JSON/CSV로 내보낼 수 있습니다.</p></div><div class="library-header-actions"><button class="button ghost" data-action="export-json">상태 JSON</button><button class="button ghost" data-action="export-csv">목록 CSV</button></div></div>
      <div class="library-tabs">${tabs.map(([id,label,count])=>`<button class="library-tab ${app.libraryTab===id?'is-active':''}" data-library-tab="${id}">${label} · ${count}</button>`).join('')}</div>
      <div class="feed-list ${app.feedView==='grid'?'grid-mode':''}">${items.length ? items.map(feedCard).join('') : emptyState('라이브러리가 비어 있습니다','피드에서 북마크 또는 Shortlist를 저장하십시오.')}</div>
    </div>`;
  }

  function renderSources() {
    const sources = app.health.sources || [];
    const reviewItems = app.reviewQueue?.items || [];
    const healthy = sources.filter(source=>source.status==='healthy').length;
    const configured = sources.filter(source=>source.status==='configured').length;
    const totalItems = sources.reduce((sum,source)=>sum+(Number(source.items)||0),0);
    $('#viewRoot').innerHTML = `<div class="view-enter">
      <div class="section-title"><div><h2>Source & Pipeline Health</h2><p>자동 수집과 curated override를 분리해 데이터 provenance를 표시합니다.</p></div><button class="button ghost" data-action="download-health">Health JSON</button></div>
      <section class="source-overview">${metricCard('Healthy',healthy,'last run success')}${metricCard('Configured',configured,'awaiting GitHub Actions')}${metricCard('Tracked items',totalItems,'source-reported')}${metricCard('Review queue',reviewItems.length,'editorial checks')}</section>
      <div class="disclosure-panel"><strong>Curated-first safeguard</strong><p>공식 metadata 자동 수집 항목은 <b>AUTO · REVIEW</b>로 표시되며, editorial record와 충돌하면 DOI·PMID·URL·title fingerprint 기준으로 editorial record가 우선합니다.</p></div>
      <table class="source-table"><thead><tr><th>Source</th><th>Status</th><th>Last success</th><th>Items</th><th>Note</th></tr></thead><tbody>${sources.map(source=>`<tr><td><strong>${escapeHTML(source.label)}</strong></td><td><span class="source-status ${escapeAttr(source.status)}"><i></i>${escapeHTML(source.status)}</span></td><td>${source.lastSuccess?formatDate(source.lastSuccess):'GitHub Actions 실행 후 기록'}</td><td>${source.items ?? '—'}</td><td>${escapeHTML(source.message || '')}</td></tr>`).join('')}</tbody></table>
      ${reviewItems.length ? `<div class="section-title compact"><div><h2>Editorial Review Queue</h2><p>page-watch 변경 또는 수집 오류는 자동 발행하지 않고 검토 대기열로 이동합니다.</p></div></div><table class="source-table review-table"><thead><tr><th>Page</th><th>Flag</th><th>Detected</th><th>Reason</th></tr></thead><tbody>${reviewItems.slice(-20).reverse().map(entry=>`<tr><td><a href="${safeURL(entry.url)}" target="_blank" rel="noopener"><strong>${escapeHTML(entry.name || entry.pageId || 'Page')}</strong></a></td><td><span class="source-status ${entry.status==='needs-review'?'configured':'error'}"><i></i>${escapeHTML(entry.status || 'review')}</span></td><td>${formatDate(entry.detectedAt)}</td><td>${escapeHTML(entry.reason || '')}</td></tr>`).join('')}</tbody></table>` : ''}
      <section class="pipeline-panel panel"><span class="mini-label">AUTOMATED PIPELINE</span><div class="pipeline-steps">
        ${pipelineStep('01','Collect','Europe PMC · bioRxiv · NIH RSS · page-watch')}
        ${pipelineStep('02','Normalize','공통 schema · DOI/URL/title fingerprint')}
        ${pipelineStep('03','Verify','curated overrides · eligibility confidence')}
        ${pipelineStep('04','Rank','topic · recency · authority · actionability')}
        ${pipelineStep('05','Publish','JSON · RSS · iCalendar · GitHub Pages')}
      </div></section>
    </div>`;
  }
  function pipelineStep(no,title,text) { return `<div class="pipeline-step"><span>${no}</span><strong>${title}</strong><p>${text}</p></div>`; }

  function renderRoute() {
    if (!app.data) return;
    app.route = currentRouteFromHash();
    renderHeader();
    if (app.route === 'home') renderHome();
    else if (app.route === 'research') renderFeed('research');
    else if (app.route === 'opportunities') renderFeed('opportunities');
    else if (app.route === 'deadlines') renderDeadlines();
    else if (app.route === 'library') renderLibrary();
    else if (app.route === 'sources') renderSources();
    hydrateStaticIcons($('#viewRoot'));
  }

  function openDrawer(id) {
    const item = itemById(id);
    if (!item) return;
    Store.toggle('read', id, true);
    const store = getStore();
    const color = itemColor(item);
    const e = item.eligibility || {};
    const note = store.notes[id] || '';
    const breakdown = item._score.breakdown;
    $('#drawerContent').innerHTML = `<div class="drawer-header" style="--topic-color:${color}">
      <div class="chip-row">${chips(item)}<span class="chip">${escapeHTML(item.verification?.level || 'curated')}</span></div>
      <h2 id="drawerTitle">${escapeHTML(item.titleKo)}</h2><div class="drawer-original">${escapeHTML(item.title)}</div>
      <div class="drawer-meta"><span class="chip">${escapeHTML(item.source?.name || '')}</span><span class="chip">${formatDate(item.publishedAt)}</span>${item.deadlineAt?`<span class="chip ${daysUntil(item.deadlineAt)>=0?'open':'closed'}">${dDay(item.deadlineAt)} · ${formatDate(item.deadlineAt)}</span>`:''}${item.doi?`<span class="chip">DOI ${escapeHTML(item.doi)}</span>`:''}</div>
    </div>
    <div class="drawer-score" style="--topic-color:${color};--score:${item._score.final}"><div class="big-score"><span><b>${item._score.final}</b><small>PERSONAL FIT</small></span></div><div class="score-breakdown">
      ${breakdownRow('관심 분야',breakdown.topic,color)}${breakdownRow('최신성',breakdown.recency,color)}${breakdownRow('Authority',breakdown.authority,color)}${Score.isOpportunity(item)?breakdownRow('지원 가능성',breakdown.eligibility,color):breakdownRow('Novelty',breakdown.novelty,color)}${breakdownRow('Actionability',breakdown.actionability,color)}
    </div></div>
    <section class="drawer-section"><h3>핵심 내용</h3><p>${escapeHTML(item.summary)}</p></section>
    <section class="drawer-section"><h3>왜 사용자에게 중요한가</h3><div class="callout" style="--topic-color:${color}"><p>${escapeHTML(item.whyItMatters)}</p></div></section>
    <section class="drawer-section"><h3>권장 행동</h3><p>${escapeHTML(item.recommendedAction)}</p></section>
    ${Score.isOpportunity(item)||Score.isEvent(item)?`<section class="drawer-section"><h3>Eligibility & Logistics</h3><div class="eligibility-grid">${eligibilityCell('International',e.international===true?'가능':e.international===false?'제한':'확인 필요')}${eligibilityCell('Visa',e.visa||'확인 필요')}${eligibilityCell('Career stage',(e.careerStages||[]).join(' · ')||'확인 필요')}${eligibilityCell('Funding',e.funding||'확인 필요')}</div>${e.notes?`<p class="muted" style="margin-top:8px">${escapeHTML(e.notes)}</p>`:''}</section>`:''}
    <section class="drawer-section"><h3>Score rationale</h3><div class="chip-row">${item._score.reasons.map(reason=>`<span class="chip">${escapeHTML(reason)}</span>`).join('')}</div></section>
    <section class="drawer-section"><h3>Keywords</h3><div class="chip-row">${(item.tags||[]).map(tag=>`<span class="chip">${escapeHTML(tag)}</span>`).join('')}</div></section>
    <section class="drawer-section"><h3>개인 메모</h3><textarea id="drawerNote" rows="4" style="width:100%;resize:vertical;border:1px solid var(--line);border-radius:11px;background:var(--panel-2);color:var(--ink);padding:10px;font-size:10px" placeholder="읽을 figure, PI contact, 지원 준비 등을 기록">${escapeHTML(note)}</textarea><button class="button ghost" data-action="save-note" data-id="${escapeAttr(id)}" style="margin-top:7px">메모 저장</button></section>
    <div class="drawer-actions"><a class="primary-action" href="${safeURL(item.url)}" target="_blank" rel="noopener">원문·공식 공고 ${icon('external')}</a>${item.deadlineAt?`<button class="secondary-action" data-action="ics" data-id="${escapeAttr(id)}">${icon('calendar')} 캘린더</button>`:''}<button class="secondary-action ${store.shortlisted.includes(id)?'is-active':''}" data-action="shortlist" data-id="${escapeAttr(id)}">${icon('star')}</button><button class="secondary-action ${store.saved.includes(id)?'is-active':''}" data-action="save" data-id="${escapeAttr(id)}">${icon('bookmark')}</button><button class="secondary-action" data-action="copy-citation" data-id="${escapeAttr(id)}">${icon('copy')}</button></div>`;
    hydrateStaticIcons($('#drawerContent'));
    $('#drawerBackdrop').hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(()=>$('#drawerClose').focus(),0);
  }
  function breakdownRow(label,value,color) { return `<div class="breakdown-row" style="--value:${value};--topic-color:${color}"><span>${escapeHTML(label)}</span><i></i><b>${value}</b></div>`; }
  function eligibilityCell(label,value) { return `<div class="eligibility-cell"><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong></div>`; }
  function closeDrawer() { $('#drawerBackdrop').hidden = true; document.body.style.overflow = ''; }

  function toggleCollection(collection,id,label) {
    const active = Store.toggle(collection,id);
    scoreItems(); renderRoute();
    if (!$('#drawerBackdrop').hidden) openDrawer(id);
    toast(active ? `${label} 저장` : `${label} 해제`, itemById(id)?.titleKo || '항목 상태가 변경되었습니다.');
  }

  function download(filename, content, type='application/octet-stream') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  function icsFor(item) {
    const start = (item.deadlineAt || item.eventStart || item.publishedAt || '').replaceAll('-','');
    const endDate = parseDate(item.deadlineAt || item.eventStart || item.publishedAt);
    if (endDate) endDate.setDate(endDate.getDate()+1);
    const end = endDate ? `${endDate.getFullYear()}${String(endDate.getMonth()+1).padStart(2,'0')}${String(endDate.getDate()).padStart(2,'0')}` : start;
    const esc = value => String(value||'').replace(/([,;\\])/g,'\\$1').replace(/\n/g,'\\n');
    return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Research Radar Pro//KO','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:${item.id}@research-radar`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`,`DTSTART;VALUE=DATE:${start}`,`DTEND;VALUE=DATE:${end}`,`SUMMARY:${esc(item.titleKo)}`,`DESCRIPTION:${esc(item.recommendedAction)}\\n${esc(item.url)}`,`LOCATION:${esc(item.location||'')}`,`URL:${item.url}`,'END:VEVENT','END:VCALENDAR',''].join('\r\n');
  }

  function exportCSV(items) {
    const rows = [['title','kind','source','publishedAt','deadlineAt','score','status','url']];
    items.forEach(item=>rows.push([item.titleKo,item.kind,item.source?.name||'',item.publishedAt||'',item.deadlineAt||'',item._score.final,item.status,item.url]));
    return rows.map(row=>row.map(value=>`"${String(value).replaceAll('"','""')}"`).join(',')).join('\n');
  }

  function copyCitation(item) {
    const authors = item.authors?.length ? `${item.authors.join(', ')}. ` : '';
    const citation = `${authors}${item.title}. ${item.source?.name || ''}. ${item.publishedAt?.slice(0,4) || ''}.${item.doi ? ` https://doi.org/${item.doi}` : ` ${item.url}`}`;
    navigator.clipboard?.writeText(citation).then(()=>toast('Citation 복사 완료',citation)).catch(()=>download('citation.txt',citation,'text/plain'));
  }

  function openSettings() {
    const dialog = $('#settingsDialog');
    const profile = app.profile;
    $('#weightControls').innerHTML = Object.entries(app.topics).map(([id,meta])=>{
      const value = Math.round((profile.interests?.[id] ?? .5)*100);
      return `<div class="weight-row"><label for="weight-${escapeAttr(id)}"><span>${escapeHTML(meta.label)}</span></label><input id="weight-${escapeAttr(id)}" data-weight="${escapeAttr(id)}" type="range" min="0" max="100" value="${value}"><b class="weight-value" data-weight-value="${escapeAttr(id)}">${value}</b></div>`;
    }).join('');
    $('#prefInternational').checked = Boolean(profile.preferences?.internationalEligibilityBoost);
    $('#prefVisa').checked = Boolean(profile.preferences?.visaSupportBoost);
    $('#prefOA').checked = Boolean(profile.preferences?.openAccessBoost);
    $('#prefDeadlineDays').value = profile.preferences?.deadlineWindowDays || 180;
    dialog.showModal();
  }

  function saveSettings() {
    const profile = JSON.parse(JSON.stringify(app.profile));
    $$('[data-weight]').forEach(input => profile.interests[input.dataset.weight] = Number(input.value)/100);
    profile.preferences.internationalEligibilityBoost = $('#prefInternational').checked;
    profile.preferences.visaSupportBoost = $('#prefVisa').checked;
    profile.preferences.openAccessBoost = $('#prefOA').checked;
    profile.preferences.deadlineWindowDays = Number($('#prefDeadlineDays').value) || 180;
    app.profile = profile;
    Store.setProfile(profile);
    scoreItems(); renderRoute();
    toast('개인화 설정 저장','모든 항목의 점수를 다시 계산했습니다.');
  }

  function resetSettings() {
    Store.resetProfile();
    app.profile = JSON.parse(JSON.stringify(app.defaultProfile));
    scoreItems(); renderRoute(); openSettings();
    toast('기본값 복원','초기 관심도 프로필을 적용했습니다.');
  }

  async function requestNotifications() {
    if (!('Notification' in window)) return toast('브라우저 알림 미지원','이 브라우저는 Notification API를 지원하지 않습니다.');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return toast('알림 권한 없음','마감 알림은 허용 후 사용할 수 있습니다.');
    const urgent = app.items.filter(item=>item.deadlineAt && (daysUntil(item.deadlineAt)??999)>=0 && (daysUntil(item.deadlineAt)??999)<=14).sort(byDeadline);
    new Notification('Research Radar 마감 알림',{ body: urgent.length ? `${urgent[0].titleKo} · ${dDay(urgent[0].deadlineAt)}` : '14일 내 마감 항목이 없습니다.', icon:'assets/icons/icon-192.png' });
    toast('알림 활성화','사이트를 열 때 임박한 마감을 확인합니다.');
  }

  function toast(title,message) {
    const node = document.createElement('div'); node.className='toast'; node.innerHTML=`<strong>${escapeHTML(title)}</strong><span>${escapeHTML(truncate(message,130))}</span>`;
    $('#toastRegion').appendChild(node); setTimeout(()=>node.remove(),4200);
  }

  function openSidebar() { $('#sidebar').classList.add('is-open'); $('#sidebarScrim').hidden=false; }
  function closeSidebar() { $('#sidebar').classList.remove('is-open'); $('#sidebarScrim').hidden=true; }

  function commandEntries(query='') {
    const q = query.toLowerCase();
    const routes = Object.entries(ROUTES).map(([id,meta])=>({ type:'route', id, title:meta.title, subtitle:meta.eyebrow, icon:'home' }));
    const items = [...app.items].sort(byScore).slice(0,60).map(item=>({ type:'item', id:item.id, title:item.titleKo, subtitle:`${item.source?.name||''} · score ${item._score.final}`, icon:'flask' }));
    return [...routes,...items].filter(entry=>!q || `${entry.title} ${entry.subtitle}`.toLowerCase().includes(q)).slice(0,12);
  }
  function renderCommand() {
    const entries = commandEntries($('#commandInput').value);
    app.commandIndex = Math.min(app.commandIndex,Math.max(0,entries.length-1));
    $('#commandResults').innerHTML = entries.map((entry,index)=>`<button type="button" class="command-result ${index===app.commandIndex?'is-selected':''}" data-command-type="${entry.type}" data-command-id="${escapeAttr(entry.id)}"><span>${icon(entry.icon)}</span><span><strong>${escapeHTML(entry.title)}</strong><small>${escapeHTML(entry.subtitle)}</small></span><kbd>↵</kbd></button>`).join('') || emptyState('검색 결과 없음','다른 검색어를 입력하십시오.');
  }
  function openCommand() { $('#commandInput').value=''; app.commandIndex=0; renderCommand(); $('#commandDialog').showModal(); setTimeout(()=>$('#commandInput').focus(),0); }
  function selectCommand(entry) { if (!entry) return; $('#commandDialog').close(); entry.dataset.commandType==='route' ? navigate(entry.dataset.commandId) : openDrawer(entry.dataset.commandId); }

  function handleClick(event) {
    const routeButton = event.target.closest('[data-route]');
    if (routeButton) { event.preventDefault(); navigate(routeButton.dataset.route); return; }
    const topic = event.target.closest('[data-topic-filter]');
    if (topic) { const id=topic.dataset.topicFilter; app.topicFilters.has(id)?app.topicFilters.delete(id):app.topicFilters.add(id); renderRoute(); return; }
    const itemNode = event.target.closest('[data-item-id]');
    if (itemNode && !event.target.closest('[data-action]')) { openDrawer(itemNode.dataset.itemId); return; }
    const actionNode = event.target.closest('[data-action]');
    if (actionNode) {
      event.preventDefault(); event.stopPropagation();
      const { action, id } = actionNode.dataset;
      if (action==='save') toggleCollection('saved',id,'북마크');
      else if (action==='shortlist') toggleCollection('shortlisted',id,'Shortlist');
      else if (action==='read') toggleCollection('read',id,'읽음');
      else if (action==='archive') toggleCollection('archived',id,'보관');
      else if (action==='ics') { const item=itemById(id); download(`${item.id}.ics`,icsFor(item),'text/calendar'); }
      else if (action==='copy-citation') copyCitation(itemById(id));
      else if (action==='save-note') { Store.setNote(id,$('#drawerNote').value); toast('메모 저장',itemById(id).titleKo); }
      else if (action==='export-json') download('research-radar-state.json',Store.exportState(),'application/json');
      else if (action==='export-csv') download('research-radar-library.csv',exportCSV(filteredBase('library')),'text/csv;charset=utf-8');
      else if (action==='download-health') download('source-health.json',JSON.stringify(app.health,null,2),'application/json');
      else if (action==='install' && app.deferredInstall) { app.deferredInstall.prompt(); app.deferredInstall=null; renderRoute(); }
      return;
    }
    const viewButton = event.target.closest('[data-feed-view]');
    if (viewButton) { app.feedView=viewButton.dataset.feedView; Store.setValue('feedView',app.feedView); renderRoute(); return; }
    const opp = event.target.closest('[data-opportunity-filter]');
    if (opp) { app.opportunityFilter=opp.dataset.opportunityFilter; renderRoute(); return; }
    const tab = event.target.closest('[data-library-tab]');
    if (tab) { app.libraryTab=tab.dataset.libraryTab; Store.setValue('libraryTab',app.libraryTab); renderRoute(); return; }
    const move = event.target.closest('[data-calendar-move]');
    if (move) { app.calendarCursor=new Date(app.calendarCursor.getFullYear(),app.calendarCursor.getMonth()+Number(move.dataset.calendarMove),1); renderDeadlines(); return; }
    if (event.target.closest('[data-calendar-today]')) { app.calendarCursor=new Date(); renderDeadlines(); return; }
    const command = event.target.closest('[data-command-type]'); if (command) selectCommand(command);
  }

  function bindEvents() {
    document.addEventListener('click',handleClick);
    $('#searchInput').addEventListener('input',event=>{ app.query=event.target.value.trim(); if (app.route==='home' && app.query) navigate('research'); else renderRoute(); });
    document.addEventListener('change',event=>{
      if (event.target.id==='kindFilter') { app.kindFilter=event.target.value; renderRoute(); }
      if (event.target.id==='statusFilter') { app.statusFilter=event.target.value; renderRoute(); }
      if (event.target.id==='sortSelect') { app.sort=event.target.value; renderRoute(); }
    });
    $('#themeButton').addEventListener('click',cycleTheme);
    $('#notificationButton').addEventListener('click',requestNotifications);
    $('#syncStatus').addEventListener('click',()=>navigate('sources'));
    $('#openSettings').addEventListener('click',openSettings);
    $('#resetTopicFilter').addEventListener('click',()=>{app.topicFilters.clear();renderRoute();});
    $('#mobileMenu').addEventListener('click',openSidebar);
    $('#sidebarClose').addEventListener('click',closeSidebar);
    $('#sidebarScrim').addEventListener('click',closeSidebar);
    $('#drawerClose').addEventListener('click',closeDrawer);
    $('#drawerBackdrop').addEventListener('click',event=>{if(event.target===$('#drawerBackdrop'))closeDrawer();});
    $('#settingsForm').addEventListener('submit',event=>{ if(event.submitter?.value==='save') saveSettings(); });
    $('#resetProfile').addEventListener('click',resetSettings);
    $('#weightControls').addEventListener('input',event=>{ if(event.target.dataset.weight) $(`[data-weight-value="${CSS.escape(event.target.dataset.weight)}"]`).textContent=event.target.value; });
    $('#exportStateFooter').addEventListener('click',()=>download('research-radar-state.json',Store.exportState(),'application/json'));
    $('#commandInput').addEventListener('input',()=>{app.commandIndex=0;renderCommand();});
    $('#commandInput').addEventListener('keydown',event=>{
      const results=$$('.command-result',$('#commandResults'));
      if(event.key==='ArrowDown'){event.preventDefault();app.commandIndex=Math.min(app.commandIndex+1,results.length-1);renderCommand();}
      else if(event.key==='ArrowUp'){event.preventDefault();app.commandIndex=Math.max(app.commandIndex-1,0);renderCommand();}
      else if(event.key==='Enter'){event.preventDefault();selectCommand($$('.command-result',$('#commandResults'))[app.commandIndex]);}
    });
    window.addEventListener('hashchange',renderRoute);
    window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();app.deferredInstall=event; if(app.route==='home')renderHome();});
    document.addEventListener('keydown',event=>{
      if ((event.metaKey||event.ctrlKey) && event.key.toLowerCase()==='k'){event.preventDefault();openCommand();}
      else if(event.key==='/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){event.preventDefault();$('#searchInput').focus();}
      else if(event.key==='Escape' && !$('#drawerBackdrop').hidden) closeDrawer();
    });
    matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if((getStore().theme||'system')==='system')applyTheme();});
  }

  async function init() {
    hydrateStaticIcons();
    applyTheme();
    bindEvents();
    $('#viewRoot').innerHTML = $('#loadingTemplate').innerHTML;
    try {
      await loadData();
      app.route=currentRouteFromHash();
      renderRoute();
      if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(console.warn);
    } catch (error) {
      console.error(error);
      $('#viewRoot').innerHTML = emptyState('데이터를 불러오지 못했습니다',error.message || 'feed.json을 확인하십시오.');
      updateSyncStatus('error');
    }
  }

  document.addEventListener('DOMContentLoaded',init);
})();
