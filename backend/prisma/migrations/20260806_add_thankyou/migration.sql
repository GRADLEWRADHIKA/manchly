-- Feature #5: Thank-you page + WhatsApp community link
-- Optional per-product community link and thank-you message, set by the creator
-- and shown on the post-purchase thank-you screen.

ALTER TABLE "courses" ADD COLUMN "whatsapp_community_url" TEXT;
ALTER TABLE "courses" ADD COLUMN "thankyou_message" TEXT;

ALTER TABLE "webinars" ADD COLUMN "whatsapp_community_url" TEXT;
ALTER TABLE "webinars" ADD COLUMN "thankyou_message" TEXT;
