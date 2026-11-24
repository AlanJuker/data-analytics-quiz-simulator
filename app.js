/* global QUESTIONS, buildQuiz, markDone, suggestPoints, itemScore, grade */
// UI layer: renders the four screens (setup → quiz → self-grading → results) into #app.

const app = document.getElementById("app");
const HISTORY_KEY = "pdaquiz.history";
const UNTIMED_KEY = "pdaquiz.untimed"; // remembers the "No time limit" choice
const SEEN_KEY = "pdaquiz.seen"; // question id → { n, at }: times completed and when, so quizzes walk the bank
const PASS_MARK = 70;
const LETTERS = "ABCD";
// The site focuses on Quiz 2, which always covers Modules 5-8: 25 multiple choice + 2 short answer in
// 30 minutes. Quick is the default. The countdown runs at the real quiz's pace per question type (about
// 45 seconds per multiple choice and 4-5 minutes per short answer) unless "No time limit" is ticked.
// Modules 1-4 questions stay in the bank for a later full exam.
const QUIZ2_MODULES = [5, 6, 7, 8];
const FORMATS = {
  quick: { label: "Quick · 5 multiple choice + 1 short answer", short: "Quick", mc: 5, open: 1, minutes: 9 },
  mc: { label: "Multiple choice · 5 questions", short: "Multiple choice", mc: 5, open: 0, minutes: 4 },
  open: { label: "Quick open · 1 short answer", short: "Quick open", mc: 0, open: 1, minutes: 5 },
  real: { label: "Real Quiz 2 · 25 multiple choice + 2 short answer", short: "Real Quiz 2", mc: 25, open: 2, minutes: 30 },
};
// Each format has a different number of questions, so an attempt's length tells its format.
const formatName = (total) => Object.values(FORMATS).find((f) => f.mc + f.open === total)?.short ?? `${total} questions`;

let state = null; // { screen, settings, items, index, startedAt, deadline, finishedAt, date, timerId, reviewing }

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const fmt = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
const isAnswered = (it) => (it.q.type === "mc" ? it.choice !== null : it.text.trim() !== "");

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode); history and progress are conveniences, so ignore.
  }
}

// Only Quiz 2 attempts (Modules 5-8) are listed; older Quiz 1 attempts stay saved but hidden.
const loadHistory = () => load(HISTORY_KEY, []).filter((h) => h.modules.every((m) => QUIZ2_MODULES.includes(m)));
const saveHistory = (list) => save(HISTORY_KEY, list.slice(0, 20));

// Each submitted attempt keeps its answers, so its review can be reopened from "Your attempts".
// Saved when the quiz is submitted and again after self-grading (same date → same entry).
function saveAttempt() {
  const g = grade(state.items);
  const entry = {
    date: state.date, modules: QUIZ2_MODULES, total: g.total, percent: g.percent, format: state.settings.format,
    seconds: Math.round((state.finishedAt - state.startedAt) / 1000), timeUp: state.timeUp,
    items: state.items.map(({ q, order, choice, text, points }) => ({ id: q.id, order, choice, text, points })),
  };
  saveHistory([entry, ...loadHistory().filter((h) => h.date !== state.date)]);
}

function openReview(i) {
  const h = loadHistory()[i];
  const byId = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
  state = {
    screen: "results", settings: { format: h.format || "quick", untimed: load(UNTIMED_KEY, false) },
    items: h.items.map(({ id, ...rest }) => ({ q: byId[id], ...rest })).filter((it) => it.q),
    date: h.date, startedAt: 0, finishedAt: h.seconds * 1000, timeUp: h.timeUp, reviewing: true,
  };
  renderResults();
}

function seenText(modules) {
  const seen = load(SEEN_KEY, {});
  const pool = QUESTIONS.filter((q) => modules.includes(q.module));
  return `Questions seen so far: ${pool.filter((q) => seen[q.id]).length} / ${pool.length}`;
}

const chip = (type, name, value, label, checked) =>
  `<label class="chip"><input type="${type}" name="${name}" value="${value}" ${checked ? "checked" : ""}> ${label}</label>`;

// ───────────── Setup ─────────────
function renderSetup(settings = { format: "quick", untimed: load(UNTIMED_KEY, false) }) {
  state = null;
  const history = loadHistory();
  app.innerHTML = `
    <section class="card">
      <h2>Set up your practice quiz</h2>
      <p class="muted">Every quiz covers Modules 5–8 (probability, hypothesis testing, ANOVA and non-parametric
      tests), like Quiz 2. <strong>Quick</strong> gives 5 multiple-choice questions and 1 short answer;
      <strong>Multiple choice</strong> and <strong>Quick open</strong> practise one type at a time; <strong>Real Quiz 2</strong>
      is the full 25 + 2 in 30 minutes. A timer runs as in the real quiz and submits automatically when time runs out,
      unless you tick <strong>No time limit</strong>.
      About 1 in 5 multiple-choice questions asks you to interpret a test result or a data table. Every new quiz
      continues through the bank with questions you have not done yet, so nothing repeats until you have done them all.
      A quiz counts once you submit it; if you leave one unfinished, you get the same questions next time. You grade
      your short answers against a rubric after you submit. Revise with the <a href="study-guide.html">Quiz 2 study guide</a>.</p>
      <form id="setup">
        <fieldset><legend>Length</legend><div class="chips">
          ${Object.entries(FORMATS).map(([k, f]) => chip("radio", "format", k, f.label, settings.format === k)).join("")}
        </div></fieldset>
        <div class="chips">${chip("checkbox", "untimed", "1", "No time limit (the clock counts up and never submits for you)", settings.untimed)}</div>
        <p class="muted small">${seenText(QUIZ2_MODULES)}</p>
        <button class="primary" type="submit">Start quiz</button>
      </form>
    </section>
    ${history.length ? `
    <section class="card">
      <div class="row spread"><h2>Your attempts</h2><button class="link" data-act="clear-history">Clear</button></div>
      <table>
        <thead><tr><th>Date</th><th>Length</th><th class="num">Questions</th><th class="num">Score</th><th></th></tr></thead>
        <tbody>${history.map((h, i) => `
          <tr><td>${esc(new Date(h.date).toLocaleString())}</td><td>${esc(formatName(h.total))}</td>
          <td class="num">${h.total}</td><td class="num">${h.percent}%</td>
          <td>${h.items ? `<button class="link" data-review="${i}">Review</button>` : ""}</td></tr>`).join("")}
        </tbody>
      </table>
    </section>` : ""}`;
}

function startQuiz(settings) {
  const f = FORMATS[settings.format];
  const items = buildQuiz(QUESTIONS, { modules: QUIZ2_MODULES, mcCount: f.mc, openCount: f.open, seen: load(SEEN_KEY, {}) });
  const now = Date.now();
  state = {
    screen: "quiz",
    settings,
    items,
    index: 0,
    startedAt: now,
    deadline: settings.untimed ? null : now + f.minutes * 60 * 1000,
  };
  state.timerId = setInterval(tick, 1000);
  renderQuestion();
}

// ───────────── Quiz ─────────────
function timerText() {
  if (!state.deadline) return `⏱ ${fmt(Math.floor((Date.now() - state.startedAt) / 1000))}`;
  return `⏳ ${fmt(Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000)))} left`;
}

function tick() {
  if (state.deadline && Date.now() >= state.deadline) return finish(true);
  const el = document.getElementById("timer");
  if (!el) return;
  el.textContent = timerText();
  el.classList.toggle("low", !!state.deadline && state.deadline - Date.now() < 5 * 60_000);
}

function navClass(it, i) {
  return [isAnswered(it) && "answered", it.flagged && "flagged", i === state.index && "current"].filter(Boolean).join(" ");
}

function updateProgress() {
  const { items } = state;
  document.querySelector(".progress > span").style.width = `${(items.filter(isAnswered).length / items.length) * 100}%`;
  document.querySelector(`[data-goto="${state.index}"]`).className = navClass(items[state.index], state.index);
}

function renderQuestion() {
  const { items, index } = state;
  const it = items[index];
  const q = it.q;
  const last = index === items.length - 1;
  app.innerHTML = `
    <div class="topbar">
      <strong>Question ${index + 1} of ${items.length}</strong>
      <span class="timer" id="timer" role="timer">${timerText()}</span>
    </div>
    <div class="progress" aria-hidden="true"><span style="width: ${(items.filter(isAnswered).length / items.length) * 100}%"></span></div>
    <nav class="nav" aria-label="Question navigator">
      ${items.map((x, i) => `<button type="button" data-goto="${i}" class="${navClass(x, i)}"
        aria-label="Question ${i + 1}${isAnswered(x) ? ", answered" : ""}${x.flagged ? ", flagged" : ""}">${i + 1}</button>`).join("")}
    </nav>
    <section class="card">
      <div class="badges">
        <span class="badge">Module ${q.module}</span>
        <span class="badge">${q.type === "mc" ? "Multiple choice" : "Short answer"}</span>
        ${q.kind === "code" ? '<span class="badge code">Output</span>' : ""}
      </div>
      <p class="prompt" id="prompt">${esc(q.prompt)}</p>
      ${q.code ? `<pre><code>${esc(q.code)}</code></pre>` : ""}
      ${q.type === "mc"
        ? `<div class="options" role="radiogroup" aria-labelledby="prompt">
            ${it.order.map((orig, i) => `
              <label class="option"><input type="radio" name="opt" value="${i}" ${it.choice === i ? "checked" : ""}>
              <span class="letter">${LETTERS[i]}</span><span>${esc(q.options[orig])}</span></label>`).join("")}
          </div>`
        : `<textarea id="open-answer" aria-labelledby="prompt" placeholder="Write your answer as you would in the exam…">${esc(it.text)}</textarea>`}
    </section>
    <div class="row spread">
      <div class="row">
        <button data-act="prev" ${index === 0 ? "disabled" : ""}>← Previous</button>
        <button data-act="flag">${it.flagged ? "Unflag" : "Flag for review"}</button>
      </div>
      <div class="row">
        ${last ? "" : '<button class="primary" data-act="next">Next →</button>'}
        <button data-act="submit" class="${last ? "primary" : ""}">Submit quiz</button>
      </div>
    </div>
    <p class="muted small kbd-hint">Shortcuts: 1–4 or A–D to answer · ← → to move · F to flag</p>`;
}

function go(i) {
  if (i < 0 || i >= state.items.length) return;
  state.index = i;
  renderQuestion();
}

function submit() {
  const missing = state.items.filter((it) => !isAnswered(it)).length;
  if (missing && !confirm(`You have ${missing} unanswered question${missing > 1 ? "s" : ""}. Submit anyway?`)) return;
  finish(false);
}

// A quiz is recorded only when it is submitted (by you or when time runs out), so an unfinished quiz comes
// back with the same questions next time.
function finish(timeUp) {
  clearInterval(state.timerId);
  save(SEEN_KEY, markDone(load(SEEN_KEY, {}), state.items.map((it) => it.q.id)));
  state.finishedAt = Date.now();
  state.date = new Date(state.finishedAt).toISOString();
  state.timeUp = timeUp;
  const open = state.items.filter((it) => it.q.type === "open" && it.text.trim());
  open.forEach((it) => (it.points = suggestPoints(it.q, it.text)));
  saveAttempt();
  if (open.length) renderSelfGrade();
  else renderResults();
}

// ───────────── Self-grading of short answers ─────────────
function renderSelfGrade() {
  state.screen = "grade";
  const blocks = state.items
    .map((it, i) => ({ it, i }))
    .filter(({ it }) => it.q.type === "open" && it.text.trim())
    .map(({ it, i }) => `
      <section class="card">
        <div class="badges"><span class="badge">Question ${i + 1}</span><span class="badge">Module ${it.q.module}</span></div>
        <p class="prompt">${esc(it.q.prompt)}</p>
        ${it.q.code ? `<pre><code>${esc(it.q.code)}</code></pre>` : ""}
        <h3>Your answer</h3>
        <p class="user-answer">${esc(it.text)}</p>
        <h3>Model answer</h3>
        <p class="model-answer">${esc(it.q.modelAnswer)}</p>
        <h3>Rubric: tick each point your answer covers</h3>
        <ul class="checklist">
          ${it.q.keyPoints.map((p, j) => `
            <li><label><input type="checkbox" data-item="${i}" data-point="${j}" ${it.points[j] ? "checked" : ""}> ${esc(p.text)}</label></li>`).join("")}
        </ul>
      </section>`)
    .join("");
  app.innerHTML = `
    ${state.timeUp ? '<section class="card"><strong>Time is up.</strong> Your quiz was submitted automatically.</section>' : ""}
    <section class="card">
      <h2>Grade your short answers</h2>
      <p class="muted">Points were pre-ticked by keyword matching. Be honest: untick anything you did not really explain, and tick anything you covered in other words.</p>
    </section>
    ${blocks}
    <div class="row"><button class="primary" data-act="results">See my results</button></div>`;
  window.scrollTo(0, 0);
}

// ───────────── Results ─────────────
function renderResults() {
  state.screen = "results";
  const g = grade(state.items);
  const seconds = Math.round((state.finishedAt - state.startedAt) / 1000);
  if (!state.reviewing) saveAttempt();
  const pass = g.percent >= PASS_MARK;
  app.innerHTML = `
    ${state.reviewing ? `<section class="card"><strong>Past attempt</strong> from ${esc(new Date(state.date).toLocaleString())}.</section>`
      : state.timeUp ? '<section class="card"><strong>Time is up.</strong> Your quiz was submitted automatically.</section>' : ""}
    <section class="card">
      <div class="row spread">
        <div>
          <div class="score">${g.percent}%</div>
          <div class="verdict ${pass ? "pass" : "fail"}">${pass ? "Pass" : "Below the pass mark"} (${PASS_MARK}%)</div>
        </div>
        <div class="muted small">
          ${Math.round(g.earned * 10) / 10} / ${g.total} points<br>
          Time used: ${fmt(seconds)}
        </div>
      </div>
      <h3>Breakdown</h3>
      <div class="bars">
        ${Object.entries(g.groups).sort().map(([k, v]) => {
          const pct = Math.round((v.earned / v.total) * 100);
          return `<div class="bar-row"><span>${esc(k)}</span><div class="bar"><span style="width: ${pct}%"></span></div><span class="small">${pct}%</span></div>`;
        }).join("")}
      </div>
      <div class="row" style="margin-top: 18px">
        <button class="primary" data-act="retake">New quiz, same settings</button>
        <button data-act="setup">Change settings</button>
      </div>
    </section>
    <div class="row spread">
      <h2>Review</h2>
      <label class="small"><input type="checkbox" id="only-mistakes"> Only show mistakes</label>
    </div>
    <div id="review">${state.items.map(reviewItem).join("")}</div>`;
  window.scrollTo(0, 0);
}

function reviewItem(it, i) {
  const q = it.q;
  const s = itemScore(it);
  const status = s === 1 ? "correct" : s === 0 ? "wrong" : "partial";
  const head = `
    <div class="badges">
      <span class="badge">Q${i + 1}</span><span class="badge">Module ${q.module}</span>
      ${q.kind === "code" ? '<span class="badge code">Output</span>' : ""}
      <span class="badge">${q.type === "mc" ? `${s} / 1` : `${Math.round(s * 100)}%`}</span>
    </div>
    <p class="prompt">${esc(q.prompt)}</p>
    ${q.code ? `<pre><code>${esc(q.code)}</code></pre>` : ""}`;
  if (q.type === "mc") {
    const picked = it.choice === null ? null : it.order[it.choice];
    return `<section class="card review-item ${status}">${head}
      ${picked === null ? '<div class="answer-line bad">You did not answer.</div>'
        : picked !== q.answer ? `<div class="answer-line bad">Your answer: ${esc(q.options[picked])}</div>` : ""}
      <div class="answer-line good">Correct answer: ${esc(q.options[q.answer])}</div>
      <p class="explanation">${esc(q.explanation)}</p>
    </section>`;
  }
  return `<section class="card review-item ${status}">${head}
    <h3>Your answer</h3>
    <p class="user-answer">${it.text.trim() ? esc(it.text) : '<span class="muted">No answer.</span>'}</p>
    <h3>Model answer</h3>
    <p class="model-answer">${esc(q.modelAnswer)}</p>
    <ul class="checklist">${q.keyPoints.map((p, j) => `<li>${it.text.trim() && it.points[j] ? "✅" : "❌"} ${esc(p.text)}</li>`).join("")}</ul>
  </section>`;
}

// ───────────── Events ─────────────
app.addEventListener("submit", (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const settings = { format: form.get("format"), untimed: form.has("untimed") };
  save(UNTIMED_KEY, settings.untimed);
  startQuiz(settings);
});

app.addEventListener("click", (e) => {
  const goto = e.target.closest("[data-goto]");
  if (goto) return go(Number(goto.dataset.goto));
  const review = e.target.closest("[data-review]");
  if (review) return openReview(Number(review.dataset.review));
  const act = e.target.closest("[data-act]")?.dataset.act;
  if (act === "prev") go(state.index - 1);
  else if (act === "next") go(state.index + 1);
  else if (act === "flag") {
    state.items[state.index].flagged = !state.items[state.index].flagged;
    renderQuestion();
  } else if (act === "submit") submit();
  else if (act === "results") renderResults();
  else if (act === "retake") startQuiz(state.settings);
  else if (act === "setup") renderSetup(state.settings);
  else if (act === "clear-history" && confirm("Delete all saved attempts?")) {
    saveHistory([]);
    renderSetup();
  }
});

app.addEventListener("change", (e) => {
  const t = e.target;
  if (t.name === "opt") {
    state.items[state.index].choice = Number(t.value);
    updateProgress();
  } else if (t.dataset.point !== undefined) {
    state.items[Number(t.dataset.item)].points[Number(t.dataset.point)] = t.checked;
  } else if (t.id === "only-mistakes") {
    document.querySelectorAll("#review .review-item.correct").forEach((el) => (el.hidden = t.checked));
  }
});

app.addEventListener("input", (e) => {
  if (e.target.id !== "open-answer") return;
  state.items[state.index].text = e.target.value;
  updateProgress();
});

document.addEventListener("keydown", (e) => {
  if (state?.screen !== "quiz" || e.metaKey || e.ctrlKey || e.altKey || e.target.tagName === "TEXTAREA") return;
  const it = state.items[state.index];
  const key = e.key.toLowerCase();
  const opt = "1234".indexOf(key) >= 0 ? "1234".indexOf(key) : "abcd".indexOf(key);
  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    e.preventDefault();
    go(state.index + (e.key === "ArrowRight" ? 1 : -1));
  } else if (key === "f") {
    it.flagged = !it.flagged;
    renderQuestion();
  } else if (it.q.type === "mc" && opt >= 0) {
    it.choice = opt;
    renderQuestion();
  }
});

window.addEventListener("beforeunload", (e) => {
  if (state?.screen === "quiz") e.preventDefault();
});

renderSetup();
