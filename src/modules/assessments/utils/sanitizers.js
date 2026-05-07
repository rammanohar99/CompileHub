function sanitizeQuestion(question, { includeAnswerKey = false, includeInternal = false } = {}) {
  if (!question) return question;

  const out = { ...question };

  if (!includeAnswerKey) {
    delete out.correctAnswer;
    delete out.explanation;
  }

  if (!includeInternal) {
    delete out.metadata;
    delete out.reviewStatus;
    delete out.createdBy;
    delete out.deletedAt;
  }

  return out;
}

function sanitizeQuestionList(questions, opts) {
  return questions.map((q) => sanitizeQuestion(q, opts));
}

module.exports = { sanitizeQuestion, sanitizeQuestionList };
