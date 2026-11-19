const test = require("node:test");
const assert = require("node:assert/strict");
const QUESTIONS = require("../questions.js");
const { buildQuiz, suggestPoints, itemScore, grade } = require("../quiz.js");

const QUIZ2 = [5, 6, 7, 8];

test("question bank is well formed", () => {
  const ids = new Set();
  for (const q of QUESTIONS) {
    assert.ok(!ids.has(q.id), `duplicate id ${q.id}`);
    ids.add(q.id);
    assert.ok([1, 2, 3, 4, 5, 6, 7, 8].includes(q.module), q.id);
    assert.ok(["theory", "code"].includes(q.kind), q.id);
    assert.ok(q.prompt.length > 10, q.id);
    if (q.kind === "code") assert.ok(q.code, `${q.id} is an output question without output`);
    if (q.type === "mc") {
      assert.equal(q.options.length, 4, q.id);
      assert.equal(new Set(q.options).size, 4, `${q.id} has duplicate options`);
      assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4, q.id);
      assert.ok(q.explanation, q.id);
      assert.ok(!/(all|none) of the above/i.test(q.options.join(" ")), `${q.id} breaks under option shuffling`);
      const longestWrong = Math.max(...q.options.filter((_, i) => i !== q.answer).map((o) => o.length));
      assert.ok(q.options[q.answer].length <= Math.max(30, longestWrong * 1.2), `${q.id}: correct option is a giveaway by length`);
    } else {
      assert.equal(q.type, "open", q.id);
      assert.ok(q.modelAnswer && q.keyPoints.length >= 3, q.id);
      for (const p of q.keyPoints) assert.ok(p.text && p.keywords.length, q.id);
      if (q.module >= 5) assert.ok(suggestPoints(q, q.modelAnswer).every(Boolean), `${q.id}: the model answer should earn full marks`);
    }
  }
});

test("each module alone can fill the long format (24 MC + 6 short answer)", () => {
  for (const m of [1, 2, 3, 4, 5, 6, 7, 8]) {
    const quiz = buildQuiz(QUESTIONS, { modules: [m], mcCount: 24, openCount: 6 });
    assert.equal(quiz.length, 30, `module ${m}`);
  }
});

test("Quiz 1 format: 15 MC + 3 short answer, theory before output before short answer", () => {
  const quiz = buildQuiz(QUESTIONS, { modules: [1, 2, 3, 4], mcCount: 15, openCount: 3 });
  const mc = quiz.filter((it) => it.q.type === "mc");
  const open = quiz.filter((it) => it.q.type === "open");
  assert.equal(mc.length, 15);
  assert.equal(open.length, 3);
  assert.equal(new Set(quiz.map((it) => it.q.id)).size, 18, "no repeated questions");
  assert.equal(mc.filter((it) => it.q.kind === "code").length, 3);
  const openCode = open.filter((it) => it.q.kind === "code").length;
  const sections = quiz.map((it) => `${it.q.type}-${it.q.kind}`);
  assert.deepEqual(sections, [
    ...Array(12).fill("mc-theory"), ...Array(3).fill("mc-code"),
    ...Array(3 - openCode).fill("open-theory"), ...Array(openCode).fill("open-code"),
  ], "theory MC first, then output MC, then short answers");
});

test("Quiz 2 format: 25 MC + 2 short answer from Modules 5-8, theory before output before short answer", () => {
  const quiz = buildQuiz(QUESTIONS, { modules: QUIZ2, mcCount: 25, openCount: 2 });
  assert.equal(quiz.length, 27);
  assert.equal(new Set(quiz.map((it) => it.q.id)).size, 27, "no repeated questions");
  assert.ok(quiz.every((it) => it.q.module >= 5));
  const sections = quiz.slice(0, 25).map((it) => `${it.q.type}-${it.q.kind}`);
  assert.deepEqual(sections, [...Array(20).fill("mc-theory"), ...Array(5).fill("mc-code")]);
  assert.ok(quiz.slice(25).every((it) => it.q.type === "open"));
});

test("super quick format: 5 MC (one of them an output question) + 1 short answer from Modules 5-8", () => {
  const quiz = buildQuiz(QUESTIONS, { modules: QUIZ2, mcCount: 5, openCount: 1 });
  assert.deepEqual(quiz.map((it) => `${it.q.type}-${it.q.kind}`).slice(0, 5), [...Array(4).fill("mc-theory"), "mc-code"]);
  assert.equal(quiz[5].q.type, "open");
  assert.ok(quiz.every((it) => it.q.module >= 5));
});

// Runs Quiz 2 attempts the way the app does: each one counts as seen and becomes `last` as soon as it starts.
function attempts(n) {
  const seen = {};
  let last = [];
  return Array.from({ length: n }, () => {
    const ids = buildQuiz(QUESTIONS, { modules: QUIZ2, mcCount: 25, openCount: 2, seen, last }).map((it) => it.q.id);
    ids.forEach((id) => (seen[id] = (seen[id] || 0) + 1));
    last = ids;
    return ids;
  });
}

test("new quizzes show unseen questions first: 12 Quiz 2 attempts cover all of Modules 5-8", () => {
  const shown = new Set(attempts(12).flat());
  const missing = QUESTIONS.filter((q) => q.module >= 5 && !shown.has(q.id)).map((q) => q.id);
  assert.deepEqual(missing, []);
});

test("two quizzes in a row never share a question", () => {
  for (let trial = 0; trial < 20; trial++) {
    const runs = attempts(30);
    for (let i = 1; i < runs.length; i++) assert.ok(!runs[i].some((id) => runs[i - 1].includes(id)), `attempt ${i + 1} repeats attempt ${i}`);
  }
});

test("only selected modules are used", () => {
  const quiz = buildQuiz(QUESTIONS, { modules: [2], mcCount: 8, openCount: 2 });
  assert.ok(quiz.every((it) => it.q.module === 2));
});

test("shuffled options still grade against the original answer", () => {
  for (let run = 0; run < 50; run++) {
    const [item] = buildQuiz(QUESTIONS, { modules: [1, 2, 3, 4], mcCount: 1, openCount: 0 });
    if (item.q.type !== "mc") continue;
    assert.deepEqual([...item.order].sort(), [0, 1, 2, 3]);
    item.choice = item.order.indexOf(item.q.answer);
    assert.equal(itemScore(item), 1);
    item.choice = (item.choice + 1) % 4;
    assert.equal(itemScore(item), 0);
  }
});

test("open answers earn partial credit from the rubric", () => {
  const q = QUESTIONS.find((x) => x.id === "m4-o2");
  const text = "Use Spearman when the data is ordinal or has outliers.";
  const item = { q, text, points: suggestPoints(q, text) };
  assert.deepEqual(item.points, [true, true, false]);
  assert.equal(itemScore(item), 2 / 3);
  assert.equal(itemScore({ ...item, text: "  " }), 0, "blank answers score zero even if ticked");
});

test("grade aggregates totals and groups", () => {
  const mcQ = QUESTIONS.find((x) => x.type === "mc" && x.module === 1);
  const openQ = QUESTIONS.find((x) => x.type === "open" && x.module === 2);
  const items = [
    { q: mcQ, order: [0, 1, 2, 3], choice: mcQ.answer },
    { q: openQ, text: "x", points: openQ.keyPoints.map((_, i) => i === 0) },
  ];
  const g = grade(items);
  assert.equal(g.total, 2);
  assert.equal(g.groups["Module 1"].earned, 1);
  assert.equal(g.groups["Short answer"].earned, 1 / openQ.keyPoints.length);
  assert.equal(g.percent, Math.round(((1 + 1 / openQ.keyPoints.length) / 2) * 100));
});
