-- Feature #8: Custom access expiration for courses/webinars
-- Adds an optional access policy set by the creator at publish time.
--   access_duration_days: access lasts N days from each user's enrollment (relative)
--   access_expires_at:    access ends on this fixed date for everyone (absolute)
-- Both nullable; NULL/NULL means permanent access (existing behavior).

ALTER TABLE "courses" ADD COLUMN "access_duration_days" INTEGER;
ALTER TABLE "courses" ADD COLUMN "access_expires_at" TIMESTAMP(3);

ALTER TABLE "webinars" ADD COLUMN "access_duration_days" INTEGER;
ALTER TABLE "webinars" ADD COLUMN "access_expires_at" TIMESTAMP(3);
