-- Additional indexes for user-centric reads and aggregations.

-- User email already has a unique index from @unique, so no extra index is needed there.

CREATE INDEX IF NOT EXISTS idx_user_topic_progress_user_completed_at
  ON "UserTopicProgress" ("userId", "completedAt" DESC);

CREATE INDEX IF NOT EXISTS idx_user_scenario_attempt_user_created_at
  ON "UserScenarioAttempt" ("userId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_user_template_view_user_viewed_at
  ON "UserTemplateView" ("userId", "viewedAt" DESC);

CREATE INDEX IF NOT EXISTS idx_debug_scenario_published_order_created
  ON "DebugScenario" ("isPublished", "order", "createdAt");

CREATE INDEX IF NOT EXISTS idx_comm_template_published_order
  ON "CommTemplate" ("isPublished", "order");

CREATE INDEX IF NOT EXISTS idx_fundamental_topic_published_order
  ON "FundamentalTopic" ("isPublished", "order");
