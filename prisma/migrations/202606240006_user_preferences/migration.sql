ALTER TABLE "User"
ADD COLUMN "localePreference" TEXT NOT NULL DEFAULT 'ar',
ADD COLUMN "themePreference" TEXT NOT NULL DEFAULT 'system';
