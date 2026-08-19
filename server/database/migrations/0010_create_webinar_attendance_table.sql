CREATE TABLE IF NOT EXISTS webinar_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  registration_id INT NOT NULL,
  attendance_status ENUM('REGISTERED','ATTENDED','ABSENT') NOT NULL DEFAULT 'REGISTERED',
  marked_by INT NULL,
  marked_at DATETIME NULL,
  join_time DATETIME NULL,
  leave_time DATETIME NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_webinar_attendance_registration (registration_id),
  CONSTRAINT fk_webinar_attendance_registration FOREIGN KEY (registration_id) REFERENCES webinar_registrations(id) ON DELETE CASCADE,
  CONSTRAINT fk_webinar_attendance_marked_by FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
