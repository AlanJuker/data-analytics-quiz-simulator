// Pure quiz logic: selection, shuffling and scoring. No DOM access, so it runs in Node tests too.

const CODE_SHARE = 0.2; // 80% theory, 20% reading a data table or test result ("code" kind)

function shuffle(items, rand = Math.random) {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Least-seen questions first, so attempts work through the whole bank before anything repeats. Among
// equally seen questions the previous attempt's go last, so two attempts in a row never share a question.
// Remaining ties are random. `seen` maps question id → times shown; `last` lists the previous attempt's ids.
const freshFirst = (questions, seen, last, rand) =>
  shuffle(questions, rand).sort((a, b) => (seen[a.id] || 0) - (seen[b.id] || 0) || last.includes(a.id) - last.includes(b.id));

// Picks n multiple-choice questions, aiming for CODE_SHARE code questions and topping up from
// whatever is left if a bucket runs short. `order` ranks a list of questions (fresh first).
function pickType(pool, n, order) {
  const code = order(pool.filter((q) => q.kind === "code"));
  const theory = order(pool.filter((q) => q.kind !== "code"));
  const nCode = Math.min(code.length, Math.round(n * CODE_SHARE));
  const picked = [...code.slice(0, nCode), ...theory.slice(0, n - nCode)];
  const rest = [...theory.slice(n - nCode), ...code.slice(nCode)];
  return [...picked, ...rest.slice(0, n - picked.length)];
}

// Theory before code; sort is stable, so the random order within each kind is kept.
const theoryFirst = (a, b) => (a.kind === "code") - (b.kind === "code");

// Returns quiz items in exam order: theory MC, code MC, then open questions (theory, then code).
// Short answers are picked from the whole open pool, so output-based ones also get their turn.
// MC options are shuffled; an item's `order` maps display index → original index.
function buildQuiz(bank, { modules, mcCount, openCount, seen = {}, last = [] }, rand = Math.random) {
  const fresh = (questions) => freshFirst(questions, seen, last, rand);
  const pool = bank.filter((q) => modules.includes(q.module));
  const mc = pool.filter((q) => q.type === "mc");
  const open = pool.filter((q) => q.type === "open");
  const nMc = Math.min(mc.length, mcCount);
  const nOpen = Math.min(open.length, openCount);
  return [
    ...shuffle(pickType(mc, nMc, fresh), rand).sort(theoryFirst).map((q) => ({ q, order: shuffle([0, 1, 2, 3], rand), choice: null, flagged: false })),
    ...shuffle(fresh(open).slice(0, nOpen), rand).sort(theoryFirst).map((q) => ({ q, text: "", points: q.keyPoints.map(() => false), flagged: false })),
  ];
}

// Pre-ticks the key points whose keywords appear in the answer; the student reviews and adjusts.
function suggestPoints(question, text) {
  const t = ` ${text.toLowerCase()} `;
  return question.keyPoints.map((p) => p.keywords.some((k) => t.includes(k.toLowerCase())));
}

// Score of one item in [0, 1]. Open questions earn partial credit per key point.
function itemScore(item) {
  if (item.q.type === "mc") return item.choice !== null && item.order[item.choice] === item.q.answer ? 1 : 0;
  if (!item.text.trim()) return 0;
  return item.points.filter(Boolean).length / item.points.length;
}

function grade(items) {
  const groups = {};
  const add = (key, s) => {
    groups[key] ??= { earned: 0, total: 0 };
    groups[key].earned += s;
    groups[key].total += 1;
  };
  let earned = 0;
  for (const it of items) {
    const s = itemScore(it);
    earned += s;
    add(`Module ${it.q.module}`, s);
    add(it.q.type === "mc" ? "Multiple choice" : "Short answer", s);
    add(it.q.kind === "code" ? "Output interpretation" : "Theory", s);
  }
  return { earned, total: items.length, percent: items.length ? Math.round((earned / items.length) * 100) : 0, groups };
}

if (typeof module !== "undefined") module.exports = { shuffle, buildQuiz, suggestPoints, itemScore, grade, CODE_SHARE };
