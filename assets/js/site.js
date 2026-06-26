/* ============================================================
   CRO AI Activation Community — site controller
   Hash-routed multi-page site over the living particle engine.
   The WebGL field persists across pages and morphs per route.
   ============================================================ */

import { FloatScene } from "./shapes.js";
const gsap = window.gsap;

const scene3d = new FloatScene(document.getElementById("bg-canvas"));
scene3d.start();

/* external destinations */
const TEAMS_URL = "https://teams.microsoft.com/l/channel/19%3Akap0KTNXN6GFcbodSq66xZJp26H4PpruupT7ITAfEgI1%40thread.tacv2/CRO%20AI%20Community%20Channel?groupId=388cd47c-fb14-4cc8-b031-148a6bbe5a78&tenantId=72adb271-2fc7-4afe-a5ee-9de6a59f6bfb";
const PORTFOLIO_URL = "https://rizqureshy.github.io/AI-April-Portfolio/";
const RAW = "https://raw.githubusercontent.com/rizqureshy/AI-April-Portfolio/main/";
const rawUrl = (path) => RAW + encodeURI(path);

/* ---------------- tiny view helpers ---------------- */
const PATHS = {
  star: "M12 2l2.6 7.4H22l-6 4.4 2.3 7.2L12 16.6 5.7 21l2.3-7.2-6-4.4h7.4z",
  users: "M16 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm-8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm0 2c-2.7 0-8 1.3-8 4v3h9v-3c0-1 .4-1.9 1-2.6A12 12 0 0 0 8 13zm8 0c-.4 0-.9 0-1.4.1A5 5 0 0 1 17 17v3h7v-3c0-2.7-5.3-4-8-4z",
  share: "M18 16a3 3 0 0 0-2.4 1.2l-7-3.5a3 3 0 0 0 0-1.4l7-3.5a3 3 0 1 0-.8-2L8 10.3a3 3 0 1 0 0 3.4l7 3.5A3 3 0 1 0 18 16z",
  grid: "M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z",
  book: "M5 3h10a2 2 0 0 1 2 2v16l-7-3-7 3V5a2 2 0 0 1 2-2z",
  chat: "M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H8l-4 4V5a1 1 0 0 1 1-1z",
  shield: "M12 2l8 3v6c0 5-3.4 8.5-8 11-4.6-2.5-8-6-8-11V5l8-3zm-1.2 13.4l5-5-1.4-1.4-3.6 3.6-1.6-1.6-1.4 1.4 3 3z",
  bolt: "M13 2L3 14h7l-1 8 10-12h-7z",
  key: "M14 2a6 6 0 0 0-5.7 8L2 16.3V22h5.7l.6-.6V19h2.4l.6-.6V16h2l.4-.4A6 6 0 1 0 14 2zm2.5 3.5a1.5 1.5 0 1 1-1.5 1.5 1.5 1.5 0 0 1 1.5-1.5z",
  bell: "M12 2a6 6 0 0 0-6 6v4l-2 3v1h16v-1l-2-3V8a6 6 0 0 0-6-6zm0 20a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 22z",
  calendar: "M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zM5 9h14v10H5V9z",
  bulb: "M9 21h6v-1H9v1zm3-19a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z",
  trophy: "M7 4h10v2h3v3a4 4 0 0 1-4 4 5 5 0 0 1-2 2.6V18h3v2H7v-2h3v-2.4A5 5 0 0 1 8 13a4 4 0 0 1-4-4V6h3V4zm0 4H6v1a2 2 0 0 0 1 1.7V8zm10 0v2.7A2 2 0 0 0 18 9V8h-1z",
  heart: "M12 21S4 14 4 8.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 8 2.5C20 14 12 21 12 21z",
  check: "M9 16.2l-3.5-3.5L4 14.2 9 19.2 20 8.2l-1.5-1.4z",
  spark: "M12 2l2.6 7.4H22l-6 4.4 2.3 7.2L12 16.6 5.7 21l2.3-7.2-6-4.4h7.4z",
  play: "M8 5v14l11-7z",
  rocket: "M14 3c3 .3 5.4 2.7 5.7 5.7.2 2.4-1.4 5-4.7 7.3l-.6 4-3-1.8-3-1.8 2.2-3.4C8.6 7.8 11.2 6.2 13.6 6.4M6 16c-1.2 1-1.5 3-1.5 4.5C6 20.5 8 20.2 9 19",
};
const ic = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${PATHS[n] || PATHS.spark}"/></svg>`;

const PAL = [
  { ic: "linear-gradient(135deg,#2b88ff,#6b5bff)", ac: "#2b88ff" },
  { ic: "linear-gradient(135deg,#ff8a3d,#e3008c)", ac: "#ff8a3d" },
  { ic: "linear-gradient(135deg,#18c8b6,#2b88ff)", ac: "#18c8b6" },
  { ic: "linear-gradient(135deg,#9b4dff,#6b5bff)", ac: "#9b4dff" },
  { ic: "linear-gradient(135deg,#22c55e,#18c8b6)", ac: "#22c55e" },
  { ic: "linear-gradient(135deg,#ffd23d,#ff8a3d)", ac: "#ffd23d" },
];

function iconCards(items, cols = 3) {
  return `<div class="grid c${cols}">` + items.map((it, i) => {
    const c = PAL[i % PAL.length];
    return `<article class="card reveal"><div class="ic" style="--ic:${c.ic};--ac:${c.ac}">${ic(it.icon || "spark")}</div>` +
      `<h3>${it.t}</h3>${it.p ? `<p>${it.p}</p>` : ""}` +
      `${it.link ? `<a class="link" href="${it.link}">${it.linkText || "Open"} →</a>` : ""}</article>`;
  }).join("") + `</div>`;
}
function numCards(items, cols = 3) {
  return `<div class="grid c${cols}">` + items.map((it, i) => {
    const c = PAL[i % PAL.length];
    const t = typeof it === "string" ? it : it.t;
    const p = typeof it === "string" ? "" : (it.p || "");
    return `<article class="card reveal"><div class="num" style="--ic:${c.ic}">${i + 1}</div><h3>${t}</h3>${p ? `<p>${p}</p>` : ""}</article>`;
  }).join("") + `</div>`;
}
const olist = (items) => `<ol class="olist reveal">` + items.map((t) => `<li>${t}</li>`).join("") + `</ol>`;
const bullets = (items) => `<ul class="bullets reveal">` + items.map((t) => `<li>${t}</li>`).join("") + `</ul>`;
const pills = (items) => `<div class="pills reveal">` + items.map((t) => `<span class="pill">${t}</span>`).join("") + `</div>`;

function ctas(arr) {
  return `<div class="cta-row reveal">` + arr.map((c) => {
    const inner = `${c.svg ? ic(c.svg) : ""}${c.t}`;
    if (c.toast) return `<button class="btn ${c.k || "ghost"}" data-toast="${c.toast}">${inner}</button>`;
    const ext = c.h && /^https?:/.test(c.h) ? ` target="_blank" rel="noopener"` : "";
    return `<a class="btn ${c.k || "ghost"}" href="${c.h || "#/home"}"${ext}>${inner}</a>`;
  }).join("") + `</div>`;
}

function block({ kicker, title, lead, inner = "", panel, warm }) {
  return `<section class="block">` +
    (panel ? `<div class="panel${warm ? " warm" : ""}">` : "") +
    (kicker ? `<span class="kicker reveal"><span class="dot"></span> ${kicker}</span>` : "") +
    (title ? `<h2 class="reveal">${title}</h2>` : "") +
    (lead ? `<p class="lead reveal">${lead}</p>` : "") +
    inner +
    (panel ? `</div>` : "") +
    `</section>`;
}

function hero({ eyebrow, h1, sub, emotional, cta }) {
  return `<section class="hero">
    ${eyebrow ? `<span class="eyebrow reveal">${eyebrow}</span>` : ""}
    <h1 class="reveal">${h1}</h1>
    ${sub ? `<p class="sub reveal">${sub}</p>` : ""}
    ${emotional ? `<div class="emotional reveal">${emotional.map((l) => `<span>${l}</span>`).join("")}</div>` : ""}
    ${cta ? ctas(cta) : ""}
  </section>`;
}

/* form builder (presentational demo — submits show a toast) */
function field(f) {
  const id = (f.name || f.l).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  if (f.t === "checkbox") return `<label class="check"><input type="checkbox" id="${id}"> <span>${f.l}</span></label>`;
  let ctrl;
  if (f.t === "select") ctrl = `<select id="${id}"><option value="" disabled selected>Choose…</option>${(f.opts || []).map((o) => `<option>${o}</option>`).join("")}</select>`;
  else if (f.t === "textarea") ctrl = `<textarea id="${id}" placeholder="${f.ph || ""}"></textarea>`;
  else if (f.t === "file") ctrl = `<input id="${id}" type="file">`;
  else ctrl = `<input id="${id}" type="${f.t || "text"}" placeholder="${f.ph || ""}">`;
  return `<div class="field"><label for="${id}">${f.l}</label>${ctrl}</div>`;
}
const formHTML = (fields, submit) =>
  `<form class="form reveal" data-demo>${fields.map(field).join("")}<div class="cta-row"><button class="btn primary" type="submit">${ic("spark")}${submit}</button></div></form>`;

/* ============================================================
   Navigation
   ============================================================ */
const PRIMARY = [
  ["Home", "#/home"], ["Join the Community", "#/join"], ["Share Your Work", "#/share"],
  ["Submission Gallery", "#/gallery"], ["Learning Lane", "#/learning"], ["Expert Clinic", "#/clinic"],
  ["Certification Support", "#/certification"], ["AI Activation for Teams", "#/teams"],
  ["License & Access Help", "#/access"], ["Leaders Listening Post", "#/listening"],
];
const UTILITY = [
  ["Weekly Challenges", "#/challenges"], ["Leaderboard", "#/recognition"], ["Community Calendar", "#/calendar"],
  ["Recognition Wall", "#/recognition"], ["Teams Channel", TEAMS_URL], ["Submit an Idea", "#/listening"],
  ["Ask a Question", "#/clinic"],
];

function buildNav() {
  document.getElementById("primary-nav").innerHTML =
    PRIMARY.map(([t, h]) => `<a href="${h}">${t}</a>`).join("");
  document.getElementById("utility-bar").innerHTML =
    `<span class="ulabel">Quick links</span>` + UTILITY.map(([t, h]) => {
      const ext = /^https?:/.test(h) ? ` target="_blank" rel="noopener"` : "";
      return `<a href="${h}"${ext}>${t}</a>`;
    }).join("");
  document.getElementById("site-footer").innerHTML = `
    <div class="footer-inner">
      <div>
        <h4>CRO AI Activation Community</h4>
        <p class="muted" style="font-size:14px;line-height:1.6;max-width:34ch">Built by the people who participate in it. Come in, share something, learn something, build something.</p>
        <div class="cta-row" style="margin-top:16px"><a class="btn primary sm" href="#/join">${ic("users")}Join the Community</a></div>
      </div>
      <div>
        <h4>Participate</h4>
        <a href="#/share">Share Your Work</a><a href="#/gallery">Submission Gallery</a>
        <a href="#/story">Share Your Story</a><a href="#/challenges">Weekly Challenges</a>
        <a href="#/recognition">Leaderboard &amp; Recognition</a>
      </div>
      <div>
        <h4>Get support</h4>
        <a href="#/learning">Learning Lane</a><a href="#/clinic">Expert Clinic</a>
        <a href="#/certification">Certification Support</a><a href="#/teams">AI Activation for Teams</a>
        <a href="#/access">License &amp; Access Help</a><a href="#/listening">Leaders Listening Post</a>
      </div>
    </div>
    <div class="footer-bottom">Your Story Matters · Your Questions Matter · Your Work Matters · You Matter</div>`;
}

/* ============================================================
   Pages
   ============================================================ */
const ROUTES = {};

/* ---- Home ---- */
ROUTES.home = {
  title: "Home", formation: "orb",
  html: () => hero({
    eyebrow: "✦ The front door to the CRO AI Activation Community",
    h1: `The Community <span class="gradient-text">Wants You</span>`,
    sub: "Join the CRO AI Activation Community to learn, share, showcase, ask questions, experiment with AI, and have some fun while building real capability across the business.",
    emotional: ["Your Story Matters.", "Your Questions Matter.", "Your Work Matters.", "You Matter."],
    cta: [
      { t: "Join the Community", k: "primary", h: "#/join", svg: "users" },
      { t: "Share Your First Story", k: "cool", h: "#/story", svg: "share" },
      { t: "Explore What Others Are Building", k: "ghost", h: "#/gallery", svg: "grid" },
    ],
  })

  + block({
    kicker: "Welcome to the Community", panel: true,
    title: `A place for <span class="gradient-cool">practical AI</span>, real examples, and real people`,
    lead: "Welcome to the CRO AI Activation Community — a space for everyone across CRO to come together around AI learning, practical use cases, team activation, certifications, experiments, and success stories.",
    inner: `<p class="lead reveal" style="margin-top:14px">Whether you are just starting, trying to use Copilot more effectively, completing a certification, building a workflow, experimenting with ACE, or helping your team activate AI — this community is for you.</p>
      <p class="micro reveal">You do not need to be an expert to participate. You just need curiosity, willingness to learn, and something to share.</p>`,
  })

  + block({
    kicker: "Join Us", title: "Joining is open, simple, and friction-free",
    lead: "The community is open to everyone across CRO. Join the main community space, introduce yourself, ask your first question, and start exploring what others are learning and building.",
    inner: ctas([
      { t: "Join the Teams Community", k: "primary", h: TEAMS_URL, svg: "users" },
      { t: "Download the Onboarding Pack", h: "#/start", svg: "book" },
      { t: "Introduce Yourself", h: "#/story", svg: "share" },
      { t: "Ask Your First Question", h: "#/clinic", svg: "chat" },
    ]) + `<p class="micro reveal">No perfect prompt required. No expert badge needed. Just come in.</p>`,
  })

  + block({
    kicker: "Start Here", title: "Community Onboarding Pack",
    lead: "Everything a new member needs to get going — a simple starting path from first click to first contribution.",
    inner: numCards([
      "What this community is for", "How to join the Teams / Slack channels", "Where to ask questions",
      "How to share a use case", "How to submit work to the gallery", "How to join weekly activities",
      "How recognition and points work", "Where to get license and access help",
      "Where to find certification guidance", "How to request AI Activation for your team",
    ]) + ctas([{ t: "Open the Onboarding Pack", k: "cool", h: "#/start", svg: "book" }]),
  })

  + block({
    kicker: "Welcome Chat", panel: true, warm: true,
    title: "Start With Your Story",
    lead: "Introduce yourself to the community by sharing one short story. Sharing is key — the community grows when people show what they tried, what worked, what failed, and what they learned.",
    inner: bullets([
      "What are you curious about with AI?", "What have you tried so far?",
      "What is one workflow you wish AI could help with?", "What is one thing you want to learn?",
      "What certification or skill are you working toward?", "What is one practical AI win you have seen?",
    ]) + ctas([{ t: "Share Your Story", k: "primary", h: "#/story", svg: "share" }]),
  })

  + block({
    kicker: "Share a Submission", title: "Share what you are building, learning, or trying",
    lead: "Active participation is the whole point. Sharing is a normal, celebrated behavior here.",
    inner: pills(["AI use case", "Prompt that worked", "Copilot workflow", "ACE success story", "Certification experience", "Team activation story", "Customer prep example", "Productivity hack", "Learning reflection", "Question for the community", "Challenge entry", "Demo or short video"])
      + ctas([{ t: "Submit Your Work", k: "cool", h: "#/share", svg: "share" }]),
  })

  + block({
    kicker: "What's Happening This Week", title: "Weekly challenges &amp; activities",
    lead: "A light, recurring rhythm that makes participation fun and easy to join any week.",
    inner: iconCards([
      { t: "Prompt of the Week", p: "Share the single prompt that saved you the most time this week.", icon: "bolt" },
      { t: "Use-Case Sprint", p: "Turn one real task into an AI workflow and post what happened.", icon: "grid" },
      { t: "Demo Friday", p: "Record a 60-second demo of something you tried — rough is welcome.", icon: "play" },
    ]) + ctas([{ t: "See Weekly Challenges", h: "#/challenges", svg: "trophy" }, { t: "View the Calendar", h: "#/calendar", svg: "calendar" }]),
  })

  + block({
    kicker: "Leadership Messages", title: "A warm welcome from our leaders",
    lead: "This community matters to leadership — and they show up here. Fun, warmth, and a place where every question and every role counts.",
    inner: leaderCards() + ctas([{ t: "Join the Community", k: "primary", h: "#/join", svg: "users" }]),
  })

  + block({
    kicker: "Leadership Shoutouts", panel: true,
    title: "Recognition loops that celebrate participation",
    lead: "The best stories, prompts, questions, and experiments get highlighted — by leaders, every week.",
    inner: pills(["Best community story", "Most practical use case", "Best prompt shared", "Best team activation story", "Certification achievers", "Most helpful contributor", "Best question asked", "Best learning reflection", "Strongest experiment", "Most creative use of AI"])
      + ctas([{ t: "Nominate Someone for a Shoutout", k: "cool", h: "#/recognition", svg: "trophy" }]),
  })

  + block({
    kicker: "Submission Gallery", title: "Real work from real people",
    lead: "See what teammates across CRO are building, learning, and trying — then try it yourself.",
    inner: galleryPreview() + ctas([{ t: "Explore the Gallery", k: "primary", h: "#/gallery", svg: "grid" }]),
  })

  + block({
    kicker: "Learning Lane", title: "Guided paths, not a course catalog",
    lead: "Pick a lane and learn in small, practical steps with examples from the community.",
    inner: iconCards([
      { t: "AI Basics for CRO", p: "Start from zero with confidence.", icon: "bulb", link: "#/learning" },
      { t: "Copilot for Daily Productivity", p: "Make Copilot part of your day.", icon: "bolt", link: "#/learning" },
      { t: "ACE for GTM & Customer Prep", p: "Governed knowledge for sellers.", icon: "shield", link: "#/learning" },
    ]) + ctas([{ t: "Choose a Learning Lane", k: "cool", h: "#/learning", svg: "book" }]),
  })

  + block({
    kicker: "Expert Clinic", title: "Bring your questions — get practical help",
    lead: "A recurring support space to improve prompts, workflows, use cases, certifications, and team activation.",
    inner: pills(["Prompt Clinic", "Copilot Clinic", "ACE Clinic", "Certification Clinic", "Use Case Clinic", "Team Activation Clinic", "Responsible AI Clinic", "Demo Review Clinic"])
      + ctas([{ t: "Book a Clinic Slot", k: "primary", h: "#/clinic", svg: "chat" }, { t: "Drop a Question", h: "#/clinic" }]),
  })

  + block({
    kicker: "Certification Support", title: "A serious pillar of the community",
    lead: "Understand your options, follow a pathway, learn from peers, and get counseling on where to start.",
    inner: iconCards([
      { t: "Certification map", p: "See what is available and what fits your role.", icon: "shield", link: "#/certification" },
      { t: "Pathways by level", p: "Beginner, intermediate, and advanced routes.", icon: "book", link: "#/certification" },
      { t: "Peer mentors & stories", p: "Learn from people who have done it.", icon: "users", link: "#/certification" },
    ]) + ctas([{ t: "Request Certification Guidance", k: "cool", h: "#/certification", svg: "shield" }]),
  })

  + block({
    kicker: "AI Activation for Teams", panel: true, warm: true,
    title: "Want to activate AI for your team?",
    lead: "If your team is ready to move from interest to action, the AI Activation Program helps you identify use cases, design practical learning, run team sessions, support adoption, and build confidence through hands-on practice.",
    inner: ctas([{ t: "Request AI Activation Support", k: "primary", h: "#/teams", svg: "rocket" }]),
  })

  + block({
    kicker: "License & Access Help", title: "Need license or access?",
    lead: "Not sure whether you have access to Copilot, ACE, Claude models in Copilot, Yoodli, or other AI tools? Start here.",
    inner: ctas([{ t: "Get Access Help", k: "cool", h: "#/access", svg: "key" }]),
  })

  + block({
    kicker: "Leaders Listening Post", title: "A real feedback loop to leadership",
    lead: "Share ideas, blockers, questions, and feedback directly into a leadership-visible channel — and read the monthly “What We Heard” update.",
    inner: ctas([{ t: "Submit Feedback to the Listening Post", k: "primary", h: "#/listening", svg: "bell" }]),
  })

  + block({
    kicker: "Leaderboard & Recognition", title: "Participation, made visible",
    lead: "Earn stars for meaningful participation, level up from Explorer to Community Luminary, and get recognized.",
    inner: numCards([
      { t: "Earn stars", p: "Points for joining, asking, sharing, helping, presenting, mentoring, and activating teams." },
      { t: "Level up", p: "Explorer → Contributor → Builder → Guide → Champion → Community Luminary." },
      { t: "Get recognized", p: "Weekly shoutouts, monthly badges, and leader-selected spotlights." },
    ]) + ctas([{ t: "See How to Earn Stars", k: "cool", h: "#/recognition", svg: "star" }]),
  })

  + block({
    kicker: "Community Calendar", title: "The community rhythm",
    lead: "Weekly challenges, expert clinics, office hours, certification sessions, demo days, and showcase events.",
    inner: ctas([{ t: "View Upcoming Events", h: "#/calendar", svg: "calendar" }]),
  })

  + block({
    panel: true, warm: true,
    title: "Come In. Share Something. Learn Something. Build Something.",
    lead: "The CRO AI Activation Community is built by the people who participate in it. Your question may help someone else. Your story may inspire a team. Your experiment may become a new workflow. Your certification journey may guide the next person. This community wants you in it.",
    inner: ctas([
      { t: "Join the Community", k: "primary", h: "#/join", svg: "users" },
      { t: "Share Your Story", k: "cool", h: "#/story", svg: "share" },
      { t: "Submit Your Work", h: "#/share", svg: "grid" },
      { t: "Ask a Question", h: "#/clinic", svg: "chat" },
      { t: "Activate AI for Your Team", h: "#/teams", svg: "rocket" },
    ]),
  }),
};

/* ---- gallery: real work from the AI April sprint (GTM AI Canvas portfolio) ---- */
const SHOTS = [
  { t: "AI Art", author: "Rizwan Qureshy", cat: "AI Art", img: "assets/img/gallery/art-rizwan.jpg" },
  { t: "AI Art", author: "Kelly Grover", cat: "AI Art", img: "assets/img/gallery/art-kelly.jpg" },
  { t: "AI Art", author: "Eamonn Ward", cat: "AI Art", img: "assets/img/gallery/art-eamonn.jpg" },
  { t: "AI Art", author: "Lorna Joiner", cat: "AI Art", img: "assets/img/gallery/art-lorna.jpg" },
  { t: "AI Art", author: "Dalia Osorio", cat: "AI Art", img: "assets/img/gallery/art-dalia.jpg" },
  { t: "AI Art", author: "Calley Hood", cat: "AI Art", img: "assets/img/gallery/art-calley.png" },
  { t: "Veronica's AI Dashboard", author: "Veronica John", cat: "Dashboard", img: "assets/img/gallery/dash-veronica.png" },
  { t: "Partner Enablement Dashboard", author: "Team", cat: "Dashboard", img: "assets/img/gallery/dash-partner.jpg" },
  { t: "AI CRO Strategy Plan", author: "Rizwan Qureshy", cat: "AI Deck", img: "assets/img/gallery/deck-cro-strategy.png" },
  { t: "AI for GTM Enablement Services", author: "Kelly Grover", cat: "AI Deck", img: "assets/img/gallery/deck-gtm-enablement.png" },
  { t: "AI Strategy Deck", author: "Eamonn Ward", cat: "AI Deck", img: "assets/img/gallery/deck-eamonn-strategy.png" },
  { t: "ACE Animation Concept", author: "Team", cat: "Animation", img: "assets/img/gallery/anim-ace.png" },
  { t: "AI Coding", author: "Team", cat: "Course", img: "assets/img/gallery/course-ai-coding.png" },
  { t: "Transform Workflows with Gen AI", author: "Team", cat: "Course", img: "assets/img/gallery/course-transform.png" },
];
const APPS = [
  { t: "Artemis II — Dark Side of the Moon", author: "Rizwan Qureshy", url: "https://artemis-ii-rizqureshy.replit.app/" },
  { t: "AI Essentials Course", author: "Calley Hood", url: "https://aiessentialscourse.netlify.app/" },
  { t: "Order Taker — Partner Simulator", author: "Michael Bourgeois", url: "https://partner-simulator.netlify.app/" },
  { t: "Challenger Sales Coaching", author: "Team", url: "https://id-preview--e21af167-a47d-42ba-a00f-070b0144e10a.lovable.app/" },
  { t: "Team Energy & Focus Dashboard", author: "Calley Hood", url: "https://idbycalley.github.io/Live-Team-Dashboard/" },
  { t: "Build-a-Band: Guitar & Piano", author: "Ashley Mims", url: "https://aprilaibuildaband.netlify.app/" },
  { t: "Pulse Pad Beat Studio", author: "Michael Bourgeois", url: "https://reliable-cassata-1d012c.netlify.app/" },
  { t: "Magic Guitar", author: "Calley Hood", url: "https://strong-daffodil-a46c5c.netlify.app/" },
];
function shotCard(s) {
  return `<article class="card gcard reveal">
    <div class="gthumb"><img loading="lazy" src="${s.img}" alt="${s.t} — ${s.author}"></div>
    <span class="tag">${s.cat}</span>
    <h3>${s.t}</h3>
    <div class="gmeta">${s.author}</div>
    <div class="gactions"><a class="btn cool sm" href="${PORTFOLIO_URL}" target="_blank" rel="noopener">${ic("grid")}Open in 3D Gallery</a></div>
  </article>`;
}
function appCard(a) {
  return `<article class="card gcard reveal">
    <span class="tag">App &amp; Tool</span>
    <h3>${a.t}</h3>
    <div class="gmeta">${a.author}</div>
    <div class="gactions"><a class="btn cool sm" href="${a.url}" target="_blank" rel="noopener">${ic("bolt")}Launch app</a></div>
  </article>`;
}
const galleryPreview = () => `<div class="grid c3">` + SHOTS.slice(0, 3).map(shotCard).join("") + `</div>`;

/* ---- leadership messages ---- */
const LEADERS = [
  {
    name: "Martyn Langley", role: "CRO AI Activation Community Sponsor", img: "assets/img/leaders/martyn.jpg",
    msg: "AI shouldn't feel like a test you're afraid to fail — it should feel like play. Bring your curiosity, your half-finished ideas, and yes, your &ldquo;silly&rdquo; questions. There are none. This is where we experiment out loud, learn from each other, and have real fun building what's next. You belong here, exactly as you are.",
  },
  {
    name: "Shane Paladin", role: "CRO AI Activation Community Sponsor", img: "assets/img/leaders/shane.jpg",
    msg: "The exciting thing about this new world of AI is that everyone gets to be a beginner again — together. Share what you tried, even when it broke. Ask the expert. Help the next person. Every role, every team, every voice makes us stronger. You're not a spectator here; you are what makes this community come alive.",
  },
  {
    name: "Eamonn Ward", role: "CRO AI Activation Community Sponsor", img: "assets/img/leaders/eamonn-ward.jpg",
    msg: "This is your space. Whether you're writing your first prompt or activating your whole team, there's room for you — and your story matters. Don't wait until you feel &ldquo;ready.&rdquo; Jump in, connect, and let's discover what AI can do for our customers and for each other. Warmth over fear, progress over perfection, community over going it alone.",
  },
];
const leaderCards = () => `<div class="grid c3">` + LEADERS.map((l) => `
  <article class="card leader reveal">
    <img class="lphoto" loading="lazy" src="${l.img}" alt="${l.name}">
    <div class="lwho"><h3>${l.name}</h3><span>${l.role}</span></div>
    <p class="lmsg">${l.msg}</p>
  </article>`).join("") + `</div>`;

/* ---- certification map + voices (6 people, 6 certs from the AI Enablement session) ---- */
const CERTS = [
  { img: "assets/img/certs/eduardo-deeplearning.jpg", issuer: "DeepLearning.AI", title: "AI For Everyone", who: "Eduardo", level: "Beginner" },
  { img: "assets/img/certs/microsoft-ai-business.webp", issuer: "Microsoft", title: "AI Business Professional", who: "Elena", level: "Beginner" },
  { img: "assets/img/certs/justin-databricks.png", issuer: "Databricks", title: "AI Agent Fundamentals", who: "Justin", level: "Intermediate" },
  { img: "assets/img/certs/michael-utaustin.webp", issuer: "UT Austin", title: "Generative AI for Business Applications", who: "Michael", level: "Intermediate" },
  { img: "assets/img/certs/shiran-kmi.webp", issuer: "KM Institute", title: "Certified AI Manager", who: "Shiran", level: "Intermediate" },
  { img: "assets/img/certs/rizwan-ieee-aiethics.webp", issuer: "IEEE", title: "CertifAIEd — AI Ethics Professional", who: "Rizwan", level: "Advanced" },
];
const CERTFOLKS = [
  { name: "Eduardo", photo: "assets/img/presenters/eduardo.jpg", cert: "DeepLearning.AI · AI For Everyone", quote: "Start broad. This gave me the language to talk about AI with any team — no code required. If you're wondering where to begin, begin here." },
  { name: "Elena", photo: "assets/img/presenters/elena.jpg", cert: "Microsoft · AI Business Professional", quote: "Practical and role-focused. I prepped in short evening sessions over a few weeks — totally doable alongside the day job." },
  { name: "Justin", photo: "assets/img/presenters/justin.jpg", cert: "Databricks · AI Agent Fundamentals", quote: "I wanted to understand agents beyond the hype. The hands-on labs made it click. Build one small agent and you're hooked." },
  { name: "Michael", photo: "assets/img/presenters/michael.jpg", cert: "UT Austin · Generative AI for Business", quote: "This connected AI to real business decisions. My advice: pick a real problem from your week and learn against that." },
  { name: "Shiran", photo: "assets/img/presenters/shiran.jpg", cert: "KM Institute · Certified AI Manager", quote: "It reframed AI as a management discipline, not just a tool — perfect if you're leading people through change." },
  { name: "Rizwan", photo: "assets/img/presenters/rizwan.png", cert: "IEEE · CertifAIEd AI Ethics", quote: "Ethics turned out to be the most human part of AI. What surprised me was how much it applies to everyday decisions, not just policy." },
];
const certMap = () => `<div class="grid c3">` + CERTS.map((c) => `
  <article class="card certcard reveal">
    <div class="cthumb"><img loading="lazy" src="${c.img}" alt="${c.issuer} — ${c.title}"></div>
    <span class="tag">${c.issuer} · ${c.level}</span>
    <h3>${c.title}</h3>
    <div class="gmeta">Earned by ${c.who}</div>
  </article>`).join("") + `</div>`;
const certVoices = () => `<div class="grid c3">` + CERTFOLKS.map((p) => `
  <article class="card folk reveal">
    <div class="fhead"><img class="favatar" loading="lazy" src="${p.photo}" alt="${p.name}"><div><h3>${p.name}</h3><span>${p.cert}</span></div></div>
    <p class="fquote">&ldquo;${p.quote}&rdquo;</p>
  </article>`).join("") + `</div>`;

/* ---- Join ---- */
ROUTES.join = {
  title: "Join the Community", formation: "burst",
  html: () => block({
    kicker: "Join the Community", title: `Welcome — <span class="gradient-text">we saved you a seat</span>`,
    lead: "The community is open to everyone across CRO. Join the main space, introduce yourself, and start exploring. No perfect prompt required. No expert badge needed. Just come in.",
    inner: ctas([
      { t: "Join the Teams Community", k: "primary", h: TEAMS_URL, svg: "users" },
      { t: "Download the Onboarding Pack", h: "#/start", svg: "book" },
    ]),
  })
  + block({
    panel: true, title: "Our community promise",
    lead: "We meet you where you are. Curiosity counts more than expertise. Every question, story, and experiment makes the community stronger.",
    inner: bullets([
      "You belong here — beginners and builders alike.",
      "Sharing what failed is as valued as sharing what worked.",
      "Help is always one question away.",
      "Your participation is seen, celebrated, and rewarded with stars.",
    ]),
  })
  + block({
    kicker: "First actions", title: "Five ways to start in the next five minutes",
    inner: numCards([
      { t: "Introduce yourself", p: "Drop a one-line hello in the Welcome Chat." },
      { t: "Ask your first question", p: "No question is too basic here." },
      { t: "Star a submission", p: "Find one idea in the gallery worth trying." },
      { t: "Pick a learning lane", p: "Choose a path that fits your role." },
      { t: "Save the calendar", p: "Add the weekly rhythm to your week." },
      { t: "Share a win", p: "Even a tiny one. Especially a tiny one." },
    ]),
  })
  + block({
    kicker: "Community norms", title: "How we show up for each other",
    inner: bullets([
      "Be generous: share prompts, templates, and what you learned.",
      "Be kind: assume good intent, celebrate attempts.",
      "Be practical: real examples beat theory.",
      "Be safe: follow Responsible AI guidance and keep customer data protected.",
    ]) + ctas([{ t: "Introduce Yourself", k: "cool", h: "#/story", svg: "share" }, { t: "Join the Teams Community", k: "primary", h: TEAMS_URL, svg: "users" }]),
  }),
};

/* ---- Start Here ---- */
ROUTES.start = {
  title: "Start Here", formation: "question",
  html: () => block({
    kicker: "Start Here", title: `A 5-minute <span class="gradient-cool">community walkthrough</span>`,
    lead: "New here? This is the quickest way to orient yourself and complete your first community action.",
    inner: olist([
      "<b>What to do first</b> — say hello in the Welcome Chat and tell us one thing you are curious about.",
      "<b>Where to ask questions</b> — the Expert Clinic and the Q&amp;A channel are always open.",
      "<b>Where to learn</b> — pick a Learning Lane that matches your role and time.",
      "<b>Where to share</b> — post a prompt, a workflow, or a story to the gallery.",
      "<b>Where to get help</b> — license &amp; access help, certification counseling, and clinics.",
      "<b>How stars &amp; recognition work</b> — earn stars for participation and level up over time.",
    ]),
  })
  + block({
    kicker: "Onboarding Pack", panel: true, title: "What's inside the pack",
    inner: numCards([
      "What this community is for", "How to join the channels", "Where to ask questions",
      "How to share a use case", "How to submit to the gallery", "How to join weekly activities",
      "How recognition and points work", "Where to get license &amp; access help",
      "Where to find certification guidance", "How to request team activation",
    ]) + ctas([{ t: "Open the Onboarding Pack", k: "primary", toast: "Onboarding Pack opening…", svg: "book" }]),
  })
  + block({
    title: "Complete your first community action",
    lead: "Pick one. That's all it takes to be part of this.",
    inner: ctas([
      { t: "Say Hello", k: "primary", h: "#/story", svg: "share" },
      { t: "Ask a Question", k: "cool", h: "#/clinic", svg: "chat" },
      { t: "Explore the Gallery", h: "#/gallery", svg: "grid" },
    ]),
  }),
};

/* ---- Share Your Story ---- */
ROUTES.story = {
  title: "Share Your Story", formation: "split",
  html: () => block({
    kicker: "Share Your Story", title: `Your story <span class="gradient-text">matters</span>`,
    lead: "Storytelling is a key behavior in this community. Share what you tried, what worked, what failed, and what you learned.",
    inner: `<div class="split"><div>` + bullets([
      "What are you curious about with AI?", "What have you tried so far?",
      "What is one workflow you wish AI could help with?", "What is one thing you want to learn?",
      "What certification or skill are you working toward?", "What is one practical AI win you have seen?",
    ]) + `</div><div class="panel">` + formHTML([
      { l: "Your name", t: "text" }, { l: "Team / Function", t: "text" }, { l: "Region", t: "text" },
      { l: "Story type", t: "select", opts: ["First-use story", "AI learning reflection", "Certification completion", "Team activation story", "A win to celebrate", "Something that failed (and what I learned)"] },
      { l: "Your story", t: "textarea", ph: "Keep it short and real…" },
    ], "Share Your Story") + `</div></div>`,
  }),
};

/* ---- Share Your Work (submission) ---- */
ROUTES.share = {
  title: "Share Your Work", formation: "clusters:3",
  html: () => block({
    kicker: "Share a Submission", title: "Share what you are building, learning, or trying",
    lead: "Pick a submission type and tell the community what happened. Sharing here is normal, welcomed, and rewarded with stars.",
    inner: pills(["AI use case", "Prompt that worked", "Copilot workflow", "ACE success story", "Certification experience", "Team activation story", "Customer prep example", "Productivity hack", "Learning reflection", "Question for the community", "Challenge entry", "Demo or short video"]),
  })
  + block({
    panel: true, title: "Submit your work",
    inner: formHTML([
      { l: "Name", t: "text" }, { l: "Team / Function", t: "text" }, { l: "Region", t: "text" },
      { l: "Submission type", t: "select", opts: ["AI use case", "Prompt that worked", "Copilot workflow", "ACE success story", "Certification experience", "Team activation story", "Customer prep example", "Productivity hack", "Learning reflection", "Question", "Challenge entry", "Demo / video"] },
      { l: "Tool used", t: "select", opts: ["Copilot", "Copilot Premium", "Claude in Copilot", "ACE", "Yoodli", "Other"] },
      { l: "Problem or opportunity", t: "textarea" }, { l: "What you tried", t: "textarea" },
      { l: "What worked", t: "textarea" }, { l: "What did not work", t: "textarea" },
      { l: "Outcome or value", t: "textarea" }, { l: "Screenshots or file upload", t: "file" },
      { l: "This can be showcased publicly inside CRO", t: "checkbox" },
      { l: "Leaders can reference this as a shoutout", t: "checkbox" },
      { l: "I'd like support to take this further", t: "checkbox" },
    ], "Submit Your Work"),
  }),
};

/* ---- Gallery ---- */
ROUTES.gallery = {
  title: "Submission Gallery", formation: "grid",
  html: () => block({
    kicker: "Submission Gallery", title: "Real work from real people",
    lead: "A living showcase from the community's AI April sprint — apps, AI art, dashboards, strategy decks, animations, and courses. Explore it as a 3D living canvas, or browse the highlights below.",
    inner: ctas([{ t: "Open the 3D Portfolio Gallery", k: "primary", h: PORTFOLIO_URL, svg: "grid" }, { t: "Submit Your Work", k: "cool", h: "#/share", svg: "share" }])
      + pills(["AI Art", "Dashboards", "AI Decks", "Apps & Tools", "Animations", "Courses", "Customer workflow", "Productivity", "Beginner friendly", "Advanced"]),
  })
  + block({ kicker: "Highlights", title: "Art, dashboards, decks &amp; more", inner: `<div class="grid c3">` + SHOTS.map(shotCard).join("") + `</div>` })
  + block({ kicker: "Apps & Tools", title: "Things you can launch right now", lead: "Real working apps the community built with AI — open them and try.", inner: `<div class="grid c3">` + APPS.map(appCard).join("") + `</div>` })
  + block({ panel: true, title: "Have something to add?", lead: "The gallery grows when you contribute. Add your prompt, workflow, demo, app, or story.", inner: ctas([{ t: "Submit to the Gallery", k: "primary", h: "#/share", svg: "share" }, { t: "Open the 3D Gallery", h: PORTFOLIO_URL, svg: "grid" }]) }),
};

/* ---- Learning Lane ---- */
ROUTES.learning = {
  title: "Learning Lane", formation: "stream",
  html: () => block({
    kicker: "Learning Lane", title: `Pick a lane. <span class="gradient-cool">Learn by doing.</span>`,
    lead: "Guided paths that feel practical, not like a course catalog. Each lane mixes quick tips, community examples, prompt packs, and mini challenges.",
    inner: iconCards([
      { t: "AI Basics for CRO", icon: "bulb" }, { t: "Copilot for Daily Productivity", icon: "bolt" },
      { t: "ACE for GTM Knowledge & Customer Prep", icon: "shield" }, { t: "Prompting Beyond Basics", icon: "chat" },
      { t: "AI for Account Planning", icon: "grid" }, { t: "AI for Sales Motions", icon: "rocket" },
      { t: "AI for Customer Success", icon: "heart" }, { t: "AI for Marketing & Content", icon: "star" },
      { t: "AI for Operations & Process", icon: "bolt" }, { t: "Responsible AI & Ethics", icon: "shield" },
      { t: "Certification Prep", icon: "book" }, { t: "Team Activation Playbooks", icon: "users" },
    ], 3),
  })
  + block({
    kicker: "Learning formats", panel: true, title: "How you'll learn",
    inner: pills(["5-minute tips", "Weekly learning cards", "Community examples", "Prompt packs", "Demo videos", "Office hours", "Mini challenges", "Peer walkthroughs", "Certification stories", "Practical templates"])
      + ctas([{ t: "Choose a Learning Lane", k: "primary", toast: "Pick a lane — opening your learning path…", svg: "book" }, { t: "Pick a Learning Path", k: "cool", h: "#/challenges", svg: "trophy" }]),
  }),
};

/* ---- Expert Clinic ---- */
ROUTES.clinic = {
  title: "Expert Clinic", formation: "ring",
  html: () => block({
    kicker: "Expert Clinic", title: "Bring your questions — leave with answers",
    lead: "Bring your AI questions, use cases, prompts, workflows, certification questions, or team activation challenges. The Expert Clinic is a practical support space to get guidance, improve ideas, and learn from others.",
    inner: iconCards([
      { t: "Prompt Clinic", icon: "bolt" }, { t: "Copilot Clinic", icon: "chat" }, { t: "ACE Clinic", icon: "shield" },
      { t: "Certification Clinic", icon: "book" }, { t: "Use Case Clinic", icon: "grid" }, { t: "Team Activation Clinic", icon: "users" },
      { t: "Responsible AI Clinic", icon: "shield" }, { t: "Demo Review Clinic", icon: "play" },
    ], 4),
  })
  + block({
    panel: true, title: "Book a slot — or drop a question",
    lead: "Can't make it live? Drop your question and we'll route it to the right clinic and follow up.",
    inner: `<div class="split"><div>` + ctas([{ t: "Book a Clinic Slot", k: "primary", toast: "Opening the clinic schedule…", svg: "calendar" }]) +
      `<p class="micro">Upcoming: Prompt Clinic (Tue), Copilot Clinic (Wed), Certification Clinic (Thu).</p></div><div class="panel">` +
      formHTML([
        { l: "Name", t: "text" }, { l: "Clinic type", t: "select", opts: ["Prompt", "Copilot", "ACE", "Certification", "Use Case", "Team Activation", "Responsible AI", "Demo Review"] },
        { l: "Your question", t: "textarea", ph: "What would you like help with?" },
      ], "Drop a Question") + `</div></div>`,
  }),
};

/* ---- Certification Support ---- */
ROUTES.certification = {
  title: "Certification Support", formation: "check",
  html: () => block({
    kicker: "Certification Support & Counseling", title: `Get certified, <span class="gradient-text">with a guide</span>`,
    lead: "We support CRO employees pursuing AI-related certifications — understanding options, learning paths, preparation expectations, peer experiences, and where to start.",
    inner: numCards([
      "Certification map", "Recommended certifications by role", "Beginner → advanced pathways",
      "Stories from people who completed certifications", "Study tips", "Time commitment guidance",
      "Exam experience blurbs", "Peer mentors", "Certification counseling", "Certification achievers wall",
    ]),
  })
  + block({
    kicker: "Certification Map", title: "Six certs our community has earned",
    lead: "A starting map across levels — from a broad first step to advanced AI ethics. Each one was earned by a teammate you can ask.",
    inner: certMap(),
  })
  + block({
    kicker: "Voices of the certified", panel: true, title: "From people who've done it",
    lead: "Why they chose it, how they prepared, and what they'd tell someone starting now.",
    inner: certVoices() + ctas([{ t: "See the Certification Achievers Wall", h: "#/recognition", svg: "trophy" }]),
  })
  + block({
    title: "Request certification counseling",
    inner: formHTML([
      { l: "Name", t: "text" }, { l: "Role / Team", t: "text" },
      { l: "Experience level", t: "select", opts: ["Beginner", "Intermediate", "Advanced"] },
      { l: "Certification you're considering", t: "text", ph: "Or ask us to recommend one" },
      { l: "What would help most?", t: "textarea" },
    ], "Request Certification Guidance"),
  }),
};

/* ---- AI Activation for Teams ---- */
ROUTES.teams = {
  title: "AI Activation for Teams", formation: "rocket",
  html: () => block({
    kicker: "AI Activation for Teams", title: `Move your team <span class="gradient-text">from interest to action</span>`,
    lead: "If your team is ready, the AI Activation Program helps you identify use cases, design practical learning experiences, run team sessions, support workflow adoption, and build confidence through hands-on practice.",
    inner: numCards([
      "Team discovery", "Use case identification", "Workflow mapping", "AI learning session design",
      "Practical exercises", "Prompt packs", "Team challenges", "Adoption support",
      "Leadership readout", "Measurement and follow-up",
    ]),
  })
  + block({
    kicker: "How it works", panel: true, warm: true, title: "A practical, hands-on journey",
    inner: bullets([
      "Discover — understand the team, its motions, and where AI can help.",
      "Design — map real workflows and build a practical learning session.",
      "Activate — run hands-on reps, challenges, and prompt packs together.",
      "Adopt — support the team after the session and measure what changed.",
    ]) + ctas([{ t: "Activate AI for My Team", k: "primary", h: "#/teams", svg: "rocket" }]),
  })
  + block({
    title: "Request AI Activation support",
    inner: formHTML([
      { l: "Your name", t: "text" }, { l: "Team / Function", t: "text" }, { l: "Region", t: "text" },
      { l: "Approx. team size", t: "text" },
      { l: "What does your team do?", t: "textarea" },
      { l: "What would success look like?", t: "textarea" },
    ], "Request AI Activation Support"),
  }),
};

/* ---- License & Access Help ---- */
ROUTES.access = {
  title: "License & Access Help", formation: "power",
  html: () => block({
    kicker: "License & Access Help", title: "Need license or access?",
    lead: "Not sure whether you have access to Copilot, ACE, Claude models in Copilot, Yoodli, or other AI tools? Start here.",
    inner: numCards([
      "Copilot access", "Copilot Premium access", "Claude model availability in Copilot", "ACE access",
      "Yoodli access", "Tool eligibility", "Request forms", "Troubleshooting links",
      "Who to contact", "What to do if access is denied",
    ]),
  })
  + block({
    panel: true, title: "Get access help",
    inner: formHTML([
      { l: "Name", t: "text" }, { l: "Team / Function", t: "text" },
      { l: "Which tool?", t: "select", opts: ["Copilot", "Copilot Premium", "Claude in Copilot", "ACE", "Yoodli", "Not sure"] },
      { l: "What's happening?", t: "select", opts: ["I don't have access", "Not sure if I'm eligible", "Access was denied", "Something isn't working", "General question"] },
      { l: "Details", t: "textarea" },
    ], "Get Access Help"),
  }),
};

/* ---- Leaders Listening Post ---- */
ROUTES.listening = {
  title: "Leaders Listening Post", formation: "core",
  html: () => block({
    kicker: "Leaders Listening Post", title: `The field talks. <span class="gradient-cool">Leadership listens.</span>`,
    lead: "A space where community members share ideas, blockers, questions, and feedback directly into a leadership-visible channel.",
    inner: bullets([
      "What is blocking AI adoption?", "What tools or access do you need?",
      "What use cases should we prioritize?", "What are customers asking about?",
      "What training would help your team?", "What is working well?",
      "What needs leadership attention?", "What should we stop, start, or improve?",
    ]),
  })
  + block({
    panel: true, title: "Submit to the Listening Post",
    inner: formHTML([
      { l: "Name (optional)", t: "text" }, { l: "Team / Function", t: "text" },
      { l: "Input type", t: "select", opts: ["Blocker", "Tool / access need", "Use case to prioritize", "Customer signal", "Training need", "What's working", "Needs leadership attention", "Stop / Start / Improve"] },
      { l: "Your feedback", t: "textarea" },
    ], "Submit Feedback to the Listening Post"),
  })
  + block({
    kicker: "What We Heard", title: "Leadership publishes a monthly update",
    lead: "Transparency closes the loop. Each month, leadership shares what they heard and what they're doing about it.",
    inner: iconCards([
      { t: "Top themes", icon: "chat" }, { t: "What's being acted on", icon: "bolt" },
      { t: "What needs more discovery", icon: "bulb" }, { t: "What can't be done yet", icon: "shield" },
      { t: "Where community input changed direction", icon: "heart" }, { t: "Leadership responses", icon: "bell" },
    ]),
  }),
};

/* ---- Recognition & Leaderboard ---- */
ROUTES.recognition = {
  title: "Recognition & Leaderboard", formation: "fireworks",
  html: () => block({
    kicker: "Recognition & Leaderboard", title: `Participation, <span class="gradient-text">made visible</span>`,
    lead: "Members earn stars for meaningful participation. Contribution is celebrated weekly and monthly — and recognized by leadership.",
    inner: `<div class="split"><div><h3 class="reveal" style="margin-bottom:6px">How to earn stars</h3>` + `<div class="starlist">` + [
      ["Join the community", 5], ["Introduce yourself", 10], ["Ask a useful question", 10], ["Share a prompt", 15],
      ["Submit a use case", 25], ["Share a certification story", 25], ["Help answer a question", 15],
      ["Present in a showcase", 50], ["Lead a learning huddle", 75], ["Mentor someone on certification", 100], ["Activate a team", 150],
    ].map(([t, a]) => `<div class="starrow reveal"><span>${t}</span><span class="amt">${a}</span></div>`).join("") + `</div></div>` +
    `<div><h3 class="reveal" style="margin-bottom:6px">Top contributors</h3><div class="board">` + [
      ["Diego F.", "GTM · LATAM", 640], ["Marcus L.", "GTM · AMER", 585], ["Priya N.", "Enterprise · EMEA", 470],
      ["Sara D.", "Customer Success · APAC", 415], ["Tom R.", "Sales Ops · EMEA", 360],
    ].map((r, i) => `<div class="brow reveal ${i === 0 ? "top1" : ""}"><span class="rank">${i + 1}</span><span class="who">${r[0]}<small>${r[1]}</small></span><span class="pts">★ ${r[2]}</span></div>`).join("") + `</div></div></div>`,
  })
  + block({
    kicker: "Contributor levels", panel: true, title: "From Explorer to Community Luminary",
    inner: `<div class="levels">` + [
      ["1", "Explorer", "Joined the community and completed onboarding."],
      ["2", "Contributor", "Shared a story, question, or prompt."],
      ["3", "Builder", "Submitted a use case, workflow, demo, or learning artifact."],
      ["4", "Guide", "Helped others, answered questions, or supported a clinic."],
      ["5", "Champion", "Led a session, mentored others, or activated a team."],
      ["6", "Community Luminary", "Recognized by leadership for sustained contribution and impact."],
    ].map((l, i) => `<div class="level reveal"><div class="lv" style="background:${PAL[i % PAL.length].ic}">${l[0]}</div><div><h3>${l[1]}</h3><p>${l[2]}</p></div></div>`).join("") + `</div>`,
  })
  + block({
    kicker: "Recognition", title: "Ways we celebrate people",
    inner: pills(["Weekly shoutout", "Monthly top contributor", "Best question of the week", "Best prompt of the week", "Certification achiever wall", "AI Activation Champion badge", "Leader-selected spotlight", "Team activation spotlight", "Rookie of the month", "Most helpful member", "Best learning reflection", "Funniest AI experiment", "Best practical workflow", "Best customer-facing use case", "Most creative use of AI"])
      + ctas([{ t: "Nominate Someone", k: "primary", toast: "Opening the nomination form…", svg: "trophy" }, { t: "See How to Earn Stars", k: "cool", h: "#/start", svg: "star" }]),
  }),
};

/* ---- Community Calendar ---- */
ROUTES.calendar = {
  title: "Community Calendar", formation: "clusters:4",
  html: () => block({
    kicker: "Community Calendar", title: "The community rhythm",
    lead: "Weekly challenges, expert clinics, office hours, certification sessions, demo days, leadership messages, and showcase events.",
    inner: `<div class="cal">` + [
      ["Mon", "Prompt of the Week drops", "Weekly Challenge", "Challenge"],
      ["Tue", "Prompt Clinic — live help", "Expert Clinic", "Clinic"],
      ["Wed", "Copilot Clinic + Office Hours", "Expert Clinic", "Clinic"],
      ["Thu", "Certification Clinic & study group", "Certification", "Cert"],
      ["Fri", "Demo Friday — 60-second demos", "Showcase", "Showcase"],
      ["Monthly", "Leadership “What We Heard” update", "Leadership", "Leaders"],
      ["Monthly", "Community Showcase & awards", "Showcase", "Showcase"],
    ].map((e) => `<div class="cevent reveal"><span class="when">${e[0]}</span><div class="what"><h3>${e[1]}</h3><p>${e[2]}</p></div><span class="kind">${e[3]}</span></div>`).join("") + `</div>`
      + ctas([{ t: "View Upcoming Events", k: "primary", toast: "Opening the full calendar…", svg: "calendar" }, { t: "See Weekly Challenges", k: "cool", h: "#/challenges", svg: "trophy" }]),
  }),
};

/* ---- Weekly Challenges ---- */
ROUTES.challenges = {
  title: "Weekly Challenges", formation: "core-center",
  html: () => block({
    kicker: "Weekly Challenges", title: `A little challenge, <span class="gradient-text">every week</span>`,
    lead: "Light, fun, and easy to join any week. Enter to learn, earn stars, and maybe land a leadership shoutout.",
    inner: iconCards([
      { t: "Prompt of the Week", p: "Share the one prompt that saved you the most time.", icon: "bolt" },
      { t: "Use-Case Sprint", p: "Turn one real task into an AI workflow and post what happened.", icon: "grid" },
      { t: "Demo Friday", p: "Record a 60-second demo — rough and real is welcome.", icon: "play" },
      { t: "Certification Push", p: "Make one step of progress on a certification this week.", icon: "shield" },
      { t: "Help-a-Teammate", p: "Answer someone's question in the community.", icon: "heart" },
      { t: "Creative AI", p: "Show the most creative use of AI you tried.", icon: "star" },
    ]),
  })
  + block({
    panel: true, title: "How challenge points work",
    inner: bullets([
      "Enter a challenge: earn stars for participating.",
      "Get starred by peers: bonus recognition.",
      "Win the week: featured in the leadership shoutout and the gallery.",
    ]) + ctas([{ t: "Enter This Week's Challenge", k: "primary", h: "#/share", svg: "trophy" }, { t: "View the Calendar", k: "cool", h: "#/calendar", svg: "calendar" }]),
  }),
};

/* ============================================================
   Router + interactions
   ============================================================ */
const main = document.getElementById("main");
let revealObserver = null;

function observeReveals() {
  if (revealObserver) revealObserver.disconnect();
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); revealObserver.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
  main.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
}

function setActive(route) {
  document.querySelectorAll("#primary-nav a").forEach((a) => {
    a.classList.toggle("active", a.getAttribute("href") === "#/" + route);
  });
}

function closeMenu() {
  document.getElementById("primary-nav").classList.remove("open");
  document.getElementById("nav-toggle").setAttribute("aria-expanded", "false");
}

function render() {
  const route = (location.hash.replace(/^#\/?/, "").split("?")[0]) || "home";
  const page = ROUTES[route] || ROUTES.home;
  document.title = page.title + " · CRO AI Activation Community";
  main.innerHTML = `<div class="view">${page.html()}</div>`;
  scene3d.reflow();                 // gentle reshuffle of the floating shapes
  window.scrollTo(0, 0);
  setActive(ROUTES[route] ? route : "home");
  observeReveals();
  closeMenu();
}

window.addEventListener("hashchange", render);

/* hamburger */
document.getElementById("nav-toggle").addEventListener("click", () => {
  const nav = document.getElementById("primary-nav");
  const open = nav.classList.toggle("open");
  document.getElementById("nav-toggle").setAttribute("aria-expanded", String(open));
});
document.getElementById("primary-nav").addEventListener("click", (e) => { if (e.target.tagName === "A") closeMenu(); });

/* demo form submit + toast buttons */
const toast = document.getElementById("toast");
let toastTimer = null;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}
document.addEventListener("submit", (e) => {
  if (e.target.matches("form[data-demo]")) {
    e.preventDefault();
    showToast("Thanks for contributing! 🎉  (Demo — wiring to Teams/SharePoint comes next.)");
    e.target.reset();
  }
});
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-toast]");
  if (b) { e.preventDefault(); showToast(b.getAttribute("data-toast")); }
});

/* boot */
buildNav();
if (!location.hash) location.replace("#/home");
render();
const loader = document.getElementById("loader");
setTimeout(() => loader.classList.add("hidden"), 450);
