CREATE DATABASE IF NOT EXISTS university_api_db;
USE university_api_db;

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  roll_number VARCHAR(30) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  department VARCHAR(100) NOT NULL,
  semester TINYINT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_number VARCHAR(30) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  department VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS academic_marks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  subject_code VARCHAR(20) NOT NULL,
  subject_name VARCHAR(120) NOT NULL,
  semester TINYINT UNSIGNED NOT NULL,
  marks_obtained DECIMAL(5,2) NOT NULL,
  total_marks DECIMAL(5,2) NOT NULL DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_marks_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS api_keys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_hash CHAR(64) NOT NULL UNIQUE,
  key_prefix VARCHAR(18) NOT NULL,
  role ENUM('student','teacher') NOT NULL,
  student_id INT NULL,
  teacher_id INT NULL,
  request_limit INT UNSIGNED NOT NULL DEFAULT 20,
  usage_count INT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('active','revoked') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT fk_key_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_key_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  CONSTRAINT chk_key_owner CHECK (
    (role = 'student' AND student_id IS NOT NULL AND teacher_id IS NULL) OR
    (role = 'teacher' AND teacher_id IS NOT NULL AND student_id IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS api_usage (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  api_key_id INT NULL,
  endpoint VARCHAR(255) NOT NULL,
  http_method VARCHAR(10) NOT NULL,
  response_status SMALLINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_usage_key FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE SET NULL,
  INDEX idx_usage_key_created (api_key_id, created_at)
);

INSERT IGNORE INTO students (id, roll_number, full_name, email, department, semester) VALUES
(1, 'AU-23-CS-001', 'Ayesha Khan', 'ayesha.khan@university.edu', 'Computer Science', 5),
(2, 'AU-23-CS-002', 'Hamza Ali', 'hamza.ali@university.edu', 'Computer Science', 5),
(3, 'AU-23-SE-003', 'Maham Noor', 'maham.noor@university.edu', 'Software Engineering', 5),
(4, 'AU-24-CS-004', 'Bilal Ahmed', 'bilal.ahmed@university.edu', 'Computer Science', 3);

INSERT IGNORE INTO teachers (id, employee_number, full_name, email, department) VALUES
(1, 'EMP-CS-101', 'Dr. Sara Malik', 'sara.malik@university.edu', 'Computer Science'),
(2, 'EMP-SE-102', 'Mr. Usman Raza', 'usman.raza@university.edu', 'Software Engineering');

INSERT INTO academic_marks (student_id, subject_code, subject_name, semester, marks_obtained, total_marks)
SELECT 1, 'CS301', 'Full Stack Development', 5, 88, 100 WHERE NOT EXISTS (SELECT 1 FROM academic_marks WHERE student_id=1 AND subject_code='CS301' AND semester=5);
INSERT INTO academic_marks (student_id, subject_code, subject_name, semester, marks_obtained, total_marks)
SELECT 1, 'CS302', 'Operating Systems', 5, 91, 100 WHERE NOT EXISTS (SELECT 1 FROM academic_marks WHERE student_id=1 AND subject_code='CS302' AND semester=5);
INSERT INTO academic_marks (student_id, subject_code, subject_name, semester, marks_obtained, total_marks)
SELECT 1, 'CS303', 'Artificial Intelligence', 5, 84, 100 WHERE NOT EXISTS (SELECT 1 FROM academic_marks WHERE student_id=1 AND subject_code='CS303' AND semester=5);
INSERT INTO academic_marks (student_id, subject_code, subject_name, semester, marks_obtained, total_marks)
SELECT 2, 'CS301', 'Full Stack Development', 5, 79, 100 WHERE NOT EXISTS (SELECT 1 FROM academic_marks WHERE student_id=2 AND subject_code='CS301' AND semester=5);
INSERT INTO academic_marks (student_id, subject_code, subject_name, semester, marks_obtained, total_marks)
SELECT 2, 'CS302', 'Operating Systems', 5, 86, 100 WHERE NOT EXISTS (SELECT 1 FROM academic_marks WHERE student_id=2 AND subject_code='CS302' AND semester=5);
INSERT INTO academic_marks (student_id, subject_code, subject_name, semester, marks_obtained, total_marks)
SELECT 3, 'CS301', 'Full Stack Development', 5, 93, 100 WHERE NOT EXISTS (SELECT 1 FROM academic_marks WHERE student_id=3 AND subject_code='CS301' AND semester=5);
INSERT INTO academic_marks (student_id, subject_code, subject_name, semester, marks_obtained, total_marks)
SELECT 3, 'CS303', 'Artificial Intelligence', 5, 89, 100 WHERE NOT EXISTS (SELECT 1 FROM academic_marks WHERE student_id=3 AND subject_code='CS303' AND semester=5);
INSERT INTO academic_marks (student_id, subject_code, subject_name, semester, marks_obtained, total_marks)
SELECT 4, 'CS201', 'Database Systems', 3, 81, 100 WHERE NOT EXISTS (SELECT 1 FROM academic_marks WHERE student_id=4 AND subject_code='CS201' AND semester=3);
