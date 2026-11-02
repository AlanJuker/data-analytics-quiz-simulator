/* global SCENARIOS, CLUSTERS */
// Midterm simulator: 4 applied scenarios (one per cluster), free-text answers, rubric self-grading.
// Pure logic first (also used by the Node tests), then the UI, which only runs in a browser.

const lib = typeof module !== "undefined" ? require("./quiz.js") : { shuffle, suggestPoints };
const POINTS_PER_QUESTION = 25;

// One scenario per cluster, in the bank's cluster order; prefers scenarios not in `avoid` (the last attempt).
function buildExam(bank, rand = Math.random, avoid = []) {
  const clusters = [...new Set(bank.map((s) => s.cluster))];
  return clusters.map((cluster) => {
    const pool = bank.filter((s) => s.cluster === cluster);
    const fresh = pool.filter((s) => !avoid.includes(s.id));
    const s = lib.shuffle(fresh.length ? fresh : pool, rand)[0];
    return { s, answers: s.parts.map(() => ""), points: s.parts.map((p) => p.keyPoints.map(() => false)) };
  });
}

// Part score in [0, 1]: share of rubric points ticked; a blank answer earns nothing.
function partScore(item, j) {
  if (!item.answers[j].trim()) return 0;
  const pts = item.points[j];
  return pts.filter(Boolean).length / pts.length;
}

const questionScore = (item) => item.s.parts.reduce((sum, _, j) => sum + partScore(item, j), 0) / item.s.parts.length;

function gradeExam(items) {
  const skills = {};
  for (const it of items) {
    it.s.parts.forEach((p, j) => {
      skills[p.skill] ??= { earned: 0, total: 0 };
      skills[p.skill].earned += partScore(it, j);
      skills[p.skill].total += 1;
    });
  }
  const perQuestion = items.map((it) => questionScore(it) * POINTS_PER_QUESTION);
  return { score: Math.round(perQuestion.reduce((a, b) => a + b, 0)), perQuestion, skills, max: items.length * POINTS_PER_QUESTION };
}

const suggestAll = (items) => items.forEach((it) => {
  it.points = it.s.parts.map((p, j) => (it.answers[j].trim() ? lib.suggestPoints(p, it.answers[j]) : p.keyPoints.map(() => false)));
});

if (typeof module !== "undefined") module.exports = { buildExam, partScore, questionScore, gradeExam, suggestAll, POINTS_PER_QUESTION };

// ───────────────────────────── UI ─────────────────────────────
if (typeof document !== "undefined") {
  const app = document.getElementById("app");
  const HISTORY_KEY = "pdamidterm.history";
  const DRAFT_KEY = "pdamidterm.draft";
  const LETTERS = "abcdefgh";
  let state = null; // { items, index, startedAt, deadline, minutes, timerId }

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const fmt = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  const store = {
    get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked: convenience only */ } },
    del(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } },
  };
  const answeredParts = (it) => it.answers.filter((a) => a.trim()).length;

  function saveDraft() {
    if (!state) return;
    store.set(DRAFT_KEY, { ids: state.items.map((it) => it.s.id), answers: state.items.map((it) => it.answers), index: state.index,
      startedAt: state.startedAt, deadline: state.deadline, minutes: state.minutes });
  }

  // ───────── Setup ─────────
  function renderSetup() {
    clearInterval(state?.timerId);
    state = null;
    const history = store.get(HISTORY_KEY, []);
    const draft = store.get(DRAFT_KEY, null);
    app.innerHTML = `
      <section class="card">
        <h2>Midterm simulator</h2>
        <p>The midterm covers <strong>Modules 1–4</strong> with <strong>four applied-scenario questions</strong>. Each practice exam
        draws one scenario from each area below, so every attempt covers all the skills the announcement lists.</p>
        <ul class="skill-list">
          ${Object.values(CLUSTERS).map((c, i) => `<li><strong>Q${i + 1}</strong> · ${esc(c)}</li>`).join("")}
        </ul>
        <p class="muted small">Each question has an exhibit (a data extract, summary statistics or test output) and four short parts.
        Answer in your own words, in full sentences, using the numbers in the exhibit. After you submit, you compare each answer with a model
        answer and tick the rubric points you covered; keyword matches are pre-ticked for you to confirm. Each question is worth 25 points.
        Before you start, read the <a href="study-guide.html#framework">answer framework</a>.</p>
        <form id="setup">
          <fieldset><legend>Timer (set it to your exam's actual time limit)</legend><div class="chips">
            ${[[60, "60 min"], [90, "90 min"], [120, "120 min"], [0, "Off"]]
              .map(([v, l]) => `<label class="chip"><input type="radio" name="minutes" value="${v}" ${v === 90 ? "checked" : ""}> ${l}</label>`).join("")}
          </div></fieldset>
          <div class="row">
            <button class="primary" type="submit">Start a new exam</button>
            ${draft ? `<button type="button" data-act="resume">Resume unfinished exam</button>` : ""}
          </div>
        </form>
      </section>
      ${history.length ? `
      <section class="card">
        <div class="row spread"><h2>Your attempts</h2><button class="link" data-act="clear-history">Clear</button></div>
        <table>
          <thead><tr><th>Date</th><th>Scenarios</th><th class="num">Score</th></tr></thead>
          <tbody>${history.map((h) => `<tr><td>${esc(new Date(h.date).toLocaleString())}</td><td>${esc(h.ids.join(", "))}</td>
            <td class="num">${h.score} / ${h.max}</td></tr>`).join("")}</tbody>
        </table>
      </section>` : ""}`;
  }

  function startExam(minutes) {
    const last = store.get(HISTORY_KEY, [])[0]?.ids ?? [];
    const now = Date.now();
    state = { items: buildExam(SCENARIOS, Math.random, last), index: 0, startedAt: now, minutes,
      deadline: minutes ? now + minutes * 60_000 : null };
    state.timerId = setInterval(tick, 1000);
    saveDraft();
    renderQuestion();
  }

  function resumeExam() {
    const d = store.get(DRAFT_KEY, null);
    const items = d?.ids.map((id, i) => {
      const s = SCENARIOS.find((x) => x.id === id);
      return s && { s, answers: d.answers[i], points: s.parts.map((p) => p.keyPoints.map(() => false)) };
    });
    if (!items || items.some((it) => !it)) { store.del(DRAFT_KEY); return renderSetup(); }
    state = { items, index: d.index, startedAt: d.startedAt, deadline: d.deadline, minutes: d.minutes };
    if (state.deadline && Date.now() >= state.deadline) return finish(true);
    state.timerId = setInterval(tick, 1000);
    renderQuestion();
  }

  // ───────── Exam ─────────
  function timerText() {
    if (!state.deadline) return `⏱ ${fmt(Math.floor((Date.now() - state.startedAt) / 1000))}`;
    return `⏳ ${fmt(Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000)))} left`;
  }

  function tick() {
    if (state.deadline && Date.now() >= state.deadline) return finish(true);
    const el = document.getElementById("timer");
    if (!el) return;
    el.textContent = timerText();
    el.classList.toggle("low", !!state.deadline && state.deadline - Date.now() < 10 * 60_000);
  }

  function navClass(it, i) {
    const n = answeredParts(it);
    return [n === it.s.parts.length && "answered", n > 0 && n < it.s.parts.length && "partly", i === state.index && "current"].filter(Boolean).join(" ");
  }

  function renderQuestion() {
    const { items, index } = state;
    const it = items[index];
    const last = index === items.length - 1;
    app.innerHTML = `
      <div class="topbar">
        <span>Question ${index + 1} of ${items.length} · <span class="muted">${esc(CLUSTERS[it.s.cluster])}</span></span>
        <span id="timer" class="timer">${timerText()}</span>
      </div>
      <nav class="nav" aria-label="Questions">
        ${items.map((x, i) => `<button data-goto="${i}" class="${navClass(x, i)}" aria-label="Question ${i + 1}">${i + 1}</button>`).join("")}
      </nav>
      <section class="card">
        <div class="badges"><span class="badge">${POINTS_PER_QUESTION} points</span><span class="badge code">Scenario ${esc(it.s.id)}</span></div>
        <h2>${esc(it.s.title)}</h2>
        <p>${esc(it.s.context)}</p>
        <pre>${esc(it.s.exhibit)}</pre>
        ${it.s.parts.map((p, j) => `
          <div class="part">
            <label for="ans-${j}" class="part-prompt"><strong>(${LETTERS[j]})</strong> ${esc(p.prompt)}</label>
            <span class="badge skill">${esc(p.skill)}</span>
            <textarea id="ans-${j}" data-part="${j}" placeholder="Answer in full sentences and use the numbers in the exhibit.">${esc(it.answers[j])}</textarea>
          </div>`).join("")}
      </section>
      <div class="row spread">
        <button data-act="prev" ${index === 0 ? "disabled" : ""}>← Previous</button>
        ${last ? `<button class="primary" data-act="submit">Submit exam</button>` : `<button class="primary" data-act="next">Next →</button>`}
      </div>`;
  }

  function go(i) {
    state.index = i;
    saveDraft();
    renderQuestion();
    window.scrollTo({ top: 0 });
  }

  function submit() {
    const blank = state.items.reduce((n, it) => n + it.s.parts.length - answeredParts(it), 0);
    if (blank && !confirm(`${blank} part${blank > 1 ? "s are" : " is"} still blank. Submit anyway?`)) return;
    finish(false);
  }

  function finish(timeUp) {
    clearInterval(state.timerId);
    state.finishedAt = Date.now();
    state.timeUp = timeUp;
    suggestAll(state.items);
    store.del(DRAFT_KEY);
    renderSelfGrade();
  }

  // ───────── Self-grading ─────────
  function renderSelfGrade() {
    app.innerHTML = `
      <section class="card">
        <h2>${state.timeUp ? "Time is up. " : ""}Grade your answers</h2>
        <p class="muted">For each part, compare your answer with the model answer and tick each rubric point you genuinely covered.
        Points matched by keywords are pre-ticked; untick any you did not really explain. A blank part scores 0.</p>
      </section>
      ${state.items.map((it, i) => `
        <section class="card">
          <h2>Q${i + 1} · ${esc(it.s.title)}</h2>
          ${it.s.parts.map((p, j) => `
            <div class="part">
              <p class="part-prompt"><strong>(${LETTERS[j]})</strong> ${esc(p.prompt)} <span class="badge skill">${esc(p.skill)}</span></p>
              <h3>Your answer</h3>
              <div class="user-answer">${it.answers[j].trim() ? esc(it.answers[j]) : "<em class='muted'>No answer</em>"}</div>
              <h3>Model answer</h3>
              <div class="model-answer">${esc(p.modelAnswer)}</div>
              <h3>Rubric</h3>
              <ul class="checklist">${p.keyPoints.map((k, m) => `
                <li><label><input type="checkbox" data-q="${i}" data-p="${j}" data-k="${m}" ${it.points[j][m] ? "checked" : ""}
                  ${it.answers[j].trim() ? "" : "disabled"}> ${esc(k.text)}</label></li>`).join("")}
              </ul>
            </div>`).join("")}
        </section>`).join("")}
      <div class="row"><button class="primary" data-act="results">See my results</button></div>`;
    window.scrollTo({ top: 0 });
  }

  // ───────── Results ─────────
  function renderResults() {
    const g = gradeExam(state.items);
    const history = store.get(HISTORY_KEY, []);
    if (!state.saved) {
      history.unshift({ date: Date.now(), ids: state.items.map((it) => it.s.id), score: g.score, max: g.max });
      store.set(HISTORY_KEY, history.slice(0, 20));
      state.saved = true;
    }
    const minutes = Math.round((state.finishedAt - state.startedAt) / 60_000);
    const bar = (label, earned, total) => {
      const pct = total ? Math.round((earned / total) * 100) : 0;
      return `<div class="bar-row"><span>${esc(label)}</span><div class="bar"><span style="width:${pct}%"></span></div><span class="num">${pct}%</span></div>`;
    };
    const weakest = Object.entries(g.skills).sort((a, b) => a[1].earned / a[1].total - b[1].earned / b[1].total)[0];
    app.innerHTML = `
      <section class="card">
        <h2>Your result</h2>
        <div class="score">${g.score}<span class="muted" style="font-size:1.4rem"> / ${g.max}</span></div>
        <p class="muted">${minutes} minute${minutes === 1 ? "" : "s"}${state.timeUp ? " · submitted automatically when time ran out" : ""}.
        Practice scores show which skills to review; they do not predict your exact midterm grade.</p>
        <h3>By question</h3>
        <div class="bars">${state.items.map((it, i) => bar(`Q${i + 1} · ${CLUSTERS[it.s.cluster]}`, g.perQuestion[i], POINTS_PER_QUESTION)).join("")}</div>
        <h3>By skill</h3>
        <div class="bars">${Object.entries(g.skills).map(([s, v]) => bar(s, v.earned, v.total)).join("")}</div>
        ${weakest && weakest[1].earned < weakest[1].total ? `<p class="small">Weakest skill this attempt: <strong>${esc(weakest[0])}</strong>.
          Review it in the <a href="study-guide.html">study guide</a>, then try a new exam.</p>` : ""}
        <div class="row"><button class="primary" data-act="restart">New exam</button><button data-act="regrade">Back to grading</button></div>
      </section>`;
    window.scrollTo({ top: 0 });
  }

  // ───────── Events ─────────
  app.addEventListener("submit", (e) => {
    e.preventDefault();
    startExam(Number(new FormData(e.target).get("minutes")));
  });

  app.addEventListener("input", (e) => {
    if (e.target.dataset.part === undefined || !state) return;
    const it = state.items[state.index];
    it.answers[Number(e.target.dataset.part)] = e.target.value;
    document.querySelector(`[data-goto="${state.index}"]`).className = navClass(it, state.index);
    saveDraft();
  });

  app.addEventListener("change", (e) => {
    const { q, p, k } = e.target.dataset;
    if (q !== undefined) state.items[q].points[p][k] = e.target.checked;
  });

  app.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    if (btn.dataset.goto !== undefined) return go(Number(btn.dataset.goto));
    const act = btn.dataset.act;
    if (act === "prev") go(state.index - 1);
    else if (act === "next") go(state.index + 1);
    else if (act === "submit") submit();
    else if (act === "results") renderResults();
    else if (act === "regrade") renderSelfGrade();
    else if (act === "restart") renderSetup();
    else if (act === "resume") resumeExam();
    else if (act === "clear-history" && confirm("Clear your saved attempts?")) { store.del(HISTORY_KEY); renderSetup(); }
  });

  window.addEventListener("beforeunload", saveDraft);
  renderSetup();
}
