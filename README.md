# Data Analytics Quiz Simulator

A practice quiz for **Principles of Data Analytics, Modules 1–8**. By default it mimics the real **Quiz 2**: 25 multiple-choice and 2 short-answer questions on Modules 5–8 (probability, hypothesis testing, ANOVA and non-parametric tests), a 30-minute timer and automatic submission when time runs out. The **Quiz 1** format (Modules 1–4, 15 + 3 questions in 40 minutes) is still available. Questions come from a bank of 387 (180 for Modules 5–8), every new quiz shows the questions you have seen least, every attempt is scored, and every question comes with an explanation.

**Live:** https://alanjuker.github.io/data-analytics-quiz-simulator/

| Module | Topics |
| --- | --- |
| 1 · Intro to data analytics | Data lifecycle, benefits of analytics, cleaning functions and tools, hypotheses (IV/DV, H₀/H₁) |
| 2 · Data collection & preparation | Primary vs secondary, qualitative vs quantitative, measurement scales, variable types, time-series/cross-sectional/panel, data quality, encoding, scaling, outliers, missing data (MCAR/MAR/MNAR) |
| 3 · Statistics & visualization | Descriptive vs inferential, population vs sample, mean/median/mode, skewness, spread, boxplots, chart choice, visualization do's and don'ts |
| 4 · Measures of association | Association vs causation, confounding variables, parametric vs non-parametric, Pearson, Spearman, Kendall, Chi-square, Cramér's V, p-values, one- vs two-tailed tests, choosing the right test (incl. t-test, ANOVA, Mann–Whitney U, Kruskal–Wallis), Session 4 activities |
| 5 · Probability for decision making | Probability basics, binomial (conditions, n × p), Poisson (λ, counts per interval), normal distribution, 68-95-99.7 rule, Central Limit Theorem, z-scores and the Z-table, limits of the normal distribution and how to handle them |
| 6 · Hypothesis testing | H₀ vs Ha, one- vs two-tailed tests, critical values, p-value vs critical value approach, z-test vs t-test, Type I/II errors, α, β and power, one-sample, independent (Levene's test, Welch) and paired t-tests from the class activity, confidence intervals |
| 7 · ANOVA | Why ANOVA instead of many t-tests, F-ratio, between vs within variance, assumptions (residual normality, Levene's test, Welch's ANOVA), post hoc tests, one-way vs two-way ANOVA, main and interaction effects, η² |
| 8 · Non-parametric tests | Parametric vs non-parametric, ranks, Mann–Whitney U, Wilcoxon signed-rank, Kruskal–Wallis, Friedman, Scheirer–Ray–Hare and ART ANOVA, choosing the right test, reading their outputs |

## Midterm simulator and study guide

- **[Midterm simulator](midterm.html)** follows the midterm announcement: **four applied-scenario questions** on Modules 1–4. Each attempt draws one scenario per area: data quality & preparation; describing & visualizing data; choosing & justifying a test; and interpreting results & drawing conclusions. Each scenario has an exhibit (data extract, summary statistics or test output) and four free-text parts. They cover data quality, measurement levels, choosing an approach, assumptions, significance vs strength, association vs causation and clear conclusions. After you submit, you grade yourself against model answers and rubrics (keyword matches are pre-ticked), and you get a score out of 100 with a breakdown by question and skill. The main option, **Quick (1 case)**, gives a single scenario (25 points); **Full exam (4 cases)** runs the whole format. Every start draws cases you have not seen yet (tracked in the browser), so you go through the whole bank before any case repeats. The grading screen repeats the full scenario and exhibit next to your answers. A clock starts automatically when an exam begins and shows the time elapsed (there is no time limit), and unfinished exams are saved in the browser.
- **[Theory recap](theory.html)** is a short version of the Module 1–4 readings: the big idea and key terms of each module, comparison tables, a boxplot diagram, recall questions with hidden answers, and a formula sheet.
- **[Study guide](study-guide.html)** covers:
  - an answer framework for scenario questions;
  - essentials for each of Modules 1–4;
  - quick references (data quality, missing values, outliers, measurement levels);
  - a test-chooser diagram;
  - significance vs strength, and association vs causation;
  - conclusion templates and a final checklist.

The scenario bank lives in `midterm-bank.js` (12 scenarios, 3 per area); the logic and UI are in `midterm.js`.

## How a quiz works

- **Formats:** Quiz 2 (25 MC + 2 short answer, the default, with Modules 5–8 selected), Quiz 1 (15 + 3), Quick (8 + 2) or Long (24 + 6). The "exam pace" timer keeps the real quiz's time per question: 30 minutes for 27 questions when any of Modules 5–8 is selected, otherwise 40 minutes for 18. It submits the quiz when time runs out. You can move freely between questions, as in the real quiz.
- **Always a different quiz:** questions you have seen least come first, so 12 Quiz 2 attempts cover all 180 Module 5–8 questions. A quiz counts as seen as soon as it starts, and the next one never repeats any of its questions. The setup screen shows how many questions of the selected modules you have seen.
- **Mix:** about 1 in 5 multiple-choice questions asks you to interpret a test result (e.g., r and p) or a data table. Questions come in this order: theory, then output interpretation, then the short answers.
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

The tests check that the question bank is well formed, that every Module 5–8 model answer earns full marks under its rubric, that the Quiz 1 and Quiz 2 formats have the right number of questions in the right order, that 12 Quiz 2 attempts cover Modules 5–8, that two quizzes in a row never share a question, that each module can fill the long format on its own, that grading still matches after the options are shuffled, and that short answers get the right partial credit. CI runs them on every push.

## Project structure

```
index.html        page shell
styles.css        light/dark theme, responsive layout
questions.js      question bank (edit here to add questions)
quiz.js           pure logic: selection, shuffling, scoring
app.js            UI: setup → quiz → self-grading → results
midterm.html      midterm simulator page
midterm-bank.js   scenario bank (4 areas × 3 scenarios)
midterm.js        midterm logic + UI
study-guide.html  study guide page
theory.html       theory recap page
test/             node:test suite
```

When you change a script or `styles.css`, bump the `?v=` version on their links in `index.html`. GitHub Pages lets browsers cache each file for 10 minutes, so without it a browser can mix a new file with an old one.

### Adding a question

Append an object to `QUESTIONS` in `questions.js`:

```js
{
  id: "m4-40", module: 4, type: "mc", kind: "theory",   // kind: "theory" | "code" (data table / test result)
  prompt: "…", code: "optional data table or test result",
  options: ["correct", "distractor", "distractor", "distractor"],
  answer: 0,                                            // index into options
  explanation: "Why the answer is correct.",
}
```

Short-answer questions use `type: "open"` with `modelAnswer` and `keyPoints: [{ text, keywords: [] }]`. Run `npm test` to validate the bank.

## Disclaimer

This is an unofficial study aid. The questions are written from the Module 1–8 readings, the Session 4 activities and the Module 6–8 class activities, and they are not the professor's actual quiz.

## License

[MIT](LICENSE)
