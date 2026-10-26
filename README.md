# Data Analytics Quiz Simulator

A practice quiz for **Principles of Data Analytics, Modules 1–4**. By default it mimics the real **Quiz 1**: 15 multiple-choice and 3 short-answer questions, a 40-minute timer and automatic submission when time runs out. Questions are drawn at random from a bank of 210, every attempt is scored, and every question comes with an explanation.

**Live:** https://alanjuker.github.io/data-analytics-quiz-simulator/

| Module | Topics |
| --- | --- |
| 1 · Intro to data analytics | Data lifecycle, benefits of analytics, cleaning functions and tools, hypotheses (IV/DV, H₀/H₁) |
| 2 · Data collection & preparation | Primary vs secondary, qualitative vs quantitative, measurement scales, variable types, time-series/cross-sectional/panel, data quality, encoding, scaling, outliers, missing data (MCAR/MAR/MNAR) |
| 3 · Statistics & visualization | Descriptive vs inferential, population vs sample, mean/median/mode, skewness, spread, boxplots, chart choice, visualization do's and don'ts |
| 4 · Measures of association | Association vs causation, confounding variables, parametric vs non-parametric, Pearson, Spearman, Kendall, Chi-square, Cramér's V, p-values, one- vs two-tailed tests, choosing the right test (incl. t-test, ANOVA, Mann–Whitney U, Kruskal–Wallis), Session 4 activities |

## How a quiz works

- **Formats:** Quiz 1 (15 MC + 3 short answer, the default), Quick (8 + 2) or Long (24 + 6). The "exam pace" timer gives 40 minutes for 18 questions and scales with the other formats. You can move freely between questions, as in the real quiz.
- **Mix:** about 1 in 5 multiple-choice questions asks you to read a data table or SPSS output. Questions come in this order: theory, then output interpretation, then the short answers.
- **Style:** the questions test understanding, not memorisation. You identify the concept, choose the right test or chart, or interpret a result, and there is no arithmetic. Short-answer questions ask one thing each and can be answered in 2–3 sentences.
- **Setup:** choose the modules, the format and whether the timer is on.
- **During the quiz:** a question navigator, flags, and keyboard shortcuts (`1`–`4` / `A`–`D` to answer, `←` `→` to move, `F` to flag).
- **Short answers:** after you submit, you see the model answer and a rubric. Points are pre-ticked by keyword matching, and you confirm or correct them. Each short answer earns partial credit.
- **Results:** your score against a 70% pass mark, a breakdown by module and question type, and a full review with explanations. Past attempts are saved in your browser.

Multiple-choice options are shuffled on every attempt, and a test checks that the correct option is never noticeably longer than the others.

## Run locally

No build step and no dependencies. Open `index.html` in a browser, or serve the folder:

```bash
npm start          # python3 -m http.server 8000 → http://localhost:8000
```

## Tests

```bash
npm test           # node --test (Node 20+)
```

The tests check that the question bank is well formed, that the Quiz 1 format has exactly 15 + 3 questions in the right order, that each module can fill the long format on its own, that grading still matches after the options are shuffled, and that short answers get the right partial credit. CI runs them on every push.

## Project structure

```
index.html        page shell
styles.css        light/dark theme, responsive layout
questions.js      question bank (edit here to add questions)
quiz.js           pure logic: selection, shuffling, scoring
app.js            UI: setup → quiz → self-grading → results
test/             node:test suite
```

### Adding a question

Append an object to `QUESTIONS` in `questions.js`:

```js
{
  id: "m4-40", module: 4, type: "mc", kind: "theory",   // kind: "theory" | "code" (table/SPSS output)
  prompt: "…", code: "optional table or SPSS output",
  options: ["correct", "distractor", "distractor", "distractor"],
  answer: 0,                                            // index into options
  explanation: "Why the answer is correct.",
}
```

Short-answer questions use `type: "open"` with `modelAnswer` and `keyPoints: [{ text, keywords: [] }]`. Run `npm test` to validate the bank.

## Disclaimer

This is an unofficial study aid. The questions are written from the Module 1–4 readings and the Session 4 activities, and they are not the professor's actual quiz.

## License

[MIT](LICENSE)
