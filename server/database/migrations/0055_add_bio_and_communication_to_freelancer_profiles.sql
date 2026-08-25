ALTER TABLE freelancer_profiles
  ADD COLUMN bio TEXT NULL AFTER previous_agency_experience,
  ADD COLUMN preferred_communication VARCHAR(100) NULL AFTER bio;
