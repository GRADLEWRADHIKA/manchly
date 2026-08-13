-- Feature #8 extension: unit for the relative access duration.
-- access_duration_unit: 'day' | 'month' | 'year' — the unit for access_duration_days
--   (which now holds the numeric amount). NULL is treated as 'day' for backward
--   compatibility with existing rows that stored a raw day count.

ALTER TABLE "courses" ADD COLUMN "access_duration_unit" TEXT;
ALTER TABLE "webinars" ADD COLUMN "access_duration_unit" TEXT;
