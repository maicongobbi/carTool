-- Migration: Add theme preference to User
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "theme" TEXT NOT NULL DEFAULT 'light';
