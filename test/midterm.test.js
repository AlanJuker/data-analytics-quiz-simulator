const test = require("node:test");
const assert = require("node:assert/strict");
const { SCENARIOS, CLUSTERS, SKILLS } = require("../midterm-bank.js");
const { buildExam, partScore, gradeExam, suggestAll, POINTS_PER_QUESTION } = require("../midterm.js");
const { suggestPoints } = require("../quiz.js");

test("scenario bank is well formed", () => {
  const ids = new Set();
  for (const s of SCENARIOS) {
    assert.ok(!ids.has(s.id), `duplicate id ${s.id}`);
    ids.add(s.id);
    assert.ok(CLUSTERS[s.cluster], `${s.id}: unknown cluster`);
    assert.ok(s.title && s.context && s.exhibit, `${s.id}: missing text`);
    assert.ok(s.parts.length >= 3, `${s.id}: needs at least 3 parts`);
    for (const p of s.parts) {
      assert.ok(SKILLS.includes(p.skill), `${s.id}: unknown skill ${p.skill}`);
      assert.ok(p.prompt && p.modelAnswer, `${s.id}: part missing prompt or model answer`);
      assert.ok(p.keyPoints.length >= 2, `${s.id}: a part needs at least 2 rubric points`);
      for (const k of p.keyPoints) assert.ok(k.keywords.length && k.keywords.every((w) => w === w.toLowerCase()), `${s.id}: keywords must be lowercase`);
    }
  }
});

test("every cluster has alternatives and every announced skill is practised", () => {
  for (const c of Object.keys(CLUSTERS)) assert.ok(SCENARIOS.filter((s) => s.cluster === c).length >= 2, `cluster ${c}`);
  const used = new Set(SCENARIOS.flatMap((s) => s.parts.map((p) => p.skill)));
  for (const skill of SKILLS) assert.ok(used.has(skill), `skill ${skill} never assessed`);
});

test("each model answer earns full marks under its own rubric", () => {
  for (const s of SCENARIOS) {
    s.parts.forEach((p, j) => {
      const ticks = suggestPoints(p, p.modelAnswer);
      ticks.forEach((t, m) => assert.ok(t, `${s.id} part ${j + 1}: model answer misses keywords for "${p.keyPoints[m].text}"`));
    });
  }
});

test("an exam has one scenario per cluster, in order, avoiding the last attempt", () => {
  const exam = buildExam(SCENARIOS, () => 0.5, ["A1", "B1", "C1", "D1"]);
  assert.deepEqual(exam.map((it) => it.s.cluster), Object.keys(CLUSTERS));
  assert.ok(exam.every((it) => !["A1", "B1", "C1", "D1"].includes(it.s.id)));
});

test("scoring gives partial credit and nothing for blank parts", () => {
  const exam = buildExam(SCENARIOS, () => 0);
  const it = exam[0];
  it.answers = it.s.parts.map((p) => p.modelAnswer);
  it.answers[1] = "   ";
  suggestAll(exam);
  assert.equal(partScore(it, 0), 1);
  assert.equal(partScore(it, 1), 0);
  const g = gradeExam(exam);
  const expected = ((it.s.parts.length - 1) / it.s.parts.length) * POINTS_PER_QUESTION;
  assert.equal(Math.round(g.perQuestion[0] * 100), Math.round(expected * 100));
  assert.equal(g.max, 100);
});
