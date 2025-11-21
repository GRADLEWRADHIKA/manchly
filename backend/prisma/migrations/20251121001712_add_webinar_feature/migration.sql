-- CreateEnum
CREATE TYPE "WebinarStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "webinars" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "thumbnail_url" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "WebinarStatus" NOT NULL DEFAULT 'DRAFT',
    "creator_id" TEXT NOT NULL,
    "category" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER,
    "timezone" TEXT DEFAULT 'UTC',
    "zoom_meeting_id" TEXT,
    "zoom_join_url" TEXT,
    "zoom_start_url" TEXT,
    "zoom_password" TEXT,
    "max_participants" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),

    CONSTRAINT "webinars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webinar_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "webinar_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "payment_method" "PaymentMethod" NOT NULL DEFAULT 'RAZORPAY',
    "razorpay_order_id" TEXT,
    "razorpay_payment_id" TEXT,
    "razorpay_signature" TEXT,
    "payment_details" JSONB,
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "webinar_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webinar_enrollments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "webinar_id" TEXT NOT NULL,
    "transaction_id" TEXT,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "attended_at" TIMESTAMP(3),

    CONSTRAINT "webinar_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "webinars_zoom_meeting_id_key" ON "webinars"("zoom_meeting_id");

-- CreateIndex
CREATE INDEX "webinars_creator_id_idx" ON "webinars"("creator_id");

-- CreateIndex
CREATE INDEX "webinars_status_idx" ON "webinars"("status");

-- CreateIndex
CREATE INDEX "webinars_scheduled_at_idx" ON "webinars"("scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "webinar_transactions_razorpay_order_id_key" ON "webinar_transactions"("razorpay_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "webinar_transactions_razorpay_payment_id_key" ON "webinar_transactions"("razorpay_payment_id");

-- CreateIndex
CREATE INDEX "webinar_transactions_user_id_idx" ON "webinar_transactions"("user_id");

-- CreateIndex
CREATE INDEX "webinar_transactions_webinar_id_idx" ON "webinar_transactions"("webinar_id");

-- CreateIndex
CREATE INDEX "webinar_transactions_status_idx" ON "webinar_transactions"("status");

-- CreateIndex
CREATE INDEX "webinar_transactions_razorpay_order_id_idx" ON "webinar_transactions"("razorpay_order_id");

-- CreateIndex
CREATE INDEX "webinar_transactions_razorpay_payment_id_idx" ON "webinar_transactions"("razorpay_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "webinar_enrollments_transaction_id_key" ON "webinar_enrollments"("transaction_id");

-- CreateIndex
CREATE INDEX "webinar_enrollments_user_id_idx" ON "webinar_enrollments"("user_id");

-- CreateIndex
CREATE INDEX "webinar_enrollments_webinar_id_idx" ON "webinar_enrollments"("webinar_id");

-- CreateIndex
CREATE UNIQUE INDEX "webinar_enrollments_user_id_webinar_id_key" ON "webinar_enrollments"("user_id", "webinar_id");

-- AddForeignKey
ALTER TABLE "webinars" ADD CONSTRAINT "webinars_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webinar_transactions" ADD CONSTRAINT "webinar_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webinar_transactions" ADD CONSTRAINT "webinar_transactions_webinar_id_fkey" FOREIGN KEY ("webinar_id") REFERENCES "webinars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webinar_enrollments" ADD CONSTRAINT "webinar_enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webinar_enrollments" ADD CONSTRAINT "webinar_enrollments_webinar_id_fkey" FOREIGN KEY ("webinar_id") REFERENCES "webinars"("id") ON DELETE CASCADE ON UPDATE CASCADE;
