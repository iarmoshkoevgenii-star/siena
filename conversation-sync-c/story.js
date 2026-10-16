/* Conversation Sync prototype: the story engine and script.
   The world is rebuilt from scratch for every position, so Back, mode switches and settings changes always show a
   consistent state. Each step has a Today behaviour and a second one: the proposal in chapters 1–4, the vision in
   chapters 5–6 and in the vision steps marked `vision`. The proposal's world never includes vision steps, so what
   you see in chapters 1–4 is only what the brief proposes. */
(function (CS) {
  'use strict';
  var P = CS.PEOPLE, R = CS.RELAY, CV = CS.CONV, TG = CS.TAGS;

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function addMin(hhmm, min) {
    var p = hhmm.split(':'), h = +p[0], m = +p[1] + min;
    h += Math.floor(m / 60); m = m % 60;
    return h + ':' + (m < 10 ? '0' : '') + m;
  }
  CS.addMin = addMin;
  function ampm(hhmm) { var h = +hhmm.split(':')[0]; return hhmm + (h >= 12 && h < 24 ? ' pm' : ' am'); }
  CS.ampm = ampm;
  function mins(hhmm) { var p = hhmm.split(':'); return +p[0] * 60 + +p[1]; }

  /* ---------------------------------------------------------------- World */
  function World(mode, settings, ov, branch) {
    this.mode = mode;
    this.today = mode === 'today';
    this.prop = !this.today;
    this.st = settings;
    this.ov = ov || {};
    this.branch = branch || 'return';
    this.clockText = 'Tue 9:38 am';
    this.phone = null;
    this.scene('ana', 'oil', 'Ana');
    this.tickets = clone(CS.PREEXISTING).map(function (t) { t.story = false; t.fields = {}; t.siena = null; return t; });
    this.nextId = 1042;
    this.active = null;
    this.events = [];
    this.stepKey = '';
    this.showRecap = false;
    this.anaTicket = null; this.anaTicket2 = null; this.guestTicket = null; this.miaTicket = null;
    this.zdNote = null;   // a demo note shown on Theo's ticket list, reset every step
    this.vision = false;  // true when the current position is a vision step (set by CS.build)
  }
  CS.World = World;

  World.prototype.text = function (key, def) {
    var v = this.ov[key];
    return (typeof v === 'string' && v.trim()) ? v.trim() : def;
  };
  World.prototype.clock = function (t) { this.clockText = t; };
  World.prototype.scene = function (owner, page, user) {
    this.phone = {
      owner: owner, page: page, user: user || null, widgetOpen: false,
      header: { title: 'Moss & Marrow', sub: 'AI assistant · answers instantly' },
      messages: [], lock: null, notes: [], badge: 0, rating: null
    };
  };
  World.prototype.open = function () { this.phone.widgetOpen = true; this.phone.lock = null; this.phone.badge = 0; };
  World.prototype.msg = function (from, text, time, extra) {
    var m = { from: from, text: text, time: time || '' };
    if (extra) for (var k in extra) m[k] = extra[k];
    this.phone.messages.push(m);
    return m;
  };
  World.prototype.lockScreen = function (time, date, notifs) {
    this.phone.lock = { time: time, date: date, notifs: notifs || [] };
  };
  World.prototype.note = function (text, tone) { this.phone.notes.push({ text: text, tone: tone || 'info' }); };

  World.prototype.createTicket = function (o) {
    var id = this.nextId++;
    var t = {
      id: id, subject: o.subject, status: o.status || 'Open', via: 'API', created: o.created,
      requester: o.requester, group: o.group || 'Live chat', assignee: 'Theo Mbeki',
      tags: o.tags || [], fields: {}, externalId: o.externalId || null, comments: [], story: true, who: o.who,
      siena: o.siena || null, demo: null
    };
    if (this.prop) {
      CS.FIELDS.forEach(function (f) { t.fields[f.key] = '—'; });
      for (var k in (o.fields || {})) t.fields[k] = o.fields[k];
    }
    this.tickets.push(t);
    this.active = id;
    return id;
  };
  World.prototype.tk = function (id) {
    for (var i = 0; i < this.tickets.length; i++) if (this.tickets[i].id === id) return this.tickets[i];
    return null;
  };
  World.prototype.add = function (id, c) {
    var t = this.tk(id);
    c.id = 'c' + id + '_' + (t.comments.length + 1);
    t.comments.push(c);
    return c;
  };
  World.prototype.set = function (id, obj) {
    var t = this.tk(id);
    for (var k in obj) t.fields[k] = obj[k];
  };
  World.prototype.tag = function (id, name) {
    var t = this.tk(id);
    if (t.tags.indexOf(name) < 0) t.tags.push(name);
  };
  World.prototype.tl = function (id, time, text, tone) {
    var t = this.tk(id);
    if (t && t.siena) t.siena.timeline.push({ time: time, text: text, tone: tone || '' });
  };
  World.prototype.ev = function (o) {
    o.step = this.stepKey;
    o.n = this.events.length + 1;
    this.events.push(o);
  };

  /* helpers shared by steps */
  function fieldsPayload(W, obj) {
    var out = [];
    CS.FIELDS.forEach(function (f) {
      if (obj[f.key] !== undefined && W.st.fields[f.key] !== false) out.push({ id: f.id, value: obj[f.key] });
    });
    return out;
  }
  function transcript(lines) {
    return 'Live Chat transcript\n' + lines.map(function (l) { return l[0] + ': ' + l[1]; }).join('\n') + '\n[Routed by Siena to your team]';
  }
  function iso(time24, day) { return '2026-10-' + (day || '20') + 'T' + time24 + ':00-04:00'; }
  function resumeUntil(W, from) {
    var h = W.st.resumeHours;
    if (from === 'mia') return h === 24 ? 'Wed Oct 21, 11:06 pm' : h === 168 ? 'Tue Oct 27, 11:06 pm' : 'Fri Oct 23, 11:06 pm';
    if (h === 24) return 'Wed Oct 21, 9:52 am';
    if (h === 168) return 'Tue Oct 27, 9:52 am';
    return 'Fri Oct 23, 9:52 am';
  }
  function resumeLabel(W) {
    var h = W.st.resumeHours;
    return h === 168 ? '7 days' : h + ' hours';
  }
  CS.resumeLabel = resumeLabel;
  function resumeDay(W) { return resumeUntil(W).split(',')[0]; }   // "Fri Oct 23"

  /* Script text used in several places */
  var TXT = {
    ana1: 'Hi! My October box arrived and the Rosehip oil leaked everywhere. Could you send a replacement before Friday? I’m travelling.',
    anaAI1: 'I’m sorry, Ana. I can see order #MM-4821 arrived on Oct 17. A replacement needs a quick approval from our team, so I’m passing this to Theo.',
    handoffToday: 'I’m connecting you with a member of our team now. They’ll reply right here.',
    handoffProp: 'Theo is in until noon. You can close this page: if you’re away when he replies, his answer will be waiting here when you come back.',
    theo1: 'Hi Ana, so sorry about the leak! I’ve sent a new Rosehip Renewal Oil by express, so it’ll arrive Thursday, before your trip. No need to send the old one back. – Theo',
    ana2: 'Hi, I wrote earlier about my leaking Rosehip oil. Did anyone see it?',
    anaAI2: 'I’m sorry, I can’t see an earlier conversation. I can see order #MM-4821, though. A replacement needs our team’s approval, so I’m passing this on.',
    ana3: 'That’s perfect, thank you Theo!',
    guest1: 'Can I skip next month’s box?',
    guestAI: 'Yes. Go to Account → Subscriptions → Calm Skin Box and tap “Skip next delivery”. You can skip any time before the 25th, and the box after that ships as usual.',
    mia1: 'Is the Calm Balm OK to use on my 2-year-old’s eczema?',
    miaAI: 'That’s a question I’d rather someone on our team answers properly.',
    afterToday: 'It’s outside our support hours. Someone from our team will email you.',
    mia2: 'Is it fragrance-free, at least?',
    miaAI2: 'Yes. Calm Balm is fragrance-free, made with oat, calendula and shea for very dry skin. Theo will still answer your question about your 2-year-old in the morning.',
    theo2: 'Hi Mia, thanks for checking first. Calm Balm is fragrance-free, but for a 2-year-old with eczema we’d ask your pediatrician before using it. Happy to send a free sample so you can patch-test. – Theo'
  };
  CS.TXT = TXT;

  function anaScene(W) { W.scene('ana', 'oil', 'Ana'); }
  function anaChatOpening(W) {
    W.open();
    W.phone.header = { title: 'Moss & Marrow', sub: 'AI assistant · answers instantly' };
    W.msg('ai', 'Hi Ana! I’m the Moss & Marrow assistant. Ask me anything about your skincare or your subscription.', '9:40');
  }

  /* ---------------------------------------------------------------- Steps */
  var S = {};

  /* ============ The proposal ============ */

  /* Chapter 1 · The handoff */
  S.c1_intro = {
    key: '1.0', clock: 'Tue 9:40 am', title: 'Ana opens the chat', action: 'Start the story',
    caption: {
      both: 'Moss & Marrow sells botanical skincare, mostly by subscription. Siena’s chat is synced to Zendesk, where Theo answers email in the mornings and nobody watches chat. Ana, a logged-in subscriber, found her Rosehip oil leaking and opens the chat.'
    },
    gaps: {}, focus: { both: ['phone'] },
    apply: function (W) {
      W.clock('Tue 9:40 am'); anaScene(W); anaChatOpening(W);
      W.ev({ time: '9:40', from: 'Widget', to: 'Siena', kind: 'widget', status: 'ok',
        title: 'Chat opened',
        note: 'Ana is logged in to the store, so Siena knows she is Shopify customer 7745561203 and can look up her orders.',
        payload: { visitor_id: P.ana.visitorId, shopify_customer_id: P.ana.shopifyId, page: CS.PRODUCTS.oil.path } });
    }
  };

  S.c1_ask = {
    key: '1.1', clock: 'Tue 9:40 am', title: 'Ana asks for a replacement', action: 'Send Ana’s message',
    input: { both: { surface: 'widget', key: 'ana1', value: TXT.ana1, who: 'Ana' } },
    caption: {
      both: 'Ana asks for a replacement before her trip. Siena recognises her login and finds the order, but a replacement needs a person’s approval.'
    },
    gaps: {}, focus: { both: ['widget'] },
    apply: function (W) {
      W.clock('Tue 9:40 am');
      W.msg('visitor', W.text('ana1', TXT.ana1), '9:40');
      W.msg('ai', TXT.anaAI1, '9:41');
      W.ev({ time: '9:40', from: 'Widget', to: 'Siena', kind: 'widget', status: 'ok',
        title: 'Message from Ana', note: 'Siena finds order #MM-4821 and decides a person must approve a replacement.' });
    }
  };

  S.c1_handoff = {
    key: '1.2', clock: 'Tue 9:41 am', title: 'Siena hands off', action: 'Siena hands off to Zendesk',
    caption: {
      today: 'Siena hands off. The new ticket’s requester is a relay address that only lives as long as this chat session. Zendesk can’t tell it’s Ana, and nothing on the ticket says why she was routed or how a reply will reach her.',
      proposed: 'Siena hands off. With no relay address, the ticket is Ana’s: her real email from her Shopify login, her orders, and Siena’s conversation ID in the Siena conversation field. The other fields record why she was routed, the reply mode and the outcome so far. The tags stay as they are today.'
    },
    gaps: { both: ['D3', 'D2', 'D12', 'PR21'] }, sol: ['P1', 'P2', 'P3'],
    focus: { today: ['requester', 'fields-empty', 'ctx-customer'], proposed: ['requester', 'fields', 'ctx-customer'] },
    apply: function (W) {
      W.clock('Tue 9:41 am');
      var subject = 'Leaking Rosehip oil – replacement before Friday';
      var ana1 = W.text('ana1', TXT.ana1);
      if (W.today) {
        W.msg('ai', TXT.handoffToday, '9:41');
        var id = W.createTicket({
          subject: subject, created: 'Tue 9:41 am', who: 'ana', group: 'Live chat',
          requester: { name: 'relay+7f3a91', email: R.ana1, kind: 'relay', initials: 'R' },
          tags: [TG.handoff, TG.follow]
        });
        W.anaTicket = id;
        W.add(id, { role: 'enduser', author: 'relay+7f3a91', time: '9:41', pre: true,
          text: transcript([['Visitor', ana1], ['Assistant', TXT.anaAI1], ['Assistant', TXT.handoffToday]]) });
        W.ev({ time: '9:41', from: 'Siena', to: 'Zendesk', kind: 'api', status: 'ok',
          title: 'POST /api/v2/tickets.json',
          note: 'Creates the ticket. The requester is a relay address that belongs to this chat session only.',
          payload: { ticket: { subject: subject, requester: { name: 'relay+7f3a91', email: R.ana1 },
            comment: { body: 'Live Chat transcript\nVisitor: ' + ana1.slice(0, 48) + '…', public: true },
            tags: [TG.handoff, TG.follow] } } });
        W.ev({ time: '9:41', from: 'Zendesk', to: '', kind: 'internal', status: 'warn',
          title: 'Ticket #' + id + ' created',
          note: 'No Siena fields, no shared ID, no link to Ana’s Zendesk profile. The tag is the only sign it came from Live Chat.' });
      } else {
        W.msg('ai', TXT.handoffProp, '9:41');
        var fields = { source: 'Siena Live Chat', conversation: CV.ana, outcome: 'Routed – awaiting agent',
          reason: 'Replacement needs approval', mode: 'Two-Way (in hours)', delivery: '—', sessions: '1', csat: '—' };
        var id2 = W.createTicket({
          subject: subject, created: 'Tue 9:41 am', who: 'ana', group: 'Live chat', externalId: CV.ana,
          requester: { name: P.ana.name, email: P.ana.email, kind: 'customer', initials: P.ana.initials },
          tags: [TG.handoff, TG.follow], fields: fields,
          siena: { presence: 'online', lastSeen: '9:41', conv: CV.ana, resumeUntil: null, timeline: [] }
        });
        W.anaTicket = id2;
        W.add(id2, { role: 'enduser', author: P.ana.name, time: '9:40', text: ana1 });
        W.add(id2, { role: 'ai', author: P.siena.name, time: '9:41', text: TXT.anaAI1 });
        W.tl(id2, '9:40', 'Chat started · logged in as Ana Ruiz');
        W.tl(id2, '9:41', 'Handed off · replacement needs approval');
        W.ev({ time: '9:41', from: 'Siena', to: 'Zendesk', kind: 'api', status: 'ok',
          title: 'POST /api/v2/users/create_or_update.json',
          note: 'No relay address: the requester is Ana herself, matched to her Zendesk profile by her Shopify ID, so her history and orders attach and no duplicate profile is created.',
          payload: { user: { name: P.ana.name, email: P.ana.email, external_id: 'shopify:' + P.ana.shopifyId } } });
        W.ev({ time: '9:41', from: 'Siena', to: 'Zendesk', kind: 'api', status: 'ok',
          title: 'POST /api/v2/tickets.json',
          note: 'Creates the ticket with Siena’s conversation ID in the Siena conversation field (and as external_id), and the other Siena fields filled in. Today’s two tags are unchanged. Ana’s message is posted as her own comment.',
          payload: { ticket: { subject: subject, requester_id: P.ana.zdId, external_id: CV.ana,
            comment: { body: ana1, author_id: P.ana.zdId, public: true },
            tags: [TG.handoff, TG.follow], custom_fields: fieldsPayload(W, fields) } } });
        W.ev({ time: '9:41', from: 'Siena', to: 'Zendesk', kind: 'api', status: 'ok',
          title: 'PUT /api/v2/tickets/' + id2 + '.json',
          note: 'Adds Siena’s reply as a public comment from the Siena (AI) user, so Theo reads the chat in order.',
          payload: { ticket: { comment: { body: TXT.anaAI1, author_id: P.siena.zdId, public: true } } } });
      }
    }
  };

  S.c1_leave = {
    key: '1.3', clock: 'Tue 9:52 am', title: 'Ana closes the tab', action: 'Ana closes the tab',
    caption: {
      today: 'Nobody answers, so after ten minutes Ana closes the tab. The one-hour session clock is running: at 10:52 her relay address stops working.',
      proposed: function (W) {
        return 'Nobody answers, so after ten minutes Ana closes the tab. The widget tells Siena she has gone offline. Her chat session will still end at 10:52, but the conversation won’t: her browser keeps Siena’s conversation ID, so for the next ' + resumeLabel(W) + ' anything Theo sends has somewhere to go.';
      }
    },
    gaps: { today: ['D1', 'PR1'], proposed: ['D1'] }, sol: ['P1', 'P3'],
    focus: { today: ['phone'], proposed: ['phone', 'presence'] },
    apply: function (W) {
      W.clock('Tue 9:52 am');
      W.lockScreen('9:52', 'Tuesday, October 20', []);
      if (W.today) {
        W.note('Session expires at 10:52 after an hour without a message', 'today');
        W.ev({ time: '9:52', from: 'Widget', to: 'Siena', kind: 'widget', status: 'warn',
          title: 'Visitor left · session 7f3a91',
          note: 'The session expires at 10:52, after 60 minutes without a message (the Two-Way default since Session Controls, v43.4.0).' });
      } else {
        var tk = W.tk(W.anaTicket);
        tk.siena.presence = 'offline'; tk.siena.lastSeen = '9:52'; tk.siena.resumeUntil = resumeUntil(W);
        W.tl(W.anaTicket, '9:52', 'Ana left the site');
        W.note('Session ends at 10:52 · conversation kept ' + resumeLabel(W), 'prop');
        W.ev({ time: '9:52', from: 'Widget', to: 'Siena', kind: 'widget', status: 'ok',
          title: 'Visitor ' + P.ana.visitorId + ' went offline',
          note: 'The chat session still ends at 10:52, but conversation ' + CV.ana + ' stays open until ' + resumeUntil(W) + '. The conversation ID lives in the browser’s storage.',
          payload: { visitor_id: P.ana.visitorId, conversation_id: CV.ana, presence: 'offline', session_ends: '10:52', resume_until: resumeUntil(W) } });
      }
    }
  };

  /* Chapter 2 · A late reply */
  S.c2_expire = {
    key: '2.1', clock: 'Tue 10:52 am', title: 'The session expires', action: 'Skip to 10:52',
    caption: {
      today: '10:52. After an hour without a message, the session expires (the Two-Way default since Sep 29). The ticket doesn’t change, so nobody can see that replies are now undeliverable.',
      proposed: '10:52. The chat session expires as before: Session Controls is unchanged. But the conversation stays open, and the Siena panel shows Ana as offline, so Theo knows his reply won’t be read live.'
    },
    gaps: { today: ['D1', 'PR1'], proposed: ['D1'] }, sol: ['P1', 'P3'],
    focus: { today: ['conv'], proposed: ['presence', 'field-sessions'] },
    apply: function (W) {
      W.clock('Tue 10:52 am');
      W.lockScreen('10:52', 'Tuesday, October 20', []);
      W.active = W.anaTicket;
      if (W.today) {
        W.note('Session 7f3a91 expired. Replies to its relay address now go nowhere', 'today');
        W.ev({ time: '10:52', from: 'Siena', to: '', kind: 'internal', status: 'warn',
          title: 'Session 7f3a91 expired',
          note: R.ana1 + ' no longer maps to an open session. Nothing is written to the ticket, so Zendesk shows no change.' });
      } else {
        W.tl(W.anaTicket, '10:52', 'Session ended · conversation kept');
        W.note('Conversation still open until ' + resumeUntil(W).replace(/^[A-Za-z]{3} /, ''), 'prop');
        W.ev({ time: '10:52', from: 'Siena', to: '', kind: 'internal', status: 'ok',
          title: 'Session ended, conversation kept',
          note: 'Siena keeps conversation ' + CV.ana + ' open. The Siena panel in Zendesk shows Ana as offline since 9:52.' });
      }
    }
  };

  S.c2_reply = {
    key: '2.2', clock: 'Tue 11:20 am', title: 'Theo replies', action: 'Theo replies from Zendesk',
    input: { both: { surface: 'composer', key: 'theo1', value: TXT.theo1, who: 'Theo', submit: 'Submit as Pending' } },
    caption: {
      today: '11:20. Theo replies. Zendesk shows it as sent and emails it to the relay address, which no longer has a session, so the reply is dropped. Siena logs the failure only in its own transcript; Zendesk still shows the reply as sent. This is Oakhurst’s “ghosted” customer (LC-48143).',
      proposed: '11:20. Theo replies. A Zendesk webhook (ticket.comment_added) tells Siena at once. Ana is offline, so Siena keeps the reply in her conversation and says so on the ticket: Reply delivery “Held · not seen yet”. Nothing is lost, and Theo can see his reply hasn’t reached her.'
    },
    gaps: { today: ['PR1', 'PR3'], proposed: ['PR3', 'PR1', 'PR21'] }, sol: ['P3', 'P2'],
    focus: { today: ['comment-last', 'inspector-btn'], proposed: ['note-last', 'field-delivery', 'inspector-btn'] },
    apply: function (W) {
      W.clock('Tue 11:20 am');
      W.lockScreen('11:20', 'Tuesday, October 20', []);
      W.active = W.anaTicket;
      var body = W.text('theo1', TXT.theo1);
      var tk = W.tk(W.anaTicket);
      tk.status = 'Pending';
      var c = W.add(W.anaTicket, { role: 'agent', author: P.theo.name, time: '11:20', text: body });
      if (W.today) {
        c.demo = { tone: 'fail', text: 'Never delivered. The relay address has no session, and Zendesk shows no error.' };
        W.note('Theo’s reply never arrives', 'today');
        W.ev({ time: '11:20', from: 'Zendesk', to: '', kind: 'internal', status: 'ok',
          title: 'Public reply added to #' + W.anaTicket, note: 'Theo’s reply is saved and looks sent.' });
        W.ev({ time: '11:20', from: 'Zendesk', to: 'Email', kind: 'email', status: 'ok',
          title: 'Trigger: Notify requester and CCs of comment update',
          note: 'Zendesk emails the reply to the requester, which is the relay address.',
          payload: { to: R.ana1, subject: '[Moss & Marrow] Re: Leaking Rosehip oil – replacement before Friday', body: body.slice(0, 60) + '…' } });
        W.ev({ time: '11:20', from: 'Siena relay', to: '', kind: 'internal', status: 'fail',
          title: 'Delivery failed · relay+7f3a91',
          note: 'The session expired at 10:52, so there is nowhere to deliver it. Siena’s own transcript records “Delivery to chat failed: session expired · Customer email unavailable”, the same line as Fernwood’s Transcript D. Nothing is written back to Zendesk and no bounce is sent.' });
      } else {
        W.set(W.anaTicket, { delivery: 'Held since 11:20 · not seen yet', outcome: 'Routed – reply held' });
        W.add(W.anaTicket, { role: 'note', author: P.siena.name, time: '11:20',
          text: 'Reply held: Ana is offline (last seen 9:52). She’ll see it as soon as she’s back on the site. Her conversation stays open until ' + resumeUntil(W) + '.' });
        W.tl(W.anaTicket, '11:20', 'Theo replied · held, Ana offline', 'held');
        W.note('Theo’s reply is held for Ana, and the ticket says so', 'prop');
        W.ev({ time: '11:20', from: 'Zendesk', to: 'Siena', kind: 'webhook', status: 'ok',
          title: 'Webhook · zen:event-type:ticket.comment_added',
          note: 'Zendesk calls Siena the moment a comment is added. Siena acts only on public comments by staff. This replaces the email to a relay address.',
          payload: { type: 'zen:event-type:ticket.comment_added', subject: 'zen:ticket:' + W.anaTicket, time: iso('11:20'),
            detail: { id: String(W.anaTicket), external_id: CV.ana, status: 'PENDING', requester_id: String(P.ana.zdId), via: { channel: 'web_service' } },
            event: { comment: { id: '41877120034', body: body.slice(0, 60) + '…', is_public: true, author: { id: String(P.theo.zdId), is_staff: true, name: P.theo.name } } } } });
        W.ev({ time: '11:20', from: 'Siena', to: '', kind: 'internal', status: 'held',
          title: 'Decide: deliver now or hold',
          note: 'Conversation ' + CV.ana + ' · Ana offline since 9:52 → hold the reply in the conversation until she’s back, and flag it on the ticket.' });
        W.ev({ time: '11:20', from: 'Siena', to: 'Zendesk', kind: 'api', status: 'ok',
          title: 'PUT /api/v2/tickets/' + W.anaTicket + '.json',
          note: 'Records the decision on the ticket: two fields and an internal note.',
          payload: { ticket: { custom_fields: fieldsPayload(W, { delivery: 'Held since 11:20 · not seen yet', outcome: 'Routed – reply held' }),
            comment: { body: 'Reply held: Ana is offline (last seen 9:52)…', public: false, author_id: P.siena.zdId } } } });
      }
    }
  };

  /* Chapter 3 · Ana comes back (branch "return") */
  S.c3_back = {
    key: '3.1', clock: 'Tue 11:45 am', title: 'Ana comes back', action: 'Skip to 11:45: Ana comes back',
    caption: {
      today: '11:45. Ana comes back. Her old session is gone, so she gets a fresh chat with no history, and Theo’s reply isn’t there. She will have to explain again (Northpaw, LC-48116; Halden & Rowe, LC-48132).',
      proposed: '11:45. Ana comes back. Her browser’s conversation ID resumes the same conversation, and Theo’s reply is waiting at the top. Siena records the delivery on the ticket: still one ticket, now spanning two chat sessions.'
    },
    gaps: { today: ['D1'], proposed: ['D1', 'PR1', 'D2'] }, sol: ['P1', 'P3', 'P2'],
    focus: { today: ['widget'], proposed: ['widget', 'field-delivery', 'field-sessions'] },
    apply: function (W) {
      W.clock('Tue 11:45 am');
      W.active = W.anaTicket;
      var theo = W.text('theo1', TXT.theo1);
      if (W.today) {
        anaScene(W);
        W.open();
        W.msg('ai', 'Hi Ana! I’m the Moss & Marrow assistant. Ask me anything about your skincare or your subscription.', '11:45');
        W.ev({ time: '11:45', from: 'Widget', to: 'Siena', kind: 'widget', status: 'warn',
          title: 'No open session for this browser',
          note: 'Session 7f3a91 expired at 10:52, so the widget starts a new session, c20e44, with a new relay address and no history.' });
      } else {
        var keep = W.phone.messages.slice();
        anaScene(W);
        W.phone.messages = keep;
        W.open();
        W.phone.header = { title: 'Moss & Marrow', sub: 'Theo replied while you were away' };
        W.msg('divider', 'Theo replied while you were away · 11:20', '11:20');
        W.msg('agent', theo, '11:20', { name: 'Theo', fresh: true });
        var tk = W.tk(W.anaTicket);
        tk.siena.presence = 'online'; tk.siena.lastSeen = '11:45';
        W.set(W.anaTicket, { delivery: 'Delivered in chat 11:45', outcome: 'Routed – answered', sessions: '2 (same conversation)' });
        W.add(W.anaTicket, { role: 'note', author: P.siena.name, time: '11:45',
          text: 'Delivered to Ana in chat at 11:45, 25 minutes after Theo sent it. Same conversation, second chat session.' });
        W.tl(W.anaTicket, '11:45', 'Ana back · same conversation');
        W.tl(W.anaTicket, '11:45', 'Reply delivered in chat', 'ok');
        W.ev({ time: '11:45', from: 'Widget', to: 'Siena', kind: 'widget', status: 'ok',
          title: 'Visitor ' + P.ana.visitorId + ' is back',
          note: 'Same browser, same conversation ID, inside the ' + resumeLabel(W) + ' window, so Siena resumes conversation ' + CV.ana + ' instead of starting a new one.',
          payload: { visitor_id: P.ana.visitorId, conversation_id: CV.ana, session: 2, resumed: true } });
        W.ev({ time: '11:45', from: 'Siena', to: 'Widget', kind: 'widget', status: 'ok',
          title: 'Deliver held reply', note: 'Theo’s reply is shown first, under a “while you were away” divider.' });
        W.ev({ time: '11:45', from: 'Widget', to: 'Siena', kind: 'widget', status: 'ok',
          title: 'Delivery receipt', note: 'The widget confirms the reply was rendered on Ana’s screen at 11:45:12.',
          payload: { message_id: 'msg_theo_1', rendered_at: iso('11:45').replace(':00-', ':12-') } });
        W.ev({ time: '11:45', from: 'Siena', to: 'Zendesk', kind: 'api', status: 'ok',
          title: 'PUT /api/v2/tickets/' + W.anaTicket + '.json',
          note: 'Records the delivery: fields and an internal note. No second ticket.',
          payload: { ticket: { custom_fields: fieldsPayload(W, { delivery: 'Delivered in chat 11:45', outcome: 'Routed – answered', sessions: '2 (same conversation)' }),
            comment: { body: 'Delivered to Ana in chat at 11:45…', public: false, author_id: P.siena.zdId } } } });
      }
    }
  };

  S.c3_second = {
    key: '3.2', clock: 'Tue 11:46 am', title: { today: 'A second ticket', proposed: 'Ana replies' },
    action: { today: 'Ana asks again', proposed: 'Ana replies' },
    input: {
      today: { surface: 'widget', key: 'ana2', value: TXT.ana2, who: 'Ana' },
      proposed: { surface: 'widget', key: 'ana3', value: TXT.ana3, who: 'Ana' }
    },
    caption: {
      today: 'Siena routes her again and opens a second ticket with a new relay address. Nothing links it to the first, so Zendesk treats it as a different customer, and another agent could pick it up.',
      proposed: 'Ana thanks Theo in the same chat. Her message lands on the same ticket as a comment from Ana, not from a relay address.'
    },
    gaps: { today: ['D1', 'D2', 'D3'], proposed: ['D2', 'D3'] }, sol: ['P1', 'P3'],
    focus: { today: ['zd-tabs', 'requester', 'view-chat'], proposed: ['comment-last', 'requester'] },
    apply: function (W) {
      W.clock('Tue 11:46 am');
      if (W.today) {
        var a2 = W.text('ana2', TXT.ana2);
        W.msg('visitor', a2, '11:46');
        W.msg('ai', TXT.anaAI2, '11:46');
        W.msg('ai', TXT.handoffToday, '11:46');
        var id = W.createTicket({
          subject: 'Leaking Rosehip oil – did anyone see my message?', created: 'Tue 11:46 am', who: 'ana', group: 'Live chat',
          requester: { name: 'relay+c20e44', email: R.ana2, kind: 'relay', initials: 'R' },
          tags: [TG.handoff, TG.follow]
        });
        W.anaTicket2 = id;
        W.add(id, { role: 'enduser', author: 'relay+c20e44', time: '11:46', pre: true,
          text: transcript([['Visitor', a2], ['Assistant', TXT.anaAI2], ['Assistant', TXT.handoffToday]]) });
        W.ev({ time: '11:46', from: 'Siena', to: 'Zendesk', kind: 'api', status: 'warn',
          title: 'POST /api/v2/tickets.json',
          note: 'A second ticket for the same problem, from a second relay address. Nothing links it to #' + W.anaTicket + '.',
          payload: { ticket: { subject: 'Leaking Rosehip oil – did anyone see my message?', requester: { name: 'relay+c20e44', email: R.ana2 },
            comment: { body: 'Live Chat transcript\nVisitor: ' + a2.slice(0, 40) + '…', public: true }, tags: [TG.handoff, TG.follow] } } });
      } else {
        var a3 = W.text('ana3', TXT.ana3);
        W.msg('visitor', a3, '11:46');
        W.add(W.anaTicket, { role: 'enduser', author: P.ana.name, time: '11:46', text: a3 });
        W.tk(W.anaTicket).status = 'Open';
        W.active = W.anaTicket;
        W.ev({ time: '11:46', from: 'Siena', to: 'Zendesk', kind: 'api', status: 'ok',
          title: 'PUT /api/v2/tickets/' + W.anaTicket + '.json',
          note: 'Posts Ana’s message as her own public comment on the same ticket.',
          payload: { ticket: { comment: { body: a3, author_id: P.ana.zdId, public: true } } } });
      }
    }
  };

  S.c3_resolved = {
    key: '3.3', clock: 'Tue 11:47 am', title: { today: 'No record of how it ended', proposed: 'Who resolved it' },
    action: 'Ana’s chat ends',
    caption: {
      today: 'Ana has her answer, but neither ticket says so. No rating request goes out either: Siena skips chats that were routed, and its 24-hour cool-down would skip her second session anyway. The worst journey of the day is never rated, and nothing records that a person resolved it.',
      proposed: 'Ana’s thanks confirm it: Siena sets the outcome to “Resolved – confirmed” and adds the new tag siena-resolved-with-agent, so this isn’t counted as Siena’s own resolution. Rating rules don’t change in this proposal; the Siena rating field says why there’s no rating.'
    },
    gaps: { today: ['D26', 'PR21'], proposed: ['PR21'] }, sol: ['P5', 'P2'],
    focus: { today: ['widget'], proposed: ['tags', 'field-outcome', 'field-csat'] },
    apply: function (W) {
      W.clock('Tue 11:47 am');
      if (W.today) {
        W.active = W.anaTicket2;
        W.note('No rating request: routed chat, inside the 24-hour cool-down', 'today');
        W.ev({ time: '11:47', from: 'Siena', to: '', kind: 'internal', status: 'warn',
          title: 'Rating request skipped',
          note: 'Siena only surveys conversations that were not routed, outside a 24-hour cool-down (help centre article 01 and FAQ). Neither ticket records how the chat ended.' });
      } else {
        W.active = W.anaTicket;
        W.tag(W.anaTicket, TG.agent);
        W.set(W.anaTicket, { outcome: 'Resolved – confirmed', csat: 'Not asked · routed chat' });
        W.tl(W.anaTicket, '11:47', 'Resolved · confirmed by Ana, with an agent', 'ok');
        W.note('Resolved with an agent · the ticket says so', 'prop');
        W.ev({ time: '11:47', from: 'Siena', to: '', kind: 'internal', status: 'ok',
          title: 'Outcome: resolved with an agent',
          note: 'Ana confirmed the fix after Theo’s reply, so this resolution goes to the agent, not to Siena. Rating rules are unchanged: Siena doesn’t survey routed chats, and the field records why.' });
        W.ev({ time: '11:47', from: 'Siena', to: 'Zendesk', kind: 'api', status: 'ok',
          title: 'PUT /api/v2/tickets/' + W.anaTicket + '.json',
          note: 'Two fields and the new resolution tag. Today’s handoff tags stay.',
          payload: { ticket: { custom_fields: fieldsPayload(W, { outcome: 'Resolved – confirmed', csat: 'Not asked · routed chat' }), additional_tags: [TG.agent] } } });
      }
    }
  };

  /* Chapter 3 · branch "away" */
  S.c3_away = {
    key: '3.1', clock: 'Tue 11:50 am', title: 'Ana doesn’t come back', action: 'Skip to 11:50',
    caption: {
      today: '11:50. Ana hasn’t come back, and nothing else happens: the reply sits in Zendesk marked as sent, and the next thing Moss & Marrow hears is a complaint (Oakhurst’s came on Instagram, LC-48143).',
      proposed: function (W) {
        return '11:50. Ana hasn’t come back. Theo’s reply waits in her conversation until ' + resumeDay(W) + ', and the ticket says it hasn’t been seen: it’s in the Reply held view. Nothing fails silently, and her real email is on the ticket. Siena emailing it is the vision, in the next step.';
      }
    },
    gaps: { today: ['PR1'], proposed: ['PR1', 'PR21'] }, sol: ['P3', 'P2'],
    focus: { today: ['comment-last'], proposed: ['field-delivery', 'view-held'] },
    apply: function (W) {
      W.clock('Tue 11:50 am');
      W.lockScreen('11:50', 'Tuesday, October 20', []);
      W.active = W.anaTicket;
      if (W.today) {
        W.note('No email, no chat: Ana never sees the reply', 'today');
        W.ev({ time: '11:50', from: 'Siena', to: '', kind: 'internal', status: 'fail',
          title: 'Nothing happens', note: 'The reply was discarded at 11:20. Zendesk still shows it as sent, and Ana has no way to see it.' });
      } else {
        W.set(W.anaTicket, { delivery: 'Held since 11:20 · not seen yet' });
        W.note('Reply held until Ana returns · flagged on the ticket', 'prop');
        W.ev({ time: '11:50', from: 'Siena', to: '', kind: 'internal', status: 'held',
          title: 'Reply still held',
          note: 'Ana hasn’t been back since 9:52. The reply waits in conversation ' + CV.ana + ' until ' + resumeUntil(W) + '. Reply delivery and the Reply held view show Theo it hasn’t been seen.' });
      }
    }
  };

  /* ============ Vision steps inside the proposal chapters ============
     They show where a proposal step leads. They are left out of the proposal's world, so chapters 1–4 never
     carry their effects. */

  S.c3_followup = {
    key: '3.2', vision: 'V1', clock: 'Tue 11:50 am', title: { today: 'Still nothing', proposed: 'Siena follows up by email' },
    action: 'See the vision: Siena follows up',
    caption: {
      today: '11:50. Still nothing. The reply was dropped at 11:20, and Ana has no way to see it.',
      proposed: function (W) {
        var m = W.st.followUpMin;
        if (!m) return 'Session Controls, reworked, with email follow-up set to Never in Setup: the reply stays held, as in the proposal. Set it to 30 minutes to see Siena follow up.';
        var t = addMin('11:20', m);
        return 'Session Controls, reworked: once the conversation outlives the session, its timer can decide when Siena follows up on an abandoned chat. At ' + t + ', ' + m + ' minutes after a reply Ana hasn’t seen, Siena emails Theo’s reply to ' + P.ana.email + ' and records it.';
      }
    },
    gaps: { today: ['PR1'], proposed: ['PR1'] },
    focus: { today: ['phone'], proposed: ['phone', 'field-delivery', 'note-last'] },
    apply: function (W) {
      var m = W.st.followUpMin;
      var t = m ? addMin('11:20', m) : '11:50';
      var shown = m && mins(t) > mins('11:50') ? t : '11:50';
      W.clock('Tue ' + ampm(shown));
      W.active = W.anaTicket;
      var theo = W.text('theo1', TXT.theo1);
      if (W.today) {
        W.lockScreen(shown, 'Tuesday, October 20', []);
        W.note('Still no email and no chat', 'today');
      } else if (!m) {
        W.lockScreen(shown, 'Tuesday, October 20', []);
        W.note('Email follow-up is set to Never: the reply stays held', 'prop');
      } else {
        W.lockScreen(shown, 'Tuesday, October 20', [{ app: 'Mail', title: 'Moss & Marrow', sub: 'Theo replied to your chat', body: theo.slice(0, 70) + '…' }]);
        W.set(W.anaTicket, { delivery: 'Emailed ' + t, outcome: 'Routed – answered (email)' });
        W.add(W.anaTicket, { role: 'note', author: P.siena.name, time: t,
          text: 'Ana hasn’t been back for ' + m + ' minutes since Theo replied, so I emailed his reply to ' + P.ana.email + ' at ' + t + '. It will also be in the chat if she returns.' });
        W.tl(W.anaTicket, t, 'Reply emailed (follow-up)', 'ok');
        W.note('Vision: Theo’s reply reaches Ana by email', 'prop');
        W.ev({ time: t, from: 'Siena', to: '', kind: 'internal', status: 'ok',
          title: 'Follow-up timer · ' + m + ' minutes, no return',
          note: 'Session Controls, reworked: the timer that used to end the session (and drop the reply) now starts the email follow-up for a reply the shopper hasn’t seen.' });
        W.ev({ time: t, from: 'Siena', to: 'Email', kind: 'email', status: 'ok',
          title: 'Follow-up emailed to ' + P.ana.email,
          note: 'Sent from the store’s support address and signed by Theo. Ana still sees the reply in the chat if she comes back.',
          payload: { to: P.ana.email, from: 'Moss & Marrow <' + CS.STORE.supportEmail + '>', subject: 'Theo replied to your chat', body: theo.slice(0, 60) + '…' } });
        W.ev({ time: t, from: 'Siena', to: 'Zendesk', kind: 'api', status: 'ok',
          title: 'PUT /api/v2/tickets/' + W.anaTicket + '.json',
          note: 'The Reply delivery field from the proposal records the email.',
          payload: { ticket: { custom_fields: fieldsPayload(W, { delivery: 'Emailed ' + t, outcome: 'Routed – answered (email)' }),
            comment: { body: 'Ana hasn’t been back for ' + m + ' minutes…', public: false, author_id: P.siena.zdId } } } });
      }
    }
  };

  S.c3_rating = {
    key: '3.4', vision: 'V5', clock: 'Tue 11:47 am', title: { today: 'Never rated', proposed: 'One rating per conversation' },
    action: 'See the vision: a rating',
    caption: {
      today: 'Still no rating request. Today Siena only surveys chats it resolved without a handoff, at most once every 24 hours per visitor.',
      proposed: function (W) {
        if (!W.st.ratePerConversation) return 'One rating per conversation is off in Setup, so Siena keeps today’s rule and doesn’t survey this routed chat. Switch it on to see the vision.';
        return 'With one conversation ID, the cool-down can count conversations instead of visitors, and Siena can ask once the reply has been delivered, routed or not. Ana’s five stars go to the Siena rating field the proposal adds.';
      }
    },
    gaps: { both: ['D26'] },
    focus: {
      today: ['widget'],
      proposed: function (W) { return W.st.ratePerConversation ? ['widget-last', 'field-csat'] : ['widget', 'field-csat']; }
    },
    apply: function (W) {
      W.clock('Tue 11:47 am');
      if (W.today) {
        W.active = W.anaTicket2;
        W.note('Still no rating request', 'today');
      } else if (!W.st.ratePerConversation) {
        W.active = W.anaTicket;
        W.note('No rating request: one rating per conversation is off in Setup', 'prop');
      } else {
        W.msg('ai', 'Glad that’s sorted, Ana! How did we do?', '11:47');
        W.msg('rating', '5', '11:47');
        W.phone.rating = 5;
        W.add(W.anaTicket, { role: 'ai', author: P.siena.name, time: '11:47', text: 'Glad that’s sorted, Ana! How did we do?' });
        W.set(W.anaTicket, { csat: '5 / 5 · asked once, after delivery' });
        W.tl(W.anaTicket, '11:47', 'Rated 5/5', 'ok');
        W.active = W.anaTicket;
        W.ev({ time: '11:47', from: 'Siena', to: 'Widget', kind: 'widget', status: 'ok',
          title: 'Rating request', note: 'Once per conversation, after the reply has been delivered. Routed conversations are included.' });
        W.ev({ time: '11:47', from: 'Widget', to: 'Siena', kind: 'widget', status: 'ok', title: 'Rating received · 5/5', payload: { conversation_id: CV.ana, rating: 5, scale: 5 } });
        W.ev({ time: '11:47', from: 'Siena', to: 'Zendesk', kind: 'api', status: 'ok',
          title: 'PUT /api/v2/tickets/' + W.anaTicket + '.json',
          payload: { ticket: { custom_fields: fieldsPayload(W, { csat: '5 / 5 · asked once, after delivery' }) } } });
      }
    }
  };

  /* Chapter 4 · Every chat in Zendesk */
  S.c4_intro = {
    key: '4.0', clock: 'Tue 2:10 pm', title: 'A visitor opens the chat', action: 'Next chapter: every chat in Zendesk',
    caption: { both: 'Afternoon. A visitor who isn’t logged in is looking at the Calm Skin Box and opens the chat.' },
    gaps: {}, focus: { both: ['phone'] },
    apply: function (W) {
      W.clock('Tue 2:10 pm'); W.scene('guest', 'box', null); W.open();
      W.active = null;   // a new shopper: Theo's view goes back to his ticket list
      var at = W.anaTicket && W.tk(W.anaTicket);
      if (at && at.siena && at.siena.presence === 'online') { at.siena.presence = 'offline'; at.siena.lastSeen = 'Tue 11:48 am'; W.tl(W.anaTicket, '11:48', 'Ana left the site'); }
      W.msg('ai', 'Hi there! I’m the Moss & Marrow assistant. How can I help?', '2:10');
    }
  };

  S.c4_ask = {
    key: '4.1', clock: 'Tue 2:10 pm', title: { today: 'The chat stays out of Zendesk', proposed: 'The chat reaches Zendesk' },
    action: 'Send the visitor’s question',
    input: { both: { surface: 'widget', key: 'guest1', value: TXT.guest1, who: 'the visitor' } },
    caption: {
      today: 'Siena answers from the help centre, without a handoff, as it always has. With the default sync scope, Routed Only, nothing reaches Zendesk: the chat is invisible to anyone reporting from the helpdesk.',
      proposed: function (W) {
        if (W.st.syncScope === 'routed') return 'Siena answers without a handoff, as it does today. Sync scope is set to Routed only in Setup, so this chat stays out of Zendesk. Switch it back to All conversations to see the ticket.';
        return 'Siena answers without a handoff, as it does today. What changes is where the chat goes: All Conversations is now the default for per-seat helpdesks like Zendesk, so it reaches Zendesk with its Siena fields at no extra cost.';
      }
    },
    gaps: { both: ['D15'] }, sol: ['P4', 'P2'],
    focus: {
      today: ['zd-note'],
      proposed: function (W) { return W.st.syncScope === 'routed' ? ['zd-note'] : ['zd-tabs', 'field-mode', 'field-outcome']; }
    },
    apply: function (W) {
      W.clock('Tue 2:10 pm');
      var q = W.text('guest1', TXT.guest1);
      W.msg('visitor', q, '2:10');
      W.msg('ai', TXT.guestAI, '2:10');
      if (W.today || W.st.syncScope === 'routed') {
        W.zdNote = W.today
          ? { tone: 'today', text: 'No ticket for this chat. Sync scope is Routed Only, so a chat without a handoff never reaches Zendesk.' }
          : { tone: 'prop', text: 'No ticket for this chat: sync scope is set to Routed only in Setup.' };
        W.ev({ time: '2:10', from: 'Siena', to: '', kind: 'internal', status: 'warn',
          title: 'Not synced to Zendesk', note: W.today ? 'Sync scope is Routed Only, the default, so a chat without a handoff never reaches the helpdesk.' : 'Sync scope is set to Routed only in Setup, so this chat stays out of Zendesk.' });
      } else {
        var fields = { source: 'Siena Live Chat', conversation: CV.guest, outcome: 'Answered by Siena – awaiting shopper', reason: '—', mode: 'No handoff', delivery: '—', sessions: '1', csat: '—' };
        var id = W.createTicket({
          subject: 'Skipping next month’s box', status: 'Pending', created: 'Tue 2:10 pm', who: 'guest', group: 'Live chat', externalId: CV.guest,
          requester: { name: P.guest.name, email: '', kind: 'anon', initials: P.guest.initials },
          tags: [], fields: fields,
          siena: { presence: 'online', lastSeen: '2:10', conv: CV.guest, resumeUntil: null, timeline: [] }
        });
        W.guestTicket = id;
        W.add(id, { role: 'enduser', author: P.guest.name, time: '2:10', text: q });
        W.add(id, { role: 'ai', author: P.siena.name, time: '2:10', text: TXT.guestAI });
        W.tl(id, '2:10', 'Chat started · not logged in');
        W.tl(id, '2:10', 'Answered by Siena, no handoff');
        W.ev({ time: '2:10', from: 'Siena', to: 'Zendesk', kind: 'api', status: 'ok',
          title: 'POST /api/v2/tickets.json',
          note: 'Sync scope is All conversations. The requester is an anonymous visitor keyed by the conversation ID, and the ticket waits on the shopper (Pending), not on an agent. No tags yet: the resolution tag comes when the chat ends.',
          payload: { ticket: { subject: 'Skipping next month’s box', status: 'pending', requester_id: P.guest.zdId, external_id: CV.guest,
            comment: { body: q, author_id: P.guest.zdId, public: true }, custom_fields: fieldsPayload(W, fields) } } });
      }
    }
  };

  S.c4_quiet = {
    key: '4.2', clock: 'Tue 3:10 pm', title: 'The visitor goes quiet', action: 'Skip to 3:10: no reply from the visitor',
    caption: {
      today: 'The visitor never replies. When the session expires, Session Controls ends the chat and Siena counts it as resolved by AI, though nobody confirmed anything, and Zendesk has no record of it.',
      proposed: function (W) {
        if (W.st.syncScope === 'routed') return 'The visitor never replies. Siena’s own reports record “Resolved – assumed (no reply)”, but with sync scope set to Routed only, Zendesk never sees this chat or its tag.';
        return 'The visitor never replies. The chat ends as it does today, but the ticket is now honest about it: Siena outcome “Resolved – assumed (no reply)” and the new tag siena-resolved-by-ai. Reports can tell confirmed resolutions from chats that went quiet, and Siena’s from an agent’s.';
      }
    },
    gaps: { today: ['D7'], proposed: ['D7', 'PR21', 'D15'] }, sol: ['P2', 'P5'],
    focus: {
      today: ['phone', 'zd-note'],
      proposed: function (W) { return W.guestTicket ? ['field-outcome', 'tags', 'view-assumed'] : ['phone', 'zd-note']; }
    },
    apply: function (W) {
      W.clock('Tue 3:10 pm');
      W.lockScreen('3:10', 'Tuesday, October 20', []);
      if (W.today) {
        W.note('Session expired → Siena counts this as resolved by AI', 'today');
        W.zdNote = { tone: 'today', text: 'Still no ticket. Siena counts this chat as resolved by AI, and Zendesk has no record of it.' };
        W.ev({ time: '3:10', from: 'Siena', to: '', kind: 'internal', status: 'warn',
          title: 'Session 4b1c9e expired → “resolved by AI”', note: 'The visitor never replied, but the session counts towards Siena’s AI resolution rate.' });
      } else if (!W.guestTicket) {
        W.note('Session ended → Siena records: Resolved – assumed', 'prop');
        W.zdNote = { tone: 'prop', text: 'Still no ticket. Siena records “Resolved – assumed” in its own reports only.' };
        W.ev({ time: '3:10', from: 'Siena', to: '', kind: 'internal', status: 'ok',
          title: 'Outcome recorded in Siena only', note: 'Resolved – assumed (no reply). Not synced to Zendesk because sync scope is Routed only.' });
      } else {
        W.note('Session ended → Resolved – assumed, by Siena', 'prop');
        var id = W.guestTicket;
        W.tk(id).status = 'Solved';
        W.tk(id).siena.presence = 'offline'; W.tk(id).siena.lastSeen = '2:10';
        W.set(id, { outcome: 'Resolved – assumed (no reply)' });
        W.tag(id, TG.ai);
        W.tl(id, '3:10', 'No reply · resolved by Siena, assumed');
        W.active = id;
        W.ev({ time: '3:10', from: 'Siena', to: 'Zendesk', kind: 'api', status: 'ok',
          title: 'PUT /api/v2/tickets/' + id + '.json',
          note: 'Session Controls’ abandoned-chat auto-close ends the chat as it does today. The ticket now says how: an assumed resolution, by Siena alone.',
          payload: { ticket: { status: 'solved', custom_fields: fieldsPayload(W, { outcome: 'Resolved – assumed (no reply)' }), additional_tags: [TG.ai] } } });
      }
    }
  };

  S.c4_recap = {
    key: '4.3', clock: 'Tue 3:10 pm', title: 'Recap: the proposal', action: 'See the recap',
    caption: {
      today: 'Recap of chapters 1 to 4 as Live Chat works today. Compare it with the proposal on the right, or switch modes and replay any step.',
      proposed: 'Recap of chapters 1 to 4 with the proposal. Next come two chapters of vision: what these changes make possible later, not part of this proposal.'
    },
    gaps: {}, focus: { both: ['recap'] },
    apply: function (W) { W.showRecap = 'proposal'; }
  };

  /* ============ The vision (chapters 5 and 6) ============ */

  /* Chapter 5 · After hours */
  S.c5_intro = {
    key: '5.0', clock: 'Tue 11:04 pm', title: 'Mia opens the chat', action: 'Next: the vision',
    caption: { both: '11 pm. Mia isn’t logged in and opens the chat on the Calm Balm page. Moss & Marrow’s team is back at 8 am, Monday to Friday.' },
    gaps: {}, focus: { both: ['phone'] },
    apply: function (W) {
      W.clock('Tue 11:04 pm'); W.scene('mia', 'balm', null); W.open();
      W.active = null;
      W.msg('ai', 'Hi there! I’m the Moss & Marrow assistant. How can I help?', '11:04');
    }
  };

  S.c5_ask = {
    key: '5.1', vision: 'V2', clock: 'Tue 11:04 pm', title: 'An after-hours handoff', action: 'Send Mia’s question',
    input: { both: { surface: 'widget', key: 'mia1', value: TXT.mia1, who: 'Mia' } },
    caption: {
      today: 'Outside hours, Siena falls back to One-Way and promises an email, but email capture is off, so there is no address to send it to. The ticket looks exactly like a daytime handoff: same tags, same live queue, nothing saying it fell back.',
      proposed: function (W) {
        var base = ' The after-hours tag is already on the roadmap (Next · Q1 2027), not in this proposal; here it queues the ticket for the morning. The proposal’s Reply mode field already says “One-Way fallback (outside hours)”.';
        if (!W.st.askEmail) return 'Email capture is off in Setup, so Siena doesn’t promise an email: it tells Mia to come back to the chat.' + base;
        return 'Siena asks for an email before it hands off, so the email it promises can be sent.' + base;
      }
    },
    gaps: { today: ['D12', 'D15', 'D3'], proposed: ['D12', 'D3'] },
    focus: { today: ['widget-last', 'tags', 'fields-empty'], proposed: ['widget', 'field-mode', 'tags'] },
    apply: function (W) {
      W.clock('Tue 11:04 pm');
      var q = W.text('mia1', TXT.mia1);
      W.msg('visitor', q, '11:04');
      W.msg('ai', TXT.miaAI, '11:04');
      if (W.today) {
        W.msg('ai', TXT.afterToday, '11:04');
        var id = W.createTicket({
          subject: 'Calm Balm for a toddler with eczema', created: 'Tue 11:04 pm', who: 'mia', group: 'Live chat',
          requester: { name: 'relay+5be2d0', email: R.mia, kind: 'relay', initials: 'R' },
          tags: [TG.handoff, TG.follow]
        });
        W.miaTicket = id;
        W.add(id, { role: 'enduser', author: 'relay+5be2d0', time: '11:04', pre: true,
          text: transcript([['Visitor', q], ['Assistant', TXT.miaAI], ['Assistant', TXT.afterToday]]) });
        W.ev({ time: '11:04', from: 'Siena', to: '', kind: 'internal', status: 'warn',
          title: 'Outside business hours → One-Way fallback', note: 'The follow-up must go by email, but email capture is off, so Siena has no address for Mia.' });
        W.ev({ time: '11:04', from: 'Siena', to: 'Zendesk', kind: 'api', status: 'warn',
          title: 'POST /api/v2/tickets.json', note: 'Same tags as a daytime handoff, so Zendesk routes it to the live chat queue.',
          payload: { ticket: { subject: 'Calm Balm for a toddler with eczema', requester: { name: 'relay+5be2d0', email: R.mia },
            comment: { body: 'Live Chat transcript\nVisitor: ' + q.slice(0, 40) + '…', public: true }, tags: [TG.handoff, TG.follow] } } });
      } else {
        var ask = W.st.askEmail;
        if (ask) {
          W.msg('ai', 'Our team is back at 8:00 am. What’s the best email to reach you?', '11:04');
          W.msg('visitor', P.mia.email, '11:05');
          W.msg('ai', 'Thanks, Mia. Theo will email you in the morning, and his answer will be here too.', '11:05');
        } else {
          W.msg('ai', 'Our team is back at 8:00 am. Theo’s answer will be waiting in this chat: come back any time in the next ' + resumeLabel(W) + '.', '11:04');
        }
        var tags = [TG.handoff, TG.follow, TG.after];
        var fields = { source: 'Siena Live Chat', conversation: CV.mia, outcome: 'Routed – awaiting agent', reason: 'Health question for a child', mode: 'One-Way fallback (outside hours)', delivery: '—', sessions: '1', csat: '—' };
        var id2 = W.createTicket({
          subject: 'Calm Balm for a toddler with eczema', created: 'Tue ' + (ask ? '11:05' : '11:04') + ' pm', who: 'mia', group: 'Morning follow-up', externalId: CV.mia,
          requester: ask ? { name: P.mia.name, email: P.mia.email, kind: 'customer', initials: P.mia.initials } : { name: 'Website visitor 5be2', email: '', kind: 'anon', initials: 'WV' },
          tags: tags, fields: fields,
          siena: { presence: 'online', lastSeen: '11:05', conv: CV.mia, resumeUntil: null, timeline: [] }
        });
        W.miaTicket = id2;
        W.add(id2, { role: 'enduser', author: ask ? P.mia.name : 'Website visitor 5be2', time: '11:04', text: q });
        W.add(id2, { role: 'ai', author: P.siena.name, time: '11:04', text: TXT.miaAI + (ask ? ' Our team is back at 8:00 am. What’s the best email to reach you?' : ' Our team is back at 8:00 am.') });
        if (ask) W.add(id2, { role: 'enduser', author: P.mia.name, time: '11:05', text: P.mia.email });
        W.tl(id2, '11:04', 'Chat started · outside hours');
        W.tl(id2, ask ? '11:05' : '11:04', ask ? 'Email captured · handed off (One-Way)' : 'Handed off (One-Way) · no email');
        W.ev({ time: '11:04', from: 'Siena', to: '', kind: 'internal', status: 'ok',
          title: 'Outside business hours → One-Way fallback',
          note: ask ? 'Mia isn’t logged in, so Siena asks for an email before handing off (vision: email capture at handoff).' : 'Email capture is off, so Siena doesn’t promise an email.' });
        W.ev({ time: ask ? '11:05' : '11:04', from: 'Siena', to: 'Zendesk', kind: 'api', status: 'ok',
          title: 'POST /api/v2/tickets.json',
          note: 'Reply mode (a proposal field) says “One-Way fallback (outside hours)”. The after-hours tag is the roadmap item (Next · Q1 2027), shown here as it would work: a Zendesk trigger sends tagged tickets to the Morning follow-up group.',
          payload: { ticket: { subject: 'Calm Balm for a toddler with eczema', requester: ask ? { name: P.mia.name, email: P.mia.email } : { name: 'Website visitor 5be2' }, external_id: CV.mia,
            comment: { body: q, public: true }, tags: tags, custom_fields: fieldsPayload(W, fields) } } });
      }
    }
  };

  S.c5_away = {
    key: '5.2', vision: 'V3', clock: 'Tue 11:06 pm', title: { today: 'The outside-hours message, again', proposed: 'Siena answers on its own' },
    action: 'Mia asks a follow-up',
    input: { both: { surface: 'widget', key: 'mia2', value: TXT.mia2, who: 'Mia' } },
    caption: {
      today: 'Mia asks a simple follow-up. Siena sends the outside-hours message again instead of answering it (known issue LC-1182, fix planned for v43.8).',
      proposed: function (W) {
        if (!W.st.answerWhileAway) return '“Siena answers while the team is away” is off in Setup, so Siena tells Mia, once, that her question is with the team, without repeating the outside-hours message.';
        return 'While the team is away, Siena keeps the conversation going: it answers what it safely can on its own, from the product page, and adds it to Theo’s ticket. The eczema question still waits for a person. It sits next to scheduled availability’s AI-only option.';
      }
    },
    gaps: {},
    focus: { today: ['widget-last', 'comment-last'], proposed: ['widget-last', 'comment-last'] },
    apply: function (W) {
      W.clock('Tue 11:06 pm');
      var q = W.text('mia2', TXT.mia2);
      W.msg('visitor', q, '11:06');
      W.active = W.miaTicket;
      if (W.today) {
        W.msg('ai', TXT.afterToday, '11:06');
        W.add(W.miaTicket, { role: 'enduser', author: 'relay+5be2d0', time: '11:06', pre: true, text: 'Visitor: ' + q + '\nAssistant: ' + TXT.afterToday });
        W.ev({ time: '11:06', from: 'Siena', to: '', kind: 'internal', status: 'warn',
          title: 'Outside-hours message sent again',
          note: 'Known issue LC-1182: after an after-hours handoff, every new customer message re-sends the outside-hours message. Fix scheduled for v43.8 (late October).' });
      } else if (!W.st.answerWhileAway) {
        W.msg('ai', 'Your question is with our team. Theo will reply in the morning.', '11:06');
        W.add(W.miaTicket, { role: 'enduser', author: W.tk(W.miaTicket).requester.name, time: '11:06', text: q });
        W.ev({ time: '11:06', from: 'Siena', to: '', kind: 'internal', status: 'ok',
          title: 'Follow-up waits for the team', note: 'Answering while the team is away is off in Setup.' });
      } else {
        W.msg('ai', TXT.miaAI2, '11:06');
        var who = W.tk(W.miaTicket).requester.name;
        W.add(W.miaTicket, { role: 'enduser', author: who, time: '11:06', text: q });
        W.add(W.miaTicket, { role: 'ai', author: P.siena.name, time: '11:06', text: TXT.miaAI2 });
        W.tl(W.miaTicket, '11:06', 'Siena answered a follow-up · team away', 'ok');
        W.ev({ time: '11:06', from: 'Siena', to: '', kind: 'internal', status: 'ok',
          title: 'Siena answers on its own · team away',
          note: 'Outside business hours, after a handoff. The follow-up is a product fact from the product page, so Siena answers it. The medical question stays with Theo.' });
        W.ev({ time: '11:06', from: 'Siena', to: 'Zendesk', kind: 'api', status: 'ok',
          title: 'PUT /api/v2/tickets/' + W.miaTicket + '.json',
          note: 'Both messages go on the same ticket, so Theo sees what Siena already answered.',
          payload: { ticket: { comment: { body: TXT.miaAI2, author_id: P.siena.zdId, public: true } } } });
      }
    }
  };

  /* Chapter 6 · Next morning */
  S.c6_mia = {
    key: '6.1', vision: 'V1', clock: 'Wed 9:02 am', title: 'Theo answers Mia', action: 'Next morning: Theo answers Mia',
    caption: {
      today: 'Wednesday, 9:02. Theo answers Mia. The reply goes to her relay address. Her session is long gone and Siena has no email for her, so the reply is dropped, just like Ana’s.',
      proposed: function (W) {
        if (!W.st.askEmail) return 'Wednesday, 9:02. Theo answers Mia. Siena has no email for her (email capture is off in Setup), so the reply waits in her conversation and the ticket flags it as held, as it would with the proposal alone.';
        if (W.st.afterHoursNow) return 'Wednesday, 9:02. Theo answers Mia. She’s offline and the ticket came in after hours, so the reworked Session Controls rule is “follow up at once”: Siena emails the reply straight away and records it on the ticket. It’s in the chat too.';
        if (W.st.followUpMin) return 'Wednesday, 9:02. Theo answers Mia. She’s offline, so Siena holds the reply and starts the follow-up timer from Session Controls, reworked: the email goes at ' + addMin('9:02', W.st.followUpMin) + ' if she hasn’t come back.';
        return 'Wednesday, 9:02. Theo answers Mia. Email follow-up is set to Never in Setup, so the reply waits in her conversation, flagged as held.';
      }
    },
    gaps: { today: ['PR1', 'D3'], proposed: ['PR1', 'D3'] },
    focus: { today: ['comment-last', 'phone'], proposed: ['phone', 'field-delivery', 'note-last'] },
    apply: function (W) {
      W.clock('Wed 9:02 am');
      W.scene('mia', 'balm', null);
      W.active = W.miaTicket;
      var mt = W.tk(W.miaTicket);
      if (mt.siena) { mt.siena.presence = 'offline'; mt.siena.lastSeen = 'Tue 11:07 pm'; }
      var body = W.text('theo2', TXT.theo2);
      mt.status = 'Pending';
      var c = W.add(W.miaTicket, { role: 'agent', author: P.theo.name, time: '9:02', text: body });
      if (W.today) {
        W.lockScreen('9:02', 'Wednesday, October 21', []);
        W.note('No email arrives: Siena never had Mia’s address', 'today');
        c.demo = { tone: 'fail', text: 'Never delivered. No session, and no email on file.' };
        W.ev({ time: '9:02', from: 'Zendesk', to: 'Email', kind: 'email', status: 'ok',
          title: 'Trigger: Notify requester and CCs of comment update', note: 'Zendesk emails the reply to the relay address.',
          payload: { to: R.mia, subject: '[Moss & Marrow] Re: Calm Balm for a toddler with eczema', body: body.slice(0, 60) + '…' } });
        W.ev({ time: '9:02', from: 'Siena relay', to: '', kind: 'internal', status: 'fail',
          title: 'Delivery failed · relay+5be2d0', note: 'One-Way fallback needs a captured email. There is none, so the reply goes nowhere. Zendesk still shows it as sent.' });
        return;
      }
      W.ev({ time: '9:02', from: 'Zendesk', to: 'Siena', kind: 'webhook', status: 'ok',
        title: 'Webhook · zen:event-type:ticket.comment_added',
        payload: { type: 'zen:event-type:ticket.comment_added', subject: 'zen:ticket:' + W.miaTicket, time: iso('09:02', '21'),
          detail: { id: String(W.miaTicket), external_id: CV.mia, status: 'PENDING' },
          event: { comment: { body: body.slice(0, 60) + '…', is_public: true, author: { id: String(P.theo.zdId), is_staff: true, name: P.theo.name } } } } });
      var emailAt = W.st.askEmail ? (W.st.afterHoursNow ? '9:02' : (W.st.followUpMin ? addMin('9:02', W.st.followUpMin) : null)) : null;
      if (emailAt === '9:02') {
        W.lockScreen('9:02', 'Wednesday, October 21', [{ app: 'Mail', title: 'Moss & Marrow', sub: 'Theo replied to your chat', body: body.slice(0, 70) + '…' }]);
        W.set(W.miaTicket, { delivery: 'Emailed 9:02', outcome: 'Routed – answered (email)' });
        W.add(W.miaTicket, { role: 'note', author: P.siena.name, time: '9:02',
          text: 'Mia is offline and this ticket came in outside hours, so I emailed the reply to ' + P.mia.email + ' at 9:02. It will also be in the chat if she comes back.' });
        W.tl(W.miaTicket, '9:02', 'Theo replied · emailed to Mia', 'ok');
        W.note('Vision: Theo’s reply reaches Mia by email', 'prop');
        W.ev({ time: '9:02', from: 'Siena', to: 'Email', kind: 'email', status: 'ok',
          title: 'Follow-up emailed to ' + P.mia.email,
          note: 'Session Controls, reworked: for a ticket that came in outside business hours the follow-up goes at once, because the shopper has usually gone.',
          payload: { to: P.mia.email, from: 'Moss & Marrow <' + CS.STORE.supportEmail + '>', subject: 'Theo replied to your chat', body: body.slice(0, 60) + '…' } });
        W.ev({ time: '9:02', from: 'Siena', to: 'Zendesk', kind: 'api', status: 'ok',
          title: 'PUT /api/v2/tickets/' + W.miaTicket + '.json',
          payload: { ticket: { custom_fields: fieldsPayload(W, { delivery: 'Emailed 9:02', outcome: 'Routed – answered (email)' }),
            comment: { body: 'Mia is offline and this ticket came in outside hours, so I emailed the reply…', public: false, author_id: P.siena.zdId } } } });
      } else {
        W.lockScreen('9:02', 'Wednesday, October 21', []);
        var del = emailAt ? 'Held since 9:02 · email at ' + emailAt : 'Held since 9:02 · not seen yet';
        W.set(W.miaTicket, { delivery: del, outcome: 'Routed – reply held' });
        W.add(W.miaTicket, { role: 'note', author: P.siena.name, time: '9:02',
          text: emailAt ? 'Reply held: Mia is offline. I’ll email it to ' + P.mia.email + ' at ' + emailAt + ' if she hasn’t come back.' : 'Reply held: Mia is offline and I have no email for her. She’ll see it when she’s back on the site.' });
        W.tl(W.miaTicket, '9:02', 'Theo replied · held, Mia offline', 'held');
        W.note(emailAt ? 'Reply held · email follow-up at ' + emailAt : 'Reply held until Mia returns', 'prop');
        W.ev({ time: '9:02', from: 'Siena', to: '', kind: 'internal', status: 'held',
          title: 'Reply held', note: emailAt ? 'Follow-up timer started: email at ' + emailAt + '.' : 'No email on file, so the reply waits in conversation ' + CV.mia + '.' });
      }
    }
  };

  S.c6_macro = {
    key: '6.2', vision: 'V4', clock: 'Wed 9:10 am', title: 'A macro wipes the tags', action: 'Theo applies the macro “Replacement sent”',
    caption: {
      today: 'Theo closes Ana’s ticket with the macro “Replacement sent”, which uses Set tags. Set tags replaces every tag, so the Live Chat tag is gone and the ticket drops out of the Live Chat view and every tag-based report.',
      proposed: function (W) {
        var base = 'The same macro wipes the tags. With the proposal, the Siena fields already survive it (text fields aren’t stored as tags), so the ticket stays in every Siena view.';
        return W.st.restoreTags ? base + ' In the vision, Siena also hears about it through the same webhook (ticket.tags_changed) and puts its own tags back.'
          : base + ' Putting Siena’s tags back is switched off in Setup, so only the fields remain.';
      }
    },
    gaps: { both: ['D16', 'PR22'] },
    focus: { today: ['tags', 'view-chat', 'comment-last'], proposed: ['tags', 'view-all', 'comment-last'] },
    apply: function (W) {
      W.clock('Wed 9:10 am');
      // back to Ana's ticket; nothing changes for her, so her phone stays locked
      W.scene('ana', 'oil', 'Ana');
      W.lockScreen('9:10', 'Wednesday, October 21', []);
      W.active = W.anaTicket;
      var tk = W.tk(W.anaTicket);
      var before = tk.tags.slice();
      var prevStatus = tk.status;
      tk.tags = ['replacement-sent'];
      tk.status = 'Solved';
      W.add(W.anaTicket, { role: 'event', author: P.theo.name, time: '9:10',
        text: 'Applied macro “Replacement sent”. Status ' + prevStatus + ' → Solved. Tags ' + before.join(', ') + ' → replacement-sent.' });
      W.ev({ time: '9:10', from: 'Zendesk', to: '', kind: 'internal', status: 'ok',
        title: 'Macro “Replacement sent” applied to #' + W.anaTicket,
        payload: { actions: [{ field: 'set_tags', value: 'replacement-sent' }, { field: 'status', value: 'solved' }] } });
      if (W.today) {
        tk.demo = { tone: 'fail', text: 'The Live Chat tag is gone. This ticket no longer counts as a chat anywhere.' };
        W.ev({ time: '9:10', from: 'Zendesk', to: '', kind: 'internal', status: 'fail',
          title: 'Tags replaced', note: 'Removed ' + before.join(', ') + '. #' + W.anaTicket + ' leaves the “Live Chat (tag)” view and every tag-based report.' });
      } else {
        if (W.st.restoreTags) {
          var mirror = before.filter(function (x) { return /^siena-/.test(x); });
          tk.tags = ['replacement-sent'].concat(mirror);
          W.add(W.anaTicket, { role: 'event', author: P.siena.name, time: '9:10', text: 'Re-added its own tags: ' + mirror.join(', ') + '. Siena fields unchanged.' });
          W.ev({ time: '9:10', from: 'Zendesk', to: 'Siena', kind: 'webhook', status: 'ok',
            title: 'Webhook · zen:event-type:ticket.tags_changed',
            note: 'Vision: the same webhook as the reply path, subscribed to one more event.',
            payload: { type: 'zen:event-type:ticket.tags_changed', subject: 'zen:ticket:' + W.anaTicket, event: { tags_added: ['replacement-sent'], tags_removed: before } } });
          W.ev({ time: '9:10', from: 'Siena', to: 'Zendesk', kind: 'api', status: 'ok',
            title: 'PUT /api/v2/tickets/' + W.anaTicket + '/tags.json',
            note: 'Siena adds its own tags back without removing the macro’s tag.',
            payload: { tags: mirror } });
        } else {
          W.ev({ time: '9:10', from: 'Siena', to: '', kind: 'internal', status: 'ok',
            title: 'Fields intact', note: 'Text fields aren’t stored as tags, so Set tags can’t clear them. Restoring tags is off in Setup.' });
        }
        W.tl(W.anaTicket, '9:10', 'Solved by Theo · fields intact');
      }
    }
  };

  S.c6_recap = {
    key: '6.3', clock: 'Wed 9:10 am', title: 'Recap: proposal and vision', action: 'See the recap',
    caption: {
      today: 'Recap of the whole day: today, with the proposal, and with the vision.',
      proposed: 'Recap of the whole day: today, with the proposal, and with the vision it opens up.'
    },
    gaps: {}, focus: { both: ['recap'] },
    apply: function (W) { W.showRecap = 'vision'; }
  };

  CS.STEPS = S;

  CS.chapters = function (branch) {
    var away = branch === 'away';
    return [
      { n: 1, title: 'The handoff', who: 'Ana’s phone', steps: [S.c1_intro, S.c1_ask, S.c1_handoff, S.c1_leave] },
      { n: 2, title: 'A late reply', who: 'Ana’s phone', steps: [S.c2_expire, S.c2_reply] },
      { n: 3, title: away ? 'Ana doesn’t come back' : 'Ana comes back', who: 'Ana’s phone', branch: true,
        steps: away ? [S.c3_away, S.c3_followup] : [S.c3_back, S.c3_second, S.c3_resolved, S.c3_rating] },
      { n: 4, title: 'Every chat in Zendesk', who: 'A visitor’s phone', steps: [S.c4_intro, S.c4_ask, S.c4_quiet, S.c4_recap] },
      { n: 5, title: 'After hours', who: 'Mia’s phone', vision: true, steps: [S.c5_intro, S.c5_ask, S.c5_away] },
      { n: 6, title: 'Next morning', who: 'Mia’s phone', vision: true, steps: [S.c6_mia, S.c6_macro, S.c6_recap] }
    ];
  };

  /* Is this step part of the vision? Vision chapters, and vision steps inside proposal chapters. */
  CS.isVision = function (ch, step) { return !!(ch.vision || step.vision); };

  /* Build the world for a position: apply every step up to and including (c, s).
     Vision steps are skipped unless the position itself is a vision step, so the proposal's world stays clean. */
  CS.build = function (mode, pos, branch, settings, ov) {
    var W = new World(mode, settings, ov, branch);
    var ch = CS.chapters(branch);
    var cur = ch[pos.c].steps[Math.min(pos.s, ch[pos.c].steps.length - 1)];
    var curVision = CS.isVision(ch[pos.c], cur);
    W.vision = curVision && !W.today;
    for (var c = 0; c <= pos.c; c++) {
      var steps = ch[c].steps;
      var last = c === pos.c ? Math.min(pos.s, steps.length - 1) : steps.length - 1;
      for (var s = 0; s <= last; s++) {
        var isCur = c === pos.c && s === last;
        if (!isCur && steps[s].vision && !ch[c].vision && !curVision) continue;
        W.stepKey = steps[s].key;
        W.phone.notes = [];
        W.zdNote = null;
        W.showRecap = false;   // only a recap step sets it, for its own position
        steps[s].apply(W);
      }
    }
    W.currentKey = cur.key;
    return W;
  };

  /* Recap numbers for the proposal (chapters 1–4). */
  CS.recap = function (W) {
    var story = W.tickets.filter(function (t) { return t.story; });
    var per = { ana: 0, guest: 0 };
    story.forEach(function (t) { per[t.who] = (per[t.who] || 0) + 1; });
    var oneEach = ['ana', 'guest'].filter(function (k) { return per[k] === 1; }).length;
    var ana = W.tk(W.anaTicket);
    var seen = W.prop && /Delivered/.test(ana.fields.delivery || '') ? 1 : 0;
    var flagged = W.prop && /^Held/.test(ana.fields.delivery || '') ? 1 : 0;
    var lost = W.today ? 1 : 0;
    var withOutcome = W.prop ? story.filter(function (t) { return t.fields.outcome && t.fields.outcome !== '—'; }).length : 0;
    var resolved = W.prop ? story.filter(function (t) { return /Resolved/.test(t.fields.outcome || ''); }) : [];
    var tagged = resolved.filter(function (t) { return t.tags.indexOf(TG.ai) >= 0 || t.tags.indexOf(TG.agent) >= 0; }).length;
    return {
      tickets: story.length, oneEach: oneEach, seen: seen, flagged: flagged, lost: lost,
      withOutcome: withOutcome, resolved: resolved.length, tagged: tagged, unseen: per.guest === 0 ? 1 : 0
    };
  };
})(window.CS);
