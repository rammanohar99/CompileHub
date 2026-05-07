const SEED_TAG = "__seed_assessment_v1";

const DIFF_PATTERN = ["EASY", "MEDIUM", "HARD", "MEDIUM", "EASY", "HARD", "MEDIUM", "EASY", "HARD", "MEDIUM", "EASY", "HARD", "MEDIUM", "EASY", "MEDIUM"];
const TYPE_PATTERN = ["MCQ", "MULTI_SELECT", "TRUE_FALSE", "SCENARIO_BASED", "MCQ", "MULTI_SELECT", "TRUE_FALSE", "SCENARIO_BASED", "MCQ", "MULTI_SELECT", "TRUE_FALSE", "SCENARIO_BASED", "MCQ", "MULTI_SELECT", "TRUE_FALSE"];
const QUESTIONS_PER_CATEGORY = Math.max(1, parseInt(process.env.ASSESSMENT_QUESTIONS_PER_CATEGORY || "100", 10));

const MCQ_PROMPTS = [
  "In a backend interview, what is the best practice for",
  "Which decision is most production-safe for",
  "What should you prioritize first when handling",
  "Which approach best reflects senior ownership of",
];

const MULTI_SELECT_PROMPTS = [
  "Select all actions that improve production readiness for",
  "Select all options that reduce outage risk for",
  "Which choices strengthen maintainability and reliability for",
  "Pick all practices that improve observability and rollback safety for",
];

const TF_PROMPTS = [
  "True or False: for",
  "True or False: in",
  "True or False: when working on",
  "True or False: for production changes in",
];

const SCENARIO_PROMPTS = [
  "Scenario: your team is introducing a major",
  "Scenario: you are leading a risky rollout in",
  "Scenario: a high-impact change is planned for",
  "Scenario: your team must ship a critical update for",
];

const SCENARIO_SUFFIX = [
  "Which approach is strongest?",
  "What is the safest strategy?",
  "Which response best balances speed and reliability?",
  "Which decision is most defensible in a postmortem?",
];

const MCQ_GOOD = [
  "Prioritize reproducible workflows and explicit {topic} conventions",
  "Define rollback criteria and release guardrails for {topic}",
  "Instrument key signals before rollout for {topic}",
  "Capture assumptions and tradeoffs for {topic} in runbooks",
];

const MCQ_BAD = [
  "Rely on tribal knowledge and ad-hoc scripts",
  "Skip validation to optimize short-term speed",
  "Defer documentation until outages occur",
  "Release broadly without metrics or rollback criteria",
];

function createQuestion({ category, topicSlug, idx }) {
  const type = TYPE_PATTERN[idx % TYPE_PATTERN.length];
  const difficulty = DIFF_PATTERN[idx % DIFF_PATTERN.length];
  const topicLabel = topicSlug.replace(/-/g, " ");
  const stem = `${category.name}: ${topicLabel}`;
  const variant = idx % 4;
  const replaceTopic = (s) => s.replaceAll("{topic}", topicLabel);

  if (type === "MCQ") {
    const options = [
      replaceTopic(MCQ_GOOD[idx % MCQ_GOOD.length]),
      MCQ_BAD[idx % MCQ_BAD.length],
      MCQ_BAD[(idx + 1) % MCQ_BAD.length],
      MCQ_BAD[(idx + 2) % MCQ_BAD.length],
    ];
    return {
      questionType: type,
      difficulty,
      question: `${MCQ_PROMPTS[variant]} ${stem}?`,
      options,
      correctAnswer: options[0],
      explanation: `Interviewers expect maintainable, explicit practices for ${topicLabel} that reduce operational risk.`,
    };
  }

  if (type === "MULTI_SELECT") {
    const options = [
      `Define measurable success criteria for ${topicLabel}`,
      `Automate regression checks around ${topicLabel}`,
      `Ignore rollback strategy for ${topicLabel}`,
      `Document tradeoffs and failure modes for ${topicLabel}`,
    ];
    return {
      questionType: type,
      difficulty,
      question: `${MULTI_SELECT_PROMPTS[variant]} ${stem}.`,
      options,
      correctAnswer: [options[0], options[1], options[3]],
      explanation: `Production-ready teams measure impact, automate verification, and document tradeoffs before change rollout.`,
    };
  }

  if (type === "TRUE_FALSE") {
    return {
      questionType: type,
      difficulty,
      question: `${TF_PROMPTS[variant]} ${stem}, skipping observability instrumentation is acceptable if local tests pass.`,
      options: ["true", "false"],
      correctAnswer: false,
      explanation: `Local correctness is insufficient; production observability is required for reliability and incident response.`,
    };
  }

  const options = [
    `Use a staged rollout with telemetry and rollback criteria`,
    `Release directly to all users without guardrails`,
    `Disable alerts to avoid false positives during rollout`,
    `Postpone post-release verification until next sprint`,
  ];
  return {
    questionType: "SCENARIO_BASED",
    difficulty,
    question: `${SCENARIO_PROMPTS[variant]} ${topicLabel} change in ${category.name}. ${SCENARIO_SUFFIX[variant]}`,
    options,
    correctAnswer: options[0],
    explanation: `Staged rollout plus telemetry and rollback thresholds is the safest default in production systems.`,
    metadata: {
      evaluationRubric: {
        mustHave: ["staged rollout", "telemetry", "rollback"],
        niceToHave: ["threshold", "canary", "monitoring"],
        threshold: 0.7,
      },
    },
  };
}

function buildCategoryQuestions(category, topicsBySlug) {
  const topicSlugs = category.topics;
  const questions = [];
  for (let i = 0; i < QUESTIONS_PER_CATEGORY; i++) {
    const topicSlug = topicSlugs[i % topicSlugs.length];
    const base = createQuestion({ category, topicSlug, idx: i });
    questions.push({
      ...base,
      categoryId: category.id,
      topicId: topicsBySlug.get(topicSlug),
      tags: [category.slug, topicSlug, "interview-prep", SEED_TAG],
      isActive: true,
      estimatedTimeSeconds: base.questionType === "SCENARIO_BASED" ? 150 : base.questionType === "MULTI_SELECT" ? 120 : 90,
      metadata: {
        ...(base.metadata || {}),
        seedTag: SEED_TAG,
        seedVersion: 3,
        topicSlug,
        categorySlug: category.slug,
        variantIndex: i,
      },
      reviewStatus: "APPROVED",
    });
  }
  return questions;
}

module.exports = { SEED_TAG, buildCategoryQuestions, QUESTIONS_PER_CATEGORY };
