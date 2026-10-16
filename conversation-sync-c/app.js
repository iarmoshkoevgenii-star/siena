/* Conversation Sync prototype: app state, navigation and events. */
(function (CS) {
  'use strict';

  const STORE_KEY = 'conversation-sync-c-v1';
  const clone = (o) => JSON.parse(JSON.stringify(o));

  const A = {
    view: 'overview',
    mode: 'proposed',
    pos: { c: 0, s: 0 },
    branch: 'return',
    settings: clone(CS.DEFAULT_SETTINGS),
    ov: {},
    insp: false,
    inspSel: null,
    zdActive: null,
    zdView: null,
    chMenu: false,
    W: null,
    chapters: null,
    curVision: false
  };
  CS.A = A;

  /* ---------------------------------------------------------- persistence */
  function load() {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.settings) {
        const def = clone(CS.DEFAULT_SETTINGS);
        A.settings = Object.assign(def, d.settings);
        A.settings.fields = Object.assign(def.fields, d.settings.fields || {});
      }
      if (d.ov) A.ov = d.ov;
    } catch (e) { /* storage unavailable: run with defaults */ }
  }
  function save() {
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify({ settings: A.settings, ov: A.ov })); } catch (e) { /* ignore */ }
  }

  /* ---------------------------------------------------------- hash */
  function readHash() {
    const h = window.location.hash.replace(/^#\/?/, '');
    if (!h) return;
    const [view, q] = h.split('?');
    if (['overview', 'demo', 'setup'].indexOf(view) >= 0) A.view = view;
    const p = new URLSearchParams(q || '');
    if (p.get('mode') === 'today' || p.get('mode') === 'proposed') A.mode = p.get('mode');
    if (p.get('path') === 'away' || p.get('path') === 'return') A.branch = p.get('path');
    const c = parseInt(p.get('ch'), 10), s = parseInt(p.get('step'), 10);
    if (!isNaN(c)) A.pos.c = c - 1;
    if (!isNaN(s)) A.pos.s = s - 1;
    clampPos();
  }
  function writeHash() {
    let h = '#/' + A.view + '?mode=' + A.mode;
    if (A.view === 'demo') h += '&ch=' + (A.pos.c + 1) + '&step=' + (A.pos.s + 1) + '&path=' + A.branch;
    if (window.location.hash !== h) {
      try { window.history.replaceState(null, '', h); } catch (e) { /* file:// in some browsers */ }
    }
  }

  /* ---------------------------------------------------------- positions */
  function chapters() { return CS.chapters(A.branch); }
  function clampPos() {
    const ch = chapters();
    A.pos.c = Math.max(0, Math.min(ch.length - 1, A.pos.c || 0));
    A.pos.s = Math.max(0, Math.min(ch[A.pos.c].steps.length - 1, A.pos.s || 0));
  }
  function prevPos(p) {
    const ch = chapters();
    if (p.s > 0) return { c: p.c, s: p.s - 1 };
    if (p.c > 0) return { c: p.c - 1, s: ch[p.c - 1].steps.length - 1 };
    return null;
  }
  function nextPos(p) {
    const ch = chapters();
    if (p.s < ch[p.c].steps.length - 1) return { c: p.c, s: p.s + 1 };
    if (p.c < ch.length - 1) return { c: p.c + 1, s: 0 };
    return null;
  }
  /* The input for the next step is shown, pre-filled and editable, while you look at the current one. */
  function pending() {
    const np = nextPos(A.pos);
    if (!np || np.c !== A.pos.c) return null;
    const st = chapters()[np.c].steps[np.s];
    return CS.pick(st.input, A.mode) || null;
  }

  function resetUi() { A.zdActive = null; A.zdView = null; A.inspSel = null; A.chMenu = false; }

  /* ---------------------------------------------------------- stable layout
     The story bar takes the height of its tallest step at the current width, measured offscreen across every step,
     both modes and both paths. The stage below it, and so the phone and Zendesk, keep one size for the whole journey. */
  let sbKey = '';
  function measureStorybar(again) {
    const bar = document.querySelector('.storybar');
    if (!bar) return;
    const width = Math.round(bar.getBoundingClientRect().width);
    const key = width + '|' + window.innerHeight + '|' + JSON.stringify(A.settings);
    if (key === sbKey) return;
    const box = document.createElement('div');
    box.className = 'sb-measure';
    box.setAttribute('aria-hidden', 'true');
    box.style.width = width + 'px';
    document.body.appendChild(box);
    let max = 0;
    ['return', 'away'].forEach((branch) => {
      const ch = CS.chapters(branch);
      ['today', 'proposed'].forEach((mode) => {
        ch.forEach((chap, c) => chap.steps.forEach((step, s) => {
          const pos = { c: c, s: s };
          const W = CS.build(mode, pos, branch, A.settings, A.ov);
          const nextStep = s < chap.steps.length - 1 ? chap.steps[s + 1] : (c < ch.length - 1 ? ch[c + 1].steps[0] : null);
          const fake = Object.assign({}, A, { mode: mode, branch: branch, pos: pos, chMenu: false, chapters: ch });
          box.innerHTML = CS.V.storybar(fake, W, chap, step, nextStep);
          max = Math.max(max, box.firstElementChild.getBoundingClientRect().height);
        }));
      });
    });
    box.remove();
    sbKey = key;
    document.documentElement.style.setProperty('--sb-h', Math.ceil(max) + 'px');
    sizePhone();
    // a page scrollbar that appears or goes away changes the bar's width: measure once more
    if (!again && Math.round(bar.getBoundingClientRect().width) !== width) measureStorybar(true);
  }
  // The phone's width comes from the height it has on this screen (9:16, 280–380px), never from
  // what it shows, so every step and every shopper gets the same phone. The phone column hugs it.
  function sizePhone() {
    const wrap = document.querySelector('.phone-wrap');
    if (!wrap) return;
    const h = Math.min(wrap.getBoundingClientRect().height, 790);
    const w = Math.round(Math.min(380, Math.max(280, h * 9 / 16)));
    document.documentElement.style.setProperty('--ph-w', w + 'px');
  }
  CS.measureStorybar = measureStorybar;
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (A.view === 'demo') measureStorybar(); }, 120);
  });

  /* ---------------------------------------------------------- render */
  function render(opts) {
    opts = opts || {};
    const root = document.getElementById('app');
    let main = '';
    A.W = null;
    A.curVision = false;
    if (A.view === 'demo') {
      clampPos();
      const ch = chapters();
      A.chapters = ch;
      A.curVision = CS.isVision(ch[A.pos.c], ch[A.pos.c].steps[A.pos.s]);
      const W = CS.build(A.mode, A.pos, A.branch, A.settings, A.ov);
      A.W = W;
      const pp = prevPos(A.pos);
      const prev = pp ? CS.build(A.mode, pp, A.branch, A.settings, A.ov) : null;
      const chapter = ch[A.pos.c];
      const step = chapter.steps[A.pos.s];
      const np = nextPos(A.pos);
      const next = np ? ch[np.c].steps[np.s] : null;
      const pend = pending();
      let recap = null;
      if (W.showRecap === 'proposal') {
        const end = { c: A.pos.c, s: A.pos.s };
        const WT = A.mode === 'today' ? W : CS.build('today', end, A.branch, A.settings, A.ov);
        const WP = A.mode === 'proposed' ? W : CS.build('proposed', end, A.branch, A.settings, A.ov);
        recap = { kind: 'proposal', today: CS.recap(WT), proposed: CS.recap(WP) };
      } else if (W.showRecap === 'vision') {
        recap = { kind: 'vision' };
      }
      main = CS.V.demo(A, W, prev, chapter, step, next, pend, recap);
    } else if (A.view === 'setup') {
      main = CS.V.setup(A);
    } else {
      main = CS.V.overview(A);
    }
    document.body.className = 'mode-' + A.mode + (A.curVision && A.mode === 'proposed' ? ' mode-vision' : '') + ' view-' + A.view + (A.insp && A.view === 'demo' ? ' insp-open' : '');
    root.innerHTML = CS.V.topbar(A) + '<main class="main" id="main">' + main + '</main>' + (A.view === 'demo' ? CS.V.inspector(A, A.W) : '');
    if (A.view === 'demo') measureStorybar();
    after(opts);
    writeHash();
  }

  function after(opts) {
    if (A.view !== 'demo') {
      if (opts.top) window.scrollTo(0, 0);
      return;
    }
    const ch = chapters();
    const step = ch[A.pos.c].steps[A.pos.s];
    let f = CS.pick(step.focus, A.mode) || [];
    if (typeof f === 'function') f = f(A.W) || [];
    const focus = f.slice();
    const pend = pending();
    if (pend) focus.push(pend.surface === 'widget' ? 'widget-input' : 'composer');
    focus.forEach((k) => {
      document.querySelectorAll('[data-f~="' + k + '"]').forEach((el) => el.classList.add('spot'));
    });
    // keep the newest chat message in view
    const wm = document.querySelector('.w-msgs');
    if (wm) wm.scrollTop = wm.scrollHeight;
    // conversation: show the spotlighted comment, else the end
    const cv = document.querySelector('.cv-list');
    if (cv) {
      const s = cv.querySelector('.spot');
      cv.scrollTop = s ? Math.max(0, s.offsetTop - cv.offsetTop - 12) : cv.scrollHeight;
    }
    const props = document.querySelector('.zd-props');
    if (props) {
      const s = props.querySelector('.spot');
      if (s && (s.offsetTop + s.offsetHeight > props.scrollTop + props.clientHeight || s.offsetTop < props.scrollTop)) {
        props.scrollTop = Math.max(0, s.offsetTop - props.offsetTop - 16);
      }
    }
    const il = document.querySelector('.insp-list');
    if (il) {
      const on = il.querySelector('.ie.on');
      if (on) il.scrollTop = Math.max(0, on.offsetTop - il.offsetTop - il.clientHeight / 2);
    }
    // pending inputs keep what you type, and grow to fit it
    const fit = (ta, max) => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight + 2, max) + 'px'; };
    const pw = document.getElementById('pend-widget');
    if (pw && pend && pend.surface === 'widget') {
      fit(pw, 168);
      pw.addEventListener('input', () => { A.ov[pend.key] = pw.value; save(); fit(pw, 168); });
      pw.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); go('next'); } });
      if (wm) wm.scrollTop = wm.scrollHeight;
    }
    const pc = document.getElementById('pend-composer');
    if (pc && pend && pend.surface === 'composer') {
      fit(pc, 200);
      pc.addEventListener('input', () => { A.ov[pend.key] = pc.value; save(); fit(pc, 200); });
      if (cv && !cv.querySelector('.spot')) cv.scrollTop = cv.scrollHeight;
    }
    if (opts.focusNext) {
      const nb = document.querySelector('.sb-right .next');
      if (nb) nb.focus({ preventScroll: true });
    }
  }

  /* ---------------------------------------------------------- navigation */
  function go(dir) {
    if (dir === 'next') {
      const np = nextPos(A.pos);
      A.pos = np || { c: 0, s: 0 };
    } else if (dir === 'back') {
      const pp = prevPos(A.pos);
      if (!pp) return;
      A.pos = pp;
    }
    resetUi();
    render({ focusNext: true });
  }

  /* ---------------------------------------------------------- events */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) {
      if (A.chMenu && !e.target.closest('.chmenu')) { A.chMenu = false; render(); }
      return;
    }
    if (el.disabled) return;
    const act = el.dataset.act;
    switch (act) {
      case 'view':
        A.view = el.dataset.view; A.chMenu = false; render({ top: true }); break;
      case 'mode':
        A.mode = el.dataset.mode; resetUi(); render(); break;
      case 'mode-replay':
        A.mode = el.dataset.mode; A.pos = { c: 0, s: 0 }; resetUi(); render(); break;
      case 'insp':
        A.insp = !A.insp; render(); break;
      case 'isel':
        A.inspSel = +el.dataset.n; render(); break;
      case 'next': go('next'); break;
      case 'back': go('back'); break;
      case 'goto':
        if (el.dataset.branch) A.branch = el.dataset.branch;
        A.view = 'demo'; A.pos = { c: +el.dataset.c, s: +el.dataset.s }; resetUi(); render({ top: true }); break;
      case 'chmenu':
        A.chMenu = !A.chMenu; render(); break;
      case 'branch':
        A.branch = el.dataset.branch; resetUi(); render(); break;
      case 'branch-go':
        A.branch = el.dataset.branch; A.pos = { c: 2, s: 0 }; resetUi(); render(); break;
      case 'ztab':
        A.zdActive = +el.dataset.id; A.zdView = null; render(); break;
      case 'zhome':
        A.zdActive = 'home'; A.zdView = null; render(); break;
      case 'zview':
        A.zdView = A.zdView === el.dataset.view ? null : el.dataset.view; render(); break;
      case 'reset-settings':
        A.settings = clone(CS.DEFAULT_SETTINGS); save(); render(); break;
      default: break;
    }
  });

  // keyboard activation for ticket rows
  document.addEventListener('keydown', (e) => {
    const t = e.target;
    const typing = t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT' || t.tagName === 'SELECT');
    if (e.key === 'Escape') {
      if (A.chMenu) { A.chMenu = false; render(); return; }
      if (A.insp) { A.insp = false; render(); return; }
    }
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (t && t.matches && t.matches('tr[data-act]') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); t.click(); return; }
    if (A.view === 'demo' && (e.key === 'ArrowRight' || e.key === 'PageDown')) { e.preventDefault(); go('next'); }
    else if (A.view === 'demo' && (e.key === 'ArrowLeft' || e.key === 'PageUp')) { e.preventDefault(); go('back'); }
    else if (e.key === 't' || e.key === 'T') { A.mode = A.mode === 'today' ? 'proposed' : 'today'; resetUi(); render(); }
    else if ((e.key === 'i' || e.key === 'I') && A.view === 'demo') { A.insp = !A.insp; render(); }
  });

  // settings controls (Siena setup page)
  function applySetting(el) {
    const key = el.dataset.set;
    if (!key) return;
    if (key.indexOf('field:') === 0) {
      A.settings.fields[key.slice(6)] = el.checked;
    } else if (el.type === 'checkbox') {
      A.settings[key] = el.checked;
    } else if (el.type === 'radio') {
      if (el.checked) A.settings[key] = el.value;
    } else {
      const n = parseInt(el.value, 10);
      A.settings[key] = isNaN(n) ? el.value : n;
    }
    save();
  }
  document.addEventListener('change', (e) => {
    if (e.target && e.target.dataset && e.target.dataset.set) {
      applySetting(e.target);
    }
  });

  window.addEventListener('hashchange', () => { resetUi(); readHash(); render(); });

  /* ---------------------------------------------------------- start */
  load();
  readHash();
  render();
})(window.CS);
