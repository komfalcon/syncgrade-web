CREATE TABLE students (
  uuid TEXT PRIMARY KEY,
  name TEXT,
  department TEXT,
  university TEXT,
  last_sync DATETIME,
  academic_data JSON
);
