-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "RepositoryRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PRIVATE', 'UNLISTED', 'PUBLIC');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('SYSTEM', 'USER', 'ASSISTANT', 'TOOL');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('PENDING', 'STREAMING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AssetKind" AS ENUM ('IMAGE', 'AUDIO', 'VIDEO', 'FILE');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('PENDING', 'READY', 'REJECTED', 'DELETED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('DOCUMENT_VIEWED', 'DOCUMENT_UPDATED', 'DOCUMENT_CREATED', 'DOCUMENT_SHARED', 'AI_MESSAGE_SENT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(254),
    "password_hash" TEXT NOT NULL,
    "nickname" VARCHAR(80) NOT NULL,
    "avatar_url" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "password_reset_required" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "user_agent" TEXT,
    "ip_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repositories" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "type" VARCHAR(30) NOT NULL DEFAULT 'book',
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "cover_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "repositories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repository_members" (
    "repository_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "RepositoryRole" NOT NULL DEFAULT 'VIEWER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repository_members_pkey" PRIMARY KEY ("repository_id","user_id")
);

-- CreateTable
CREATE TABLE "repository_favorites" (
    "user_id" TEXT NOT NULL,
    "repository_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repository_favorites_pkey" PRIMARY KEY ("user_id","repository_id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "repository_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL DEFAULT '新建文档',
    "content" JSONB NOT NULL,
    "content_html" TEXT,
    "content_text" TEXT NOT NULL DEFAULT '',
    "summary" TEXT NOT NULL DEFAULT '',
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_revisions" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" JSONB NOT NULL,
    "content_html" TEXT,
    "summary" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_favorites" (
    "user_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_favorites_pkey" PRIMARY KEY ("user_id","document_id")
);

-- CreateTable
CREATE TABLE "document_share_links" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_share_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "repository_id" TEXT,
    "document_id" TEXT,
    "title" VARCHAR(200) NOT NULL DEFAULT '新建对话',
    "summary" TEXT NOT NULL DEFAULT '',
    "provider" VARCHAR(40) NOT NULL DEFAULT 'deepseek',
    "model" VARCHAR(100) NOT NULL,
    "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "client_message_id" VARCHAR(120),
    "role" "MessageRole" NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'COMPLETED',
    "content" TEXT NOT NULL DEFAULT '',
    "parts" JSONB NOT NULL,
    "provider" VARCHAR(40),
    "model" VARCHAR(100),
    "error_code" VARCHAR(80),
    "prompt_tokens" INTEGER,
    "completion_tokens" INTEGER,
    "latency_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "kind" "AssetKind" NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'PENDING',
    "storage_key" TEXT,
    "external_url" TEXT,
    "original_name" VARCHAR(255),
    "mime_type" VARCHAR(120) NOT NULL,
    "size_bytes" BIGINT,
    "sha256" VARCHAR(64),
    "width" INTEGER,
    "height" INTEGER,
    "duration_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_assets" (
    "message_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "analysis" TEXT,

    CONSTRAINT "message_assets_pkey" PRIMARY KEY ("message_id","asset_id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "explore_articles" (
    "id" TEXT NOT NULL,
    "legacy_numeric_id" TEXT,
    "source_platform" VARCHAR(40) NOT NULL,
    "source_title" VARCHAR(200) NOT NULL,
    "source_avatar_url" TEXT,
    "author_name" VARCHAR(100) NOT NULL,
    "author_avatar_url" TEXT,
    "title_html" TEXT NOT NULL,
    "description_html" TEXT NOT NULL,
    "content_html" TEXT NOT NULL,
    "quality_level" VARCHAR(30) NOT NULL,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "word_count" INTEGER NOT NULL DEFAULT 0,
    "source_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "explore_articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refresh_token_hash_key" ON "sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_expires_at_idx" ON "sessions"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "repositories_owner_id_updated_at_idx" ON "repositories"("owner_id", "updated_at");

-- CreateIndex
CREATE INDEX "repository_members_user_id_idx" ON "repository_members"("user_id");

-- CreateIndex
CREATE INDEX "repository_favorites_repository_id_idx" ON "repository_favorites"("repository_id");

-- CreateIndex
CREATE INDEX "documents_repository_id_updated_at_idx" ON "documents"("repository_id", "updated_at");

-- CreateIndex
CREATE INDEX "documents_creator_id_updated_at_idx" ON "documents"("creator_id", "updated_at");

-- CreateIndex
CREATE INDEX "document_revisions_created_by_id_created_at_idx" ON "document_revisions"("created_by_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "document_revisions_document_id_version_key" ON "document_revisions"("document_id", "version");

-- CreateIndex
CREATE INDEX "document_favorites_document_id_idx" ON "document_favorites"("document_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_share_links_token_hash_key" ON "document_share_links"("token_hash");

-- CreateIndex
CREATE INDEX "document_share_links_document_id_revoked_at_idx" ON "document_share_links"("document_id", "revoked_at");

-- CreateIndex
CREATE INDEX "conversations_owner_id_updated_at_idx" ON "conversations"("owner_id", "updated_at");

-- CreateIndex
CREATE INDEX "conversations_repository_id_idx" ON "conversations"("repository_id");

-- CreateIndex
CREATE INDEX "conversations_document_id_idx" ON "conversations"("document_id");

-- CreateIndex
CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "messages_conversation_id_client_message_id_key" ON "messages"("conversation_id", "client_message_id");

-- CreateIndex
CREATE UNIQUE INDEX "assets_storage_key_key" ON "assets"("storage_key");

-- CreateIndex
CREATE INDEX "assets_owner_id_created_at_idx" ON "assets"("owner_id", "created_at");

-- CreateIndex
CREATE INDEX "message_assets_asset_id_idx" ON "message_assets"("asset_id");

-- CreateIndex
CREATE INDEX "activities_user_id_type_occurred_at_idx" ON "activities"("user_id", "type", "occurred_at");

-- CreateIndex
CREATE INDEX "activities_document_id_occurred_at_idx" ON "activities"("document_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "explore_articles_legacy_numeric_id_key" ON "explore_articles"("legacy_numeric_id");

-- CreateIndex
CREATE INDEX "explore_articles_quality_level_updated_at_idx" ON "explore_articles"("quality_level", "updated_at");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repository_members" ADD CONSTRAINT "repository_members_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repository_members" ADD CONSTRAINT "repository_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repository_favorites" ADD CONSTRAINT "repository_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repository_favorites" ADD CONSTRAINT "repository_favorites_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_revisions" ADD CONSTRAINT "document_revisions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_revisions" ADD CONSTRAINT "document_revisions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_favorites" ADD CONSTRAINT "document_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_favorites" ADD CONSTRAINT "document_favorites_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_share_links" ADD CONSTRAINT "document_share_links_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_share_links" ADD CONSTRAINT "document_share_links_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_assets" ADD CONSTRAINT "message_assets_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_assets" ADD CONSTRAINT "message_assets_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
