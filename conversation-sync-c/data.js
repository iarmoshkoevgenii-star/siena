/* Conversation Sync prototype: static data.
   Everything here is invented for the case study except where a pack reference (LC-, changelog, roadmap) is cited.
   The proposal is the five changes in the brief for Noor. The vision is what they make possible later. */
window.CS = window.CS || {};
(function (CS) {
  'use strict';

  CS.STORE = {
    name: 'Moss & Marrow',
    domain: 'mossandmarrow.com',
    zendesk: 'mossandmarrow.zendesk.com',
    hours: 'Mon–Fri, 8:00 am – 12:00 pm',
    supportEmail: 'hello@mossandmarrow.com'
  };

  CS.PEOPLE = {
    ana: {
      name: 'Ana Ruiz', first: 'Ana', initials: 'AR', email: 'ana.ruiz@example.com',
      shopifyId: '7745561203', zdId: 19000003011, visitorId: 'v_8d2e1c',
      since: 'Mar 2025', plan: 'Calm Skin Box · monthly', lastOrder: '#MM-4821 · Oct 17',
      orders: 8, spend: '$412'
    },
    guest: { name: 'Website visitor 4b1c', first: 'Visitor', initials: 'WV', visitorId: 'v_4b1c9e', zdId: 19000004022 },
    mia: { name: 'Mia Chen', first: 'Mia', initials: 'MC', email: 'mia.chen@example.com', visitorId: 'v_5be2d0', zdId: 19000004035 },
    theo: { name: 'Theo Mbeki', first: 'Theo', initials: 'TM', zdId: 19000000022 },
    siena: { name: 'Siena (AI)', initials: 'AI', zdId: 19000000011 }
  };

  CS.RELAY = {
    ana1: 'relay+7f3a91@siena.cx',
    ana2: 'relay+c20e44@siena.cx',
    mia: 'relay+5be2d0@siena.cx'
  };

  CS.CONV = { ana: 'conv_7f3a91', guest: 'conv_4b1c9e', mia: 'conv_5be2d0' };

  /* The eight Siena fields from the brief, created in Zendesk during setup. All are plain text fields set through
     the API: text fields are not stored as tags, so "Set tags" can't clear them, and views can still filter them. */
  CS.FIELDS = [
    { key: 'source', label: 'Siena source', id: 31054870101, help: 'Marks every Live Chat ticket. The Siena views filter on it.' },
    { key: 'conversation', label: 'Siena conversation', id: 31054870102, help: 'Siena’s conversation ID. It outlives the chat session, so a shopper who comes back lands on the same ticket. Also written to the ticket’s external ID.' },
    { key: 'outcome', label: 'Siena outcome', id: 31054870103, help: 'Where the conversation stands: awaiting agent, reply held, answered, or resolved (confirmed, or assumed when the shopper went quiet).' },
    { key: 'reason', label: 'Routing reason', id: 31054870104, help: 'Why Siena handed the chat to a person.' },
    { key: 'mode', label: 'Reply mode', id: 31054870105, help: 'Two-Way (in hours), One-Way fallback (outside hours), or no handoff.' },
    { key: 'delivery', label: 'Reply delivery', id: 31054870106, help: 'What happened to the agent’s last public reply: delivered in chat, or held because the shopper is offline.' },
    { key: 'sessions', label: 'Chat sessions', id: 31054870107, help: 'How many chat sessions this one conversation spans.' },
    { key: 'csat', label: 'Siena rating', id: 31054870108, help: 'The shopper’s rating when Siena asks for one, or why it didn’t.' }
  ];

  /* Tags. Today's two handoff tags stay as they are. The proposal adds one resolution tag (two values).
     The after-hours tag is a roadmap item (Next · Q1 2027) and only appears in the vision. */
  CS.TAGS = {
    handoff: 'siena-live-chat-handoff',
    follow: 'siena-follow-needed',
    ai: 'siena-resolved-by-ai',
    agent: 'siena-resolved-with-agent',
    after: 'siena-after-hours'
  };
  CS.TODAY_TAGS = { handoff: CS.TAGS.handoff, follow: CS.TAGS.follow };

  CS.DEFAULT_SETTINGS = {
    /* the proposal */
    syncScope: 'all',              // 'all' | 'routed'
    resumeHours: 72,               // 24 | 72 | 168: how long a conversation stays open after the shopper leaves
    fields: { source: true, conversation: true, outcome: true, reason: true, mode: true, delivery: true, sessions: true, csat: true },
    /* the vision: not part of the proposal */
    followUpMin: 30,               // 15 | 30 | 60 | 0 (never): Session Controls, reworked as the email follow-up timer
    afterHoursNow: true,           // outside business hours, follow up by email at once
    askEmail: true,                // ask for an email at handoff when Siena doesn't know the shopper
    answerWhileAway: true,         // Siena keeps answering what it safely can while the team is away
    restoreTags: true,             // put Siena's tags back if a macro removes them
    ratePerConversation: true      // one rating per conversation, after the reply is delivered
  };

  /* The five changes in the brief ("Siena Support Architecture Fine-Tuning"). */
  CS.ITEMS = {
    P1: {
      n: 1, short: 'Persistent ID', name: 'Persistent session ID',
      today: 'A shopper who comes back after the session ends starts a new session, a new relay address and a second ticket, and has to explain again.',
      change: 'Siena keeps one conversation ID in the shopper’s browser, across sessions, and passes it to the helpdesk in the Siena conversation field. A shopper who comes back within the return window lands on the same conversation and the same ticket.',
      gaps: ['D1', 'D2'], see: [[1, 3], [3, 0]]
    },
    P2: {
      n: 2, short: 'Ticket fields', name: 'Structured fields on every synced ticket',
      today: 'Nothing on the ticket says why the chat was routed, how a reply will travel or how the chat ended. A chat that goes quiet counts as resolved.',
      change: 'Eight Siena fields, created during setup and filled in through the API: source, conversation, outcome, routing reason, reply mode, reply delivery, chat sessions and rating.',
      gaps: ['PR21', 'D12', 'D7'], see: [[1, 2], [4, 2]]
    },
    P3: {
      n: 3, short: 'Webhook replies', name: 'A webhook reply path',
      today: 'Replies travel by email to a relay address that stops working when the session ends. Late replies vanish, and Zendesk still shows them as sent.',
      change: 'A helpdesk webhook tells Siena about every reply, and the widget tells Siena when the shopper goes offline. Siena delivers the reply in chat, or holds it until the shopper is back and says so on the ticket. The requester is the shopper, not a relay address.',
      gaps: ['PR3', 'PR1', 'D3'], see: [[2, 1], [3, 0]]
    },
    P4: {
      n: 4, short: 'Sync All', name: 'Sync All Conversations where the helpdesk charges per seat',
      today: 'With the default, Routed Only, chats Siena handles without a handoff never reach the helpdesk, so merchants can’t see chat volume or Siena’s CSAT next to the rest of their support.',
      change: 'All Conversations becomes the default for helpdesks that charge per seat, like Zendesk. Helpdesks that charge per ticket keep Routed Only.',
      gaps: ['D15'], see: [[4, 1]]
    },
    P5: {
      n: 5, short: 'Resolution tag', name: 'Small tags adjustment',
      today: 'Tags only mark routed chats, and nothing says whether Siena resolved a chat alone or a person stepped in.',
      change: 'One more tag when a conversation is resolved: siena-resolved-by-ai when Siena handled it alone, siena-resolved-with-agent when a person stepped in. Today’s handoff tags stay as they are.',
      gaps: ['D15', 'D7'], see: [[3, 2], [4, 2]]
    }
  };
  CS.ITEM_ORDER = ['P1', 'P2', 'P3', 'P4', 'P5'];

  /* Roadmap items the vision lines up with (Live Chat roadmap snapshot, Oct 6, and the Oct 14 scope change). */
  CS.ROADMAP = {
    after: {
      name: 'After-hours tag on routed chats', when: 'Next · Q1 2027',
      note: 'Already on the roadmap, with 9 merchant requests: “Separate tag when a chat is routed outside business hours, so helpdesks can queue it as follow-up instead of live chat.”'
    },
    sched: {
      name: 'Scheduled availability (AI-only outside hours)', when: 'Q1 2027',
      note: 'Part of Visibility Rules: outside hours, the merchant picks Keep visible, AI-only or Hide bubble. Moved to Q1 2027 on Oct 14, after the business-hours refactor.'
    }
  };

  /* The vision: not part of the proposal. Each item names the changes it builds on and what it still needs. */
  CS.VISION = {
    V1: {
      short: 'Email follow-up', name: 'Session Controls, reworked: follow up by email',
      what: 'Today Session Controls decides when an idle chat session dies, and the relay address and any late reply die with it. Once the conversation outlives the session and replies arrive by webhook, that timer protects nothing. Reworked, the same setting could decide when Siena follows up on an abandoned chat by email: 30 minutes after a reply the shopper hasn’t seen, or at once outside business hours.',
      builds: ['P1', 'P3', 'P2'],
      needs: 'An email for the shopper (logged in, or given in chat) and Product’s answer to the brief’s second question: what was the 1-hour default protecting?',
      see: [[3, 1, 'away'], [6, 0]], gaps: ['PR1']
    },
    V2: {
      short: 'After hours', name: 'After-hours handoffs, queued for the morning',
      what: 'The after-hours tag is already on the roadmap, so this proposal doesn’t add it. The Reply mode field records after-hours handoffs from day one. The vision pairs the tag with an email asked for before the handoff, so the email Siena promises can be sent.',
      builds: ['P2', 'P1'], roadmap: 'after',
      needs: 'Email capture at handoff, which depends on the brief’s fourth question: why aren’t sessions being merged by email today?',
      see: [[5, 1]], gaps: ['D3', 'D12']
    },
    V3: {
      short: 'Team away', name: 'Siena answers on its own while the team is away',
      what: 'With every conversation in the helpdesk and an outcome on every ticket, Siena could manage a conversation when no agent is around: answer what it safely can, record it on the same ticket, and leave the rest for the morning. It sits next to scheduled availability’s AI-only option.',
      builds: ['P4', 'P2', 'P1'], roadmap: 'sched',
      needs: 'Rules for what Siena may answer after a handoff, agreed with merchants.',
      see: [[5, 2]], gaps: []
    },
    V4: {
      short: 'Tags restored', name: 'Tags that survive macros',
      what: 'The Siena fields already survive a “Set tags” macro, because text fields aren’t stored as tags. With the same webhook subscribed to tag changes, Siena could put its own tags back as well.',
      builds: ['P2', 'P3', 'P5'],
      needs: 'Merchant agreement that Siena may re-add tags their macros remove.',
      see: [[6, 1]], gaps: ['D16', 'PR22']
    },
    V5: {
      short: 'Ratings', name: 'One rating per conversation',
      what: 'Today routed chats are never surveyed, and a 24-hour cool-down skips returning shoppers. With one conversation ID, Siena could ask once per conversation, after the reply has been delivered, and write the rating to the Siena rating field.',
      builds: ['P1', 'P2'],
      needs: 'A decision on surveying routed chats, since it changes how CSAT is counted.',
      see: [[3, 3, 'return']], gaps: ['D26']
    }
  };
  CS.VISION_ORDER = ['V1', 'V2', 'V3', 'V4', 'V5'];

  CS.GAPS = {
    D1:   { short: 'Sessions split', name: 'Sessions split, so counts change meaning', where: [[1, 3], [2, 0], [3, 0]] },
    D2:   { short: 'No shared ID', name: 'No shared ID between Siena and the helpdesk', where: [[1, 2], [3, 1]] },
    D3:   { short: 'Relay as requester', name: 'The relay address is the requester', where: [[1, 2], [3, 1]] },
    D7:   { short: 'Quiet counts as resolved', name: 'Abandonment counts as resolution', where: [[4, 2]] },
    D12:  { short: 'No reply mode', name: 'The reply mode isn’t recorded', where: [[1, 2], [5, 1]] },
    D15:  { short: 'Only routed chats synced', name: 'Only routed chats are synced and tagged', where: [[4, 1], [4, 2]] },
    D16:  { short: 'Tags get wiped', name: 'Tags get wiped', where: [[6, 1]] },
    D26:  { short: 'Cool-down skips repeats', name: 'The 24-hour cool-down skips repeat contacts', where: [[3, 2], [3, 3]] },
    PR1:  { short: 'Late replies dropped', name: 'Late replies are dropped', where: [[2, 1], [3, 0]] },
    PR3:  { short: 'Email relay only', name: 'Replies return by email relay only', where: [[2, 1]] },
    PR21: { short: 'No outcome field', name: 'No outcome field', where: [[1, 2], [3, 2], [4, 2]] },
    PR22: { short: 'Fragile tags', name: 'Tags are limited and fragile', where: [[6, 1]] }
  };

  /* From the brief: limits of the proposal and the questions for Product. */
  CS.LIMITS = [
    'Sessions can already be merged when the shopper gives an email. The conversation ID lives in the browser, so a shopper who changes device or browser, or clears cookies, still starts a new conversation unless they’re logged in.',
    'Not every helpdesk charges per seat. Where it charges per ticket or per resolution, syncing every conversation would cost the merchant money, so Routed Only stays the default there.',
    'Not every helpdesk supports chat as a channel, so the webhook reply path needs testing with each one.'
  ];
  CS.QUESTIONS = [
    'How much work would it be to replace the relay-address mechanism Siena uses today?',
    'What was the 1-hour session default protecting, and would a 72-hour return window break it?',
    'Resolution counts may drop once shoppers stop creating duplicate sessions. Are we ready for that?',
    'Sessions don’t seem to be merged by email today. Is that shoppers not wanting to give an email, email collection being off by default, or a technical issue?',
    'What context have I missed?'
  ];

  CS.PRODUCTS = {
    oil: {
      path: '/products/rosehip-renewal-oil', name: 'Rosehip Renewal Oil', size: '30 ml',
      price: '$38', sub: 'or $32.30 with your Calm Skin Box', blurb: 'Cold-pressed rosehip and sea buckthorn for dry, tired skin.',
      art: 'bottle', tint: '#e9d9c8'
    },
    box: {
      path: '/products/calm-skin-box', name: 'Calm Skin Box', size: 'Monthly subscription',
      price: '$54 / month', sub: 'Skip, swap or pause any time', blurb: 'Four botanical essentials, refilled every month.',
      art: 'box', tint: '#dfe6da'
    },
    balm: {
      path: '/products/calm-balm', name: 'Calm Balm', size: '50 g',
      price: '$26', sub: 'Fragrance-free · for very dry skin', blurb: 'Oat, calendula and shea for skin that needs quiet.',
      art: 'jar', tint: '#e6e1ef'
    }
  };

  /* Tickets already in Theo's Zendesk before the story starts (email channel). */
  CS.PREEXISTING = [
    {
      id: 1039, subject: 'Change the delivery address for my subscription', status: 'Open', via: 'Email', created: 'Mon 4:12 pm',
      requester: { name: 'Hannah Webb', email: 'hannah.webb@example.com', kind: 'customer', initials: 'HW' },
      group: 'Support', tags: ['subscription'],
      comments: [{ id: 'p1', role: 'enduser', author: 'Hannah Webb', time: 'Mon 4:12 pm', text: 'Hi, I’m moving next week. Can my November box go to my new address?' }]
    },
    {
      id: 1040, subject: 'Wholesale enquiry from Lark & Linen', status: 'Pending', via: 'Email', created: 'Mon 5:30 pm',
      requester: { name: 'Orla Byrne', email: 'orla@example.com', kind: 'customer', initials: 'OB' },
      group: 'Support', tags: ['wholesale'],
      comments: [{ id: 'p2', role: 'enduser', author: 'Orla Byrne', time: 'Mon 5:30 pm', text: 'We run two shops in Galway and would love to stock your balms. Do you have a wholesale price list?' }]
    },
    {
      id: 1041, subject: 'Where is order #MM-4790?', status: 'Solved', via: 'Email', created: 'Mon 6:02 pm',
      requester: { name: 'Noah Kim', email: 'noah.kim@example.com', kind: 'customer', initials: 'NK' },
      group: 'Support', tags: ['shipping'],
      comments: [{ id: 'p3', role: 'enduser', author: 'Noah Kim', time: 'Mon 6:02 pm', text: 'My tracking hasn’t moved in four days.' }]
    }
  ];

  /* Evidence from the case-study pack, used on the overview. */
  CS.EVIDENCE = [
    { big: '10', text: 'tickets about Session Controls since Sep 29, from merchants holding $1.66M of Live Chat ARR' },
    { big: '55', text: 'Two-Way accounts ($5.42M ARR) moved to 1-hour sessions on Sep 29, without individual notice (changelog v43.4.0)' },
    { big: '2', text: 'replies that never arrived: Oakhurst’s “ghosted” customer (LC-48143) and Verdant’s agents (LC-48121)' },
    { big: '3', text: 'merchants whose returning shoppers start over: second tickets at Northpaw (LC-48116) and Halden & Rowe (LC-48132), repeated questions at Arden (LC-48153)' }
  ];
})(window.CS);
