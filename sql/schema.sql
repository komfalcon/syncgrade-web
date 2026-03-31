CREATE TABLE IF NOT EXISTS students (
  uuid TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  university TEXT NOT NULL,
  last_sync DATETIME,
  academic_data JSON
);

CREATE TABLE IF NOT EXISTS feedback_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  university TEXT,
  subject TEXT,
  message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
