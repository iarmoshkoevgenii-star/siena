# Conversation Sync: Siena Live Chat prototype (Scenario C)

A clickable prototype of the brief for Noor, **Siena Support Architecture Fine-Tuning**: five changes that keep a Live Chat conversation and its helpdesk ticket in step. It follows one day at Moss & Marrow, a small skincare brand on Zendesk, and lets you flip every step between how Live Chat works **today** and the **proposal**.

The last two chapters, and the steps marked **Vision**, show where the proposal leads. They are **not part of the proposal**: each one names the changes it builds on and what it still needs.

Static HTML, CSS and JavaScript in one flat folder: no build step, no backend, no external requests.

> **Confidential.** This prototype uses merchant names and ticket references from the case-study pack. Keep the repository private, share the link only with the hiring team, and take everything down when the hiring process ends (see [Take it down](#take-it-down)).

---

## The proposal: five changes

| # | Change | What it does | See it |
|---|---|---|---|
| 1 | **Persistent session ID** | One conversation ID that outlives the chat session, kept in the shopper’s browser and passed to the helpdesk in the *Siena conversation* field. A shopper who comes back within the return window lands on the same conversation and ticket. | Ch 1, Ch 3 |
| 2 | **Structured fields on every synced ticket** | Siena source, Siena conversation, Siena outcome, Routing reason, Reply mode, Reply delivery, Chat sessions and Siena rating, all plain text fields set through the API. | Ch 1, Ch 4 |
| 3 | **A webhook reply path** | Replies come back through a Zendesk webhook instead of a relay address, and the widget tells Siena when the shopper goes offline. Siena delivers the reply in chat, or holds it until the shopper is back and says so on the ticket. | Ch 2, Ch 3 |
| 4 | **Sync All Conversations where the helpdesk charges per seat** | All Conversations becomes the default for per-seat helpdesks like Zendesk. Per-ticket helpdesks keep Routed Only. | Ch 4 |
| 5 | **Small tags adjustment** | One tag when a conversation is resolved: `siena-resolved-by-ai` or `siena-resolved-with-agent`. Today’s handoff tags stay. | Ch 3, Ch 4 |

None of the five adds a screen merchants have to learn. Rating rules, Session Controls, email capture and after-hours handling are unchanged by the proposal.

**Limits (from the brief).** Sessions can already be merged when the shopper gives an email; the conversation ID lives in the browser, so a new device, browser or cleared cookies still start a new conversation unless the shopper is logged in. Sync All stays off by default where the helpdesk charges per ticket or per resolution. The webhook reply path needs testing with each helpdesk, since not every helpdesk has a chat channel.

## The vision: where this leads (not part of the proposal)

| Idea | Builds on | Already on the roadmap | See it |
|---|---|---|---|
| **Session Controls, reworked: follow up by email.** Today Session Controls decides when an idle session dies, and a late reply dies with it. Once the conversation outlives the session, the same setting can decide when Siena follows up on an abandoned chat by email: 30 minutes after a reply the shopper hasn’t seen, or at once outside business hours. | 1, 3, 2 | | Ch 3 (path where Ana doesn’t come back): at 11:50 Siena emails Theo’s reply to ana.ruiz@example.com and records it. Ch 6: Mia. |
| **After-hours handoffs, queued for the morning.** Email asked for before an after-hours handoff, and the after-hours tag to queue the ticket. The proposal’s Reply mode field already records after-hours handoffs. | 2, 1 | **After-hours tag on routed chats** (Next · Q1 2027, 9 requests), so the proposal doesn’t add it | Ch 5 |
| **Siena answers on its own while the team is away.** After an after-hours handoff, Siena answers what it safely can and adds it to the same ticket. The medical question still waits for a person. | 4, 2, 1 | Sits next to **scheduled availability**’s AI-only option (Q1 2027) | Ch 5 |
| **Tags that survive macros.** The Siena fields already survive “Set tags”; with the same webhook subscribed to `ticket.tags_changed`, Siena could put its own tags back. | 2, 3, 5 | | Ch 6 |
| **One rating per conversation**, after the reply is delivered, routed chats included. | 1, 2 | | Ch 3 (path where Ana comes back) |

Before any of it: Product’s answers to the brief’s questions, especially what the 1-hour session default protects (question 2) and why sessions aren’t merged by email today (question 4).

---

## The story

| Chapter | | What happens |
|---|---|---|
| 1. The handoff | Proposal | Ana, a logged-in subscriber, asks for a replacement. Siena hands off to Zendesk. |
| 2. A late reply | Proposal | Ana leaves. The 1-hour session expires, then Theo replies. |
| 3. Ana comes back, or doesn’t | Proposal, then one vision step | Same conversation and ticket when she returns, and the resolution tag. Vision step: a rating, or Siena’s email follow-up if she never returns. |
| 4. Every chat in Zendesk | Proposal | A visitor’s question reaches Zendesk, then closes as “Resolved – assumed” with `siena-resolved-by-ai`. Ends with the proposal recap. |
| 5. After hours | **Vision** | Mia asks a question at 11 pm. |
| 6. Next morning | **Vision** | Theo answers Mia and closes Ana’s ticket with a macro. Ends with a recap of the day three ways: today, the proposal, the vision. |

In vision steps the mode switch reads **Today · Vision** and the page turns teal. The proposal’s chapters never include vision effects: what you see in chapters 1 to 4 is only what the brief proposes.

### A five-minute path

1. **Overview → Start the demo.** Use **→** to move through chapters 1 and 2.
2. At chapter 2, step 2, open the **Inspector** (**I**) to see the `ticket.comment_added` webhook and the fields Siena writes back.
3. At any step, press **T** or click **Show today** to compare.
4. At the end of chapter 4, read the recap, then continue into the vision.
5. Open **Siena setup** to see what the proposal sets up in Zendesk and, kept apart, the vision’s settings.

Keyboard: **← →** move · **T** switch · **I** Inspector · **Esc** close.

---

## Gaps and where to see them

| Gap | Closed by | Where |
|---|---|---|
| **D1** Sessions split, so counts change meaning | Proposal 1 | Ch 1–3 |
| **D2** No shared ID between Siena and the helpdesk | Proposal 1, 2 | Ch 1, Ch 3 |
| **D3** The relay address is the requester | Proposal 3 | Ch 1, Ch 3 |
| **D7** Abandonment counts as resolution | Proposal 2, 5 | Ch 4 |
| **D12** The reply mode isn’t recorded | Proposal 2 | Ch 1 |
| **D15** Only routed chats are synced and tagged | Proposal 4, 5 | Ch 4 |
| **PR1** Late replies are dropped | Proposal 3 (held and recorded); vision (emailed) | Ch 2, Ch 3 |
| **PR3** Replies return by email relay only | Proposal 3 | Ch 2 |
| **PR21** No outcome field | Proposal 2 | Ch 1, Ch 3, Ch 4 |
| **D16** Tags get wiped | Proposal 2 (fields survive); vision (tags restored) | Ch 6 |
| **PR22** Tags are limited and fragile | Vision | Ch 6 |
| **D26** The 24-hour cool-down skips repeat contacts | Vision | Ch 3 |

---

## Deploy on Vercel

Every file sits at the top of this folder, so the folder’s **contents** are the site.

1. **GitHub:** create a **private** repository, choose **uploading an existing file**, open this folder, select all its files and drag them in. `index.html` and `vercel.json` must be at the top of the repository, not inside a folder.
2. **Vercel:** **Add New → Project**, import the repository (give Vercel access to this repository only).
3. Give the project a hard-to-guess name in **lowercase letters, digits and hyphens only** (Vercel rejects capitals and spaces), for example `conversation-sync-c-q7m2`.
4. **Framework Preset: Other.** Leave the build command and output directory empty: there is nothing to build.
5. Deploy, and share the address under the project’s **Domains** (`https://<project>.vercel.app`) with the hiring team only. Per-deployment addresses ask visitors to log in, because Deployment Protection is on by default.

From the command line instead: `cd` into this folder and run `npx vercel --prod`.

**If you see 404 NOT_FOUND:** Vercel isn’t serving the folder that holds `index.html`. Either move the files to the top of the repository, or set **Settings → Build and Deployment → Root Directory** to the folder that contains them, then redeploy.

### What keeps it out of search and other people’s hands

- `noindex` in a `<meta name="robots">` tag, an `X-Robots-Tag` header (`vercel.json`) and `robots.txt`.
- `Referrer-Policy: no-referrer`, so the link isn’t passed on to other sites.
- No analytics, fonts or scripts from other servers. Settings and anything you type stay in your own browser’s local storage.

### Take it down

When the hiring process ends, delete the Vercel project (**Project → Settings → Delete Project**) and the GitHub repository (**Settings → Danger Zone → Delete this repository**).

---

## Files

```
index.html     page shell
styles.css     all styles (orange: today · purple: proposal · teal: vision)
data.js        people, the eight fields, tags, the five proposal changes, the vision, roadmap items, gaps, evidence
story.js       the story engine and script: a Today and a Proposed or Vision behaviour for every step
views.js       rendering: overview, demo, Zendesk, inspector, recaps, setup
app.js         state, navigation, keyboard, settings
vercel.json    Vercel headers (noindex, no referrer)
robots.txt     no crawling
README.md      this file
```

**How the demo works.** Every position is rebuilt from scratch: the engine replays steps 1 to *n* for the chosen mode, path and settings. Vision steps inside the proposal chapters are left out of that replay unless you are on a vision step, so the proposal’s chapters never show vision effects.

**Stable layout.** On a given screen the story bar is always as tall as its longest step, and the phone’s size comes from the screen height (9:16, 280–380 px wide), never from what it shows, so nothing moves or resizes between steps. Checked from 1280×720 to 2560×1300, with tablet and phone layouts; resizing the window recalculates both.

## Assumptions and simplifications

- **Moss & Marrow is a merchant from the pack** (Starter, Zendesk, Two-Way, Shopify one-click). Its founder’s tickets set the scene: nobody watches chat. Everything else is invented: Theo’s replies, the shoppers, the opening hours (Mon–Fri, 8 am–12 pm), products, orders, IDs and email addresses (example.com).
- **Today’s behaviour follows the pack:** 1-hour Two-Way sessions since Session Controls (v43.4.0), relay-address requesters, routed-only sync and tags, the rating rules, the One-Way fallback outside hours and the repeated outside-hours message (LC-1182). Email capture is assumed off.
- **Roadmap references come from the Oct 6 roadmap snapshot and the Oct 14 scope change:** the after-hours tag (Next · Q1 2027) and scheduled availability (moved to Q1 2027).
- **Numbers to agree with Product:** the 72-hour return window, the 30-minute follow-up in the vision, field names and outcome values.
- **Zendesk behaviour follows Zendesk’s documentation:** ticket event webhooks, `external_id`, text fields in views and triggers. Payloads are trimmed for reading, and all IDs are made up.
- **Not modelled:** other helpdesks, Zendesk messaging, more than one agent, and replies to a follow-up email.

Prototype with simulated data. Not a Siena product, and not affiliated with Zendesk.
