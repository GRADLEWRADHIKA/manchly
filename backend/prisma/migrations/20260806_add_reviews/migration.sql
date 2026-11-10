-- Feature #9: Persisted feedback for sessions + webinars
-- Stores the written review text (previously discarded) and enables listing
-- reviews per expert / per webinar.

CREATE TABLE "session_reviews" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "expert_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "session_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "session_reviews_session_id_key" ON "session_reviews"("session_id");
CREATE INDEX "session_reviews_expert_id_idx" ON "session_reviews"("expert_id");
CREATE INDEX "session_reviews_reviewer_id_idx" ON "session_reviews"("reviewer_id");

CREATE TABLE "webinar_reviews" (
    "id" TEXT NOT NULL,
    "webinar_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "webinar_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "webinar_reviews_webinar_id_reviewer_id_key" ON "webinar_reviews"("webinar_id", "reviewer_id");
CREATE INDEX "webinar_reviews_webinar_id_idx" ON "webinar_reviews"("webinar_id");
CREATE INDEX "webinar_reviews_creator_id_idx" ON "webinar_reviews"("creator_id");
