-- Google sign-in support. Users who authenticate with Google have no local
-- password, so password_hash becomes nullable. google_sub is Google's stable
-- unique subject id for the account (used to match returning users), kept
-- UNIQUE so one Google account maps to exactly one portal user.
ALTER TABLE users
  MODIFY COLUMN password_hash VARCHAR(255) NULL,
  ADD COLUMN auth_provider ENUM('LOCAL','GOOGLE') NOT NULL DEFAULT 'LOCAL' AFTER role,
  ADD COLUMN google_sub VARCHAR(64) NULL,
  ADD UNIQUE KEY uq_users_google_sub (google_sub);
