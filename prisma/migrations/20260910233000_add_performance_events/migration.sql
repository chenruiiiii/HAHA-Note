-- CreateTable
CREATE TABLE "performance_events" (
    "id" TEXT NOT NULL,
    "event" VARCHAR(64) NOT NULL,
    "route" VARCHAR(160) NOT NULL DEFAULT 'unknown',
    "metric_name" VARCHAR(80),
    "metric_id" VARCHAR(120),
    "value" DOUBLE PRECISION,
    "duration_ms" DOUBLE PRECISION,
    "rating" VARCHAR(30),
    "success" BOOLEAN,
    "error_type" VARCHAR(80),
    "retry_count" INTEGER,
    "first_token_ms" DOUBLE PRECISION,
    "total_ms" DOUBLE PRECISION,
    "status_code" INTEGER,
    "method" VARCHAR(12),
    "release" VARCHAR(80) NOT NULL DEFAULT 'local',
    "device_type" VARCHAR(16) NOT NULL DEFAULT 'unknown',
    "network_type" VARCHAR(16) NOT NULL DEFAULT 'unknown',
    "timestamp" TIMESTAMP(3) NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "performance_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "performance_events_metric_id_key" ON "performance_events"("metric_id");

-- CreateIndex
CREATE INDEX "performance_events_received_at_idx" ON "performance_events"("received_at");

-- CreateIndex
CREATE INDEX "performance_events_event_received_at_idx" ON "performance_events"("event", "received_at");
