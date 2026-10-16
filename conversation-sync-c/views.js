/* Conversation Sync prototype: rendering. Every function returns an HTML string. */
(function (CS) {
  'use strict';

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  CS.esc = esc;
  const V = (CS.V = {});
  const P = CS.PEOPLE;

  /* ------------------------------------------------------------ icons */
  const I = {
    logo: '<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><rect x="3" y="5" width="17" height="13" rx="4" fill="currentColor" opacity=".55"/><rect x="11" y="12" width="18" height="13" rx="4" fill="currentColor"/><path d="M16 25l-1 4 5-4" fill="currentColor"/></svg>',
    chat: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    lock: '<svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 11V8a4 4 0 018 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    bag: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 8h14l-1 12H6z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M9 8a3 3 0 016 0" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    menu: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.6"/></svg>',
    send: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 12l16-8-6 16-2-6z" fill="currentColor"/></svg>',
    clock: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    chev: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    left: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    right: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    code: '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M5 12l5 5 9-10" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    list: '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="4" cy="6" r="1.4" fill="currentColor"/><circle cx="4" cy="12" r="1.4" fill="currentColor"/><circle cx="4" cy="18" r="1.4" fill="currentColor"/></svg>',
    mail: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 7l9 6 9-6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    star: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" fill="currentColor"/></svg>',
    signal: '<svg viewBox="0 0 24 24" width="15" height="11" aria-hidden="true"><rect x="2" y="15" width="3.4" height="6" rx="1" fill="currentColor"/><rect x="7.5" y="11" width="3.4" height="10" rx="1" fill="currentColor"/><rect x="13" y="7" width="3.4" height="14" rx="1" fill="currentColor"/><rect x="18.5" y="3" width="3.4" height="18" rx="1" fill="currentColor"/></svg>',
    battery: '<svg viewBox="0 0 28 14" width="22" height="11" aria-hidden="true"><rect x="1" y="1" width="22" height="12" rx="3" fill="none" stroke="currentColor" stroke-width="1.4"/><rect x="3" y="3" width="15" height="8" rx="1.5" fill="currentColor"/><rect x="24" y="5" width="2.4" height="4" rx="1" fill="currentColor"/></svg>',
    info: '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v6M12 7.5v.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    swap: '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M4 8h14l-3-3M20 16H6l3 3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  CS.ICON = I;

  /* ------------------------------------------------------------ helpers */
  const cap = (step, mode, W) => {
    const c = step.caption || {};
    const v = c.both !== undefined ? c.both : c[mode];
    return typeof v === 'function' ? v(W) : v || '';
  };
  const pick = (obj, mode) => (obj ? (obj.both !== undefined ? obj.both : obj[mode]) : undefined);
  CS.pick = pick;
  CS.cap = cap;
  const actionOf = (step, mode) => (typeof step.action === 'string' ? step.action : step.action[mode]);
  CS.actionOf = actionOf;
  const titleOf = (step, mode) => (typeof step.title === 'string' ? step.title : step.title[mode]);
  CS.titleOf = titleOf;
  const gapChip = (id) =>
    `<span class="gap" title="${esc(id + ' · ' + CS.GAPS[id].name)}"><b>${esc(id)}</b> ${esc(CS.GAPS[id].short)}</span>`;
  const gapCode = (id) => `<span class="gap code" title="${esc(id + ' · ' + CS.GAPS[id].name)}"><b>${esc(id)}</b></span>`;
  const num = (id) => `<span class="inum" aria-hidden="true">${CS.ITEMS[id].n}</span>`;
  const itemChips = (ids) => `<span class="ichips">${ids.map((id) => `<span class="ichip" title="${esc('Proposal change ' + CS.ITEMS[id].n + ': ' + CS.ITEMS[id].name)}">${num(id)}${esc(CS.ITEMS[id].short)}</span>`).join('')}</span>`;
  const itemNums = (ids) => `<span class="ichips">${ids.map((id) => `<span class="ichip num-only" title="${esc('Proposal change ' + CS.ITEMS[id].n + ': ' + CS.ITEMS[id].name)}">${num(id)}</span>`).join('')}</span>`;
  const roadPill = (key) => (key ? `<span class="road" title="${esc(CS.ROADMAP[key].note)}">On the roadmap · ${esc(CS.ROADMAP[key].when)}</span>` : '');
  const visTag = (txt, tip) => `<span class="vtag"${tip ? ` title="${esc(tip)}"` : ''}>${esc(txt || 'Vision · not in this proposal')}</span>`;
  CS.itemChips = itemChips;
  const shortTime = (clockText) => clockText.replace(/^[A-Za-z]{3} /, '').replace(/ (am|pm)$/, '');

  /* ------------------------------------------------------------ shell */
  V.topbar = (A) => {
    const nav = (v, label) =>
      `<button class="nav-btn${A.view === v ? ' on' : ''}" data-act="view" data-view="${v}" aria-current="${A.view === v ? 'page' : 'false'}">${label}</button>`;
    const evCount = A.W ? A.W.events.length : 0;
    const vis = A.view === 'demo' && A.curVision;
    return `
<header class="topbar">
  <div class="brand">${I.logo}<div><div class="brand-name">Conversation Sync</div><div class="brand-sub">Siena Live Chat · Scenario C prototype</div></div></div>
  <nav class="nav" aria-label="Pages">${nav('overview', 'Overview')}${nav('demo', 'Demo')}${nav('setup', 'Siena setup')}</nav>
  <div class="tb-right">
    <div class="modeswitch" role="group" aria-label="Which version to show">
      <button class="ms-btn ms-today${A.mode === 'today' ? ' on' : ''}" data-act="mode" data-mode="today" aria-pressed="${A.mode === 'today'}" title="How Live Chat works today (T)"><i></i>Today</button>
      <button class="ms-btn ms-prop${A.mode === 'proposed' ? ' on' : ''}${vis ? ' vis' : ''}" data-act="mode" data-mode="proposed" aria-pressed="${A.mode === 'proposed'}" title="${vis ? 'The vision: where the proposal leads, not part of it (T)' : 'With the proposal (T)'}"><i></i>${vis ? 'Vision' : 'Proposed'}</button>
    </div>
    ${A.view === 'demo' ? `<button class="insp-btn${A.insp ? ' on' : ''}" data-act="insp" data-f="inspector-btn" title="Show what the systems sent each other (I)">${I.code}<span>Inspector</span><em>${evCount}</em></button>` : ''}
  </div>
</header>`;
  };

  /* ------------------------------------------------------------ overview */
  V.overview = (A) => {
    const go = (c, s, branch, label) => `<button class="link" data-act="goto" data-c="${c - 1}" data-s="${s}" data-branch="${branch || 'return'}">${label}</button>`;
    const chLinks = (list) => list.map(([c, s, b]) => go(c, s, b, 'Ch ' + c + (b === 'away' ? ', if Ana doesn’t come back' : ''))).join(' · ');
    const items = CS.ITEM_ORDER.map((id) => {
      const it = CS.ITEMS[id];
      return `
      <article class="pcard">
        <div class="pcard-n">${it.n}</div>
        <h3>${esc(it.name)}</h3>
        <dl>
          <dt class="t">Today</dt><dd>${esc(it.today)}</dd>
          <dt class="p">Proposed</dt><dd>${esc(it.change)}</dd>
        </dl>
        <div class="plist-h">Gaps it closes</div>
        <ul class="pgaps">${it.gaps.map((g) => `<li><b>${g}</b><span>${esc(CS.GAPS[g].name)}</span></li>`).join('')}</ul>
        <div class="pcard-see">See it in ${chLinks(it.see)}</div>
      </article>`;
    }).join('');
    const vis = CS.VISION_ORDER.map((id) => {
      const v = CS.VISION[id];
      return `
      <article class="vcard">
        <div class="vcard-h">${visTag('Vision')}${roadPill(v.roadmap)}</div>
        <h3>${esc(v.name)}</h3>
        <p>${esc(v.what)}</p>
        <div class="vrow"><span>Builds on</span><div>${itemChips(v.builds)}</div></div>
        ${v.roadmap ? `<div class="vrow"><span>Roadmap</span><div>${esc(CS.ROADMAP[v.roadmap].name)} · ${esc(CS.ROADMAP[v.roadmap].when)}</div></div>` : ''}
        <div class="vrow"><span>Still needs</span><div>${esc(v.needs)}</div></div>
        ${v.gaps.length ? `<div class="vrow"><span>Closes</span><div>${v.gaps.map((g) => `<b>${g}</b> ${esc(CS.GAPS[g].short)}`).join(' · ')}</div></div>` : ''}
        <div class="pcard-see">See it in ${chLinks(v.see)}</div>
      </article>`;
    }).join('');
    const ev = CS.EVIDENCE.map((e) => `<div class="evi"><b>${esc(e.big)}</b><span>${esc(e.text)}</span></div>`).join('');
    return `
<div class="ov">
  <section class="ov-hero">
    <div class="ov-copy">
      <div class="kicker">Siena Live Chat · Scenario C · Voice of the user</div>
      <h1>One conversation, one ticket, every reply accounted for</h1>
      <p class="lede">A clickable prototype of the brief for Noor, <i>Siena support architecture fine-tuning</i>: five changes that keep a chat and its helpdesk ticket in step. Follow Moss &amp; Marrow through one day and flip any step between how Live Chat works <span class="t">today</span> and the <span class="p">proposal</span>. The last two chapters show the <span class="v">vision</span> these changes open up. It isn’t part of the proposal.</p>
      <div class="ov-cta">
        <button class="btn primary big" data-act="goto" data-c="0" data-s="0">Start the demo ${I.right}</button>
        <button class="btn ghost big" data-act="goto" data-c="4" data-s="0">Skip to the vision</button>
      </div>
      <p class="ov-small">About five minutes for the proposal (chapters 1 to 4) and three for the vision (5 and 6). Use <kbd>←</kbd> <kbd>→</kbd> to move, <kbd>T</kbd> to switch, <kbd>I</kbd> for the Inspector.</p>
    </div>
    <figure class="ov-fig">${V.diagram()}<figcaption>The reply path. Today it depends on a relay address that dies with the chat session. With the proposal, Zendesk tells Siena about every reply, and Siena delivers it in chat, or holds it until the shopper is back and says so on the ticket. Emailing it later is part of the vision.</figcaption></figure>
  </section>

  <section class="ov-sec">
    <h2>Why it matters</h2>
    <div class="evid">${ev}</div>
    <p class="sec-note">A longer default session, or asking merchants to change theirs, won’t fix it: the conversation would still end with the session. And because Siena bills per resolution, duplicate sessions can inflate a merchant’s bill. Nobody has raised that yet, but an audit would.</p>
  </section>

  <section class="ov-sec">
    <h2>The proposal: five changes</h2>
    <p class="sec-lede">From the brief. None of them adds a screen merchants have to learn: they change what Siena writes to the helpdesk and how replies come back. Each card links to where you can see it in the demo.</p>
    <div class="pgrid p5">${items}</div>
    <div class="lim">
      <div><h4>Limits</h4><ul>${CS.LIMITS.map((l) => `<li>${esc(l)}</li>`).join('')}</ul></div>
      <div><h4>Questions for Product</h4><ol>${CS.QUESTIONS.map((q) => `<li>${esc(q)}</li>`).join('')}</ol></div>
    </div>
  </section>

  <section class="ov-sec ov-vision">
    <h2>The vision: where this leads</h2>
    <p class="sec-lede">Not part of this proposal. Each idea below needs one or more of the five changes first, which is why they come first. Two of them line up with work already on the roadmap: the after-hours tag (Next · Q1 2027) and scheduled availability (Q1 2027).</p>
    <div class="vgrid">${vis}</div>
  </section>

  <section class="ov-sec ov-how">
    <h2>What you are looking at</h2>
    <div class="how">
      <div><b>Left: the shopper’s phone.</b> The Moss &amp; Marrow store with the Siena chat widget.</div>
      <div><b>Right: Theo’s Zendesk.</b> A Zendesk-style agent workspace with the ticket, the Siena fields and a Siena side panel that shows whether the shopper is still on the site.</div>
      <div><b>Inspector.</b> Every API call, webhook and email between Siena, Zendesk and the widget, with payloads modelled on Zendesk’s API.</div>
      <div><b>Siena setup.</b> What the proposal sets up in Zendesk and, kept apart, the settings the vision would add.</div>
    </div>
    <p class="how-legend"><span class="lg lg-t">Orange</span> is how Live Chat works today, <span class="lg lg-p">purple</span> is the proposal, and <span class="lg lg-v">teal</span> is the vision, which isn’t part of the proposal. Outlines point at what changed in each step. Dashed boxes marked <b>Demo note</b> are commentary, not part of either product.</p>
  </section>
  <footer class="ov-foot">Prototype with simulated data, built for the Siena Product Specialist case study. Not a Siena product, and not affiliated with Zendesk. Merchant names and ticket references come from the confidential case-study pack. Please don’t share this link.</footer>
</div>`;
  };

  V.diagram = () => `
<svg class="diag" viewBox="0 0 600 340" role="img" aria-label="Reply path today, with the proposal, and the vision">
  <defs>
    <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker>
  </defs>
  <text x="0" y="16" class="d-lab d-t">TODAY</text>
  <rect x="0" y="30" width="118" height="48" rx="10" class="d-box"/><text x="59" y="59" class="d-txt">Zendesk</text>
  <line x1="120" y1="54" x2="200" y2="54" class="d-line" marker-end="url(#ah)"/><text x="160" y="46" class="d-small">email</text>
  <rect x="204" y="30" width="176" height="48" rx="10" class="d-box"/><text x="292" y="51" class="d-txt">relay+7f3a91</text><text x="292" y="68" class="d-small">lives for one session</text>
  <line x1="382" y1="54" x2="440" y2="54" class="d-line d-fail" marker-end="url(#ah)"/>
  <rect x="444" y="30" width="156" height="48" rx="10" class="d-box d-failbox"/><text x="522" y="51" class="d-txt d-failtxt">Dropped</text><text x="522" y="68" class="d-small">after 1 hour idle</text>

  <text x="0" y="128" class="d-lab d-p">PROPOSED</text>
  <rect x="0" y="182" width="118" height="48" rx="10" class="d-box"/><text x="59" y="211" class="d-txt">Zendesk</text>
  <line x1="120" y1="206" x2="196" y2="206" class="d-line d-ok" marker-end="url(#ah)"/><text x="158" y="198" class="d-small">webhook</text>
  <rect x="200" y="176" width="164" height="60" rx="10" class="d-box d-pbox"/><text x="282" y="202" class="d-txt">Siena</text><text x="282" y="220" class="d-small">knows the conversation</text>
  <line x1="366" y1="194" x2="440" y2="164" class="d-line d-ok" marker-end="url(#ah)"/>
  <line x1="366" y1="206" x2="440" y2="214" class="d-line d-ok" marker-end="url(#ah)"/>
  <line x1="366" y1="220" x2="440" y2="268" class="d-line d-vis" marker-end="url(#ah)"/>
  <rect x="444" y="140" width="156" height="42" rx="10" class="d-box d-okbox"/><text x="522" y="166" class="d-txt">In chat now</text>
  <rect x="444" y="194" width="156" height="42" rx="10" class="d-box d-heldbox"/><text x="522" y="213" class="d-txt">Held, shown</text><text x="522" y="228" class="d-small">when they come back</text>
  <rect x="444" y="250" width="156" height="48" rx="10" class="d-box d-visbox"/><text x="522" y="272" class="d-txt">Emailed later</text><text x="522" y="289" class="d-small d-vistxt">vision · not proposed</text>
  <text x="600" y="330" class="d-small d-end">Delivered or held, every reply is recorded on the ticket</text>
</svg>`;

  /* ------------------------------------------------------------ demo */
  V.storybar = (A, W, ch, step, next) => {
    const mode = A.mode;
    const chs = A.chapters;
    const vis = CS.isVision(ch, step);
    const vItem = step.vision ? CS.VISION[step.vision] : null;
    const gaps = pick(step.gaps, mode) || [];
    const sols = mode === 'proposed' && !vis ? step.sol || [] : [];
    const caption = cap(step, mode, W);
    const other = mode === 'today' ? 'proposed' : 'today';
    const otherLabel = other === 'today' ? 'Show today' : (vis ? 'Show the vision' : 'Show the proposal');
    const flip = `<button class="flip flip-${other}${other === 'proposed' && vis ? ' flip-vis' : ''}" data-act="mode" data-mode="${other}" title="${esc(otherLabel)} (T)">${I.swap}${otherLabel}</button>`;
    const dots = ch.steps.map((s, i) => `<button class="dot${i < A.pos.s ? ' done' : ''}${i === A.pos.s ? ' cur' : ''}${CS.isVision(ch, s) ? ' vis' : ''}" data-act="goto" data-c="${A.pos.c}" data-s="${i}" title="${esc((CS.isVision(ch, s) ? 'Vision: ' : '') + titleOf(s, mode))}" aria-label="Step ${i + 1}: ${esc(titleOf(s, mode))}"></button>`).join('');
    const isLast = A.pos.c === chs.length - 1 && A.pos.s === ch.steps.length - 1;
    const isFirst = A.pos.c === 0 && A.pos.s === 0;
    const nextLabel = isLast ? 'Start over' : actionOf(next, mode);
    const nextVis = !isLast && next && CS.isVision(chs.find((c) => c.steps.indexOf(next) >= 0) || ch, next);
    const branchCtl = ch.branch
      ? `<div class="branch" role="group" aria-label="What happens next"><button class="${A.branch === 'return' ? 'on' : ''}" data-act="branch" data-branch="return">Ana comes back</button><button class="${A.branch === 'away' ? 'on' : ''}" data-act="branch" data-branch="away">She doesn’t</button></div>`
      : '';
    const branchHint = A.pos.c === 1 && A.pos.s === ch.steps.length - 1
      ? `<div class="sb-try">What if Ana never comes back? <button class="link" data-act="branch-go" data-branch="away">Try that path</button></div>` : '';
    const menu = A.chMenu ? `
      <div class="chmenu" role="menu">
        ${chs.map((c, ci) => `
          ${ci === 0 ? '<div class="chm-group">The proposal</div>' : ''}${c.vision && !chs[ci - 1].vision ? '<div class="chm-group vis">The vision · not in this proposal</div>' : ''}
          <div class="chm-ch${ci === A.pos.c ? ' cur' : ''}${c.vision ? ' vis' : ''}">
            <div class="chm-title"><span>${c.n}</span>${esc(c.title)}</div>
            ${c.steps.map((s, si) => `<button role="menuitem" class="chm-step${ci === A.pos.c && si === A.pos.s ? ' cur' : ''}" data-act="goto" data-c="${ci}" data-s="${si}"><span>${esc(s.clock.replace(/^[A-Za-z]{3} /, ''))}</span>${esc(titleOf(s, mode))}${s.vision && !c.vision ? '<em class="chm-v">Vision</em>' : ''}</button>`).join('')}
          </div>`).join('')}
      </div>` : '';
    const modeTag = mode === 'today' ? 'Today' : (vis ? 'Vision' : 'Proposed');
    let visLine = '';
    if (vis && mode === 'proposed') {
      visLine = vItem
        ? `<div class="sb-vis">${visTag('', vItem.name)}<span class="sb-lab">Builds on</span>${itemNums(vItem.builds)}${roadPill(vItem.roadmap)}</div>`
        : `<div class="sb-vis">${visTag()}<span class="sb-vname">What the five changes make possible later</span></div>`;
    }
    let chipsRow = '';
    if (mode === 'today' && gaps.length) {
      chipsRow = `<div class="sb-gaps"><span class="sb-lab">Gaps</span>${gaps.map((g) => gapChip(g)).join('')}</div>`;
    } else if (mode === 'proposed' && !vis && (sols.length || gaps.length)) {
      chipsRow = `<div class="sb-gaps">${sols.length ? `<span class="sb-lab">Uses</span>${itemChips(sols)}` : ''}${gaps.length ? `<span class="sb-lab sb-lab2">Fixes</span>${gaps.map((g) => gapCode(g)).join('')}` : ''}</div>`;
    }
    return `
<section class="storybar${A.chMenu ? ' with-menu' : ''}">
  <div class="sb-left">
    <button class="sb-ch" data-act="chmenu" aria-expanded="${A.chMenu}" aria-haspopup="menu">
      <span class="sb-chn">Chapter ${ch.n} of ${chs.length}${ch.vision ? ' · <em>Vision</em>' : ''}</span>
      <span class="sb-cht">${esc(ch.title)} ${I.chev}</span>
    </button>
    <div class="dots">${dots}</div>
    ${branchCtl}
    ${branchHint}
    ${menu}
  </div>
  <div class="sb-mid">
    <div class="sb-meta"><span class="mode-tag">${modeTag}</span><span class="sb-clock">${I.clock}${esc(W.clockText)}</span><span class="sb-stitle">${esc(titleOf(step, mode))}</span>${flip}</div>
    ${visLine}
    <p class="sb-cap" aria-live="polite">${esc(caption)}</p>
    ${chipsRow}
  </div>
  <div class="sb-right">
    <button class="btn ghost" data-act="back" ${isFirst ? 'disabled' : ''} aria-label="Back">${I.left} Back</button>
    <button class="btn primary next${nextVis && mode === 'proposed' && !vis ? ' to-vis' : ''}" data-act="next">${esc(nextLabel)} ${I.right}</button>
    <div class="sb-hint"><kbd>←</kbd><kbd>→</kbd> move · <kbd>T</kbd> switch</div>
  </div>
</section>`;
  };

  /* phone */
  const productArt = (kind, tint) => {
    if (kind === 'bottle') return `
<svg viewBox="0 0 200 200" class="art" aria-hidden="true">
  <rect width="200" height="200" fill="${tint}"/>
  <circle cx="150" cy="48" r="26" fill="#f4ead8" opacity=".9"/>
  <path d="M30 170c20-30 40-46 70-52" stroke="#7d9a72" stroke-width="3" fill="none"/><ellipse cx="52" cy="140" rx="12" ry="6" transform="rotate(-35 52 140)" fill="#93ad86"/><ellipse cx="74" cy="126" rx="12" ry="6" transform="rotate(-20 74 126)" fill="#93ad86"/>
  <rect x="88" y="40" width="24" height="22" rx="4" fill="#2f3b33"/><rect x="92" y="28" width="16" height="16" rx="8" fill="#3c4a40"/>
  <rect x="76" y="60" width="48" height="104" rx="12" fill="#b9732f"/><rect x="76" y="60" width="48" height="104" rx="12" fill="url(#gl)" opacity=".35"/>
  <rect x="82" y="96" width="36" height="40" rx="4" fill="#f7f1e6"/><text x="100" y="114" text-anchor="middle" font-family="Georgia,serif" font-size="7" fill="#2f4a3a">ROSEHIP</text><text x="100" y="125" text-anchor="middle" font-family="Georgia,serif" font-size="5" fill="#5f7a5d">RENEWAL OIL</text>
  <defs><linearGradient id="gl" x1="0" x2="1"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
</svg>`;
    if (kind === 'box') return `
<svg viewBox="0 0 200 200" class="art" aria-hidden="true">
  <rect width="200" height="200" fill="${tint}"/>
  <path d="M46 84l54-20 54 20v62l-54 22-54-22z" fill="#d8bf9c"/><path d="M46 84l54 20 54-20" fill="none" stroke="#b99a72" stroke-width="2"/><path d="M100 104v64" stroke="#b99a72" stroke-width="2"/>
  <path d="M46 84l54-20 54 20-54 20z" fill="#e5d0b1"/>
  <rect x="62" y="112" width="30" height="20" rx="3" fill="#f7f1e6" transform="skewY(10)"/><text x="77" y="139" text-anchor="middle" font-family="Georgia,serif" font-size="5" fill="#2f4a3a" transform="skewY(10) translate(0 -14)">CALM SKIN</text>
  <path d="M120 70c10-22 30-24 40-20-6 14-22 22-40 20z" fill="#7d9a72"/>
</svg>`;
    return `
<svg viewBox="0 0 200 200" class="art" aria-hidden="true">
  <rect width="200" height="200" fill="${tint}"/>
  <ellipse cx="100" cy="150" rx="56" ry="10" fill="#cfc6dd"/>
  <rect x="50" y="96" width="100" height="56" rx="14" fill="#fbf9f5"/><rect x="46" y="76" width="108" height="28" rx="10" fill="#8a7aa8"/>
  <text x="100" y="128" text-anchor="middle" font-family="Georgia,serif" font-size="9" fill="#2f4a3a">CALM BALM</text>
  <path d="M150 60c14-8 24-2 26 6-10 6-20 4-26-6z" fill="#93ad86"/>
</svg>`;
  };

  V.phone = (A, W, pend, prev) => {
    const ph = W.phone;
    const seen = prev && prev.phone.owner === ph.owner && !prev.phone.lock ? prev.phone.messages.length : (prev && prev.phone.owner === ph.owner ? prev.phone.messages.length : 0);
    const pr = CS.PRODUCTS[ph.page];
    const time = shortTime(W.clockText);
    const pendW = pend && pend.surface === 'widget' ? pend : null;
    const msgs = ph.messages.map((m, i) => {
      const last = i === ph.messages.length - 1 ? ' data-f="widget-last"' : '';
      if (m.from === 'divider') return `<div class="w-div"${last}><span>${esc(m.text)}</span></div>`;
      if (m.from === 'rating') return `<div class="w-rate"${last}><div class="stars">${[1, 2, 3, 4, 5].map((n) => `<span class="${n <= +m.text ? 'on' : ''}">${I.star}</span>`).join('')}</div><div class="w-rated">Thanks for rating us!</div></div>`;
      const cls = (m.from === 'visitor' ? 'me' : m.from === 'agent' ? 'agent' : 'ai') + (i >= seen ? ' new' : '');
      const who = m.from === 'agent' ? `<div class="w-who"><span class="w-av">T</span>${esc(m.name || 'Theo')} · Moss &amp; Marrow</div>` : '';
      return `<div class="w-msg ${cls}${m.fresh ? ' fresh' : ''}"${last}>${who}<div class="w-bub">${esc(m.text)}</div><div class="w-time">${esc(m.time)}</div></div>`;
    }).join('');
    const inputVal = pendW ? (A.ov[pendW.key] != null ? A.ov[pendW.key] : pendW.value) : '';
    const widget = ph.widgetOpen ? `
      <div class="widget" data-f="widget">
        <div class="w-head"><div class="w-logo">M&amp;M</div><div class="w-ht"><div class="w-title">${esc(ph.header.title)}</div><div class="w-sub">${esc(ph.header.sub)}</div></div><span class="w-x">${I.x}</span></div>
        <div class="w-msgs">${msgs}</div>
        <div class="w-input${pendW ? ' pending' : ''}" ${pendW ? 'data-f="widget-input"' : ''}>
          <textarea id="pend-widget" rows="2" ${pendW ? '' : 'disabled'} placeholder="${pendW ? '' : 'Message…'}" aria-label="${pendW ? 'Message from ' + esc(pendW.who) : 'Chat input'}">${esc(inputVal)}</textarea>
          <button class="w-send" ${pendW ? 'data-act="next"' : 'disabled'} aria-label="Send">${I.send}</button>
        </div>
        <div class="w-foot">Powered by Siena</div>
      </div>` : '';
    const lock = ph.lock ? `
      <div class="lock" data-f="phone-lock">
        <div class="lk-time">${esc(ph.lock.time)}</div>
        <div class="lk-date">${esc(ph.lock.date)}</div>
        <div class="lk-notifs">${ph.lock.notifs.map((n) => `<div class="lk-n" data-f="phone-notif"><div class="lk-nh"><span class="lk-app">${I.mail}${esc(n.app)}</span><span>now</span></div><b>${esc(n.title)}</b><div class="lk-ns">${esc(n.sub)}</div><div class="lk-nb">${esc(n.body)}</div></div>`).join('')}</div>
      </div>` : '';
    return `
<div class="phone"><div class="screen">
  <div class="statusbar${ph.lock ? ' onlock' : ''}"><span>${esc(time)}</span><span class="sbi">${I.signal}${I.battery}</span></div>
  <div class="urlbar">${I.lock}<span>${esc(CS.STORE.domain + pr.path)}</span></div>
  <div class="store">
    <div class="st-head"><span class="st-ic">${I.menu}</span><span class="st-logo">MOSS &amp; MARROW</span><span class="st-ic st-user">${ph.user ? 'Hi, ' + esc(ph.user) : 'Log in'} ${I.bag}</span></div>
    <div class="st-hero">${productArt(pr.art, pr.tint)}</div>
    <div class="st-info">
      <div class="st-crumb">${esc(pr.size)}</div>
      <h4>${esc(pr.name)}</h4>
      <div class="st-price">${esc(pr.price)} <span>${esc(pr.sub)}</span></div>
      <div class="st-stars">★★★★★ <span>214 reviews</span></div>
      <p>${esc(pr.blurb)}</p>
    </div>
  </div>
  <div class="atc"><button tabindex="-1">Add to cart · ${esc(pr.price.split(' ')[0])}</button></div>
  <div class="bubble${ph.badge ? ' has-badge' : ''}" data-f="bubble">${I.chat}${ph.badge ? `<em>${ph.badge}</em>` : ''}</div>
  ${widget}
  ${lock}
</div></div>`;
  };

  /* zendesk */
  const statusPill = (s) => `<span class="st-pill st-${s.toLowerCase()}">${esc(s)}</span>`;

  V.zendesk = (A, W, prev, pend) => {
    const mode = A.mode;
    const story = W.tickets.filter((t) => t.story);
    const activeId = A.zdActive === 'home' ? null : (A.zdActive != null ? A.zdActive : W.active);
    const tabs = story.map((t) => `<button class="zt${t.id === activeId && !A.zdView ? ' on' : ''}" data-act="ztab" data-id="${t.id}" title="${esc(t.subject)}"><span class="zt-id">#${t.id}</span><span class="zt-s">${esc(t.subject)}</span></button>`).join('');
    const views = CS.views(W, A);
    const viewChips = views.map((v) => `<button class="zv${A.zdView === v.key ? ' on' : ''}" data-act="zview" data-view="${v.key}" data-f="view-${v.key}">${esc(v.label)}<em>${v.items.length}</em></button>`).join('');
    let body;
    if (A.zdView) {
      const v = views.find((x) => x.key === A.zdView) || views[0];
      body = V.zdList(v.label, v.items, v.help);
    } else if (activeId == null) {
      const started = W.tickets.some((t) => t.story);
      body = V.zdList('Your unsolved tickets', W.tickets.filter((t) => t.status !== 'Solved'),
        started ? 'Theo’s open tickets. Click a row or a tab to open a ticket.' : 'Theo’s queue before the story starts. Chat tickets will appear here.', W.zdNote);
    } else {
      body = V.zdTicket(A, W, prev, W.tk(activeId), pend);
    }
    return `
<div class="zd">
  <div class="zd-top">
    <div class="zd-brand"><span class="zd-mark">MM</span><div><b>Moss &amp; Marrow Support</b><small>Zendesk-style mock-up · Team plan</small></div></div>
    <div class="zd-tabs" data-f="zd-tabs"><button class="zt home${activeId == null && !A.zdView ? ' on' : ''}" data-act="zhome" title="Ticket list">${I.list}</button>${tabs}</div>
    <div class="zd-agent" title="Theo Mbeki, agent">TM</div>
  </div>
  <div class="zd-views" data-f="zd-views"><span class="zv-lab">Views</span>${viewChips}</div>
  ${body}
</div>`;
  };

  /* views shown as chips. Today: by tag. Proposed: by Siena fields. */
  CS.views = (W, A) => {
    const all = W.tickets;
    if (W.today) {
      return [
        { key: 'unsolved', label: 'Unsolved', items: all.filter((t) => t.status !== 'Solved'), help: 'Every open, new or pending ticket.' },
        { key: 'chat', label: 'Live Chat (tag)', items: all.filter((t) => t.tags.indexOf(CS.TODAY_TAGS.handoff) >= 0), help: 'Built on the siena-live-chat-handoff tag, as help centre article 06 suggests. Any “Set tags” macro removes tickets from it.' }
      ];
    }
    const f = (t, k) => (t.fields && t.fields[k]) || '';
    return [
      { key: 'all', label: 'Siena chats', items: all.filter((t) => /Siena/.test(f(t, 'source'))), help: 'Siena source contains “Siena”. A text field, so macros can’t clear it.' },
      { key: 'waiting', label: 'Waiting on agent', items: all.filter((t) => /awaiting agent/.test(f(t, 'outcome'))), help: 'Siena outcome contains “awaiting agent”.' },
      { key: 'held', label: 'Reply held', items: all.filter((t) => /^Held/.test(f(t, 'delivery'))), help: 'Reply delivery starts with “Held”: the shopper hasn’t seen the reply yet.' },
      { key: 'assumed', label: 'Resolved by Siena, assumed', items: all.filter((t) => /assumed/.test(f(t, 'outcome'))), help: 'Closed because the shopper went quiet, not because they confirmed. Tagged siena-resolved-by-ai.' },
      { key: 'after', label: 'After hours', items: all.filter((t) => /outside hours/.test(f(t, 'mode'))), help: 'Reply mode contains “outside hours”. Works with the proposal’s fields alone; the after-hours tag on the roadmap (Q1 2027) will give tag-based rules the same split.' }
    ];
  };

  V.zdList = (title, items, help, note) => `
<div class="zd-list" data-f="zd-list">
  <div class="zl-head"><h3>${esc(title)} <span>${items.length}</span></h3>${help ? `<p>${esc(help)}</p>` : ''}</div>
  ${note ? `<div class="demo-note zl-note ${note.tone === 'today' ? 'today' : 'prop'}" data-f="zd-note"><b>Demo note</b> ${esc(note.text)}</div>` : ''}
  <table class="zl-table"><thead><tr><th>ID</th><th>Subject</th><th>Requester</th><th>Status</th><th>Created</th></tr></thead>
  <tbody>${items.length ? items.map((t) => `<tr data-act="ztab" data-id="${t.id}" tabindex="0"><td>#${t.id}</td><td>${esc(t.subject)}</td><td class="${t.requester.kind === 'relay' ? 'relay' : ''}">${esc(t.requester.kind === 'relay' ? t.requester.email : t.requester.name)}</td><td>${statusPill(t.status)}</td><td>${esc(t.created)}</td></tr>`).join('') : `<tr class="empty"><td colspan="5">No tickets in this view.</td></tr>`}</tbody></table>
</div>`;

  V.zdTicket = (A, W, prev, t, pend) => {
    const mode = A.mode;
    const pt = prev ? prev.tk(t.id) : null;
    const changed = (k) => (pt && pt.fields && t.fields && pt.fields[k] !== t.fields[k] ? ' changed' : '');
    const tagsChanged = pt && pt.tags.join('|') !== t.tags.join('|');
    const req = t.requester;
    const reqHtml = `
      <div class="req${req.kind === 'relay' ? ' relay' : ''}" data-f="requester">
        <span class="av">${esc(req.initials || '?')}</span>
        <div><b>${esc(req.name)}</b><small>${esc(req.email || 'no email · anonymous visitor')}</small></div>
      </div>`;
    const fieldsOn = CS.FIELDS.filter((f) => A.settings.fields[f.key] !== false);
    let sienaFields = '';
    if (t.story && W.prop) {
      sienaFields = `
        <div class="pgroup" data-f="fields">
          <div class="pg-head">Siena Live Chat <span>set by Siena via API</span></div>
          ${fieldsOn.map((f) => `<div class="fld${changed(f.key)}" data-f="field-${f.key}"><label title="${esc(f.help)}">${esc(f.label)}</label><div class="fbox${/Held/.test(t.fields[f.key]) ? ' held' : /Delivered|Emailed|confirmed/.test(t.fields[f.key]) ? ' ok' : ''}">${esc(t.fields[f.key] || '—')}</div></div>`).join('')}
        </div>`;
    } else if (t.story && W.today) {
      sienaFields = `<div class="demo-note today" data-f="fields-empty"><b>Demo note</b> No Live Chat fields on this ticket. The tag is the only trace of the chat.</div>`;
    }
    const comments = t.comments.map((c, i) => {
      const isLast = i === t.comments.length - 1;
      if (c.role === 'event') {
        const isNewE = pt ? !pt.comments.some((x) => x.id === c.id) : false;
        return `<div class="cm-event${isNewE ? ' new' : ''}"${isLast ? ' data-f="comment-last"' : ''}><time>${esc(c.time)}</time><b>${esc(c.author)}</b> ${esc(c.text)}</div>`;
      }
      const lastNote = c.role === 'note' && t.comments.slice(i + 1).every((x) => x.role !== 'note');
      const lastAgent = c.role === 'agent' && t.comments.slice(i + 1).every((x) => x.role !== 'agent');
      const fAttr = [isLast ? 'comment-last' : '', lastNote ? 'note-last' : '', lastAgent ? 'comment-agent' : ''].filter(Boolean).join(' ');
      const roleLabel = { enduser: 'End user', ai: 'Siena AI', agent: 'Agent', note: 'Internal note' }[c.role];
      const av = c.role === 'ai' || (c.role === 'note' && c.author === P.siena.name) ? 'AI' : c.role === 'agent' ? 'TM' : (t.requester.initials || '?');
      const isNew = pt ? !pt.comments.some((x) => x.id === c.id) : false;
      return `
        <article class="cm r-${c.role}${isNew ? ' new' : ''}"${fAttr ? ` data-f="${fAttr}"` : ''}>
          <span class="cm-av${c.role === 'ai' || av === 'AI' ? ' ai' : ''}">${esc(av)}</span>
          <div class="cm-main">
            <div class="cm-head"><b>${esc(c.author)}</b><span class="cm-role">${roleLabel}</span><time>${esc(c.time)}</time></div>
            <div class="cm-body${c.pre ? ' pre' : ''}">${esc(c.text)}</div>
            ${c.demo ? `<div class="demo-note ${mode === 'today' ? 'today' : 'prop'}"><b>Demo note</b> ${esc(c.demo.text)}</div>` : ''}
          </div>
        </article>`;
    }).join('');
    const pendC = pend && pend.surface === 'composer' && W.active === t.id ? pend : null;
    const cval = pendC ? (A.ov[pendC.key] != null ? A.ov[pendC.key] : pendC.value) : '';
    const to = req.email || req.name;
    const composer = `
      <div class="composer${pendC ? ' pending' : ''}" ${pendC ? 'data-f="composer"' : ''}>
        <div class="cp-tabs"><span class="on">Public reply</span><span>Internal note</span><span class="cp-to">To: <b class="${req.kind === 'relay' ? 'relay' : ''}">${esc(to)}</b></span></div>
        <textarea id="pend-composer" rows="3" ${pendC ? '' : 'disabled'} placeholder="${pendC ? '' : 'Not used in this step'}" aria-label="Public reply">${esc(cval)}</textarea>
        <div class="cp-foot"><span class="cp-macro" data-f="macro">Apply macro ${I.chev}</span><button class="cp-submit" ${pendC ? 'data-act="next"' : 'disabled'}>${esc(pendC ? pendC.submit : 'Submit as Open')}</button></div>
      </div>`;
    const tagList = t.tags.length ? t.tags.map((g) => `<span class="tag">${esc(g)}</span>`).join('') : '<span class="muted">No tags</span>';
    return `
<div class="zd-body">
  <aside class="zd-props">
    <div class="prop"><label>Requester</label>${reqHtml}</div>
    <div class="prop"><label>Assignee</label><div class="pbox">${esc(t.assignee)}</div></div>
    <div class="prop"><label>Group</label><div class="pbox">${esc(t.group)}</div></div>
    <div class="prop${tagsChanged ? ' changed' : ''}" data-f="tags"><label>Tags</label><div class="tags">${tagList}</div>${t.demo ? `<div class="demo-note today"><b>Demo note</b> ${esc(t.demo.text)}</div>` : ''}</div>
    ${sienaFields}
  </aside>
  <section class="zd-conv" data-f="conv">
    <div class="cv-head">
      <h2>${esc(t.subject)}</h2>
      <div class="cv-meta">${statusPill(t.status)}<span>#${t.id}</span><span>via ${esc(t.via)}</span><span>${esc(t.created)}</span>${t.externalId ? `<span class="ext" title="Zendesk external ID">External ID <code>${esc(t.externalId)}</code></span>` : ''}</div>
    </div>
    <div class="cv-list">${comments}</div>
    ${composer}
  </section>
  <aside class="zd-ctx">${V.zdContext(A, W, t)}</aside>
</div>`;
  };

  V.zdContext = (A, W, t) => {
    const req = t.requester;
    let customer;
    if (!t.story) {
      customer = `<div class="ctx-card" data-f="ctx-customer"><h4>Customer</h4><div class="ctx-name">${esc(req.name)}</div><div class="ctx-sub">${esc(req.email)}</div><div class="ctx-row"><span>Channel</span><b>Email</b></div></div>`;
    } else if (req.kind === 'relay') {
      customer = `<div class="ctx-card" data-f="ctx-customer"><h4>Customer</h4><div class="ctx-name relay">${esc(req.email)}</div><div class="ctx-sub">Unknown end user</div>
        <div class="ctx-row"><span>Other tickets</span><b>0</b></div><div class="ctx-row"><span>Shopify customer</span><b>Not linked</b></div>
        <div class="demo-note today"><b>Demo note</b> ${t.who === 'ana' ? 'Siena knew this was Ana. Zendesk doesn’t.' : 'A relay address, not a person. No way to reach them once the session ends.'}</div></div>`;
    } else if (req.kind === 'anon') {
      customer = `<div class="ctx-card" data-f="ctx-customer"><h4>Customer</h4><div class="ctx-name">${esc(req.name)}</div><div class="ctx-sub">Not logged in · no email</div><div class="ctx-row"><span>Visitor ID</span><b><code>${esc((P[t.who] || P.guest).visitorId)}</code></b></div></div>`;
    } else if (t.who === 'ana') {
      customer = `<div class="ctx-card" data-f="ctx-customer"><h4>Customer <span class="src">from Shopify</span></h4><div class="ctx-name">${esc(P.ana.name)}</div><div class="ctx-sub">${esc(P.ana.email)}</div>
        <div class="ctx-row"><span>Subscriber since</span><b>${esc(P.ana.since)}</b></div><div class="ctx-row"><span>Plan</span><b>${esc(P.ana.plan)}</b></div>
        <div class="ctx-row"><span>Last order</span><b>${esc(P.ana.lastOrder)}</b></div><div class="ctx-row"><span>Orders</span><b>${P.ana.orders} · ${esc(P.ana.spend)}</b></div>
        <div class="ctx-row"><span>External ID</span><b><code>shopify:${esc(P.ana.shopifyId)}</code></b></div></div>`;
    } else {
      customer = `<div class="ctx-card" data-f="ctx-customer"><h4>Customer</h4><div class="ctx-name">${esc(req.name)}</div><div class="ctx-sub">${esc(req.email)}</div><div class="ctx-row"><span>Source</span><b>Email given in chat</b></div><div class="ctx-row"><span>Other tickets</span><b>0</b></div></div>`;
    }
    let siena = '';
    if (t.story && W.prop && t.siena) {
      const s = t.siena;
      siena = `
        <div class="ctx-card siena" data-f="ctx-siena">
          <h4>Siena <span class="src">app</span></h4>
          <div class="presence ${s.presence}" data-f="presence"><i></i>${s.presence === 'online' ? 'Shopper on the site now' : 'Offline · last seen ' + esc(s.lastSeen)}</div>
          <div class="ctx-row"><span>Conversation</span><b><code>${esc(s.conv)}</code></b></div>
          <div class="ctx-row"><span>Sessions</span><b>${esc(t.fields.sessions || '1')}</b></div>
          ${s.resumeUntil ? `<div class="ctx-row"><span>Open until</span><b>${esc(s.resumeUntil)}</b></div>` : ''}
          <ol class="tline">${s.timeline.map((e) => `<li class="${e.tone}"><time>${esc(e.time)}</time>${esc(e.text)}</li>`).join('')}</ol>
        </div>`;
    }
    return customer + siena;
  };

  /* inspector */
  const jsonHl = (obj) => {
    const json = JSON.stringify(obj, null, 2);
    return json.replace(/("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (m) => {
      let cls = 'jn';
      if (m.charAt(0) === '"') cls = /:$/.test(m) ? 'jk' : 'js';
      else if (/^(true|false|null)$/.test(m)) cls = 'jb';
      return '<span class="' + cls + '">' + esc(m) + '</span>';
    });
  };

  V.inspector = (A, W) => {
    if (!A.insp) return '';
    const evs = W.events;
    const cur = W.currentKey;
    const curEvs = evs.filter((e) => e.step === cur);
    const selN = A.inspSel != null && evs.some((e) => e.n === A.inspSel) ? A.inspSel : (curEvs.length ? curEvs[curEvs.length - 1].n : (evs.length ? evs[evs.length - 1].n : null));
    const sel = evs.find((e) => e.n === selN);
    const groups = [];
    evs.forEach((e) => { const g = groups.find((x) => x.step === e.step); if (g) g.items.push(e); else groups.push({ step: e.step, items: [e] }); });
    const kindIcon = { api: 'API', webhook: 'HOOK', email: 'MAIL', widget: 'CHAT', internal: 'LOG' };
    const list = groups.map((g) => `
      <div class="ig${g.step === cur ? ' cur' : ''}">
        <div class="ig-h">Step ${esc(g.step)}${g.step === cur ? ' <em>this step</em>' : ''}</div>
        ${g.items.map((e) => `<button class="ie s-${e.status}${e.n === selN ? ' on' : ''}" data-act="isel" data-n="${e.n}"><span class="ik k-${e.kind}">${kindIcon[e.kind] || 'LOG'}</span><span class="it"><b>${esc(e.title)}</b><small>${esc(e.time)} · ${esc(e.from)}${e.to ? ' → ' + esc(e.to) : ''}</small></span><i class="idot"></i></button>`).join('')}
      </div>`).join('');
    const detail = sel ? `
      <div class="id-head"><span class="ik k-${sel.kind}">${kindIcon[sel.kind] || 'LOG'}</span><div><h4>${esc(sel.title)}</h4><div class="id-route">${esc(sel.time)} · ${esc(sel.from)}${sel.to ? ' → ' + esc(sel.to) : ''} · <span class="st s-${sel.status}">${{ ok: 'OK', warn: 'Warning', fail: 'Silent failure', held: 'Held' }[sel.status] || ''}</span></div></div></div>
      ${sel.note ? `<p class="id-note">${esc(sel.note)}</p>` : ''}
      ${sel.payload ? `<pre class="json">${jsonHl(sel.payload)}</pre>` : '<p class="id-none">No payload.</p>'}` : '<p class="id-none">No events yet. Press Next.</p>';
    return `
<aside class="insp" aria-label="Inspector">
  <div class="insp-head">
    <div><b>Inspector</b><span>What Siena, Zendesk, the widget and email sent each other, step by step. ${A.mode === 'today' ? 'Today: replies travel by email to a relay address.' : A.curVision ? 'Vision: what Siena would send later. Not part of the proposal.' : 'Proposed: replies travel by webhook; payloads follow Zendesk’s API.'}</span></div>
    <button class="insp-x" data-act="insp" aria-label="Close inspector">${I.x}</button>
  </div>
  <div class="insp-body">
    <div class="insp-list">${list || '<p class="id-none">No events yet.</p>'}</div>
    <div class="insp-detail">${detail}</div>
  </div>
</aside>`;
  };

  /* recap of the proposal (end of chapter 4) */
  V.recap = (A, rT, rP) => {
    const row = (label, t, p) => `<tr><th>${esc(label)}</th><td class="t">${t}</td><td class="p">${p}</td></tr>`;
    const away = A.branch === 'away';
    return `
<div class="recap-wrap"><div class="recap" data-f="recap" role="dialog" aria-label="Recap: the proposal">
  <h3>The proposal, chapters 1 to 4</h3>
  <p class="rc-sub">Two shoppers: Ana (leaking bottle) and a visitor (skip a box).${away ? ' In this path Ana never came back.' : ''}</p>
  <div class="rc-body">
  <table class="rc">
    <thead><tr><th></th><th class="t">Today</th><th class="p">Proposed</th></tr></thead>
    <tbody>
      ${row('Tickets in Zendesk', rT.tickets + (rT.unseen ? ' <small>the visitor’s chat is invisible</small>' : ''), rP.tickets + (rP.unseen ? ' <small>the visitor’s chat is invisible</small>' : ''))}
      ${row('Shoppers with exactly one ticket', rT.oneEach + ' of 2', rP.oneEach + ' of 2')}
      ${row('Agent replies lost without anyone knowing', rT.lost + ' of 1', rP.lost + ' of 1')}
      ${row('Agent replies the shopper saw', rT.seen + ' of 1', rP.seen + ' of 1' + (rP.flagged ? ' <small>held and flagged on the ticket</small>' : ''))}
      ${row('Tickets with an outcome', rT.withOutcome + ' of ' + rT.tickets, rP.withOutcome + ' of ' + rP.tickets)}
      ${row('Resolved tickets that say who resolved them', 'None', rP.resolved ? rP.tagged + ' of ' + rP.resolved : 'None yet')}
    </tbody>
  </table>
  <p class="rc-note">The proposal doesn’t change rating rules, email follow-up or anything after hours. Those come next, in the vision.</p>
  </div>
  <div class="rc-act">
    <button class="btn ghost rc-back" data-act="back">${I.left} Back</button>
    <button class="btn ghost" data-act="mode-replay" data-mode="${A.mode === 'today' ? 'proposed' : 'today'}">Replay in ${A.mode === 'today' ? 'Proposed' : 'Today'}</button>
    <button class="btn ghost" data-act="branch-go" data-branch="${away ? 'return' : 'away'}">${away ? 'What if Ana comes back?' : 'What if Ana never comes back?'}</button>
    <button class="btn primary vis-btn" data-act="next">Next: the vision ${I.right}</button>
  </div>
</div></div>`;
  };

  /* recap of the whole day: today, the proposal, the vision (end of chapter 6) */
  V.visionRecap = (A) => {
    const away = A.branch === 'away';
    const s = A.settings;
    const fu = s.followUpMin ? CS.addMin('11:20', s.followUpMin) : null;
    const rows = [
      ['Session Controls',
        'The 1-hour session ends the conversation, and a late reply with it',
        'Unchanged, but the conversation outlives the session, so nothing is lost',
        'Reworked: the timer decides when Siena follows up by email' + (fu ? ' (' + s.followUpMin + ' minutes after an unseen reply)' : '')],
      [away ? 'Theo’s reply to Ana (she never came back)' : 'Theo’s reply to Ana',
        away ? 'Dropped at 11:20, and still shown as sent' : 'Dropped at 11:20. Ana asked again and got a second ticket',
        away ? 'Held and flagged as not seen. Her email is on the ticket' : 'Held, then shown in chat when she came back',
        away ? (fu ? 'Emailed at ' + fu + ' by the reworked Session Controls, and recorded' : 'Held, as with the proposal (follow-up set to Never)') : 'As with the proposal: she came back before a follow-up was due'],
      ['Mia’s question at 11:04 pm',
        'Promised an email Siena couldn’t send. Same tags as a live handoff',
        'Reply mode says “One-Way fallback (outside hours)”. Theo’s reply waits in her conversation',
        (s.askEmail ? 'Email asked for at handoff. ' : '') + 'The after-hours tag (roadmap, Q1 2027) queues it for the morning' + (s.askEmail && s.afterHoursNow ? '. Theo’s reply emailed at 9:02' : '')],
      ['Mia’s follow-up at 11:06 pm',
        'The outside-hours message again (LC-1182)',
        'Unchanged: waits for the team',
        s.answerWhileAway ? 'Siena answers it on its own. The medical question waits for Theo' : 'Waits for the team (switched off in Setup)'],
      ['The macro that wipes tags',
        'Ana’s ticket drops out of the Live Chat view and reports',
        'The Siena fields survive, so the ticket stays in the Siena views',
        s.restoreTags ? 'Siena puts its own tags back as well' : 'Fields survive. Tags not restored (switched off in Setup)'],
      ['Ratings',
        'Routed chats are never surveyed',
        'Rules unchanged. The Siena rating field says why there’s no rating',
        s.ratePerConversation ? 'One rating per conversation, after the reply is delivered' : 'Unchanged (switched off in Setup)']
    ];
    return `
<div class="recap-wrap"><div class="recap wide" data-f="recap" role="dialog" aria-label="Recap: proposal and vision">
  <h3>The same day, three ways</h3>
  <p class="rc-sub">Today, with the proposal’s five changes, and with the vision they make possible. The vision isn’t part of the proposal: it builds on it.</p>
  <div class="rc-body">
  <table class="rc rc3">
    <thead><tr><th></th><th class="t">Today</th><th class="p">With the proposal</th><th class="v">Vision</th></tr></thead>
    <tbody>${rows.map(([l, t, p, v]) => `<tr><th>${esc(l)}</th><td class="t">${esc(t)}</td><td class="p">${esc(p)}</td><td class="v">${esc(v)}</td></tr>`).join('')}</tbody>
  </table>
  <p class="rc-note">Before any of the vision: Product’s answers on what the 1-hour session default protects (brief question 2) and on email capture (question 4). The after-hours tag and scheduled availability are already on the roadmap for Q1 2027.</p>
  </div>
  <div class="rc-act">
    <button class="btn ghost rc-back" data-act="back">${I.left} Back</button>
    <button class="btn ghost" data-act="branch-go" data-branch="${away ? 'return' : 'away'}">${away ? 'What if Ana comes back?' : 'What if Ana never comes back?'}</button>
    <button class="btn ghost" data-act="view" data-view="overview">Back to the overview</button>
    <button class="btn primary" data-act="view" data-view="setup">Open the Siena setup ${I.right}</button>
  </div>
</div></div>`;
  };

  V.demo = (A, W, prev, ch, step, next, pend, recapData) => {
    const notes = W.phone.notes.map((n) => `<div class="pnote ${n.tone}" title="${esc(n.text)}"><b>Demo note</b> ${esc(n.text)}</div>`).join('');
    const recap = recapData ? (recapData.kind === 'vision' ? V.visionRecap(A) : V.recap(A, recapData.today, recapData.proposed)) : '';
    return `
${V.storybar(A, W, ch, step, next)}
<section class="stage${A.insp ? ' with-insp' : ''}">
  <div class="col col-phone">
    <div class="col-head"><span class="col-title">${esc({ ana: 'Ana’s phone', guest: 'A visitor’s phone', mia: 'Mia’s phone' }[W.phone.owner])}</span><span class="col-sub">The shopper</span></div>
    <div class="pnotes">${notes}</div>
    <div class="phone-wrap" data-f="phone">${V.phone(A, W, pend, prev)}</div>
  </div>
  <div class="col col-zd">
    <div class="col-head"><span class="col-title">Theo’s Zendesk</span><span class="col-sub">The agent</span></div>
    ${V.zendesk(A, W, prev, pend)}
  </div>
  ${recap}
</section>`;
  };

  /* ------------------------------------------------------------ setup */
  V.setup = (A) => (A.mode === 'today' ? V.setupToday(A) : V.setupProposed(A));

  const sideNav = (page) => `
    <aside class="sx-nav">
      <div class="sx-brand">Siena admin <small>mock-up</small></div>
      <div class="sx-org">Moss &amp; Marrow</div>
      <nav>
        <span>Inbox</span><span>Journeys</span><span>Knowledge</span>
        <span class="on">Live Chat</span><span class="sub on">Moss &amp; Marrow Main</span><span class="sub">Appearance</span><span class="sub on2">${page}</span>
        <span>Settings</span>
      </nav>
    </aside>`;

  V.setupToday = (A) => `
<div class="sx">
  ${sideNav('Help desk integration')}
  <div class="sx-main">
    <div class="sx-head">
      <div><div class="sx-crumb">Live Chat › Moss &amp; Marrow Main › Help desk integration</div><h1>Help desk integration</h1>
      <p>How this page works today. Switch to <button class="link" data-act="mode" data-mode="proposed">Proposed</button> to see what the proposal changes, and the vision kept apart from it.</p></div>
    </div>
    <div class="sx-card">
      <h3>Current settings</h3>
      <div class="sx-rows">
        <div class="sx-row"><span>Helpdesk</span><b>Zendesk</b></div>
        <div class="sx-row"><span>Handoff mode</span><b>Two-Way Sync <em class="lockd">Locked</em></b><small>Can’t be changed without recreating the instance and losing appearance settings (LC-48146: “I only picked two-way because it sounded better”).</small></div>
        <div class="sx-row"><span>Sync scope</span><b>Routed only</b><small>Chats Siena handles without a handoff never reach Zendesk.</small><div class="sx-gaps">${gapChip('D15')}</div></div>
        <div class="sx-row"><span>Session length</span><b>1 hour</b><small>Session Controls (v43.4.0) made this the Two-Way default on Sep 29. A return after an hour opens a new session, a new relay address and a new ticket, and a reply sent after it is dropped.</small><div class="sx-gaps">${gapChip('D1')}${gapChip('PR1')}</div></div>
        <div class="sx-row"><span>How replies come back</span><b>Email to relay+id@siena.cx</b><small>The relay only works while the session is open. Late replies are dropped without an error, and the relay address is the ticket’s requester.</small><div class="sx-gaps">${gapChip('PR3')}${gapChip('D3')}</div></div>
        <div class="sx-row"><span>Email capture</span><b>Off</b><small>Outside hours, Siena promises an email it can’t send.</small></div>
        <div class="sx-row"><span>Tags</span><b><code>siena-live-chat-handoff</code> <code>siena-follow-needed</code></b><small>Fixed names, routed chats only. Live and after-hours handoffs get the same tags. A separate after-hours tag is on the roadmap (Next · Q1 2027).</small><div class="sx-gaps">${gapChip('PR22')}${gapChip('D16')}</div></div>
        <div class="sx-row"><span>Fields on the ticket</span><b>None</b><small>No outcome, no reply mode, no shared ID.</small><div class="sx-gaps">${gapChip('PR21')}${gapChip('D12')}${gapChip('D2')}</div></div>
        <div class="sx-row"><span>Rating</span><b>Not routed only · 24-hour cool-down</b><small>Routed and returning shoppers are never surveyed.</small><div class="sx-gaps">${gapChip('D26')}</div></div>
      </div>
    </div>
  </div>
</div>`;

  V.setupProposed = (A) => {
    const s = A.settings;
    const live = '<span class="live" title="Changing this changes the demo">Live in demo</span>';
    const tog = (key, on, label, sub, isLive, disabled) => `
      <label class="sx-tog${disabled ? ' dis' : ''}"><input type="checkbox" data-set="${key}" ${on ? 'checked' : ''} ${disabled ? 'disabled' : ''}><span class="sw"></span><span class="tx"><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</span>${isLive ? live : ''}</label>`;
    const sel = (key, label, sub, opts) => `
      <label class="sx-sel"><span><b>${label}</b><small>${sub}</small></span>
        <select data-set="${key}">${opts.map(([v, t]) => `<option value="${v}" ${String(s[key]) === String(v) ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`;
    const fieldRows = CS.FIELDS.map((f) => `<tr><td><b>${esc(f.label)}</b><small>${esc(f.help)}</small></td><td><code>text</code></td></tr>`).join('');
    const builds = (id) => `<div class="sxv-builds"><span class="sxv-l">Builds on</span>${itemChips(CS.VISION[id].builds)}</div>`;
    return `
<div class="sx">
  ${sideNav('Help desk integration')}
  <div class="sx-main">
    <div class="sx-head">
      <div><div class="sx-crumb">Live Chat › Moss &amp; Marrow Main › Help desk integration</div><h1>Help desk integration</h1>
      <p>What the proposal changes when Esme connects Zendesk. There are no new settings to learn: Siena creates the fields, the webhook and the trigger edits itself. Controls marked <span class="live">Live in demo</span> change the story.</p></div>
      <div class="sx-actions"><button class="btn ghost" data-act="reset-settings">Reset to defaults</button><button class="btn primary" data-act="view" data-view="demo">Back to the demo ${I.right}</button></div>
    </div>

    <div class="sx-card">
      <div class="sx-ch"><h3>What Siena sets up in Zendesk ${itemChips(['P2', 'P3'])}</h3><span class="ok-pill">${I.check} Connected · mossandmarrow.zendesk.com · Team plan</span></div>
      <ul class="sx-made">
        <li>${I.check}<div><b>8 ticket fields</b>, all plain text, filled in through the API: ${CS.FIELDS.map((f) => esc(f.label)).join(', ')}.</div></li>
        <li>${I.check}<div><b>Webhook “Siena replies”</b> subscribed to <code>ticket.comment_added</code>. Replies reach Siena the moment they’re added, instead of going by email to a relay address.</div></li>
        <li>${I.check}<div><b>Triggers edited:</b> Zendesk’s default requester emails skip Live Chat tickets, using the condition <i>Siena conversation is present</i>. Siena delivers those replies in the chat, so shoppers are never emailed twice.</div></li>
        <li>${I.check}<div><b>Views:</b> Siena chats, Waiting on agent, Reply held, Resolved by Siena (assumed) and After hours, which filters on Reply mode.</div></li>
      </ul>
      <div class="sx-why">${I.info}<div><b>Why text fields, not drop-downs or tags?</b> Zendesk stores drop-down and checkbox values as tags, so a “Set tags” macro clears them. Text fields survive, and views can still filter them with “contains”. The trade-off: automations can’t read text fields, and triggers can only check whether they’re present.</div></div>
    </div>

    <div class="sx-grid">
      <div class="sx-card">
        <h3>Sync scope ${itemChips(['P4'])}</h3>
        <div class="sx-radio">
          <label><input type="radio" name="scope" data-set="syncScope" value="all" ${s.syncScope === 'all' ? 'checked' : ''}><span><b>All conversations</b><small>The new default for helpdesks that charge per seat, like Zendesk.</small></span></label>
          <label><input type="radio" name="scope" data-set="syncScope" value="routed" ${s.syncScope === 'routed' ? 'checked' : ''}><span><b>Routed only</b><small>Today’s default, and still the default where the helpdesk charges per ticket.</small></span></label>
        </div>
        <div class="sx-foot">${live}<span class="today-was">Today: Routed only.</span></div>
      </div>

      <div class="sx-card">
        <h3>One conversation per shopper ${itemChips(['P1', 'P3'])}</h3>
        <p class="sx-p">The conversation ID lives in the shopper’s browser and outlives the chat session. The requester is the shopper: their Zendesk profile when they’re logged in to the store, an anonymous visitor otherwise. Session Controls itself is unchanged.</p>
        ${sel('resumeHours', 'Return window', 'How long a conversation stays open after the shopper leaves. 72 hours is the brief’s suggestion, to confirm with Product (question 2).', [[24, '24 hours'], [72, '72 hours'], [168, '7 days']])}
        <div class="sx-foot">${live}<span class="today-was">Today: a return after 1 hour starts a new session and a new ticket.</span></div>
      </div>

      <div class="sx-card">
        <h3>Replies ${itemChips(['P3', 'P2'])}</h3>
        ${tog('_hold', true, 'Hold the reply while the shopper is offline', 'Shown first when they come back, with a “while you were away” divider.', false, true)}
        ${tog('_record', true, 'Record what happened on the ticket', 'Reply delivery says “Delivered in chat” or “Held · not seen yet”, so a reply never fails silently.', false, true)}
        <div class="sx-foot"><span class="today-was">Today: late replies are dropped, and Zendesk shows them as sent.</span></div>
      </div>

      <div class="sx-card">
        <h3>Tags ${itemChips(['P5'])}</h3>
        <p class="sx-p">Today’s handoff tags stay on routed chats: <code>siena-live-chat-handoff</code> and <code>siena-follow-needed</code>. One tag is added when a conversation is resolved:</p>
        <div class="sx-tags"><div><code>${esc(CS.TAGS.ai)}</code><small>Siena handled it alone</small></div><div><code>${esc(CS.TAGS.agent)}</code><small>A person stepped in</small></div></div>
        <div class="sx-foot"><span class="today-was">Today: nothing tells Siena’s resolutions from an agent’s.</span></div>
      </div>
    </div>

    <div class="sx-card">
      <h3>Fields on every synced ticket ${itemChips(['P2'])}</h3>
      <table class="sx-fields"><thead><tr><th>Field</th><th>Type</th></tr></thead><tbody>${fieldRows}</tbody></table>
      <div class="sx-foot"><span class="today-was">Today: no Siena fields.</span></div>
    </div>

    <section class="sx-vision" aria-label="The vision">
      <div class="sxv-head">${visTag()}<h2>Later: what these changes make possible</h2>
        <p>Mock settings for the vision. None of this is proposed now, and each card names the changes it builds on. They only change the vision steps of the demo.</p></div>
      <div class="sx-grid">
        <div class="sx-card vis">
          <h3>Session Controls, reworked</h3>
          ${builds('V1')}
          <p class="sx-p">Today Session Controls sets how long an idle session lives (1 hour for Two-Way since Sep 29), and a late reply dies with it. Once the conversation outlives the session, the same setting can decide when Siena follows up on an abandoned chat by email.</p>
          ${sel('followUpMin', 'Follow up by email when a reply hasn’t been seen', 'Counted from the agent’s reply while the shopper is away. The reply also stays in the chat.', [[15, 'After 15 minutes'], [30, 'After 30 minutes'], [60, 'After 60 minutes'], [0, 'Never']])}
          ${tog('afterHoursNow', s.afterHoursNow, 'Outside business hours, follow up at once', 'The shopper has usually gone, so there’s no point waiting.', true)}
          <div class="sx-static"><b>Abandoned-chat auto-close</b><small>Keeps its own timer for chats Siena answered. With the proposal, it already records “Resolved – assumed” on the ticket.</small></div>
          <div class="sx-foot">${live}<span class="today-was">Today: “Session length: 1 hour”, and a reply sent after it is dropped.</span></div>
        </div>

        <div class="sx-card vis">
          <h3>After hours ${roadPill('after')}</h3>
          ${builds('V2')}
          ${tog('askEmail', s.askEmail, 'Ask for an email at handoff when Siena doesn’t know the shopper', 'So the email Siena promises outside hours can be sent. Depends on the brief’s fourth question.', true)}
          <div class="sx-static"><b>After-hours tag <code>${esc(CS.TAGS.after)}</code></b><small>Already on the roadmap (Next · Q1 2027, 9 requests), so it isn’t part of this proposal. A Zendesk trigger can send tagged tickets to a morning queue.</small></div>
        </div>

        <div class="sx-card vis">
          <h3>While the team is away ${roadPill('sched')}</h3>
          ${builds('V3')}
          ${tog('answerWhileAway', s.answerWhileAway, 'Siena answers on its own while the team is away', 'After an after-hours handoff, Siena answers what it safely can and adds it to the same ticket. It sits next to scheduled availability’s AI-only option.', true)}
        </div>

        <div class="sx-card vis">
          <h3>Tags and ratings</h3>
          <div class="sxv-builds"><span class="sxv-l">Builds on</span>${itemChips(['P1', 'P2', 'P3', 'P5'])}</div>
          ${tog('restoreTags', s.restoreTags, 'Put Siena’s tags back if a macro removes them', 'The reply-path webhook, subscribed to ticket.tags_changed as well.', true)}
          ${tog('ratePerConversation', s.ratePerConversation, 'One rating per conversation, after the reply is delivered', 'Routed chats are rated too, and the cool-down counts conversations, not visitors.', true)}
        </div>
      </div>
    </section>
  </div>
</div>`;
  };
})(window.CS);
