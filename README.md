# Data Analytics Quiz Simulator

A practice simulator for **Principles of Data Analytics Quiz 2** (Tuesday, November 24, 2026). Every quiz covers **Modules 5–8** (probability, hypothesis testing, ANOVA and non-parametric tests), like the real quiz. The default **Quick** practice gives 5 multiple-choice questions and 1 short answer, **Multiple choice** and **Quick open** practise one question type at a time, and **Real Quiz 2** mimics the exam itself: 25 multiple-choice and 2 short-answer questions, a **30-minute timer** and automatic submission when time runs out. Questions come from a bank of 180, every new quiz shows the questions you have seen least, every attempt is scored, and every question comes with an explanation.

**Live:** https://alanjuker.github.io/data-analytics-quiz-simulator/ · **[Quiz 2 study guide](study-guide.html)**

| Module | Topics |
| --- | --- |
| 5 · Probability for decision making | Probability basics, binomial (conditions, n × p), Poisson (λ, counts per interval), normal distribution, 68-95-99.7 rule, Central Limit Theorem, z-scores and the Z-table, limits of the normal distribution and how to handle them |
| 6 · Hypothesis testing | H₀ vs Ha, one- vs two-tailed tests, critical values, p-value vs critical value approach, z-test vs t-test, Type I/II errors, α, β and power, one-sample, independent (Levene's test, Welch) and paired t-tests from the class activity, confidence intervals |
| 7 · ANOVA | Why ANOVA instead of many t-tests, F-ratio, between vs within variance, assumptions (residual normality, Levene's test, Welch's ANOVA), post hoc tests, one-way vs two-way ANOVA, main and interaction effects, η² |
| 8 · Non-parametric tests | Parametric vs non-parametric, ranks, Mann–Whitney U, Wilcoxon signed-rank, Kruskal–Wallis, Friedman, Scheirer–Ray–Hare and ART ANOVA, choosing the right test, reading their outputs |

The **[study guide](study-guide.html)** is organised as chapters with a key idea and short topic cards, a contents menu that follows your reading, and diagrams: the normal curve with the 68-95-99.7 rule, Z-table areas, one- vs two-tailed rejection regions, the Central Limit Theorem, what makes F large, and interaction plots. It also has the quiz format and a time plan, how to answer, comparison cards (binomial vs Poisson vs normal, z vs t, the three t-tests, parametric vs non-parametric), a Type I/II error grid, an "Every test, one by one" chapter (each test next to its non-parametric twin, same vs different people, helper tests like Levene's and Shapiro–Wilk, where the direction comes from, and right vs wrong wording for each test), a test chooser, an output cheat sheet, common traps, formulas and a recall check.

### Modules 1–4 (hidden for now)

The site only shows Quiz 2 material. The Modules 1–4 material is kept for a later full exam but is not linked from the site: the 207 questions in `questions.js`, the [midterm simulator](midterm.html), the [theory recap](theory.html) and the [midterm study guide](study-guide-midterm.html). To show those modules again, add them back to `MODULES` in `app.js`.

## How a quiz works

- **Lengths:** Quick (5 MC + 1 short answer, 9 minutes, the default), Multiple choice (5 MC, 4 minutes), Quick open (1 short answer, 5 minutes) or Real Quiz 2 (25 + 2, 30 minutes). The timer always runs, at the real quiz's pace for each question type (about 45 seconds per multiple choice, 4–5 minutes per short answer), and submits the quiz when time runs out. You can move freely between questions, as in the real quiz.
- **Always a different quiz, never random:** each quiz takes the questions you have completed the fewest times, then the ones done longest ago, following a fixed walk through the bank that rotates through Modules 5–8. Nothing repeats until you have done every question (12 Real Quiz 2 attempts cover all 180), and every Real Quiz 2 mixes all four modules. The setup screen shows how many questions you have seen.
- **Unfinished quizzes come back:** a quiz counts only once it is submitted (by you or when time runs out), so if you leave one unfinished, the next start gives you the same questions.
- **Mix:** about 1 in 5 multiple-choice questions asks you to interpret a test result (e.g., a t-test, ANOVA or Kruskal–Wallis output) or a data table. Questions come in this order: theory, then output interpretation, then the short answers.
- **Style:** the questions test understanding, not memorisation. You identify the concept, choose the right test or chart, or interpret a result, and there is no arithmetic. Short-answer questions ask one thing each and can be answered in 2–3 sentences.
- **Setup:** the modules are fixed to 5–8, as in Quiz 2, and the timer always runs. Just choose the length.
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

The tests check that the question bank is well formed, that every Module 5–8 model answer earns full marks under its rubric, that the Quiz 1 and Quiz 2 formats have the right number of questions in the right order, that selection is deterministic and an unfinished quiz repeats, that every Quiz 2 mixes all four modules, that 12 Quiz 2 attempts cover Modules 5–8, that two quizzes in a row never share a question, that each module can fill the long format on its own, that grading still matches after the options are shuffled, and that short answers get the right partial credit. CI runs them on every push.

## Project structure

```
index.html        page shell
styles.css        light/dark theme, responsive layout
questions.js      question bank, Modules 1–8 (edit here to add questions)
quiz.js           pure logic: selection, shuffling, scoring
app.js            UI: setup → quiz → self-grading → results
midterm.html      midterm simulator page (Modules 1–4, not linked)
midterm-bank.js   scenario bank (4 areas × 3 scenarios)
midterm.js        midterm logic + UI
study-guide.html  Quiz 2 study guide (Modules 5–8)
guide.css         styles for the Quiz 2 study guide
study-guide-midterm.html  midterm study guide (Modules 1–4, not linked)
theory.html       theory recap page (Modules 1–4, not linked)
test/             node:test suite
```

When you change a script or `styles.css`, bump the `?v=` version on their links in `index.html` (and on the stylesheet links in `study-guide.html`). GitHub Pages lets browsers cache each file for 10 minutes, so without it a browser can mix a new file with an old one.

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
