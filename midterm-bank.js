// Scenario bank for the midterm simulator (Modules 1-4).
// Each attempt draws one scenario per cluster, so every exam covers all four skill areas.
// Schema: { id, cluster, title, context, exhibit, parts: [{ prompt, skill, modelAnswer, keyPoints: [{ text, keywords[] }] }] }
// Keywords are lowercase substrings used to pre-tick key points; the student confirms them.

const CLUSTERS = {
  quality: "Data quality & preparation",
  describe: "Describing & visualizing data",
  test: "Choosing & justifying a test",
  interpret: "Interpreting results & drawing conclusions",
};

const SKILLS = [
  "Data quality",
  "Measurement levels",
  "Choosing an approach",
  "Assumptions",
  "Significance vs strength",
  "Association vs causation",
  "Conclusions",
];

const SCENARIOS = [
  // ───────────────────────── Data quality & preparation ─────────────────────────
  {
    id: "A1", cluster: "quality",
    title: "Clinic patient-satisfaction records",
    context: "A clinic merged its appointment system with a patient survey to study satisfaction. The manager wants to report results to the board next week. You receive the extract below.",
    exhibit:
`PatientID  VisitDate    Age  Gender  Satisfaction(1-5)  Wait(min)  Income
P-1041     03/14/2026    34  F       4                  22         52,000
P-1042     2026-03-14   245  Female  5                  15         .
P-1043     14 Mar 2026   71  M       6                  40         .
P-1041     03/14/2026    34  F       4                  22         52,000
P-1044     03/15/2026    68  f       2                  95         .

Full file: N = 1,200 records. Income is missing for 18% of records;
82% of the missing incomes belong to patients aged 65 or older.`,
    parts: [
      {
        prompt: "Identify three data-quality problems in the extract and name the quality dimension each one violates.",
        skill: "Data quality",
        modelAnswer: "(1) P-1041 appears twice: a duplicate record that would double-count that patient. Remove or merge it. (2) Age 245 and a satisfaction score of 6 on a 1–5 scale are impossible values, so accuracy is violated. Correct them from the source or treat them as missing. (3) Gender is coded F / Female / f and dates appear in three formats, so consistency is violated. Standardize the codes and formats before analysis.",
        keyPoints: [
          { text: "Duplicate record (P-1041) identified, with removal or merging", keywords: ["duplicat", "twice", "p-1041", "repeated"] },
          { text: "Impossible or out-of-range values (age 245, satisfaction 6) linked to accuracy", keywords: ["245", "accura", "out of range", "out-of-range", "impossible", "invalid"] },
          { text: "Inconsistent coding or formats (F/Female/f, dates) linked to consistency, with standardization", keywords: ["consisten", "standardi", "format"] },
        ],
      },
      {
        prompt: "Income is missing for 18% of records, mostly for patients aged 65+. What type of missingness is this most likely, and how should it be handled?",
        skill: "Data quality",
        modelAnswer: "The missingness depends on another observed variable (age), so it is most likely MAR (missing at random), not MCAR. Little's MCAR test would probably give p ≤ .05, rejecting MCAR. Mean imputation or simple deletion would bias income downward or upward for older patients. Multiple imputation or regression imputation using age is more appropriate, possibly with a flag variable for imputed values.",
        keyPoints: [
          { text: "Classified as MAR because missingness depends on observed age", keywords: ["mar", "missing at random", "depends on age", "related to age"] },
          { text: "Explains that deletion or mean imputation would bias results", keywords: ["bias", "mean imputation", "underestimat", "delet"] },
          { text: "Recommends multiple or regression imputation (or Little's MCAR test to check)", keywords: ["multiple imputation", "regression imputation", "little", "imputation"] },
        ],
      },
      {
        prompt: "State the measurement level of Gender, Satisfaction (1–5), Age and Wait (minutes).",
        skill: "Measurement levels",
        modelAnswer: "Gender is nominal (categories with no order). Satisfaction is ordinal (ordered ratings, but the gaps between ratings are not guaranteed to be equal). Age and wait time are ratio (equal intervals and a true zero, so 40 minutes is twice 20 minutes).",
        keyPoints: [
          { text: "Gender = nominal", keywords: ["nominal"] },
          { text: "Satisfaction = ordinal", keywords: ["ordinal"] },
          { text: "Age and wait time = ratio (true zero)", keywords: ["ratio", "true zero"] },
        ],
      },
      {
        prompt: "The manager wants to report the \"average satisfaction\" as a mean of 3.9. Advise them.",
        skill: "Choosing an approach",
        modelAnswer: "Satisfaction is ordinal, so a mean assumes equal distances between ratings that may not exist. Report the median and mode, or the percentage of patients rating 4–5. The ratings should also be cleaned first, because the impossible 6 would inflate the result.",
        keyPoints: [
          { text: "Notes the mean assumes equal intervals that ordinal data lacks", keywords: ["ordinal", "equal interval", "equal distance"] },
          { text: "Recommends median/mode or percentage satisfied", keywords: ["median", "mode", "percent", "%"] },
          { text: "Mentions cleaning the invalid value first", keywords: ["clean", "invalid", "remove the 6", "error"] },
        ],
      },
    ],
  },
  {
    id: "A2", cluster: "quality",
    title: "Online retailer: order data for a 2026 pricing decision",
    context: "A retailer wants to set 2026 delivery fees. The analyst merged order exports from two regional systems (US and Canada) that were originally built for accounting.",
    exhibit:
`Order value summary (merged file, N = 84,300 orders, years 2019-2020)
  Q1 = $35   Median = $72   Q3 = $180   Mean = $214   Max = $48,000
  2.1% of OrderIDs appear in both regional exports
  Currency column: USD for US orders, CAD for Canadian orders (not converted)`,
    parts: [
      {
        prompt: "Evaluate whether this dataset is fit for the 2026 decision. Refer to at least three data-quality dimensions.",
        skill: "Data quality",
        modelAnswer: "Timeliness: the orders are from 2019–2020, so prices and shopping behavior may have changed by 2026. Consistency: values are in two currencies that have not been converted, so totals and averages are meaningless until they are standardized. Accuracy and consistency: 2.1% duplicate orders from the merge would double-count sales and must be removed. Relevance and reliability: the data was built for accounting, so it may lack delivery-related variables.",
        keyPoints: [
          { text: "Timeliness: 2019–2020 data may be outdated for 2026", keywords: ["timel", "outdated", "2019", "old data", "current"] },
          { text: "Consistency: mixed USD/CAD must be converted", keywords: ["currenc", "usd", "cad", "convert"] },
          { text: "Duplicates from the merge must be removed", keywords: ["duplicat", "double"] },
          { text: "Relevance/reliability: collected for another purpose (accounting)", keywords: ["relevan", "reliab", "accounting", "secondary", "purpose"] },
        ],
      },
      {
        prompt: "Using the IQR rule, which order values are potential outliers? How should they be treated?",
        skill: "Data quality",
        modelAnswer: "IQR = 180 − 35 = 145, so the upper fence is 180 + 1.5 × 145 = $397.50. Orders above about $398 are potential outliers, including the $48,000 order. First investigate whether they are errors, for example a currency or entry mistake. Genuine large orders should not simply be deleted. Use a log transformation or winsorization to limit their influence, or report robust statistics.",
        keyPoints: [
          { text: "Computes the fence: Q3 + 1.5 × IQR ≈ $397.50", keywords: ["397", "1.5", "iqr"] },
          { text: "Investigate cause (error vs genuine) before acting", keywords: ["investigat", "check", "error", "genuine", "valid"] },
          { text: "Treatment: log transform or winsorize rather than automatic deletion", keywords: ["log", "winsor", "transform"] },
        ],
      },
      {
        prompt: "Which statistic best describes a \"typical\" order, and why?",
        skill: "Choosing an approach",
        modelAnswer: "The median ($72). The mean ($214) is far above the median because a few very large orders pull it up: the distribution is right-skewed. The median resists extreme values. Pair it with the IQR as the measure of spread.",
        keyPoints: [
          { text: "Chooses the median", keywords: ["median"] },
          { text: "Explains mean > median signals right skew / outliers", keywords: ["skew", "outlier", "pulled", "extreme"] },
          { text: "Uses IQR (not SD) for spread", keywords: ["iqr", "interquartile"] },
        ],
      },
      {
        prompt: "Is this primary or secondary data? What is one advantage and one risk of using it here?",
        skill: "Data quality",
        modelAnswer: "It is secondary data: collected by the accounting systems for a different purpose. The advantage is that it is fast and cheap, with a large volume already available. The risk is that it may not match the research question (no delivery-cost or customer-preference variables) and its quality is outside the analyst's control. A small primary survey on delivery preferences could fill the gap.",
        keyPoints: [
          { text: "Identifies secondary data", keywords: ["secondary"] },
          { text: "Advantage: quick, low cost, large volume", keywords: ["cheap", "low cost", "quick", "fast", "available", "cost-effective"] },
          { text: "Risk: may not fit the question / quality not controlled", keywords: ["not fit", "purpose", "align", "control", "missing variable", "not designed"] },
        ],
      },
    ],
  },
  {
    id: "A3", cluster: "quality",
    title: "HR wellbeing study",
    context: "HR combined its records with an engagement survey to see whether overtime is related to engagement. The variables are listed below.",
    exhibit:
`Variable             Example values                      Missing
Department           Sales, IT, HR, Finance              0%
Job level            Junior, Mid, Senior, Lead           0%
Engagement (1-7)     1 = very low ... 7 = very high      9%
Overtime hrs/week    0 - 32                              1%
Annual salary ($)    38,000 - 210,000                    0%

Exit interviews show that most employees who skipped the engagement
survey described themselves as disengaged.`,
    parts: [
      {
        prompt: "Give the measurement level of each variable and an appropriate measure of central tendency for each.",
        skill: "Measurement levels",
        modelAnswer: "Department is nominal, so use the mode. Job level is ordinal, so use the median (or mode). Engagement is a single 1–7 rating, so it is ordinal and the median is appropriate. Overtime hours and salary are ratio: use the mean if roughly symmetric, otherwise the median. Salary is usually right-skewed, so the median fits better.",
        keyPoints: [
          { text: "Department nominal → mode", keywords: ["nominal"] },
          { text: "Job level and engagement ordinal → median", keywords: ["ordinal"] },
          { text: "Overtime and salary ratio → mean (median if skewed)", keywords: ["ratio"] },
        ],
      },
      {
        prompt: "What type of missingness affects Engagement, and what are the consequences for the analysis?",
        skill: "Data quality",
        modelAnswer: "Missingness depends on the engagement level itself: disengaged employees did not respond. That makes it MNAR (missing not at random). Mean imputation or deletion would make the workforce look more engaged than it is. Imputation is risky; the analyst should report this limitation, consider model-based approaches or sensitivity analysis, and avoid presenting the engagement average as representative.",
        keyPoints: [
          { text: "Classified as MNAR (depends on the unobserved value itself)", keywords: ["mnar", "not at random"] },
          { text: "Explains the bias: results look more engaged than reality", keywords: ["bias", "overestimat", "more engaged", "inflat"] },
          { text: "Imputation is risky; report limitation / sensitivity analysis / modelling", keywords: ["risky", "limitation", "sensitivity", "model", "cannot simply"] },
        ],
      },
      {
        prompt: "How should Department and Job level be encoded for analysis? Explain the risk of the wrong choice.",
        skill: "Choosing an approach",
        modelAnswer: "Department is nominal, so use one-hot encoding (one 0/1 column per department). Label encoding (Sales = 1, IT = 2…) would invent an order and distances that do not exist. Job level is ordinal, so ordinal encoding (Junior = 1 … Lead = 4) preserves the natural order.",
        keyPoints: [
          { text: "One-hot encoding for Department", keywords: ["one-hot", "one hot", "dummy"] },
          { text: "Ordinal encoding for Job level", keywords: ["ordinal encod", "1 to 4", "1-4", "preserv", "order"] },
          { text: "Label encoding of nominal data creates a false order", keywords: ["false order", "label encod", "invent", "imply an order", "artificial"] },
        ],
      },
      {
        prompt: "HR wants to combine salary and overtime into one index. Why must they be rescaled first, and which method would you choose?",
        skill: "Data quality",
        modelAnswer: "Salary is in tens of thousands while overtime is 0–32, so without rescaling salary would dominate the index. Z-score standardization puts both on a common scale (mean 0, SD 1) and is less affected by outliers than min–max scaling. Min–max scaling to 0–1 is sensitive to extreme salaries, which would squeeze most values into a narrow band.",
        keyPoints: [
          { text: "Different units/ranges: salary would dominate", keywords: ["scale", "unit", "range", "dominat", "magnitude"] },
          { text: "Z-score standardization chosen", keywords: ["z-score", "z score", "standardi"] },
          { text: "Min–max is sensitive to outliers", keywords: ["min-max", "min–max", "minmax", "sensitive", "outlier"] },
        ],
      },
    ],
  },

  // ───────────────────────── Describing & visualizing data ─────────────────────────
  {
    id: "B1", cluster: "describe",
    title: "Food-delivery times",
    context: "A delivery company sampled 400 orders from March to report delivery performance to management.",
    exhibit:
`Delivery time (minutes), n = 400
  Mean = 52   Median = 38   Mode = 35   SD = 41   Skewness = 2.3
  Min = 12    Q1 = 29       Q3 = 58     Max = 410`,
    parts: [
      {
        prompt: "Describe the shape of the distribution and what it means in practical terms.",
        skill: "Choosing an approach",
        modelAnswer: "The distribution is strongly right-skewed: skewness is 2.3 and mean (52) > median (38) > mode (35). Most deliveries take about 30–60 minutes, but a long right tail of very late deliveries (up to 410 minutes) pulls the mean up.",
        keyPoints: [
          { text: "Right-skewed / positively skewed", keywords: ["right", "positive"] },
          { text: "Evidence: mean > median > mode and skewness 2.3", keywords: ["mean > median", "mean is greater", "mean is higher", "2.3", "mean larger"] },
          { text: "Practical meaning: most are typical, a few very late deliveries", keywords: ["few", "tail", "late", "extreme", "long"] },
        ],
      },
      {
        prompt: "Which measures of center and spread should be reported to management? Justify your choice.",
        skill: "Choosing an approach",
        modelAnswer: "Report the median (38 minutes) with the IQR (29–58 minutes, IQR = 29). Both resist the extreme values. The mean and SD are inflated by a few very long deliveries, so they overstate the typical delivery time and the variability.",
        keyPoints: [
          { text: "Median for center", keywords: ["median"] },
          { text: "IQR for spread", keywords: ["iqr", "interquartile"] },
          { text: "Mean/SD distorted by outliers or skew", keywords: ["outlier", "skew", "inflat", "distort", "extreme"] },
        ],
      },
      {
        prompt: "Using the IQR rule, which delivery times are outliers, and how should they be handled?",
        skill: "Data quality",
        modelAnswer: "IQR = 58 − 29 = 29, so the upper fence is 58 + 1.5 × 29 = 101.5 minutes. Deliveries over about 102 minutes are outliers, including the 410-minute one. Check whether they are recording errors (for example, an order never closed). If they are genuine, keep them and report them separately, because late deliveries matter to the business.",
        keyPoints: [
          { text: "Fence ≈ 101.5 minutes (Q3 + 1.5 × IQR)", keywords: ["101", "1.5"] },
          { text: "Investigate error vs genuine", keywords: ["error", "genuine", "investigat", "check", "verify"] },
          { text: "Do not delete genuine late deliveries blindly; they are business-relevant", keywords: ["keep", "retain", "report separately", "relevant", "not delete", "don't delete"] },
        ],
      },
      {
        prompt: "Is this a population or a sample? What can and cannot be concluded about all deliveries?",
        skill: "Conclusions",
        modelAnswer: "It is a sample of 400 orders from one month, not every delivery the company makes. Descriptive statistics describe these 400 orders. Generalizing to all deliveries needs inferential statistics and a representative sample. A single month (March) may not represent other seasons, so the conclusions should be limited to March unless more months are sampled at random.",
        keyPoints: [
          { text: "Identifies a sample", keywords: ["sample"] },
          { text: "Generalizing requires inferential statistics / representativeness", keywords: ["inferential", "generaliz", "represent"] },
          { text: "One month may introduce bias (seasonality)", keywords: ["month", "season", "march", "bias"] },
        ],
      },
    ],
  },
  {
    id: "B2", cluster: "describe",
    title: "Mobile-app satisfaction survey",
    context: "A product team surveyed app users. The survey was sent only to users who had opened the app in the last 7 days.",
    exhibit:
`Satisfaction            Count       Device    Count
Very dissatisfied         18        iOS         260
Dissatisfied              42        Android     190
Neutral                   95        Web          50
Satisfied                210
Very satisfied           135        Total       500

Draft chart in the report: "% Satisfied or Very satisfied" by device,
iOS = 84%, Android = 82%; the y-axis starts at 80%.`,
    parts: [
      {
        prompt: "State the measurement level of Satisfaction and Device, and which summaries are appropriate for each.",
        skill: "Measurement levels",
        modelAnswer: "Satisfaction is ordinal: ordered categories with unequal or unknown gaps. Use the median category (Satisfied), the mode, and percentages. Device is nominal: use counts, percentages and the mode (iOS). A mean is not appropriate for either variable.",
        keyPoints: [
          { text: "Satisfaction ordinal → median/mode/percentages", keywords: ["ordinal"] },
          { text: "Device nominal → counts/percentages/mode", keywords: ["nominal"] },
          { text: "No mean for these variables", keywords: ["not the mean", "no mean", "mean is not", "cannot use the mean", "mean isn't", "not mean"] },
        ],
      },
      {
        prompt: "Critique the draft chart and explain how to fix it.",
        skill: "Conclusions",
        modelAnswer: "Starting the y-axis at 80% exaggerates a 2-point difference: iOS looks about twice as high as Android. That is a misleading, truncated scale. Start the axis at 0, or show the values as labeled numbers, and note that the gap is small. Integrity matters more than visual impact.",
        keyPoints: [
          { text: "Truncated/misleading axis exaggerates the difference", keywords: ["truncat", "mislead", "exaggerat", "80%", "axis"] },
          { text: "Fix: start at zero or label the actual values", keywords: ["zero", "0", "label"] },
          { text: "The real difference is small (2 points)", keywords: ["small", "2 point", "two point", "only 2", "2%"] },
        ],
      },
      {
        prompt: "Recommend a chart to compare the satisfaction distribution across devices, and justify it.",
        skill: "Choosing an approach",
        modelAnswer: "Use a 100% stacked bar chart (one bar per device, segments for each satisfaction level in order) or a clustered bar chart. Bars compare categories directly, and 100% stacking adjusts for the different group sizes. Avoid three separate pie charts: angles are hard to compare across pies.",
        keyPoints: [
          { text: "Stacked (100%) or clustered bar chart", keywords: ["bar"] },
          { text: "Justification: compares categories / adjusts for group size", keywords: ["compar", "group size", "proportion", "percent"] },
          { text: "Avoid pie charts (or 3D) for this comparison", keywords: ["pie", "3d"] },
        ],
      },
      {
        prompt: "What sampling problem affects these results, and how would you fix it?",
        skill: "Data quality",
        modelAnswer: "Only active users (opened the app in the last 7 days) were surveyed. That is selection or sampling bias: dissatisfied users who stopped using the app are excluded, so satisfaction is probably overestimated. Draw a random sample of all registered users, stratified by device so that Web users are well represented.",
        keyPoints: [
          { text: "Selection/sampling bias: only active users", keywords: ["bias", "active", "selection", "not representative"] },
          { text: "Satisfaction likely overestimated", keywords: ["overestimat", "inflat", "higher than", "too positive"] },
          { text: "Fix: random (stratified) sample of all users", keywords: ["random", "stratif"] },
        ],
      },
    ],
  },
  {
    id: "B3", cluster: "describe",
    title: "Two store branches' daily revenue",
    context: "A regional manager compares two branches over the same 90 days to decide where to send extra staff.",
    exhibit:
`Daily revenue ($), 90 days each
             Mean    Median   SD      Skewness   Min     Max
Branch A    5,200    5,180    400      0.1      4,250    6,150
Branch B    5,200    4,600   1,900     1.4      2,100   12,800`,
    parts: [
      {
        prompt: "Compare the two branches using center, spread and shape.",
        skill: "Choosing an approach",
        modelAnswer: "Both branches have the same mean ($5,200), but they differ a lot. Branch A is stable and symmetric (SD 400, median ≈ mean, skew 0.1). Branch B is far more variable (SD 1,900, range $2,100–$12,800) and right-skewed (skew 1.4, median $4,600 < mean). On a typical day B earns less than A, but it has occasional very high days.",
        keyPoints: [
          { text: "Same mean but different spread (SD 400 vs 1,900)", keywords: ["sd", "standard deviation", "spread", "variab"] },
          { text: "Branch B right-skewed, A symmetric", keywords: ["skew", "symmetric"] },
          { text: "B's typical (median) day is lower than A's", keywords: ["median", "typical"] },
        ],
      },
      {
        prompt: "For which branch is the mean a good summary? What should be reported for the other?",
        skill: "Choosing an approach",
        modelAnswer: "For Branch A: its data are symmetric with low spread, so the mean is representative. For Branch B, the mean is pulled up by a few very high days. Report the median ($4,600) and the IQR, and mention the peak days separately.",
        keyPoints: [
          { text: "Mean appropriate for Branch A", keywords: ["branch a", "a is", "for a"] },
          { text: "Median (and IQR) for Branch B", keywords: ["median"] },
          { text: "Reason: B's skew / extreme days distort the mean", keywords: ["skew", "extreme", "outlier", "pulled"] },
        ],
      },
      {
        prompt: "Describe what Branch B's boxplot would look like and how to read it.",
        skill: "Choosing an approach",
        modelAnswer: "The median line would sit closer to Q1 (the lower edge of the box), with a long upper whisker. Points beyond Q3 + 1.5 × IQR (the very high days) would appear as individual outlier dots above the whisker. The box shows the middle 50% of days (IQR). The unequal whiskers and off-center median show right skew.",
        keyPoints: [
          { text: "Median off-center toward the bottom of the box", keywords: ["median", "off-center", "closer to q1", "lower"] },
          { text: "Long upper whisker / outlier dots above", keywords: ["whisker", "dot", "outlier"] },
          { text: "Box = IQR / middle 50%; outliers beyond 1.5 × IQR", keywords: ["iqr", "50%", "1.5", "middle"] },
        ],
      },
      {
        prompt: "What kind of data structure is this (time-series, cross-sectional or panel), and why does it matter?",
        skill: "Measurement levels",
        modelAnswer: "It is panel data: two entities (branches) observed over 90 time points. Each branch alone is a time series. That matters because days are not independent: weekends, promotions and trends can create patterns. Comparing the branches should account for time effects, for example comparing the same weekdays.",
        keyPoints: [
          { text: "Panel data (multiple entities over time)", keywords: ["panel"] },
          { text: "Each branch is a time series / time dimension", keywords: ["time series", "time-series", "over time"] },
          { text: "Implication: time patterns / non-independence must be considered", keywords: ["weekend", "trend", "season", "independ", "pattern"] },
        ],
      },
    ],
  },

  // ───────────────────────── Choosing & justifying a test ─────────────────────────
  {
    id: "C1", cluster: "test",
    title: "Study hours and exam scores",
    context: "An instructor recorded weekly study hours and final exam scores (0–100) for 28 students. The scatterplot rises roughly in a straight line, except for one student who studied 40 hours and scored 35.",
    exhibit:
`n = 28
Pearson r   = .21, p (2-tailed) = .28
Spearman ρ  = .48, p (2-tailed) = .010`,
    parts: [
      {
        prompt: "Identify the measurement level of both variables and the candidate correlation test.",
        skill: "Measurement levels",
        modelAnswer: "Study hours and exam score are both ratio variables (continuous, with a true zero). Two continuous variables make Pearson's r the default candidate, provided its assumptions hold.",
        keyPoints: [
          { text: "Both variables ratio / continuous", keywords: ["ratio", "continuous", "interval"] },
          { text: "Pearson's r as the candidate test", keywords: ["pearson"] },
        ],
      },
      {
        prompt: "Which Pearson assumptions are at risk here, and which test should be reported instead? Justify.",
        skill: "Assumptions",
        modelAnswer: "Pearson assumes linearity, approximately normal data, continuous variables and no extreme outliers. The 40-hour / 35-point student is an extreme outlier, and Pearson is very sensitive to outliers. The small sample (n = 28 < 30) also makes normality harder to rely on. First check whether the outlier is an error. If it is genuine, report Spearman's ρ, which uses ranks, is robust to outliers and needs no normality.",
        keyPoints: [
          { text: "Outlier violates Pearson's 'no extreme outliers' assumption", keywords: ["outlier"] },
          { text: "Normality / small sample concern", keywords: ["normal", "small sample", "n = 28", "28"] },
          { text: "Report Spearman (robust, ranks, no normality needed)", keywords: ["spearman"] },
          { text: "Check whether the outlier is an error first", keywords: ["error", "check", "verify", "investigat"] },
        ],
      },
      {
        prompt: "Write H₀ and H₁. Should the test be one- or two-tailed?",
        skill: "Choosing an approach",
        modelAnswer: "H₀: there is no correlation between study hours and exam score (ρ = 0). H₁: there is a correlation (ρ ≠ 0). Use a two-tailed test, the default, unless a positive direction was specified before the data were collected. Switching to one-tailed after seeing the data is p-hacking.",
        keyPoints: [
          { text: "H₀: no correlation", keywords: ["no correlation", "no relationship", "= 0", "no association"] },
          { text: "H₁: a correlation exists", keywords: ["is a correlation", "there is a relationship", "≠ 0", "not equal", "correlation exists"] },
          { text: "Two-tailed by default; one-tailed only if pre-specified", keywords: ["two-tailed", "two tailed", "2-tailed", "before"] },
        ],
      },
      {
        prompt: "Interpret Spearman's ρ = .48, p = .010 in plain language, including what it does not prove.",
        skill: "Significance vs strength",
        modelAnswer: "There is a moderate, positive, monotonic relationship: students who study more tend to score higher. It is statistically significant (p = .010 < .05), so it is unlikely to be due to chance alone. It does not prove that studying causes higher scores: motivation or prior knowledge could drive both.",
        keyPoints: [
          { text: "Moderate positive monotonic relationship", keywords: ["moderate", "positive"] },
          { text: "Statistically significant (p < .05)", keywords: ["significant", ".05", "0.05"] },
          { text: "Association, not causation (possible confounder)", keywords: ["caus", "confound", "motivation"] },
        ],
      },
    ],
  },
  {
    id: "C2", cluster: "test",
    title: "Region and subscription plan (pilot study)",
    context: "Marketing ran a pilot with 180 customers to see whether the chosen subscription plan differs by region.",
    exhibit:
`Observed counts      Basic   Plus   Premium   Total
North                  42     14      4        60
South                  44     21      5        70
East                   20      8      2        30
West                   14      5      1        20
Total                 120     48     12       180

SPSS note: 4 cells (33.3%) have expected count less than 5.
The minimum expected count is 1.33.

After merging Plus + Premium into "Upgraded":
Chi-square(3) = 0.86, p = .84, Cramér's V = .07`,
    parts: [
      {
        prompt: "Which statistical test fits this question, and why not Pearson's r?",
        skill: "Choosing an approach",
        modelAnswer: "Both region and plan are nominal (categorical) variables summarized as counts in a contingency table. The chi-square test of independence fits, with Cramér's V for strength. Pearson's r needs two continuous (interval or ratio) variables, so it cannot be used.",
        keyPoints: [
          { text: "Both variables categorical / nominal counts", keywords: ["categorical", "nominal", "count"] },
          { text: "Chi-square test of independence", keywords: ["chi"] },
          { text: "Pearson needs continuous variables", keywords: ["continuous", "interval", "ratio"] },
        ],
      },
      {
        prompt: "Check the chi-square assumptions. What does the SPSS note mean, and what should be done?",
        skill: "Assumptions",
        modelAnswer: "Chi-square needs categorical count data, independent observations (each customer in one cell only) and expected counts of at least 5 in at least 80% of cells. Here 33.3% of cells have expected counts below 5 (minimum 1.33), so the last assumption is violated and the p-value is unreliable. Merge sparse categories (as was done with Plus + Premium) or collect more data. Fisher's exact test is an option for 2×2 tables.",
        keyPoints: [
          { text: "Rule: expected count ≥ 5 in at least 80% of cells", keywords: ["80%", "expected", "at least 5", "less than 5", "< 5"] },
          { text: "Assumption violated (33.3% of cells)", keywords: ["violat", "33", "not met", "unreliable"] },
          { text: "Fix: combine categories / more data / Fisher's exact", keywords: ["combin", "merg", "fisher", "more data", "larger sample"] },
          { text: "Independence: each customer counted once", keywords: ["independ", "once", "one cell"] },
        ],
      },
      {
        prompt: "Interpret the result after merging: χ²(3) = 0.86, p = .84, V = .07.",
        skill: "Significance vs strength",
        modelAnswer: "The result is not significant (p = .84 > .05), so there is no evidence that plan choice differs by region in this pilot. Cramér's V = .07 also indicates a very weak association. With only 180 customers the test has limited power, so this means no evidence of an association, not proof that there is none.",
        keyPoints: [
          { text: "Not statistically significant (p > .05)", keywords: ["not significant", "not statistically", "p > .05", "fail to reject", "insignificant"] },
          { text: "Cramér's V = .07 → very weak association", keywords: ["weak", "small"] },
          { text: "Absence of evidence ≠ evidence of absence (small pilot / power)", keywords: ["power", "pilot", "small sample", "absence", "not prove", "doesn't prove", "does not prove"] },
        ],
      },
      {
        prompt: "Marketing says: \"If the full study is significant, it will prove that region causes plan choice.\" Respond.",
        skill: "Association vs causation",
        modelAnswer: "Even a significant chi-square shows only an association between region and plan, not causation. Regional differences in income, urban versus rural mix or competitor presence could explain plan choice (confounders). Supporting a causal claim needs a design that controls those factors, such as an experiment with randomized offers.",
        keyPoints: [
          { text: "Chi-square shows association only, not causation", keywords: ["association", "not caus", "does not prove", "doesn't prove"] },
          { text: "Names plausible confounders (income, urban/rural, competitors)", keywords: ["confound", "income", "urban", "rural", "competitor"] },
          { text: "Causal claims need an experiment / control of confounders", keywords: ["experiment", "random", "control"] },
        ],
      },
    ],
  },
  {
    id: "C3", cluster: "test",
    title: "Job level and satisfaction rank (small team)",
    context: "A team lead asks whether more senior employees in a 15-person team are more satisfied. Job level is coded 1 (Junior) to 4 (Lead); satisfaction is each person's rank from a peer survey, with many tied ranks.",
    exhibit:
`n = 15
Kendall's τ-b = .41, p (2-tailed) = .04`,
    parts: [
      {
        prompt: "What is the measurement level of each variable?",
        skill: "Measurement levels",
        modelAnswer: "Both variables are ordinal. Job level has a natural order (Junior < Mid < Senior < Lead), but the distances between levels are not equal. The satisfaction ranks are also ordered without equal gaps.",
        keyPoints: [
          { text: "Both ordinal", keywords: ["ordinal"] },
          { text: "Ordered but unequal/unknown intervals", keywords: ["order", "unequal", "not equal", "distance"] },
        ],
      },
      {
        prompt: "Choose between Pearson's r, Spearman's ρ and Kendall's τ, and justify your choice.",
        skill: "Choosing an approach",
        modelAnswer: "Kendall's τ. Both variables are ordinal, so Pearson (which needs continuous interval or ratio data) is inappropriate. Of the two rank-based methods, Kendall's τ is preferred for small samples (n = 15) and data with many tied ranks; it is the more conservative and robust choice. Spearman's ρ would be an acceptable alternative.",
        keyPoints: [
          { text: "Chooses Kendall's τ", keywords: ["kendall"] },
          { text: "Pearson inappropriate for ordinal data", keywords: ["pearson"] },
          { text: "Small sample and many ties favor Kendall", keywords: ["small", "tie", "15"] },
        ],
      },
      {
        prompt: "Explain the difference between parametric and non-parametric tests, and the trade-off involved.",
        skill: "Assumptions",
        modelAnswer: "Parametric tests (Pearson, t-test, ANOVA) assume interval or ratio data from a known distribution, usually normal. Non-parametric tests (Spearman, Kendall, chi-square) do not need those distributional assumptions and suit ordinal data, small samples or outliers. The trade-off: when their assumptions are met, parametric tests are more powerful; non-parametric tests are more robust when they are not.",
        keyPoints: [
          { text: "Parametric: assumes normality / interval-ratio data", keywords: ["normal", "interval", "distribution"] },
          { text: "Non-parametric: fewer assumptions; ordinal, small n, outliers", keywords: ["ordinal", "fewer assumption", "no assumption", "robust", "outlier"] },
          { text: "Trade-off: parametric more powerful when assumptions hold", keywords: ["power"] },
        ],
      },
      {
        prompt: "Interpret τ = .41, p = .04 and state one limitation of this finding.",
        skill: "Conclusions",
        modelAnswer: "There is a moderate, positive association: more senior employees tend to rank higher in satisfaction. It is statistically significant (p = .04 < .05). The limitation is that with only 15 people from one team the result may not generalize to the organization, and it shows association, not that seniority causes satisfaction (pay or autonomy could explain it).",
        keyPoints: [
          { text: "Moderate positive association", keywords: ["moderate", "positive"] },
          { text: "Significant at .05", keywords: ["significant"] },
          { text: "Limitation: small sample / one team / not causal", keywords: ["generaliz", "small", "one team", "caus"] },
        ],
      },
    ],
  },

  // ───────────────────────── Interpreting results & drawing conclusions ─────────────────────────
  {
    id: "D1", cluster: "interpret",
    title: "Social-media ad spend and store sales",
    context: "A chain correlated monthly social-media ad spend with monthly sales across all 2,000 stores. A pilot with 12 stores ran earlier.",
    exhibit:
`All stores:   Pearson r = .09,  p < .001,  n = 2,000
Pilot:        Pearson r = .52,  p = .08,   n = 12`,
    parts: [
      {
        prompt: "Interpret each result in terms of both statistical significance and strength.",
        skill: "Significance vs strength",
        modelAnswer: "All stores: the result is statistically significant (p < .001) but the relationship is very weak (r = .09; r² ≈ 0.8% of variation shared). It is real but of little practical importance. Pilot: the relationship is moderate (r = .52) but not significant (p = .08 > .05). With only 12 stores the estimate is too uncertain to rule out chance.",
        keyPoints: [
          { text: "Large study: significant but very weak", keywords: ["weak"] },
          { text: "Pilot: moderate but not significant", keywords: ["not significant", "moderate"] },
          { text: "Significance ≠ practical importance / strength", keywords: ["practical", "importance", "strength", "r²", "r2", "meaningful"] },
        ],
      },
      {
        prompt: "Explain why a very weak correlation can be highly significant.",
        skill: "Significance vs strength",
        modelAnswer: "The p-value shows how strong the evidence is against H₀ (no correlation), not how strong the relationship is. With a very large sample (n = 2,000), even a tiny correlation is estimated precisely enough to be distinguishable from zero. Strength is judged by the coefficient (r), significance by p.",
        keyPoints: [
          { text: "p-value = evidence against H₀, not effect size", keywords: ["evidence", "null", "h0", "h₀", "not the strength", "not strength"] },
          { text: "Large sample size makes small effects significant", keywords: ["sample size", "large sample", "2,000", "2000", "large n"] },
          { text: "Strength judged by r (coefficient)", keywords: ["coefficient", "the r ", "value of r", "effect size", "size of r"] },
        ],
      },
      {
        prompt: "The CMO says: \"This proves ads drive sales, so we should double the budget.\" Respond with two specific reasons.",
        skill: "Association vs causation",
        modelAnswer: "Correlation does not prove causation. (1) Confounding: larger or busier stores may get bigger ad budgets and also sell more, so store size could explain both. (2) Reverse causation: stores with high sales may be given more ad money. The relationship is also very weak (r = .09), so even a causal effect would be small. Recommend a controlled experiment (randomly increase spend in some stores) before doubling the budget.",
        keyPoints: [
          { text: "Correlation ≠ causation", keywords: ["caus"] },
          { text: "Confounder (store size, location, season)", keywords: ["confound", "store size", "location", "season", "third variable"] },
          { text: "Reverse causation", keywords: ["reverse", "other way", "opposite direction"] },
          { text: "Recommend an experiment / A-B test", keywords: ["experiment", "random", "a/b", "test group", "control group", "pilot"] },
        ],
      },
      {
        prompt: "Write a two-sentence conclusion for executives.",
        skill: "Conclusions",
        modelAnswer: "Across 2,000 stores, ad spend shows a statistically significant but very weak positive association with sales (r = .09, p < .001), so it explains under 1% of the differences in sales. Because this is correlational, we recommend a randomized test in a subset of stores before changing the budget.",
        keyPoints: [
          { text: "Reports direction, strength and significance with numbers", keywords: ["r = .09", "r=.09", ".09", "p < .001"] },
          { text: "Uses association wording, not causal wording", keywords: ["associat", "correlat", "relationship"] },
          { text: "Gives an actionable next step", keywords: ["recommend", "test", "experiment", "next step"] },
        ],
      },
    ],
  },
  {
    id: "D2", cluster: "interpret",
    title: "Nurses' sleep and sick days",
    context: "A hospital surveyed 80 nurses about average nightly sleep and sick days taken last year. The analyst notes that night-shift nurses sleep less and also report more sick days.",
    exhibit:
`Spearman ρ = −.34, p (2-tailed) = .002, n = 80
Scatterplot: decreasing, not a straight line (curves at high sleep values)`,
    parts: [
      {
        prompt: "Interpret the direction, strength and significance of the result.",
        skill: "Significance vs strength",
        modelAnswer: "The result is negative: nurses who sleep more tend to take fewer sick days. ρ = −.34 is a weak-to-moderate monotonic relationship. It is statistically significant (p = .002 < .05), so it is unlikely to be due to chance.",
        keyPoints: [
          { text: "Negative direction explained", keywords: ["negative", "inverse", "fewer"] },
          { text: "Weak-to-moderate strength", keywords: ["weak", "moderate"] },
          { text: "Statistically significant", keywords: ["significant"] },
        ],
      },
      {
        prompt: "Why was Spearman a sensible choice here rather than Pearson?",
        skill: "Assumptions",
        modelAnswer: "The scatterplot is decreasing but not linear (it curves), so Pearson's linearity assumption fails. Sick days are also typically skewed counts. Spearman measures monotonic relationships, needs no normality and is robust to outliers.",
        keyPoints: [
          { text: "Relationship not linear (Pearson's linearity fails)", keywords: ["linear"] },
          { text: "Spearman measures monotonic relationships", keywords: ["monoton"] },
          { text: "No normality needed / robust to skew or outliers", keywords: ["normal", "skew", "outlier", "robust"] },
        ],
      },
      {
        prompt: "Explain how shift type could create this association. What kind of variable is it?",
        skill: "Association vs causation",
        modelAnswer: "Shift type is a confounding (extraneous) variable. Night shifts affect both outcomes: they reduce sleep and may also raise illness or sick-day use directly, so sleep and sick days move together even if sleep itself has no effect. The analysis should control for shift type, for example by comparing nurses within the same shift.",
        keyPoints: [
          { text: "Identifies shift type as a confounder (extraneous variable)", keywords: ["confound", "extraneous", "third variable", "lurking"] },
          { text: "Explains it affects both sleep and sick days", keywords: ["both", "move together", "reduce sleep", "affects sleep"] },
          { text: "Control for it (compare within shift / stratify)", keywords: ["control", "within", "stratif", "separate", "same shift"] },
        ],
      },
      {
        prompt: "What study design would give stronger evidence that sleep affects sick days? Write the conclusion you can make now.",
        skill: "Conclusions",
        modelAnswer: "Stronger evidence would come from a randomized experiment, such as a sleep-improvement program assigned at random, or panel data that follows the same nurses over time while controlling for shift. The conclusion possible now: \"Among these 80 nurses, more sleep is associated with fewer sick days (ρ = −.34, p = .002); because the study is cross-sectional and shift type is a likely confounder, it does not show that sleep causes fewer sick days.\"",
        keyPoints: [
          { text: "Experiment / randomized intervention or panel design", keywords: ["experiment", "random", "panel", "longitudinal", "over time"] },
          { text: "Conclusion uses 'associated with', with ρ and p", keywords: ["associated", "association"] },
          { text: "States the limitation (cross-sectional, confounder, not causal)", keywords: ["cross-sectional", "cross sectional", "confound", "not caus", "does not show", "doesn't show"] },
        ],
      },
    ],
  },
  {
    id: "D3", cluster: "interpret",
    title: "Training hours and performance scores",
    context: "HR correlated training hours with annual performance scores for 170 employees who chose whether to attend optional training. After seeing the two-tailed result, the analyst switched to a one-tailed test and reported it as significant.",
    exhibit:
`Pearson r = .14, n = 170
p (2-tailed) = .068
p (1-tailed) = .034`,
    parts: [
      {
        prompt: "Interpret the result using the two-tailed test.",
        skill: "Significance vs strength",
        modelAnswer: "The two-tailed p of .068 is above .05, so the correlation is not statistically significant: we cannot reject H₀ of no correlation. The coefficient is also weak (r = .14). There is no convincing evidence of a relationship in this data.",
        keyPoints: [
          { text: "Not significant at .05 (two-tailed)", keywords: ["not significant", "not statistically", "fail to reject", "> .05", "above .05"] },
          { text: "Weak relationship (r = .14)", keywords: ["weak"] },
        ],
      },
      {
        prompt: "Evaluate the analyst's switch to a one-tailed test.",
        skill: "Conclusions",
        modelAnswer: "It is not acceptable. A one-tailed test is valid only if the direction was predicted before data collection. Choosing it after seeing the results is p-hacking: it inflates the Type I (false-positive) error rate and damages credibility. The analyst should report the two-tailed result, or state openly that the directional hypothesis was not pre-specified.",
        keyPoints: [
          { text: "One-tailed only if direction pre-specified before data", keywords: ["before", "pre-specif", "prespecif", "in advance", "a priori"] },
          { text: "Switching after seeing data = p-hacking / unethical", keywords: ["p-hack", "p hack", "unethical", "manipulat"] },
          { text: "Inflates Type I error; report two-tailed", keywords: ["type i", "false positive", "two-tailed", "two tailed"] },
        ],
      },
      {
        prompt: "Employees chose whether to attend training. Why does this matter for interpreting the relationship?",
        skill: "Association vs causation",
        modelAnswer: "This is self-selection. More motivated or ambitious employees may attend more training and also perform better, so motivation is a confounder. Any association could reflect who chose to train rather than an effect of training, so causation cannot be inferred.",
        keyPoints: [
          { text: "Self-selection / selection bias", keywords: ["self-select", "selection", "chose", "choose"] },
          { text: "Motivation as a confounder", keywords: ["motivat", "confound", "ambiti"] },
          { text: "Causation cannot be inferred", keywords: ["caus"] },
        ],
      },
      {
        prompt: "What should HR conclude and do next?",
        skill: "Conclusions",
        modelAnswer: "HR should conclude that this data shows no statistically significant relationship between training hours and performance (r = .14, p = .068, two-tailed), and that even a real effect appears small. Next step: run an evaluation that controls for selection, for example randomly offering the training to some teams first, with a directional hypothesis registered in advance and enough employees for adequate power.",
        keyPoints: [
          { text: "Conclusion: no significant relationship, weak", keywords: ["no significant", "no statistically significant", "not significant", "no evidence", "weak", "small"] },
          { text: "Next step: randomized / controlled evaluation", keywords: ["random", "control", "experiment"] },
          { text: "Pre-register hypothesis / adequate sample", keywords: ["pre-regist", "in advance", "before", "sample size", "power", "larger"] },
        ],
      },
    ],
  },
];

if (typeof module !== "undefined") module.exports = { SCENARIOS, CLUSTERS, SKILLS };
