-- Performance indexes for common filters/sorts.
-- Safe to run multiple times.

CREATE INDEX IF NOT EXISTS idx_submission_user_created_at
  ON "Submission" ("userId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_submission_user_status_problem
  ON "Submission" ("userId", "status", "problemId");

CREATE INDEX IF NOT EXISTS idx_submission_problem_created_at
  ON "Submission" ("problemId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_problem_created_at
  ON "Problem" ("createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_sd_comment_question_created_at
  ON "SdComment" ("questionId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_system_design_submission_user_created_at
  ON "SystemDesignSubmission" ("userId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_project_prep_session_user_created_at
  ON "ProjectPrepSession" ("userId", "createdAt" DESC);
