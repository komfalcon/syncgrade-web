CREATE TABLE students (
  uuid TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  university TEXT NOT NULL,
  last_sync DATETIME,
  academic_data JSON
);
